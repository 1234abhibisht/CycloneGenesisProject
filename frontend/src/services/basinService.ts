import { API_BASE_URL } from './api';

export type BasinRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface BasinZone {
  id: string;
  name: string;
  basin: string;
  lat: number;
  lon: number;
  sst: number | null; // °C, GFS
  shear: number | null; // kt, 200-850 hPa
  humidity: number | null; // %, 700-500 hPa mean
  probability: number | null; // % chance of a cyclonic storm (or stronger) within 200 km in the next 24 h
  riskLevel: BasinRiskLevel;
}

/** One 0.5° sea cell of the occurrence map (only cells with some risk are sent). */
export interface OccurrenceCell {
  lat: number;
  lon: number;
  pAny: number; // any depression or stronger within 200 km in 24 h
  pCsPlus: number; // cyclonic storm or stronger
  warning: boolean; // pCsPlus above the calibrated warning threshold
}

export interface BasinAssessment {
  generatedAt: string;
  source: string;
  status: 'LIVE' | 'LATEST_AVAILABLE' | 'OFFLINE';
  summary: string;
  zones: BasinZone[];
  cells?: OccurrenceCell[];
}

const FALLBACK: BasinAssessment = {
  generatedAt: new Date().toISOString(),
  source: 'Forecast service not reachable',
  status: 'OFFLINE',
  summary: 'The backend could not be reached, so no probabilities are shown. Start it with `python app.py`.',
  zones: [
    ['andaman', 'Andaman Sea', 'Bay of Bengal', 10, 94.5],
    ['south-bob', 'South Bay of Bengal', 'Bay of Bengal', 8.5, 85],
    ['central-bob', 'Central Bay of Bengal', 'Bay of Bengal', 14.5, 87.5],
    ['north-bob', 'North Bay & Odisha Coast', 'Bay of Bengal', 19.5, 88.5],
    ['se-arabian', 'SE Arabian Sea & Lakshadweep', 'Arabian Sea', 10, 72],
    ['central-arabian', 'Central Arabian Sea', 'Arabian Sea', 17, 67],
    ['nw-arabian', 'NW Arabian Sea & Oman Coast', 'Arabian Sea', 22.5, 63],
  ].map(([id, name, basin, lat, lon]) => ({
    id: String(id), name: String(name), basin: String(basin), lat: Number(lat), lon: Number(lon),
    sst: null, shear: null, humidity: null, probability: null, riskLevel: 'LOW' as BasinRiskLevel,
  })),
};

export async function getBasinAssessment(): Promise<BasinAssessment> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${API_BASE_URL}/basin/risk`, { signal: controller.signal });
    if (!response.ok) return FALLBACK;
    const payload = await response.json();
    return payload.data ?? payload;
  } catch {
    return FALLBACK;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
