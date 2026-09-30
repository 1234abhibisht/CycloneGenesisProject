import { useCallback, useEffect, useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { Activity, Droplets, RefreshCw, Thermometer, Wind } from 'lucide-react';
import { CycloneMap } from '../components/maps/CycloneMap';
import { getBasinAssessment, type BasinAssessment, type BasinZone } from '../services/basinService';

const styleByRisk = {
  LOW: { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', color: '#34d399' },
  MODERATE: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', color: '#fbbf24' },
  HIGH: { badge: 'bg-red-500/15 text-red-300 border-red-500/30', color: '#f87171' },
};

const metric = (value: number | null | undefined, suffix: string) => value != null && Number.isFinite(value) ? `${value}${suffix}` : 'N/A';
const cellColor = (p: number) => (p >= 0.15 ? '#f87171' : p >= 0.05 ? '#fbbf24' : '#38bdf8');

export default function BasinWatch() {
  const [assessment, setAssessment] = useState<BasinAssessment | null>(null);
  const [selected, setSelected] = useState<BasinZone | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await getBasinAssessment();
    setAssessment(next);
    setSelected(current => current ? next.zones.find(zone => zone.id === current.id) ?? null : next.zones[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#E6EDF5]">
      <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
            <Activity className="w-4 h-4" /> Basin-wide early detection
          </div>
          <h2 className="text-xl font-bold">Cyclogenesis Basin Watch</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Calibrated chance of a cyclone within 200 km in the next 24 hours, from the occurrence model on the latest NOAA GFS run.</p>
        </div>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#38BDF8]/40 bg-[#102235] px-3 py-2 text-xs font-semibold text-[#38BDF8] hover:bg-sky-500/15 disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Checking feeds…' : 'Refresh assessment'}
        </button>
      </div>

      {assessment && (
        <div className="rounded-lg border border-[#1E3A5F] bg-[#0A1625] px-4 py-3 text-xs text-[#94A3B8]">
          <span className={assessment.status === 'LIVE' ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>{assessment.status === 'LIVE' ? 'LIVE OCCURRENCE FORECAST' : assessment.status === 'OFFLINE' ? 'SERVICE OFFLINE' : 'WAITING FOR FIRST GFS RUN'}</span>
          <span className="mx-2 text-[#1E3A5F]">•</span>{assessment.summary}<span className="mx-2 text-[#1E3A5F]">•</span>Source: {assessment.source}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-3">
          {assessment?.zones.map(zone => {
            const visual = styleByRisk[zone.riskLevel];
            return <button key={zone.id} onClick={() => setSelected(zone)} className={`w-full text-left rounded-xl border p-4 transition ${selected?.id === zone.id ? 'border-[#38BDF8] bg-[#102235]' : 'border-[#1E3A5F]/60 bg-[#0D1B2A] hover:border-[#38BDF8]/40'}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm">{zone.name}</p><p className="text-[11px] text-[#94A3B8] mt-0.5">{zone.basin}</p></div><span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${visual.badge}`}>{zone.riskLevel}</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono text-[#94A3B8]"><span>SST <b className="text-[#E6EDF5]">{metric(zone.sst, '°C')}</b></span><span>Shear <b className="text-[#E6EDF5]">{metric(zone.shear, ' kt')}</b></span><span>24h <b className="text-[#E6EDF5]">{metric(zone.probability, '%')}</b></span></div>
            </button>;
          })}
        </div>
        <div className="xl:col-span-8 space-y-4">
          <div className="h-[470px] rounded-xl overflow-hidden border border-[#1E3A5F]"><CycloneMap center={[15, 82]} zoom={4}>{assessment?.cells?.map(c => <CircleMarker key={`${c.lat}-${c.lon}`} center={[c.lat, c.lon]} radius={3} pathOptions={{ stroke: false, fillColor: cellColor(c.pCsPlus), fillOpacity: Math.min(0.85, 0.25 + c.pAny) }}><Popup>{c.lat.toFixed(1)}°N {c.lon.toFixed(1)}°E<br />Any cyclone: {Math.round(100 * c.pAny)}%<br />Cyclonic storm+: {Math.round(100 * c.pCsPlus)}%</Popup></CircleMarker>)}{assessment?.zones.map(zone => <CircleMarker key={zone.id} center={[zone.lat, zone.lon]} radius={selected?.id === zone.id ? 13 : 9} pathOptions={{ color: styleByRisk[zone.riskLevel].color, fillColor: styleByRisk[zone.riskLevel].color, fillOpacity: 0.45, weight: 2 }} eventHandlers={{ click: () => setSelected(zone) }}><Popup><strong>{zone.name}</strong><br />24 h chance of a cyclonic storm+ within 200 km: {metric(zone.probability, '%')}<br />Risk: {zone.riskLevel}</Popup></CircleMarker>)}</CycloneMap></div>
          {selected && <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-[#1E3A5F]/60 bg-[#0D1B2A] p-4"><div className="sm:col-span-4 flex justify-between"><span className="font-semibold">{selected.name}</span><span className="text-xs text-[#94A3B8]">{selected.basin}</span></div><div className="text-xs text-[#94A3B8]"><Thermometer className="inline w-3.5 h-3.5 text-amber-400 mr-1" /> SST <b className="text-[#E6EDF5]">{metric(selected.sst, '°C')}</b></div><div className="text-xs text-[#94A3B8]"><Wind className="inline w-3.5 h-3.5 text-sky-400 mr-1" /> Shear <b className="text-[#E6EDF5]">{metric(selected.shear, ' kt')}</b></div><div className="text-xs text-[#94A3B8]"><Droplets className="inline w-3.5 h-3.5 text-cyan-400 mr-1" /> Humidity <b className="text-[#E6EDF5]">{metric(selected.humidity, '%')}</b></div><div className="text-xs text-[#94A3B8]"><Activity className="inline w-3.5 h-3.5 text-emerald-400 mr-1" /> 24 h chance <b className="text-[#E6EDF5]">{metric(selected.probability, '%')}</b></div></div>}
          <p className="text-[11px] text-[#94A3B8]">
            Dots: 0.5° sea cells with at least 2% chance of any depression within 200 km in 24 h (red: above the calibrated warning
            threshold for a cyclonic storm). Zone level: HIGH at or above the warning threshold, MODERATE at one third of it.
            On the unseen 2007-08 test years this threshold caught 96% of events with 0.09 false-alarm zones per forecast.
          </p>
        </div>
      </div>
    </div>
  );
}
