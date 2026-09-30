"""
Reference forecasts every model must beat.

Track     : persistence (continue last 6 h motion) and CLIPER-style regression
Intensity : persistence (no change) and SHIFOR-style regression
Occurrence: persistence (the class present within 200 km at t0)
CLIPER / SHIFOR here are linear regressions on climatology + persistence
predictors, the classic statistical benchmarks.
"""
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from . import config as C

CLIPER_X = ["dlat_p6", "dlon_p6", "dlat_p12", "dlon_p12", "lat", "lon", "month_sin", "month_cos", "wind"]
SHIFOR_X = ["wind", "dwind_p6", "dwind_p12", "dwind_p24", "lat", "lon", "month_sin", "month_cos", "speed_kmh"]


def track_persistence(df):
    out = {}
    for L in C.LEADS_H:
        for c in ("dlat", "dlon"):
            p6, p12 = df[f"{c}_p6"], df[f"{c}_p12"]
            out[f"y_{c}_{L}"] = np.where(p6.notna(), p6 * L / 6, np.where(p12.notna(), p12 * L / 12, 0.0))
    return pd.DataFrame(out, index=df.index)


def intensity_persistence(df):
    return pd.DataFrame({f"y_dwind_{L}": np.zeros(len(df)) for L in C.LEADS_H}, index=df.index)


def _lin():
    return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), Ridge(alpha=1.0))


class LinearBaseline:
    """Fits one linear regression per target on a fixed small predictor set."""

    def __init__(self, xcols, targets):
        self.xcols, self.targets, self.models = xcols, targets, {}

    def fit(self, df):
        for t in self.targets:
            ok = df[t].notna()
            self.models[t] = _lin().fit(df.loc[ok, self.xcols], df.loc[ok, t])
        return self

    def predict(self, df):
        return pd.DataFrame({t: m.predict(df[self.xcols]) for t, m in self.models.items()}, index=df.index)


def cliper(targets):
    return LinearBaseline(CLIPER_X, targets)


def shifor(targets):
    return LinearBaseline(SHIFOR_X, targets)


def occurrence_persistence_proba(persistence):
    """One-hot probabilities from the persistence class."""
    p = np.zeros((len(persistence), C.N_OCC))
    p[np.arange(len(persistence)), np.asarray(persistence, int)] = 1.0
    return p
