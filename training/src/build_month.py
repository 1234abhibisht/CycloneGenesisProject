"""
Per-month worker used by notebook 01.

For one month it: loads ERA5 -> computes grid features (0.25 deg) -> takes the
0.5 deg domain cells -> attaches labels -> keeps sea / near-sea cells ->
subsamples negatives (with weights) -> writes one table. It also writes the
storm-centred ERA5 features for every storm time in that month, so the ERA5
maths is done only once for both tables.

Outputs (one file per month, already-finished months are skipped):
  outputs/tables/occurrence/YYYY_MM        training rows (subsampled, weight column 'w')
  outputs/tables/occurrence_full/YYYY_MM   all cells at 00 and 12 UTC (VAL, CAL, TEST years)
  outputs/tables/storm_env/YYYY_MM         storm-centred ERA5 features
"""
import multiprocessing as mp
import time
import traceback
from concurrent.futures import ProcessPoolExecutor, as_completed

import numpy as np
import pandas as pd

from . import config as C
from .common import domain_index, save_table, table_exists
from .features_grid import GRID_FEATURES_STATIC, compute
from .features_storm import storm_env_features
from .labels import occurrence_labels

_TP = None          # TrackPoints (set by init)
_STORM_ROWS = None  # storm table skeleton (set by init)


def init(track_points, storm_rows):
    global _TP, _STORM_ROWS
    _TP, _STORM_ROWS = track_points, storm_rows


def paths(y, m):
    tag = f"{y}_{m:02d}"
    return {"occ": C.out("tables", "occurrence") / tag,
            "full": C.out("tables", "occurrence_full") / tag,
            "storm": C.out("tables", "storm_env") / tag}


def is_done(y, m):
    p = paths(y, m)
    need_full = C.split_of(y) in ("val", "cal", "test")
    return table_exists(p["occ"]) and table_exists(p["storm"]) and (table_exists(p["full"]) or not need_full)


def _grid_table(feats, statics, times, sl, iy, ix, keep_cells, labels, row_mask):
    """Assemble a DataFrame for the selected (time, cell) rows."""
    T, N = labels["label"].shape
    tt, nn = np.nonzero(row_mask)
    LAT, LON = np.meshgrid(feats["_lat"][iy], feats["_lon"][ix], indexing="ij")
    cell_lat, cell_lon = LAT.ravel()[keep_cells], LON.ravel()[keep_cells]
    t = pd.DatetimeIndex(times)[tt]
    df = pd.DataFrame({"time": t, "lat": cell_lat[nn].astype("float32"), "lon": cell_lon[nn].astype("float32")})
    df["year"], df["month"], df["hour"] = t.year, t.month, t.hour
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12).astype("float32")
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12).astype("float32")
    for k in ("label", "persistence", "existing_system"):
        df[k] = labels[k][tt, nn]
    df["hard"] = labels["hard"][tt, nn]
    for name in GRID_FEATURES_STATIC:
        a = np.asarray(statics[name])[np.ix_(iy, ix)].ravel()[keep_cells]
        df[name] = a[nn].astype("float32")
    for name, arr in feats.items():
        if name.startswith("_"):
            continue
        a = arr[sl][:, iy][:, :, ix].reshape(arr[sl].shape[0], -1)[:, keep_cells]
        df[name] = a[tt, nn]
    return df


