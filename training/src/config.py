"""
Every project setting lives here. Edit THIS file only (paths, years).

All other modules read these values at run time as `C.NAME`, so a notebook
can also change a value (e.g. `C.N_WORKERS = 2`) before calling a function.
"""
import os
from pathlib import Path

# ----------------------------------------------------------------------------
# 1. PATHS  (check these match your Google Drive)
# ----------------------------------------------------------------------------
DRIVE_ROOT = Path("/content/drive/MyDrive")
ERA5_ROOT = Path(os.environ.get("CYCLONE_ERA5_ROOT", DRIVE_ROOT / "ERA5_Cyclone_Data"))   # your ERA5 folders
PROJECT = Path(os.environ.get("CYCLONE_PROJECT", DRIVE_ROOT / "CycloneProject"))         # this project
OUT = PROJECT / "outputs"

# IBTrACS North Indian basin CSV (download once from NOAA NCEI and put it here)
IBTRACS_CSV = PROJECT / "data" / "ibtracs.NI.list.v04r01.csv"

# Optional: coastal district boundaries (GeoJSON or shapefile with a name column).
# If missing, notebook 05 uses the built-in list of coastal reference points.
DISTRICTS_FILE = PROJECT / "data" / "coastal_districts.geojson"
DISTRICT_NAME_COL = "district"
DISTRICT_STATE_COL = "state"

# Local scratch disk in Colab (fast); each month's files are copied here first
LOCAL_CACHE = Path("/content/era5_cache")
COPY_TO_LOCAL = True

# ----------------------------------------------------------------------------
# 2. ERA5 FILE LAYOUT
# ----------------------------------------------------------------------------
# Main files:   ERA5_ROOT/<folder>/<folder>_<YYYY>_<MM>.nc      (domain only)
# Buffer strips: ERA5_ROOT/Buffer_300km/<folder>/<strip>/<folder>_<YYYY>_<MM>_buffer_<strip>.nc
# folder name -> NetCDF variable name
SINGLE_LEVEL = {
    "SST": "sst",
    "MSLP": "msl",
    "10m_U_Wind": "u10",
    "10m_V_Wind": "v10",
    "2m_Temperature": "t2m",
    "2m_Dewpoint": "d2m",
    "Total_Precipitation": "tp",
}
PRESSURE_LEVEL = {
    "Relative_Humidity": "r",
    "Temperature_PL": "t",
    "U_Wind_PL": "u",
    "V_Wind_PL": "v",
}
BUFFER_ROOT = ERA5_ROOT / "Buffer_300km"
STRIPS = ["north", "south", "west", "east"]

# Geopotential: one file per month already covering the FULL buffered area.
# EDIT the folder name if yours differs. Files are found by "<YYYY>_<MM>" in the name.
GEOPOTENTIAL_FOLDER = "Geopotential_850_Full_Buffer_300km"
GEOPOTENTIAL_VAR = "z"

# Land-sea mask: one static file for the full buffered area
LSM_FILE = ERA5_ROOT / "Land_Sea_Mask_Full_Buffer_300km" / "Land_Sea_Mask_N38_W51p5_S2_E103p5_025deg.nc"
LSM_VAR = "lsm"

# ----------------------------------------------------------------------------
# 3. DOMAIN AND GRIDS
# ----------------------------------------------------------------------------
# USE_BUFFER = False -> only the main files (5-35 N, 55-100 E) are read; buffer strips are ignored.
#   Predictions are then made 300 km inside that area (8-32 N, 58-97 E) so every predicted cell
#   still has complete 300 km neighbourhood data around it.
# USE_BUFFER = True  -> main files + 300 km buffer strips; predictions over the full 5-35 N, 55-100 E.
USE_BUFFER = False
MAIN_AREA = dict(lat_min=5.0, lat_max=35.0, lon_min=55.0, lon_max=100.0)
BUFFERED_AREA = dict(lat_min=2.0, lat_max=38.0, lon_min=51.5, lon_max=103.5)
if USE_BUFFER:
    BUFFER = BUFFERED_AREA                                               # grid the features are computed on
    DOMAIN = MAIN_AREA                                                   # cells that get predictions
else:
    BUFFER = MAIN_AREA
    DOMAIN = dict(lat_min=8.0, lat_max=32.0, lon_min=58.0, lon_max=97.0)
RES = 0.25              # ERA5 grid (features are computed here)
TABLE_STEP = 2          # every 2nd grid point -> 0.5 deg rows in the occurrence table
TIME_STEP_H = 3         # ERA5 cadence = issue-time cadence

# ----------------------------------------------------------------------------
# 4. YEARS AND SPLIT
# ----------------------------------------------------------------------------
YEARS = (1990, 2023)            # ERA5 years used for training and the main test
TRAIN = (1990, 2016)            # model fitting (hyper-parameters tuned by year-grouped CV inside these years)
VAL = (2017, 2018)              # early stopping / model comparison / track-error bank / uncertainty cone
CAL = (2019, 2020)              # calibration + warning threshold + strike reliability (cross-fit 2019 <-> 2020; Amphan)
TEST = (2021, 2023)             # final exam: notebook 06, run ONCE at the end (Tauktae, Yaas, Biparjoy, Mocha ...)

