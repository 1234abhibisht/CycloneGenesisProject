# Cyclone Early-Warning System — North Indian Ocean
**SIH26070 · Team VectorMinds**

Machine-learning cyclone guidance for the Bay of Bengal and Arabian Sea. It is trained on ERA5 (1990–2008) and IBTrACS, and runs live on NOAA GFS.

| Part | What it predicts | Model | Unseen test storms 2007-08 |
|---|---|---|---|
| **Occurrence** | Chance of a cyclone (D-DD / CS / SCS+) within **200 km in the next 24 h**, on every 0.5° sea cell | XGBoost + calibration | Brier skill **+19 %** vs persistence; catches **96 %** of events with 0.09 false-alarm zones per forecast |
| **Track** | Storm centre at **+6 / +12 / +18 / +24 h** | XGBoost | 24 h error **126 km** (CLIPER 164 km, **−23 %**) |
| **Intensity** | Max wind at +6 … +24 h, rapid intensification, lifetime peak | XGBoost | 24 h error **8.4 kt** (SHIFOR 10.9 kt, **−23 %**); RI ROC-AUC 0.80 |
| **District strike** | Chance that the storm centre passes within 100 km of each coastal district (0–24 h). Shown as red ≥50 %, orange ≥25 %, yellow ≥10 %, green below 10 % | Monte Carlo on the model's own past errors | Brier skill **+61 %** vs climatology |

This system gives no pressure forecast and has no storm-surge model. It is model guidance for research, **not an official warning**; always follow IMD / RSMC New Delhi.

```
cyclone-early-warning/
├── backend/            Flask API + live pipeline (Python)
│   ├── app.py              API server (port 8000) + background scheduler
│   ├── run_pipeline.py     run one live cycle from the command line
│   ├── pipeline/           gfs.py (NOAA download + ERA5-style fields), storms.py (IBTrACS ACTIVE / GDACS / manual),
│   │                       models.py, forecast.py, live.py, replay.py, performance.py
│   ├── cyclone_core/       the exact feature code used in training (same as training/src)
│   ├── artifacts/          trained models + test results + replay storms (from Colab)
│   ├── data/               created at run time: data/gfs/ (last 48 h of GFS files) + cyclone.db (SQLite)
│   └── tests/              offline end-to-end test (no internet, no real models needed)
├── frontend/           React + Vite + Tailwind dashboard (port 3000)
├── training/           Colab notebooks 00-06 + src/ used to train the models
└── scripts/            export_artifacts_colab.py (package models), gfs_download_to_drive.py (optional)
```

## How the live system works

```
every 60 min
 NOAA NOMADS GFS 0.25° ──► backend/data/gfs/  (last 48 h kept on disk; older files deleted)
   (f000 + f003 + f006 of each 6-hourly cycle, only 5-35°N 55-100°E and only the variables the models use)
        │  converted to the ERA5 names, units and levels used in training (same 0.25° grid)
        ▼
 training-identical features (cyclone_core) ──► occurrence map for the whole basin
        │
 IBTrACS ACTIVE + GDACS + manual positions ──► SQLite storm_fixes
        │
        ▼
 per active storm: track +6..24 h, wind +6..24 h, RI, peak, district strike probabilities ──► SQLite forecasts
        │
        ▼
 Flask API /api/...  ──►  React dashboard
```

* **Why 48 h of GFS?** The features look back 24 h: pressure falls, 24 h rainfall, and "is the vortex growing". Keeping 48 h means a missed or late GFS run never leaves a hole. The GRIB files stay on disk (typically a few hundred MB). SQLite stores only the storm positions, forecasts, occurrence maps and the run log.
* **Replay mode** (switch in the top bar) shows the real model output for the unseen 2007-08 test storms, such as Sidr and Nargis. At every step you can see the forecast next to what actually happened. Use it for demos when no cyclone is active.

---

## 1. Put the trained models in place (one time)

1. In Colab, after notebooks 00–06 have run, run `scripts/export_artifacts_colab.py` (see the comment at its top).
2. Download `MyDrive/CycloneProject/outputs/backend_artifacts.zip`.
3. Unzip it into `backend/artifacts/`, so that you have `backend/artifacts/models/occurrence_xgb.json`, `backend/artifacts/replay/replay_storm_fixes.csv`, and so on.

