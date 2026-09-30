import { API_BASE_URL } from './api';
import type { PredictionResult, IntensityForecast } from '../types/prediction';

export async function getPrediction(cycloneId: string = 'ACTIVE'): Promise<PredictionResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${cycloneId || 'ACTIVE'}/predictions`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.forecastPoints) {
        return {
          cycloneId: json.stormId || cycloneId,
          predictionTime: json.data.generatedAt || new Date().toISOString(),
          modelVersion: json.data.modelVersion || '3.2.0-sih',
          forecastPoints: json.data.forecastPoints,
          intensityForecasts: json.data.intensityForecasts || [],
          uncertaintyCones: [],
          dataSource: json.data.dataSource || 'model'
        } as PredictionResult;
      }
    }
  } catch (err) {
    console.warn('Prediction API notice:', err);
  }
  return null;
}

export async function getIntensityForecast(cycloneId: string = 'ACTIVE'): Promise<IntensityForecast[]> {
  const pred = await getPrediction(cycloneId);
  return pred?.intensityForecasts || [];
}
