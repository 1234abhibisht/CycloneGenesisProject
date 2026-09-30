import { apiGet, USE_MOCK_DATA } from './api';
import { demoModelMetrics, modelComparison, modelExplainability } from '../data/mockModelPerformance';

export async function getModelPerformance(): Promise<any> {
  if (!USE_MOCK_DATA) {
    try { 
      return (await apiGet<any>('/models/performance')).data; 
    } catch {}
  }
  return demoModelMetrics;
}

export async function getModelComparison(): Promise<any[]> {
  if (!USE_MOCK_DATA) {
    try { 
      return (await apiGet<any[]>('/models/comparison')).data; 
    } catch {}
  }
  return modelComparison as any || [];
}

export async function getModelExplainability(predictionId: string): Promise<any> {
  if (!USE_MOCK_DATA) {
    try { 
      return (await apiGet<any>(`/models/explainability/${predictionId}`)).data; 
    } catch {}
  }
  return modelExplainability;
}