def process_month(y, m, force=False):
    from . import io_era5  # imported here so the module loads without xarray in tests
    if not force and is_done(y, m):
        return (y, m, "skip", 0.0, "")
    t_start = time.time()
    try:
        F = io_era5.load_month(y, m)
        feats, statics = compute(F)
        feats["_lat"], feats["_lon"] = F["lat"], F["lon"]
        k0 = F["first_new"]
        sl = slice(k0, None)
        times = F["time"][k0:]
        lat, lon = F["lat"], F["lon"]

        # ---- occurrence table
        iy, ix = domain_index(lat, lon)
        keep_cells = np.asarray(statics["near_sea"])[np.ix_(iy, ix)].ravel()
        LAT, LON = np.meshgrid(lat[iy], lon[ix], indexing="ij")
        cell_lat, cell_lon = LAT.ravel()[keep_cells], LON.ravel()[keep_cells]
        labels = occurrence_labels(_TP, times.values, cell_lat, cell_lon)

        rng = np.random.default_rng([C.RANDOM_SEED, y, m])
        pos = labels["label"] > 0
        hard = labels["hard"] & ~pos
        u = rng.random(pos.shape)
        keep = pos | (hard & (u < C.HARD_NEG_KEEP)) | (~hard & ~pos & (u < C.EASY_NEG_KEEP))
        w = np.where(pos, 1.0, np.where(hard, 1.0 / C.HARD_NEG_KEEP, 1.0 / C.EASY_NEG_KEEP))
        df = _grid_table(feats, statics, times, sl, iy, ix, keep_cells, labels, keep)
        tt, nn = np.nonzero(keep)
        df["w"] = w[tt, nn].astype("float32")
        p = paths(y, m)
        save_table(df, p["occ"])
        n_rows = len(df)

        # ---- full table for evaluation years (all cells at 00/12 UTC)
        if C.split_of(y) in ("val", "cal", "test"):
            hours = pd.DatetimeIndex(times).hour
            full_mask = np.zeros_like(keep)
            full_mask[np.isin(hours, C.FULL_EVAL_HOURS)] = True
            dff = _grid_table(feats, statics, times, sl, iy, ix, keep_cells, labels, full_mask)
            dff["w"] = np.float32(1.0)
            save_table(dff, p["full"])

        # ---- storm-centred features
        tset = set(pd.DatetimeIndex(times))
        rows = _STORM_ROWS[_STORM_ROWS["time"].isin(tset)]
        env = storm_env_features(rows, feats, statics, lat, lon, F["time"]) if len(rows) else pd.DataFrame()
        env = pd.concat([rows[["SID", "time"]].reset_index(drop=True), env.reset_index(drop=True)], axis=1)
        save_table(env, p["storm"])

        io_era5.clear_local(y, m)
        return (y, m, "ok", time.time() - t_start, f"{n_rows} rows, {len(rows)} storm times")
    except Exception as e:  # keep going with other months; the error is logged
        return (y, m, "error", time.time() - t_start, f"{e.__class__.__name__}: {e}\n{traceback.format_exc()}")


def run_all(month_list, n_workers=None, force=False, log_path=None):
    """Process many months in parallel. Safe to re-run: finished months are skipped."""
    n_workers = n_workers or C.N_WORKERS
    todo = [(y, m) for (y, m) in month_list if force or not is_done(y, m)]
    print(f"{len(month_list) - len(todo)} months already done, {len(todo)} to process with {n_workers} workers")
    log = []
    if n_workers <= 1:
        for y, m in todo:
            r = process_month(y, m, force)
            log.append(r)
            print(f"{y}-{m:02d}: {r[2]} ({r[3]:.0f}s) {r[4].splitlines()[0] if r[4] else ''}")
    else:
        ctx = mp.get_context("fork")
        with ProcessPoolExecutor(max_workers=n_workers, mp_context=ctx) as ex:
            futs = {ex.submit(process_month, y, m, force): (y, m) for (y, m) in todo}
            for fut in as_completed(futs):
                r = fut.result()
                log.append(r)
                print(f"{r[0]}-{r[1]:02d}: {r[2]} ({r[3]:.0f}s) {r[4].splitlines()[0] if r[4] else ''}")
    logdf = pd.DataFrame(log, columns=["year", "month", "status", "seconds", "message"])
    if log_path is not None and len(logdf):
        old = pd.read_csv(log_path) if log_path.exists() else pd.DataFrame()
        pd.concat([old, logdf], ignore_index=True).to_csv(log_path, index=False)
    errs = logdf[logdf.status == "error"]
    if len(errs):
        print(f"\n{len(errs)} month(s) failed. First error:\n{errs.iloc[0]['message']}")
    return logdf


def sanity_report(df):
    """Quick checks printed after the 2-month test."""
    print(f"rows: {len(df):,}   time steps: {df['time'].nunique()}   cells: {df[['lat','lon']].drop_duplicates().shape[0]}")
    print("label counts (kept rows):", df["label"].value_counts().sort_index().to_dict())
    wpos = df.loc[df.label > 0, "w"].sum()
    print(f"weighted positive share: {wpos / df['w'].sum():.4%}")
    nan = df.isna().mean().sort_values(ascending=False)
    print("columns with most NaN:\n", nan.head(8).round(3).to_string())
    if (df.label > 0).any():
        a = df.loc[df.label > 0, "vort850_max100"].median()
        b = df.loc[df.label == 0, "vort850_max100"].median()
        print(f"median vort850_max100  positives {a:.2f}  vs  negatives {b:.2f}  (positives should be clearly higher)")
        a = df.loc[df.label > 0, "msla_min100"].median()
        b = df.loc[df.label == 0, "msla_min100"].median()
        print(f"median msla_min100     positives {a:.2f}  vs  negatives {b:.2f}  (positives should be clearly lower)")
