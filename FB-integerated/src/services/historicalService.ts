import type { HistoricalStormSummary, HistoricalReplayData } from '../types/historical';
import { API_BASE_URL } from './api';
import { historicalCyclones } from '../data/mockCyclones';

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

// Backwards compatibility functions
export async function getHistoricalCyclones(_filters?: any): Promise<any[]> {
  const storms = await fetchHistoricalCatalog();
  if (storms.length > 0) return storms;
  return historicalCyclones;
}

export async function searchCyclones(query: string): Promise<any[]> {
  const storms = await getHistoricalCyclones();
  return storms.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
}

export async function getSimilarCyclones(_stormId: string): Promise<any[]> {
  return (await getHistoricalCyclones()).slice(0, 3);
}
