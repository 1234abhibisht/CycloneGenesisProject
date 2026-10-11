"""IBTrACS loading and hourly (linear) track interpolation."""
import numpy as np
import pandas as pd

from . import config as C
from .common import occ_class


def parse_iso_time(s):
    """ISO_TIME -> datetime. Handles the normal IBTrACS form (2019-12-31 18:00:00) and rows re-saved
    by Excel as day-first (31-12-2019 18:00), which plain to_datetime can read with day and month swapped."""
    t = s.astype(str).str.strip()
    dmy = t.str.match(r"^\d{1,2}[-/]\d{1,2}[-/]\d{4}")
    out = pd.Series(pd.NaT, index=s.index, dtype="datetime64[ns]")
    if (~dmy).any():
        out[~dmy] = pd.to_datetime(t[~dmy], errors="coerce", format="mixed")
    if dmy.any():
        out[dmy] = pd.to_datetime(t[dmy], errors="coerce", dayfirst=True, format="mixed")
    return out


def load_ibtracs(path=None, years=None):
    """North Indian basin fixes, one row per storm and time, sorted."""
    path = path or C.IBTRACS_CSV
    df = pd.read_csv(path, skiprows=[1], low_memory=False, na_values=[" ", ""], keep_default_na=True)
    df["ISO_TIME"] = parse_iso_time(df["ISO_TIME"])
    df = df[df["BASIN"] == "NI"]
    if "TRACK_TYPE" in df:
        # keep final ("main") and recent provisional tracks ("PROVISIONAL", "US-PROVISIONAL"); drop spur tracks
        tt = df["TRACK_TYPE"].astype(str).str.strip().str.lower()
        df = df[(tt == "main") | (tt.str.contains("provisional") & ~tt.str.contains("spur"))]
    a, b = years or (C.YEARS[0] - 1, max(C.YEARS[1], C.TEST[1]) + 1)
    df = df[df["ISO_TIME"].dt.year.between(a, b)]
    for c in ("LAT", "LON", C.WIND_COL, C.PRES_COL, "USA_WIND"):
        if c in df:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(subset=["LAT", "LON"])

    wind = df[C.WIND_COL].copy()
    df["wind_from_usa"] = False
    if C.FILL_WITH_USA_WIND and "USA_WIND" in df:
        fill = wind.isna() & df["USA_WIND"].notna()
        wind[fill] = (df.loc[fill, "USA_WIND"] * C.USA_TO_WMO).round()
        df["wind_from_usa"] = fill
    df["wind"] = wind
    df["pres"] = df[C.PRES_COL] if C.PRES_COL in df else np.nan
    df["NAME"] = df.get("NAME", pd.Series("", index=df.index)).fillna("").astype(str)
    keep = ["SID", "NAME", "ISO_TIME", "LAT", "LON", "wind", "pres", "wind_from_usa"]
    return (df[keep].drop_duplicates(["SID", "ISO_TIME"])
            .sort_values(["SID", "ISO_TIME"]).reset_index(drop=True))


def hourly_track(fixes):
    """
    Linear hourly interpolation between a storm's first and last fix (no extrapolation).
      wind_lin : linearly interpolated wind (used for intensity targets)
      wind_cf  : last known wind carried forward (used for category labels)
    """
    f = fixes.sort_values("ISO_TIME")
    t0 = f["ISO_TIME"].iloc[0]
    th = (f["ISO_TIME"] - t0).dt.total_seconds().values / 3600.0
    hours = np.arange(0, th[-1] + 1e-9, 1.0)
    lat = np.interp(hours, th, f["LAT"].values)
    lon = np.interp(hours, th, f["LON"].values)

    w = f["wind"].values.astype("float64")
    ok = ~np.isnan(w)
    wind_lin = np.interp(hours, th[ok], w[ok]) if ok.sum() >= 2 else np.full(hours.shape, np.nan)
    if ok.sum() >= 2:   # no extrapolation of wind either
        wind_lin[(hours < th[ok][0]) | (hours > th[ok][-1])] = np.nan
    w_cf = pd.Series(w).ffill().values
    idx = np.searchsorted(th, hours, side="right") - 1
    wind_cf = w_cf[idx]

    p = f["pres"].values.astype("float64")
    okp = ~np.isnan(p)
    pres = np.interp(hours, th[okp], p[okp]) if okp.sum() >= 2 else np.full(hours.shape, np.nan)

    return pd.DataFrame({
        "time": t0 + pd.to_timedelta(hours, unit="h"),
        "lat": lat, "lon": lon,
        "wind_lin": wind_lin, "wind_cf": wind_cf, "pres": pres,
        "cls": occ_class(wind_cf),
    })


def build_tracks(fixes):
    """dict SID -> hourly DataFrame, plus a storm-info table."""
    tracks, info = {}, []
    for sid, g in fixes.groupby("SID"):
        if len(g) < 2:
            continue
        tr = hourly_track(g)
        tracks[sid] = tr
        info.append(dict(SID=sid, NAME=g["NAME"].iloc[0], start=tr["time"].iloc[0], end=tr["time"].iloc[-1],
                         gen_lat=g["LAT"].iloc[0], gen_lon=g["LON"].iloc[0],
                         max_wind=np.nanmax(g["wind"].values) if g["wind"].notna().any() else np.nan))
    return tracks, pd.DataFrame(info)


class TrackPoints:
    """All hourly points of all storms as flat arrays, for fast window queries."""

    def __init__(self, tracks):
        parts = []
        for k, (sid, tr) in enumerate(tracks.items()):
            parts.append(pd.DataFrame({"sid": k, "t": tr["time"].values, "lat": tr["lat"].values,
                                       "lon": tr["lon"].values, "cls": tr["cls"].values,
                                       "wind": tr["wind_cf"].values}))
        allp = pd.concat(parts, ignore_index=True).sort_values("t")
        self.sids = list(tracks.keys())
        self.t = allp["t"].values.astype("datetime64[h]").astype("int64")      # hours since epoch
        self.lat = allp["lat"].values
        self.lon = allp["lon"].values
        self.cls = allp["cls"].values.astype("int8")
        self.wind = allp["wind"].values
        self.sid = allp["sid"].values

    def window(self, t_start_h, t_end_h, include_start=False):
        """Indices of points with t_start < t <= t_end (hours since epoch)."""
        lo = np.searchsorted(self.t, t_start_h, side="left" if include_start else "right")
        hi = np.searchsorted(self.t, t_end_h, side="right")
        return np.arange(lo, hi)

    def at(self, t_h):
        lo = np.searchsorted(self.t, t_h, side="left")
        hi = np.searchsorted(self.t, t_h, side="right")
        return np.arange(lo, hi)
