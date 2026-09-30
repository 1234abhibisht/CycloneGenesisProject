import { useEffect, useState } from 'react';
import { Gauge, Target, Wind, Radar, MapPin, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getModelPerformance } from '../services/modelService';
import type { PerformanceSummary, LeadRow } from '../types/model';
import { FORECAST_HOURS } from '../types/prediction';

const COLORS: Record<string, string> = {
  XGBoost: '#0B7F8E', CLIPER: '#F59E0B', SHIFOR: '#F59E0B', Persistence: '#4A6670',
};

const card = 'bg-[#FFFFFF] border border-[#CFE5E9]/60 rounded-xl p-5 shadow-sm';
const fmt = (v: unknown, nd = 1) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(nd) : '—');

function LeadTable({ rows, unit, best }: { rows: LeadRow[]; unit: string; best: string }) {
  return (
    <table className="w-full text-xs font-mono">
      <thead>
        <tr className="text-[#4A6670] border-b border-[#CFE5E9]/60">
          <th className="text-left py-2 font-sans font-semibold">Model</th>
          {FORECAST_HOURS.map((h) => <th key={h} className="text-right py-2">+{h} h</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.model} className={`border-b border-[#CFE5E9]/30 ${r.model === best ? 'text-[#0B7F8E] font-bold' : 'text-[#0B2A33]'}`}>
            <td className="py-2 font-sans">{r.model === best ? `${r.model} (ours)` : r.model}</td>
            {FORECAST_HOURS.map((h) => <td key={h} className="text-right py-2">{fmt(r[`+${h}h`])} {unit}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function toChart(rows: LeadRow[]) {
  return FORECAST_HOURS.map((h) => {
    const d: Record<string, number | string | null> = { lead: `+${h} h` };
    rows.forEach((r) => { d[r.model] = r[`+${h}h`] as number | null; });
    return d;
  });
}

function improvement(rows: LeadRow[], ours: string, base: string, lead = 24) {
  const a = rows.find((r) => r.model === ours)?.[`+${lead}h`];
  const b = rows.find((r) => r.model === base)?.[`+${lead}h`];
  return typeof a === 'number' && typeof b === 'number' && b > 0 ? Math.round(100 * (1 - a / b)) : null;
}

export default function ModelPerformance() {
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelPerformance().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-[#4A6670] p-8">Loading verified model scores…</div>;
  if (!data || !data.available) {
    return (
      <div className={`${card} max-w-3xl mx-auto mt-10 text-[#0B2A33]`}>
        <h1 className="text-lg font-bold mb-2">Model scores not installed</h1>
        <p className="text-sm text-[#4A6670]">
          Copy the notebook-06 result files into <code>backend/artifacts/results/</code> (see the README) and restart the backend.
          This page only shows scores measured on unseen test storms; it never shows placeholder numbers.
        </p>
      </div>
    );
  }

  const main = data.track.find((r) => r.model === 'XGBoost') ? 'XGBoost' : data.track[0]?.model;
  const trackGain = improvement(data.track, main, 'CLIPER');
  const intGain = improvement(data.intensity, main, 'SHIFOR');
  const strike24 = data.strike.find((s) => s.window.startsWith('0-24'));
  const ev = data.occurrenceEvents[0];
  const ri = data.rapidIntensification.find((r) => r.model === main);
  const peak = data.peak.find((r) => r.model === main);
  const peakBase = data.peak.find((r) => r.model !== main);

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto text-[#0B2A33]">
      <div className={`${card} flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-[#0B7F8E]">
            <Gauge className="w-4 h-4" /> Verified evaluation
          </div>
          <h1 className="text-xl font-bold">Model performance</h1>
          <p className="text-xs text-[#4A6670] mt-0.5">
            Test period {data.testPeriod}. Trained on ERA5 + IBTrACS 1990-2002, tuned 2003-2004, calibrated 2005-2006.
          </p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[#1F7A4D] self-start md:self-center">
          Measured, not simulated
        </span>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#4A6670]"><Target className="w-4 h-4" /> 24 h track error</div>
          <div className="text-3xl font-bold font-mono mt-2">{fmt(data.track.find((r) => r.model === main)?.['+24h'], 0)} <span className="text-xs text-[#4A6670]">km</span></div>
          <p className="text-xs text-[#1F7A4D] mt-1">{trackGain != null ? `${trackGain}% lower than CLIPER` : ''}</p>
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#4A6670]"><Wind className="w-4 h-4" /> 24 h wind error</div>
          <div className="text-3xl font-bold font-mono mt-2">{fmt(data.intensity.find((r) => r.model === main)?.['+24h'])} <span className="text-xs text-[#4A6670]">kt</span></div>
          <p className="text-xs text-[#1F7A4D] mt-1">{intGain != null ? `${intGain}% lower than SHIFOR` : ''}</p>
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#4A6670]"><Radar className="w-4 h-4" /> Formation events caught</div>
          <div className="text-3xl font-bold font-mono mt-2">{ev ? `${Math.round(100 * ev.hit_rate)}%` : '—'}</div>
          <p className="text-xs text-[#4A6670] mt-1">{ev ? `${ev.events} events · ${fmt(ev.false_zones_per_forecast, 2)} false zones per forecast` : ''}</p>
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#4A6670]"><MapPin className="w-4 h-4" /> District strike skill</div>
          <div className="text-3xl font-bold font-mono mt-2">{strike24 ? `${Math.round(strike24.skill_vs_climatology_pct)}%` : '—'}</div>
          <p className="text-xs text-[#4A6670] mt-1">Brier skill vs climatology, 0-24 h</p>
        </div>
      </div>

      {/* Track */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1">Track error (km, lower is better)</h2>
          <p className="text-[11px] text-[#4A6670] mb-3">Mean great-circle distance between forecast and best-track position. CLIPER = climatology + persistence baseline.</p>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toChart(data.track)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CFE5E9" />
                <XAxis dataKey="lead" stroke="#4A6670" fontSize={11} />
                <YAxis stroke="#4A6670" fontSize={11} />
                <Tooltip contentStyle={{ background: '#F2FAFB', border: '1px solid #CFE5E9' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.track.map((r) => <Bar key={r.model} dataKey={r.model} fill={COLORS[r.model] || '#64748B'} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <LeadTable rows={data.track} unit="" best={main} />
        </div>

        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1">Intensity error (kt, lower is better)</h2>
          <p className="text-[11px] text-[#4A6670] mb-3">Mean absolute error of maximum sustained wind. SHIFOR = statistical intensity baseline.</p>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toChart(data.intensity)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CFE5E9" />
                <XAxis dataKey="lead" stroke="#4A6670" fontSize={11} />
                <YAxis stroke="#4A6670" fontSize={11} />
                <Tooltip contentStyle={{ background: '#F2FAFB', border: '1px solid #CFE5E9' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.intensity.map((r) => <Bar key={r.model} dataKey={r.model} fill={COLORS[r.model] || '#64748B'} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <LeadTable rows={data.intensity} unit="" best={main} />
        </div>
      </div>

      {/* Occurrence + strike */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1">Cyclone occurrence (200 km, next 24 h)</h2>
          <p className="text-[11px] text-[#4A6670] mb-3">Brier score of the 4-class probability (none / D-DD / CS / SCS+) per 0.5° cell, vs persistence.</p>
          <table className="w-full text-xs font-mono">
            <thead><tr className="text-[#4A6670] border-b border-[#CFE5E9]/60"><th className="text-left py-2 font-sans">Situation</th><th className="text-right">Model</th><th className="text-right">Persistence</th><th className="text-right">Skill</th></tr></thead>
            <tbody>
              {data.occurrenceGroups.map((g) => (
                <tr key={g.group} className="border-b border-[#CFE5E9]/30">
                  <td className="py-2 font-sans">{g.group}</td>
                  <td className="text-right">{fmt(g.brier_model, 4)}</td>
                  <td className="text-right">{fmt(g.brier_persistence, 4)}</td>
                  <td className="text-right text-[#1F7A4D]">{fmt(g.brier_skill_vs_persistence_pct, 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1">Coastal district strike probability</h2>
          <p className="text-[11px] text-[#4A6670] mb-3">Storm centre within 100 km of a district. Monte Carlo from the model's own past errors.</p>
          <table className="w-full text-xs font-mono">
            <thead><tr className="text-[#4A6670] border-b border-[#CFE5E9]/60"><th className="text-left py-2 font-sans">Window</th><th className="text-right">Hits</th><th className="text-right">Brier</th><th className="text-right">Climatology</th><th className="text-right">Skill</th></tr></thead>
            <tbody>
              {data.strike.map((s) => (
                <tr key={s.window} className="border-b border-[#CFE5E9]/30">
                  <td className="py-2 font-sans">{s.window}</td>
                  <td className="text-right">{s.hits}/{s.pairs}</td>
                  <td className="text-right">{fmt(s.brier, 4)}</td>
                  <td className="text-right">{fmt(s.brier_climatology, 4)}</td>
                  <td className="text-right text-[#1F7A4D]">{fmt(s.skill_vs_climatology_pct, 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RI, peak, features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Rapid intensification (experimental)</h2>
          <p className="text-3xl font-bold font-mono">{ri?.roc_auc != null ? fmt(ri.roc_auc, 2) : '—'} <span className="text-xs text-[#4A6670]">ROC-AUC</span></p>
          <p className="text-[11px] text-[#4A6670] mt-2">+30 kt in 24 h is rare in the test years; the probability is useful as a ranking, not a calibrated chance.</p>
        </div>
        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Peak intensity</h2>
          <p className="text-3xl font-bold font-mono">{fmt(peak?.mae_kt)} <span className="text-xs text-[#4A6670]">kt error</span></p>
          <p className="text-[11px] text-[#4A6670] mt-2">{peakBase ? `${peakBase.model}: ${fmt(peakBase.mae_kt)} kt` : ''}</p>
        </div>
        <div className={card}>
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#0B7F8E]" /> What the occurrence model uses most</h2>
          <ul className="space-y-1.5">
            {data.featureImportance.slice(0, 8).map((f) => (
              <li key={f.name} className="text-xs">
                <div className="flex justify-between font-mono"><span>{f.name}</span><span className="text-[#4A6670]">{f.importance}%</span></div>
                <div className="h-1.5 bg-[#F2FAFB] rounded"><div className="h-1.5 bg-[#0B7F8E] rounded" style={{ width: `${Math.min(100, f.importance)}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
