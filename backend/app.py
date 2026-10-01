"""
Cyclone early-warning API (Flask).

Run:   python app.py            -> http://127.0.0.1:8000/api/...
The frontend (Vite/React) calls these routes; the JSON shapes match frontend/src/types.

Modes
  live   : forecasts from the latest NOAA GFS run + active storm fixes (IBTrACS ACTIVE / GDACS / manual)
  replay : real model forecasts for the unseen 2007-08 test storms (for demos when no cyclone is active)
"""
import logging
import math
import warnings
import threading
import time
from pathlib import Path

import pandas as pd
import requests
from flask import Flask, jsonify, request, send_from_directory

import config as CFG
import db
from pipeline import forecast as FC, gfs, live, performance, replay
from pipeline.models import ModelStore

# keep the console readable: harmless library notices (pandas fragmentation, xarray/cfgrib defaults)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*DataFrame is highly fragmented.*")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("app")

FRONTEND_DIST = CFG.BASE_DIR.parent / "frontend" / "dist"
app = Flask(__name__, static_folder=None)
db.init()
STORE = ModelStore()
_RUN_LOCK = threading.Lock()
_STATE = {"running": False, "last_result": None}


# ================================================================ helpers
@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return resp


def mode():
    return db.get_setting("mode", "live")


def _bearing_speed(track):
    """Storm motion (kt, degrees) from the last two observed points."""
    if len(track) < 2:
        return None, None
    a, b = track[-2], track[-1]
    try:
        dt = (pd.Timestamp(b["timestamp"]) - pd.Timestamp(a["timestamp"])).total_seconds() / 3600
        if dt <= 0:
            return None, None
        dn = (b["lat"] - a["lat"]) * 111.195
        de = (b["lon"] - a["lon"]) * 111.195 * math.cos(math.radians(b["lat"]))
        return round(math.hypot(dn, de) / dt / 1.852, 1), round((math.degrees(math.atan2(de, dn)) + 360) % 360)
    except (TypeError, ValueError):
        return None, None


def _track_point(p, speed=None, direction=None):
    return {"timestamp": p["timestamp"], "lat": p["lat"], "lon": p["lon"], "windSpeed": p.get("windSpeed"),
            "pressure": p.get("pressure"), "nature": "TS", "stormSpeed": speed, "stormDir": direction,
            "imdGrade": p.get("imdGrade") or FC.grade_name(p.get("windSpeed"))}


def to_active_cyclone(pl):
    track = pl.get("observedTrack") or []
    speed, direction = _bearing_speed(track)
    winds = [p.get("windSpeed") for p in track if p.get("windSpeed") is not None]
    press = [p.get("pressure") for p in track if p.get("pressure") is not None]
    cur = dict(pl["current"])
    cur.update(nature="TS", stormSpeed=speed, stormDir=direction, isLandfall=False)
    is_replay = pl.get("mode") == "replay"
    return {
        "id": pl["stormId"], "name": pl["name"], "season": int(pl["issuedAt"][:4]), "basin": "NI",
        "subBasin": "BB" if pl.get("basinBob", 1) else "AS",
        "startDate": track[0]["timestamp"] if track else pl["issuedAt"],
        "endDate": track[-1]["timestamp"] if track else pl["issuedAt"],
        "maxWind": max(winds) if winds else cur.get("windSpeed"),
        "minPressure": min(press) if press else cur.get("pressure"),
        "peakIMDGrade": FC.grade_name(max(winds)) if winds else cur.get("imdGrade"),
        "track": [_track_point(p) for p in track],
        "currentPosition": cur, "status": "active", "lastUpdated": pl.get("generatedAt"),
        "dataSource": "replay" if is_replay else "live", "isReplay": is_replay,
        "environmental": pl.get("environmental"),
        "dataTime": pl.get("dataTime"), "inputs": pl.get("inputs"),
    }


def _replay_selection():
    sel = db.get_setting("replay", None) or {}
    cat = replay.catalog() if replay.available() else []
    if not cat:
        return None, None
    sid = sel.get("stormId") if sel.get("stormId") in {c["id"] for c in cat} else cat[0]["id"]
    return sid, sel.get("step")


def current_payloads():
    """Forecast payloads for the storms shown right now (live or replay)."""
    if mode() == "replay":
        sid, step = _replay_selection()
        pl = replay.replay(STORE, sid, step) if sid else None
        return [pl] if pl else []
    occ = db.latest_occurrence()
    since = None
    if occ:
        since = (pd.Timestamp(occ["validTime"]) - pd.Timedelta(hours=CFG.STORM_MAX_AGE_HOURS)).strftime(
            "%Y-%m-%dT%H:%M:%SZ")
    return db.latest_forecasts("live", since)


