import { API_BASE_URL } from './api';
import type { PerformanceSummary } from '../types/model';

let cache: Promise<PerformanceSummary | null> | null = null;

/** Scores of the trained models on the unseen 2007-2008 test storms (never invented in the UI). */
export function getModelPerformance(force = false): Promise<PerformanceSummary | null> {
  if (!cache || force) {
    cache = fetch(`${API_BASE_URL}/models/performance`)
      .then(async (res) => (res.ok ? ((await res.json()).data as PerformanceSummary) : null))
      .catch(() => null);
  }
  return cache;
}

/** Test error of one model at one lead, e.g. errorAt(p.track, 'XGBoost', 24). */
export function errorAt(rows: { model: string }[] | undefined, model: string, lead: number): number | null {
  const row = rows?.find((r) => r.model === model) as Record<string, unknown> | undefined;
  const v = row?.[`+${lead}h`];
  return typeof v === 'number' ? v : null;
}
