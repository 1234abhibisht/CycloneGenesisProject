import type { Cyclone, ActiveCyclone, TrackPoint, CycloneSubBasin, IMDGrade } from '../types/cyclone';

const generateTrack = (
  startLat: number, startLon: number, 
  dLat: number, dLon: number, 
  startWind: number, dWind: number, 
  startPressure: number, dPressure: number,
  grade: IMDGrade = 'VSCS',
  points: number = 8
): TrackPoint[] => {
  const track: TrackPoint[] = [];
  let currentLat = startLat;
  let currentLon = startLon;
  let currentWind = startWind;
  let currentPressure = startPressure;
  const baseTime = new Date('2023-05-10T00:00:00Z');

  for (let i = 0; i < points; i++) {
    const time = new Date(baseTime.getTime() + i * 6 * 3600000);
    track.push({
      timestamp: time.toISOString(),
      lat: Number(currentLat.toFixed(2)),
      lon: Number(currentLon.toFixed(2)),
      windSpeed: Math.round(currentWind),
      pressure: Math.round(currentPressure),
      nature: 'TS',
      stormSpeed: 12 + (i % 3) * 2,
      stormDir: 320 + (i % 4) * 5,
      imdGrade: grade,
      distToLand: Math.max(0, 500 - i * 60),
      isLandfall: i === points - 1,
    });
    currentLat += dLat;
    currentLon += dLon;
    currentWind += dWind;
    currentPressure += dPressure;
  }
  return track;
};

