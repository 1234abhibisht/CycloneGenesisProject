import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, MapPin, Wind, Gauge, Target } from 'lucide-react';
import { Polyline } from 'react-leaflet';
import { fetchHistoricalCatalog, fetchHistoricalReplay } from '../services/historicalService';
import type { HistoricalStormSummary, HistoricalReplayData, HistoricalReplayPoint } from '../types/historical';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { PredictedTrack } from '../components/maps/PredictedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import type { TrackPoint } from '../types/cyclone';
import { FORECAST_HOURS } from '../types/prediction';
import { fmtTime } from '../utils/dataAge';

const card = 'bg-[#FFFFFF] border border-[#CFE5E9]/60 rounded-xl p-4 shadow-sm';

function km(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

const toTrack = (p: HistoricalReplayPoint): TrackPoint => ({
  timestamp: p.timestamp, lat: p.lat, lon: p.lon, windSpeed: p.windSpeed ?? 0, pressure: p.pressure ?? 0,
  nature: 'TS', stormSpeed: 0, stormDir: 0, imdGrade: (p.imdGrade ?? undefined) as TrackPoint['imdGrade'],
});

const utc = (t?: string) => fmtTime(t, { year: true });

export const HistoricalIntelligence: React.FC = () => {
  const [catalog, setCatalog] = useState<HistoricalStormSummary[]>([]);
  const [stormId, setStormId] = useState<string>('');
  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<HistoricalReplayData | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchHistoricalCatalog().then((storms) => {
      setCatalog(storms);
      setLoaded(true);
      if (storms.length) {
        setStormId(storms[0].id);
        setStep(Math.floor(storms[0].totalSteps / 2));
      }
    });
  }, []);

  useEffect(() => {
    if (!stormId) return;
    let active = true;
    fetchHistoricalReplay(stormId, step).then((d) => { if (active && d) setData(d); });
    return () => { active = false; };
  }, [stormId, step]);

  const total = data?.replayState.totalSteps ?? catalog.find((s) => s.id === stormId)?.totalSteps ?? 1;
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setStep((s) => (s + 2 >= total ? (setPlaying(false), s) : s + 2)); // 2 steps = 6 h
    }, 1800);
    return () => window.clearInterval(t);
  }, [playing, total]);

  if (loaded && !catalog.length) {
    return (
      <div className={`${card} max-w-3xl mx-auto mt-10 text-[#0B2A33] p-6`}>
        <h1 className="text-lg font-bold mb-2">Replay data not installed</h1>
        <p className="text-sm text-[#4A6670]">
          Put <code>replay_storm_fixes.csv</code> (created by <code>scripts/export_artifacts_colab.py</code>) in
          <code> backend/artifacts/replay/</code> and restart the backend.
        </p>
      </div>
    );
  }

  const obs = data?.replayState.observedTrackSoFar ?? [];
  const now = data?.replayState.currentObservation;
  const future = data?.replayState.actualFutureTrack ?? [];
  const storm = data?.storm ?? catalog.find((s) => s.id === stormId);
  const t0 = now ? new Date(now.timestamp).getTime() : 0;
  const actualAt = (h: number) => future.find((p) => new Date(p.timestamp).getTime() - t0 === h * 3600e3);
  const next24 = future.filter((p) => new Date(p.timestamp).getTime() - t0 <= 24 * 3600e3);

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#0B2A33]">
      <div className={`${card} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-[#0B7F8E]">
            Unseen test storms · 2007-2008
          </div>
          <h1 className="text-xl font-bold tracking-tight">Forecast replay</h1>
          <p className="text-xs text-[#4A6670] mt-0.5">
            Step through a real storm. At every step the trained models forecast the next 24 h from ERA5 conditions,
            and the map shows what actually happened. These storms were never used for training or tuning.
          </p>
        </div>
        <select
          value={stormId}
          onChange={(e) => {
            const s = catalog.find((c) => c.id === e.target.value);
            setStormId(e.target.value); setStep(s ? Math.floor(s.totalSteps / 2) : 0); setPlaying(false);
          }}
          className="bg-[#F2FAFB] border border-[#CFE5E9] text-[#0B2A33] text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-[#0B7F8E]"
        >
          {catalog.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.season}) — peak {s.peakIMDGrade}, {s.maxWind} kt</option>)}
        </select>
      </div>

      {/* Controls */}
      <div className={`${card} flex flex-col md:flex-row items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setPlaying(!playing)}
            className="px-4 py-2 rounded-lg bg-[#E1F4F6] hover:bg-[#CFE5E9] border border-[#CFE5E9] text-xs font-mono font-bold flex items-center gap-2">
            {playing ? <Pause className="w-3.5 h-3.5 text-[#A15C07]" /> : <Play className="w-3.5 h-3.5 text-[#1F7A4D]" />}
            {playing ? 'PAUSE' : 'PLAY'}
          </button>
          <button onClick={() => { setStep(0); setPlaying(false); }} title="Back to the first fix"
            className="p-2 rounded-lg bg-[#E1F4F6] hover:bg-[#CFE5E9] border border-[#CFE5E9] text-[#4A6670]">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-[#4A6670]">STEP <strong className="text-[#0B7F8E]">{step + 1}</strong> / {total}</span>
        </div>
        <input type="range" min={0} max={Math.max(0, total - 1)} value={step}
          onChange={(e) => { setStep(Number(e.target.value)); setPlaying(false); }}
          className="flex-1 max-w-xl w-full accent-[#0B7F8E]" />
        <div className="text-xs font-mono text-[#4A6670]">FORECAST ISSUED: <span className="text-[#0B2A33]">{utc(now?.timestamp)}</span></div>
      </div>

      {/* Now */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex justify-between text-[#4A6670] text-xs mb-1"><span>Observed wind</span><Wind className="w-4 h-4 text-[#0B7F8E]" /></div>
          <div className="text-2xl font-bold font-mono">{now?.windSpeed ?? '—'} <span className="text-xs text-[#4A6670]">kt</span></div>
          <span className="text-[11px] font-mono text-[#4A6670]">Grade {now?.imdGrade ?? '—'}</span>
        </div>
        <div className={card}>
          <div className="flex justify-between text-[#4A6670] text-xs mb-1"><span>Observed pressure</span><Gauge className="w-4 h-4 text-[#0B7F8E]" /></div>
          <div className="text-2xl font-bold font-mono">{now?.pressure ?? '—'} <span className="text-xs text-[#4A6670]">hPa</span></div>
          <span className="text-[11px] font-mono text-[#4A6670]">Best track (observation, not forecast)</span>
        </div>
        <div className={card}>
          <div className="flex justify-between text-[#4A6670] text-xs mb-1"><span>Position</span><MapPin className="w-4 h-4 text-[#0B7F8E]" /></div>
          <div className="text-xl font-bold font-mono">{now ? `${now.lat.toFixed(1)}°N ${now.lon.toFixed(1)}°E` : '—'}</div>
          <span className="text-[11px] font-mono text-[#4A6670]">{storm?.subBasin === 'AS' ? 'Arabian Sea' : 'Bay of Bengal'}</span>
        </div>
        <div className={card}>
          <div className="flex justify-between text-[#4A6670] text-xs mb-1"><span>Model extras</span><Target className="w-4 h-4 text-[#1F7A4D]" /></div>
          <div className="text-sm font-mono">RI chance <strong>{data?.rapidIntensification ? `${Math.round(100 * data.rapidIntensification.probability)}%` : '—'}</strong></div>
          <div className="text-sm font-mono">Peak <strong>{data?.peakIntensity ? `${Math.round(data.peakIntensity.windKt)} kt` : '—'}</strong> <span className="text-[#4A6670]">(actual {storm?.maxWind ?? '—'} kt)</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 ${card} p-5 h-[540px] flex flex-col`}>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#CFE5E9]/60">
            <h3 className="text-xs font-bold uppercase tracking-wide">Forecast vs what happened</h3>
            <div className="flex items-center gap-3 text-[10px] text-[#4A6670]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#0B7F8E] inline-block" /> Observed so far</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" /> Model forecast</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Actual next 24 h</span>
            </div>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border border-[#CFE5E9]/80">
            {now && (
              <CycloneMap center={[now.lat, now.lon]} zoom={6} className="h-full w-full">
                <ObservedTrack track={obs.map(toTrack)} />
                {next24.length > 0 && (
                  <Polyline positions={[[now.lat, now.lon], ...next24.map((p) => [p.lat, p.lon] as [number, number])]}
                    pathOptions={{ color: '#34D399', weight: 2.5 }} />
                )}
                {data?.forecast?.length ? <PredictedTrack forecastPoints={data.forecast} origin={[now.lat, now.lon]} /> : null}
                <CycloneMarker position={[now.lat, now.lon]} windSpeed={now.windSpeed ?? 0} name={storm?.name} />
              </CycloneMap>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className={card}>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Forecast check at this step</h3>
            <table className="w-full text-xs font-mono">
              <thead><tr className="text-[#4A6670] border-b border-[#CFE5E9]/60">
                <th className="text-left py-1.5">Lead</th><th className="text-right">Track error</th><th className="text-right">Wind fc / actual</th></tr></thead>
              <tbody>
                {FORECAST_HOURS.map((h) => {
                  const f = data?.forecast?.find((p) => p.forecastHour === h);
                  const a = actualAt(h);
                  return (
                    <tr key={h} className="border-b border-[#CFE5E9]/30">
                      <td className="py-1.5">+{h} h</td>
                      <td className="text-right">{f && a ? `${Math.round(km(f.lat, f.lon, a.lat, a.lon))} km` : '—'}</td>
                      <td className="text-right">{f?.predictedWind != null ? Math.round(f.predictedWind) : '—'} / {a?.windSpeed ?? '—'} kt</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[11px] text-[#4A6670] mt-2">"—" means the storm had ended or left the model domain by then.</p>
          </div>

          <div className={card}>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Coastal districts at risk (next 24 h)</h3>
            <ul className="space-y-1.5 text-xs">
              {(data?.districts ?? []).filter((d) => (d.riskScore ?? 0) >= 5).slice(0, 8).map((d) => (
                <li key={d.districtId} className="flex justify-between font-mono">
                  <span className="font-sans">{d.districtName}, {d.state}</span>
                  <span className={d.warningLevel === 'RED' ? 'text-[#B8322B]' : d.warningLevel === 'ORANGE' ? 'text-[#C2561A]'
                    : d.warningLevel === 'YELLOW' ? 'text-[#8A6A00]' : 'text-[#1F7A4D]'}>{d.strikeLabel} · {d.warningLevel}</span>
                </li>
              ))}
              {!(data?.districts ?? []).some((d) => (d.riskScore ?? 0) >= 5) && (
                <li className="text-[#4A6670]">No Indian coastal district above 5% at this step.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HistoricalIntelligence;