def find_payload(storm_id, step=None):
    storm_id = (storm_id or "ACTIVE")
    if storm_id.upper() in ("ACTIVE", "DEFAULT", "CURRENT", ""):
        pls = current_payloads()
        return pls[0] if pls else None
    if mode() == "replay" or (replay.available() and (replay.table()["SID"] == storm_id).any()):
        if step is None:
            _, step = _replay_selection()
            sel = db.get_setting("replay", {}) or {}
            step = step if sel.get("stormId") == storm_id else None
        return replay.replay(STORE, storm_id, step)
    return db.latest_forecast(storm_id, "live")


def models_missing_response():
    return jsonify({"status": 503, "error": "Trained models are not installed in backend/artifacts/models. "
                                              "See README: 'Put the trained models in place'.",
                    "models": STORE.status()}), 503


# ================================================================ system
@app.route("/api/health")
def health():
    return jsonify({"ok": True})


@app.route("/api/status")
@app.route("/api/system/status")
def system_status():
    files = gfs.available_files()
    latest = gfs.latest_valid_time()
    st = STORE.status()
    return jsonify({
        "status": "OPERATIONAL" if STORE.any_ready else "MODELS_NOT_INSTALLED",
        "system": "Cyclone early-warning platform (VectorMinds, SIH)", "version": CFG.MODEL_VERSION,
        "operational_mode": mode(), "timestamp": db.now_iso(),
        "sqlite_database": {"status": "connected", "total_records_stored": db.count_fixes(),
                            "forecasts_stored": db.count_forecasts(), "persistence_enabled": True},
        "ml_inference_engine": {"models_loaded": STORE.any_ready,
                                "intensity_horizons": [f"{h}h" for h in CFG.LEADS_H] if st["intensity"] else [],
                                "trajectory_model": st["track"], "rapid_intensification": st["rapid_intensification"],
                                "occurrence_model": st["occurrence"], "main_model": st["main_model"],
                                "errors": st["errors"][:5]},
        "gis_risk_engine": {"status": "ready", "coastal_districts_monitored": len(FC.district_roster()),
                            "surge_model": "not included", "warning_tiers": ["GREEN", "YELLOW", "ORANGE", "RED"],
                            "method": "Monte Carlo strike probability (storm centre within 100 km)"},
        "historical_archive": {"total_storms": len(replay.catalog()) if replay.available() else 0,
                               "sources": ["IBTrACS", "ERA5 (test years 2007-2008)"]},
        "live_data": {"gfs_files": len(files), "latest_gfs_valid_time": None if latest is None else
                      latest.strftime("%Y-%m-%dT%H:%MZ"), "pipeline_running": _STATE["running"],
                      "last_runs": db.last_runs(3)},
    })


@app.route("/api/sources/status")
def sources_status():
    checks = [("NOAA GFS (NOMADS)", "Live weather fields every 6 h", "https://nomads.ncep.noaa.gov/", "LIVE MODEL INPUT"),
              ("IBTrACS ACTIVE", "Tracks of active storms", CFG.IBTRACS_ACTIVE_URL, "STORM POSITIONS"),
              ("GDACS", "Latest tropical cyclone positions", CFG.GDACS_EVENTS_URL, "STORM POSITIONS"),
              ("IMD RSMC New Delhi", "Official warnings", "https://rsmcnewdelhi.imd.gov.in/", "OFFICIAL REFERENCE")]
    out = []
    for name, purpose, url, role in checks:
        try:
            ok = requests.head(url, timeout=5, allow_redirects=True).status_code < 500
        except requests.RequestException:
            ok = False
        out.append({"source": name, "purpose": purpose, "role": role, "status": "AVAILABLE" if ok else "UNAVAILABLE",
                    "checkedAt": db.now_iso()})
    return jsonify({"status": 200, "sources": out})


@app.route("/api/mode", methods=["GET", "POST", "OPTIONS"])
def api_mode():
    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        m = str(body.get("mode", "live")).lower()
        if m not in ("live", "replay"):
            return jsonify({"success": False, "error": "mode must be 'live' or 'replay'"}), 400
        if m == "replay" and not replay.available():
            return jsonify({"success": False, "error": "replay data not installed (artifacts/replay)"}), 400
        db.set_setting("mode", m)
        if body.get("stormId"):
            db.set_setting("replay", {"stormId": body["stormId"], "step": body.get("step")})
        return jsonify({"success": True, "operational_mode": m})
    return jsonify({"operational_mode": mode()})


