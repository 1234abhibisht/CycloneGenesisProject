"""
End-to-end smoke test of the backend WITHOUT internet and WITHOUT the real trained models.

It builds:
  * fake GFS files (a synthetic vortex in the Bay of Bengal) read through a fake GRIB reader,
  * small scikit-learn stand-in models saved with the same file names as the Colab models,
  * a fake occurrence booster/calibrator,
  * a tiny replay table,
then runs one live pipeline cycle and calls every API route the frontend uses.

Run from backend/:   python tests/test_backend.py      (or: python -m pytest tests)
"""
import json
import os
import pickle
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd

TMP = Path(tempfile.mkdtemp(prefix="cyclone_test_"))
os.environ["CYCLONE_ARTIFACTS"] = str(TMP / "artifacts")
os.environ["CYCLONE_DATA"] = str(TMP / "data")
os.environ["AUTO_PIPELINE"] = "0"
os.environ["N_MC_TRACKS"] = "200"
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

import config as CFG  # noqa: E402

for d in (CFG.MODELS_DIR, CFG.RESULTS_DIR, CFG.REPLAY_DIR):
    d.mkdir(parents=True, exist_ok=True)

import db  # noqa: E402
from core import C, common, occurrence as OC  # noqa: E402
from pipeline import gfs, live, storms  # noqa: E402

T0 = pd.Timestamp("2026-05-20 12:00")
STORM = dict(lat=15.0, lon=87.0)        # centre of the synthetic vortex at T0


# ---------------------------------------------------------------- fake GFS
def fake_reader(path_str):
    name = Path(path_str).name                     # gfs_YYYYMMDD_HHz_fFFF.grib2
    cyc = pd.Timestamp(pd.to_datetime(name[4:16], format="%Y%m%d_%Hz"))
    fh = int(name.split("_f")[1][:3])
    vt = cyc + pd.Timedelta(hours=fh)
    lat, lon = gfs.grid()
    LA, LO = np.meshgrid(lat, lon, indexing="ij")
    hrs = (vt - T0).total_seconds() / 3600
    clat, clon = STORM["lat"] + 0.05 * hrs, STORM["lon"] - 0.03 * hrs  # moving NNW
    r = common.haversine(LA, LO, clat, clon)
    depth = 2500 * np.exp(-(r / 250) ** 2)
    land = ((LO < 80) & (LA > 12)) | (LA > 23)
    rng = np.random.default_rng(fh + cyc.hour)
    vt_wind = 25 * (r / 80) * np.exp(1 - r / 80)
    ang = np.arctan2(LA - clat, (LO - clon) * np.cos(np.radians(LA)))
    f = {
        "prmsl": (101000 - depth).astype("float32"),
        "skt": (302.5 - 0.1 * (LA - 15) + rng.normal(0, 0.1, LA.shape)).astype("float32"),
        "lsm": land.astype("float32"),
        "u10": (-vt_wind * np.sin(ang)).astype("float32"),
        "v10": (vt_wind * np.cos(ang)).astype("float32"),
        "t2m": np.full(LA.shape, 301.0, "float32"), "d2m": np.full(LA.shape, 297.0, "float32"),
        "tp:0-3": (20 * np.exp(-(r / 200) ** 2)).astype("float32"),
        "tp:0-6": (40 * np.exp(-(r / 200) ** 2)).astype("float32"),
    }
    for k, levels in gfs.PL_LEVELS.items():
        for lv in levels:
            if k == "r":
                a = 60 + 25 * np.exp(-(r / 300) ** 2)
            elif k == "t":
                a = {850: 290, 700: 282, 500: 268, 300: 243}[lv] + 2 * np.exp(-(r / 150) ** 2)
            elif k == "u":
                a = -vt_wind * np.sin(ang) * (lv / 1000) + (10 if lv <= 250 else 0)
            elif k == "v":
                a = vt_wind * np.cos(ang) * (lv / 1000)
            else:   # geopotential height (m); gfs.assemble_F multiplies by g
                a = {850: 1500, 500: 5850, 200: 12400}[lv] - depth / 100 * (lv / 850)
            f[(k, lv)] = np.asarray(a, "float32")
    return f


def make_gfs_files():
    for c in pd.date_range(T0 - pd.Timedelta(hours=30), T0, freq="6h"):
        for fh in (0, 3, 6):
            p = gfs.file_path(c, fh)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(b"GRIB fake")


# ---------------------------------------------------------------- fake models
class FakeBooster:
    pass


def fake_margins(booster, df, feats):
    """Margins that rise near low pressure, so the map has a hot spot."""
    msl = df["msl"].fillna(1010).to_numpy() if "msl" in df else np.full(len(df), 1010.0)
    s = np.clip((1008 - msl) / 5, -3, 4)
    return np.column_stack([np.zeros(len(df)), s - 1, s - 2, s - 3]).astype("float32")


