"""
Storm-centred ERA5 features for the track / intensity table.

For each storm row (one storm at one 3-hourly time) the gridded month features
are sampled around the storm centre: values at the centre, disc means, the
steering flow averaged in a 200-800 km ring, environmental pressure, land ahead,
and an empirical potential intensity from SST.
"""
import numpy as np
import pandas as pd

from . import config as C
from .common import haversine, move
from .features_grid import sample

AT_CENTRE = ["sst_c", "msla", "vort850", "shear_200_850", "rh_mid_mean", "div200", "tp6",
             "t_upper_anom", "thick_anom", "t850_t500", "dp6", "dp12", "airsea_dt"]
DISC = {  # field -> (radius km, how)
    "vort850": (200, "max"), "msla": (200, "min"), "tp6": (200, "mean"),
    "rh_mid_mean": (300, "mean"), "shear_200_850": (500, "mean"), "sst_c": (300, "mean"),
    "div200": (300, "mean"), "rh_mid_min": (300, "mean"),
}
STEER = ["steer_u", "steer_v", "steer_lo_u", "steer_lo_v", "steer_hi_u", "steer_hi_v"]


def mpi_kt(sst_c):
    """Empirical max potential intensity (DeMaria & Kaplan 1994 form), knots."""
    return (28.2 + 55.8 * np.exp(0.1813 * (sst_c - 30.0))) * 1.944


def storm_env_features(rows, feats, statics, lat, lon, times):
    """rows: DataFrame with time, lat, lon, wind, pres. Returns DataFrame of new columns."""
    tindex = {np.datetime64(t, "h"): k for k, t in enumerate(np.asarray(times).astype("datetime64[h]"))}
    LAT, LON = np.meshgrid(lat, lon, indexing="ij")
    out = []
    for _, r in rows.iterrows():
        k = tindex.get(np.datetime64(r["time"], "h"))
        rec = {}
        if k is None:
            out.append(rec)
            continue
        c_lat, c_lon = r["lat"], r["lon"]
        for f in AT_CENTRE:
            if f in feats:
                rec[f"c_{f}"] = float(sample(feats[f][k], lat, lon, c_lat, c_lon))
        for f in ("lsm", "dist_land_km"):
            rec[f"c_{f}"] = float(sample(statics[f], lat, lon, c_lat, c_lon))
        d = haversine(LAT, LON, c_lat, c_lon)
        for f, (rad, how) in DISC.items():
            if f not in feats:
                continue
            v = feats[f][k][d <= rad]
            v = v[np.isfinite(v)]
            rec[f"d{rad}_{how}_{f}"] = np.nan if v.size == 0 else float(
                {"max": v.max, "min": v.min, "mean": v.mean}[how]())
        ring = (d >= C.RING_STEER_KM[0]) & (d <= C.RING_STEER_KM[1])
        for f in STEER:
            v = feats[f][k][ring]
            rec[f"ring_{f}"] = float(np.nanmean(v)) if np.isfinite(v).any() else np.nan
        env = (d >= 500) & (d <= 800)
        env_p = float(np.nanmean(feats["msl"][k][env])) if np.isfinite(feats["msl"][k][env]).any() else np.nan
        rec["env_pres"] = env_p
        rec["pres_drop"] = env_p - r["pres"] if np.isfinite(r["pres"]) else np.nan
        # land ahead: move the centre with the ring steering flow (frozen flow)
        su, sv = rec.get("ring_steer_u", np.nan), rec.get("ring_steer_v", np.nan)
        for tau in (12, 24):
            if np.isfinite(su) and np.isfinite(sv):
                la, lo = move(c_lat, c_lon, sv * 3.6 * tau, su * 3.6 * tau)
                rec[f"land_ahead_{tau}"] = float(sample(statics["lsm"], lat, lon, la, lo))
            else:
                rec[f"land_ahead_{tau}"] = np.nan
        sst100 = feats["sst_c"][k][d <= 100]
        sst100 = sst100[np.isfinite(sst100)]
        rec["mpi_kt"] = float(mpi_kt(sst100.mean())) if sst100.size else np.nan
        rec["mpi_gap"] = rec["mpi_kt"] - r["wind"] if np.isfinite(rec["mpi_kt"]) else np.nan
        rec["coriolis"] = float(2 * 7.2921e-5 * np.sin(np.radians(c_lat)) * 1e5)
        out.append(rec)
    return pd.DataFrame(out, index=rows.index)