The repository already contains the small files: feature lists, threshold, cone radii and the test-result CSVs. The Model Performance page therefore works before the step above. Forecasts need the model files.

## 2. Run on localhost

You need **Python 3.10–3.12** and **Node.js 20+**.

### Backend (terminal 1)

Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
macOS / Linux:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:8000/api/system/status. It should say `"status": "OPERATIONAL"` and list the models it loaded.

About 3 s after start the backend begins downloading the last 48 h of GFS. The first run takes a few minutes, and after that it updates every 60 min. Watch progress in the terminal, or on the **Data & sources** page.

**If the model files fail to load** (look for `errors` in `/api/system/status`), install the library versions used in Colab. `artifacts/versions.txt` lists them. For example:
```bash
pip install "xgboost==<version from versions.txt>" "scikit-learn==<version from versions.txt>"
```

**If `cfgrib` / `eccodes` does not install** (this sometimes happens on Windows), use conda: `conda install -c conda-forge cfgrib eccodes`. The API, replay mode and Model Performance page all work without it; only live GFS reading needs it.

### Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000**. The frontend calls `http://127.0.0.1:8000/api` by default; change this with `frontend/.env` (see `.env.example`).

### Quick demo
1. Top bar → **Replay**, then open **Forecast** or **Test-storm replay**, and move the slider through the storm.
2. **Basin Watch** shows the live 24 h formation probabilities from the latest GFS run.
3. **Data & sources** shows the GFS files on disk, pipeline runs and stored storm positions. You can also add a storm position by hand there (for example from an IMD bulletin) and press **Run live cycle now**.

### Useful commands
```bash
cd backend
python run_pipeline.py --download-only   # fetch the last 48 h of GFS now
python run_pipeline.py                   # one full live cycle (download + forecasts)
python run_pipeline.py --no-download     # recompute from the files already on disk
python tests/test_backend.py             # offline end-to-end test (synthetic data)
```

## 3. API (used by the frontend)

| Route | Returns |
|---|---|
| `GET /api/system/status` | models loaded, GFS files, SQLite counts, last pipeline runs |
| `GET /api/cyclone/active` | active storms (live) or the replay storm, or a standby response with the Bay of Bengal GFS baseline |
| `GET /api/cyclone/<id>/predictions` | +6/12/18/24 h track and wind, RI probability, peak (`<id>` may be `ACTIVE`) |
| `GET /api/cyclone/<id>/risk` | strike probability for every coastal district, plus warning tier and closest approach |
| `GET /api/basin/risk` · `/api/occurrence/grid` | occurrence probabilities per zone and per 0.5° cell |
| `GET /api/historical/catalog` · `/api/historical/<id>/replay?step=n` | test-storm replay |
| `GET /api/models/performance` | verified 2007-08 test scores |
| `GET /api/sql/records` | latest storm positions in SQLite |
| `GET/POST /api/mode` | `live` or `replay` |
| `POST /api/admin/refresh` · `/api/admin/fixes` · `/api/admin/reload-models` | run a cycle, add storm positions, reload models |

## 4. Deploy

** Deployed to render using our github repo.

## 5. Train again

Open `training/notebooks` in Colab in order 00 → 06. Each notebook says what it needs and what it writes. Then run `scripts/export_artifacts_colab.py` and replace `backend/artifacts/`.

## Known limitations
* The models were trained on ERA5 and run on GFS. The fields are converted to the same names, units, levels and grid, but GFS is not identical to ERA5; the skill scores above were measured on ERA5 inputs.
* Rapid intensification is rare in the data. Treat its probability as a ranking, not a calibrated chance.
* Forecasts go to 24 h only, matching what the models were trained and verified for.

## Data sources
ERA5 (Copernicus C3S) · IBTrACS v04r01 (NOAA NCEI) · NOAA GFS 0.25° (NOMADS) · GDACS · IMD RSMC New Delhi best tracks (via IBTrACS).
