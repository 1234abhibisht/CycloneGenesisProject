export type ERA5Variable = 'sst' | 'pressure' | 'humidity' | 'windSpeed' | 'windDirection' | 'windShear' | 'temperature';

export interface EnvironmentalDataPoint {
  timestamp: string;
  lat: number;
  lon: number;
  sst: number; // °C
  pressure: number; // hPa
  humidity: number; // %
  windSpeed: number; // m/s
  windDirection: number; // degrees
  windShear?: number; // m/s
  temperature?: number; // °C
}

export interface EnvironmentalTimeSeries {
  variable: ERA5Variable;
  unit: string;
  data: { timestamp: string; value: number }[];
}

export interface EnvironmentalSummary {
  sst: { value: number; unit: string; trend: 'rising' | 'stable' | 'falling'; favorable: boolean };
  pressure: { value: number; unit: string; trend: 'rising' | 'stable' | 'falling' };
  humidity: { value: number; unit: string; trend: 'rising' | 'stable' | 'falling' };
  windSpeed: { value: number; unit: string };
  windShear: { value: number; unit: string; favorable: boolean };
}
