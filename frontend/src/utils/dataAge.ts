import type { ForecastInputs } from '../types/cyclone';

/** Parse a backend time. Backend times are UTC; a string without "Z"/offset is read as UTC too. */
export const parseUTC = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const s = /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(iso) ? iso + 'Z' : iso;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const IST = 'Asia/Kolkata';
const hm = (d: Date, timeZone: string) =>
  d.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });

/** "01 Oct 03:00 UTC" */
export const fmtUTC = (iso?: string | null): string => {
  const d = parseUTC(iso);
  if (!d) return '—';
  return d.toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' UTC';
};

/** "01 Oct 08:30 IST" */
export const fmtIST = (iso?: string | null): string => {
  const d = parseUTC(iso);
  if (!d) return '—';
  return d.toLocaleString('en-GB', { timeZone: IST, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST';
};

/** Main site format: "04 Oct, 14:30 IST (09:00 UTC)"; with year: "04 Oct 2026, 14:30 IST (09:00 UTC)". */
export const fmtTime = (iso?: string | null, opts: { year?: boolean } = {}): string => {
  const d = parseUTC(iso);
  if (!d) return '—';
  const day = d.toLocaleDateString('en-GB', { timeZone: IST, day: '2-digit', month: 'short', ...(opts.year ? { year: 'numeric' } : {}) });
  return `${day}, ${hm(d, IST)} IST (${hm(d, 'UTC')} UTC)`;
};

/** IST date only: "24 Sept 2026" (or without year). */
export const fmtDateIST = (iso?: string | null, opts: { year?: boolean; day?: boolean } = { year: true, day: true }): string => {
  const d = parseUTC(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { timeZone: IST, ...(opts.day === false ? {} : { day: '2-digit' }), month: 'short', ...(opts.year ? { year: 'numeric' } : {}) });
};

/** Short IST label for chart axes: "04/14:30" */
export const fmtAxisIST = (iso?: string | number | null): string => {
  if (iso == null) return '';
  const d = typeof iso === 'number' ? new Date(iso) : parseUTC(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-GB', { timeZone: IST, day: '2-digit' })}/${hm(d, IST)}`;
};

/** "5 h ago", "40 min ago", "2 days ago" */
export const ageLabel = (iso?: string | null, now: number = Date.now()): string => {
  if (!iso) return '';
  const d = parseUTC(iso);
  if (!d) return '';
  const t = d.getTime();
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
