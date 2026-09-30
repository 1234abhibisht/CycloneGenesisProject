"""
Backend settings. Every value can be overridden with an environment variable
(or a `.env` file next to this one, see `.env.example`).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def _load_dotenv():
    env = BASE_DIR / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()


def _path(name, default):
    return Path(os.environ.get(name, default)).expanduser().resolve()


def _bool(name, default):
    return os.environ.get(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


# ---------------------------------------------------------------- folders
ARTIFACTS_DIR = _path("CYCLONE_ARTIFACTS", BASE_DIR / "artifacts")   # trained models + results (from Colab)
MODELS_DIR = ARTIFACTS_DIR / "models"
RESULTS_DIR = ARTIFACTS_DIR / "results"
REPLAY_DIR = ARTIFACTS_DIR / "replay"
DATA_DIR = _path("CYCLONE_DATA", BASE_DIR / "data")                  # live data (GFS files + SQLite)
GFS_DIR = DATA_DIR / "gfs"
DB_PATH = DATA_DIR / "cyclone.db"

# ---------------------------------------------------------------- server
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
MODEL_VERSION = "vectorminds-2026.1"

# ---------------------------------------------------------------- live pipeline
AUTO_PIPELINE = _bool("AUTO_PIPELINE", True)          # run GFS download + forecasts in the background
REFRESH_MINUTES = int(os.environ.get("REFRESH_MINUTES", "60"))
GFS_BACKFILL_HOURS = int(os.environ.get("GFS_BACKFILL_HOURS", "48"))   # past data kept on disk
GFS_KEEP_HOURS = int(os.environ.get("GFS_KEEP_HOURS", "54"))
LOOKBACK_HOURS = 24                                    # features look back 24 h (pressure falls, rain totals)
GFS_READY_DELAY_HOURS = 5                              # a GFS cycle is usually complete ~4-5 h after its time
NOMADS_URL = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
NOMADS_PAUSE_SECONDS = float(os.environ.get("NOMADS_PAUSE_SECONDS", "2"))

# region used for training (ERA5 main area) - GFS is cut to exactly this box
AREA = dict(lat_min=5.0, lat_max=35.0, lon_min=55.0, lon_max=100.0)

# ---------------------------------------------------------------- storm sources
IBTRACS_ACTIVE_URL = os.environ.get(
    "IBTRACS_ACTIVE_URL",
    "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/"
    "v04r01/access/csv/ibtracs.ACTIVE.list.v04r01.csv")
GDACS_EVENTS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtypes=TC"
STORM_MAX_AGE_HOURS = 18        # a storm is "active" if its last fix is this recent (vs. the GFS time)

# ---------------------------------------------------------------- forecast settings
LEADS_H = (6, 12, 18, 24)
N_MC_TRACKS = int(os.environ.get("N_MC_TRACKS", "1000"))
BASIN_ZONES = [   # monitoring sectors shown on the Basin Watch page (id, name, basin, lat, lon)
    ("andaman", "Andaman Sea", "Bay of Bengal", 10.0, 94.5),
    ("south-bob", "South Bay of Bengal", "Bay of Bengal", 8.5, 85.0),
    ("central-bob", "Central Bay of Bengal", "Bay of Bengal", 14.5, 87.5),
    ("north-bob", "North Bay & Odisha Coast", "Bay of Bengal", 19.5, 88.5),
    ("se-arabian", "SE Arabian Sea & Lakshadweep", "Arabian Sea", 10.0, 72.0),
    ("central-arabian", "Central Arabian Sea", "Arabian Sea", 17.0, 67.0),
    ("nw-arabian", "NW Arabian Sea & Oman Coast", "Arabian Sea", 22.5, 63.0),
]
BASIN_ZONE_RADIUS_KM = 350

for d in (DATA_DIR, GFS_DIR):
    d.mkdir(parents=True, exist_ok=True)
