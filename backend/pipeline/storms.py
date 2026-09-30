"""
Live storm positions ("fixes") -> SQLite.

1. IBTrACS ACTIVE file (NOAA NCEI): full recent track of every active storm, same
   columns and the same wind rules as the training data (IMD 3-min winds; JTWC 1-min x 0.88).
2. GDACS event feed: latest position of active tropical cyclones (fills the gap
   between IBTrACS updates). 1-min km/h winds are converted to kt x 0.88.
3. Manual fixes posted through the API (e.g. from an IMD bulletin) - source MANUAL.
"""
import logging
from datetime import datetime

import numpy as np
import pandas as pd
import requests

import config as CFG
import db
from core import C, common, tracks

log = logging.getLogger("storms")

NI_BOX = dict(lat_min=0.0, lat_max=35.0, lon_min=40.0, lon_max=100.0)


def _in_ni(lat, lon):
    return NI_BOX["lat_min"] <= lat <= NI_BOX["lat_max"] and NI_BOX["lon_min"] <= lon <= NI_BOX["lon_max"]


def _iso(t):
    return pd.Timestamp(t).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------- IBTrACS ACTIVE
def fetch_ibtracs_active(now=None):
    path = CFG.DATA_DIR / "ibtracs_active.csv"
    try:
        r = requests.get(CFG.IBTRACS_ACTIVE_URL, timeout=60)
        r.raise_for_status()
        path.write_bytes(r.content)
    except Exception as e:
        log.warning("IBTrACS ACTIVE download failed: %s", e)
        if not path.exists():
            return 0
    year = (now or datetime.utcnow()).year
    try:
        fixes = tracks.load_ibtracs(path, years=(year - 1, year + 1))
    except Exception as e:
        log.warning("IBTrACS ACTIVE parse failed: %s", e)
        return 0
    rows = [dict(storm_id=r.SID, name=r.NAME or r.SID, time=_iso(r.ISO_TIME), lat=r.LAT, lon=r.LON,
                 wind=None if pd.isna(r.wind) else r.wind, pres=None if pd.isna(r.pres) else r.pres,
                 source="IBTRACS_ACTIVE") for r in fixes.itertuples()]
    return db.upsert_fixes(rows)


# ---------------------------------------------------------------- GDACS
def _gdacs_wind_kt(props):
    sev = props.get("severitydata") or {}
    val = sev.get("severity") if isinstance(sev, dict) else None
    unit = (sev.get("severityunit") or "km/h").lower() if isinstance(sev, dict) else "km/h"
    if val is None and isinstance(props.get("severity"), dict):
        val = props["severity"].get("value")
    try:
        val = float(val)
    except (TypeError, ValueError):
        return None
    kt = val / 1.852 if "km" in unit else val
    return round(kt * C.USA_TO_WMO, 1)       # 1-min sustained -> IMD 3-min convention


def fetch_gdacs():
    try:
        r = requests.get(CFG.GDACS_EVENTS_URL, headers={"Accept": "application/json"}, timeout=30)
        r.raise_for_status()
        feats = r.json().get("features", [])
    except Exception as e:
        log.warning("GDACS fetch failed: %s", e)
        return 0
    known = _recent_storm_positions()
    rows = []
    for f in feats:
        p = f.get("properties", {})
        if p.get("eventtype") != "TC":
            continue
        try:
            lon, lat = map(float, f.get("geometry", {}).get("coordinates", [None, None])[:2])
        except (TypeError, ValueError):
            continue
        if not _in_ni(lat, lon):
            continue
        t = p.get("todate") or p.get("datemodified") or p.get("fromdate")
        t = _utc_naive(t)
        if t is None:
            continue
        name = str(p.get("eventname") or p.get("name") or "").upper()
        sid = _match_storm(name, lat, lon, t, known) or f"GDACS-{p.get('eventid', 'X')}"
        rows.append(dict(storm_id=sid, name=name or sid, time=_iso(t), lat=lat, lon=lon,
                         wind=_gdacs_wind_kt(p), pres=None, source="GDACS"))
    return db.upsert_fixes(rows)


