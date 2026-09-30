// Use IPv4 explicitly for local development. On this machine `localhost`
// resolves to IPv6 first while the Flask server listens on 127.0.0.1 only,
// which made otherwise healthy API calls silently fall back to demo data.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Operational data source URLs
const GDACS_BASE_URL = 'https://www.gdacs.org/gdacsapi/api';
const GDACS_EVENTS_URL = `${GDACS_BASE_URL}/events/geteventlist/SEARCH`;
const GDACS_GEOMETRY_URL = `${GDACS_BASE_URL}/polygons/getgeometry`;
const IBTRACS_ERDDAP_URL = 'https://www.ncei.noaa.gov/erddap/tabledap/IBTrACS_ALL.json';

export const USE_OPERATIONAL = true;
export const USE_MOCK_DATA = false;

interface ApiResponse<T> {
  data: T;
  status: number | string;
  message?: string;
  dataSource?: 'live' | 'replay' | 'historical';
  lastUpdated?: string;
}

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Request to ${endpoint} failed (${response.status})`);
  }
  return await response.json() as ApiResponse<T>;
}

export interface BackendStatus {
  status: string;
  system: string;
  version: string;
  operational_mode: 'live' | 'replay';
  timestamp: string;
  sqlite_database: {
    status: string;
    total_records_stored: number; // storm fixes (positions) stored
    forecasts_stored?: number;
    persistence_enabled: boolean;
  };
  ml_inference_engine: {
    models_loaded: boolean;
    intensity_horizons: string[];
    trajectory_model: boolean;
    rapid_intensification: boolean;
    occurrence_model?: boolean;
    main_model?: string;
    errors?: string[];
  };
  gis_risk_engine: {
    status: string;
    coastal_districts_monitored: number;
    warning_tiers: string[];
    method?: string;
  };
  historical_archive: {
    total_storms: number;
    sources: string[];
  };
  live_data?: {
    gfs_files: number;
    latest_gfs_valid_time: string | null;
    pipeline_running: boolean;
    last_runs: { id: number; started_at: string; finished_at: string | null; status: string; message: string | null }[];
  };
}

export interface StormFixRecord {
  id: number;
  storm_id: string;
  name: string;
  lat: number;
  lon: number;
  wind_speed: number | null;
  pressure: number | null;
  source: string;
  timestamp: string;
}

export async function fetchStormFixes(limit = 15): Promise<StormFixRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sql/records?limit=${limit}`);
    if (res.ok) return (await res.json()).records ?? [];
  } catch {}
  return [];
}

/** Start one live cycle now (GFS download of missing files + storms + forecasts). */
export async function triggerLiveRefresh(download = true): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ download }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Add a storm position by hand (e.g. from an IMD bulletin). Wind in knots (3-min), pressure in hPa. */
export async function addManualFix(fix: { stormId: string; name: string; time: string; lat: number; lon: number;
  wind?: number | null; pres?: number | null }): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/fixes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([fix]),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface SourceStatus {
  source: string;
  purpose: string;
  role: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  checkedAt: string;
}

export async function fetchSourceStatus(): Promise<SourceStatus[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sources/status`);
    if (!res.ok) return [];
    const payload = await res.json();
    return payload.sources ?? [];
  } catch {
    return [];
  }
}

export async function fetchBackendStatus(): Promise<BackendStatus | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/system/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function switchOperationalMode(mode: 'live' | 'replay'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export {
  API_BASE_URL,
  GDACS_BASE_URL,
  GDACS_EVENTS_URL,
  GDACS_GEOMETRY_URL,
  IBTRACS_ERDDAP_URL,
};
export type { ApiResponse };

