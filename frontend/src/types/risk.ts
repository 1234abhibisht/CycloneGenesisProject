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
  // Test-storm replay only: what the real storm did in the same 0-24 h window (IBTrACS best track)
  actualHit?: boolean | null; // real centre passed within 100 km
  actualDistanceKm?: number | null; // real closest approach
  actualHour?: number | null; // hours after issue at the closest approach
}

export interface ActualStrikeSummary {
  windowHours: number;
  trackComplete: boolean; // real track covers the whole 24 h window
  observedTrackEnds: string | null;
  districtsHit: number;
  hitsWithOrangeOrRed: number;
  hitsWithYellowOrAbove: number;
  orangeOrRedDistricts: number;
  orangeOrRedHit: number;
  source: string;
}

export interface StrikeVerificationBin {
  label: string;
  forecasts: number;
  meanPredicted: number | null;
  hits: number;
  observedFrequency: number | null;
}

/** Model strike probabilities vs. reality over every forecast time of every test storm. */
export interface StrikeVerification {
  available: boolean;
  reason?: string;
  storms: number;
  forecastTimes: number;
  pairs: number;
  hits: number;
  baseRate: number;
  brier: number;
  brierClimatology: number;
  brierSkill: number | null;
  detectedOrangeOrRed: number;
  detectedYellowOrAbove: number;
  orangeOrRedForecasts: number;
  orangeOrRedCorrect: number;
  bins: StrikeVerificationBin[];
  windowHours: number;
  radiusKm: number;
  truth: string;
  climatology: string;
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
  mode?: 'live' | 'replay';
  replay?: { step: number; totalSteps: number } | null;
  actualSummary?: ActualStrikeSummary | null;
}
