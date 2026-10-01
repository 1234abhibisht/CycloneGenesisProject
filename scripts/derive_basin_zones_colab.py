"""
Derive the Basin Watch monitoring zones from IBTrACS instead of choosing them by hand.

Method (deterministic, no random seed):
  1. Every North Indian Ocean storm in IBTrACS (main track), years FIRST_YEAR..LAST_YEAR.
     Wind as in training: WMO (IMD 3-min) wind, else USA 1-min wind x 0.88.
  2. "Cyclone positions" = every 6-hourly fix of depression strength (>= 17 kt) on the cells the
     occurrence model covers (sea, plus land within 150 km of the sea, 5-35N 55-100E).
     "Genesis points" = the first such fix of each storm.
  3. Candidate zone centres = every 0.5 deg sea box that held a cyclone position.
  4. Greedy coverage: repeatedly add the centre whose RADIUS_KM circle covers the most
     not-yet-covered cyclone positions, until TARGET_COVERAGE of them are covered
     (or MAX_ZONES is reached). A new centre must be at least MIN_SEPARATION_KM from the others.
  5. Each zone is named after the nearest standard sea-area name (IMD style).
  6. Writes basin_zones.json with the zones and the coverage statistics.

Colab:
    from google.colab import drive; drive.mount('/content/drive')
    !python /content/drive/MyDrive/CycloneProject/derive_basin_zones_colab.py

Locally:
    python scripts/derive_basin_zones_colab.py path/to/ibtracs.NI.list.v04r01.csv out.json

Copy the output to backend/artifacts/models/basin_zones.json (the backend uses it automatically).
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT = Path(os.environ.get("CYCLONE_PROJECT", "/content/drive/MyDrive/CycloneProject"))
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else PROJECT / "data" / "ibtracs.NI.list.v04r01.csv"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else PROJECT / "outputs" / "basin_zones.json"

FIRST_YEAR, LAST_YEAR = 1990, 2025
DOMAIN = dict(lat_min=5.0, lat_max=35.0, lon_min=55.0, lon_max=100.0)   # the occurrence model's grid
DEPRESSION_KT = 17
USA_TO_WMO = 0.88
RADIUS_KM = 350            # same radius the backend uses to summarise a zone
TARGET_COVERAGE = 0.95
MAX_ZONES = 12
MIN_SEPARATION_KM = 350

# Land-sea masks of the model grid (0.25 deg, 5-35N x 55-100E, 121 x 181, from backend/artifacts/data/lsm.npy),
# bit-packed so this script needs no other file: SEA = ocean cells, MODEL = cells the occurrence model covers.
_SEA_B64 = "///////////////////////////AD////////////////////////////BP////////////////////////////j/////////////////////////////////////////////////8/////////////////////////////8H////////////////////////////+B////////////////////////////+A////////////v////////////////AP///////////n////////////////gH///////////z////////////////wD///////////x////////////////4D///////////w////////////////8D///////////wf//////////////H+B///////////gP//////////////B/A///////////wP//////////////A/g///////////4H//////////////gPw///////////8D//////////////gD8f//////////+B//////////////wA/f///////////H//////////////4AP////////////z//////////////8AH////////////5//////////////8AB////////////8//////////////+AAP///////////+f/////////////+AAH////////////H//////////////AAD////////////j//////////////gAB////////////w//////////////gAA////////////4f/////////////gAAf///////////8P/////////////wAAP///////////+D/////////////wAAD////////f///B/////////////wAAB////////v///A/////////////4AAAf///////3///wf////////////4AAAP///////////4H////////////8AAAH///////////8H////////////+AAAD///////////8B/////////////AAAD///////////8A/////////////gAAB///////////+Af////////////gAAA////////////AP////////////wAAAf///////////AH////////////wAAAP///////////gD////////////4AAAH///////////wB////////////4AAAD///////////wA////////////8AAAA///////////4Af///////////8AAAAf//////////8AP///////////+AAAAB////////+H+AH///////////+AAAAA////////8B/AD////////////AAAAAD////////APAB////////////gAAAAAf///////gDAA////////////wAAAAAP///////wAgAP///////////4AAAAAD///////8AAAD///////////4AAAAAAf//////+AAAB///////////8AAAAAAH///////AAAAD//////////8AAAAAAB///////AAAAA//////////+AAAAAAAf//////gAAAAf//////////AAAAAAAD//////wAAAAP//////////gAAAAAAA//////wAAAAAf/////////wAAAAAAAf/////wAAAAAH/////////4AAAAAAAH/////wAAAAAD/////////4AAAAAAAB/////4AAAAAB/////////8AAAAAAAAf////8AAAAAA/////////+AAAAAAAAA////4AAAAAAf/////////AAAAAAAAAP///4AAAAAAF/////////wAAAAAAAAD///4AAAAAAA/////////4AAAAAAAAB///4AAAAAAAP///////B4AAAAAAAAA///4AAAAAAAD//////+AMAAAAAAAAAf//8AAAAAAAA///////AGAAAAAAAAAH//8AAAAAAAAf/////+ACAAAAAAAAAAU/+AAAAAAAAH/////+AAAAAAAAAAAAAAfAAAAAAAAD//////AAAAAAAAAAAAAAHgAAAAAAAB//////8AAAAAAAAAAAAABgAAAAAAAB///////AAAAAAAAAAAAAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAB//////4AAAAAAAAAAAAAAAAAAAAAAH//////4AAAAAAAAAAAAAAAAAAAAAAf//////AgAAAAAAAAAAAAAAAAAAAAAf//////gAAAAAAAAAAAAAAAAAAAAAAf//////wAAAAAAAAAAAAAAAAAAAAAAf//////wAAAAAAAAAAAAAAAAAAAAAIP//////gAAAAAAAAAAAAAAAAAAAAAGH//8H//wAAAAAAAAAAAAAAAAAAAAADD/4AAAAAAAAAAAAAAAAAAAAAAAAAAB58AAAAAAAAAAAAAAAAAAAAAAAAAAAA+4AAAAAAAAAAAAAAAAAAAAAAAAAAAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
_MODEL_B64 = "////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9/////////////////////////////+/////////////////////////////+P/////////////////////////////D/////////////////////////////A/////////////////////////////gf////////////////////////////wP////////////////////////////wH////////////////////////////wD////////////////////////////4B////////////////////////////4Af///////////////////////////4AP///////////////////////////8AH///////////////////////////8AD///////////////////////////+AB////////////////////////////AA////////////////////////////gAf///////////////////////////wAP///////////////////////////wAH/////////////j/////////////4AD/////////////h/////////////4AB/////////////w/////////////8AA/////////////4f////////////8AAf////////////4P////////////+AAH////////////8H////////////+AAD////////////+D/////////////AAA/////////////B/////////////AAAP////////////g/////////////gAAD////////////gf////////////wAAAf///////////gP////////////4AAAH///////////wH////////////8AAAAf//////////wD////////////8AAAAH/////////fwB////////////+AAAAB/////////nwA////////////+AAAAAf////////gAAf////////////AAAAAD////////wAAP////////////gAAAAA////////4AAB////////////wAAAAAP///////4AAAf///////////4AAAAAD///////4AAAH///////////8AAAAAA///////4AAAB///////////+AAAAAAP//////8AAAAP///////////AAAAAAD//////+AAAAH///////////gAAAAAA//////+AAAAD///////////wAAAAAAP/////+AAAAA///////////4AAAAAAD/////+AAAAAP//////////8AAAAAAAP////8AAAAAD//////////8AAAAAAAH////8AAAAAA//////////+AAAAAAAD////+AAAAAAH//////////AAAAAAAA////+AAAAAAD//////////AAAAAAAAP////AAAAAAP//////////AAAAAAAAD////gAAAAA///////////AAAAAAAAA////wAAAAA//////////fAAAAAAAAAD///wAAAAA//////////gAAAAAAAAAAAD/wAAAAA//////////gAAAAAAAAAAAA/wAAAAH//////////gAAAAAAAAAAAAPwAAAAD//////////gAAAAAAAAAAAAAAAAAAB//////////gAAAAAAAAAAAAAAAAAAA//////////wAAAAAAAAAAAAAAAAAAAf/////////wAAAAAAAAAAAAAAAAAAAP/////////wAAAAAAAAAAAAAAAAAAAH/////////wAAAAAAAAAAAAAAAAAAAD////////4AAAAAAAAAAAAAAAAAAAAB////////4AAAAAAAAAAAAAAAAAAAAA////////4AAAAAAAAAAAAAAAAAAAAAf///////4AAAAAAAAAAAAAAAAAAAAAP///+///4AAAAAAAAAAAAAAAAAAAAAH//8AAAAAAAAAAAAAAAAAAAAAAAAAAD//AAAAAAAAAAAAAAAAAAAAAAAAAAAB//gAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAP/+AAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAP//gAAAAAAAAAAAAAAAAAAAAAAAAAAP//wAAAAAAAAAAAAAAAAAAAAAAAAAAH//wAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAB//wAAAAAAAAAAAAAAAAAAAAAAAAAAA/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="


def _mask(b64):
    import base64
    bits = np.unpackbits(np.frombuffer(base64.b64decode(b64), np.uint8))[:121 * 181]
    return bits.reshape(121, 181).astype(bool)


SEA, MODEL = _mask(_SEA_B64), _mask(_MODEL_B64)


def on_mask(mask, lat, lon):
    iy = np.clip(np.rint((np.asarray(lat) - DOMAIN["lat_min"]) / 0.25).astype(int), 0, 120)
    ix = np.clip(np.rint((np.asarray(lon) - DOMAIN["lon_min"]) / 0.25).astype(int), 0, 180)
    return mask[iy, ix]

# Standard sea-area names (IMD marine bulletin style) with a representative point.
NAMES = [
    ("Andaman Sea", "Bay of Bengal", 12.0, 96.0),
    ("Southeast Bay of Bengal", "Bay of Bengal", 9.0, 90.0),
    ("Southwest Bay of Bengal", "Bay of Bengal", 9.5, 83.0),
    ("South Bay of Bengal", "Bay of Bengal", 7.0, 86.5),
    ("Central Bay of Bengal", "Bay of Bengal", 14.5, 88.0),
    ("West-central Bay & Andhra Coast", "Bay of Bengal", 16.0, 83.5),
    ("East-central Bay of Bengal", "Bay of Bengal", 15.5, 92.0),
    ("Northwest Bay & Odisha Coast", "Bay of Bengal", 19.5, 87.0),
    ("North Bay & West Bengal-Bangladesh Coast", "Bay of Bengal", 21.0, 89.5),
    ("Northeast Bay & Myanmar Coast", "Bay of Bengal", 18.5, 93.0),
    ("Comorin & Gulf of Mannar", "Arabian Sea", 7.5, 78.0),
    ("SE Arabian Sea & Lakshadweep", "Arabian Sea", 10.5, 72.5),
    ("East-central Arabian Sea", "Arabian Sea", 15.5, 70.5),
    ("Central Arabian Sea", "Arabian Sea", 15.0, 64.5),
    ("Southwest Arabian Sea", "Arabian Sea", 10.0, 60.0),
    ("NE Arabian Sea & Gujarat Coast", "Arabian Sea", 21.5, 67.5),
    ("NW Arabian Sea & Oman Coast", "Arabian Sea", 20.0, 60.5),
]


def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371.0 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def load_fixes(path):
    df = pd.read_csv(path, skiprows=[1], low_memory=False, keep_default_na=False, na_values=[" ", ""])
    df.columns = [c.strip().upper() for c in df.columns]
    if "TRACK_TYPE" in df:
        df = df[df["TRACK_TYPE"].astype(str).str.strip().str.lower() == "main"]
    if "BASIN" in df:
        df = df[df["BASIN"].astype(str).str.strip() == "NI"]
    df["ISO_TIME"] = pd.to_datetime(df["ISO_TIME"], errors="coerce")
    for c in ("LAT", "LON", "WMO_WIND", "USA_WIND", "SEASON"):
        if c in df:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    wind = df["WMO_WIND"] if "WMO_WIND" in df else pd.Series(np.nan, index=df.index)
    if "USA_WIND" in df:
        wind = wind.fillna(df["USA_WIND"] * USA_TO_WMO)
    df["wind"] = wind
    year = df["SEASON"] if "SEASON" in df else df["ISO_TIME"].dt.year
    df = df[(year >= FIRST_YEAR) & (year <= LAST_YEAR)]
    df = df[df["ISO_TIME"].dt.hour.isin([0, 6, 12, 18]) & (df["ISO_TIME"].dt.minute == 0)]   # 6-hourly
    df = df.dropna(subset=["LAT", "LON", "wind", "ISO_TIME"])
    df = df[df["wind"] >= DEPRESSION_KT]
    inside = df["LAT"].between(DOMAIN["lat_min"], DOMAIN["lat_max"]) & \
        df["LON"].between(DOMAIN["lon_min"], DOMAIN["lon_max"])
    df = df[inside]
    df = df[on_mask(MODEL, df["LAT"].to_numpy(float), df["LON"].to_numpy(float))]
    return df.sort_values(["SID", "ISO_TIME"]).reset_index(drop=True)


def choose_zones(lat, lon):
    cand = np.unique(np.c_[np.round(lat * 2) / 2, np.round(lon * 2) / 2], axis=0)
    cand = cand[on_mask(SEA, cand[:, 0], cand[:, 1])]                          # zone centres at sea
    d = haversine(cand[:, :1], cand[:, 1:2], lat[None, :], lon[None, :])        # candidates x points
    covers = d <= RADIUS_KM
    covered = np.zeros(len(lat), bool)
    chosen = []
    while covered.mean() < TARGET_COVERAGE and len(chosen) < MAX_ZONES:
        gain = (covers & ~covered).sum(axis=1).astype(float)
        for c in chosen:                                   # keep zones apart
            gain[haversine(cand[:, 0], cand[:, 1], cand[c, 0], cand[c, 1]) < MIN_SEPARATION_KM] = -1
        best = int(np.argmax(gain))
        if gain[best] <= 0:
            break
        chosen.append(best)
        covered |= covers[best]
    return cand[chosen], covers[chosen]


def name_zones(centres):
    """Give each zone a different standard name, minimising the total distance (optimal assignment)."""
    names = [n for n in NAMES if n[1] != "Land"]
    cost = np.array([[haversine(lat, lon, n[2], n[3]) for n in names] for lat, lon in centres])
    try:
        from scipy.optimize import linear_sum_assignment
        rows, cols = linear_sum_assignment(cost)
        pick = dict(zip(rows, cols))
    except ImportError:                                   # greedy fallback
        pick, used = {}, set()
        for i in np.argsort(cost.min(axis=1)):
            j = next(j for j in np.argsort(cost[i]) if j not in used)
            pick[i] = j
            used.add(j)
    return [names[pick[i]] for i in range(len(centres))]


def slug(s):
    import re
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    fx = load_fixes(SRC)
    if fx.empty:
        raise SystemExit(f"no usable fixes in {SRC}")
    lat, lon = fx["LAT"].to_numpy(float), fx["LON"].to_numpy(float)
    gen = fx.groupby("SID").first()
    glat, glon = gen["LAT"].to_numpy(float), gen["LON"].to_numpy(float)

    centres, covers = choose_zones(lat, lon)
    names = name_zones(centres)
    zones = []
    for (clat, clon), cov, (name, basin, _, _) in zip(centres, covers, names):
        g_in = haversine(clat, clon, glat, glon) <= RADIUS_KM
        zones.append({"id": slug(name), "name": name, "basin": basin, "lat": float(clat), "lon": float(clon),
                      "positionShare": round(float(cov.mean()), 3), "genesisCount": int(g_in.sum())})
    # Bay of Bengal first, then Arabian Sea; north to south
    order = {"Bay of Bengal": 0, "Arabian Sea": 1}
    zones.sort(key=lambda z: (order.get(z["basin"], 3), -z["lat"]))

    pos_cov = float(np.any(covers, axis=0).mean())
    gd = haversine(centres[:, :1], centres[:, 1:2], glat[None, :], glon[None, :])
    gen_cov = float((gd <= RADIUS_KM).any(axis=0).mean())
    out = {
        "method": (f"Greedy coverage of IBTrACS North Indian Ocean depression-or-stronger positions "
                   f"{FIRST_YEAR}-{LAST_YEAR} (6-hourly, inside 5-35N 55-100E) with {RADIUS_KM} km circles"),
        "source": SRC.name, "years": [FIRST_YEAR, LAST_YEAR], "radiusKm": RADIUS_KM,
        "storms": int(len(gen)), "positions": int(len(fx)),
        "positionCoverage": round(pos_cov, 3), "genesisCoverage": round(gen_cov, 3),
        "zones": zones,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2))
    print(f"{len(gen)} storms, {len(fx)} positions -> {len(zones)} zones")
    print(f"zones cover {100 * pos_cov:.1f}% of positions and {100 * gen_cov:.1f}% of genesis points")
    for z in zones:
        print(f"  {z['name']:<42} {z['lat']:5.1f}N {z['lon']:5.1f}E  positions {100 * z['positionShare']:4.1f}%  "
              f"genesis {z['genesisCount']}")
    print("written:", OUT)


if __name__ == "__main__":
    main()
