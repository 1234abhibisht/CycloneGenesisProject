"""
Live NOAA GFS 0.25° data.

download : NOMADS grib filter -> data/gfs/<YYYYMMDD>/gfs_<YYYYMMDD>_<HH>z_f<FFF>.grib2
           (only our region 5-35 N, 55-100 E and only the variables the models use)
           f000 = analysis, f003 = 3-hour step (fills the 3-hourly gap), f006 = rain 3-6 h
store    : rolling window; files older than GFS_KEEP_HOURS are deleted
assemble : build the same field dictionary `F` that training built from ERA5
           (same variable names, units, pressure levels and 0.25° grid)
"""
import logging
import shutil
import time
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
import requests

import config as CFG

log = logging.getLogger("gfs")

G0 = 9.80665
CYCLES_H = (0, 6, 12, 18)
FORECAST_HOURS = ("000", "003", "006")
VARIABLES = ["PRMSL", "TMP", "UGRD", "VGRD", "DPT", "APCP", "RH", "HGT", "LAND"]
LEVELS = ["mean_sea_level", "surface", "10_m_above_ground", "2_m_above_ground",
          "850_mb", "700_mb", "600_mb", "500_mb", "400_mb", "300_mb", "250_mb", "200_mb"]

# pressure levels exactly as in the ERA5 training data
PL_LEVELS = {
    "r": (850, 700, 600, 500),
    "t": (850, 700, 500, 300),
    "u": (850, 700, 600, 500, 400, 300, 250, 200),
    "v": (850, 700, 600, 500, 400, 300, 250, 200),
    "z": (850, 500, 200),
}


def _naive(t=None):
    """UTC time as a timezone-naive Timestamp (default: now)."""
    t = pd.Timestamp(t) if t is not None else pd.Timestamp(datetime.now(timezone.utc))
    return t.tz_convert("UTC").tz_localize(None) if t.tzinfo is not None else t


# ================================================================ file names
def file_path(cycle_time, fhour):
    d = cycle_time.strftime("%Y%m%d")
    return CFG.GFS_DIR / d / f"gfs_{d}_{cycle_time:%H}z_f{int(fhour):03d}.grib2"


def floor_cycle(t):
    t = pd.Timestamp(t)
    return t.floor("6h")


# ================================================================ download
def _params(cycle_time, fhour):
    p = {"dir": f"/gfs.{cycle_time:%Y%m%d}/{cycle_time:%H}/atmos",
         "file": f"gfs.t{cycle_time:%H}z.pgrb2.0p25.f{int(fhour):03d}",
         "subregion": "", "toplat": CFG.AREA["lat_max"], "leftlon": CFG.AREA["lon_min"],
         "bottomlat": CFG.AREA["lat_min"], "rightlon": CFG.AREA["lon_max"]}
    p.update({f"var_{v}": "on" for v in VARIABLES})
    p.update({f"lev_{lv}": "on" for lv in LEVELS})
    return p


def download_file(cycle_time, fhour, retries=3):
    """Download one GFS file. Returns 'ok', 'exists', 'missing' (not published yet / too old) or 'error'."""
    dest = file_path(cycle_time, fhour)
    if dest.exists() and dest.stat().st_size > 10_000:
        return "exists"
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(CFG.NOMADS_URL, params=_params(cycle_time, fhour), timeout=120)
            if r.status_code == 404 or b"data file is not present" in r.content[:600]:
                return "missing"
            r.raise_for_status()
            if not r.content.startswith(b"GRIB"):
                raise RuntimeError(f"not a GRIB2 file: {r.content[:120]!r}")
            tmp.write_bytes(r.content)
            tmp.replace(dest)
            time.sleep(CFG.NOMADS_PAUSE_SECONDS)
            return "ok"
        except Exception as e:  # network hiccup - retry
            log.warning("GFS %s f%s attempt %d failed: %s", cycle_time, fhour, attempt, e)
            tmp.unlink(missing_ok=True)
            time.sleep(10 * attempt)
    return "error"


