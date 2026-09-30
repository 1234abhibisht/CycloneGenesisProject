"""
Model zoo for the track / intensity comparison, with fair tuning.

Every model gets the same features and the same data. Hyper-parameters are
chosen by 5-fold cross-validation grouped by YEAR inside the training years,
so the validation years (2005-2006) stay untouched for the reported scores.
Libraries that are not installed are skipped with a message.
"""
import itertools
import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor, RandomForestClassifier, \
    RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import GroupKFold
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

from . import config as C

try:
    import xgboost as xgb
except ImportError:  # pragma: no cover
    xgb = None
try:
    import lightgbm as lgb
except ImportError:  # pragma: no cover
    lgb = None
try:
    from catboost import CatBoostClassifier, CatBoostRegressor
except ImportError:  # pragma: no cover
    CatBoostRegressor = CatBoostClassifier = None

SEED = C.RANDOM_SEED


def _imp(model, scale=False):
    steps = [SimpleImputer(strategy="median")]
    if scale:
        steps.append(StandardScaler())
    return make_pipeline(*steps, model)


# ------------------------------------------------------------------ regressors
def regressor_zoo():
    z = {
        "Ridge (linear)": (lambda **p: _imp(Ridge(**p), scale=True), {"alpha": [1.0, 10.0]}),
        "Decision Tree": (lambda **p: _imp(DecisionTreeRegressor(random_state=SEED, **p)),
                          {"max_depth": [4, 8], "min_samples_leaf": [20]}),
        "Random Forest": (lambda **p: _imp(RandomForestRegressor(n_estimators=300, n_jobs=-1, random_state=SEED, **p)),
                          {"max_depth": [8, None], "min_samples_leaf": [5]}),
        "Gradient Boosting": (lambda **p: _imp(GradientBoostingRegressor(random_state=SEED, **p)),
                              {"n_estimators": [300], "max_depth": [3], "learning_rate": [0.05]}),
        "SVM (SVR-RBF)": (lambda **p: _imp(SVR(**p), scale=True), {"C": [1.0, 10.0], "epsilon": [0.05]}),
    }
    if lgb is not None:
        z["LightGBM"] = (lambda **p: lgb.LGBMRegressor(random_state=SEED, verbose=-1, **p),
                         {"n_estimators": [400], "learning_rate": [0.03], "num_leaves": [15, 31],
                          "min_child_samples": [20]})
    if CatBoostRegressor is not None:
        z["CatBoost"] = (lambda **p: CatBoostRegressor(random_seed=SEED, verbose=0, **p),
                         {"iterations": [600], "learning_rate": [0.05], "depth": [4, 6]})
    if xgb is not None:
        z["XGBoost"] = (lambda **p: xgb.XGBRegressor(random_state=SEED, tree_method="hist", n_jobs=-1, **p),
                        {"n_estimators": [400], "learning_rate": [0.03], "max_depth": [3, 5],
                         "subsample": [0.8], "colsample_bytree": [0.8], "min_child_weight": [5],
                         "reg_lambda": [1.0]})
    else:
        warnings.warn("xgboost not installed - XGBoost row skipped")
    return z


def classifier_zoo():
    z = {
        "Logistic Regression": (lambda **p: _imp(LogisticRegression(max_iter=2000, **p), scale=True), {"C": [0.1, 1.0]}),
        "Naive Bayes": (lambda **p: _imp(GaussianNB(**p)), {"var_smoothing": [1e-9]}),
        "Decision Tree": (lambda **p: _imp(DecisionTreeClassifier(random_state=SEED, **p)),
                          {"max_depth": [3, 6], "min_samples_leaf": [20]}),
        "Random Forest": (lambda **p: _imp(RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=SEED, **p)),
                          {"max_depth": [8, None], "min_samples_leaf": [5]}),
        "Gradient Boosting": (lambda **p: _imp(GradientBoostingClassifier(random_state=SEED, **p)),
                              {"n_estimators": [300], "max_depth": [3], "learning_rate": [0.05]}),
        "SVM (RBF)": (lambda **p: _imp(SVC(probability=True, random_state=SEED, **p), scale=True), {"C": [1.0]}),
    }
    if lgb is not None:
        z["LightGBM"] = (lambda **p: lgb.LGBMClassifier(random_state=SEED, verbose=-1, **p),
                         {"n_estimators": [400], "learning_rate": [0.03], "num_leaves": [15]})
    if CatBoostClassifier is not None:
        z["CatBoost"] = (lambda **p: CatBoostClassifier(random_seed=SEED, verbose=0, **p),
                         {"iterations": [600], "learning_rate": [0.05], "depth": [4]})
    if xgb is not None:
        z["XGBoost"] = (lambda **p: xgb.XGBClassifier(random_state=SEED, tree_method="hist", n_jobs=-1,
                                                      eval_metric="logloss", **p),
                        {"n_estimators": [400], "learning_rate": [0.03], "max_depth": [3, 5],
                         "subsample": [0.8], "colsample_bytree": [0.8], "min_child_weight": [5]})
    return z


def _grid(params):
    keys = list(params)
    for vals in itertools.product(*[params[k] for k in keys]):
        yield dict(zip(keys, vals))


def _cv_score(make, params, X, y, groups, kind, n_splits=5):
    n_splits = min(n_splits, len(np.unique(groups)))
    scores = []
    for tr, te in GroupKFold(n_splits=n_splits).split(X, y, groups):
        m = make(**params)
        if kind == "clf" and len(np.unique(y[tr])) < 2:
            continue
        m.fit(X.iloc[tr], y[tr])
        if kind == "reg":
            scores.append(np.mean(np.abs(m.predict(X.iloc[te]) - y[te])))
        else:
            p = np.clip(m.predict_proba(X.iloc[te])[:, 1], 1e-6, 1 - 1e-6)
            scores.append(np.mean((p - y[te]) ** 2))
    return float(np.mean(scores)) if scores else np.inf


def tune(make, params, X, y, groups, kind="reg"):
    """Pick the parameter set with the best grouped-CV score (MAE or Brier)."""
    best, best_s = None, np.inf
    for p in _grid(params):
        s = _cv_score(make, p, X, y, groups, kind)
        if s < best_s:
            best, best_s = p, s
    return best, best_s


def oof_predictions(make, params, X, y, groups, n_splits=5):
    """Out-of-fold predictions on the training years (for stacking)."""
    n_splits = min(n_splits, len(np.unique(groups)))
    oof = np.full(len(y), np.nan)
    for tr, te in GroupKFold(n_splits=n_splits).split(X, y, groups):
        m = make(**params).fit(X.iloc[tr], y[tr])
        oof[te] = m.predict(X.iloc[te])
    return oof


# ------------------------------------------------------------------ feature lists
STORM_META = ["SID", "NAME", "time", "year", "month", "split"]


def storm_feature_columns(df):
    skip = set(STORM_META)
    return [c for c in df.columns if c not in skip and not c.startswith("y_")
            and pd.api.types.is_numeric_dtype(df[c])]


OCC_META = ["time", "year", "month", "hour", "label", "persistence", "existing_system", "hard", "w", "split"]


def occurrence_feature_columns(columns):
    return [c for c in columns if c not in OCC_META]
