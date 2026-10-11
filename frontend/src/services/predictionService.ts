import { API_BASE_URL } from './api';
import type { PredictionResult, IntensityForecast } from '../types/prediction';

/** Track + intensity forecast (+6/+12/+18/+24 h) from the trained models. */
export async function getPrediction(cycloneId: string = 'ACTIVE'): Promise<PredictionResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/cyclone/${cycloneId || 'ACTIVE'}/predictions`);
    if (res.ok) {
      const json = await res.json();
      const d = json.data;
      if (d && d.forecastPoints) {
        return {
          cycloneId: d.stormId || cycloneId,
          predictionTime: d.generatedAt || new Date().toISOString(),
          issuedAt: d.issuedAt,
          modelVersion: d.modelVersion || 'unknown',
          mainModel: d.mainModel,
          forecastPoints: d.forecastPoints,
          intensityForecasts: d.intensityForecasts || [],
          uncertaintyCones: [],
          rapidIntensification: d.rapidIntensification ?? null,
          peakIntensity: d.peakIntensity ?? null,
          currentObservation: d.currentObservation,
          actualFutureTrack: d.actualFutureTrack ?? null,
          dataSource: d.actualFutureTrack ? 'replay' : 'model',
        };
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
