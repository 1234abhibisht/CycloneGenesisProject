import { useState } from 'react';
import { useResearchResource, selectResearchCase, utc, type CasesResponse } from '../../services/research';
export function ResearchSessionBar() {
  const { data, error } = useResearchResource<CasesResponse>('/research/cases');
  const [busy, setBusy] = useState(false); const [selectionError, setSelectionError] = useState('');
  const choose = async (id: string) => { setBusy(true); setSelectionError(''); try { await selectResearchCase(id); } catch (err) { setSelectionError(err instanceof Error ? err.message : 'Could not select case.'); } finally { setBusy(false); } };
  return <section className="research-session" aria-label="Research data selection"><div><strong>{data?.operational_mode === 'replay' ? 'Historical research replay' : data ? 'Live observation mode' : 'Connecting to research data'}</strong><p>{data?.operational_mode === 'replay' ? 'Real ERA5 + IBTrACS inputs. Predictions are recomputed with the saved +24h models.' : 'Provisional NOAA observations. Research forecasts require an archived ERA5 case.'}</p></div><label>Select a test case<select disabled={busy || !data} aria-label="Select research case" value={data?.operational_mode === 'replay' ? data.caseId : ''} onChange={e => { if (e.target.value) void choose(e.target.value); }}><option value="" disabled>Choose historical replay…</option>{data?.cases.map(c => <option key={c.id} value={c.id}>{c.name} · {utc(c.time)} · {c.wind} kt</option>)}</select></label>{(error || selectionError) && <p role="alert">{error || selectionError}</p>}</section>;
}
