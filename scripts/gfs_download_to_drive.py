"""
GFS 0.25° LIVE DATA DOWNLOADER  (NOAA NOMADS -> local temp -> rclone -> Google Drive)

Downloads the inputs our cyclone models need for live prediction, same region as ERA5
(5–35 N, 55–100 E), for the last BACKFILL_DAYS days, one small GRIB2 file at a time.
Each file = one GFS cycle (00/06/12/18 UTC) + one forecast hour:
    f000  -> analysis at the cycle time            (t)
    f003  -> 3-hour forecast                       (t + 3 h, fills the 3-hourly gap; rain 0–3 h)
    f006  -> 6-hour forecast                       (rain 0–6 h, so rain 3–6 h = f006 − f003)
Already-uploaded files are skipped, so you can re-run any time (it resumes).
Optional LOOP mode keeps checking for new cycles and deletes Drive files older than KEEP_DAYS.

Needs:  pip install requests      and rclone configured with a remote called "gdrive"
Note:   NOMADS keeps only about the last 10 days of GFS.
"""
import subprocess
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

# ============================================================
# CONFIGURATION
# ============================================================

# ---- CHANGE THESE ----
BACKFILL_DAYS = 2            # how many past days to fetch (our features look back 24 h; 2 days = safe buffer)
LOOP = False                 # True = keep running and fetch each new cycle every hour
KEEP_DAYS = 3                # in LOOP mode, delete Drive files older than this (rolling store)

RCLONE_EXE = r"C:\Users\Abhishek Bisht\Downloads\rclone-v1.75.1-windows-amd64\rclone.exe"
LOCAL_TEMP = Path(r"D:\gfs_temp")

# ---- DON'T CHANGE BELOW THIS ----
LOCAL_TEMP.mkdir(parents=True, exist_ok=True)
GDRIVE_BASE = "gdrive:GFS_Live_Data"

# Same box as ERA5  [North, West, South, East] = [35, 55, 5, 100]
AREA = dict(toplat=35, leftlon=55, bottomlat=5, rightlon=100)

CYCLES = ["00", "06", "12", "18"]
FORECAST_HOURS = ["000", "003", "006"]
GFS_DELAY_HOURS = 5          # a cycle is usually complete on NOMADS ~4–5 h after its time

NOMADS = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
MAX_RETRIES = 5
RETRY_WAIT_SECONDS = 60
PAUSE_BETWEEN_REQUESTS = 3   # be polite to NOMADS (they block heavy users)

# ============================================================
# VARIABLES  (GFS name -> matches our ERA5 folder)
# ============================================================
#   PRMSL  mean sea-level pressure      -> MSLP (msl)
#   TMP    surface                      -> SST (sst; skin temperature, = SST over sea)
#   UGRD / VGRD 10 m                    -> 10m_U_Wind / 10m_V_Wind
#   TMP / DPT 2 m                       -> 2m_Temperature / 2m_Dewpoint
#   APCP   surface (f003/f006 only)     -> Total_Precipitation (mm -> m later)
#   RH     850/700/600/500 hPa          -> Relative_Humidity
#   TMP    850/700/500/300 hPa          -> Temperature_PL
#   UGRD / VGRD 850…200 hPa             -> U_Wind_PL / V_Wind_PL
#   HGT    850/500/200 hPa              -> Geopotential (height m × 9.80665 -> z later)
VARIABLES = ["PRMSL", "TMP", "UGRD", "VGRD", "DPT", "APCP", "RH", "HGT"]
LEVELS = [
    "mean_sea_level", "surface", "10_m_above_ground", "2_m_above_ground",
    "850_mb", "700_mb", "600_mb", "500_mb", "400_mb", "300_mb", "250_mb", "200_mb",
]

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def file_exists_on_drive(drive_folder, filename):
    result = subprocess.run([RCLONE_EXE, "lsf", f"{drive_folder}/{filename}"], capture_output=True, text=True)
    return result.returncode == 0 and result.stdout.strip() != ""


def upload_and_delete(local_path, drive_folder):
    print(f"  Uploading to Drive: {local_path.name}")
    result = subprocess.run([RCLONE_EXE, "copy", str(local_path), drive_folder], capture_output=True, text=True)
    if result.returncode == 0:
        local_path.unlink()
        print("  Uploaded OK, local copy deleted")
        return True
    print(f"  UPLOAD FAILED: {result.stderr}\n  Keeping local file: {local_path}")
    return False


def build_url(date_str, cycle, fhour):
    params = {
        "dir": f"/gfs.{date_str}/{cycle}/atmos",
        "file": f"gfs.t{cycle}z.pgrb2.0p25.f{fhour}",
        "subregion": "",
        **{k: str(v) for k, v in AREA.items()},
    }
    params.update({f"var_{v}": "on" for v in VARIABLES})
    params.update({f"lev_{l}": "on" for l in LEVELS})
    return NOMADS, params


