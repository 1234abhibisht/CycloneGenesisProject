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

/* ---- Verified test-year scores served by GET /api/models/performance (Colab notebook 06) ---- */
export type LeadRow = { model: string } & Record<string, number | string | null>; // keys "+6h" ... "+24h"

export interface PerformanceSummary {
  available: boolean;
  testPeriod: string;
  track: LeadRow[]; // mean great-circle error, km
  intensity: LeadRow[]; // mean absolute wind error, kt
  occurrenceGroups: { group: string; brier_model: number | null; brier_persistence: number | null;
    brier_skill_vs_persistence_pct: number | null; logloss_model?: number | null; rows?: number | null }[];
  occurrenceEvents: { threshold: number; events: number; hit_rate: number; false_zones_per_forecast: number;
    zones_per_forecast?: number; forecasts?: number }[];
  strike: { window: string; pairs: number; hits: number; brier: number; brier_climatology: number;
    skill_vs_climatology_pct: number }[];
  rapidIntensification: { model: string; brier: number | null; roc_auc: number | null }[];
  peak: { model: string; mae_kt: number | null; grade_accuracy: number | null }[];
  featureImportance: { name: string; importance: number }[];
}
