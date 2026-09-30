export interface ModelMetrics {
  modelId: string;
  name: string;
  modelVersion?: string;
  dataSource: 'evaluated' | 'demo';
  mae: number; // km
  error24h: number; // km
  error48h: number; // km
  error72h: number; // km
  maeWind: number; // knots
  rmseWind?: number;
  maePressure?: number; // hPa
  rmsePressure?: number;
  r2Wind?: number;
  r2Pressure?: number;
}

export interface ModelComparison {
  models: ModelMetrics[];
}

export interface FeatureImportance {
  feature: string;
  importance: number; // 0-1
  description?: string;
}

export interface ModelExplainability {
  predictionId?: string;
  modelId?: string;
  features: FeatureImportance[];
  featureImportance?: FeatureImportance[];
  explanation?: string;
  dataSource: 'model' | 'demo';
}
