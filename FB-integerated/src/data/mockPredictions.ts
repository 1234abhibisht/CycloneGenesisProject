import type { PredictionResult, ForecastPoint, UncertaintyCone, IntensityForecast } from '../types/prediction';
import type { IMDGrade } from '../types/cyclone';

const generateForecastPoints = (): ForecastPoint[] => {
  const points: { hour: number; lat: number; lon: number; wind: number; pressure: number; grade: IMDGrade; uncertainty: number }[] = [
    { hour: 6, lat: 16.8, lon: 85.7, wind: 90, pressure: 955, grade: 'ESCS', uncertainty: 50 },
    { hour: 12, lat: 17.5, lon: 85.5, wind: 95, pressure: 950, grade: 'ESCS', uncertainty: 80 },
    { hour: 24, lat: 18.8, lon: 85.2, wind: 100, pressure: 945, grade: 'ESCS', uncertainty: 120 },
    { hour: 48, lat: 20.5, lon: 85.8, wind: 75, pressure: 965, grade: 'VSCS', uncertainty: 200 },
    { hour: 72, lat: 22.0, lon: 86.5, wind: 40, pressure: 990, grade: 'CS', uncertainty: 300 }
  ];

  const now = new Date();
  
  return points.map(p => {
    const time = new Date(now.getTime() + p.hour * 60 * 60 * 1000);
    return {
      timestamp: time.toISOString(),
      lat: p.lat,
      lon: p.lon,
      predictedWind: p.wind,
      predictedPressure: p.pressure,
      predictedIMDGrade: p.grade,
      forecastHour: p.hour,
      uncertainty: p.uncertainty
    };
  });
};

const forecastPointsList = generateForecastPoints();

const generateUncertaintyCones = (): UncertaintyCone[] => {
  return forecastPointsList.map(p => {
    const coordinates: [number, number][] = [];
    const numPoints = 16;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const offsetLat = (p.uncertainty / 111) * Math.cos(angle);
      const offsetLon = (p.uncertainty / (111 * Math.cos((p.lat * Math.PI) / 180))) * Math.sin(angle);
      coordinates.push([p.lat + offsetLat, p.lon + offsetLon]);
    }
    coordinates.push(coordinates[0]);

    return {
      forecastHour: p.forecastHour,
      polygon: coordinates
    };
  });
};

const intensityForecastsList: IntensityForecast[] = [
  { forecastHour: 6, windSpeed: 90, pressure: 955, trend: 'intensifying', imdGrade: 'ESCS' },
  { forecastHour: 12, windSpeed: 95, pressure: 950, trend: 'intensifying', imdGrade: 'ESCS' },
  { forecastHour: 24, windSpeed: 100, pressure: 945, trend: 'intensifying', imdGrade: 'ESCS' },
  { forecastHour: 48, windSpeed: 75, pressure: 965, trend: 'weakening', imdGrade: 'VSCS' },
  { forecastHour: 72, windSpeed: 40, pressure: 990, trend: 'weakening', imdGrade: 'CS' }
];

export const demoPrediction: PredictionResult = {
  cycloneId: 'DEMO_CYCLONE',
  predictionTime: new Date().toISOString(),
  modelVersion: 'v3.0-LSTM-Attention',
  forecastPoints: forecastPointsList,
  uncertaintyCones: generateUncertaintyCones(),
  intensityForecasts: intensityForecastsList,
  dataSource: 'model',
};
