import type { ActiveCyclone, OperationalStandbyState } from '../types/cyclone';
import { API_BASE_URL } from './api';

export type ActiveCycloneResponse = 
  | { active: true; data: ActiveCyclone[]; status: string }
  | { active: false; standby: OperationalStandbyState; status: 'NO_ACTIVE_CYCLONE'; unavailable?: boolean };

// Shown when no GFS run has been processed yet (never invented numbers)
const EMPTY_BASELINE = { sea_surface_temp: null, relative_humidity: null, vertical_wind_shear: null, surface_pressure: null };

export async function fetchActiveCycloneData(): Promise<ActiveCycloneResponse> {
  // Live ingestion can wait on third-party weather feeds. Never leave the
  // command center in a permanent loading state when a provider is slow.
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/active`, { signal: controller.signal });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'NO_ACTIVE_CYCLONE' || json.active === false) {
        return {
          active: false,
          status: 'NO_ACTIVE_CYCLONE',
          standby: {
            status: 'NO_ACTIVE_CYCLONE',
            active: false,
            monitoringRegion: json.monitoringRegion || 'North Indian Ocean (Bay of Bengal & Arabian Sea)',
            environmentalBaseline: json.environmentalBaseline || EMPTY_BASELINE,
            dataValidTime: json.dataValidTime ?? null,
            lastChecked: json.lastChecked || new Date().toISOString(),
            sources: json.sources || ['NOAA_GFS', 'IBTRACS_ACTIVE', 'GDACS'],
            message: json.message || 'Operational Standby: No active tropical cyclone detected.'
          }
        };
      }
      
      if (json.data && json.data.length > 0) {
        return {
          active: true,
          status: json.status || 'LIVE',
          data: json.data as ActiveCyclone[]
        };
      }
    }
  } catch (err) {
    // A timed-out live provider is expected in offline/demo mode. The UI has
    // a safe standby response, so only surface unexpected request failures.
    if (!(err instanceof Error && err.name === 'AbortError')) {
      console.warn('Backend cyclone query notice:', err);
    }
  } finally {
    window.clearTimeout(timeoutId);
  }

  // Climatological Standby State fallback if server unavailable
  return {
    active: false,
    status: 'NO_ACTIVE_CYCLONE',
    // This is not a verified "all clear". It only means the backend could
    // not be reached, so consumers can retain the last verified state.
    unavailable: true,
    standby: {
      status: 'NO_ACTIVE_CYCLONE',
      active: false,
      monitoringRegion: 'North Indian Ocean (Bay of Bengal & Arabian Sea)',
      environmentalBaseline: EMPTY_BASELINE,
      lastChecked: new Date().toISOString(),
      sources: [],
      message: 'The forecast service could not be reached. Start the backend (python app.py) and refresh.'
    }
  };
}

export async function getActiveCyclone(): Promise<ActiveCyclone | null> {
  const res = await fetchActiveCycloneData();
  if (res.active && res.data.length > 0) {
    return res.data[0];
  }
  return null;
}
