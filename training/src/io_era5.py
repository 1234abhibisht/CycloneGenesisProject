"""
Load one month of ERA5 on the full buffered 0.25 deg grid.

For every variable: main-domain file + 4 buffer strips are merged onto one grid
(2-38 N, 51.5-103.5 E). Geopotential and the land-sea mask already cover the
full buffered area. The last 24 h of the previous month are added in front so
that pressure falls and 24 h rain totals are complete on day 1.

Returned as plain NumPy arrays (see `load_month`) so the feature code does not
depend on xarray.
"""
import shutil
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

from . import config as C
from .common import buffer_grid


# ------------------------------------------------------------------ files
def find_file(folder, y, m):
    """First .nc file in `folder` whose name contains _YYYY_MM (None if absent)."""
    folder = Path(folder)
    hits = sorted(folder.glob(f"*{y}_{m:02d}*.nc"))
    return hits[0] if hits else None


def month_files(y, m):
    """All files needed for one month -> dict {(kind, folder, strip): path or None}."""
    out = {}
    for folder in list(C.SINGLE_LEVEL) + list(C.PRESSURE_LEVEL):
        out[("main", folder, "")] = find_file(C.ERA5_ROOT / folder, y, m)
        for s in (C.STRIPS if C.USE_BUFFER else []):
            out[("strip", folder, s)] = find_file(C.BUFFER_ROOT / folder / s, y, m)
    out[("full", C.GEOPOTENTIAL_FOLDER, "")] = find_file(C.ERA5_ROOT / C.GEOPOTENTIAL_FOLDER, y, m)
    return out


def _local(path):
    """Copy a Drive file to fast local disk once; return the path to open."""
    path = Path(path)
    if not C.COPY_TO_LOCAL:
        return path
    try:
        rel = path.relative_to(C.ERA5_ROOT)
    except ValueError:
        rel = Path(path.name)
    dest = Path(C.LOCAL_CACHE) / rel
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_name(dest.name + ".part")
        shutil.copy(path, tmp)
        tmp.replace(dest)
    return dest


def clear_local(y, m):
    """Delete this month's local copies to save disk."""
    if not C.COPY_TO_LOCAL:
        return
    for p in Path(C.LOCAL_CACHE).rglob(f"*{y}_{m:02d}*.nc"):
        p.unlink(missing_ok=True)


# ------------------------------------------------------------------ opening
def _norm(ds):
    ren = {}
    if "valid_time" in ds.dims or "valid_time" in ds.coords:
        ren["valid_time"] = "time"
    if "pressure_level" in ds.dims or "pressure_level" in ds.coords:
        ren["pressure_level"] = "level"
    if "lat" in ds.dims:
        ren["lat"] = "latitude"
    if "lon" in ds.dims:
        ren["lon"] = "longitude"
    ds = ds.rename(ren)
    drop = [c for c in ("number", "expver", "step", "surface") if c in ds.variables]
    ds = ds.drop_vars(drop)
    ds = ds.assign_coords(latitude=np.round(ds.latitude.values.astype("float64"), 3),
                          longitude=np.round(ds.longitude.values.astype("float64"), 3))
    return ds.sortby("latitude").sortby("longitude")


def _open(path, var, tail=None):
    with xr.open_dataset(_local(path)) as ds:
        ds = _norm(ds)
        if var not in ds:
            raise KeyError(f"variable '{var}' not in {path} (has {list(ds.data_vars)})")
        da = ds[var]
        if tail is not None and "time" in da.dims:
            da = da.isel(time=slice(-tail, None))
        return da.astype("float32").load()


def _on_grid(pieces):
    lat, lon = buffer_grid()
    out = None
    for p in pieces:
        p = p.reindex(latitude=lat, longitude=lon, method="nearest", tolerance=0.01)
        out = p if out is None else out.fillna(p)
    return out


def open_buffered(folder, var, y, m, tail=None):
    main = find_file(C.ERA5_ROOT / folder, y, m)
    if main is None:
        raise FileNotFoundError(f"{folder} {y}-{m:02d}: main file missing")
    pieces = [_open(main, var, tail)]
    for s in (C.STRIPS if C.USE_BUFFER else []):
        f = find_file(C.BUFFER_ROOT / folder / s, y, m)
        if f is None:
            warnings.warn(f"{folder} {y}-{m:02d}: buffer strip '{s}' missing (edge cells will be NaN)")
            continue
        pieces.append(_open(f, var, tail))
    return _on_grid(pieces)


def open_full(folder, var, y, m, tail=None):
    f = find_file(C.ERA5_ROOT / folder, y, m)
    if f is None:
        raise FileNotFoundError(f"{folder} {y}-{m:02d}: file missing")
    return _on_grid([_open(f, var, tail)])


def load_lsm():
    lat, lon = buffer_grid()
    with xr.open_dataset(C.LSM_FILE) as ds:
        da = _norm(ds)[C.LSM_VAR]
        if "time" in da.dims:
            da = da.isel(time=0)
        da = da.reindex(latitude=lat, longitude=lon, method="nearest", tolerance=0.01)
        return da.values.astype("float32")


# ------------------------------------------------------------------ month
def _load_all(y, m, tail=None):
    """dict: single-level name -> DataArray(time,lat,lon); pressure -> DataArray(time,level,lat,lon)."""
    d = {}
    for folder, var in C.SINGLE_LEVEL.items():
        d[var] = open_buffered(folder, var, y, m, tail)
    for folder, var in C.PRESSURE_LEVEL.items():
        d[var] = open_buffered(folder, var, y, m, tail)
    try:
        d["z"] = open_full(C.GEOPOTENTIAL_FOLDER, C.GEOPOTENTIAL_VAR, y, m, tail)
    except FileNotFoundError as e:
        warnings.warn(f"{e} -> thickness/warm-core-from-geopotential features will be NaN")
    return d


def load_month(y, m, pad_h=24):
    """
    Returns a dict F with NumPy arrays:
      F['time']  DatetimeIndex (previous 24 h + whole month)
      F['lat'], F['lon'] 1-D ascending
      F[var] (T, Y, X) for single-level vars
      F[var] {level: (T, Y, X)} for r, t, u, v, z
      F['lsm'] (Y, X)
      F['first_new'] index of the first time step that belongs to month (y, m)
    """
    cur = _load_all(y, m)
    py, pm = (y, m - 1) if m > 1 else (y - 1, 12)
    tail = pad_h // C.TIME_STEP_H
    try:
        prev = _load_all(py, pm, tail=tail)
    except FileNotFoundError:
        prev = None
        warnings.warn(f"previous month {py}-{pm:02d} missing: first-day pressure falls / rain totals will be NaN")

    lat, lon = buffer_grid()
    F = {"lat": lat, "lon": lon}
    times = None
    for k, da in cur.items():
        if prev is not None and k in prev:
            da = xr.concat([prev[k], da], dim="time")
        if times is None:
            times = pd.DatetimeIndex(da.time.values)
        da = da.reindex(time=times)
        if "level" in da.dims:
            F[k] = {int(round(float(lv))): da.sel(level=lv).values for lv in da.level.values}
        else:
            F[k] = da.values
    F["time"] = times
    F["first_new"] = int(np.searchsorted(times.values, np.datetime64(f"{y}-{m:02d}-01T00:00")))
    F["lsm"] = load_lsm()
    F.setdefault("z", {})
    return F
