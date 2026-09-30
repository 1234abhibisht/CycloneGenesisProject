import type {
  GDACSEventListResponse,
  GDACSEvent,
  GDACSGeometryResponse,
  OperationalStorm,
  IBTrACSResponse,
} from '../types/operational';
import type { ActiveCyclone, TrackPoint, CycloneBasin, CycloneSubBasin, IMDGrade } from '../types/cyclone';
import { GDACS_EVENTS_URL, GDACS_GEOMETRY_URL, IBTRACS_ERDDAP_URL } from './api';

/* ─── GDACS: Fetch Active Tropical Cyclones ─── */

export async function fetchActiveStorms(): Promise<OperationalStorm[]> {
  const url = `${GDACS_EVENTS_URL}?eventtypes=TC`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`GDACS API error: ${response.status} ${response.statusText}`);
  }

  const data: GDACSEventListResponse = await response.json();

  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  return data.features
    .filter((f: GDACSEvent) => f.properties.eventtype === 'TC')
    .map((f: GDACSEvent) => parseGDACSEvent(f));
}

function parseGDACSEvent(feature: GDACSEvent): OperationalStorm {
  const props = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;

  // Extract wind speed from severity if available
  let windSpeed: number | null = null;
  let pressure: number | null = null;

  if (props.severity?.value) {
    // GDACS severity for TC is typically wind speed in km/h
    // Convert to knots (1 knot = 1.852 km/h)
    windSpeed = Math.round(props.severity.value / 1.852);
  }

  // Try to extract from severity text like "Category 4 (wind 200 km/h)"
  if (props.severity?.text) {
    const windMatch = props.severity.text.match(/(\d+)\s*km\/h/i);
    if (windMatch) {
      windSpeed = Math.round(parseInt(windMatch[1]) / 1.852);
    }
  }

  // Determine basin from coordinates
  const basin = determineBasinFromCoords(lat, lon);

  return {
    id: `GDACS-TC-${props.eventid}`,
    eventId: props.eventid,
    episodeId: props.episodeid,
    name: props.eventname || `TC-${props.eventid}`,
    basin,
    alertLevel: (props.alertlevel as OperationalStorm['alertLevel']) || 'Unknown',
    currentLat: lat,
    currentLon: lon,
    severity: props.severity?.text || 'Unknown',
    windSpeed,
    pressure,
    fromDate: props.fromdate || '',
    toDate: props.todate || '',
    lastModified: props.datemodified || new Date().toISOString(),
    country: props.country || 'Unknown',
    source: 'GDACS',
  };
}

function determineBasinFromCoords(lat: number, lon: number): string {
  // North Indian Ocean (Bay of Bengal / Arabian Sea)
  if (lat >= 0 && lat <= 30 && lon >= 40 && lon <= 100) return 'NI';
  // North Atlantic
  if (lat >= 0 && lat <= 60 && lon >= -100 && lon <= 0) return 'NA';
  // Eastern North Pacific
  if (lat >= 0 && lat <= 40 && lon >= -180 && lon <= -100) return 'EP';
  // Western North Pacific
  if (lat >= 0 && lat <= 40 && lon >= 100 && lon <= 180) return 'WP';
  // South Pacific
  if (lat < 0 && lon >= 100) return 'SP';
  // South Indian
  if (lat < 0 && lon >= 30 && lon < 100) return 'SI';
  // South Atlantic
  if (lat < 0 && lon < 30) return 'SA';
  return 'Unknown';
}

/* ─── GDACS: Fetch Storm Track Geometry ─── */

