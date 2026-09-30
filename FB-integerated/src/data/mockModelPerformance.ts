import type { ModelMetrics, ModelComparison, FeatureImportance, ModelExplainability } from '../types/model';

export const demoModelMetrics: ModelMetrics[] = [
  {
    modelId: 'baseline-climatological',
    name: 'Climatological Baseline',
    modelVersion: 'v1.0-CLIPER',
    dataSource: 'demo',
    mae: 180,
    error24h: 120,
    error48h: 200,
    error72h: 280,
    maeWind: 18,
    rmseWind: 22,
    maePressure: 14,
    rmsePressure: 18,
    r2Wind: 0.65,
    r2Pressure: 0.68,
  },
  {
    modelId: 'xgb-ensemble',
    name: 'XGBoost Ensemble',
    modelVersion: 'v2.1',
    dataSource: 'demo',
    mae: 95,
    error24h: 55,
    error48h: 110,
    error72h: 160,
    maeWind: 10,
    rmseWind: 14,
    maePressure: 7,
    rmsePressure: 10,
    r2Wind: 0.82,
    r2Pressure: 0.85,
  },
  {
    modelId: 'dl-lstm-attention',
    name: 'Deep Learning (LSTM+Attention)',
    modelVersion: 'v3.0-Production',
    dataSource: 'demo',
    mae: 72,
    error24h: 42,
    error48h: 85,
    error72h: 125,
    maeWind: 8,
    rmseWind: 12,
    maePressure: 5,
    rmsePressure: 8,
    r2Wind: 0.89,
    r2Pressure: 0.91,
  }
];

export const modelComparison: ModelComparison = {
  models: demoModelMetrics
};

export const mockFeatureImportance: FeatureImportance[] = [
  { feature: 'Previous Position', importance: 0.28, description: 'Past 24-hour trajectory vector and translation speed' },
  { feature: 'Sea Surface Temp', importance: 0.18, description: 'SST ocean heat content exceeding 26.5°C threshold' },
  { feature: 'Wind Shear (200-850 hPa)', importance: 0.15, description: 'Vertical shear suppressing or enabling convective structure' },
  { feature: 'Pressure Gradient', importance: 0.12, description: 'Central pressure deficit compared to ambient environment' },
  { feature: 'Storm Motion Dynamics', importance: 0.10, description: 'Forward velocity and beta-drift steering component' },
  { feature: 'Mid-Level Humidity', importance: 0.08, description: 'Moisture entrainment in 700-500 hPa layer' },
  { feature: 'Season & Genesis Location', importance: 0.05, description: 'Climatological prior based on Bay of Bengal historical basin behavior' },
  { feature: 'Coriolis Parameter', importance: 0.04, description: 'Latitude-dependent planetary vorticity effect' }
];

export const modelExplainability: ModelExplainability = {
  predictionId: 'pred-72h-fani-sim',
  modelId: 'dl-lstm-attention',
  dataSource: 'demo',
  features: mockFeatureImportance,
  featureImportance: mockFeatureImportance,
  explanation: 'The model predicts steady northwest movement with intensification over the next 24h, driven predominantly by high Sea Surface Temperatures (29.5°C) and low vertical wind shear (<10 m/s).'
};