def make_models(storm_cols, occ_cols):
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import Ridge
    from sklearn.pipeline import make_pipeline
    import joblib

    rng = np.random.default_rng(0)
    X = pd.DataFrame(rng.normal(size=(300, len(storm_cols))), columns=storm_cols)
    for L in C.LEADS_H:
        for tgt, scale in ((f"y_dlat_{L}", 0.05), (f"y_dlon_{L}", -0.03), (f"y_dwind_{L}", 0.4)):
            y = scale * L + rng.normal(0, 0.05 * L, len(X))
            joblib.dump(make_pipeline(SimpleImputer(), Ridge()).fit(X, y), CFG.MODELS_DIR / f"{tgt}.joblib")
    y_ri = (rng.random(len(X)) < 0.2).astype(int)
    joblib.dump(make_pipeline(SimpleImputer(), GradientBoostingClassifier(n_estimators=10)).fit(X, y_ri),
                CFG.MODELS_DIR / "y_ri.joblib")
    joblib.dump(make_pipeline(SimpleImputer(), Ridge()).fit(X, 60 + rng.normal(0, 10, len(X))),
                CFG.MODELS_DIR / "y_peak_wind.joblib")
    json.dump(storm_cols, open(CFG.MODELS_DIR / "storm_features.json", "w"))
    json.dump({"main_model": "XGBoost"}, open(CFG.MODELS_DIR / "storm_models_info.json", "w"))
    bank = np.column_stack([rng.normal(0, 0.3 * L / 24, 500) for L in C.LEADS_H] +
                           [rng.normal(0, 0.3 * L / 24, 500) for L in C.LEADS_H])
    np.save(CFG.MODELS_DIR / "track_error_bank.npy", bank)
    pd.DataFrame({"lead_h": C.LEADS_H, "radius_km_p67": [40, 70, 95, 120]}).to_csv(
        CFG.MODELS_DIR / "cone_radius.csv", index=False)
    # occurrence: fake booster file + a real (pickled) calibrator class from the training code
    (CFG.MODELS_DIR / "occurrence_xgb.json").write_text("{}")
    cal = OC.TemperatureScaling()
    cal.T = 1.0
    pickle.dump(cal, open(CFG.MODELS_DIR / "occurrence_calibrator.pkl", "wb"))
    json.dump(occ_cols, open(CFG.MODELS_DIR / "occurrence_features.json", "w"))
    json.dump({"threshold_p_cs_plus": 0.15}, open(CFG.MODELS_DIR / "occurrence_threshold.json", "w"))


def make_results():
    rows = []
    for m, base in (("XGBoost", 1.0), ("CLIPER", 1.3), ("Persistence", 1.6)):
        for L in C.LEADS_H:
            rows.append(dict(model=m, target="track", lead_h=L, track_error_km=base * 4 * L, mae_kt=np.nan))
            rows.append(dict(model=m, target="intensity", lead_h=L, track_error_km=np.nan, mae_kt=base * 0.3 * L))
    pd.DataFrame(rows).to_csv(CFG.RESULTS_DIR / "test_track_intensity.csv", index=False)
    pd.DataFrame({"brier": [0.1], "brier_climatology": [0.2], "lead_h": [24]}).to_csv(
        CFG.RESULTS_DIR / "test_strike.csv", index=False)


def make_replay(storm_cols):
    t = pd.date_range("2007-11-12 00:00", periods=12, freq="6h")
    rng = np.random.default_rng(1)
    df = pd.DataFrame({"SID": "2007314N10093", "NAME": "SIDR", "time": t,
                       "lat": np.linspace(10, 21, 12), "lon": np.linspace(92, 89.5, 12),
                       "wind": np.linspace(30, 115, 12), "pres": np.linspace(1000, 944, 12), "basin_bob": 1})
    for c in storm_cols:
        if c not in df:
            df[c] = rng.normal(size=len(df))
    df.to_csv(CFG.REPLAY_DIR / "replay_storm_fixes.csv", index=False)


