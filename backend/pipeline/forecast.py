"""
Turns model outputs into the JSON payloads served to the frontend.
Used by the live pipeline (GFS features) and by historical replay (ERA5 features).

Forecast leads: +6 / +12 / +18 / +24 h only (what the models were trained for).
No pressure forecast and no storm-surge model: those fields are not produced.
"""
import re

import numpy as np
import pandas as pd

import config as CFG
from core import C, common, features_grid, strike as S

GRADE_NAMES = C.IMD_NAMES       # LP, D, DD, CS, SCS, VSCS, ESCS, SuCS
OCC_NAMES = C.OCC_NAMES         # none, D-DD, CS, SCS+


def grade_name(wind_kt):
    if wind_kt is None or not np.isfinite(wind_kt):
        return None
    return GRADE_NAMES[int(common.imd_grade(wind_kt))]


def _f(x, nd=2):
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    return round(x, nd) if np.isfinite(x) else None


def _iso(t):
    return pd.Timestamp(t).strftime("%Y-%m-%dT%H:%M:%SZ")


# ================================================================ districts
_DISTRICTS = None


def districts():
    global _DISTRICTS
    if _DISTRICTS is None:
        dist, source = S.load_districts()
        for d in dist:
            d["id"] = re.sub(r"[^a-z0-9]+", "-", f"{d['state']}-{d['name']}".lower()).strip("-")
            d["centroid"] = [round(float(d["pts"][:, 0].mean()), 4), round(float(d["pts"][:, 1].mean()), 4)]
        _DISTRICTS = (dist, source)
    return _DISTRICTS


def district_roster():
    dist, _ = districts()
    return [{"id": d["id"], "name": d["name"], "state": d["state"], "centroid": d["centroid"]} for d in dist]


# ================================================================ storm forecast payload
def build_storm_payload(store, X, meta, observed, mode, rng=None, n_tracks=None):
    """
    store    : ModelStore
    X        : 1-row DataFrame of storm features (training column names)
    meta     : dict storm_id, name, time, lat, lon, wind, pres, basin_bob
    observed : list of dicts time, lat, lon, wind, pres (observed track up to `time`)
    """
    rng = rng or np.random.default_rng(C.RANDOM_SEED)
    n_tracks = n_tracks or CFG.N_MC_TRACKS
    t0 = pd.Timestamp(meta["time"])
    lat0, lon0 = float(meta["lat"]), float(meta["lon"])
    w0 = meta.get("wind")
    w0 = float(w0) if w0 is not None and np.isfinite(w0) else np.nan
    P = store.storm_predict(X) if (store.track_ready or store.intensity_ready) else {}

    dlat = [float(P[f"y_dlat_{L}"][0]) if f"y_dlat_{L}" in P else np.nan for L in C.LEADS_H]
    dlon = [float(P[f"y_dlon_{L}"][0]) if f"y_dlon_{L}" in P else np.nan for L in C.LEADS_H]
    dwind = [float(P[f"y_dwind_{L}"][0]) if f"y_dwind_{L}" in P else np.nan for L in C.LEADS_H]

    forecast = []
    for i, L in enumerate(C.LEADS_H):
        wind = max(0.0, w0 + dwind[i]) if np.isfinite(w0) and np.isfinite(dwind[i]) else np.nan
        trend = None
        if np.isfinite(dwind[i]):
            trend = "intensifying" if dwind[i] >= 5 else "weakening" if dwind[i] <= -5 else "stable"
        forecast.append({
            "forecastHour": L,
            "timestamp": _iso(t0 + pd.Timedelta(hours=L)),
            "lat": _f(lat0 + dlat[i], 3), "lon": _f(lon0 + dlon[i], 3),
            "predictedWind": _f(wind, 1), "windChange": _f(dwind[i], 1),
            "predictedIMDGrade": grade_name(wind), "trend": trend,
            "uncertainty": _f(store.cone.get(L), 0),
        })

    ri = None
    if "p_ri" in P:
        p = float(P["p_ri"][0])
        ri = {"probability": round(p, 3), "warning": p >= 0.3,
              "note": "Experimental: rapid intensification (+30 kt in 24 h) is rare; probabilities are a risk ranking."}
    peak = None
    if "peak" in P:
        pk = float(np.nanmax([P["peak"][0], w0])) if np.isfinite(w0) else float(P["peak"][0])
        peak = {"windKt": round(pk, 1), "imdGrade": grade_name(pk)}

    track_ok = all(np.isfinite(dlat)) and all(np.isfinite(dlon))
    dist_rows = district_risk(store, lat0, lon0, dlat, dlon, forecast, rng, n_tracks) if track_ok else []

    env = {
        "seaSurfaceTemp": _f(_first(X, ["d300_mean_sst_c", "c_sst_c"]), 1),
        "windShear": _f(_ms_to_kt(_first(X, ["d500_mean_shear_200_850", "c_shear_200_850"])), 1),
        "relativeHumidity": _f(_first(X, ["d300_mean_rh_mid_mean", "c_rh_mid_mean"]), 0),
    }
    return {
        "stormId": meta["storm_id"], "name": meta.get("name") or meta["storm_id"], "mode": mode,
        "issuedAt": _iso(t0), "generatedAt": pd.Timestamp.now(tz="UTC").strftime("%Y-%m-%dT%H:%M:%SZ"),
        "modelVersion": CFG.MODEL_VERSION, "mainModel": store.main_model,
        "current": {"timestamp": _iso(t0), "lat": _f(lat0, 3), "lon": _f(lon0, 3), "windSpeed": _f(w0, 1),
                    "pressure": _f(meta.get("pres"), 1), "imdGrade": grade_name(w0)},
        "basinBob": int(meta.get("basin_bob", int(lon0 >= 77.5))),
        "observedTrack": observed,
        "forecast": forecast,
        "rapidIntensification": ri,
        "peakIntensity": peak,
        "environmental": env,
        "districts": dist_rows,
        "leadHours": list(C.LEADS_H),
    }


