import { API_BASE_URL } from './api';

export type BasinRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface BasinZone {
  id: string;
  name: string;
  basin: string;
  lat: number;
  lon: number;
  sst: number;
  shear: number;
  humidity: number;
  probability: number;
  riskLevel: BasinRiskLevel;
}

export interface BasinAssessment {
  generatedAt: string;
  source: string;
  status: 'LIVE' | 'LATEST_AVAILABLE';
  summary: string;
  zones: BasinZone[];
}

const FALLBACK: BasinAssessment = {
  generatedAt: new Date().toISOString(),
  source: 'Operational standby baseline',
  status: 'LATEST_AVAILABLE',
  summary: 'No live basin analysis is available. Showing the monitored zones in standby mode.',
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
    sst: 0, shear: 0, humidity: 0, probability: 0, riskLevel: 'LOW' as BasinRiskLevel,
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
