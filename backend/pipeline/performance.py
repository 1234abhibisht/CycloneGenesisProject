"""Verified model scores from the Colab notebooks (artifacts/results/*.csv) for the Model Performance page."""
import numpy as np
import pandas as pd

import config as CFG


def _csv(name, **kw):
    p = CFG.RESULTS_DIR / name
    return pd.read_csv(p, **kw) if p.exists() else None


def _records(df):
    if df is None:
        return []
    return df.replace({np.nan: None}).to_dict(orient="records")


def summary():
    ti = _csv("test_track_intensity.csv")
    track, intensity = [], []
    if ti is not None:
        for (model, target), g in ti.groupby(["model", "target"]):
            row = {"model": model}
            for r in g.itertuples():
                val = r.track_error_km if target == "track" else r.mae_kt
                row[f"+{int(r.lead_h)}h"] = None if pd.isna(val) else round(float(val), 1)
            (track if target == "track" else intensity).append(row)
    order = lambda rows: sorted(rows, key=lambda r: r.get("+24h") or 1e9)  # noqa: E731
    occ = _csv("test_occurrence_groups.csv", index_col=0)
    ev = _csv("test_occurrence_events.csv")
    strike = _csv("test_strike.csv")
    if strike is not None:
        strike["skill_vs_climatology_pct"] = 100 * (1 - strike["brier"] / strike["brier_climatology"])
    imp = _csv("occurrence_feature_importance.csv")
    features = []
    if imp is not None and len(imp.columns) >= 2:
        s = imp.set_index(imp.columns[0])[imp.columns[1]]
        s = (s / s.sum()).sort_values(ascending=False).head(12)
        features = [{"name": k, "importance": round(100 * float(v), 1)} for k, v in s.items()]
    return {
        "testPeriod": "2007-2008 (storms never used for training, tuning or calibration)",
        "track": order(track), "intensity": order(intensity),
        "occurrenceGroups": [] if occ is None else [{"group": i, **{k: (None if pd.isna(v) else float(v))
                                                                     for k, v in r.items()}} for i, r in occ.iterrows()],
        "occurrenceEvents": _records(ev), "strike": _records(strike),
        "rapidIntensification": _records(_csv("test_ri.csv")), "peak": _records(_csv("test_peak.csv")),
        "featureImportance": features,
        "available": ti is not None,
    }
