import type { GISRiskAnalysisResult } from '../types/risk';
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

export async function fetchDistrictRiskAnalysis(stormId: string = 'ACTIVE'): Promise<GISRiskAnalysisResult | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${stormId}/risk`, { signal: controller.signal });
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
