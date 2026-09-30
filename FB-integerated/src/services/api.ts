// Frontend-only preview. Set VITE_API_URL explicitly to connect a compatible API.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    total_records_stored: number;
    persistence_enabled: boolean;
  };
  ml_inference_engine: {
    models_loaded: boolean;
    intensity_horizons: string[];
    trajectory_model: boolean;
    rapid_intensification: boolean;
  };
  gis_risk_engine: {
    status: string;
    coastal_districts_monitored: number;
    surge_model: string;
    warning_tiers: string[];
  };
  historical_archive: {
    total_storms: number;
    sources: string[];
  };
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

export async function fetchModelPerformance(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/models/performance`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchCycloneGraphData(stormId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/graphs`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchEvacuationPlan(stormId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/evacuation-plan`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchSmsAlerts(stormId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/sms-alerts`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchMarineHazards(stormId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/marine-hazards`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchSatelliteDetection(stormId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/satellite-detection`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export {
  API_BASE_URL,
  GDACS_BASE_URL,
  GDACS_EVENTS_URL,
  GDACS_GEOMETRY_URL,
  IBTRACS_ERDDAP_URL,
};
export type { ApiResponse };



