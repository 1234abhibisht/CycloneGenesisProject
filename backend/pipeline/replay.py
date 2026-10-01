"""
Historical replay: the unseen TEST storms (2007-2008: Sidr, Nargis, Nisha, ...).
Uses the storm rows exported from Colab (ERA5 features already computed, same as notebook 06),
so every replay forecast is the real model output for that storm and time.

File: artifacts/replay/replay_storm_fixes.csv  (created by scripts/export_artifacts_colab.py)
"""
import json
import logging
import threading
from functools import lru_cache

import numpy as np
import pandas as pd

import config as CFG
from core import C, common
from pipeline import forecast as FC

log = logging.getLogger("replay")

REPLAY_FILE = CFG.REPLAY_DIR / "replay_storm_fixes.csv"
_CACHE = {}          # (storm, step) -> payload; replay forecasts never change, so compute each once


def clear_cache():
    _CACHE.clear()
    _VERIF.update(status="not_started", result=None, error=None)


@lru_cache(maxsize=1)
def table():
    if not REPLAY_FILE.exists():
        return pd.DataFrame()
    df = pd.read_csv(REPLAY_FILE, low_memory=False)
    df["time"] = pd.to_datetime(df["time"])
    df["NAME"] = df["NAME"].fillna("").astype(str)
    return df.sort_values(["SID", "time"]).reset_index(drop=True)


def available():
    return not table().empty


def _storm(sid):
    df = table()
    return df[df["SID"] == sid].reset_index(drop=True) if not df.empty else df


def catalog():
    df = table()
    out = []
    for sid, g in df.groupby("SID", sort=False):
        w = g["wind"].max()
        p = g["pres"].min() if "pres" in g else np.nan
        name = (g["NAME"].iloc[0] or sid).title()
        out.append({
            "id": sid, "name": name, "season": int(g["time"].dt.year.iloc[0]), "basin": "NI",
            "subBasin": "BB" if int(g.get("basin_bob", pd.Series([1])).iloc[0]) == 1 else "AS",
            "peakIMDGrade": FC.grade_name(w), "maxWind": FC._f(w, 0), "minPressure": FC._f(p, 0),
            "landfallLocation": "", "landfallDate": FC._iso(g["time"].iloc[-1]),
            "summary": f"Unseen test storm ({g['time'].dt.year.iloc[0]}); {len(g)} forecast times.",
            "totalSteps": int(len(g)),
        })
    out.sort(key=lambda s: (-(s["maxWind"] or 0)))
    return out


def _point(r):
    return {"timestamp": FC._iso(r["time"]), "lat": FC._f(r["lat"], 3), "lon": FC._f(r["lon"], 3),
            "windSpeed": FC._f(r["wind"], 1), "pressure": FC._f(r.get("pres"), 1),
            "imdGrade": FC.grade_name(r["wind"])}


def replay(store, sid, step=None):
    g = _storm(sid)
    if g.empty:
        return None
    n = len(g)
    step = n // 2 if step is None else int(np.clip(step, 0, n - 1))
    if (sid, step) in _CACHE:
        return _CACHE[(sid, step)]
    r = g.iloc[step]
    observed = [_point(x) for _, x in g.iloc[: step + 1].iterrows()]
    future = [_point(x) for _, x in g.iloc[step + 1:].iterrows()]
    meta = dict(storm_id=sid, name=(r["NAME"] or sid).title(), time=r["time"], lat=r["lat"], lon=r["lon"],
                wind=r["wind"], pres=r.get("pres"), basin_bob=r.get("basin_bob", 1))
    payload = FC.build_storm_payload(store, g.iloc[[step]], meta, observed, "replay",
                                     rng=np.random.default_rng(C.RANDOM_SEED))
    payload["actualFutureTrack"] = future
    payload["step"], payload["totalSteps"] = step, n
    add_actual_strikes(payload, g, r["time"])
    _CACHE[(sid, step)] = payload
    return payload


