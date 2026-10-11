"""
Coastal strike probability by Monte Carlo.

For an active storm: start from the track-model forecast (+6/12/18/24 h),
add whole error sequences sampled from real validation errors (errors at all
leads of one past case are kept together), interpolate every simulated track
to hourly points, and count how often it passes within 100 km of each
district's coastline. Windows are cumulative: 0-6, 0-12, 0-18, 0-24 h.
"""
import numpy as np
import pandas as pd

from . import config as C
from .common import haversine

# Fallback coastal reference points (approximate coastline point of each district).
# Replace with a real district boundary file (config.DISTRICTS_FILE) for accurate results.
BUILTIN_DISTRICTS = [
    ("Kachchh", "Gujarat", 22.83, 69.35), ("Devbhumi Dwarka", "Gujarat", 22.24, 68.97),
    ("Porbandar", "Gujarat", 21.64, 69.60), ("Gir Somnath", "Gujarat", 20.90, 70.37),
    ("Bhavnagar", "Gujarat", 21.76, 72.15), ("Surat", "Gujarat", 21.10, 72.65),
    ("Valsad", "Gujarat", 20.60, 72.90), ("Palghar", "Maharashtra", 19.70, 72.75),
    ("Mumbai", "Maharashtra", 18.95, 72.82), ("Raigad", "Maharashtra", 18.50, 72.90),
    ("Ratnagiri", "Maharashtra", 16.99, 73.30), ("Sindhudurg", "Maharashtra", 16.00, 73.45),
    ("North Goa", "Goa", 15.55, 73.75), ("South Goa", "Goa", 15.20, 73.93),
    ("Uttara Kannada", "Karnataka", 14.80, 74.13), ("Udupi", "Karnataka", 13.34, 74.70),
    ("Dakshina Kannada", "Karnataka", 12.87, 74.84), ("Kasaragod", "Kerala", 12.50, 74.99),
    ("Kannur", "Kerala", 11.87, 75.35), ("Kozhikode", "Kerala", 11.25, 75.77),
    ("Ernakulam", "Kerala", 9.97, 76.25), ("Alappuzha", "Kerala", 9.49, 76.32),
    ("Thiruvananthapuram", "Kerala", 8.50, 76.94), ("Kanyakumari", "Tamil Nadu", 8.08, 77.55),
    ("Thoothukudi", "Tamil Nadu", 8.80, 78.15), ("Ramanathapuram", "Tamil Nadu", 9.28, 79.10),
    ("Nagapattinam", "Tamil Nadu", 10.77, 79.84), ("Cuddalore", "Tamil Nadu", 11.75, 79.77),
    ("Puducherry", "Puducherry", 11.93, 79.84), ("Chennai", "Tamil Nadu", 13.08, 80.29),
    ("Tiruvallur", "Tamil Nadu", 13.40, 80.32), ("Nellore", "Andhra Pradesh", 14.44, 80.13),
    ("Prakasam", "Andhra Pradesh", 15.50, 80.05), ("Bapatla", "Andhra Pradesh", 15.90, 80.47),
    ("Krishna", "Andhra Pradesh", 16.17, 81.14), ("West Godavari", "Andhra Pradesh", 16.35, 81.70),
    ("Kakinada", "Andhra Pradesh", 16.95, 82.25), ("Visakhapatnam", "Andhra Pradesh", 17.69, 83.29),
    ("Vizianagaram", "Andhra Pradesh", 18.10, 83.60), ("Srikakulam", "Andhra Pradesh", 18.30, 84.10),
    ("Ganjam", "Odisha", 19.30, 84.90), ("Puri", "Odisha", 19.80, 85.82),
    ("Jagatsinghpur", "Odisha", 20.26, 86.67), ("Kendrapara", "Odisha", 20.50, 86.90),
    ("Bhadrak", "Odisha", 21.00, 86.95), ("Balasore", "Odisha", 21.50, 87.05),
    ("Purba Medinipur", "West Bengal", 21.63, 87.55), ("South 24 Parganas", "West Bengal", 21.65, 88.40),
    ("South Andaman", "Andaman & Nicobar", 11.67, 92.74),
]


