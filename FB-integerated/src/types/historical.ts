export interface HistoricalStormSummary {
  id: string;
  name: string;
  season: number;
  basin: string;
  subBasin: string;
  peakIMDGrade: string;
  maxWind: number;
  minPressure: number;
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
  windSpeed: number;
  pressure: number;
  imdGrade: string;
  isLandfall?: boolean;
}

export interface HistoricalReplayData {
  storm: {
    id: string;
    name: string;
    season: number;
    basin: string;
    subBasin: string;
    peakIMDGrade: string;
    maxWind: number;
    minPressure: number;
    landfallLocation: string;
    summary: string;
  };
  replayState: {
    currentStep: number;
    totalSteps: number;
    currentObservation: HistoricalReplayPoint;
    observedTrackSoFar: HistoricalReplayPoint[];
    actualFutureTrack: HistoricalReplayPoint[];
  };
}
