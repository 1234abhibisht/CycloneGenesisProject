"""Scores: track error, intensity error, probability scores, reliability, zone-based event scores."""
import numpy as np
import pandas as pd
from scipy import ndimage

from . import config as C
from .common import haversine


# ------------------------------------------------------------------ regression
def mae(y, p):
    ok = np.isfinite(y) & np.isfinite(p)
    return float(np.mean(np.abs(y[ok] - p[ok]))) if ok.any() else np.nan


def rmse(y, p):
    ok = np.isfinite(y) & np.isfinite(p)
    return float(np.sqrt(np.mean((y[ok] - p[ok]) ** 2))) if ok.any() else np.nan


def bias(y, p):
    ok = np.isfinite(y) & np.isfinite(p)
    return float(np.mean(p[ok] - y[ok])) if ok.any() else np.nan


def track_error_km(df, pred, L):
    """Great-circle distance between predicted and true position at lead L (per row)."""
    lat0, lon0 = df["lat"].values, df["lon"].values
    tl = lat0 + df[f"y_dlat_{L}"].values
    tn = lon0 + df[f"y_dlon_{L}"].values
    pl = lat0 + np.asarray(pred[f"y_dlat_{L}"])
    pn = lon0 + np.asarray(pred[f"y_dlon_{L}"])
    return haversine(tl, tn, pl, pn)


def skill(err, err_ref):
    return 100.0 * (1.0 - err / err_ref) if err_ref and np.isfinite(err_ref) else np.nan


# ------------------------------------------------------------------ probabilities
def brier_multi(y, P, w=None):
    Y = np.zeros_like(P)
    Y[np.arange(len(y)), np.asarray(y, int)] = 1
    s = ((P - Y) ** 2).sum(axis=1)
    return float(np.average(s, weights=w))


def logloss_multi(y, P, w=None, eps=1e-7):
    p = np.clip(P[np.arange(len(y)), np.asarray(y, int)], eps, 1)
    return float(np.average(-np.log(p), weights=w))


def brier_binary(y, p, w=None):
    return float(np.average((np.asarray(p) - np.asarray(y)) ** 2, weights=w))


def reliability(y, p, w=None, bins=10):
    """Table of mean forecast vs observed frequency per probability bin."""
    y, p = np.asarray(y, float), np.asarray(p, float)
    w = np.ones_like(p) if w is None else np.asarray(w, float)
    edges = np.linspace(0, 1, bins + 1)
    b = np.clip(np.digitize(p, edges) - 1, 0, bins - 1)
    rows = []
    for k in range(bins):
        m = b == k
        if m.any():
            rows.append(dict(bin_lo=edges[k], bin_hi=edges[k + 1], n=int(m.sum()), weight=float(w[m].sum()),
                             mean_forecast=float(np.average(p[m], weights=w[m])),
                             observed=float(np.average(y[m], weights=w[m]))))
    return pd.DataFrame(rows)


def by_group(df, fn):
    """Apply fn(sub_df) to Group A (system present), Group B (no system) and all rows."""
    out = {"A_system_present": fn(df[df.existing_system == 1]),
           "B_no_system": fn(df[df.existing_system == 0]),
           "all": fn(df)}
    return out


# ------------------------------------------------------------------ zones / events
def _grid_index(df):
    lats = np.round(np.arange(C.DOMAIN["lat_min"], C.DOMAIN["lat_max"] + 1e-9, C.RES * C.TABLE_STEP), 3)
    lons = np.round(np.arange(C.DOMAIN["lon_min"], C.DOMAIN["lon_max"] + 1e-9, C.RES * C.TABLE_STEP), 3)
    iy = np.searchsorted(lats, np.round(df["lat"].values, 3))
    ix = np.searchsorted(lons, np.round(df["lon"].values, 3))
    return lats, lons, iy, ix


def event_scores(full_df, prob_col, tp, thresholds, min_class=2):
    """
    full_df: every kept cell at each evaluation issue time, with a probability column
             P(class >= min_class within 200 km in 24 h) and 'label'.
    tp: tracks.TrackPoints.
    Returns DataFrame per threshold: event hit rate and false-alarm zones per forecast.
    Events are (storm, issue time) pairs where the storm reaches class >= min_class in (t0, t0+24h].
    """
    lats, lons, iy, ix = _grid_index(full_df)
    df = full_df.assign(_iy=iy, _ix=ix)
    struct = np.ones((3, 3), bool)
    res = {thr: dict(hits=0, events=0, false_zones=0, zones=0) for thr in thresholds}
    n_fc = 0
    for t, g in df.groupby("time"):
        n_fc += 1
        P = np.zeros((len(lats), len(lons)), "float32")
        Lb = np.zeros((len(lats), len(lons)), "int8")
        P[g._iy, g._ix] = g[prob_col].values
        Lb[g._iy, g._ix] = g["label"].values
        t0 = np.datetime64(t, "h").astype("int64")
        idx = tp.window(t0, t0 + C.LABEL_WINDOW_H)
        idx = idx[tp.cls[idx] >= min_class]
        storms = {s: idx[tp.sid[idx] == s] for s in np.unique(tp.sid[idx])}
        for thr in thresholds:
            z, nz = ndimage.label(P >= thr, structure=struct)
            r = res[thr]
            r["zones"] += nz
            if nz:
                has_event = ndimage.maximum(Lb >= min_class, labels=z, index=np.arange(1, nz + 1))
                r["false_zones"] += int(np.sum(~np.asarray(has_event, bool)))
            zy, zx = np.nonzero(z > 0)
            for s, pts in storms.items():
                r["events"] += 1
                if zy.size:
                    d = haversine(lats[zy][:, None], lons[zx][:, None], tp.lat[pts][None], tp.lon[pts][None])
                    r["hits"] += int((d <= C.LABEL_RADIUS_KM).any())
    rows = []
    for thr, r in res.items():
        rows.append(dict(threshold=thr, events=r["events"],
                         hit_rate=r["hits"] / r["events"] if r["events"] else np.nan,
                         false_zones_per_forecast=r["false_zones"] / max(n_fc, 1),
                         zones_per_forecast=r["zones"] / max(n_fc, 1), forecasts=n_fc))
    return pd.DataFrame(rows)
