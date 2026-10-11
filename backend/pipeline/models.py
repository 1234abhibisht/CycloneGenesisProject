"""
Loads the trained models saved by the Colab notebooks (outputs/models on Drive):

  occurrence_xgb.json, occurrence_calibrator.pkl, occurrence_features.json, occurrence_threshold.json
  storm_features.json, storm_models_info.json
  y_dlat_{6,12,18,24}.joblib, y_dlon_*.joblib, y_dwind_*.joblib, y_ri.joblib, y_peak_wind.joblib
  track_error_bank.npy, cone_radius.csv
"""
import json
import logging
import pickle

import joblib
import numpy as np
import pandas as pd

import config as CFG
from core import C, occurrence as OC

log = logging.getLogger("models")

LEADS = list(C.LEADS_H)
TARGET_TRACK = [f"y_{c}_{L}" for L in LEADS for c in ("dlat", "dlon")]
TARGET_INT = [f"y_dwind_{L}" for L in LEADS]


def _load_storm_model(folder, target, classifier=False):
    """
    Prefer the portable XGBoost JSON file (<target>.json, made by scripts/convert_models_to_json_colab.py);
    fall back to the joblib pickle. Pickled XGBoost models are not always loadable on another OS / build
    ("XGBoostError: input stream corrupted"), JSON always is.
    """
    js = folder / f"{target}.json"
    if js.exists():
        import xgboost as xgb
        m = xgb.XGBClassifier() if classifier else xgb.XGBRegressor()
        m.load_model(str(js))
        return m
    return joblib.load(folder / f"{target}.joblib")


class ModelStore:
    def __init__(self, folder=None):
        self.folder = folder or CFG.MODELS_DIR
        self.errors = []
        self.occ_booster = self.occ_cal = None
        self.occ_feats, self.occ_threshold = [], 0.15
        self.storm_feats, self.storm_models, self.main_model = [], {}, None
        self.ri_model = self.peak_model = None
        self.err_bank, self.cone = None, {}
        self.load()

    # ------------------------------------------------------------ loading
    def _try(self, what, fn):
        try:
            return fn()
        except Exception as e:
            self.errors.append(f"{what}: {e.__class__.__name__}: {e}")
            log.warning("could not load %s: %s", what, e)
            return None

    def load(self):
        f = self.folder
        self.errors = []
        self.occ_feats = self._try("occurrence_features.json", lambda: json.load(open(f / "occurrence_features.json"))) or []
        self.occ_booster = self._try("occurrence_xgb.json", lambda: OC.load_booster(f / "occurrence_xgb.json"))
        self.occ_cal = self._try("occurrence_calibrator.pkl", lambda: pickle.load(open(f / "occurrence_calibrator.pkl", "rb")))
        thr = self._try("occurrence_threshold.json", lambda: json.load(open(f / "occurrence_threshold.json")))
        self.occ_threshold = float(thr.get("threshold_p_cs_plus", 0.15)) if thr else 0.15

        self.storm_feats = self._try("storm_features.json", lambda: json.load(open(f / "storm_features.json"))) or []
        info = self._try("storm_models_info.json", lambda: json.load(open(f / "storm_models_info.json"))) or {}
        self.main_model = info.get("main_model", "XGBoost")
        self.storm_models = {}
        for t in TARGET_TRACK + TARGET_INT:
            m = self._try(t, lambda t=t: _load_storm_model(f, t))
            if m is not None:
                self.storm_models[t] = m
        self.ri_model = self._try("y_ri", lambda: _load_storm_model(f, "y_ri", classifier=True))
        self.peak_model = self._try("y_peak_wind", lambda: _load_storm_model(f, "y_peak_wind"))
        self.err_bank = self._try("track_error_bank.npy", lambda: np.load(f / "track_error_bank.npy"))
        cone = self._try("cone_radius.csv", lambda: pd.read_csv(f / "cone_radius.csv"))
        self.cone = ({int(r.lead_h): float(r.radius_km_p67) for r in cone.itertuples()}
                     if cone is not None else {})
        log.info("models loaded: occurrence=%s track/intensity=%d/%d ri=%s peak=%s",
                 self.occurrence_ready, len([t for t in TARGET_TRACK if t in self.storm_models]),
                 len([t for t in TARGET_INT if t in self.storm_models]), self.ri_model is not None,
                 self.peak_model is not None)

    # ------------------------------------------------------------ status
    @property
    def occurrence_ready(self):
        return self.occ_booster is not None and self.occ_cal is not None and bool(self.occ_feats)

    @property
    def track_ready(self):
        return bool(self.storm_feats) and all(t in self.storm_models for t in TARGET_TRACK)

    @property
    def intensity_ready(self):
        return bool(self.storm_feats) and all(t in self.storm_models for t in TARGET_INT)

    @property
    def any_ready(self):
        return self.occurrence_ready or self.track_ready

    def status(self):
        return {"folder": str(self.folder), "main_model": self.main_model,
                "occurrence": self.occurrence_ready, "track": self.track_ready,
                "intensity": self.intensity_ready, "rapid_intensification": self.ri_model is not None,
                "peak_intensity": self.peak_model is not None, "error_bank_rows":
                    0 if self.err_bank is None else int(len(self.err_bank)),
                "warning_threshold_p_cs_plus": self.occ_threshold, "errors": self.errors}

    # ------------------------------------------------------------ predictions
    def occurrence_proba(self, df):
        """(N, 4) calibrated probabilities of none / D-DD / CS / SCS+ within 200 km in 24 h."""
        X = df.reindex(columns=self.occ_feats)
        return self.occ_cal.predict(OC.margins(self.occ_booster, X, self.occ_feats))

    def storm_predict(self, X):
        """X: DataFrame (rows = storm times) with the storm feature columns (missing ones become NaN)."""
        X = X.reindex(columns=self.storm_feats).astype("float64")
        out = {t: np.asarray(m.predict(X), dtype="float64") for t, m in self.storm_models.items()}
        if self.ri_model is not None:
            out["p_ri"] = np.asarray(self.ri_model.predict_proba(X)[:, 1], dtype="float64")
        if self.peak_model is not None:
            out["peak"] = np.asarray(self.peak_model.predict(X), dtype="float64")
        return out
