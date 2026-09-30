import type { IMDGrade } from './cyclone';

export interface ForecastPoint {
  forecastHour: number; // 6, 12, 24, 48, 72
  lat: number;
  lon: number;
  predictedWind: number; // knots
  predictedPressure: number; // hPa
  predictedIMDGrade: IMDGrade;
  uncertainty: number; // km radius
  timestamp: string;
}

export interface UncertaintyCone {
  forecastHour: number;
  polygon: [number, number][]; // lat/lon pairs forming the polygon
}

export interface IntensityForecast {
  forecastHour: number;
  windSpeed: number;
  pressure: number;
  trend: 'intensifying' | 'stable' | 'weakening';
  imdGrade: IMDGrade;
}

export interface RapidIntensificationInfo {
  probability: number;
  warning: boolean;
}

export interface PredictionResult {
  cycloneId: string;
  predictionTime: string;
  modelVersion: string;
  forecastPoints: ForecastPoint[];
  uncertaintyCones: UncertaintyCone[];
  intensityForecasts: IntensityForecast[];
  rapidIntensification?: RapidIntensificationInfo;
  dataSource: 'model' | 'live' | 'replay';
}