export async function fetchStormGeometry(
  eventId: number,
  episodeId: number
): Promise<GDACSGeometryResponse | null> {
  const url = `${GDACS_GEOMETRY_URL}?eventtype=TC&eventid=${eventId}&episodeid=${episodeId}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

/* ─── IBTrACS ERDDAP: Fetch Recent Storms ─── */

export async function fetchIBTrACSRecent(
  basin: string = 'NI',
  limitYears: number = 1
): Promise<TrackPoint[][]> {
  const sinceDate = new Date();
  sinceDate.setFullYear(sinceDate.getFullYear() - limitYears);
  const sinceStr = sinceDate.toISOString().replace('T', ' ').split('.')[0];

  const query = [
    `basin="${basin}"`,
    `iso_time>="${sinceStr}"`,
  ].join('&');

  const fields = [
    'sid', 'season', 'name', 'basin', 'subbasin', 'iso_time',
    'nature', 'lat', 'lon', 'wmo_wind', 'wmo_pres', 'usa_wind', 'usa_pres', 'track_type',
  ].join(',');

  const url = `${IBTRACS_ERDDAP_URL}?${fields}&${query}&orderBy("sid,iso_time")`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return [];

    const data: IBTrACSResponse = await response.json();
    return parseIBTrACSToTracks(data);
  } catch {
    return [];
  }
}

function parseIBTrACSToTracks(data: IBTrACSResponse): TrackPoint[][] {
  const { columnNames, rows } = data.table;
  const getIdx = (name: string) => columnNames.indexOf(name);

  // Group rows by storm ID (sid)
  const stormMap = new Map<string, TrackPoint[]>();

  for (const row of rows) {
    const sid = row[getIdx('sid')] as string;
    const lat = row[getIdx('lat')] as number;
    const lon = row[getIdx('lon')] as number;
    const isoTime = row[getIdx('iso_time')] as string;
    const wmoWind = row[getIdx('wmo_wind')] as number | null;
    const wmoPres = row[getIdx('wmo_pres')] as number | null;
    const usaWind = row[getIdx('usa_wind')] as number | null;
    const usaPres = row[getIdx('usa_pres')] as number | null;
    const nature = row[getIdx('nature')] as string;

    const windSpeed = wmoWind ?? usaWind ?? 0;
    const pressure = wmoPres ?? usaPres ?? 1013;

    const point: TrackPoint = {
      timestamp: isoTime,
      lat,
      lon,
      windSpeed,
      pressure,
      nature: (nature as TrackPoint['nature']) || 'TS',
      stormSpeed: 0,
      stormDir: 0,
      imdGrade: windToIMDGrade(windSpeed),
      distToLand: 0,
      isLandfall: false,
    };

    if (!stormMap.has(sid)) {
      stormMap.set(sid, []);
    }
    stormMap.get(sid)!.push(point);
  }

  return Array.from(stormMap.values());
}

/* ─── Convert Operational Storm to ActiveCyclone ─── */

export function operationalStormToActiveCyclone(storm: OperationalStorm): ActiveCyclone {
  const windSpeed = storm.windSpeed ?? 0;
  const pressure = storm.pressure ?? estimatePressureFromWind(windSpeed);

  const subBasin: CycloneSubBasin = storm.currentLon < 78 ? 'AS' : 'BB';
  const basin: CycloneBasin = (
    storm.basin === 'NI' ? 'NI' :
    storm.basin === 'NA' ? 'NA' :
    storm.basin === 'EP' ? 'EP' :
    storm.basin === 'WP' ? 'WP' :
    storm.basin === 'SP' ? 'SP' :
    storm.basin === 'SI' ? 'SI' : 'NI'
  );

  const currentPosition: TrackPoint = {
    timestamp: storm.lastModified || new Date().toISOString(),
    lat: storm.currentLat,
    lon: storm.currentLon,
    windSpeed,
    pressure,
    nature: 'TS',
    stormSpeed: 0,
    stormDir: 0,
    imdGrade: windToIMDGrade(windSpeed),
    distToLand: 0,
    isLandfall: false,
  };

  return {
    id: storm.id,
    name: storm.name,
    season: new Date(storm.fromDate).getFullYear() || new Date().getFullYear(),
    basin,
    subBasin,
    startDate: storm.fromDate,
    endDate: storm.toDate,
    maxWind: windSpeed,
    minPressure: pressure,
    peakIMDGrade: windToIMDGrade(windSpeed),
    track: [currentPosition], // Single point — GDACS gives current position only
    status: 'active',
    lastUpdated: storm.lastModified,
    dataSource: 'live',
    currentPosition,
  };
}

/* ─── Utility: Wind Speed → IMD Grade ─── */

function windToIMDGrade(windKnots: number): IMDGrade {
  if (windKnots >= 120) return 'SuCS';
  if (windKnots >= 90) return 'ESCS';
  if (windKnots >= 64) return 'VSCS';
  if (windKnots >= 48) return 'SCS';
  if (windKnots >= 34) return 'CS';
  if (windKnots >= 28) return 'DD';
  return 'D';
}

/* ─── Utility: Estimate Pressure from Wind (Atkinson-Holliday) ─── */

function estimatePressureFromWind(windKnots: number): number {
  // Rough pressure-wind relationship for NI cyclones
  if (windKnots <= 0) return 1008;
  // Atkinson-Holliday: P = 1010 - (V/3.92)^(1/0.644) roughly
  const pressureDrop = Math.pow(windKnots / 3.4, 1.0 / 0.644);
  return Math.round(Math.max(880, 1010 - pressureDrop));
}
