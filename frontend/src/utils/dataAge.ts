import type { ForecastInputs } from '../types/cyclone';

/** "01 Oct 03:00 UTC" */
export const fmtUTC = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UTC';
};

/** "01 Oct 08:30 IST" */
export const fmtIST = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST';
};

/** "5 h ago", "40 min ago", "2 days ago" */
export const ageLabel = (iso?: string | null, now: number = Date.now()): string => {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const min = Math.max(0, Math.round((now - t) / 60000));
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
};

/** Short, plain description of how much real track history a live forecast started from. */
export const trackHistoryLabel = (inp?: ForecastInputs | null): string => {
  if (!inp) return '—';
  const n = `${inp.fixCount} position${inp.fixCount === 1 ? '' : 's'}`;
  return inp.fixCount < 2 ? n : `${n} · ${Math.round(inp.trackHours)} h`;
};

/** Warning text when the forecast starts from little track history; null when history is adequate. */
export const confidenceNote = (inp?: ForecastInputs | null): string | null => {
  if (!inp || inp.confidence === 'good') return null;
  if (inp.confidence === 'single') {
    return 'Only one storm position is available so far, so the model cannot see how the storm has been moving. Treat the track as low confidence until more positions arrive.';
  }
  return `Only ${Math.round(inp.trackHours)} h of track history is available (12 h or more is normal), so the track is less certain than the test scores suggest.`;
};
