"""
Grid features on the full buffered 0.25 deg grid, for every 3-hourly time step.

Input: dict F from io_era5.load_month (plain NumPy).
Output: dict name -> float32 array (T, Y, X), and dict of static 2-D fields.

All time-based features look BACKWARD only (no future data).
"""
import numpy as np
from scipy import ndimage, signal

from . import config as C
from .common import KM_PER_DEG

G = 9.80665
OMEGA = 7.2921e-5


# ------------------------------------------------------------------ helpers
def _spacing(lat):
    dy = KM_PER_DEG * 1000.0 * C.RES                      # metres
    dx = dy * np.cos(np.radians(lat))                     # metres, per latitude row
    return dx, dy


def ddx(f, dx):
    return np.gradient(f, axis=-1) / dx[:, None]


def ddy(f, dy):
    return np.gradient(f, axis=-2) / dy


def disc(radius_km, lat_ref=20.0):
    """Elliptical footprint (in grid cells) approximating a circle of radius_km."""
    ry = radius_km / (KM_PER_DEG * C.RES)
    rx = ry / np.cos(np.radians(lat_ref))
    ny, nx = int(np.floor(ry)), int(np.floor(rx))
    yy, xx = np.mgrid[-ny:ny + 1, -nx:nx + 1]
    return ((yy / ry) ** 2 + (xx / rx) ** 2) <= 1.0


def _fp3(fp, arr):
    return fp[None] if arr.ndim == 3 else fp


def nbr_max(a, fp):
    x = np.where(np.isnan(a), -np.inf, a)
    r = ndimage.maximum_filter(x, footprint=_fp3(fp, a), mode="constant", cval=-np.inf)
    return np.where(np.isfinite(r), r, np.nan).astype("float32")


def nbr_min(a, fp):
    x = np.where(np.isnan(a), np.inf, a)
    r = ndimage.minimum_filter(x, footprint=_fp3(fp, a), mode="constant", cval=np.inf)
    return np.where(np.isfinite(r), r, np.nan).astype("float32")


def nbr_mean(a, fp):
    """NaN-aware mean over the footprint (FFT convolution, fast for big footprints)."""
    k = fp.astype("float64")
    axes = (1, 2) if a.ndim == 3 else (0, 1)
    k = k[None] if a.ndim == 3 else k
    valid = (~np.isnan(a)).astype("float64")
    num = signal.fftconvolve(np.nan_to_num(a).astype("float64"), k, mode="same", axes=axes)
    den = signal.fftconvolve(valid, k, mode="same", axes=axes)
    with np.errstate(invalid="ignore", divide="ignore"):
        out = np.where(den > 0.5, num / np.maximum(den, 1e-9), np.nan)
    return out.astype("float32")


def lag_diff(a, steps):
    """a(t) - a(t - steps); NaN where the past is not available."""
    out = np.full_like(a, np.nan)
    out[steps:] = a[steps:] - a[:-steps]
    return out


def rolling_sum(a, steps):
    out = np.full_like(a, np.nan)
    c = np.cumsum(np.nan_to_num(a), axis=0)
    out[steps - 1:] = c[steps - 1:] - np.concatenate([np.zeros_like(c[:1]), c[:-steps]], axis=0)
    return out


def sample(field2d, lat, lon, qlat, qlon):
    """Bilinear sample of a 2-D field at query points (NaN outside the grid)."""
    iy = (np.asarray(qlat) - lat[0]) / C.RES
    ix = (np.asarray(qlon) - lon[0]) / C.RES
    return ndimage.map_coordinates(field2d, [iy.ravel(), ix.ravel()], order=1,
                                   mode="constant", cval=np.nan).reshape(np.shape(iy))


def _layer_mean(d, lo, hi):
    lv = [l for l in d if lo >= l >= hi]
    return np.mean([d[l] for l in lv], axis=0) if lv else None


# ------------------------------------------------------------------ statics
def static_fields(lsm, lat, lon):
    dx, dy = _spacing(lat)
    s = {"lsm": lsm.astype("float32")}
    s["land_frac300"] = nbr_mean(lsm.astype("float32"), disc(300))
    s["near_sea"] = (nbr_min(lsm.astype("float32"), disc(C.KEEP_LAND_WITHIN_KM)) < 0.5)
    land = lsm >= 0.5
    dx_km = float(np.cos(np.radians(20.0)) * KM_PER_DEG * C.RES)
    dy_km = KM_PER_DEG * C.RES
    s["dist_land_km"] = ndimage.distance_transform_edt(~land, sampling=(dy_km, dx_km)).astype("float32")
    s["coriolis"] = np.broadcast_to((2 * OMEGA * np.sin(np.radians(lat)) * 1e5)[:, None],
                                    lsm.shape).astype("float32")
    return s


