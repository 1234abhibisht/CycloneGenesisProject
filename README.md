# Sagar Drishti — Cyclone Early-Warning System for the North Indian Ocean
**SIH26070 · Team VectorMinds**

Machine-learning cyclone guidance for the Bay of Bengal and Arabian Sea. It is trained on ERA5 (1990–2023) and IBTrACS, and runs live on NOAA GFS.

**Data split (by year, so no storm appears in two sets):**

| Set | Years | Used for |
|---|---|---|
| Train | 1990–2016 | fitting the models |
| Validation | 2017–2018 | tuning, and the uncertainty-cone radii |
| Calibration | 2019–2020 | probability calibration and the occurrence threshold |
| **Test** | **2021–2023** (34 storms) | final scores below — never seen in training or tuning |
| Recent test | Oct–Dec 2025 (Montha, Ditwah, Shakhti, Senyar + 2 depressions) | extra check on the newest storms |

| Part | What it predicts | Model | Unseen test storms 2021–23 |
|---|---|---|---|
| **Occurrence** | Chance of a cyclone (D-DD / CS / SCS+) within **200 km in the next 24 h**, on every 0.5° sea cell | XGBoost + calibration | Brier skill **+19 %** vs persistence; catches **94 %** of events with 0.10 false-alarm zones per forecast |
| **Track** | Storm centre at **+6 / +12 / +18 / +24 h** | XGBoost | Mean error **32 / 59 / 86 / 113 km** at +6/12/18/24 h (CLIPER 143 km at 24 h, **−21 %**). Uncertainty cone (67th percentile of validation errors): 33 / 64 / 98 / 126 km |
| **Intensity** | Max wind at +6 … +24 h, rapid intensification, lifetime peak | XGBoost | Mean error **2.7 / 4.1 / 5.3 / 6.5 kt** at +6/12/18/24 h (SHIFOR 9.5 kt at 24 h, **−32 %**); RI ROC-AUC **0.905**; lifetime peak 9.1 kt (31 % better than baseline) |
| **District strike** | Chance that the storm centre passes within 100 km of each coastal district (0–24 h). Shown as red ≥50 %, orange ≥25 %, yellow ≥10 %, green below 10 % | Monte Carlo (1,000 tracks) on the model's own past errors | Brier skill **+82 % (0–6 h) to +63 % (0–24 h)** vs climatology; orange-tier F1 **0.74** |

On the recent Oct–Dec 2025 storms: 24 h track error 136 km (CLIPER 161 km), 24 h wind error 4.1 kt (SHIFOR 5.9 kt), strike Brier skill 54–66 %. Case study: for Cyclone Montha (Oct 2025) the model marked Krishna and West Godavari red, and the storm crossed the coast between them.

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
* **Test-storm pages** (Explore → Forecast (Test Storms) and District Strike Rate (Test Storms)) show the real model output for the unseen 2021–23 and 2025 test storms; they open on Cyclone Montha. At every step you can see the forecast next to what actually happened. Use it for demos when no cyclone is active.


## 3. API (used by the frontend)

| Route | Returns |
|---|---|
| `GET /api/system/status` | models loaded, GFS files, SQLite counts, last pipeline runs |
| `GET /api/cyclone/active` | active storms (live) or the replay storm, or a standby response with the Bay of Bengal GFS baseline |
| `GET /api/cyclone/<id>/predictions` | +6/12/18/24 h track and wind, RI probability, peak (`<id>` may be `ACTIVE`) |
| `GET /api/cyclone/<id>/risk` | strike probability for every coastal district, plus warning tier and closest approach |
| `GET /api/basin/risk` · `/api/occurrence/grid` | occurrence probabilities per zone and per 0.5° cell |
| `GET /api/historical/catalog` · `/api/historical/<id>/replay?step=n` | test-storm replay |
| `GET /api/models/performance` | verified 2021–23 test scores |
| `GET /api/sql/records` | latest storm positions in SQLite |
| `GET/POST /api/mode` | `live` or `replay` |
| `POST /api/admin/refresh` · `/api/admin/fixes` · `/api/admin/reload-models` | run a cycle, add storm positions, reload models |


## 4. Deploy

** Deployed to render using our github repo.


## Known limitations
* The models were trained on ERA5 and run on GFS. The fields are converted to the same names, units, levels and grid, but GFS is not identical to ERA5; the skill scores above were measured on ERA5 inputs.
* Rapid intensification is rare in the data. Treat its probability as a ranking, not a calibrated chance.
* Forecasts go to 24 h only, matching what the models were trained and verified for.

## Data sources
ERA5 (Copernicus C3S) · IBTrACS v04r01 (NOAA NCEI) · NOAA GFS 0.25° (NOMADS) · GDACS · IMD RSMC New Delhi best tracks (via IBTrACS).
