import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wind, Gauge, Navigation, MapPin, AlertTriangle, TrendingUp, TrendingDown, 
  Minus, Clock, Radio, Globe, Activity, ArrowRight, Thermometer, 
  Droplets, Zap, BarChart3, Eye
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataSourceTag } from '../components/ui/DataSourceTag';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { PredictedTrack } from '../components/maps/PredictedTrack';
import { UncertaintyCone } from '../components/maps/UncertaintyCone';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import { IntensityChart } from '../components/charts/IntensityChart';
import { PressureChart } from '../components/charts/PressureChart';
import { useCyclone } from '../hooks/useCyclone';
import { usePredictions } from '../hooks/usePredictions';
import { useOperationalData } from '../hooks/useOperationalData';

const Overview: React.FC = () => {
  const { cyclone, loading: cycloneLoading, error: cycloneError } = useCyclone();
  const { prediction, loading: predictionsLoading, error: predictionsError } = usePredictions();
  const { storms, selectedStormId, selectStorm, isLive, lastFetched } = useOperationalData();

  if (cycloneLoading || predictionsLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-12 bg-slate-800/60 rounded-2xl w-2/5 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-800/40 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[550px] bg-slate-800/40 rounded-2xl animate-pulse"></div>
          <div className="space-y-6">
            <div className="h-72 bg-slate-800/40 rounded-2xl animate-pulse"></div>
            <div className="h-72 bg-slate-800/40 rounded-2xl animate-pulse" style={{ animationDelay: '200ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (cycloneError || predictionsError || !cyclone || !prediction) {
    return (
      <div className="p-8">
        <Card className="bg-red-500/10 border-red-500/30 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-400 mb-3">Error Loading Dashboard</h2>
          <p className="text-slate-300 text-lg">Unable to load cyclone or prediction data. Please check connection.</p>
        </Card>
      </div>
    );
  }

  const { currentPosition, name } = cyclone;

  // Forecast cards data from prediction
  const forecastCards = prediction.intensityForecasts?.map(f => ({
    hour: f.forecastHour,
    windSpeed: f.windSpeed,
    pressure: f.pressure,
    trend: f.trend,
    imdGrade: f.imdGrade,
  })).filter(f => [24, 48, 72].includes(f.hour)) || [
    { hour: 24, windSpeed: 100, pressure: 945, trend: 'intensifying' as const, imdGrade: 'ESCS' },
    { hour: 48, windSpeed: 75, pressure: 965, trend: 'weakening' as const, imdGrade: 'VSCS' },
    { hour: 72, windSpeed: 40, pressure: 990, trend: 'weakening' as const, imdGrade: 'CS' },
  ];

  // Environmental data
  const envData = [
    { label: "Sea Surface Temp", value: "29.5°C", status: "Favorable (>26.5°C)", icon: Thermometer, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
    { label: "Central Pressure", value: `${currentPosition.pressure} hPa`, status: "Deepening", icon: Gauge, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { label: "Wind Shear", value: "8 m/s", status: "Low — Favorable", icon: Wind, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
    { label: "Relative Humidity", value: "82%", status: "High moisture", icon: Droplets, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
  ];

  const atRiskDistricts = [
    { name: "Puri", state: "Odisha", risk: "HIGH" as const, eta: "48 hrs", distance: "85 km" },
    { name: "Ganjam", state: "Odisha", risk: "HIGH" as const, eta: "54 hrs", distance: "110 km" },
    { name: "Srikakulam", state: "AP", risk: "MODERATE" as const, eta: "60 hrs", distance: "180 km" },
    { name: "Jagatsinghpur", state: "Odisha", risk: "LOW" as const, eta: "72 hrs", distance: "260 km" },
    { name: "Kendrapara", state: "Odisha", risk: "LOW" as const, eta: "72 hrs", distance: "290 km" },
  ];

  // Chart data
  const observedChartData = cyclone.track.map(p => ({ time: p.timestamp, windSpeed: p.windSpeed, pressure: p.pressure }));
  const predictedChartData = prediction.forecastPoints.map(p => ({ time: p.timestamp, windSpeed: p.predictedWind, pressure: p.predictedPressure }));

  return (
    <div className="space-y-10 max-w-[1800px] mx-auto">
      
      {/* Active Storms Selector */}
      {isLive && storms.length > 1 && (
        <div className="bg-slate-800/30 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-sm animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">Active Cyclones Worldwide ({storms.length})</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {storms.map((storm) => (
              <button
                key={storm.id}
                onClick={() => selectStorm(storm.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  storm.id === selectedStormId
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-700/40 border border-slate-600/40 text-slate-300 hover:bg-slate-700/70'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${
                  storm.alertLevel === 'Red' ? 'bg-red-500' :
                  storm.alertLevel === 'Orange' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                {storm.name}
                <span className="text-xs text-slate-400">({storm.basin})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div 
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-700/30 animate-fade-in-up"
      >
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-slate-500 uppercase mb-3">
            Cyclone Intelligence & Early Warning Platform
          </p>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <Wind className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-50 tracking-tight">
                {name || "UNKNOWN SYSTEM"}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {isLive ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    LIVE — GDACS
                  </span>
                ) : (
                  <DataSourceTag source="DEMO" size="sm" />
                )}
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm text-slate-400">
                  IMD Grade: <span className="font-bold text-amber-400">{currentPosition.imdGrade || 'VSCS'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-800/30 px-4 py-2.5 rounded-xl border border-slate-700/30">
          <Clock className="w-4 h-4" />
          Last Updated: {lastFetched ? new Date(lastFetched).toLocaleString() : new Date(currentPosition.timestamp).toLocaleString()}
        </div>
      </div>

      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { title: "Max Sustained Wind", value: `${currentPosition.windSpeed}`, unit: "kts", icon: <Wind className="w-6 h-6" />, color: "cyan", trend: "up" as const, trendVal: "+12 kts/6h" },
          { title: "Central Pressure", value: `${currentPosition.pressure}`, unit: "hPa", icon: <Gauge className="w-6 h-6" />, color: "amber", trend: "down" as const, trendVal: "-8 hPa/6h" },
          { title: "Forward Speed", value: `${currentPosition.stormSpeed || 15}`, unit: "kts", icon: <Navigation className="w-6 h-6" />, color: "emerald" },
          { title: "Predicted Landfall", value: "48–72h", icon: <MapPin className="w-6 h-6" />, color: "red", subtitle: "Eastern Coast" },
          { title: "Risk Level", value: "HIGH", icon: <AlertTriangle className="w-6 h-6" />, color: "red" },
        ].map((kpi, i) => {
          const colorMap: Record<string, { iconBg: string; border: string; accent: string }> = {
            cyan: { iconBg: "bg-cyan-500/10", border: "border-l-cyan-400", accent: "text-cyan-400" },
            amber: { iconBg: "bg-amber-500/10", border: "border-l-amber-400", accent: "text-amber-400" },
            emerald: { iconBg: "bg-emerald-500/10", border: "border-l-emerald-400", accent: "text-emerald-400" },
            red: { iconBg: "bg-red-500/10", border: "border-l-red-400", accent: "text-red-400" },
          };
          const cm = colorMap[kpi.color] || colorMap.cyan;
          return (
            <div 
              key={i}
              className={`bg-slate-800/40 border border-slate-700/30 border-l-4 ${cm.border} rounded-2xl p-6 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <div className={`p-2.5 rounded-xl ${cm.iconBg}`}>
                  <span className={cm.accent}>{kpi.icon}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-50">{kpi.value}</span>
                {kpi.unit && <span className="text-sm font-medium text-slate-400">{kpi.unit}</span>}
              </div>
              {kpi.subtitle && <p className="text-xs text-slate-500 mt-2">{kpi.subtitle}</p>}
              {kpi.trend && kpi.trendVal && (
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {kpi.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                  {kpi.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className={kpi.trend === 'up' ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
                    {kpi.trendVal}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Forecast Cards Row (24h / 48h / 72h) ─── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Intensity Forecast</h2>
            <p className="text-xs text-slate-500">AI model prediction at key forecast horizons</p>
          </div>
          <Link 
            to="/dashboard/intensity" 
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40"
          >
            Full Analysis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {forecastCards.map((fc, i) => {
            const isIntensifying = fc.trend === 'intensifying';
            const isWeakening = fc.trend === 'weakening';
            return (
              <div
                key={fc.hour}
                className={`relative overflow-hidden rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up ${
                  isIntensifying
                    ? 'bg-gradient-to-br from-red-950/40 via-slate-800/40 to-slate-800/30 border-red-800/40 hover:border-red-600/50'
                    : isWeakening
                    ? 'bg-gradient-to-br from-emerald-950/40 via-slate-800/40 to-slate-800/30 border-emerald-800/40 hover:border-emerald-600/50'
                    : 'bg-gradient-to-br from-amber-950/40 via-slate-800/40 to-slate-800/30 border-amber-800/40 hover:border-amber-600/50'
                }`}
                style={{ animationDelay: `${400 + i * 120}ms` }}
              >
                {/* Subtle glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 ${
                  isIntensifying ? 'bg-red-500' : isWeakening ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-sm font-bold text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                      +{fc.hour}h Forecast
                    </span>
                    {isIntensifying && <TrendingUp className="w-6 h-6 text-red-400" />}
                    {isWeakening && <TrendingDown className="w-6 h-6 text-emerald-400" />}
                    {!isIntensifying && !isWeakening && <Minus className="w-6 h-6 text-amber-400" />}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-5">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Wind Speed</p>
                      <p className="text-3xl font-extrabold text-slate-50">{fc.windSpeed}<span className="text-sm font-normal text-slate-400 ml-1">kts</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Pressure</p>
                      <p className="text-3xl font-extrabold text-slate-50">{fc.pressure}<span className="text-sm font-normal text-slate-400 ml-1">hPa</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                      isIntensifying ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                      isWeakening ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isIntensifying ? <TrendingUp className="w-3 h-3" /> : isWeakening ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {fc.trend === 'intensifying' ? 'Intensifying' : fc.trend === 'weakening' ? 'Weakening' : 'Stable'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-lg">
                      {fc.imdGrade}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Main Grid: Map + Right Column ─── */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left: Map (3 cols) */}
        <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden flex flex-col h-[620px]">
            <div className="px-6 py-4 border-b border-slate-700/30 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-200 flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Live Tracking & 72-Hour Forecast
              </h3>
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-white rounded-full"></span> Observed</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 rounded-full" style={{ borderTop: '1px dashed #f59e0b' }}></span> Predicted</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-cyan-500/20 border border-cyan-500/40 rounded"></span> Uncertainty</span>
              </div>
            </div>
            <div className="flex-1 relative bg-slate-900">
              <CycloneMap>
                <ObservedTrack track={cyclone.track} />
                <PredictedTrack forecastPoints={prediction.forecastPoints} />
                <UncertaintyCone cones={prediction.uncertaintyCones} />
                <CycloneMarker position={[currentPosition.lat, currentPosition.lon]} windSpeed={currentPosition.windSpeed} />
              </CycloneMap>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Environmental Factors */}
          <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <Eye className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-slate-200">Environmental Conditions</h3>
              <Link 
                to="/dashboard/environment" 
                className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {envData.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border ${item.borderColor} ${item.bgColor} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 animate-fade-in-up`}
                  style={{ animationDelay: `${400 + idx * 80}ms` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-50 mb-1">{item.value}</p>
                  <p className={`text-xs font-medium ${item.color}`}>{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* At-Risk Regions */}
          <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-slate-200">At-Risk Coastal Districts</h3>
              <Link 
                to="/dashboard/risk" 
                className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                Risk Map <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {atRiskDistricts.map((dist, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/50 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${550 + idx * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${
                      dist.risk === 'HIGH' ? 'bg-red-500' : dist.risk === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div>
                      <div className="font-semibold text-slate-200">{dist.name}</div>
                      <div className="text-xs text-slate-500">{dist.state} • ETA: {dist.eta} • {dist.distance}</div>
                    </div>
                  </div>
                  <StatusBadge 
                    status={dist.risk === 'HIGH' ? 'high' : dist.risk === 'MODERATE' ? 'moderate' : 'low'} 
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Wind Speed Trend */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">Wind Speed Evolution</h3>
                  <p className="text-xs text-slate-500">Observed vs AI-Predicted (kts)</p>
                </div>
              </div>
              <Link 
                to="/dashboard/intensity" 
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                Expand <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-[320px]">
              <IntensityChart 
                observedData={observedChartData} 
                predictedData={predictedChartData}
                height={320}
              />
            </div>
          </div>
        </div>

        {/* Pressure Trend */}
        <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Gauge className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">Central Pressure Trend</h3>
                  <p className="text-xs text-slate-500">Observed vs Predicted (hPa)</p>
                </div>
              </div>
            </div>
            <div className="h-[320px]">
              <PressureChart 
                observedData={observedChartData} 
                predictedData={predictedChartData}
                height={320}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Navigation Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        {[
          { to: "/dashboard/track", icon: MapPin, label: "Track Prediction", desc: "72h forecast path", color: "cyan" },
          { to: "/dashboard/satellite", icon: Zap, label: "Satellite View", desc: "NASA GIBS imagery", color: "purple" },
          { to: "/dashboard/historical", icon: Activity, label: "Historical Data", desc: "40+ years IBTrACS", color: "blue" },
          { to: "/dashboard/models", icon: BarChart3, label: "Model Metrics", desc: "Performance & SHAP", color: "emerald" },
        ].map((nav, i) => {
          const colors: Record<string, string> = {
            cyan: "group-hover:border-cyan-500/50 group-hover:bg-cyan-500/5",
            purple: "group-hover:border-purple-500/50 group-hover:bg-purple-500/5",
            blue: "group-hover:border-blue-500/50 group-hover:bg-blue-500/5",
            emerald: "group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5",
          };
          const iconColors: Record<string, string> = {
            cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
            purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
            blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          };
          return (
            <Link
              key={i}
              to={nav.to}
              className={`group flex items-center gap-4 p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colors[nav.color]}`}
            >
              <div className={`p-2.5 rounded-xl border ${iconColors[nav.color]}`}>
                <nav.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{nav.label}</p>
                <p className="text-xs text-slate-500">{nav.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-300 transition-colors" />
            </Link>
          );
        })}
      </div>

    </div>
  );
};

export default Overview;
