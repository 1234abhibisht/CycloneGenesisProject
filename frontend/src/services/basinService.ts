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
  zoneMethod?: string | null; // how the zones were chosen (from IBTrACS), when available
}

const FALLBACK: BasinAssessment = {
  generatedAt: new Date().toISOString(),
  source: 'Forecast service not reachable',
  status: 'OFFLINE',
  summary: 'The backend could not be reached, so no probabilities are shown. Start it with `python app.py`.',
  zones: [   // same zones as backend/artifacts/models/basin_zones.json
    ['northwest-bay-odisha-coast', 'Northwest Bay & Odisha Coast', 'Bay of Bengal', 18.5, 88.5],
    ['west-central-bay-andhra-coast', 'West-central Bay & Andhra Coast', 'Bay of Bengal', 16.0, 82.0],
    ['central-bay-of-bengal', 'Central Bay of Bengal', 'Bay of Bengal', 13.0, 84.5],
    ['southwest-bay-of-bengal', 'Southwest Bay of Bengal', 'Bay of Bengal', 12.5, 80.5],
    ['southeast-bay-of-bengal', 'Southeast Bay of Bengal', 'Bay of Bengal', 12.0, 90.5],
    ['south-bay-of-bengal', 'South Bay of Bengal', 'Bay of Bengal', 8.0, 85.0],
    ['ne-arabian-sea-gujarat-coast', 'NE Arabian Sea & Gujarat Coast', 'Arabian Sea', 22.0, 65.0],
    ['east-central-arabian-sea', 'East-central Arabian Sea', 'Arabian Sea', 18.0, 67.0],
    ['nw-arabian-sea-oman-coast', 'NW Arabian Sea & Oman Coast', 'Arabian Sea', 17.0, 59.5],
    ['se-arabian-sea-lakshadweep', 'SE Arabian Sea & Lakshadweep', 'Arabian Sea', 13.5, 70.5],
    ['central-arabian-sea', 'Central Arabian Sea', 'Arabian Sea', 12.0, 63.5],
    ['southwest-arabian-sea', 'Southwest Arabian Sea', 'Arabian Sea', 8.5, 58.0],
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