def _first(X, cols):
    for c in cols:
        if c in X.columns:
            v = X[c].iloc[0]
            if v is not None and np.isfinite(v):
                return float(v)
    return np.nan


def _ms_to_kt(v):
    return v * 1.9438 if v is not None and np.isfinite(v) else np.nan


def district_risk(store, lat0, lon0, dlat, dlon, forecast, rng, n_tracks):
    dist, _ = districts()
    rows_p = None
    if store.err_bank is not None and len(store.err_bank):
        hrs, HL, HN = S.simulate(lat0, lon0, dlat, dlon, store.err_bank, n_tracks, rng)
        rows_p = S.strike_probabilities(hrs, HL, HN, dist).set_index("district")
    # central (most likely) track, hourly, to report closest approach
    hrs_c, cl, cn = S.hourly_path(lat0, lon0, np.array([[lat0 + d for d in dlat]]), np.array([[lon0 + d for d in dlon]]))
    winds = np.array([np.nan] + [f["predictedWind"] if f["predictedWind"] is not None else np.nan for f in forecast])
    leads = np.array((0,) + tuple(C.LEADS_H), float)
    out = []
    for d in dist:
        dd = common.haversine(cl[0][:, None], cn[0][:, None], d["pts"][None, :, 0], d["pts"][None, :, 1]).min(axis=1)
        j = int(np.argmin(dd))
        closest_km, closest_h = float(dd[j]), int(hrs_c[j])
        p = {L: float(rows_p.loc[d["name"], f"p_{L}h"]) if rows_p is not None else np.nan for L in C.LEADS_H}
        p24 = p[C.LEADS_H[-1]]
        level = S.band(100 * p24).upper() if np.isfinite(p24) else "GREEN"
        est_wind = None
        if closest_km <= 150 and np.isfinite(winds[1:]).any():
            est_wind = _f(np.interp(closest_h, leads[1:], winds[1:]) if closest_h >= leads[1] else winds[1], 0)
        out.append({
            "districtId": d["id"], "districtName": d["name"], "state": d["state"], "centroid": d["centroid"],
            "strikeProbability": {f"{L}h": _f(p[L], 3) for L in C.LEADS_H},
            "strikeLabel": S.rounded_label(p24) if np.isfinite(p24) else None,
            "warningLevel": level, "distanceKm": round(closest_km, 0), "closestHour": closest_h,
            "forecastWindow": f"0-{C.LEADS_H[-1]} h", "estimatedWindKts": est_wind,
            "riskScore": _f(100 * p24, 1),
        })
    out.sort(key=lambda r: -(r["riskScore"] or 0))
    return out