export const historicalCyclones: Cyclone[] = [
  { id: 'amphan-2020', name: 'AMPHAN', season: 2020, basin: 'NI', subBasin: 'BB', startDate: '2020-05-16', endDate: '2020-05-21', maxWind: 130, minPressure: 920, peakIMDGrade: 'SuCS', track: generateTrack(12, 87, 1.4, 0.1, 40, 10, 1000, -9, 'SuCS', 10) },
  { id: 'fani-2019', name: 'FANI', season: 2019, basin: 'NI', subBasin: 'BB', startDate: '2019-04-26', endDate: '2019-05-04', maxWind: 115, minPressure: 932, peakIMDGrade: 'ESCS', track: generateTrack(3, 89, 2.3, -0.2, 35, 10, 1004, -9, 'ESCS', 8) },
  { id: 'hudhud-2014', name: 'HUDHUD', season: 2014, basin: 'NI', subBasin: 'BB', startDate: '2014-10-07', endDate: '2014-10-14', maxWind: 90, minPressure: 950, peakIMDGrade: 'VSCS', track: generateTrack(8, 92, 1.4, -1.1, 30, 8, 1002, -7, 'VSCS', 8) },
  { id: 'phailin-2013', name: 'PHAILIN', season: 2013, basin: 'NI', subBasin: 'BB', startDate: '2013-10-08', endDate: '2013-10-14', maxWind: 115, minPressure: 940, peakIMDGrade: 'ESCS', track: generateTrack(10, 94, 1.3, -1.1, 40, 9, 998, -7, 'ESCS', 8) },
  { id: 'tauktae-2021', name: 'TAUKTAE', season: 2021, basin: 'NI', subBasin: 'AS', startDate: '2021-05-14', endDate: '2021-05-19', maxWind: 95, minPressure: 950, peakIMDGrade: 'ESCS', track: generateTrack(12, 73, 1.1, -0.1, 35, 8, 1000, -6, 'ESCS', 8) },
  { id: 'biparjoy-2023', name: 'BIPARJOY', season: 2023, basin: 'NI', subBasin: 'AS', startDate: '2023-06-06', endDate: '2023-06-19', maxWind: 95, minPressure: 952, peakIMDGrade: 'ESCS', track: generateTrack(11, 66, 1.4, 0.3, 35, 8, 998, -6, 'ESCS', 8) },
  { id: 'vardah-2016', name: 'VARDAH', season: 2016, basin: 'NI', subBasin: 'BB', startDate: '2016-12-06', endDate: '2016-12-13', maxWind: 55, minPressure: 981, peakIMDGrade: 'SCS', track: generateTrack(9, 90, 0.5, -1.2, 30, 3, 1002, -3, 'SCS', 8) },
  { id: 'titli-2018', name: 'TITLI', season: 2018, basin: 'NI', subBasin: 'BB', startDate: '2018-10-08', endDate: '2018-10-12', maxWind: 75, minPressure: 972, peakIMDGrade: 'VSCS', track: generateTrack(10, 88, 1.3, -0.5, 30, 6, 1000, -4, 'VSCS', 8) },
  { id: 'nisarga-2020', name: 'NISARGA', season: 2020, basin: 'NI', subBasin: 'AS', startDate: '2020-06-01', endDate: '2020-06-04', maxWind: 50, minPressure: 988, peakIMDGrade: 'SCS', track: generateTrack(12, 72, 0.9, 0.1, 25, 3, 1004, -2, 'SCS', 8) },
  { id: 'yaas-2021', name: 'YAAS', season: 2021, basin: 'NI', subBasin: 'BB', startDate: '2021-05-23', endDate: '2021-05-28', maxWind: 70, minPressure: 968, peakIMDGrade: 'VSCS', track: generateTrack(14, 88, 1.0, -0.1, 30, 5, 1000, -4, 'VSCS', 8) },
  { id: 'mocha-2023', name: 'MOCHA', season: 2023, basin: 'NI', subBasin: 'BB', startDate: '2023-05-09', endDate: '2023-05-15', maxWind: 120, minPressure: 938, peakIMDGrade: 'ESCS', track: generateTrack(10, 87, 1.2, 0.6, 35, 11, 1002, -8, 'ESCS', 9) },
  { id: 'michaung-2023', name: 'MICHAUNG', season: 2023, basin: 'NI', subBasin: 'BB', startDate: '2023-12-01', endDate: '2023-12-06', maxWind: 55, minPressure: 986, peakIMDGrade: 'SCS', track: generateTrack(9, 84, 0.8, -0.5, 30, 3, 1004, -2, 'SCS', 8) },
  { id: 'gaja-2018', name: 'GAJA', season: 2018, basin: 'NI', subBasin: 'BB', startDate: '2018-11-10', endDate: '2018-11-19', maxWind: 55, minPressure: 982, peakIMDGrade: 'SCS', track: generateTrack(8, 86, 0.4, -0.8, 30, 3, 1002, -2, 'SCS', 8) },
  { id: 'ockhi-2017', name: 'OCKHI', season: 2017, basin: 'NI', subBasin: 'AS', startDate: '2017-11-29', endDate: '2017-12-06', maxWind: 75, minPressure: 976, peakIMDGrade: 'VSCS', track: generateTrack(7, 78, 1.3, -1.2, 35, 5, 1000, -3, 'VSCS', 8) },
  { id: 'gulab-2021', name: 'GULAB', season: 2021, basin: 'NI', subBasin: 'BB', startDate: '2021-09-24', endDate: '2021-09-28', maxWind: 35, minPressure: 998, peakIMDGrade: 'CS', track: generateTrack(15, 88, 0.2, -0.6, 20, 2, 1004, -1, 'CS', 8) }
];

const activeTrack = generateTrack(10, 89, 0.8, -0.4, 45, 6, 990, -4, 'VSCS', 8);

export const activeCyclone: ActiveCyclone = {
  id: 'DEMO_CYCLONE',
  name: 'CYCLONE SIMULATION (FANI-TYPE)',
  season: 2024,
  basin: 'NI',
  subBasin: 'BB' as CycloneSubBasin,
  startDate: new Date(Date.now() - 48 * 3600000).toISOString(),
  endDate: new Date(Date.now() + 72 * 3600000).toISOString(),
  maxWind: 85,
  minPressure: 960,
  peakIMDGrade: 'VSCS',
  track: activeTrack,
  status: 'active',
  lastUpdated: new Date().toISOString(),
  dataSource: 'historical',
  currentPosition: {
    timestamp: new Date().toISOString(),
    lat: 16.0,
    lon: 86.0,
    windSpeed: 85,
    pressure: 960,
    nature: 'TS',
    stormSpeed: 15,
    stormDir: 330,
    imdGrade: 'VSCS',
    distToLand: 220,
    isLandfall: false,
  }
};
