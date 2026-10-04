"""
Run ONCE in Google Colab (after notebooks 00-06) to package everything the backend needs.
It also converts the XGBoost track / intensity / RI / peak models to portable JSON files (the backend prefers
them), so scripts/convert_models_to_json_colab.py no longer has to be run separately.

    Colab cell:
        from google.colab import drive; drive.mount('/content/drive')
        !python /content/drive/MyDrive/CycloneProject/export_artifacts_colab.py
    (or paste this file into a cell)

Output on Drive:  MyDrive/CycloneProject/outputs/backend_artifacts.zip
Unzip it into     backend/artifacts/      so you get
    backend/artifacts/models/     trained models (occurrence, track, intensity, RI, peak, error bank, cone)
    backend/artifacts/results/    test scores for the Model Performance page + split_info.json (split years, test storms)
    backend/artifacts/replay/     unseen test storms (2021-23 + recent, e.g. Montha / Ditwah) with their ERA5 features
    backend/artifacts/data/       ERA5 land-sea mask on the model grid (+ district boundaries if you have them)

Nothing on Drive is changed except the new zip file.
"""
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path

import numpy as np

PROJECT = Path(os.environ.get("CYCLONE_PROJECT", "/content/drive/MyDrive/CycloneProject"))
sys.path.insert(0, str(PROJECT))
os.environ.setdefault("CYCLONE_PROJECT", str(PROJECT))

from src import config as C          # noqa: E402
from src.common import load_table    # noqa: E402

OUT = PROJECT / "outputs"
STAGE = Path("/content/backend_artifacts")
if STAGE.exists():
    shutil.rmtree(STAGE)
for sub in ("models", "results", "replay", "data"):
    (STAGE / sub).mkdir(parents=True)

# 1) trained models ----------------------------------------------------------
MODEL_FILES = ["occurrence_xgb.json", "occurrence_calibrator.pkl", "occurrence_features.json",
               "occurrence_threshold.json", "storm_features.json", "storm_models_info.json",
               "track_error_bank.npy", "cone_radius.csv", "y_ri.joblib", "y_peak_wind.joblib"]
MODEL_FILES += [f"y_{v}_{L}.joblib" for L in C.LEADS_H for v in ("dlat", "dlon", "dwind")]
missing = []
for name in MODEL_FILES:
    src = OUT / "models" / name
    if src.exists():
        shutil.copy2(src, STAGE / "models" / name)
    else:
        missing.append(name)
print(f"models: {len(MODEL_FILES) - len(missing)}/{len(MODEL_FILES)} copied", "| MISSING:" if missing else "", *missing)

# 1b) portable JSON copies of the XGBoost storm models ---------------------------
import joblib  # noqa: E402
n_json = 0
for name in [f for f in MODEL_FILES if f.startswith("y_") and f.endswith(".joblib")]:
    src = OUT / "models" / name
    if not src.exists():
        continue
    try:
        m = joblib.load(src)
        if hasattr(m, "get_booster"):                     # XGBRegressor / XGBClassifier
            m.save_model(str(STAGE / "models" / name.replace(".joblib", ".json")))
            n_json += 1
    except Exception as e:
        print("  JSON conversion skipped for", name, ":", e)
print(f"models converted to JSON: {n_json}")

# 2) test results (Model Performance page) ------------------------------------
n = 0
for f in (OUT / "results").glob("*.csv"):
    shutil.copy2(f, STAGE / "results" / f.name)
    n += 1
print(f"results: {n} csv files")

# 3) replay table: unseen test storms, features exactly as used in notebook 06 --
df = load_table(OUT / "tables" / "storm_fixes")
test = df[df["split"] == "test"].sort_values(["SID", "time"]).copy()
test["test_group"] = test["year"].map(C.test_group)          # "main" (TEST years) or "recent"
test.to_csv(STAGE / "replay" / "replay_storm_fixes.csv", index=False)
print(f"replay: {len(test)} rows, {test.SID.nunique()} storms:",
      ", ".join(sorted(test.groupby('SID')['NAME'].first().astype(str).str.title().unique())))

# 3b) split years + test storm list, so the website labels come from the data ------
storms = (test.groupby("SID").agg(name=("NAME", "first"), group=("test_group", "first"), start=("time", "min"),
                                  end=("time", "max"), peak_kt=("wind", "max")).reset_index().sort_values("start"))
info = C.split_info()
info["test_storms"] = [dict(sid=r.SID, name=str(r.name).title(), group=r.group, start=str(r.start), end=str(r.end),
                            peak_kt=None if r.peak_kt != r.peak_kt else float(r.peak_kt)) for r in storms.itertuples()]
(STAGE / "results" / "split_info.json").write_text(json.dumps(info, indent=1))
print("split info:", {k: v for k, v in info.items() if k != "test_storms"})

# 4) ERA5 land-sea mask on the model grid (GFS land mask differs slightly) -------
try:
    from src import io_era5
    lsm = io_era5.load_lsm()
    np.save(STAGE / "data" / "lsm.npy", lsm.astype("float32"))
    print("land-sea mask:", lsm.shape)
except Exception as e:  # optional
    print("land-sea mask skipped:", e)
if C.DISTRICTS_FILE.exists():
    shutil.copy2(C.DISTRICTS_FILE, STAGE / "data" / C.DISTRICTS_FILE.name)
    print("district boundaries copied")

# 5) library versions: install the SAME xgboost / scikit-learn versions in the backend ---------
import importlib
vers = []
for lib in ("xgboost", "sklearn", "lightgbm", "catboost", "numpy", "pandas", "scipy", "joblib"):
    try:
        vers.append(f"{'scikit-learn' if lib == 'sklearn' else lib}=={importlib.import_module(lib).__version__}")
    except ImportError:
        pass
(STAGE / "versions.txt").write_text("\n".join(vers) + "\n")
print("training library versions:", ", ".join(vers))

# 6) zip -> Drive ---------------------------------------------------------------
zpath = OUT / "backend_artifacts.zip"
with zipfile.ZipFile("/content/backend_artifacts.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in STAGE.rglob("*"):
        if f.is_file():
            z.write(f, f.relative_to(STAGE))
shutil.copy2("/content/backend_artifacts.zip", zpath)
print(f"\nDONE -> {zpath}  ({zpath.stat().st_size / 1e6:.1f} MB)")
print("Download it and unzip into backend/artifacts/ of the GitHub repo.")