# ================================================================ occurrence (grid) payload
def build_occurrence(store, feats, statics, lat, lon, k, t0, storm_positions):
    """Probability that a cyclone (by class) is within 200 km in the next 24 h, for every 0.5° sea cell."""
    iy, ix = common.domain_index(lat, lon)
    keep = np.asarray(statics["near_sea"])[np.ix_(iy, ix)].ravel()
    LAT, LON = np.meshgrid(lat[iy], lon[ix], indexing="ij")
    clat, clon = LAT.ravel()[keep], LON.ravel()[keep]
    t0 = pd.Timestamp(t0)
    df = pd.DataFrame({"lat": clat.astype("float32"), "lon": clon.astype("float32")})
    df["month_sin"] = np.float32(np.sin(2 * np.pi * t0.month / 12))
    df["month_cos"] = np.float32(np.cos(2 * np.pi * t0.month / 12))
    for name in features_grid.GRID_FEATURES_STATIC:
        df[name] = np.asarray(statics[name])[np.ix_(iy, ix)].ravel()[keep].astype("float32")
    for name, arr in feats.items():
        if not name.startswith("_"):
            df[name] = arr[k][np.ix_(iy, ix)].ravel()[keep]
    pers = np.zeros(len(df), "int8")
    for (slat, slon, swind) in storm_positions:
        d = common.haversine(clat, clon, slat, slon)
        pers = np.maximum(pers, np.where(d <= C.LABEL_RADIUS_KM, common.occ_class(swind), 0).astype("int8"))
    df["persistence"] = pers
    df["existing_system"] = (pers > 0).astype("int8")

    probs = store.occurrence_proba(df) if store.occurrence_ready else None
    thr = store.occ_threshold
    if probs is not None:
        df["p_cs_plus"] = probs[:, 2:].sum(axis=1)
        df["p_any"] = probs[:, 1:].sum(axis=1)
    # every model cell belongs to exactly one zone: the zone whose centre is nearest
    zone_d = np.stack([common.haversine(clat, clon, zlat, zlon) for _, _, _, zlat, zlon in CFG.BASIN_ZONES])
    df["zone"] = zone_d.argmin(axis=0)
    zones = []
    for zi, (zid, name, basin, zlat, zlon) in enumerate(CFG.BASIN_ZONES):
        sub = df[df["zone"].values == zi]
        p = float(sub["p_cs_plus"].max()) if probs is not None and len(sub) else None
        level = None if p is None else ("HIGH" if p >= thr else "MODERATE" if p >= thr / 3 else "LOW")
        zones.append({"id": zid, "name": name, "basin": basin, "lat": zlat, "lon": zlon,
                      "sst": _f(np.nanmean(sub["sst_c"]) if len(sub) else np.nan, 1),
                      "shear": _f(_ms_to_kt(np.nanmean(sub["shear_200_850"])) if len(sub) else np.nan, 1),
                      "humidity": _f(np.nanmean(sub["rh_mid_mean"]) if len(sub) else np.nan, 0),
                      "probability": None if p is None else round(100 * p, 1), "riskLevel": level or "LOW"})
    cells = []
    if probs is not None:
        hot = df[df["p_any"] >= 0.02]
        cells = [{"lat": _f(r.lat, 2), "lon": _f(r.lon, 2), "pAny": _f(r.p_any, 3), "pCsPlus": _f(r.p_cs_plus, 3),
                  "warning": bool(r.p_cs_plus >= thr), "zone": CFG.BASIN_ZONES[int(r.zone)][0]}
                 for r in hot.itertuples()]
    bay = (df["lon"] >= 80) & (df["lon"] <= 95) & (df["lat"] >= 8) & (df["lat"] <= 22)
    baseline = {"sea_surface_temp": _f(np.nanmean(df.loc[bay, "sst_c"]), 1),
                "relative_humidity": _f(np.nanmean(df.loc[bay, "rh_mid_mean"]), 0),
                "vertical_wind_shear": _f(_ms_to_kt(np.nanmean(df.loc[bay, "shear_200_850"])), 1),
                "surface_pressure": _f(np.nanmean(df.loc[bay, "msl"]), 1)}
    return {"validTime": _iso(t0), "modelReady": probs is not None, "threshold": thr,
            "zones": zones, "cells": cells, "warningCells": int(sum(c["warning"] for c in cells)),
            "environmentalBaseline": baseline}
