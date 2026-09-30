import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, Popup, Polyline } from 'react-leaflet';
import { useCyclone } from '../hooks/useCyclone';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { useResearchResource, formatValue, utc, type ResearchForecast } from '../services/research';
export default function DataForecast() {
  const { cyclone } = useCyclone();
  const { data, error } = useResearchResource<ResearchForecast>('/cyclone/ACTIVE/predictions');
  const [showTruth, setShowTruth] = useState(false);
  const result = data?.data; const point = result?.forecastPoints[0];
  const position = cyclone?.currentPosition;
  const aligned = data && cyclone && data.stormId === cyclone.id && result?.issuedAt === position?.timestamp;
  return <div className="research-page"><div className="research-intro"><span className="eyebrow">SAVED MODEL · REAL INFERENCE</span><h2>The next 24 hours, in the research record</h2><p>The model uses the selected observation and its archived ERA5 features. Only the +24h endpoint is predicted; connecting lines are visual guides.</p><div className="research-links"><Link to="/dashboard/explore">Explore the GFS weather map →</Link><Link to="/dashboard/response?tab=warnings">Create an area warning exercise →</Link><Link to="/dashboard/response">Plan for a location →</Link></div></div>{error && <div className="research-notice" role="status">{error}</div>}{!error && !aligned && <p role="status">Loading the selected observation and matching forecast…</p>}
  {aligned && result && point && position && <><div className="research-metrics"><article><span>Predicted sustained wind</span><strong>{formatValue(point.predictedWind)} <small>knots</small></strong><p>Valid {utc(point.timestamp)}</p></article><article><span>Predicted position</span><strong>{formatValue(point.lat, 2)}°N / {formatValue(point.lon, 2)}°E</strong><p>Issued {utc(result.issuedAt)}</p></article><article><span>Model</span><strong>XGBoost</strong><p>Median imputation → missing indicators → scaling → inference</p></article></div>
  <section className="research-panel"><div className="research-row"><h3>Observed track & predicted endpoint</h3><label><input type="checkbox" checked={showTruth} onChange={e => setShowTruth(e.target.checked)} /> Show actual +24h outcome</label></div><div className="research-map"><CycloneMap center={[position.lat, position.lon]} zoom={5}><ObservedTrack track={cyclone.track} showMarkers={false}/><Polyline positions={[[position.lat, position.lon], [point.lat, point.lon]]} pathOptions={{ color: '#be7c2d', dashArray: '5 8' }}/><CircleMarker center={[point.lat, point.lon]} radius={9} pathOptions={{ color: '#be7c2d', fillOpacity: 1 }}><Popup>XGBoost +24h endpoint · {formatValue(point.predictedWind)} kt</Popup></CircleMarker>{showTruth && <CircleMarker center={[result.verification.lat, result.verification.lon]} radius={8} pathOptions={{ color: '#267b67', fillOpacity: .7 }}><Popup>Actual +24h observation · {result.verification.wind} kt</Popup></CircleMarker>}</CycloneMap></div><p className="research-caption">Blue: observed track to issue time · amber: predicted endpoint{showTruth ? ' · green: held-out actual outcome' : ''}. No calibrated uncertainty cone is available.</p></section>
  {showTruth && <section className="research-panel"><h3>Compare with the held-out observation</h3><p>Actual wind: <strong>{result.verification.wind} kt</strong> · Prediction error: <strong>{formatValue(Math.abs(result.verification.wind - point.predictedWind))} kt</strong>. The actual outcome is used only for comparison, never as a model input.</p></section>}
  <div className="research-notice"><strong>Model scope</strong>{result.limitations.map(note => <p key={note}>{note}</p>)}</div></>}
  </div>;
}
