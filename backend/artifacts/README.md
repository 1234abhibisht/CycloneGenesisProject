# Trained models go here

These files are produced by the Colab notebooks (training on ERA5 1990-2008 + IBTrACS) and are
**not** stored in git by default because of their size.

1. In Colab, after notebooks 00-06, run `scripts/export_artifacts_colab.py`.
2. Download `MyDrive/CycloneProject/outputs/backend_artifacts.zip`.
3. Unzip it **here** so the layout is:

```
artifacts/
  models/    occurrence_xgb.json, occurrence_calibrator.pkl, occurrence_features.json,
             occurrence_threshold.json, storm_features.json, storm_models_info.json,
             y_dlat_{6,12,18,24}.joblib, y_dlon_*.joblib, y_dwind_*.joblib,
             y_ri.joblib, y_peak_wind.joblib, track_error_bank.npy, cone_radius.csv
  results/   test_*.csv (2007-08 test scores shown on the Model Performance page)
  replay/    replay_storm_fixes.csv (unseen test storms for demo/replay mode)
  data/      lsm.npy (ERA5 land-sea mask), optional coastal_districts.geojson
  versions.txt   xgboost / scikit-learn versions used in Colab
```

4. Restart the backend (or `POST /api/admin/reload-models`).

Commit these files to GitHub with the code (the largest, occurrence_xgb.json, is about 28 MB - below GitHub's 100 MB limit,
so no Git LFS is needed).
