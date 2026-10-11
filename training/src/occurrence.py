"""
Occurrence model: XGBoost multi-class + small-data-safe calibration.

Calibration candidates (chosen by cross-fitting the two calibration years, C.CAL):
  * temperature scaling  : one parameter, divides all margins by T
  * L2 logistic on margins: multinomial logistic regression on the raw margins
"""
import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar
from scipy.special import softmax
from sklearn.linear_model import LogisticRegression

from . import config as C
from .common import list_tables, load_many
from .metrics import logloss_multi


def load_split(folder, years, columns=None):
    a, b = years
    files = [f for f in list_tables(folder) if a <= int(f.stem[:4]) <= b]
    return load_many(files, columns=columns)


XGB_PARAMS = dict(objective="multi:softprob", num_class=C.N_OCC, tree_method="hist", max_depth=8,
                  eta=0.05, subsample=0.8, colsample_bytree=0.8, min_child_weight=50, reg_lambda=2.0,
                  max_bin=256, eval_metric="mlogloss", seed=C.RANDOM_SEED, nthread=-1)


def train_xgb(train, val, feats, params=None, rounds=3000, early=100, device="cpu"):
    import xgboost as xgb
    p = dict(XGB_PARAMS, **(params or {}), device=device)
    dtr = xgb.QuantileDMatrix(train[feats].astype("float32"), label=train["label"], weight=train["w"])
    dva = xgb.QuantileDMatrix(val[feats].astype("float32"), label=val["label"], weight=val["w"], ref=dtr)
    booster = xgb.train(p, dtr, num_boost_round=rounds, evals=[(dtr, "train"), (dva, "val")],
                        early_stopping_rounds=early, verbose_eval=100)
    return booster


def margins(booster, df, feats):
    import xgboost as xgb
    d = xgb.DMatrix(df[feats].astype("float32"))
    try:
        best = booster.best_iteration
    except (AttributeError, ValueError):
        best = None
    rng = (0, best + 1) if best is not None else (0, 0)
    return booster.predict(d, output_margin=True, iteration_range=rng)


def load_booster(path):
    import xgboost as xgb
    b = xgb.Booster()
    b.load_model(str(path))
    return b


# ------------------------------------------------------------------ calibrators
class TemperatureScaling:
    name = "temperature"

    def fit(self, M, y, w):
        f = lambda T: logloss_multi(y, softmax(M / T, axis=1), w)
        self.T = minimize_scalar(f, bounds=(0.2, 10.0), method="bounded").x
        return self

    def predict(self, M):
        return softmax(M / self.T, axis=1)


class LogisticOnMargins:
    name = "logistic_L2"

    def __init__(self, Creg=1.0):
        self.Creg = Creg

    def fit(self, M, y, w):
        self.m = LogisticRegression(C=self.Creg, max_iter=2000).fit(M, y, sample_weight=w)
        return self

    def predict(self, M):
        P = np.zeros((len(M), C.N_OCC))
        P[:, self.m.classes_] = self.m.predict_proba(M)
        return P


def crossfit_calibration(M, y, w, years, candidates=None):
    """
    Fit each calibrator on one calibration year and score it on the other, both ways.
    Returns (scores DataFrame, winner name, out-of-fold calibrated probabilities).
    """
    candidates = candidates or {"temperature": lambda: TemperatureScaling(),
                                "logistic_L2_C1": lambda: LogisticOnMargins(1.0),
                                "logistic_L2_C0.1": lambda: LogisticOnMargins(0.1)}
    yrs = sorted(np.unique(years))
    assert len(yrs) == 2, f"cross-fit needs exactly two calibration years, got {yrs}"
    rows, oof = [], {}
    for name, make in candidates.items():
        P_oof = np.zeros((len(y), C.N_OCC))
        for fit_y, score_y in ((yrs[0], yrs[1]), (yrs[1], yrs[0])):
            a, b = years == fit_y, years == score_y
            cal = make().fit(M[a], y[a], w[a])
            P_oof[b] = cal.predict(M[b])
            rows.append(dict(calibrator=name, fit_year=fit_y, score_year=score_y,
                             logloss=logloss_multi(y[b], P_oof[b], w[b])))
        oof[name] = P_oof
    scores = pd.DataFrame(rows)
    mean = scores.groupby("calibrator")["logloss"].mean()
    best = mean.idxmin()
    # prefer the 1-parameter model when scores are within 0.5%
    if "temperature" in mean and mean["temperature"] <= mean[best] * 1.005:
        best = "temperature"
    return scores, best, oof[best], candidates[best]


def uncalibrated(M):
    return softmax(M, axis=1)