# ================================================================ what really happened (district strikes)
def hourly_truth(g):
    """Observed track of one storm, linearly interpolated to hourly points (as in training)."""
    t = pd.to_datetime(g["time"]).values.astype("datetime64[h]").astype("int64").astype(float)
    if len(t) < 2:
        return pd.DataFrame({"time": pd.to_datetime(g["time"]), "lat": g["lat"].values, "lon": g["lon"].values})
    hrs = np.arange(t[0], t[-1] + 1)
    return pd.DataFrame({"time": pd.to_datetime(hrs.astype("int64"), unit="h"),
                         "lat": np.interp(hrs, t, g["lat"].astype(float).values),
                         "lon": np.interp(hrs, t, g["lon"].astype(float).values)})


def actual_for_districts(truth, t0, window_h=None):
    """
    For each district: did the real storm centre pass within the strike radius in 0-window h,
    and how close / when did it come? Same rule as the model and as training (core.strike).
    """
    window_h = window_h or C.LEADS_H[-1]
    t0 = pd.Timestamp(t0)
    dist, _ = FC.districts()
    w = truth[(truth["time"] > t0) & (truth["time"] <= t0 + pd.Timedelta(hours=window_h))]
    complete = bool(len(truth) and truth["time"].iloc[-1] >= t0 + pd.Timedelta(hours=window_h))
    out = {}
    for d in dist:
        if w.empty:
            out[d["id"]] = {"hit": None, "distanceKm": None, "hour": None}
            continue
        dd = common.haversine(w["lat"].values[:, None], w["lon"].values[:, None],
                              d["pts"][None, :, 0], d["pts"][None, :, 1]).min(axis=1)
        j = int(np.argmin(dd))
        hit = bool(dd[j] <= C.STRIKE_RADIUS_KM)
        out[d["id"]] = {"hit": hit, "distanceKm": round(float(dd[j])),
                        "hour": int(round((w["time"].iloc[j] - t0).total_seconds() / 3600))}
    return out, complete, (None if truth.empty else FC._iso(truth["time"].iloc[-1]))


def add_actual_strikes(payload, g, t0):
    truth = hourly_truth(g)
    actual, complete, track_end = actual_for_districts(truth, t0)
    hits = 0
    for d in payload.get("districts") or []:
        a = actual.get(d["districtId"]) or {}
        d["actualHit"], d["actualDistanceKm"], d["actualHour"] = a.get("hit"), a.get("distanceKm"), a.get("hour")
        hits += bool(a.get("hit"))
    rows = payload.get("districts") or []
    warned = [d for d in rows if d["warningLevel"] in ("RED", "ORANGE")]
    payload["actualSummary"] = {
        "windowHours": C.LEADS_H[-1], "trackComplete": complete, "observedTrackEnds": track_end,
        "districtsHit": hits,
        "hitsWithOrangeOrRed": sum(1 for d in rows if d.get("actualHit") and d["warningLevel"] in ("RED", "ORANGE")),
        "hitsWithYellowOrAbove": sum(1 for d in rows if d.get("actualHit") and d["warningLevel"] != "GREEN"),
        "orangeOrRedDistricts": len(warned),
        "orangeOrRedHit": sum(1 for d in warned if d.get("actualHit")),
        "source": "IBTrACS best track (IMD RSMC New Delhi), interpolated hourly",
    }


# ================================================================ verification over every test storm
BINS = [(0.0, 0.05, "below 5%"), (0.05, 0.10, "5-10%"), (0.10, 0.25, "10-25% (yellow)"),
        (0.25, 0.50, "25-50% (orange)"), (0.50, 1.01, "50% or more (red)")]
_VERIF = {"status": "not_started", "result": None, "error": None}
_VERIF_LOCK = threading.Lock()


def _verification_key(store):
    parts = [CFG.MODEL_VERSION, store.main_model, str(CFG.N_MC_TRACKS)]
    for f in (REPLAY_FILE, CFG.MODELS_DIR / "track_error_bank.npy", CFG.MODELS_DIR / "y_dlat_24.json"):
        parts.append(str(f.stat().st_mtime_ns) if f.exists() else "-")
    return "|".join(parts)


