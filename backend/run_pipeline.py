"""
Run the live pipeline once from the command line (the API also runs it in the background).

    python run_pipeline.py                 # download missing GFS (last 48 h) + storms + forecasts
    python run_pipeline.py --no-download   # use the GFS files already in data/gfs
    python run_pipeline.py --download-only # just fetch the GFS files (e.g. first setup)
"""
import argparse
import json
import logging

import db
from pipeline import gfs, live
from pipeline.models import ModelStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--download-only", action="store_true")
    ap.add_argument("--backfill-hours", type=int, default=None)
    a = ap.parse_args()
    db.init()
    if a.download_only:
        print(gfs.sync(backfill_hours=a.backfill_hours))
        print(f"{len(gfs.available_files())} GFS files on disk; newest valid time {gfs.latest_valid_time()}")
    else:
        if not a.no_download and a.backfill_hours:
            gfs.sync(backfill_hours=a.backfill_hours)
        print(json.dumps(live.run_cycle(ModelStore(), download=not a.no_download), indent=2))