# ================================================================ cyclones
def _last_system():
    s = db.last_storm()
    if not s:
        return None
    name = s["name"] or s["storm_id"]
    return {"id": s["storm_id"], "name": name, "lastSeen": s["time"]}


@app.route("/api/cyclone/active")
def cyclone_active():
    pls = current_payloads()
    if pls:
        return jsonify({"status": "REPLAY" if mode() == "replay" else "LIVE", "active": True,
                        "data": [to_active_cyclone(p) for p in pls], "total": len(pls),
                        "lastUpdated": db.now_iso()})
    occ = db.latest_occurrence() or {}
    base = occ.get("environmentalBaseline") or {}
    return jsonify({
        "status": "NO_ACTIVE_CYCLONE", "active": False, "data": [],
        "monitoringRegion": "North Indian Ocean (Bay of Bengal & Arabian Sea)",
        "environmentalBaseline": {k: base.get(k) for k in ("sea_surface_temp", "relative_humidity",
                                                           "vertical_wind_shear", "surface_pressure")},
        "lastChecked": db.now_iso(), "dataValidTime": occ.get("validTime"),
        "lastSystem": _last_system(),
        "sources": ["NOAA_GFS", "IBTRACS_ACTIVE", "GDACS"],
        "message": "No active cyclone in the North Indian Ocean. Basin formation probabilities are on Basin Watch; "
                   "switch to replay mode to explore the 2007-08 test storms.",
    })


@app.route("/api/cyclone/<storm_id>/predictions")
def cyclone_predictions(storm_id):
    if not (STORE.track_ready or STORE.intensity_ready):
        return models_missing_response()
    pl = find_payload(storm_id)
    if not pl:
        return jsonify({"status": 404, "error": "no forecast for this storm (no active cyclone)"}), 404
    fc = pl["forecast"]
    return jsonify({"status": 200, "stormId": pl["stormId"], "data": {
        "stormId": pl["stormId"], "generatedAt": pl["generatedAt"], "issuedAt": pl["issuedAt"],
        "modelVersion": pl["modelVersion"], "mainModel": pl.get("mainModel"),
        "forecastPoints": fc,
        "intensityForecasts": [{"forecastHour": f["forecastHour"], "windSpeed": f["predictedWind"],
                                "windChange": f["windChange"], "trend": f["trend"], "imdGrade": f["predictedIMDGrade"]}
                               for f in fc],
        "rapidIntensification": pl.get("rapidIntensification"), "peakIntensity": pl.get("peakIntensity"),
        "currentObservation": pl["current"], "leadHours": pl["leadHours"],
        "actualFutureTrack": pl.get("actualFutureTrack"),
        "dataTime": pl.get("dataTime"), "inputs": pl.get("inputs"),
    }})


@app.route("/api/cyclone/<storm_id>/risk")
def cyclone_risk(storm_id):
    pl = find_payload(storm_id, request.args.get("step", default=None, type=int))
    if not pl or not pl.get("districts"):
        return jsonify({"status": 200, "stormId": "STANDBY", "stormName": "", "generatedAt": db.now_iso(),
                        "summary": {"totalDistrictsEvaluated": 0, "redAlertCount": 0, "orangeAlertCount": 0,
                                    "yellowAlertCount": 0}, "landfall": {"isLandfallPredicted": False},
                        "bulletin": None, "districts": []})
    ds = pl["districts"]
    count = lambda lvl: sum(1 for d in ds if d["warningLevel"] == lvl)  # noqa: E731
    top = ds[0]
    p24 = top["strikeProbability"].get("24h") or 0
    landfall = {"isLandfallPredicted": p24 >= 0.25, "message": "Closest-approach district with the highest 0-24 h "
                "strike probability (storm centre within 100 km)."}
    if p24 >= 0.25:
        landfall.update(targetDistrict=top["districtName"], targetState=top["state"],
                        landfallCoordinates=top["centroid"], forecastHour=top["closestHour"],
                        estimatedTime=(pd.Timestamp(pl["issuedAt"]) + pd.Timedelta(hours=top["closestHour"])).strftime(
                            "%Y-%m-%dT%H:%M:%SZ"), landfallWindKts=top["estimatedWindKts"],
                        confidence=f"{round(100 * p24)}% strike probability")
    high = [d for d in ds if d["warningLevel"] in ("RED", "ORANGE")]
    bulletin = {
        "bulletinId": f"VM-{pl['stormId']}-{pl['issuedAt'][:13]}", "issuedAt": pl["issuedAt"],
        "cycloneName": pl["name"],
        "headline": (f"{pl['name']}: {len(high)} coastal district(s) with >=25% chance of the storm centre "
                     f"passing within 100 km in the next 24 h") if high else
                    f"{pl['name']}: no coastal district above 25% strike probability in the next 24 h",
        "bulletinText": "Model guidance, not an official warning. Follow IMD / RSMC New Delhi and local authorities.",
        "actionDirectives": [f"{d['districtName']} ({d['state']}): {d['strikeLabel']} in 24 h" for d in high[:8]],
    }
    return jsonify({
        "status": 200, "stormId": pl["stormId"], "stormName": pl["name"], "generatedAt": pl["generatedAt"],
        "issuedAt": pl["issuedAt"],
        "summary": {"totalDistrictsEvaluated": len(ds), "redAlertCount": count("RED"),
                    "orangeAlertCount": count("ORANGE"), "yellowAlertCount": count("YELLOW"),
                    "highestRiskDistrict": top["districtName"]},
        "landfall": landfall, "bulletin": bulletin, "districts": ds,
        "mode": pl.get("mode"),
        "replay": None if pl.get("mode") != "replay" else {"step": pl.get("step"), "totalSteps": pl.get("totalSteps")},
        "actualSummary": pl.get("actualSummary"),
    })


