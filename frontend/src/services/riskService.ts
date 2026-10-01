import type { GISRiskAnalysisResult, StrikeVerification } from '../types/risk';
import { API_BASE_URL } from './api';
import type { District } from '../types/risk';

export async function fetchCoastalDistrictRoster(): Promise<District[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/districts/coastal`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.districts ?? null;
  } catch {
    return null;
  }
}

export async function fetchDistrictRiskAnalysis(stormId: string = 'ACTIVE', step?: number): Promise<GISRiskAnalysisResult | null> {
  const controller = new AbortController();
  // replay steps are computed on first request (1,000 simulated tracks), so allow more time
  const timeoutId = window.setTimeout(() => controller.abort(), step !== undefined ? 30_000 : 8_000);

  try {
    const query = step !== undefined ? `?step=${step}` : '';
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/risk${query}`, { signal: controller.signal });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    if (!(err instanceof Error && err.name === 'AbortError')) {
      console.warn('Risk analysis fetch notice:', err);
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
  return null;
}

export interface StrikeVerificationResponse {
  state: 'ready' | 'running' | 'not_started' | 'error';
  data: StrikeVerification | null;
  error?: string | null;
}

/** Strike probabilities vs. reality for all test storms (computed once on the server). */
export async function fetchStrikeVerification(): Promise<StrikeVerificationResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/historical/strike-verification`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