def _utc_naive(t):
    """Any timestamp string -> timezone-naive UTC Timestamp (None if it cannot be parsed)."""
    try:
        t = pd.Timestamp(t)
    except (TypeError, ValueError):
        return None
    if pd.isna(t):
        return None
    return t.tz_convert("UTC").tz_localize(None) if t.tzinfo is not None else t


def _recent_storm_positions():
    since = _iso(_utc_naive(pd.Timestamp.now(tz="UTC")) - pd.Timedelta(days=3))
    out = []
    for s in db.storm_ids_since(since):
        fx = db.fixes_for(s["storm_id"])
        if fx:
            out.append(dict(storm_id=s["storm_id"], name=(fx[-1]["name"] or "").upper(),
                            lat=fx[-1]["lat"], lon=fx[-1]["lon"], time=_utc_naive(fx[-1]["time"])))
    return out


def _match_storm(name, lat, lon, t, known):
    for k in known:
        if name and k["name"] == name:
            return k["storm_id"]
    for k in known:
        if abs((k["time"] - t).total_seconds()) < 24 * 3600 and common.haversine(lat, lon, k["lat"], k["lon"]) < 400:
            return k["storm_id"]
    return None


def refresh():
    n1 = fetch_ibtracs_active()
    n2 = fetch_gdacs()
    return {"ibtracs_new_fixes": n1, "gdacs_new_fixes": n2}


# ---------------------------------------------------------------- helpers for the pipeline
def fixes_frame(storm_id):
    """Storm fixes in the IBTrACS-like layout expected by tracks.build_tracks()."""
    fx = pd.DataFrame(db.fixes_for(storm_id))
    if fx.empty:
        return fx
    fx["ISO_TIME"] = pd.to_datetime(fx["time"], utc=True).dt.tz_localize(None)
    # several sources can report the same time: prefer IBTrACS, then MANUAL, then GDACS
    rank = {"IBTRACS_ACTIVE": 0, "MANUAL": 1, "GDACS": 2}
    fx["rank"] = fx["source"].map(rank).fillna(3)
    fx = fx.sort_values(["ISO_TIME", "rank"]).drop_duplicates("ISO_TIME", keep="first")
    out = pd.DataFrame({"SID": storm_id, "NAME": fx["name"].fillna("").astype(str), "ISO_TIME": fx["ISO_TIME"],
                        "LAT": fx["lat"].astype(float), "LON": fx["lon"].astype(float),
                        "wind": pd.to_numeric(fx["wind"], errors="coerce"),
                        "pres": pd.to_numeric(fx["pres"], errors="coerce"), "wind_from_usa": False})
    return out.reset_index(drop=True)


def active_storm_ids(ref_time, max_age_h=None):
    max_age_h = max_age_h or CFG.STORM_MAX_AGE_HOURS
    since = _iso(pd.Timestamp(ref_time) - pd.Timedelta(hours=max_age_h))
    return [s["storm_id"] for s in db.storm_ids_since(since)]


def positions_at(storm_ids, t):
    """(lat, lon, wind) of each storm at time t by linear interpolation of its fixes (NaN if not covered)."""
    t = pd.Timestamp(t)
    out = []
    for sid in storm_ids:
        fx = fixes_frame(sid)
        if fx.empty:
            continue
        th = (fx["ISO_TIME"] - t).dt.total_seconds().values / 3600.0
        if th.min() > 0 or th.max() < -6:     # storm not yet started, or last fix more than 6 h before t
            continue
        if len(fx) == 1 or th.max() <= 0:
            last = fx.iloc[-1]
            out.append((last.LAT, last.LON, last.wind))
            continue
        lat = float(np.interp(0.0, th, fx["LAT"]))
        lon = float(np.interp(0.0, th, fx["LON"]))
        w = fx["wind"].ffill().values
        wind = float(np.interp(0.0, th, np.nan_to_num(w, nan=0.0)))
        out.append((lat, lon, wind))
    return out
