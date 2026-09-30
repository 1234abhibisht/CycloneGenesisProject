import type { ActiveCyclone, OperationalStandbyState } from '../types/cyclone';
import { API_BASE_URL } from './api';
import { isFreshLiveObservation } from './observationFreshness';

export type ActiveCycloneResponse = 
  | { active: true; data: ActiveCyclone[]; status: string }
  | { active: false; standby: OperationalStandbyState; status: 'NO_ACTIVE_CYCLONE'; unavailable?: boolean };

let pending: Promise<ActiveCycloneResponse> | undefined;
window.addEventListener('cyclone-refresh', () => { pending = undefined; });
export function fetchActiveCycloneData(): Promise<ActiveCycloneResponse> {
  if (pending) return pending;
  const request = readActiveCycloneData().finally(() => { if (pending === request) pending = undefined; });
  pending = request; return request;
}

async function readActiveCycloneData(): Promise<ActiveCycloneResponse> {
  // Live ingestion can wait on third-party weather feeds. Never leave the
  // command center in a permanent loading state when a provider is slow.
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/active`, { signal: controller.signal, cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'NO_ACTIVE_CYCLONE' || json.active === false) {
        return {
          active: false,
          status: 'NO_ACTIVE_CYCLONE',
          unavailable: json.unavailable === true,
          standby: {
            status: 'NO_ACTIVE_CYCLONE',
            active: false,
            monitoringRegion: json.monitoringRegion || 'North Indian Ocean (Bay of Bengal & Arabian Sea)',
            environmentalBaseline: json.environmentalBaseline || {},
            lastChecked: json.lastChecked || new Date().toISOString(),
            sources: json.sources || [],
            message: json.message || 'No qualifying cyclone record was returned by the observation feed.'
          }
        };
      }
      
      if (json.data && json.data.length > 0) {
        if (json.status === 'LIVE' && !isFreshLiveObservation(json.data[0].currentPosition?.timestamp)) {
          throw new Error('Latest observation is outside the live freshness window.');
        }
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

  // A failed request is unavailable, with no invented environmental measurements.
  return {
    active: false,
    status: 'NO_ACTIVE_CYCLONE',
    // This is not a verified "all clear". It only means the backend could
    // not be reached; consumers must clear the live state.
    unavailable: true,
    standby: {
      status: 'NO_ACTIVE_CYCLONE',
      active: false,
      monitoringRegion: 'North Indian Ocean (Bay of Bengal & Arabian Sea)',
      environmentalBaseline: {},
      lastChecked: new Date().toISOString(),
      sources: [],
      message: 'Observation service unavailable. Current conditions could not be verified.'
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