@app.route("/api/districts/coastal")
def districts_coastal():
    roster = FC.district_roster()
    return jsonify({"status": 200, "total": len(roster), "districts": roster})


def _zone_method():
    i = CFG.BASIN_ZONES_INFO
    if not i:
        return None
    y = i.get("years") or ["?", "?"]
    added = i.get("added") or []
    n_data = len(CFG.BASIN_ZONES) - len(added)
    text = f"Zones: {n_data} chosen from IBTrACS {y[0]}-{y[1]} storm records"
    if added:
        text += f" plus {len(added)} added for active coastlines ({', '.join(added)})"
    text += "."
    if i.get("cellAssignment") == "nearest":
        text += " Every sea cell belongs to its nearest zone, so risk anywhere in the basin raises a zone card."
    text += (f" Within {round(i.get('radiusKm') or CFG.BASIN_ZONE_RADIUS_KM)} km of their centres the zones hold "
             f"{round(100 * (i.get('positionCoverage') or 0))}% of depression-or-stronger positions at sea and "
             f"{round(100 * (i.get('genesisCoverage') or 0))}% of formation points ({i.get('storms')} storms).")
    return text


@app.route("/api/basin/risk")
def basin_risk():
    occ = db.latest_occurrence()
    if not occ:
        return jsonify({"status": 200, "data": {
            "generatedAt": db.now_iso(), "status": "LATEST_AVAILABLE", "source": "No GFS run processed yet",
            "summary": "Waiting for the first live GFS cycle.",
            "zones": [{"id": z[0], "name": z[1], "basin": z[2], "lat": z[3], "lon": z[4], "sst": None, "shear": None,
                       "humidity": None, "probability": None, "riskLevel": "LOW"} for z in CFG.BASIN_ZONES]}})
    top = max(occ["zones"], key=lambda z: z["probability"] or 0)
    return jsonify({"status": 200, "data": {
        "generatedAt": occ["validTime"], "status": "LIVE",
        "source": f"Occurrence model on NOAA GFS valid {occ['validTime']} (warning threshold "
                  f"{round(100 * occ['threshold'])}% for cyclonic storm or stronger)",
        "summary": f"Highest 24 h cyclone probability: {top['name']} ({top['probability']}%). Model guidance, "
                   f"not an official warning.",
        "zones": occ["zones"], "cells": occ["cells"], "zoneMethod": _zone_method()}})


@app.route("/api/occurrence/grid")
def occurrence_grid():
    occ = db.latest_occurrence()
    return jsonify({"status": 200, "data": occ})


# ================================================================ historical replay
@app.route("/api/historical/catalog")
def historical_catalog():
    cat = replay.catalog() if replay.available() else []
    return jsonify({"status": 200, "total": len(cat), "storms": cat})


@app.route("/api/historical/strike-verification")
def strike_verification():
    """Model strike probabilities vs. what really happened, over every forecast time of every test storm."""
    if not replay.available():
        return jsonify({"status": 404, "error": "replay data not installed"}), 404
    if not (STORE.track_ready or STORE.intensity_ready):
        return models_missing_response()
    v = replay.strike_verification(STORE)
    return jsonify({"status": 200, "state": v["status"], "error": v.get("error"), "data": v.get("result")})


