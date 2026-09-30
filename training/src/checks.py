"""Data checks used by notebook 00: missing months, grid alignment, IBTrACS summary."""
import numpy as np
import pandas as pd

from . import config as C
from .common import buffer_grid, months


def missing_months(years=None):
    """One row per (kind, folder, strip, year, month) that is missing."""
    from .io_era5 import find_file
    rows = []
    for y, m in months(years):
        for folder in list(C.SINGLE_LEVEL) + list(C.PRESSURE_LEVEL):
            if find_file(C.ERA5_ROOT / folder, y, m) is None:
                rows.append(("main", folder, "", y, m))
            for s in (C.STRIPS if C.USE_BUFFER else []):
                if find_file(C.BUFFER_ROOT / folder / s, y, m) is None:
                    rows.append(("buffer", folder, s, y, m))
        if find_file(C.ERA5_ROOT / C.GEOPOTENTIAL_FOLDER, y, m) is None:
            rows.append(("full", C.GEOPOTENTIAL_FOLDER, "", y, m))
    return pd.DataFrame(rows, columns=["kind", "folder", "strip", "year", "month"])


def summarise_missing(miss):
    if miss.empty:
        return pd.DataFrame()
    return (miss.groupby(["kind", "folder", "strip"]).size().rename("missing_months")
            .reset_index().sort_values("missing_months", ascending=False))


def grid_check(y, m):
    """Open one month of every variable, merge onto the buffered grid, report coverage and levels."""
    from . import io_era5
    lat, lon = buffer_grid()
    rows = []
    for folder, var in list(C.SINGLE_LEVEL.items()) + list(C.PRESSURE_LEVEL.items()):
        da = io_era5.open_buffered(folder, var, y, m)
        levels = list(map(int, da.level.values)) if "level" in da.dims else []
        frac = float(np.isfinite(da.isel(time=0).values).mean())
        rows.append(dict(folder=folder, var=var, times=da.sizes["time"], levels=levels,
                         filled_fraction=round(frac, 4), shape=tuple(da.shape)))
    try:
        z = io_era5.open_full(C.GEOPOTENTIAL_FOLDER, C.GEOPOTENTIAL_VAR, y, m)
        rows.append(dict(folder=C.GEOPOTENTIAL_FOLDER, var="z", times=z.sizes["time"],
                         levels=list(map(int, z.level.values)) if "level" in z.dims else [],
                         filled_fraction=round(float(np.isfinite(z.isel(time=0).values).mean()), 4),
                         shape=tuple(z.shape)))
    except FileNotFoundError as e:
        rows.append(dict(folder=C.GEOPOTENTIAL_FOLDER, var="z", times=0, levels=[], filled_fraction=0.0,
                         shape=(), note=str(e)))
    lsm = io_era5.load_lsm()
    rows.append(dict(folder="land-sea mask", var="lsm", times=1, levels=[],
                     filled_fraction=round(float(np.isfinite(lsm).mean()), 4), shape=lsm.shape))
    print(f"buffered grid: {len(lat)} lat x {len(lon)} lon  ({lat[0]}..{lat[-1]} N, {lon[0]}..{lon[-1]} E)")
    return pd.DataFrame(rows)


def ibtracs_summary(fixes):
    y = fixes["ISO_TIME"].dt.year
    per_year = fixes.groupby(y)["SID"].nunique().rename("storms")
    gaps = fixes.groupby("SID")["ISO_TIME"].diff().dt.total_seconds().div(3600).dropna()
    print(f"storms: {fixes.SID.nunique()}  fixes: {len(fixes)}  years: {y.min()}-{y.max()}")
    print(f"gaps == 3 h: {(gaps.round(2) == 3).mean():.2%}   gaps > 6 h: {(gaps > 6).mean():.2%}")
    print(f"fixes where WMO wind was missing and USA wind was converted: {fixes['wind_from_usa'].mean():.2%}")
    return per_year