def load_districts():
    """
    Returns list of dicts: name, state, pts (K, 2) lat/lon points along the district
    (its boundary if a boundary file is available, else one coastal reference point).
    """
    path = C.DISTRICTS_FILE
    if path.exists():
        import geopandas as gpd
        gdf = gpd.read_file(path).to_crs(4326)
        out = []
        for _, r in gdf.iterrows():
            geom = r.geometry.boundary
            n = max(int(geom.length / 0.05), 8)          # a point every ~5 km
            pts = [geom.interpolate(i / n, normalized=True) for i in range(n)]
            out.append(dict(name=str(r[C.DISTRICT_NAME_COL]), state=str(r.get(C.DISTRICT_STATE_COL, "")),
                            pts=np.array([[p.y, p.x] for p in pts])))
        return out, "boundary file"
    return [dict(name=n, state=s, pts=np.array([[la, lo]])) for n, s, la, lo in BUILTIN_DISTRICTS], "built-in points"


def hourly_path(lat0, lon0, lead_lat, lead_lon):
    """(n, 4) lead positions -> (n, 25) hourly positions from t0 to +24 h (linear)."""
    leads = np.array((0,) + tuple(C.LEADS_H), float)
    hrs = np.arange(0, leads[-1] + 1)
    la = np.column_stack([np.full(len(lead_lat), lat0), lead_lat])
    lo = np.column_stack([np.full(len(lead_lon), lon0), lead_lon])
    H_lat = np.array([np.interp(hrs, leads, r) for r in la])
    H_lon = np.array([np.interp(hrs, leads, r) for r in lo])
    return hrs, H_lat, H_lon


def simulate(lat0, lon0, pred_dlat, pred_dlon, err_bank, n, rng):
    """
    pred_dlat/pred_dlon: length-4 predicted displacements (deg) at the leads.
    err_bank: (M, 8) array of [dlat_err_L..., dlon_err_L...] from validation (truth - prediction).
    """
    k = len(C.LEADS_H)
    pick = err_bank[rng.integers(0, len(err_bank), n)]
    lat = lat0 + np.asarray(pred_dlat)[None] + pick[:, :k]
    lon = lon0 + np.asarray(pred_dlon)[None] + pick[:, k:]
    return hourly_path(lat0, lon0, lat, lon)


def strike_probabilities(hrs, H_lat, H_lon, districts, radius=None, near_km=900):
    """Share of simulated tracks within `radius` km of each district, for each cumulative window."""
    radius = radius or C.STRIKE_RADIUS_KM
    rows = []
    c_lat, c_lon = H_lat[:, 0].mean(), H_lon[:, 0].mean()
    for d in districts:
        if haversine(d["pts"][:, 0], d["pts"][:, 1], c_lat, c_lon).min() > near_km:
            p = {f"p_{L}h": 0.0 for L in C.LEADS_H}
        else:
            dist = np.full(H_lat.shape, np.inf)                               # (n, hours)
            for j in range(0, len(d["pts"]), 50):                             # chunks keep memory small
                q = d["pts"][j:j + 50]
                dist = np.minimum(dist, haversine(H_lat[:, :, None], H_lon[:, :, None],
                                                  q[None, None, :, 0], q[None, None, :, 1]).min(axis=2))
            p = {f"p_{L}h": float((dist[:, hrs <= L] <= radius).any(axis=1).mean()) for L in C.LEADS_H}
        rows.append(dict(district=d["name"], state=d["state"], **p))
    return pd.DataFrame(rows)


def observed_hits(track, t0, districts, radius=None):
    """Did the real (hourly) track pass within radius of each district in each window?"""
    radius = radius or C.STRIKE_RADIUS_KM
    out = []
    for d in districts:
        rec = dict(district=d["name"])
        for L in C.LEADS_H:
            w = track[(track.time > t0) & (track.time <= t0 + pd.Timedelta(hours=L))]
            if w.empty:
                rec[f"o_{L}h"] = np.nan
                continue
            dist = haversine(w.lat.values[:, None], w.lon.values[:, None], d["pts"][None, :, 0], d["pts"][None, :, 1])
            rec[f"o_{L}h"] = float((dist <= radius).any())
        out.append(rec)
    return pd.DataFrame(out)


def band(p_percent):
    for lo, name in C.STRIKE_BANDS:
        if p_percent >= lo:
            return name
    return "green"


def rounded_label(p):
    v = int(round(100 * p / 5.0) * 5)
    return "<5%" if v < 5 else f"{v}%"
