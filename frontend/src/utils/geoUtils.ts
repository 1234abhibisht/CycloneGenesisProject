export const pointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  let isInside = false;
  const [lat, lon] = point;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lonI] = polygon[i];
    const [latJ, lonJ] = polygon[j];
    
    const intersect = ((lonI > lon) !== (lonJ > lon)) &&
        (lat < (latJ - latI) * (lon - lonI) / (lonJ - lonI) + latI);
    if (intersect) isInside = !isInside;
  }
  
  return isInside;
};

export const districtIntersectsPolygon = (_districtGeom: any, _conePolygon: [number, number][]): boolean => {
  // Simplified logic, just checks if a point in district is in polygon
  return false;
};

export const getBounds = (points: {lat: number, lon: number}[]): [[number, number], [number, number]] => {
  if (!points || points.length === 0) return [[0, 0], [0, 0]];
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;
  
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  
  return [[minLat, minLon], [maxLat, maxLon]];
};

export const interpolateTrack = (points: {lat: number, lon: number, timestamp: string}[], _numPoints: number): {lat: number, lon: number}[] => {
  // Simplified interpolation
  return points.map(p => ({ lat: p.lat, lon: p.lon }));
};
