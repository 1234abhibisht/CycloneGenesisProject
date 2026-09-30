import type { EnvironmentalDataPoint, EnvironmentalTimeSeries, EnvironmentalSummary } from '../types/environment';

export const environmentalSummary: EnvironmentalSummary = {
  sst: { value: 29.5, unit: '°C', trend: 'rising', favorable: true },
  pressure: { value: 1004, unit: 'hPa', trend: 'falling' },
  humidity: { value: 82, unit: '%', trend: 'rising' },
  windSpeed: { value: 12, unit: 'm/s' },
  windShear: { value: 8, unit: 'm/s', favorable: true }
};

export const environmentalTimeSeries: Record<string, EnvironmentalTimeSeries> = {
  sst: {
    variable: 'sst',
    unit: '°C',
    data: Array.from({ length: 13 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 6 * 3600000).toISOString(),
      value: 29.5 + i * 0.05
    }))
  },
  pressure: {
    variable: 'pressure',
    unit: 'hPa',
    data: Array.from({ length: 13 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 6 * 3600000).toISOString(),
      value: 1004 - i * 3.2
    }))
  },
  humidity: {
    variable: 'humidity',
    unit: '%',
    data: Array.from({ length: 13 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 6 * 3600000).toISOString(),
      value: 82 + i * 1.1
    }))
  },
  windSpeed: {
    variable: 'windSpeed',
    unit: 'm/s',
    data: Array.from({ length: 13 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 6 * 3600000).toISOString(),
      value: 12 + i * 2.5
    }))
  },
  windShear: {
    variable: 'windShear',
    unit: 'm/s',
    data: Array.from({ length: 13 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 6 * 3600000).toISOString(),
      value: Math.max(4, 8 - i * 0.3)
    }))
  }
};

const generateGrid = (): EnvironmentalDataPoint[] => {
  const points: EnvironmentalDataPoint[] = [];
  const centerLat = 16.0;
  const centerLon = 86.0;
  for (let lat = centerLat - 2; lat <= centerLat + 2; lat += 1) {
    for (let lon = centerLon - 2; lon <= centerLon + 2; lon += 1) {
      points.push({
        timestamp: new Date().toISOString(),
        lat,
        lon,
        sst: 29 + Math.random(),
        pressure: 1000 + Math.random() * 10,
        humidity: 80 + Math.random() * 15,
        windSpeed: 12 + Math.random() * 5,
        windDirection: 315 + Math.random() * 20,
        windShear: 5 + Math.random() * 5,
        temperature: 28.5 + Math.random() * 1.5,
      });
    }
  }
  return points;
};

export const environmentalDataPoints: EnvironmentalDataPoint[] = generateGrid();
