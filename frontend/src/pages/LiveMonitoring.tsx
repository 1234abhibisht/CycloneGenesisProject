import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rectangle } from 'react-leaflet';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useCyclone } from '../hooks/useCyclone';
import type { OperationalStandbyState } from '../types/cyclone';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';
const displayValue = (value: number | null | undefined) => value != null && Number.isFinite(value) ? value.toFixed(1) : '—';
export const LiveMonitoring = () => {
 const {cyclone,standby,loading,refresh}=useCyclone();
 const environment=cyclone?.environmental;
 // no storm: GFS averages over a chosen region (Bay of Bengal or Arabian Sea); storm: averages around the storm
 const [regionKey,setRegionKey]=useState('BOB');
 const regions:OperationalStandbyState['environmentalBaselines']=standby?.environmentalBaselines||null;
 const region=regions?.[regionKey]??null;
 const baseline=region??standby?.environmentalBaseline;
 const areaLabel=cyclone?'Averages around the storm centre (sea temperature and humidity within 300 km, shear within 500 km); pressure is the storm centre':(region?.label??'Bay of Bengal average (8-22°N, 80-95°E)');
 const metrics=[
  {name:'Sea surface temperature',value:environment?.seaSurfaceTemp??baseline?.sea_surface_temp,unit:'°C',context:'Ocean surface',description:'Surface warmth provides context for the energy available to a storm.'},
  {name:'Vertical wind shear',value:environment?.windShear??baseline?.vertical_wind_shear,unit:'knots',context:'Atmospheric structure',description:'Changes in wind with height help describe the surrounding environment.'},
  {name:'Relative humidity',value:environment?.relativeHumidity??baseline?.relative_humidity,unit:'%',context:'Moisture availability',description:'Read alongside temperature and circulation to assess the wider environment.'},
  {name:'Surface pressure',value:cyclone?.currentPosition.pressure??baseline?.surface_pressure,unit:'hPa',context:'Near the surface',description:'Pressure observations help place the circulation in its regional context.'}
 ];
 const timestamp=cyclone?.lastUpdated??standby?.lastChecked;
 const provenance=cyclone ? (cyclone.isReplay||cyclone.dataSource!=='live'?'Historical replay':'Live observation record') : standby ? (standby.dataValidTime ? `NOAA GFS · valid ${new Date(standby.dataValidTime).toUTCString().slice(5,22)} UTC` : 'Waiting for the first GFS run') : 'Awaiting environmental data';
 return <div className="basin-workspace"><div className="basin-heading with-cloud"><div><p className="eyebrow">OBSERVATORY / ENVIRONMENT</p><h1>The conditions around the storm.</h1><p className="basin-intro">Ocean warmth, atmospheric moisture and the winds that shape a system.</p></div><Link className="basin-link" to="/dashboard/basin">Basin watch <ArrowUpRight size={16}/></Link></div>
  <div className="basin-status" role="status"><span className="status-dot"/><strong>{loading?'Connecting to observation sources':provenance}</strong><span>{timestamp?new Date(timestamp).toLocaleString('en-GB',{timeZone:'UTC'})+' UTC':'Observation time unavailable'}</span>{!cyclone&&regions&&Object.entries(regions).map(([k,r]:[string,{name:string}])=><button key={k} onClick={()=>setRegionKey(k)} aria-pressed={regionKey===k} style={regionKey===k?{fontWeight:600}:undefined}>{r.name}</button>)}<button onClick={refresh} disabled={loading}><RefreshCw size={14}/>Refresh observations</button></div>
  <section className="environment-metrics" aria-label="Environmental observations">{metrics.map((m,i)=><article key={m.name}><span className="eyebrow">0{i+1} / {m.context}</span><h2>{m.name}</h2><div className="environment-reading">{displayValue(m.value)} <small>{m.unit}</small></div><p>{m.description}</p><span className="environment-availability">{m.value==null?'No observation available':`${provenance} · ${cyclone?'around the storm':region?.name??'Bay of Bengal'} average`}</span></article>)}</section>
  <div className="environment-grid"><section className="environment-map-panel"><div className="panel-heading"><div><span className="eyebrow">REGIONAL CONTEXT</span><h2>The basin in view</h2></div><span className="map-region">{cyclone?'North Indian Ocean':region?.name??'Bay of Bengal'}</span></div><div className="basin-map"><CycloneMap center={cyclone?[cyclone.currentPosition.lat,cyclone.currentPosition.lon]:[15,82]} zoom={4}>{cyclone&&<><ObservedTrack track={cyclone.track}/><CycloneMarker position={[cyclone.currentPosition.lat,cyclone.currentPosition.lon]} windSpeed={cyclone.currentPosition.windSpeed ?? 0} name={cyclone.name}/></>}{!cyclone&&(region?.box??[8,22,80,95])&&(()=>{const b=region?.box??[8,22,80,95];return <Rectangle bounds={[[b[0],b[2]],[b[1],b[3]]]} pathOptions={{color:'#0B7F8E',weight:1.5,dashArray:'6 6',fillOpacity:0.06}}/>})()}</CycloneMap></div><div className="map-legend">Reference basemap and observed track. {cyclone?'Environment values: ':'Dashed box: the area averaged for the cards above. '}{areaLabel}. Source: NOAA GFS.</div></section><aside className="environment-context"><span className="eyebrow">READING THE ENVIRONMENT</span><h2>One observation.<br/>A wider picture.</h2><p>These measurements describe different parts of the same system. Compare them with the observed track and the forecast before drawing conclusions.</p><dl><div><dt>Record type</dt><dd>{provenance}</dd></div><div><dt>Area averaged</dt><dd>{cyclone?'Around the storm centre':region?.label??'Bay of Bengal average (8-22°N, 80-95°E)'}</dd></div><div><dt>Time standard</dt><dd>UTC</dd></div></dl><Link className="brief-action" to="/dashboard/forecast">Compare with the forecast <ArrowUpRight size={16}/></Link><Link className="brief-action" to="/dashboard/system">Inspect data sources <ArrowUpRight size={16}/></Link></aside></div>
  <footer className="basin-footer"><span>Cyclone AI · Environmental observations</span><span>Missing observations are shown as —</span></footer>
 </div>;
};
export default LiveMonitoring;
