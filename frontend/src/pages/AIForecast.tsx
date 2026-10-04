import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import { Polyline } from 'react-leaflet';
import { useCyclone } from '../hooks/useCyclone';
import { usePredictions } from '../hooks/usePredictions';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { PredictedTrack } from '../components/maps/PredictedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import { IntensityChart } from '../components/charts/IntensityChart';
import { getModelPerformance, errorAt } from '../services/modelService';
import type { PerformanceSummary } from '../types/model';
import { FORECAST_HOURS, type ForecastPoint } from '../types/prediction';
import { ageLabel, confidenceNote, fmtTime, trackHistoryLabel } from '../utils/dataAge';

const card = 'bg-[#FFFFFF] border border-[#CFE5E9]/60 rounded-xl p-5 shadow-sm';
const trendColor = (t?: string | null) =>
  t === 'intensifying' ? 'text-[#A15C07]' : t === 'weakening' ? 'text-[#1F7A4D]' : 'text-[#4A6670]';

export const AIForecast: React.FC = () => {
  const { cyclone, standby, loading } = useCyclone();
  const { prediction } = usePredictions(cyclone?.id || 'ACTIVE');
  const [selectedHour, setSelectedHour] = useState<number>(24);
  const [perf, setPerf] = useState<PerformanceSummary | null>(null);

  useEffect(() => { getModelPerformance().then(setPerf); }, []);

  const points: ForecastPoint[] = prediction?.forecastPoints || [];
  const byHour = (h: number) => points.find((p) => p.forecastHour === h);
  const main = prediction?.mainModel || 'XGBoost';
  const observed = cyclone?.track?.map((p) => ({ time: p.timestamp, windSpeed: p.windSpeed })) || [];
  const predicted = points
    .filter((p) => p.predictedWind != null)
    .map((p) => ({ time: p.timestamp, windSpeed: p.predictedWind as number, errorKt: errorAt(perf?.intensity, main, p.forecastHour) }));
  const future = prediction?.actualFutureTrack || [];
  const inputs = cyclone && !cyclone.isReplay ? cyclone.inputs : null;
  const lowConfidence = confidenceNote(inputs);
  const origin: [number, number] | undefined = cyclone ? [cyclone.currentPosition.lat, cyclone.currentPosition.lon] : undefined;

  if (!loading && !cyclone) {
    return (
      <div className={`${card} max-w-3xl mx-auto mt-10 text-[#0B2A33]`}>
        <h1 className="text-lg font-bold mb-2">No active cyclone to forecast</h1>
        <p className="text-sm text-[#4A6670]">
          {standby?.message || 'Track and intensity forecasts appear here when a storm is active in the North Indian Ocean.'}
        </p>
        <p className="text-sm text-[#4A6670] mt-3">
          Open <strong>Forecast (Test Storms)</strong> to see the real model output for the unseen 2007-08 test storms, or open Basin Watch
          for the 24 h formation probabilities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#0B2A33]">
      {/* Header */}
      <div className={`${card} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0B7F8E]">Track & intensity forecast</span>
            <span className="text-[#4A6670]">•</span>
            <span className="text-xs text-[#4A6670]">{main} trained on ERA5 + IBTrACS (1990-2002)</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{cyclone?.name || 'Storm'} · next 24 hours</h1>
          <p className="text-xs text-[#4A6670] mt-0.5">
            Issued {prediction?.issuedAt ? fmtTime(prediction.issuedAt, { year: true }) : '—'}
            {cyclone?.isReplay ? ' · REPLAY of a test storm the model never saw' : ' · live NOAA GFS input'}
          </p>
          {inputs && (
            <p className="text-xs text-[#4A6670] mt-0.5">
              GFS data valid {fmtTime(inputs.gfsValidTime)} ({ageLabel(inputs.gfsValidTime)}) · track history {trackHistoryLabel(inputs)}
              {inputs.sources.length > 0 ? ` from ${inputs.sources.join(', ').replace('IBTRACS_ACTIVE', 'IBTrACS')}` : ''}
            </p>
          )}
        </div>
        <div className="text-[11px] text-[#4A6670] max-w-xs">
          Model guidance for research, not an official warning. Follow IMD / RSMC New Delhi.
        </div>
      </div>

      {!prediction && (
        <div className={`${card} text-sm text-[#A15C07]`}>
          Forecast not available yet — the trained models may not be installed on the backend (see README), or the first
          live cycle is still running.
        </div>
      )}

      {lowConfidence && (
        <div className={`${card} text-sm text-[#A15C07]`}>{lowConfidence}</div>
      )}

      {/* Lead cards: +6 / +12 / +18 / +24 h */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {FORECAST_HOURS.map((h) => {
          const f = byHour(h);
          const testTrack = errorAt(perf?.track, main, h);
          const testWind = errorAt(perf?.intensity, main, h);
          return (
            <button
              key={h}
              onClick={() => setSelectedHour(h)}
              className={`${card} text-left transition-all ${selectedHour === h ? 'ring-1 ring-[#0B7F8E]/60' : ''}`}
            >
              <div className="flex justify-between items-center text-[11px] text-[#4A6670] mb-2">
                <span className="uppercase tracking-wider font-semibold">+{h} hours</span>
                {f?.predictedIMDGrade && (
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#0B7F8E]/15 text-[#0B7F8E] border border-[#0B7F8E]/30">{f.predictedIMDGrade}</span>
                )}
              </div>
              <div className="text-3xl font-bold font-mono">
                {f?.predictedWind != null ? Math.round(f.predictedWind) : '—'} <span className="text-xs text-[#4A6670] font-normal">kt</span>
              </div>
              <div className="space-y-1 text-xs text-[#4A6670] mt-3 pt-3 border-t border-[#CFE5E9]/40 font-mono">
                <div className="flex justify-between"><span>Change:</span>
                  <strong className={trendColor(f?.trend)}>{f?.windChange != null ? `${f.windChange > 0 ? '+' : ''}${Math.round(f.windChange)} kt` : '—'}</strong></div>
                <div className="flex justify-between"><span>Valid:</span>
                  <strong className="text-[#0B2A33]">{f ? fmtTime(f.timestamp) : '—'}</strong></div>
                <div className="flex justify-between"><span>Position:</span>
                  <strong className="text-[#0B2A33]">{f ? `${f.lat.toFixed(1)}°N ${f.lon.toFixed(1)}°E` : '—'}</strong></div>
                <div className="flex justify-between text-[#0B7F8E]"><span>Test error:</span>
                  <strong>{testTrack != null ? `${Math.round(testTrack)} km` : '—'} / {testWind != null ? `${testWind.toFixed(1)} kt` : '—'}</strong></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0B7F8E]" />
          <span className="text-xs font-bold uppercase tracking-wider">Forecast timeline</span>
          <span className="text-[11px] text-[#4A6670]">Select a lead time to highlight it on the map</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {FORECAST_HOURS.map((h) => (
            <button key={h} onClick={() => setSelectedHour(h)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold border ${selectedHour === h
                ? 'bg-[#E1F4F6] text-[#0B7F8E] border-[#0B7F8E]' : 'bg-[#F2FAFB] text-[#4A6670] border-[#CFE5E9]/60 hover:text-[#0B2A33]'}`}>
              T+{h}
            </button>
          ))}
        </div>
      </div>

      {/* Map + charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 ${card} flex flex-col h-[540px]`}>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#CFE5E9]/60">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide">Forecast track and uncertainty (+24 h)</h3>
              <p className="text-[11px] text-[#4A6670]">Circles: radius that contained 67% of past forecast errors at each lead</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#4A6670]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#0B7F8E] inline-block" /> Observed</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" /> Forecast</span>
              {future.length > 0 && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> What happened</span>}
            </div>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border border-[#CFE5E9]/80 relative">
            <CycloneMap center={origin || [15.5, 86]} zoom={origin ? 6 : 5} className="h-full w-full">
              {cyclone && <ObservedTrack track={cyclone.track} />}
              {future.length > 0 && (
                <Polyline positions={[...(origin ? [origin] : []), ...future.slice(0, 5).map((p) => [p.lat, p.lon] as [number, number])]}
                  pathOptions={{ color: '#34D399', weight: 2.5 }} />
              )}
              {points.length > 0 && (
                <PredictedTrack forecastPoints={points} origin={origin} selectedStep={selectedHour}
                  onSelectPoint={(p) => setSelectedHour(p.forecastHour)} />
              )}
              {cyclone && (
                <CycloneMarker position={[cyclone.currentPosition.lat, cyclone.currentPosition.lon]}
                  windSpeed={cyclone.currentPosition.windSpeed ?? 0} name={cyclone.name} />
              )}
            </CycloneMap>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={card}>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wide">Wind intensity</h4>
              <span className="text-[11px] text-[#0B7F8E] font-mono">knots</span>
            </div>
            <p className="text-[11px] text-[#4A6670] mb-2">Observed maximum sustained wind and the +6 to +24 h forecast</p>
            <div className="h-[190px]">
              <IntensityChart observedData={observed} predictedData={predicted} height={190} modelName={`${main} forecast`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={card}>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#4A6670] font-semibold">
                <Zap className="w-4 h-4 text-[#A15C07]" /> Rapid intensification
              </div>
              <div className="text-2xl font-bold font-mono mt-2">
                {prediction?.rapidIntensification ? `${Math.round(100 * prediction.rapidIntensification.probability)}%` : '—'}
              </div>
              <p className="text-[11px] text-[#4A6670] mt-1">Chance of +30 kt in 24 h. Experimental: use as a risk ranking.</p>
              {prediction?.rapidIntensification?.warning && <p className="text-[11px] text-[#A15C07] mt-1 font-semibold">Elevated RI risk</p>}
            </div>
            <div className={card}>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#4A6670] font-semibold">
                <TrendingUp className="w-4 h-4 text-[#0B7F8E]" /> Expected peak
              </div>
              <div className="text-2xl font-bold font-mono mt-2">
                {prediction?.peakIntensity ? `${Math.round(prediction.peakIntensity.windKt)} kt` : '—'}
              </div>
              <p className="text-[11px] text-[#4A6670] mt-1">
                {prediction?.peakIntensity?.imdGrade ? `Lifetime peak grade ${prediction.peakIntensity.imdGrade}` : 'Lifetime maximum wind'}
              </p>
            </div>
          </div>

          <div className={`${card} text-xs`}>
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0B7F8E]" /> HOW GOOD IS THIS FORECAST?
            </div>
            <p className="text-[11px] text-[#4A6670] mt-1">
              On the unseen 2007-08 storms, the 24 h track error was{' '}
              <strong className="text-[#0B2A33]">{errorAt(perf?.track, main, 24)?.toFixed(0) ?? '—'} km</strong>
              {' '}(CLIPER {errorAt(perf?.track, 'CLIPER', 24)?.toFixed(0) ?? '—'} km) and the 24 h wind error{' '}
              <strong className="text-[#0B2A33]">{errorAt(perf?.intensity, main, 24)?.toFixed(1) ?? '—'} kt</strong>
              {' '}(SHIFOR {errorAt(perf?.intensity, 'SHIFOR', 24)?.toFixed(1) ?? '—'} kt).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AIForecast;
