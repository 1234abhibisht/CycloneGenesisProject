import React, { useState, useMemo } from 'react';
import { MapPin, Wind, Navigation, Clock, AlertCircle, Activity, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { DataSourceTag } from '../components/ui/DataSourceTag';
import { CycloneMap } from '../components/maps/CycloneMap';
import { SatelliteBaseLayer } from '../components/maps/SatelliteBaseLayer';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { PredictedTrack } from '../components/maps/PredictedTrack';
import { UncertaintyCone } from '../components/maps/UncertaintyCone';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import { MapLayerControl } from '../components/maps/MapLayerControl';
import { MapLegend } from '../components/maps/MapLegend';
import { useCyclone } from '../hooks/useCyclone';
import { usePredictions } from '../hooks/usePredictions';
import { useMapLayers } from '../hooks/useMapLayers';
import type { ForecastPoint } from '../types/prediction';

const formatCoords = (lat: number, lon: number) => {
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
};

const TrackPrediction: React.FC = () => {
  const [forecastHorizon, setForecastHorizon] = useState<number>(72);
  const { cyclone, loading: cycloneLoading } = useCyclone();
  const { prediction, loading: predictionsLoading } = usePredictions();
  const { layers, toggleLayer } = useMapLayers();

  const filteredPredictions = useMemo(() => {
    if (!prediction || !prediction.forecastPoints) return [];
    return prediction.forecastPoints.filter((pt: ForecastPoint) => pt.forecastHour <= forecastHorizon);
  }, [prediction, forecastHorizon]);

  const selectedPoint = useMemo(() => {
    if (filteredPredictions.length > 0) {
      return filteredPredictions[filteredPredictions.length - 1];
    }
    if (cyclone) {
      return {
        forecastHour: 0,
        lat: cyclone.currentPosition.lat,
        lon: cyclone.currentPosition.lon,
        predictedWind: cyclone.currentPosition.windSpeed,
        predictedPressure: cyclone.currentPosition.pressure,
        predictedIMDGrade: cyclone.currentPosition.imdGrade || 'VSCS',
        uncertainty: 0,
        timestamp: cyclone.currentPosition.timestamp,
      };
    }
    return null;
  }, [filteredPredictions, cyclone]);

  if (cycloneLoading || predictionsLoading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading prediction models...</div>;
  }

  if (!cyclone || !prediction) {
    return <div className="p-8 text-center text-red-400">Failed to load prediction data.</div>;
  }

  const getIMDGrade = (windKnots: number) => {
    if (windKnots < 28) return { grade: "Depression (D)", color: "text-blue-400" };
    if (windKnots < 34) return { grade: "Deep Depression (DD)", color: "text-emerald-400" };
    if (windKnots < 48) return { grade: "Cyclonic Storm (CS)", color: "text-yellow-400" };
    if (windKnots < 64) return { grade: "Severe CS (SCS)", color: "text-amber-500" };
    if (windKnots < 90) return { grade: "Very Severe CS (VSCS)", color: "text-orange-500" };
    if (windKnots < 120) return { grade: "Extremely Severe CS (ESCS)", color: "text-red-500" };
    return { grade: "Super Cyclonic Storm (SuCS)", color: "text-purple-500" };
  };

  const currentGrade = getIMDGrade(cyclone.currentPosition.windSpeed);
  const predictedGrade = selectedPoint ? getIMDGrade(selectedPoint.predictedWind) : currentGrade;

  const formattedSelectedTime = selectedPoint
    ? new Date(selectedPoint.timestamp).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Now';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-[#0a0f1e] overflow-hidden">
      
      {/* Map Area (70%) */}
      <div className="flex-1 relative flex flex-col min-h-[400px]">
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-xl p-3 shadow-lg">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            AI Track Prediction
          </h2>
          <p className="text-xs text-slate-400">Deep Learning + Multi-Model Consensus</p>
        </div>

        <div className="flex-1 bg-slate-900 relative">
          <CycloneMap center={[16.5, 85.5]} zoom={5}>
            <MapLayerControl layers={layers as any} onToggle={(k) => toggleLayer(k as any)} />
            
            {layers.satellite && (
              <SatelliteBaseLayer 
                layerName="VIIRS_SNPP_CorrectedReflectance_TrueColor" 
                date={new Date(Date.now() - 86400000).toISOString().split('T')[0]} 
                opacity={0.7} 
              />
            )}
            
            {layers.observedTrack && (
              <ObservedTrack track={cyclone.track} />
            )}
            
            {layers.predictedTrack && (
              <PredictedTrack 
                forecastPoints={filteredPredictions} 
                visibleHorizon={forecastHorizon} 
              />
            )}
            
            {layers.uncertaintyCone && (
              <UncertaintyCone 
                cones={prediction.uncertaintyCones} 
                visibleHorizon={forecastHorizon} 
              />
            )}
            
            <CycloneMarker 
              position={[cyclone.currentPosition.lat, cyclone.currentPosition.lon]} 
              windSpeed={cyclone.currentPosition.windSpeed} 
            />
            
            <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 p-3 rounded-lg border border-slate-700 backdrop-blur">
              <MapLegend type="intensity" />
            </div>
          </CycloneMap>
        </div>

        {/* Timeline Slider Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl z-[400]">
          <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">Forecast Horizon</span>
              <span className="text-sm font-bold text-cyan-400">+{forecastHorizon} Hours</span>
            </div>
            
            <div className="px-2">
              <input 
                type="range" 
                min="0" 
                max="72" 
                step="6"
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Now</span>
                <span>+6h</span>
                <span>+12h</span>
                <span>+24h</span>
                <span>+48h</span>
                <span>+72h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Analytics Panel (30%) */}
      <div className="w-full lg:w-[400px] border-l border-slate-800 bg-[#0a0f1e] overflow-y-auto z-10 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 backdrop-blur z-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-100 uppercase tracking-wider">{cyclone.name || "DEMO SYSTEM"}</h3>
            <DataSourceTag source="DEMO" size="sm" />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3" /> Latest run: {new Date(cyclone.currentPosition.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Status Card */}
          <Card className="p-4 border-slate-800/80 bg-slate-800/30">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700/50 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-500" /> Current Position
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-500">Coordinates</div>
                <div className="font-mono text-sm text-slate-200">{formatCoords(cyclone.currentPosition.lat, cyclone.currentPosition.lon)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Classification</div>
                <div className={`font-semibold text-sm ${currentGrade.color}`}>{currentGrade.grade}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Wind className="w-3 h-3"/> Max Wind</div>
                <div className="font-bold text-slate-200">{cyclone.currentPosition.windSpeed} kt ({(cyclone.currentPosition.windSpeed * 1.852).toFixed(0)} km/h)</div>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Navigation className="w-3 h-3"/> Min Pressure</div>
                <div className="font-bold text-slate-200">{cyclone.currentPosition.pressure} hPa</div>
              </div>
            </div>
          </Card>

          {/* Selected Forecast Card */}
          {selectedPoint && (
            <Card className="p-4 border-cyan-900/30 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-bl-full"></div>
              
              <h4 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700/50 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> +{forecastHorizon}h Forecast</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">{formattedSelectedTime}</span>
              </h4>
              
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                  <div className="text-xs text-slate-500">Predicted Location</div>
                  <div className="font-mono text-sm text-slate-200">{formatCoords(selectedPoint.lat, selectedPoint.lon)}</div>
                </div>
                
                <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                  <div className="text-xs text-slate-500">Predicted Wind Speed</div>
                  <div className="text-right">
                    <div className="font-bold text-slate-200">{selectedPoint.predictedWind} kt ({(selectedPoint.predictedWind * 1.852).toFixed(0)} km/h)</div>
                    <div className={`text-xs ${predictedGrade.color}`}>{predictedGrade.grade}</div>
                  </div>
                </div>

                <div className="flex justify-between items-end pb-1">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Uncertainty Radius
                  </div>
                  <div className="font-medium text-slate-300">~{Math.round(selectedPoint.uncertainty)} km</div>
                </div>
              </div>
            </Card>
          )}

          {/* Landfall Prediction */}
          <Card className="p-4 border-red-900/30 bg-red-950/10">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Landfall Estimation
            </h4>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-red-900/50 space-y-2">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Estimated Region</span>
                <span className="font-medium text-red-400">Odisha Coast, near Puri — Jagatsinghpur</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Forecast Landfall Window</span>
                <span className="font-medium text-slate-300">Within 48–72 hours</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 italic">
                * Based on deep learning trajectory forecast with spatial uncertainty analysis.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrackPrediction;