# ---------------------------------------------------------------- the test
def test_end_to_end():
    db.init()
    make_gfs_files()
    gfs.read_grib = fake_reader                  # no eccodes needed
    storms.refresh = lambda: {"offline": True}   # no internet in tests
    OC.load_booster = lambda path: FakeBooster()
    OC.margins = fake_margins

    # storm positions as they would come from IBTrACS ACTIVE / GDACS / manual entry
    fixes = [dict(storm_id="TEST01", name="TESTSTORM", time=(T0 - pd.Timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                  lat=STORM["lat"] - 0.05 * h, lon=STORM["lon"] + 0.03 * h, wind=55 - h, pres=990 + h / 2,
                  source="MANUAL") for h in (24, 18, 12, 6, 0)]
    assert db.upsert_fixes(fixes) == 5

    # 1) GFS -> training-style features, and the storm feature row
    t0 = gfs.latest_valid_time()
    assert t0 == T0 + pd.Timedelta(hours=3), t0            # f003 of the 12Z cycle is the newest valid time
    F, have = gfs.assemble_F(T0)
    assert len(have) == len(F["time"]) == 9
    from core import features_grid
    feats, statics = features_grid.compute(F)
    X, why = live._storm_row(storms.fixes_frame("TEST01"), feats, statics, F, T0)
    assert X is not None, why
    meta = {"SID", "NAME", "time", "year", "split", "y_ri", "y_peak_wind", "y_peak_grade"}
    storm_cols = [c for c in X.columns if c not in meta and not c.startswith("y_")
                  and pd.api.types.is_numeric_dtype(X[c])]
    assert any(c.startswith("c_") or c.startswith("d") for c in storm_cols)
    # the live GFS path must produce every feature the REAL trained models expect (lists copied from Colab)
    real = BACKEND / "artifacts" / "models"
    if (real / "storm_features.json").exists():
        need = json.load(open(real / "storm_features.json"))
        assert not [c for c in need if c not in X.columns], "storm features missing in live path"
    occ_cols = ["lat", "lon", "month_sin", "month_cos"] + list(features_grid.GRID_FEATURES_STATIC) + \
               [k for k in feats if not k.startswith("_")]
    if (real / "occurrence_features.json").exists():
        need = json.load(open(real / "occurrence_features.json"))
        assert not [c for c in need if c not in occ_cols + ["persistence", "existing_system"]], \
            "occurrence features missing in live path"
    make_models(storm_cols, occ_cols)
    make_results()
    make_replay(storm_cols)

    # 2) API
    import app as API
    API.STORE.load()
    assert API.STORE.track_ready and API.STORE.intensity_ready and API.STORE.occurrence_ready, API.STORE.errors
    res = API._run_pipeline(download=False)
    assert res["status"] == "ok", res
    c = API.app.test_client()

    st = c.get("/api/system/status").get_json()
    assert st["status"] == "OPERATIONAL" and st["ml_inference_engine"]["intensity_horizons"] == ["6h", "12h", "18h", "24h"]

    act = c.get("/api/cyclone/active").get_json()
    assert act["active"] and act["data"][0]["id"] == "TEST01", act
    pred = c.get("/api/cyclone/TEST01/predictions").get_json()["data"]
    assert [p["forecastHour"] for p in pred["forecastPoints"]] == [6, 12, 18, 24]
    assert all("predictedPressure" not in p for p in pred["forecastPoints"])     # no pressure forecast
    assert all(p["lat"] is not None and p["predictedWind"] is not None for p in pred["forecastPoints"])
    risk = c.get("/api/cyclone/TEST01/risk").get_json()
    assert risk["stormId"] == "TEST01" and risk["summary"]["totalDistrictsEvaluated"] > 10
    d0 = risk["districts"][0]
    assert set(d0["strikeProbability"]) == {"6h", "12h", "18h", "24h"}
    assert d0["warningLevel"] in ("RED", "ORANGE", "YELLOW", "GREEN")

    basin = c.get("/api/basin/risk").get_json()["data"]
    assert basin["status"] == "LIVE" and len(basin["zones"]) == 7
    assert max(z["probability"] or 0 for z in basin["zones"]) > 0
    assert c.get("/api/districts/coastal").get_json()["total"] > 10
    assert c.get("/api/sql/records?limit=3").get_json()["total_count"] == 5

    perf = c.get("/api/models/performance").get_json()
    assert perf["available"] and perf["track"][0]["model"] == "XGBoost"

    cat = c.get("/api/historical/catalog").get_json()
    assert cat["total"] == 1
    rp = c.get("/api/historical/2007314N10093/replay?step=4").get_json()["data"]
    assert rp["replayState"]["currentStep"] == 4 and len(rp["forecast"]) == 4

    assert c.post("/api/mode", json={"mode": "replay"}).get_json()["success"]
    act = c.get("/api/cyclone/active").get_json()
    assert act["status"] == "REPLAY" and act["data"][0]["name"] == "Sidr"
    assert c.get("/api/cyclone/ACTIVE/predictions").status_code == 200
    assert c.post("/api/mode", json={"mode": "live"}).get_json()["success"]

    r = c.post("/api/admin/fixes", json=[{"stormId": "M1", "name": "MANUAL", "time": "2026-05-20T12:00Z",
                                          "lat": 12, "lon": 85, "wind": 35}]).get_json()
    assert r["inserted"] == 1
    print("backend end-to-end test passed; temp folder:", TMP)


if __name__ == "__main__":
    test_end_to_end()