def compute_strike_verification(store):
    """
    Every forecast time of every test storm: the model's 0-24 h strike probability for each district
    versus whether the real storm centre passed within 100 km. Only forecasts whose real track covers
    the full 24 h are scored (otherwise the outcome is unknown).
    """
    df = table()
    p_all, o_all, storms_used, cases = [], [], set(), 0
    for sid, g in df.groupby("SID", sort=False):
        g = g.reset_index(drop=True)
        truth = hourly_truth(g)
        for step in range(len(g)):
            t0 = g["time"].iloc[step]
            actual, complete, _ = actual_for_districts(truth, t0)
            if not complete:
                continue
            pl = _CACHE.get((sid, step)) or replay(store, sid, step)
            rows = pl.get("districts") or []
            if not rows:
                continue
            cases += 1
            storms_used.add(sid)
            for d in rows:
                p = (d["strikeProbability"] or {}).get(f"{C.LEADS_H[-1]}h")
                a = actual.get(d["districtId"]) or {}
                if p is None or a.get("hit") is None:
                    continue
                p_all.append(float(p))
                o_all.append(1.0 if a["hit"] else 0.0)
    p, o = np.array(p_all), np.array(o_all)
    if not len(p):
        return {"available": False, "reason": "no complete forecast windows"}
    base = float(o.mean())
    brier = float(np.mean((p - o) ** 2))
    brier_clim = float(np.mean((base - o) ** 2))
    bins = []
    for lo, hi, label in BINS:
        m = (p >= lo) & (p < hi)
        bins.append({"label": label, "forecasts": int(m.sum()), "meanPredicted": None if not m.any() else round(float(p[m].mean()), 3),
                     "hits": int(o[m].sum()), "observedFrequency": None if not m.any() else round(float(o[m].mean()), 3)})
    hit = o == 1
    return {
        "available": True, "storms": len(storms_used), "forecastTimes": cases, "pairs": int(len(p)),
        "hits": int(hit.sum()), "baseRate": round(base, 4),
        "brier": round(brier, 5), "brierClimatology": round(brier_clim, 5),
        "brierSkill": None if brier_clim == 0 else round(1 - brier / brier_clim, 3),
        "detectedOrangeOrRed": int((hit & (p >= 0.25)).sum()), "detectedYellowOrAbove": int((hit & (p >= 0.10)).sum()),
        "orangeOrRedForecasts": int((p >= 0.25).sum()), "orangeOrRedCorrect": int((hit & (p >= 0.25)).sum()),
        "bins": bins, "windowHours": C.LEADS_H[-1], "radiusKm": C.STRIKE_RADIUS_KM,
        "truth": "IBTrACS best track (IMD RSMC New Delhi) of the unseen 2007-08 test storms",
        "climatology": "the observed hit rate over all scored district-forecast pairs (the same chance everywhere)",
    }


def strike_verification(store, wait=False):
    """Cached on disk (data dir) so it is computed once per model/replay version, in a background thread."""
    path = CFG.DATA_DIR / "strike_verification.json"
    key = _verification_key(store)
    with _VERIF_LOCK:
        if _VERIF["result"] is None and path.exists():
            try:
                d = json.loads(path.read_text())
                if d.get("key") == key:
                    _VERIF.update(status="ready", result=d["result"])
            except (OSError, ValueError):
                pass
        if _VERIF["status"] in ("ready", "running"):
            pass
        elif available() and (store.track_ready or store.intensity_ready):
            _VERIF["status"] = "running"

            def work():
                try:
                    res = compute_strike_verification(store)
                    path.write_text(json.dumps({"key": key, "result": res}))
                    _VERIF.update(status="ready", result=res, error=None)
                    log.info("strike verification ready: %s pairs", res.get("pairs"))
                except Exception as e:  # keep the API up; report the problem
                    log.exception("strike verification failed")
                    _VERIF.update(status="error", error=str(e))
            if wait:
                work()
            else:
                threading.Thread(target=work, daemon=True, name="strike-verification").start()
    return dict(_VERIF)