def sync(backfill_hours=None, now=None):
    """Make sure every GFS cycle of the last `backfill_hours` is on disk (skips files already there)."""
    backfill_hours = backfill_hours or CFG.GFS_BACKFILL_HOURS
    now = _naive(now)
    latest = floor_cycle(now - pd.Timedelta(hours=CFG.GFS_READY_DELAY_HOURS))
    cycles = pd.date_range(latest - pd.Timedelta(hours=backfill_hours), latest, freq="6h")
    stats = {"ok": 0, "exists": 0, "missing": 0, "error": 0}
    for c in cycles:
        for fh in FORECAST_HOURS:
            stats[download_file(c, fh)] += 1
    # also try the next (maybe already published) cycle
    nxt = latest + pd.Timedelta(hours=6)
    if nxt <= now:
        for fh in FORECAST_HOURS:
            s = download_file(nxt, fh, retries=1)
            stats["ok" if s == "ok" else "exists" if s == "exists" else "missing"] += 1
    cleanup()
    return stats


def cleanup(keep_hours=None, now=None):
    keep_hours = keep_hours or CFG.GFS_KEEP_HOURS
    now = _naive(now)
    cutoff = now - pd.Timedelta(hours=keep_hours)
    removed = 0
    for day in sorted(CFG.GFS_DIR.glob("[0-9]" * 8)):
        for f in day.glob("gfs_*.grib2"):
            try:
                t = pd.Timestamp(datetime.strptime(f.name[4:16], "%Y%m%d_%Hz"))
            except ValueError:
                continue
            if t < cutoff:
                f.unlink(missing_ok=True)
                removed += 1
        if day.is_dir() and not any(day.iterdir()):
            shutil.rmtree(day, ignore_errors=True)
    return removed


def available_files():
    out = []
    for f in sorted(CFG.GFS_DIR.glob("*/gfs_*.grib2")):
        try:
            c = pd.Timestamp(datetime.strptime(f.name[4:16], "%Y%m%d_%Hz"))
            out.append((c, int(f.stem.split("_f")[-1]), f))
        except ValueError:
            continue
    return out


# ================================================================ which file gives which valid time
def field_source(valid):
    """(cycle, forecast hour) whose instantaneous fields describe `valid` (3-hourly)."""
    valid = pd.Timestamp(valid)
    if valid.hour % 6 == 0:
        return valid, 0
    return valid - pd.Timedelta(hours=3), 3


def latest_valid_time():
    """Newest 3-hourly time for which the instantaneous fields are on disk."""
    best = None
    for cycle, fh, _ in available_files():
        if fh in (0, 3):
            v = cycle + pd.Timedelta(hours=fh)
            best = v if best is None or v > best else best
    return best


# ================================================================ reading GRIB
def _level_kind(ds):
    for k in ("isobaricInhPa", "heightAboveGround", "meanSea", "surface"):
        if k in ds.coords:
            return k
    return "surface"


@lru_cache(maxsize=48)
def read_grib(path_str):
    """
    Read one GFS GRIB2 file -> dict of 2-D arrays on our 0.25° grid (lat ascending).
    Keys: prmsl, skt, lsm, u10, v10, t2m, d2m, tp:<stepRange>, and (var, level) for pressure levels.
    """
    import cfgrib  # imported here so the API can start even without eccodes installed

    lat_t, lon_t = grid()
    out = {}
    for ds in cfgrib.open_datasets(path_str, backend_kwargs={"indexpath": ""}):
        ds = ds.sortby("latitude")
        ds = ds.reindex(latitude=lat_t, longitude=lon_t, method="nearest", tolerance=0.01)
        kind = _level_kind(ds)
        for name, da in ds.data_vars.items():
            vals = np.asarray(da.values, dtype="float32")
            if kind == "isobaricInhPa":
                levs = np.atleast_1d(ds["isobaricInhPa"].values)
                vals = vals.reshape((len(levs),) + vals.shape[-2:])
                key = {"gh": "z", "t": "t", "u": "u", "v": "v", "r": "r"}.get(name)
                if key:
                    for i, lv in enumerate(levs):
                        out[(key, int(round(float(lv))))] = vals[i]
            elif name == "tp":
                step = str(da.attrs.get("GRIB_stepRange", "acc"))
                out[f"tp:{step}"] = vals
            elif name in ("prmsl", "u10", "v10", "t2m", "d2m", "lsm"):
                out[name] = vals
            elif name == "t" and kind == "surface":
                out["skt"] = vals
            elif name in ("skt",):
                out["skt"] = vals
    return out


