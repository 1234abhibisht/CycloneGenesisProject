import type { ForecastPoint, RapidIntensificationInfo, PeakIntensityInfo } from './prediction';
import type { DetailedDistrictRisk } from './risk';

export interface HistoricalStormSummary {
  id: string;
  name: string;
  season: number;
  basin: string;
  subBasin: string;
  peakIMDGrade: string;
  maxWind: number | null;
  minPressure: number | null;
  landfallLocation: string;
  landfallDate: string;
  summary: string;
  totalSteps: number;
}

export interface HistoricalReplayPoint {
  step: number;
  timestamp: string;
  lat: number;
  lon: number;
  windSpeed: number | null;
  pressure: number | null;
  imdGrade: string | null;
  isLandfall?: boolean;
}

export interface HistoricalReplayData {
  storm: HistoricalStormSummary;
  /** Model forecast issued at the current step (+6/+12/+18/+24 h) */
  forecast: ForecastPoint[];
  /** Top coastal districts by 24 h strike probability */
  districts: DetailedDistrictRisk[];
  rapidIntensification: RapidIntensificationInfo | null;
  peakIntensity: PeakIntensityInfo | null;
  replayState: {
    currentStep: number;
    totalSteps: number;
    currentObservation: HistoricalReplayPoint;
    observedTrackSoFar: HistoricalReplayPoint[];
    actualFutureTrack: HistoricalReplayPoint[];
  };
}
