import { useEffect, useState } from 'react';
import { API_BASE_URL } from './api';
export const refreshResearch = () => window.dispatchEvent(new Event('cyclone-refresh'));
export async function selectResearchCase(caseId: string) {
  const response = await fetch(`${API_BASE_URL}/mode`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'replay', caseId }) });
  if (!response.ok) throw new Error('Could not select this research case.');
  refreshResearch();
}
export function useResearchResource<T>(endpoint: string) {
  const [version, setVersion] = useState(0);
  const key = `${endpoint}:${version}`;
  const [result, setResult] = useState<{key:string;data:T|null;error:string}>({key:'',data:null,error:''});
  useEffect(() => { const refresh = () => setVersion(v => v + 1); window.addEventListener('cyclone-refresh', refresh); return () => window.removeEventListener('cyclone-refresh', refresh); }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${API_BASE_URL}${endpoint}`, { signal: controller.signal }).then(async response => {
      const json = await response.json();
      if (!response.ok) throw new Error(json.detail || 'The data service is unavailable.');
      if (!controller.signal.aborted) setResult({key,data:json,error:''});
    }).catch(err => { if (!controller.signal.aborted) setResult({key,data:null,error:err.message || 'The data service is unavailable.'}); });
    return () => controller.abort();
  }, [endpoint, key]);
  return result.key === key ? {data:result.data,error:result.error} : {data:null,error:''};
}
export interface ResearchCase { id: string; stormId: string; name: string; time: string; wind: number }
export interface CasesResponse { cases: ResearchCase[]; operational_mode: 'live' | 'replay'; caseId: string }
export interface ResearchForecast {
  stormId: string; data: { caseId: string; issuedAt: string; generatedAt: string; modelVersion: string; forecastPoints: { forecastHour: number; lat: number; lon: number; predictedWind: number; predictedPressure: null; uncertainty: null; timestamp: string }[]; verification: { lat: number; lon: number; wind: number; timestamp: string }; limitations: string[] }
}
export const formatValue = (value: number | null | undefined, digits = 1) => value != null && Number.isFinite(value) ? value.toFixed(digits) : '—';
export const utc = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' UTC';
