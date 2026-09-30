export type RiskLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
export type BufferZone = 'DIRECT_CORE_IMPACT' | 'GALE_FORCE_ZONE' | 'SQUALLY_PERIPHERY' | 'MONITORING_OUTER';

export interface District {
  id: string;
  name: string;
  state: string;
  centroid: [number, number]; // [lat, lon]
  geometry?: any;
}

export interface RiskAssessmentResult {
  cycloneId: string;
  assessmentTime: string;
  districts: DistrictRisk[];
  summary: {
    high: number;
    moderate: number;
    low: number;
    total: number;
  };
  dataSource?: string;
}

export interface DetailedDistrictRisk {
  districtId: string;
  districtName: string;
  state: string;
  centroid: [number, number];
  distanceKm: number;
  closestHour: number;
  forecastWindow: string;
  bufferZone: BufferZone;
  riskScore: number;
  warningLevel: RiskLevel;
  statusText: string;
  actionCode: string;
  estimatedWindKts: number;
  expectedSurgeM: number;
  populationAtRisk: number;
  vulnerabilityIndex: number;
}

// Backwards compatibility alias for legacy components
export interface DistrictRisk {
  district: District;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE' | RiskLevel;
  distanceFromTrack: number;
  forecastWindow: string;
  reason: string;
  intersectsUncertaintyCone: boolean;
}

export interface LandfallPrediction {
  isLandfallPredicted: boolean;
  targetDistrict?: string;
  targetState?: string;
  landfallCoordinates?: [number, number];
  forecastHour?: number;
  estimatedTime?: string;
  landfallWindKts?: number;
  landfallPressureHpa?: number;
  surgeEstimateM?: number;
  confidence?: string;
  message?: string;
}

export interface IMDBulletin {
  bulletinId: string;
  issuedAt: string;
  cycloneName: string;
  headline: string;
  bulletinText: string;
  actionDirectives: string[];
}

export interface GISRiskAnalysisResult {
  status: number;
  stormId: string;
  stormName: string;
  generatedAt: string;
  summary: {
    totalDistrictsEvaluated: number;
    redAlertCount: number;
    orangeAlertCount: number;
    yellowAlertCount: number;
    highestRiskDistrict?: string;
  };
  landfall: LandfallPrediction;
  bulletin: IMDBulletin;
  districts: DetailedDistrictRisk[];
}
