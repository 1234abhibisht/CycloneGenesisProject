import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, Layers, RefreshCw } from 'lucide-react';
import { useCyclone } from '../hooks/useCyclone';
import { usePredictions } from '../hooks/usePredictions';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { PredictedTrack } from '../components/maps/PredictedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import { FORECAST_HOURS } from '../types/prediction';
import { ageLabel, confidenceNote, fmtDateIST, fmtTime, trackHistoryLabel } from '../utils/dataAge';
import './command-workspace.css';

const format = (n: number | null | undefined, digits = 0) => n != null && Number.isFinite(n) ? n.toFixed(digits) : '—';
export const CommandCenter = () => {
  const { cyclone, standby, loading, error, refresh } = useCyclone();
  const { prediction } = usePredictions(cyclone?.id || 'ACTIVE');
  const [hour, setHour] = useState(24);
  const [showObserved, setShowObserved] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const points = cyclone && prediction?.cycloneId === cyclone.id ? prediction.forecastPoints : [];
  const selected = points.find(p => p.forecastHour === hour);
  const position = cyclone?.currentPosition;
  const source = cyclone ? (cyclone.isReplay || cyclone.dataSource !== 'live' ? 'Historical replay' : 'Live feed') : standby ? 'No active cyclone' : 'Awaiting storm data';
  const inputs = cyclone && !cyclone.isReplay ? cyclone.inputs : null;
  const lowConfidence = confidenceNote(inputs);
  const last = standby?.lastSystem;
  const standbyLine = last ? `Last system: ${last.name} (${fmtDateIST(last.lastSeen)})${standby?.dataValidTime ? ` · latest GFS data ${ageLabel(standby.dataValidTime)}` : ''}` : 'No storm record available in this workspace';
  return <div className="basin-workspace">
    <div className="basin-heading with-cloud"><div><p className="eyebrow">OBSERVATORY / NORTH INDIAN OCEAN</p><h1>A clearer view of the storm.</h1><p className="basin-intro">Track the basin. Read the forecast. Put each observation in context.</p></div><Link className="basin-link" to="/dashboard/historical">Explore the archive <ArrowUpRight size={16}/></Link></div>
    <div className="basin-status" role="status"><span className="status-dot"/><strong>{loading ? 'Connecting to observation sources' : source}</strong><span>{cyclone ? `${cyclone.name} · ${cyclone.basin}${inputs ? ` · GFS data ${ageLabel(inputs.gfsValidTime)}` : ''}` : standbyLine}{!cyclone && standby ? <> · To see the model on past storms, open Explore → <Link to="/dashboard/historical" className="standby-test-link">Forecast (Test Storms)</Link></> : null}</span><button onClick={refresh} disabled={loading}><RefreshCw size={14}/> Refresh observations</button></div>
    {error && <p className="basin-error" role="alert">Observations could not be refreshed. {error}</p>}
    <div className="basin-grid">
      <section className="basin-map-panel" aria-label="Basin observation map">
        <div className="panel-heading"><div><span className="eyebrow">01 / BASIN OVERVIEW</span><h2>North Indian Ocean</h2></div><span className="map-region"><Compass size={15}/> Bay of Bengal & Arabian Sea</span></div>
        <div className="basin-map"><CycloneMap center={position ? [position.lat,position.lon] : [15,82]} zoom={4} className="h-full w-full">
          {cyclone && showObserved && <ObservedTrack track={cyclone.track}/>}
          {showForecast && points.length > 0 && <PredictedTrack forecastPoints={points} origin={position ? [position.lat,position.lon] : undefined} selectedStep={hour} onSelectPoint={p=>setHour(p.forecastHour)}/>}
          {cyclone && position && <CycloneMarker position={[position.lat,position.lon]} windSpeed={position.windSpeed ?? 0} name={cyclone.name}/>}
        </CycloneMap><div className="map-caption">{cyclone ? `${cyclone.name} / ${source}` : 'Basin reference map · no storm selected'}</div></div>
        <div className="map-legend"><label><input type="checkbox" checked={showObserved} onChange={e=>setShowObserved(e.target.checked)}/><span className="track-key observed"/>Observed track</label><label><input type="checkbox" checked={showForecast} onChange={e=>setShowForecast(e.target.checked)}/><span className="track-key forecast"/>Forecast track</label><span>Times in IST (UTC)</span></div>
        <div className="forecast-strip"><span className="eyebrow">FORECAST HORIZON</span><div>{FORECAST_HOURS.map(h=><button key={h} aria-pressed={hour===h} disabled={!points.some(p=>p.forecastHour===h)} onClick={()=>setHour(h)}>+{h}h</button>)}</div><Link to="/dashboard/forecast">Full forecast <ArrowUpRight size={14}/></Link></div>
      </section>
      <aside className="storm-brief"><div className="brief-top"><span className="eyebrow">02 / STORM BRIEF</span><span className="brief-tag">{cyclone ? source : 'STANDBY'}</span></div><h2>{loading ? 'Loading observations…' : cyclone?.name || 'Watching the basin'}</h2><p>{cyclone ? `Latest available observation · ${position?.imdGrade || 'Grade not reported'}` : 'Storm details will appear here when an observation record is available.'}</p>
        <div className="wind-reading"><strong>{format(position?.windSpeed)}</strong><span>knots<br/>sustained wind</span></div>
        <dl className="brief-details"><div><dt>Central pressure</dt><dd>{format(position?.pressure)} <small>hPa</small></dd></div><div><dt>Position</dt><dd>{position ? `${format(position.lat,1)}°, ${format(position.lon,1)}°` : '—'}</dd></div><div><dt>Movement</dt><dd>{format(position?.stormSpeed)} <small>knots</small></dd></div><div><dt>Observation time</dt><dd>{position?.timestamp ? fmtTime(position.timestamp) : 'Not available'}</dd></div>{inputs && <><div><dt>GFS data valid</dt><dd>{fmtTime(inputs.gfsValidTime)} <small>{ageLabel(inputs.gfsValidTime)}</small></dd></div><div><dt>Track history</dt><dd>{trackHistoryLabel(inputs)}</dd></div></>}</dl>
        <div className="forecast-note"><span className="eyebrow">AT +{hour} HOURS</span><h3>{selected ? `${format(selected.predictedWind)} knots expected` : 'Forecast pending'}</h3><p>{selected ? `${selected.predictedIMDGrade ? `Grade ${selected.predictedIMDGrade}. ` : ''}Wind change ${selected.windChange != null && selected.windChange > 0 ? '+' : ''}${format(selected.windChange)} knots. Position uncertainty ±${format(selected.uncertainty)} km.${lowConfidence ? ` ${lowConfidence}` : ''}` : 'A matching model forecast is needed before a forecast summary can be shown.'}</p></div>
        <Link className="brief-action" to="/dashboard/forecast">Open forecast analysis <ArrowUpRight size={16}/></Link>
      </aside>
    </div>
    <section className="workspace-paths" aria-label="Analysis tools">{[{n:'03',title:'Basin watch',body:'Chance of a cyclone forming within 200 km in the next 24 hours.',to:'basin'},{n:'04',title:'District strike rate (live)',body:'Probability that the storm centre passes within 100 km of each coastal district.',to:'warnings'},{n:'05',title:'Data & provenance',body:'Check sources, availability and model information.',to:'system'}].map(item=><Link key={item.n} to={`/dashboard/${item.to}`}><span className="eyebrow">{item.n} / EXPLORE</span><h3>{item.title}<ArrowUpRight size={18}/></h3><p>{item.body}</p></Link>)}</section>
    <footer className="basin-footer"><span><Layers size={13}/> Cyclone AI · Research workspace</span><span>For official warnings, consult <a href="https://rsmcnewdelhi.imd.gov.in/" target="_blank" rel="noreferrer">IMD / RSMC New Delhi ↗</a></span></footer>
  </div>;
};
export default CommandCenter;
