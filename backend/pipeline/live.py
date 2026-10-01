"""
One live forecast cycle:
  GFS sync (keeps the last 48 h on disk)  ->  storm fixes (IBTrACS ACTIVE + GDACS)  ->
  training-identical features from GFS  ->  occurrence map + per-storm track / intensity /
  rapid-intensification / peak / district strike probabilities  ->  SQLite.
"""
import logging
import traceback

import numpy as np
import pandas as pd

import db
from core import C, features_grid, features_storm, labels, tracks
from pipeline import forecast as FC, gfs, storms

log = logging.getLogger("live")


def _align_to_gfs(fx, times, t0):
    """
    The storm row must sit on a 3-hourly GFS time. If no stored position (or interpolation between
    positions) covers a GFS time, hold the nearest position for up to 3 h so that one does:
    preferably the GFS time just before the latest position (no extrapolation), otherwise the next one.
    Returns (fixes, note).
    """
    fx = fx.sort_values("ISO_TIME").reset_index(drop=True)
    first, last = fx["ISO_TIME"].iloc[0], fx["ISO_TIME"].iloc[-1]
    usable = [pd.Timestamp(t) for t in times if pd.Timestamp(t) <= pd.Timestamp(t0)]
    if len(fx) > 1 and any(first <= t <= last for t in usable):
        return fx, None
    near = [t for t in usable if abs((t - last).total_seconds()) <= 3 * 3600]
    if not near:
        return fx, None
    before = [t for t in near if t <= last]
    T = max(before) if before else min(near)
    if first <= T <= last:                      # single position exactly on a GFS time
        return fx, None
    src = fx.iloc[[-1]] if T > last else fx.iloc[[0]]
    extra = src.copy()
    extra["ISO_TIME"] = T
    fx = pd.concat([fx, extra], ignore_index=True).sort_values("ISO_TIME").reset_index(drop=True)
    ref = last if T > last else first
    return fx, f"position at {ref:%d %b %H}Z held to GFS time {T:%H}Z"


def track_quality(fx):
    """How much real track history the forecast starts from (shown to users as a confidence note)."""
    n = len(fx)
    span = 0.0 if n < 2 else (fx["ISO_TIME"].iloc[-1] - fx["ISO_TIME"].iloc[0]).total_seconds() / 3600
    level = "single" if n < 2 else ("limited" if span < 12 else "good")
    return {"fixCount": int(n), "trackHours": round(span, 1), "confidence": level,
            "lastFixTime": FC._iso(fx["ISO_TIME"].iloc[-1]) if n else None}


def _storm_row(fx, feats, statics, F, t0):
    """Training-identical storm row (history + ERA5-style environment features) at the latest usable time."""
    fx, note = _align_to_gfs(fx, F["time"], t0)
    if len(fx) == 1:                                   # one fix on a GFS time: duplicate it 1 h earlier
        extra = fx.iloc[[0]].copy()
        extra["ISO_TIME"] = extra["ISO_TIME"] - pd.Timedelta(hours=1)
        fx = pd.concat([extra, fx], ignore_index=True)
    TRK, INFO = tracks.build_tracks(fx)
    if not TRK:
        return None, "not enough fixes", None
    rows = labels.storm_rows(TRK, INFO)
    if rows.empty:
        return None, "storm below depression strength (17 kt) at every fix", None
    times = pd.DatetimeIndex(F["time"])
    rows = rows[rows["time"].isin(times) & (rows["time"] <= pd.Timestamp(t0))]
    if rows.empty:
        return None, "no storm time inside the GFS window", None
    row = rows.sort_values("time").iloc[[-1]].reset_index(drop=True)
    env = features_storm.storm_env_features(row, feats, statics, F["lat"], F["lon"], F["time"])
    return pd.concat([row, env.reset_index(drop=True)], axis=1), None, note


def db_sources(storm_id):
    return [r["source"] for r in db.fixes_for(storm_id)]


def run_cycle(store, download=True, now=None):
    run_id = db.log_start()
    msgs = []
    try:
        if download:
            st = gfs.sync(now=now)
            msgs.append(f"gfs {st}")
        try:
            msgs.append(f"storms {storms.refresh()}")
        except Exception as e:  # storm feeds are optional; keep going with what is in the database
            msgs.append(f"storm refresh failed: {e}")
        t0 = gfs.latest_valid_time()
        if t0 is None:
            raise RuntimeError("no GFS data on disk yet (download failed or NOMADS unreachable)")
        F, have = gfs.assemble_F(t0, lsm=gfs.load_static_lsm())
        msgs.append(f"valid {t0:%Y-%m-%d %HZ}, {len(have)}/{len(F['time'])} time steps available")
        feats, statics = features_grid.compute(F)
        k = len(F["time"]) - 1

        ids = storms.active_storm_ids(t0)
        positions = storms.positions_at(ids, t0)
        occ = FC.build_occurrence(store, feats, statics, F["lat"], F["lon"], k, t0, positions)
        db.save_occurrence(FC._iso(t0), occ)
        msgs.append(f"occurrence: model={occ['modelReady']} warning cells={occ['warningCells']}")

        rng = np.random.default_rng(C.RANDOM_SEED)
        for sid in ids:
            fx = storms.fixes_frame(sid)
            quality = track_quality(fx)
            X, why, note = _storm_row(fx, feats, statics, F, t0)
            if X is None:
                msgs.append(f"{sid}: skipped ({why})")
                continue
            r = X.iloc[0]
            observed = [{"timestamp": FC._iso(t), "lat": FC._f(a, 3), "lon": FC._f(b, 3), "windSpeed": FC._f(w, 1),
                         "pressure": FC._f(p, 1)} for t, a, b, w, p in
                        zip(fx["ISO_TIME"], fx["LAT"], fx["LON"], fx["wind"], fx["pres"])]
            meta = dict(storm_id=sid, name=fx["NAME"].iloc[-1] or sid, time=r["time"], lat=r["lat"], lon=r["lon"],
                        wind=r["wind"], pres=r["pres"], basin_bob=r.get("basin_bob", 1))
            payload = FC.build_storm_payload(store, X, meta, observed, "live", rng)
            payload["dataTime"] = FC._iso(t0)
            sources = sorted({str(x) for x in db_sources(sid)})
            payload["inputs"] = dict(quality, gfsValidTime=FC._iso(t0), sources=sources, note=note)
            db.save_forecast(sid, payload["issuedAt"], "live", payload)
            msgs.append(f"{sid}: forecast issued {payload['issuedAt']}")
        db.log_end(run_id, "ok", " | ".join(msgs))
        return {"status": "ok", "messages": msgs}
    except Exception as e:
        log.error("live cycle failed: %s", e)
        db.log_end(run_id, "error", " | ".join(msgs + [f"{e}", traceback.format_exc(limit=3)]))
        return {"status": "error", "messages": msgs + [str(e)]}
