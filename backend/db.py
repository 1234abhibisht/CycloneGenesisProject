"""SQLite storage: storm fixes (live observations), forecasts, occurrence runs, pipeline log, settings."""
import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone

import config as CFG

_LOCK = threading.RLock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS storm_fixes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    storm_id TEXT NOT NULL, name TEXT, time TEXT NOT NULL,
    lat REAL NOT NULL, lon REAL NOT NULL, wind REAL, pres REAL,
    source TEXT NOT NULL, inserted_at TEXT NOT NULL,
    UNIQUE(storm_id, time, source)
);
CREATE INDEX IF NOT EXISTS ix_fix_storm ON storm_fixes(storm_id, time);
CREATE TABLE IF NOT EXISTS forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    storm_id TEXT NOT NULL, issued_at TEXT NOT NULL, mode TEXT NOT NULL,
    payload TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(storm_id, issued_at, mode)
);
CREATE TABLE IF NOT EXISTS occurrence_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valid_time TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pipeline_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL, finished_at TEXT, status TEXT, message TEXT
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
"""


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@contextmanager
def connect():
    with _LOCK:
        con = sqlite3.connect(CFG.DB_PATH, timeout=30)
        con.row_factory = sqlite3.Row
        try:
            yield con
            con.commit()
        finally:
            con.close()


def init():
    with connect() as con:
        con.executescript(SCHEMA)


# ---------------------------------------------------------------- settings
def get_setting(key, default=None):
    with connect() as con:
        r = con.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
    return json.loads(r["value"]) if r else default


def set_setting(key, value):
    with connect() as con:
        con.execute("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                    (key, json.dumps(value)))


# ---------------------------------------------------------------- storm fixes
def upsert_fixes(rows):
    """rows: iterable of dicts with storm_id, name, time (ISO), lat, lon, wind, pres, source."""
    n = 0
    with connect() as con:
        for r in rows:
            cur = con.execute(
                "INSERT OR IGNORE INTO storm_fixes(storm_id, name, time, lat, lon, wind, pres, source, inserted_at) "
                "VALUES(?,?,?,?,?,?,?,?,?)",
                (r["storm_id"], r.get("name", ""), r["time"], float(r["lat"]), float(r["lon"]),
                 None if r.get("wind") is None else float(r["wind"]),
                 None if r.get("pres") is None else float(r["pres"]), r["source"], now_iso()))
            n += cur.rowcount
    return n


def fixes_for(storm_id):
    with connect() as con:
        rows = con.execute("SELECT * FROM storm_fixes WHERE storm_id=? ORDER BY time", (storm_id,)).fetchall()
    return [dict(r) for r in rows]


def storm_ids_since(time_iso):
    with connect() as con:
        rows = con.execute("SELECT storm_id, MAX(time) AS last, MAX(name) AS name FROM storm_fixes "
                           "GROUP BY storm_id HAVING MAX(time) >= ? ORDER BY last DESC", (time_iso,)).fetchall()
    return [dict(r) for r in rows]


def rename_storm(old_id, new_id):
    """Move every fix and forecast of old_id to new_id (used when two feeds named the same storm differently)."""
    with connect() as con:
        for table in ("storm_fixes", "forecasts"):
            con.execute(f"UPDATE OR IGNORE {table} SET storm_id=? WHERE storm_id=?", (new_id, old_id))
            con.execute(f"DELETE FROM {table} WHERE storm_id=?", (old_id,))   # rows that already existed under new_id


def delete_manual_fix(fix_id):
    """Delete one hand-entered position (feed positions from IBTrACS/GDACS are never deleted). Returns rows deleted."""
    with connect() as con:
        return con.execute("DELETE FROM storm_fixes WHERE id=? AND source='MANUAL'", (int(fix_id),)).rowcount


def last_storm():
    """Most recent storm in the database (id, name, time of its last position), or None."""
    with connect() as con:
        r = con.execute("SELECT storm_id, name, time FROM storm_fixes ORDER BY time DESC, id DESC LIMIT 1").fetchone()
    return dict(r) if r else None


def recent_fixes(limit=50):
    with connect() as con:
        rows = con.execute("SELECT * FROM storm_fixes ORDER BY time DESC, id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


def count_fixes():
    with connect() as con:
        return con.execute("SELECT COUNT(*) FROM storm_fixes").fetchone()[0]


# ---------------------------------------------------------------- forecasts
def save_forecast(storm_id, issued_at, mode, payload):
    with connect() as con:
        con.execute("INSERT INTO forecasts(storm_id, issued_at, mode, payload, created_at) VALUES(?,?,?,?,?) "
                    "ON CONFLICT(storm_id, issued_at, mode) DO UPDATE SET payload=excluded.payload, "
                    "created_at=excluded.created_at",
                    (storm_id, issued_at, mode, json.dumps(payload), now_iso()))


def latest_forecast(storm_id, mode="live"):
    with connect() as con:
        r = con.execute("SELECT payload FROM forecasts WHERE storm_id=? AND mode=? ORDER BY issued_at DESC, id DESC "
                        "LIMIT 1", (storm_id, mode)).fetchone()
    return json.loads(r["payload"]) if r else None


def latest_forecasts(mode="live", since_iso=None):
    q = ("SELECT f.payload FROM forecasts f JOIN (SELECT storm_id, MAX(issued_at) m FROM forecasts WHERE mode=? "
         "GROUP BY storm_id) x ON f.storm_id=x.storm_id AND f.issued_at=x.m WHERE f.mode=?")
    args = [mode, mode]
    if since_iso:
        q += " AND f.issued_at >= ?"
        args.append(since_iso)
    with connect() as con:
        rows = con.execute(q + " ORDER BY f.issued_at DESC", args).fetchall()
    return [json.loads(r["payload"]) for r in rows]


def count_forecasts():
    with connect() as con:
        return con.execute("SELECT COUNT(*) FROM forecasts").fetchone()[0]


# ---------------------------------------------------------------- occurrence
def save_occurrence(valid_time, payload):
    with connect() as con:
        con.execute("INSERT INTO occurrence_runs(valid_time, payload, created_at) VALUES(?,?,?) "
                    "ON CONFLICT(valid_time) DO UPDATE SET payload=excluded.payload, created_at=excluded.created_at",
                    (valid_time, json.dumps(payload), now_iso()))


def latest_occurrence():
    with connect() as con:
        r = con.execute("SELECT payload FROM occurrence_runs ORDER BY valid_time DESC LIMIT 1").fetchone()
    return json.loads(r["payload"]) if r else None


# ---------------------------------------------------------------- pipeline log
def log_start():
    with connect() as con:
        return con.execute("INSERT INTO pipeline_log(started_at, status) VALUES(?, 'running')", (now_iso(),)).lastrowid


def log_end(run_id, status, message):
    with connect() as con:
        con.execute("UPDATE pipeline_log SET finished_at=?, status=?, message=? WHERE id=?",
                    (now_iso(), status, message[:4000], run_id))


def last_runs(limit=10):
    with connect() as con:
        rows = con.execute("SELECT * FROM pipeline_log ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]
