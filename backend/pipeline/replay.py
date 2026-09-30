"""
Historical replay: the unseen TEST storms (2007-2008: Sidr, Nargis, Nisha, ...).
Uses the storm rows exported from Colab (ERA5 features already computed, same as notebook 06),
so every replay forecast is the real model output for that storm and time.

File: artifacts/replay/replay_storm_fixes.csv  (created by scripts/export_artifacts_colab.py)
"""
from functools import lru_cache

import numpy as np
import pandas as pd

import config as CFG
from core import C
from pipeline import forecast as FC

REPLAY_FILE = CFG.REPLAY_DIR / "replay_storm_fixes.csv"
_CACHE = {}          # (storm, step) -> payload; replay forecasts never change, so compute each once


def clear_cache():
    _CACHE.clear()


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
    _CACHE[(sid, step)] = payload
    return payload