def grid():
    from core import common
    return common.buffer_grid()


def _acc_3h(valid, reader):
    """Rain (mm) accumulated over the 3 h ending at `valid`."""
    valid = pd.Timestamp(valid)
    if valid.hour % 6 == 3:
        cyc = valid - pd.Timedelta(hours=3)
        p3 = file_path(cyc, 3)
        if p3.exists():
            f = reader(str(p3))
            v = f.get("tp:0-3")
            if v is None:
                v = next((a for k, a in f.items() if isinstance(k, str) and k.startswith("tp:")), None)
            return v
        return None
    cyc = valid - pd.Timedelta(hours=6)
    p3, p6 = file_path(cyc, 3), file_path(cyc, 6)
    if not p6.exists():
        return None
    f6 = reader(str(p6))
    if "tp:3-6" in f6:
        return f6["tp:3-6"]
    a06 = f6.get("tp:0-6")
    if a06 is None or not p3.exists():
        return None
    a03 = reader(str(p3)).get("tp:0-3")
    return None if a03 is None else np.maximum(a06 - a03, 0)


def assemble_F(t0, lookback_h=None, reader=None, lsm=None):
    """
    Build the training-style field dict for times t0-lookback ... t0 (3-hourly).
    Missing times become NaN (the models handle missing values).
    Returns F and the list of times that had real data.
    """
    lookback_h = lookback_h or CFG.LOOKBACK_HOURS
    reader = reader or read_grib
    t0 = pd.Timestamp(t0)
    times = pd.date_range(t0 - pd.Timedelta(hours=lookback_h), t0, freq="3h")
    lat, lon = grid()
    shape = (len(times), len(lat), len(lon))
    nan = lambda: np.full(shape, np.nan, dtype="float32")  # noqa: E731
    F = {k: nan() for k in ("u10", "v10", "t2m", "d2m", "sst", "msl", "tp")}
    for k, levels in PL_LEVELS.items():
        F[k] = {lv: nan() for lv in levels}
    have, lsm_live = [], None
    for i, vt in enumerate(times):
        cyc, fh = field_source(vt)
        p = file_path(cyc, fh)
        if not p.exists():
            continue
        f = reader(str(p))
        have.append(vt)
        for src, dst in (("u10", "u10"), ("v10", "v10"), ("t2m", "t2m"), ("d2m", "d2m"), ("prmsl", "msl")):
            if src in f:
                F[dst][i] = f[src]
        if "skt" in f:
            F["sst"][i] = f["skt"]
        if "lsm" in f:
            lsm_live = f["lsm"]
        for k, levels in PL_LEVELS.items():
            for lv in levels:
                a = f.get((k, lv))
                if a is not None:
                    F[k][lv][i] = a * G0 if k == "z" else a
        acc = _acc_3h(vt, reader)
        if acc is not None:
            F["tp"][i] = acc / 3000.0        # ERA5 convention: hourly accumulation in metres
    if lsm is None:
        lsm = lsm_live if lsm_live is not None else np.zeros((len(lat), len(lon)), "float32")
    lsm = np.nan_to_num(np.asarray(lsm, dtype="float32"))
    F["sst"] = np.where(lsm[None] >= 0.5, np.nan, F["sst"]).astype("float32")   # SST only over sea, like ERA5
    F.update(lat=lat, lon=lon, time=times, lsm=lsm, first_new=len(times) - 1)
    return F, have


def load_static_lsm():
    """Optional ERA5 land-sea mask (artifacts/data/lsm.npy) so land features match training exactly."""
    p = CFG.ARTIFACTS_DIR / "data" / "lsm.npy"
    return np.load(p) if p.exists() else None
