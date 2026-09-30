import { Link } from 'react-router-dom';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useCyclone } from '../hooks/useCyclone';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';
const displayValue = (value: number | undefined) => value != null && Number.isFinite(value) ? value.toFixed(1) : '—';
export const LiveMonitoring = () => {
 const {cyclone,standby,loading,refresh}=useCyclone();
 const environment=cyclone?.environmental;
 const baseline=standby?.environmentalBaseline;
 const metrics=[
  {name:'Sea surface temperature',value:environment?.seaSurfaceTemp??baseline?.sea_surface_temp,unit:'°C',context:'Ocean surface',description:'Surface warmth provides context for the energy available to a storm.'},
  {name:'Vertical wind shear',value:environment?.windShear??baseline?.vertical_wind_shear,unit:'knots',context:'Atmospheric structure',description:'Changes in wind with height help describe the surrounding environment.'},
  {name:'Relative humidity',value:environment?.relativeHumidity??baseline?.relative_humidity,unit:'%',context:'Moisture availability',description:'Read alongside temperature and circulation to assess the wider environment.'},
  {name:'Surface pressure',value:cyclone?.currentPosition.pressure??baseline?.surface_pressure,unit:'hPa',context:'Near the surface',description:'Pressure observations help place the circulation in its regional context.'}
 ];
 const timestamp=cyclone?.lastUpdated??standby?.lastChecked;
 const provenance=cyclone ? (cyclone.isReplay||cyclone.dataSource!=='live'?'Historical replay':'Live observation record') : standby ? 'Basin baseline record' : 'Awaiting environmental data';
 return <div className="basin-workspace"><div className="basin-heading"><div><p className="eyebrow">OBSERVATORY / ENVIRONMENT</p><h1>The conditions around the storm.</h1><p className="basin-intro">Ocean warmth, atmospheric moisture and the winds that shape a system.</p></div><Link className="basin-link" to="/dashboard/satellite">Satellite imagery <ArrowUpRight size={16}/></Link></div>
  <div className="basin-status" role="status"><span className="status-dot"/><strong>{loading?'Connecting to observation sources':provenance}</strong><span>{timestamp?new Date(timestamp).toLocaleString('en-GB',{timeZone:'UTC'})+' UTC':'Observation time unavailable'}</span><button onClick={refresh} disabled={loading}><RefreshCw size={14}/>Refresh observations</button></div>
  <section className="environment-metrics" aria-label="Environmental observations">{metrics.map((m,i)=><article key={m.name}><span className="eyebrow">0{i+1} / {m.context}</span><h2>{m.name}</h2><div className="environment-reading">{displayValue(m.value)} <small>{m.unit}</small></div><p>{m.description}</p><span className="environment-availability">{m.value==null?'No observation available':provenance}</span></article>)}</section>
  <div className="environment-grid"><section className="environment-map-panel"><div className="panel-heading"><div><span className="eyebrow">REGIONAL CONTEXT</span><h2>The basin in view</h2></div><span className="map-region">North Indian Ocean</span></div><div className="basin-map"><CycloneMap center={cyclone?[cyclone.currentPosition.lat,cyclone.currentPosition.lon]:[15,82]} zoom={4}>{cyclone&&<><ObservedTrack track={cyclone.track}/><CycloneMarker position={[cyclone.currentPosition.lat,cyclone.currentPosition.lon]} windSpeed={cyclone.currentPosition.windSpeed} name={cyclone.name}/></>}</CycloneMap></div><div className="map-legend">Reference basemap and available observed track. Select Satellite for surface imagery.</div></section><aside className="environment-context"><span className="eyebrow">READING THE ENVIRONMENT</span><h2>One observation.<br/>A wider picture.</h2><p>These measurements describe different parts of the same system. Compare them with the observed track and the forecast before drawing conclusions.</p><dl><div><dt>Record type</dt><dd>{provenance}</dd></div><div><dt>Region</dt><dd>North Indian Ocean</dd></div><div><dt>Time standard</dt><dd>UTC</dd></div></dl><Link className="brief-action" to="/dashboard/forecast">Compare with the forecast <ArrowUpRight size={16}/></Link><Link className="brief-action" to="/dashboard/system">Inspect data sources <ArrowUpRight size={16}/></Link></aside></div>
  <footer className="basin-footer"><span>Cyclone AI · Environmental observations</span><span>Missing observations are shown as —</span></footer>
 </div>;
};
export default LiveMonitoring;
