"""Small helpers shared by every module: grids, distances, table save/load."""
from pathlib import Path
import numpy as np
import pandas as pd

from . import config as C

R_EARTH_KM = 6371.0
KM_PER_DEG = 111.195


def _axis(a, b):
    return np.round(np.arange(a, b + 1e-9, C.RES), 3)


def buffer_grid():
    """Latitudes (ascending) and longitudes of the full buffered 0.25 deg grid."""
    return _axis(C.BUFFER["lat_min"], C.BUFFER["lat_max"]), _axis(C.BUFFER["lon_min"], C.BUFFER["lon_max"])


def domain_index(lat, lon, step=None):
    """Indices of the prediction-domain points on the 0.25 deg grid, every `step` points."""
    step = step or C.TABLE_STEP
    iy = np.where((lat >= C.DOMAIN["lat_min"] - 1e-6) & (lat <= C.DOMAIN["lat_max"] + 1e-6))[0][::step]
    ix = np.where((lon >= C.DOMAIN["lon_min"] - 1e-6) & (lon <= C.DOMAIN["lon_max"] + 1e-6))[0][::step]
    return iy, ix


def haversine(lat1, lon1, lat2, lon2):
    """Great-circle distance in km; inputs broadcast."""
    lat1, lon1, lat2, lon2 = (np.radians(np.asarray(v, dtype="float64")) for v in (lat1, lon1, lat2, lon2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    return 2 * R_EARTH_KM * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def move(lat, lon, dlat_km, dlon_km):
    """Shift a position by (north, east) kilometres."""
    lat2 = lat + dlat_km / KM_PER_DEG
    lon2 = lon + dlon_km / (KM_PER_DEG * np.cos(np.radians(lat)))
    return lat2, lon2


def occ_class(wind_kt):
    """Wind (kt) -> occurrence class 0..3 (NaN -> 0)."""
    w = np.nan_to_num(np.asarray(wind_kt, dtype="float64"), nan=0.0)
    return np.digitize(w, C.OCC_BINS).astype("int8")


def imd_grade(wind_kt):
    """Wind (kt) -> IMD grade index 0 (LP) .. 7 (SuCS)."""
    w = np.nan_to_num(np.asarray(wind_kt, dtype="float64"), nan=0.0)
    return np.digitize(w, C.IMD_BINS).astype("int8")


def season_of(month):
    """0 = pre-monsoon (Mar-May), 1 = monsoon (Jun-Sep), 2 = post-monsoon (Oct-Feb)."""
    m = np.asarray(month)
    return np.where((m >= 3) & (m <= 5), 0, np.where((m >= 6) & (m <= 9), 1, 2)).astype("int8")


# ---------------------------------------------------------------- tables
def _suffix():
    return ".parquet" if C.TABLE_FORMAT == "parquet" else ".pkl"


def save_table(df, path):
    path = Path(path).with_suffix(_suffix())
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    if C.TABLE_FORMAT == "parquet":
        df.to_parquet(tmp, index=False)
    else:
        df.to_pickle(tmp)
    tmp.replace(path)          # atomic: a half-written file never looks "done"
    return path


def load_table(path, columns=None):
    path = Path(path).with_suffix(_suffix())
    if C.TABLE_FORMAT == "parquet":
        return pd.read_parquet(path, columns=columns)
    df = pd.read_pickle(path)
    return df[columns] if columns else df


def table_exists(path):
    return Path(path).with_suffix(_suffix()).exists()


def list_tables(folder, pattern="*"):
    return sorted(Path(folder).glob(pattern + _suffix()))


def load_many(files, columns=None, filter_fn=None):
    parts = []
    for f in files:
        df = load_table(f, columns=columns)
        if filter_fn is not None:
            df = filter_fn(df)
        parts.append(df)
    return pd.concat(parts, ignore_index=True) if parts else pd.DataFrame()


def months(years=None):
    a, b = years or C.YEARS
    return [(y, m) for y in range(a, b + 1) for m in range(1, 13)]