# Extra unseen test storms after the main ERA5 range. Only these months are built, so download ERA5 for
# exactly these months (same variables / folders / file names as every other month).
# Oct-Dec 2025 = Shakhti, Montha (Oct) and Ditwah (late Nov - 2 Dec). Set to [] to skip.
RECENT_TEST_MONTHS = [(2025, 10), (2025, 11), (2025, 12)]
RECENT_TEST_YEARS = tuple(sorted({y for y, _ in RECENT_TEST_MONTHS}))


def split_of(year):
    for name, (a, b) in (("train", TRAIN), ("val", VAL), ("cal", CAL), ("test", TEST)):
        if a <= year <= b:
            return name
    if year in RECENT_TEST_YEARS:
        return "test"           # recent storms are test storms too; test_group() keeps them apart in reports
    return "other"


def test_group(year):
    """'main' for the TEST years, 'recent' for RECENT_TEST_MONTHS storms (None for other years)."""
    if TEST[0] <= year <= TEST[1]:
        return "main"
    return "recent" if year in RECENT_TEST_YEARS else None


def span(years):
    """(2021, 2023) -> '2021-2023' (used in titles and labels)."""
    return f"{years[0]}-{years[1]}" if years[0] != years[1] else str(years[0])


def split_info():
    """Everything the website needs to label the splits (written by the export script)."""
    return {"years": list(YEARS), "train": list(TRAIN), "val": list(VAL), "cal": list(CAL), "test": list(TEST),
            "recent_test_months": [f"{y}-{m:02d}" for y, m in RECENT_TEST_MONTHS]}

# ----------------------------------------------------------------------------
# 5. LABELS, CATEGORIES, RADII
# ----------------------------------------------------------------------------
WIND_COL = "WMO_WIND"           # IMD 3-min winds (kt) - IMD categories are defined on these
PRES_COL = "WMO_PRES"
USA_TO_WMO = 0.88               # 1-min JTWC -> ~3-min, only used where WMO_WIND is missing
FILL_WITH_USA_WIND = True

# IMD thresholds (kt): D 17, DD 28, CS 34, SCS 48, VSCS 64, ESCS 90, SuCS 120
IMD_BINS = [17, 28, 34, 48, 64, 90, 120]
IMD_NAMES = ["LP", "D", "DD", "CS", "SCS", "VSCS", "ESCS", "SuCS"]

# Occurrence classes (rare top categories merged because there are few storms):
#   0 = none, 1 = D/DD (17-33 kt), 2 = CS (34-47 kt), 3 = SCS or stronger (>=48 kt)
OCC_BINS = [17, 34, 48]
OCC_NAMES = ["none", "D-DD", "CS", "SCS+"]
N_OCC = len(OCC_NAMES)

LABEL_RADIUS_KM = 200.0
LABEL_WINDOW_H = 24             # label window is (t0, t0 + 24 h]
NBR_RADII_KM = (100.0, 300.0)   # neighbourhood features
STRIKE_RADIUS_KM = 100.0        # "hit" = storm centre within 100 km of district coast

# ----------------------------------------------------------------------------
# 6. OCCURRENCE TABLE SAMPLING
# ----------------------------------------------------------------------------
KEEP_LAND_WITHIN_KM = 150       # keep ocean cells + land cells within 150 km of the sea
HARD_NEG_KM = 600               # negatives within 600 km of a storm are "hard"
HARD_NEG_KEEP = 0.30            # keep 30% of hard negatives
EASY_NEG_KEEP = 0.02            # keep 2% of other negatives (weights correct for this)
FULL_EVAL_HOURS = (0, 12)       # in VAL, CAL and TEST years also save ALL cells at 00 and 12 UTC
RANDOM_SEED = 42

# ----------------------------------------------------------------------------
# 7. STORM TABLE / TARGETS
# ----------------------------------------------------------------------------
LEADS_H = (6, 12, 18, 24)
MIN_WIND_FIX = 17               # use fixes of depression strength or more
RI_THRESHOLD_KT = 30            # rapid intensification: +30 kt in 24 h
RING_STEER_KM = (200.0, 800.0)  # steering averaged in this ring around the centre

# ----------------------------------------------------------------------------
# 8. COMPUTE
# ----------------------------------------------------------------------------
N_WORKERS = 4                   # months processed in parallel (8-core High-RAM Colab)
TABLE_FORMAT = "parquet"        # "parquet" (recommended) or "pickle"

# ----------------------------------------------------------------------------
# 9. STRIKE PROBABILITY / CASE STUDY
# ----------------------------------------------------------------------------
N_MC_TRACKS = 1000
N_MC_TRACKS_VALIDATION = 300
CASE_STORM = "MOCHA"            # named storm for the case-study figure (May 2023 = test year; "MONTHA" also works)
STRIKE_BANDS = [(50, "red"), (25, "orange"), (10, "yellow"), (0, "green")]

# ----------------------------------------------------------------------------
# derived output folders
# ----------------------------------------------------------------------------
def out(*parts):
    p = OUT.joinpath(*parts)
    p.mkdir(parents=True, exist_ok=True)
    return p