@app.route("/api/historical/<storm_id>/replay")
def historical_replay(storm_id):
    if not replay.available():
        return jsonify({"status": 404, "error": "replay data not installed"}), 404
    step = request.args.get("step", default=None, type=int)
    pl = replay.replay(STORE, storm_id, step)
    if not pl:
        return jsonify({"status": 404, "error": f"storm {storm_id} not in replay set"}), 404
    db.set_setting("replay", {"stormId": storm_id, "step": pl["step"]})
    cat = {c["id"]: c for c in replay.catalog()}
    obs = pl["observedTrack"]
    return jsonify({"status": 200, "data": {
        "storm": cat.get(storm_id, {}),
        "replayState": {"currentStep": pl["step"], "totalSteps": pl["totalSteps"],
                        "currentObservation": {"step": pl["step"], **obs[-1]},
                        "observedTrackSoFar": [{"step": i, **p} for i, p in enumerate(obs)],
                        "actualFutureTrack": [{"step": pl["step"] + 1 + i, **p} for i, p in
                                              enumerate(pl["actualFutureTrack"])]},
        "forecast": pl["forecast"], "districts": pl["districts"][:15],
        "rapidIntensification": pl["rapidIntensification"], "peakIntensity": pl["peakIntensity"]}})


# ================================================================ models / records
@app.route("/api/models/performance")
def models_performance():
    s = performance.summary()
    return jsonify({"status": 200, "data": s, **s, "models": STORE.status()})


@app.route("/api/sql/records")
def sql_records():
    limit = min(int(request.args.get("limit", 50)), 500)
    rows = db.recent_fixes(limit)
    recs = [{"id": r["id"], "storm_id": r["storm_id"], "name": r["name"], "lat": r["lat"], "lon": r["lon"],
             "wind_speed": r["wind"], "pressure": r["pres"], "sea_surface_temp": None, "vertical_wind_shear": None,
             "source": r["source"], "timestamp": r["time"]} for r in rows]
    return jsonify({"total_count": db.count_fixes(), "limit": limit, "records": recs})


# ================================================================ admin
def _run_pipeline(download=True):
    if not _RUN_LOCK.acquire(blocking=False):
        return {"status": "busy"}
    _STATE["running"] = True
    try:
        res = live.run_cycle(STORE, download=download)
        _STATE["last_result"] = res
        return res
    finally:
        _STATE["running"] = False
        _RUN_LOCK.release()


@app.route("/api/admin/refresh", methods=["POST"])
def admin_refresh():
    body = request.get_json(silent=True) or {}
    threading.Thread(target=_run_pipeline, kwargs={"download": body.get("download", True)}, daemon=True).start()
    return jsonify({"status": "started"})


@app.route("/api/admin/fixes", methods=["POST"])
def admin_fixes():
    """Add storm positions manually, e.g. from an IMD bulletin: [{stormId, name, time, lat, lon, wind, pres}]"""
    body = request.get_json(silent=True)
    items = body if isinstance(body, list) else (body or {}).get("fixes", [])
    rows = [dict(storm_id=i["stormId"], name=i.get("name", i["stormId"]),
                 time=pd.Timestamp(i["time"]).strftime("%Y-%m-%dT%H:%M:%SZ"), lat=i["lat"], lon=i["lon"],
                 wind=i.get("wind"), pres=i.get("pres"), source="MANUAL") for i in items]
    return jsonify({"status": 200, "inserted": db.upsert_fixes(rows)})


@app.route("/api/admin/reload-models", methods=["POST"])
def admin_reload():
    STORE.load()
    replay.clear_cache()
    return jsonify({"status": 200, "models": STORE.status()})


# ================================================================ optional: serve the built frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path):
    if not FRONTEND_DIST.exists():
        return jsonify({"message": "API running. Start the frontend with `npm run dev` in /frontend.",
                        "api": "/api/system/status"})
    target = FRONTEND_DIST / path
    if path and target.exists() and target.is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


# ================================================================ background scheduler
def _scheduler():
    time.sleep(3)
    while True:
        log.info("live pipeline: starting cycle")
        res = _run_pipeline(download=True)
        log.info("live pipeline: %s", res)
        time.sleep(CFG.REFRESH_MINUTES * 60)


def start_scheduler():
    if replay.available() and (STORE.track_ready or STORE.intensity_ready):
        replay.strike_verification(STORE)            # background: test-storm strike check, cached on disk
    if CFG.AUTO_PIPELINE:
        threading.Thread(target=_scheduler, daemon=True, name="live-pipeline").start()


if __name__ == "__main__":
    start_scheduler()
    log.info("API on http://%s:%d/api  (models: %s)", CFG.HOST, CFG.PORT, STORE.status())
    app.run(host=CFG.HOST, port=CFG.PORT, debug=False, use_reloader=False, threaded=True)