def safe_download(date_str, cycle, fhour):
    """Download one GFS file -> upload to Drive -> delete local. Skips if already on Drive."""
    drive_folder = f"{GDRIVE_BASE}/{date_str}"
    filename = f"gfs_{date_str}_{cycle}z_f{fhour}.grib2"

    if file_exists_on_drive(drive_folder, filename):
        print(f"  Already on Drive, skipping: {filename}")
        return True

    local_file = LOCAL_TEMP / filename
    temp_file = LOCAL_TEMP / (filename + ".part")
    if local_file.exists() and local_file.stat().st_size > 1024:
        print(f"  Found local file from previous run, uploading: {filename}")
        return upload_and_delete(local_file, drive_folder)
    temp_file.unlink(missing_ok=True)

    url, params = build_url(date_str, cycle, fhour)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"\nDownloading: {filename}  (attempt {attempt}/{MAX_RETRIES})")
            r = requests.get(url, params=params, timeout=180)
            if r.status_code == 404 or b"data file is not present" in r.content[:500]:
                print("  Not on NOMADS yet (or too old) — skipping for now")
                return False
            r.raise_for_status()
            if not r.content.startswith(b"GRIB") or len(r.content) < 10_000:
                raise RuntimeError(f"not a valid GRIB2 file ({len(r.content)} bytes): {r.content[:200]!r}")
            temp_file.write_bytes(r.content)
            temp_file.replace(local_file)
            print(f"  Download complete: {filename} [{local_file.stat().st_size / 1e6:.1f} MB]")
            time.sleep(PAUSE_BETWEEN_REQUESTS)
            return upload_and_delete(local_file, drive_folder)
        except KeyboardInterrupt:
            print("\nStopped manually. Run again later — it will resume.")
            raise
        except Exception as e:
            print(f"  Download failed: {e}")
            temp_file.unlink(missing_ok=True)
            if attempt < MAX_RETRIES:
                wait = RETRY_WAIT_SECONDS * attempt
                print(f"  Retrying in {wait} s...")
                time.sleep(wait)
    print(f"  FAILED AFTER {MAX_RETRIES} ATTEMPTS: {filename}")
    return False


def available_cycles(days_back):
    """All GFS cycles from `days_back` days ago up to the latest one that should be complete."""
    latest = datetime.now(timezone.utc) - timedelta(hours=GFS_DELAY_HOURS)
    latest = latest.replace(hour=(latest.hour // 6) * 6, minute=0, second=0, microsecond=0)
    t = latest - timedelta(days=days_back)
    out = []
    while t <= latest:
        out.append((t.strftime("%Y%m%d"), f"{t.hour:02d}"))
        t += timedelta(hours=6)
    return out


def download_cycles(days_back):
    cycles = available_cycles(days_back)
    print(f"\nCycles to check: {len(cycles)}  ({cycles[0][0]} {cycles[0][1]}z -> {cycles[-1][0]} {cycles[-1][1]}z)")
    failed = []
    for date_str, cycle in cycles:
        for fh in FORECAST_HOURS:
            if not safe_download(date_str, cycle, fh):
                failed.append(f"{date_str}_{cycle}z_f{fh}")
    return failed


def delete_old_on_drive(keep_days):
    print(f"\nDeleting Drive files older than {keep_days} days from {GDRIVE_BASE} ...")
    subprocess.run([RCLONE_EXE, "delete", GDRIVE_BASE, "--min-age", f"{keep_days}d"], capture_output=True, text=True)
    subprocess.run([RCLONE_EXE, "rmdirs", GDRIVE_BASE, "--leave-root"], capture_output=True, text=True)

# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 70)
    print("GFS 0.25° LIVE DOWNLOADER (NOMADS -> RCLONE -> GOOGLE DRIVE)")
    print("=" * 70)
    print(f"Backfill: last {BACKFILL_DAYS} days | Loop: {LOOP} | Region: {AREA}")
    print(f"Temp folder: {LOCAL_TEMP} | Drive folder: {GDRIVE_BASE}")

    failed = download_cycles(BACKFILL_DAYS)
    if failed:
        print(f"\n{len(failed)} file(s) not downloaded (usually the newest cycle not ready yet): {failed[:6]}")

    while LOOP:
        print("\nSleeping 1 hour before checking for a new GFS cycle...")
        time.sleep(3600)
        download_cycles(1)
        delete_old_on_drive(KEEP_DAYS)

    print("\n" + "=" * 70)
    print("DONE — GFS files are on Google Drive in", GDRIVE_BASE)
    print("=" * 70)


if __name__ == "__main__":
    main()
