export type CycloneBasin = 'NI' | 'NA' | 'EP' | 'WP' | 'SP' | 'SI' | 'SA';
export type CycloneSubBasin = 'BB' | 'AS' | 'CS' | 'GM' | 'CP' | 'WA' | 'EA' | 'MM';
export type IMDGrade = 'D' | 'DD' | 'CS' | 'SCS' | 'VSCS' | 'ESCS' | 'SuCS';
export type SSHSCategory = -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5;
export type CycloneNature = 'TS' | 'ET' | 'SS' | 'DS' | 'MX';
export type OperationalStatus = 'LIVE' | 'NO_ACTIVE_CYCLONE' | 'REPLAY' | 'OFFLINE' | 'CACHED';

export interface TrackPoint {
  timestamp: string; // ISO 8601
  lat: number;
  lon: number;
  windSpeed: number; // knots
  pressure: number; // hPa
  nature: CycloneNature;
  stormSpeed: number; // knots
  stormDir: number; // degrees
  imdGrade?: IMDGrade;
  sshsCategory?: SSHSCategory;
  distToLand?: number; // km
  isLandfall?: boolean;
}

export interface Cyclone {
  id: string; // SID from IBTrACS or GDACS
  name: string;
  season: number;
  basin: CycloneBasin;
  subBasin: CycloneSubBasin;
  startDate: string;
  endDate: string;
  maxWind: number; // knots
  minPressure: number; // hPa
  peakIMDGrade: IMDGrade;
  track: TrackPoint[];
}

/** What a live forecast was built from (live mode only; absent in replay). */
export interface ForecastInputs {
  fixCount: number;          // real storm positions used
  trackHours: number;        // hours between the first and last position
  confidence: 'good' | 'limited' | 'single';
  lastFixTime: string | null;
  gfsValidTime: string;      // NOAA GFS time the environment fields come from
  sources: string[];         // IBTRACS_ACTIVE / GDACS / MANUAL
  note?: string | null;
}

export interface ActiveCyclone extends Cyclone {
  currentPosition: TrackPoint;
  status: 'active' | 'dissipated' | 'post-tropical';
  lastUpdated: string;
  dataSource: 'live' | 'replay' | 'historical';
  isReplay?: boolean;
  environmental?: {
    seaSurfaceTemp: number | null;
    windShear: number | null; // knots
    relativeHumidity: number | null;
  };
  dataTime?: string | null;
  inputs?: ForecastInputs | null;
}

export interface OperationalStandbyState {
  status: 'NO_ACTIVE_CYCLONE';
  active: false;
  monitoringRegion: string;
  // Bay of Bengal averages from the latest GFS run (null until the first run is processed)
  environmentalBaseline: {
    sea_surface_temp: number | null;
    relative_humidity: number | null;
    vertical_wind_shear: number | null; // knots
    surface_pressure: number | null;
  };
  dataValidTime?: string | null;
  lastSystem?: { id: string; name: string; lastSeen: string } | null;
  lastChecked: string;
  sources: string[];
  message: string;
}

export interface CycloneSummary {
  id: string;
  name: string;
  season: number;
  basin: CycloneBasin;
  subBasin: CycloneSubBasin;
  maxWind: number;
  minPressure: number;
  peakIMDGrade: IMDGrade;
  startDate: string;
  endDate: string;
}
