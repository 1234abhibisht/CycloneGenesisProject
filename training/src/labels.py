"""
Labels and targets.

Occurrence (grid): label = highest class of any storm within 200 km at any hourly
position in (t0, t0 + 24 h]. existing_system / persistence use positions AT t0.

Storm table (per storm, every 3 h): track history features + all targets
(track, intensity, rapid intensification, peak) computed from the hourly tracks.
"""
import numpy as np
import pandas as pd

from . import config as C
from .common import haversine, imd_grade, occ_class, season_of


# ------------------------------------------------------------------ occurrence
def occurrence_labels(tp, times, cell_lat, cell_lon):
    """
    tp: tracks.TrackPoints ; times: datetime64 array of issue times ; cells: 1-D arrays.
    Returns dict of (T, N) arrays: label, persistence, existing, hard.
    """
    T, N = len(times), len(cell_lat)
    label = np.zeros((T, N), "int8")
    persist = np.zeros((T, N), "int8")
    hard = np.zeros((T, N), bool)
    th = np.asarray(times).astype("datetime64[h]").astype("int64")
    W = C.LABEL_WINDOW_H
    for k, t0 in enumerate(th):
        idx = tp.window(t0, t0 + W)
        if idx.size:
            d = haversine(cell_lat[:, None], cell_lon[:, None], tp.lat[idx][None], tp.lon[idx][None])
            label[k] = np.where(d <= C.LABEL_RADIUS_KM, tp.cls[idx][None], 0).max(axis=1)
        idx0 = tp.at(t0)
        if idx0.size:
            d0 = haversine(cell_lat[:, None], cell_lon[:, None], tp.lat[idx0][None], tp.lon[idx0][None])
            persist[k] = np.where(d0 <= C.LABEL_RADIUS_KM, tp.cls[idx0][None], 0).max(axis=1)
        idxh = tp.window(t0 - 24, t0 + 48, include_start=True)
        if idxh.size:
            dh = haversine(cell_lat[:, None], cell_lon[:, None], tp.lat[idxh][None], tp.lon[idxh][None])
            hard[k] = (dh <= C.HARD_NEG_KM).any(axis=1)
    return {"label": label, "persistence": persist, "existing_system": (persist > 0).astype("int8"),
            "hard": hard}


# ------------------------------------------------------------------ storm table
def _at(tr_t, arr, t):
    """Value of an hourly series at time t (NaN if outside the storm's life)."""
    i = np.searchsorted(tr_t, t)
    if i < len(tr_t) and tr_t[i] == t:
        return arr[i]
    return np.nan


def in_domain(lat, lon):
    return (C.DOMAIN["lat_min"] <= lat <= C.DOMAIN["lat_max"]) and (C.DOMAIN["lon_min"] <= lon <= C.DOMAIN["lon_max"])


def storm_rows(tracks, info):
    """One row per storm every 3 h (ERA5 times) with history features and all targets."""
    rows = []
    inf = info.set_index("SID")
    for sid, tr in tracks.items():
        t = tr["time"].values.astype("datetime64[h]")
        lat, lon = tr["lat"].values, tr["lon"].values
        wl, wcf, pr = tr["wind_lin"].values, tr["wind_cf"].values, tr["pres"].values
        gen_lon = inf.loc[sid, "gen_lon"]
        start = t[0]
        for i, t0 in enumerate(t):
            hour = int(t0.astype("int64") % 24)
            if hour % C.TIME_STEP_H:
                continue
            w0 = wl[i] if not np.isnan(wl[i]) else wcf[i]
            if np.isnan(w0) or w0 < C.MIN_WIND_FIX:
                continue
            r = dict(SID=sid, NAME=inf.loc[sid, "NAME"], time=pd.Timestamp(t0),
                     lat=lat[i], lon=lon[i], wind=w0, pres=pr[i],
                     age_h=float((t0 - start).astype(int)),
                     basin_bob=int(gen_lon >= 77.5))
            ts = pd.Timestamp(t0)
            r["year"], r["month"] = ts.year, ts.month
            r["season"] = int(season_of(ts.month))
            r["month_sin"], r["month_cos"] = np.sin(2 * np.pi * ts.month / 12), np.cos(2 * np.pi * ts.month / 12)
            # ---- past motion / intensity change (history only)
            for h in (6, 12):
                tp_ = t0 - np.timedelta64(h, "h")
                la, lo = _at(t, lat, tp_), _at(t, lon, tp_)
                r[f"dlat_p{h}"], r[f"dlon_p{h}"] = lat[i] - la, lon[i] - lo
            for h in (6, 12, 24):
                r[f"dwind_p{h}"] = w0 - _at(t, wl, t0 - np.timedelta64(h, "h"))
            dn = r["dlat_p6"] * 111.195
            de = r["dlon_p6"] * 111.195 * np.cos(np.radians(lat[i]))
            r["speed_kmh"] = np.hypot(dn, de) / 6.0
            hd = np.arctan2(de, dn)
            r["heading_sin"], r["heading_cos"] = np.sin(hd), np.cos(hd)
            # ---- targets
            for L in C.LEADS_H:
                tl = t0 + np.timedelta64(L, "h")
                la, lo = _at(t, lat, tl), _at(t, lon, tl)
                if np.isnan(la) or not in_domain(la, lo):
                    la = lo = np.nan
                r[f"y_dlat_{L}"], r[f"y_dlon_{L}"] = la - lat[i], lo - lon[i]
                r[f"y_dwind_{L}"] = _at(t, wl, tl) - w0
            d24 = r[f"y_dwind_{C.LEADS_H[-1]}"]
            r["y_ri"] = np.nan if np.isnan(d24) else float(d24 >= C.RI_THRESHOLD_KT)
            rest = wl[i:]
            r["y_peak_wind"] = np.nanmax(rest) if np.isfinite(rest).any() else np.nan
            r["y_peak_grade"] = float(imd_grade(r["y_peak_wind"])) if np.isfinite(r["y_peak_wind"]) else np.nan
            rows.append(r)
    if not rows:                      # no time with a usable wind (e.g. a weak or wind-less live report)
        return pd.DataFrame()
    df = pd.DataFrame(rows)
    df["split"] = df["year"].map(C.split_of)
    df["test_group"] = df["year"].map(C.test_group)       # "main" (TEST years) / "recent" / None
    return df


TARGET_TRACK = [f"y_{c}_{L}" for L in C.LEADS_H for c in ("dlat", "dlon")]
TARGET_INT = [f"y_dwind_{L}" for L in C.LEADS_H]
