import React, { useCallback, useEffect, useState } from 'react';
import { Server, Database, Cpu, CloudDownload, RefreshCw, Terminal, PlusCircle } from 'lucide-react';
import {
  fetchBackendStatus, fetchSourceStatus, fetchStormFixes, triggerLiveRefresh, addManualFix, deleteManualFix,
  getAdminPassword, setAdminPassword, verifyAdminPassword,
  type BackendStatus, type SourceStatus, type StormFixRecord,
} from '../services/api';

const card = 'bg-[#FFFFFF] border border-[#CFE5E9]/60 rounded-xl p-4 shadow-sm';
const ok = (b: boolean | undefined) => (b ? 'text-[#1F7A4D]' : 'text-[#A15C07]');

export const SystemData: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [fixes, setFixes] = useState<StormFixRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ stormId: '', name: '', time: '', lat: '', lon: '', wind: '', pres: '' });
  const [password, setPassword] = useState(getAdminPassword());

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([fetchBackendStatus(), fetchStormFixes(15)]);
    setStatus(s); setFixes(f); setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    fetchSourceStatus().then(setSources);
  }, [load]);

  const savePassword = async () => {
    setAdminPassword(password.trim());
    const r = await verifyAdminPassword();
    setMessage(r.ok ? 'Team password accepted for this browser tab.' : r.error || 'Password not accepted.');
  };

  const refreshLive = async () => {
    const r = await triggerLiveRefresh();
    setMessage(r.ok ? 'Live cycle started: missing GFS files are downloaded, then forecasts are recomputed. This can take several minutes on the first run.' : r.error || 'Could not reach the backend.');
    if (r.ok) window.setTimeout(() => void load(), 4000);
  };

  const removeFix = async (id: number, label: string) => {
    if (!window.confirm(`Delete the hand-entered position "${label}"?`)) return;
    const r = await deleteManualFix(id);
    setMessage(r.ok ? `Deleted "${label}".` : r.error || 'Could not delete.');
    if (r.ok) void load();
  };

  const submitFix = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await addManualFix({
      stormId: form.stormId.trim(), name: form.name.trim() || form.stormId.trim(), time: form.time,
      lat: Number(form.lat), lon: Number(form.lon),
      wind: form.wind ? Number(form.wind) : null, pres: form.pres ? Number(form.pres) : null,
    });
    setMessage(r.ok ? 'Position saved. Press "Run live cycle now" to recompute the forecast.' : `Position not saved: ${r.error}`);
    if (r.ok) void load();
  };

  const live = status?.live_data;
  const ml = status?.ml_inference_engine;

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#0B2A33]">
      <div className={`${card} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0B7F8E] mb-1">Data & sources</div>
          <h1 className="text-xl font-bold tracking-tight">System status and data lineage</h1>
          <p className="text-xs text-[#4A6670] mt-0.5">Everything on this page is read from the running backend.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="flex items-center gap-2 text-[11px] text-[#4A6670]">
          <span>{status?.admin_protected ? 'Team password' : 'Team password (not set on server)'}</span>
          <input type="password" autoComplete="current-password" aria-label="Team password" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void savePassword(); }}
            onBlur={() => setAdminPassword(password.trim())}
            className="w-36 bg-[#F2FAFB] border border-[#CFE5E9] rounded px-2 py-1.5 text-xs font-mono text-[#0B2A33] focus:outline-none focus:border-[#0B7F8E]" />
        </label>
        <button onClick={refreshLive} disabled={!status}
          className="inline-flex items-center gap-2 rounded-lg border border-[#0B7F8E]/40 bg-[#E1F4F6] px-3 py-2 text-xs font-semibold text-[#0B7F8E] hover:bg-[#0B7F8E]/15 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${live?.pipeline_running ? 'animate-spin' : ''}`} /> Run live cycle now
        </button>
        </div>
      </div>
      {message && <div className="rounded-lg border border-[#CFE5E9] bg-[#FFFFFF] px-4 py-3 text-xs text-[#4A6670]" role="status">{message}</div>}
      {loaded && !status && (
        <div className={`${card} text-sm text-[#A15C07]`}>Backend not reachable at the configured API URL. Start it with <code>python app.py</code> in <code>backend/</code>.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex justify-between text-xs text-[#4A6670] mb-1"><span>API server</span><Server className="w-4 h-4 text-[#0B7F8E]" /></div>
          <div className={`text-lg font-bold font-mono ${ok(!!status)}`}>{status ? status.status.replace(/_/g, ' ') : 'OFFLINE'}</div>
          <span className="text-[11px] text-[#4A6670] font-mono">Mode: {status?.operational_mode ?? '—'} · {status?.version ?? ''}</span>
        </div>
        <div className={card}>
          <div className="flex justify-between text-xs text-[#4A6670] mb-1"><span>Trained models</span><Cpu className="w-4 h-4 text-[#6D3FC0]" /></div>
          <div className="text-xs font-mono space-y-0.5 mt-1">
            <div className={ok(ml?.occurrence_model)}>Occurrence (200 km / 24 h): {ml?.occurrence_model ? 'loaded' : 'missing'}</div>
            <div className={ok(ml?.trajectory_model)}>Track +6..24 h: {ml?.trajectory_model ? 'loaded' : 'missing'}</div>
            <div className={ok(!!ml?.intensity_horizons?.length)}>Intensity: {ml?.intensity_horizons?.join(', ') || 'missing'}</div>
            <div className={ok(ml?.rapid_intensification)}>RI + peak: {ml?.rapid_intensification ? 'loaded' : 'missing'}</div>
          </div>
        </div>
        <div className={card}>
          <div className="flex justify-between text-xs text-[#4A6670] mb-1"><span>Live NOAA GFS</span><CloudDownload className="w-4 h-4 text-[#0B7F8E]" /></div>
          <div className="text-lg font-bold font-mono">{live?.gfs_files ?? 0} files</div>
          <span className="text-[11px] text-[#4A6670] font-mono">Latest valid: {live?.latest_gfs_valid_time ?? 'none yet'} (last 48 h kept on disk)</span>
        </div>
        <div className={card}>
          <div className="flex justify-between text-xs text-[#4A6670] mb-1"><span>SQLite</span><Database className="w-4 h-4 text-[#A15C07]" /></div>
          <div className="text-lg font-bold font-mono">{status?.sqlite_database.total_records_stored ?? 0} fixes</div>
          <span className="text-[11px] text-[#4A6670] font-mono">{status?.sqlite_database.forecasts_stored ?? 0} forecasts stored</span>
        </div>
      </div>

      {!!ml?.errors?.length && (
        <div className={`${card} text-[11px] font-mono text-[#A15C07]`}>
          <div className="font-sans font-semibold mb-1">Model files not loaded (see README → "Put the trained models in place"):</div>
          {ml.errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Data sources</h3>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-[#CFE5E9]/30">
              {(sources.length ? sources : [
                { source: 'NOAA GFS (NOMADS)', purpose: 'Live weather fields every 6 h', role: 'LIVE MODEL INPUT', status: 'UNAVAILABLE', checkedAt: '' },
              ] as SourceStatus[]).map((s) => (
                <tr key={s.source}>
                  <td className="py-2 font-semibold">{s.source}<div className="text-[11px] text-[#4A6670] font-normal">{s.purpose}</div></td>
                  <td className="py-2 text-[10px] font-mono text-[#4A6670]">{s.role}</td>
                  <td className="py-2 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${s.status === 'AVAILABLE'
                    ? 'bg-emerald-500/15 text-[#1F7A4D] border-emerald-500/30' : 'bg-amber-500/15 text-[#A15C07] border-amber-500/30'}`}>{s.status}</span></td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold">ERA5 (1990-2008) + IBTrACS<div className="text-[11px] text-[#4A6670] font-normal">Training data (Colab notebooks 00-06)</div></td>
                <td className="py-2 text-[10px] font-mono text-[#4A6670]">TRAINING</td>
                <td className="py-2 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[#0B7F8E]/15 text-[#0B7F8E] border-[#0B7F8E]/30">OFFLINE</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={card}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-2"><Terminal className="w-4 h-4 text-[#0B7F8E]" /> Recent pipeline runs</h3>
          <ul className="space-y-2 text-[11px] font-mono">
            {(live?.last_runs ?? []).map((r) => (
              <li key={r.id} className="border-b border-[#CFE5E9]/30 pb-1.5">
                <span className={r.status === 'ok' ? 'text-[#1F7A4D]' : r.status === 'running' ? 'text-[#0B7F8E]' : 'text-[#A15C07]'}>{r.status.toUpperCase()}</span>
                <span className="text-[#4A6670]"> · {r.started_at}</span>
                <div className="text-[#4A6670] break-words">{(r.message ?? '').slice(0, 300)}</div>
              </li>
            ))}
            {!live?.last_runs?.length && <li className="text-[#4A6670]">No run yet. The backend starts one automatically a few seconds after launch.</li>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${card}`}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Latest storm positions in SQLite</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[#4A6670] border-b border-[#CFE5E9]/80">
                <tr><th className="p-2">Storm</th><th className="p-2">Time (UTC)</th><th className="p-2">Position</th><th className="p-2">Wind</th><th className="p-2">Pressure</th><th className="p-2">Source</th><th className="p-2"></th></tr>
              </thead>
              <tbody className="divide-y divide-[#CFE5E9]/30">
                {fixes.map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 text-[#0B7F8E] font-bold">{r.name || r.storm_id}</td>
                    <td className="p-2">{r.timestamp}</td>
                    <td className="p-2">{r.lat.toFixed(1)}°N {r.lon.toFixed(1)}°E</td>
                    <td className="p-2">{r.wind_speed != null ? `${r.wind_speed} kt` : '—'}</td>
                    <td className="p-2">{r.pressure != null ? `${r.pressure} hPa` : '—'}</td>
                    <td className="p-2 text-[#4A6670]">{r.source}</td>
                    <td className="p-2">{r.source === 'MANUAL' && <button type="button" onClick={() => void removeFix(r.id, r.name || r.storm_id)}
                      className="text-[11px] text-[#B8322B] underline hover:no-underline">Delete</button>}</td>
                  </tr>
                ))}
                {!fixes.length && <tr><td colSpan={7} className="p-2 text-[#4A6670]">No storm positions stored (no active North Indian Ocean storm reported by IBTrACS ACTIVE / GDACS).</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={submitFix} className={`${card} space-y-2`}>
          <h3 className="text-xs font-bold uppercase tracking-wide mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#0B7F8E]" /> Add a storm position</h3>
          <p className="text-[11px] text-[#4A6670]">e.g. from an IMD bulletin. Wind in knots (3-min average). Two or more positions give a better forecast. Must be inside the North Indian Ocean (0-35°N, 40-100°E), within the last 7 days, with a wind speed. Needs the team password (top of the page).</p>
          {([['stormId', 'Storm ID (e.g. BOB01-2026)'], ['name', 'Name'], ['time', 'Time UTC (2026-10-01T06:00Z)'], ['lat', 'Latitude °N'],
            ['lon', 'Longitude °E'], ['wind', 'Wind kt'], ['pres', 'Pressure hPa']] as const).map(([k, label]) => (
            <input key={k} required={['stormId', 'time', 'lat', 'lon', 'wind'].includes(k)} placeholder={label} value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full bg-[#F2FAFB] border border-[#CFE5E9] rounded px-2 py-1.5 text-xs font-mono text-[#0B2A33] focus:outline-none focus:border-[#0B7F8E]" />
          ))}
          <button type="submit" disabled={!status} className="w-full rounded-lg border border-[#0B7F8E]/40 bg-[#E1F4F6] px-3 py-2 text-xs font-semibold text-[#0B7F8E] disabled:opacity-50">Save position</button>
        </form>
      </div>
    </div>
  );
};
export default SystemData;
