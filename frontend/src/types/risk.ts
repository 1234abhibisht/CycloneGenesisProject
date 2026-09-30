export type RiskLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

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
  /** Probability that the storm centre passes within 100 km of the district in 0-6 / 0-12 / 0-18 / 0-24 h */
  strikeProbability: { '6h': number | null; '12h': number | null; '18h': number | null; '24h': number | null };
  strikeLabel: string | null; // rounded to 5 %, e.g. "35%" or "<5%"
  warningLevel: RiskLevel; // RED >= 50 %, ORANGE >= 25 %, YELLOW >= 10 %, GREEN < 10 % (24 h strike probability)
  distanceKm: number; // closest approach of the most likely track
  closestHour: number;
  forecastWindow: string;
  estimatedWindKts: number | null; // forecast wind near closest approach (only if within 150 km)
  riskScore: number | null; // 24 h strike probability in %
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
  landfallWindKts?: number | null;
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
  issuedAt?: string;
  summary: {
    totalDistrictsEvaluated: number;
    redAlertCount: number;
    orangeAlertCount: number;
    yellowAlertCount: number;
    highestRiskDistrict?: string;
  };
  landfall: LandfallPrediction;
  bulletin: IMDBulletin | null;
  districts: DetailedDistrictRisk[];
}
