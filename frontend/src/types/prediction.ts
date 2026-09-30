import type { IMDGrade } from './cyclone';

/** Forecast leads produced by the trained models (hours). No pressure forecast is produced. */
export const FORECAST_HOURS = [6, 12, 18, 24] as const;

export interface ForecastPoint {
  forecastHour: number; // 6, 12, 18, 24
  lat: number;
  lon: number;
  predictedWind: number | null; // knots (current wind + predicted 24 h change)
  windChange?: number | null; // knots vs. now
  predictedIMDGrade: IMDGrade | 'LP' | null;
  trend?: 'intensifying' | 'stable' | 'weakening' | null;
  uncertainty: number | null; // km radius (67 % of 2003-2006 errors fell inside)
  timestamp: string;
}

export interface UncertaintyCone {
  forecastHour: number;
  polygon: [number, number][]; // lat/lon pairs forming the polygon
}

export interface IntensityForecast {
  forecastHour: number;
  windSpeed: number | null;
  windChange?: number | null;
  trend: 'intensifying' | 'stable' | 'weakening' | null;
  imdGrade: IMDGrade | 'LP' | null;
}

export interface RapidIntensificationInfo {
  probability: number;
  warning: boolean;
  note?: string;
}

export interface PeakIntensityInfo {
  windKt: number;
  imdGrade: IMDGrade | 'LP' | null;
}

export interface ObservedPoint {
  timestamp: string;
  lat: number;
  lon: number;
  windSpeed: number | null;
  pressure?: number | null;
  imdGrade?: string | null;
}

export interface PredictionResult {
  cycloneId: string;
  predictionTime: string;
  issuedAt?: string;
  modelVersion: string;
  mainModel?: string;
  forecastPoints: ForecastPoint[];
  uncertaintyCones: UncertaintyCone[];
  intensityForecasts: IntensityForecast[];
  rapidIntensification?: RapidIntensificationInfo | null;
  peakIntensity?: PeakIntensityInfo | null;
  currentObservation?: ObservedPoint;
  actualFutureTrack?: ObservedPoint[] | null; // replay mode only: what really happened
  dataSource: 'model' | 'live' | 'replay';
}
