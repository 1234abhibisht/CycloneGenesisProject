import { apiGet, USE_MOCK_DATA } from './api';
import { environmentalSummary, environmentalTimeSeries, environmentalDataPoints } from '../data/mockEnvironmental';

export async function getEnvironmentalSummary(cycloneId: string): Promise<any> {
  if (!USE_MOCK_DATA) {
    try { 
      return (await apiGet<any>(`/environmental/${cycloneId}/summary`)).data; 
    } catch {}
  }
  return environmentalSummary || {};
}

export async function getEnvironmentalTimeSeries(cycloneId: string, variable: string): Promise<any[]> {
  if (!USE_MOCK_DATA) {
    try { 
      return (await apiGet<any[]>(`/environmental/${cycloneId}/timeseries/${variable}`)).data; 
    } catch {}
  }
  return (environmentalTimeSeries as any)?.[variable] || [];
}

export async function getEnvironmentalDataPoints(cycloneId: string): Promise<any[]> {
  if (!USE_MOCK_DATA) {
    try { 
      return (await apiGet<any[]>(`/environmental/${cycloneId}/points`)).data; 
    } catch {}
  }
  return environmentalDataPoints || [];
}