# ------------------------------------------------------------------ main
def compute(F):
    lat, lon = F["lat"], F["lon"]
    dx, dy = _spacing(lat)
    steps = {h: h // C.TIME_STEP_H for h in (3, 6, 12, 24)}
    f = {}

    # ---- surface
    u10, v10 = F["u10"], F["v10"]
    spd10 = np.hypot(u10, v10)
    f["wspd10"] = spd10
    f["wdir10_sin"] = np.where(spd10 > 0, u10 / np.maximum(spd10, 1e-6), 0)
    f["wdir10_cos"] = np.where(spd10 > 0, v10 / np.maximum(spd10, 1e-6), 0)

    t2c, d2c = F["t2m"] - 273.15, F["d2m"] - 273.15
    es = lambda tc: 6.112 * np.exp(17.67 * tc / (tc + 243.5))
    f["rh2m"] = np.clip(100 * es(d2c) / es(t2c), 0, 100)
    f["dewpoint_dep"] = F["t2m"] - F["d2m"]
    f["sst_c"] = F["sst"] - 273.15                      # NaN over land
    f["airsea_dt"] = F["sst"] - F["t2m"]

    # ---- pressure
    msl = F["msl"] / 100.0                              # hPa
    f["msl"] = msl
    f["msla"] = msl - nbr_mean(msl, disc(500))          # anomaly vs surrounding ~1000 km
    gx, gy = ddx(msl, dx), ddy(msl, dy)
    f["msl_grad"] = np.hypot(gx, gy) * 1e5              # hPa per 100 km
    f["msl_lap"] = (ddx(gx, dx) + ddy(gy, dy)) * 1e10   # hPa per (100 km)^2
    for h in (3, 6, 12):
        f[f"dp{h}"] = lag_diff(msl, steps[h])           # negative = pressure fall

    # ---- rain: ERA5 hourly 'tp' = accumulation over the previous hour (m).
    # With 3-hourly samples, 3 h total is approximated as 3 x hourly value (mm).
    tp3 = F["tp"] * 1000.0 * 3.0
    f["tp3"] = tp3
    for h in (6, 12, 24):
        f[f"tp{h}"] = rolling_sum(tp3, steps[h])

    # ---- winds aloft
    U, V = F["u"], F["v"]
    f["vort850"] = (ddx(V[850], dx) - ddy(U[850], dy)) * 1e5
    if 700 in U:
        f["vort700"] = (ddx(V[700], dx) - ddy(U[700], dy)) * 1e5
    f["div200"] = (ddx(U[200], dx) + ddy(V[200], dy)) * 1e5
    f["div850"] = (ddx(U[850], dx) + ddy(V[850], dy)) * 1e5
    f["shear_200_850"] = np.hypot(U[200] - U[850], V[200] - V[850])
    if 500 in U:
        f["shear_500_850"] = np.hypot(U[500] - U[850], V[500] - V[850])
    su, sv = _layer_mean(U, 850, 200), _layer_mean(V, 850, 200)
    f["steer_u"], f["steer_v"] = su, sv
    f["steer_spd"] = np.hypot(su, sv)
    lo_u, lo_v = _layer_mean(U, 850, 500), _layer_mean(V, 850, 500)
    hi_u, hi_v = _layer_mean(U, 500, 200), _layer_mean(V, 500, 200)
    f["steer_lo_u"], f["steer_lo_v"] = lo_u, lo_v
    f["steer_hi_u"], f["steer_hi_v"] = hi_u, hi_v

    # ---- moisture
    RH = F["r"]
    for lv in (850, 700, 500):
        if lv in RH:
            f[f"rh{lv}"] = RH[lv]
    mid = [RH[l] for l in (700, 600, 500) if l in RH]
    f["rh_mid_min"] = np.min(mid, axis=0)
    f["rh_mid_mean"] = np.mean(mid, axis=0)

    # ---- temperature / warm core / stability
    T = F["t"]
    top = max([l for l in (200, 300) if l in T], default=None, key=lambda l: -l)
    if top is not None:
        f["t_upper_anom"] = T[top] - nbr_mean(T[top], disc(500))
    if 850 in T and 500 in T:
        f["t850_t500"] = T[850] - T[500]
    Z = F.get("z", {})
    if 200 in Z and 850 in Z:
        thick = (Z[200] - Z[850]) / G
        f["thick_anom"] = thick - nbr_mean(thick, disc(500))
    else:
        f["thick_anom"] = np.full_like(msl, np.nan)

    # ---- neighbourhood (100 / 300 km)
    for r in C.NBR_RADII_KM:
        fp = disc(r)
        rr = int(r)
        f[f"vort850_max{rr}"] = nbr_max(f["vort850"], fp)
        f[f"msla_min{rr}"] = nbr_min(f["msla"], fp)
        f[f"tp6_mean{rr}"] = nbr_mean(f["tp6"], fp)
        f[f"rhmid_mean{rr}"] = nbr_mean(f["rh_mid_mean"], fp)
    r0 = int(C.NBR_RADII_KM[0])
    f["shear_mean300"] = nbr_mean(f["shear_200_850"], disc(300))
    f["sst_mean300"] = nbr_mean(f["sst_c"], disc(300))
    f["vort_gap"] = f[f"vort850_max{r0}"] - f["vort850"]
    f["msla_gap"] = f["msla"] - f[f"msla_min{r0}"]

    # ---- upstream (frozen-flow backward look, same time step)
    Y, X = np.meshgrid(lat, lon, indexing="ij")
    for tau in (12, 24):
        dkm_n = -sv * 3.6 * tau
        dkm_e = -su * 3.6 * tau
        for name, src in (("vort", f[f"vort850_max{r0}"]), ("msla", f[f"msla_min{r0}"])):
            out = np.empty_like(src)
            for k in range(src.shape[0]):
                qlat = Y + dkm_n[k] / KM_PER_DEG
                qlon = X + dkm_e[k] / (KM_PER_DEG * np.cos(np.radians(Y)))
                out[k] = sample(src[k], lat, lon, qlat, qlon)
            f[f"up{tau}_{name}"] = out

    feats = {k: np.asarray(v, dtype="float32") for k, v in f.items()}
    return feats, static_fields(F["lsm"], lat, lon)


GRID_FEATURES_STATIC = ["lsm", "land_frac300", "dist_land_km", "coriolis"]
