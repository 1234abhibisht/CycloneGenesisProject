/* ─── GDACS API Response Types ─── */

export interface GDACSEventListResponse {
  features: GDACSEvent[];
  type: string;
}

export interface GDACSEvent {
  type: 'Feature';
  bbox?: number[];
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    eventtype: string; // 'TC'
    eventid: number;
    episodeid: number;
    eventname: string;
    description?: string;
    htmldescription?: string;
    icon?: string;
    iconoverall?: string;
    url?: {
      report?: string;
      details?: string;
      geometry?: string;
    };
    alertlevel?: string; // 'Green' | 'Orange' | 'Red'
    alertscore?: number;
    severity?: {
      value?: number;
      unit?: string;
      text?: string;
    };
    country?: string;
    fromdate?: string; // ISO datetime
    todate?: string;
    datemodified?: string;
    Class?: string;
    affectedcountries?: Array<{
      iso3: string;
      countryname: string;
    }>;
    // Additional dynamic fields
    [key: string]: unknown;
  };
}

export interface GDACSGeometryResponse {
  type: 'FeatureCollection';
  features: GDACSGeometryFeature[];
}

export interface GDACSGeometryFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'LineString' | 'MultiPolygon' | 'Point';
    coordinates: number[][] | number[][][] | number[];
  };
  properties: {
    Class?: string;
    eventid?: number;
    episodeid?: number;
    [key: string]: unknown;
  };
}

/* ─── IBTrACS ERDDAP Response Types ─── */

export interface IBTrACSResponse {
  table: {
    columnNames: string[];
    columnTypes: string[];
    rows: (string | number | null)[][];
  };
}

export interface IBTrACSStormRow {
  sid: string;
  season: number;
  name: string;
  basin: string;
  subbasin: string;
  iso_time: string;
  nature: string;
  lat: number;
  lon: number;
  wmo_wind: number | null;
  wmo_pres: number | null;
  usa_wind: number | null;
  usa_pres: number | null;
  track_type: string;
}

/* ─── Operational Storm (our normalized type) ─── */

export interface OperationalStorm {
  id: string;
  eventId: number;
  episodeId: number;
  name: string;
  basin: string;
  alertLevel: 'Green' | 'Orange' | 'Red' | 'Unknown';
  currentLat: number;
  currentLon: number;
  severity: string;
  windSpeed: number | null; // knots, if available
  pressure: number | null;  // hPa, if available
  fromDate: string;
  toDate: string;
  lastModified: string;
  country: string;
  source: 'GDACS';
}

export interface OperationalDataState {
  storms: OperationalStorm[];
  selectedStormId: string | null;
  isLive: boolean;
  lastFetched: string | null;
  error: string | null;
  loading: boolean;
}
