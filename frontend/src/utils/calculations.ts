import type { IMDGrade } from '../types/cyclone';

export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return (brng * 180 / Math.PI + 360) % 360;
};

export const generateUncertaintyCone = (centerPoints: {lat: number, lon: number}[], baseRadius: number): [number, number][][] => {
  // Simplistic cone generation for demo purposes
  if (centerPoints.length === 0) return [];
  const conePolygon: [number, number][] = [];
  // Dummy logic, should be replaced with actual buffer/convex hull logic
  centerPoints.forEach((point, idx) => {
    const radius = baseRadius + (idx * 15);
    // Approximate lat/lon offset
    const offset = radius / 111; 
    conePolygon.push([point.lat + offset, point.lon + offset]);
    conePolygon.push([point.lat - offset, point.lon - offset]);
  });
  return [conePolygon];
};

export const classifyIMDGrade = (windKnots: number): IMDGrade => {
  if (windKnots < 28) return 'D';
  if (windKnots < 34) return 'DD';
  if (windKnots < 48) return 'CS';
  if (windKnots < 64) return 'SCS';
  if (windKnots < 90) return 'VSCS';
  if (windKnots < 120) return 'ESCS';
  return 'SuCS';
};

export const classifySSHS = (windKnots: number): number => {
  if (windKnots < 34) return -1; // Tropical Depression
  if (windKnots < 64) return 0;  // Tropical Storm
  if (windKnots < 83) return 1;
  if (windKnots < 96) return 2;
  if (windKnots < 113) return 3;
  if (windKnots < 137) return 4;
  return 5;
};
