import type { HistoricalStormSummary, HistoricalReplayData } from '../types/historical';
import { API_BASE_URL } from './api';

export type CycloneSummary = HistoricalStormSummary;

export async function fetchHistoricalCatalog(): Promise<HistoricalStormSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/historical/catalog`);
    if (res.ok) {
      const json = await res.json();
      return json.storms || [];
    }
  } catch (err) {
    console.warn('Historical catalog fetch error:', err);
  }
  return [];
}

export async function fetchHistoricalReplay(stormId: string, step?: number): Promise<HistoricalReplayData | null> {
  try {
    const url = step !== undefined 
      ? `${API_BASE_URL}/historical/${stormId}/replay?step=${step}`
      : `${API_BASE_URL}/historical/${stormId}/replay`;
      
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
  } catch (err) {
    console.warn('Historical replay fetch error:', err);
  }
  return null;
}
