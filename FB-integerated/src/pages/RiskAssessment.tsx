import { useState } from 'react';
import { MapPin, Info, ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, Activity, Compass, Clock, CheckCircle2 } from 'lucide-react';
import { CycloneMap } from '../components/maps/CycloneMap';
import { PredictedTrack } from '../components/maps/PredictedTrack';
import { UncertaintyCone } from '../components/maps/UncertaintyCone';
import { DistrictBoundaries } from '../components/maps/DistrictBoundaries';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import { MapLegend } from '../components/maps/MapLegend';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { usePredictions } from '../hooks/usePredictions';
import { mockRiskDistricts } from '../data/mockRisk';
import { DataSourceTag } from '../components/ui/DataSourceTag';
import type { DistrictRisk } from '../types/risk';

export default function RiskAssessment() {
  const { prediction } = usePredictions();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictRisk | null>(mockRiskDistricts[0] || null);
  const [methodologyExpanded, setMethodologyExpanded] = useState(false);

  // Group districts by risk
  const highRisk = mockRiskDistricts.filter(d => d.riskLevel === 'HIGH');
  const modRisk = mockRiskDistricts.filter(d => d.riskLevel === 'MODERATE');
  const lowRisk = mockRiskDistricts.filter(d => d.riskLevel === 'LOW');
  
  const sortedDistricts = [...highRisk, ...modRisk, ...lowRisk];

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'HIGH': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'MODERATE': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getRiskBorder = (level: string) => {
    switch(level) {
      case 'HIGH': return 'border-l-red-500';
      case 'MODERATE': return 'border-l-amber-500';
      case 'LOW': return 'border-l-emerald-500';
      default: return 'border-l-slate-500';
    }
  };

  const chartData = [
    { level: 'HIGH', count: highRisk.length },
    { level: 'MODERATE', count: modRisk.length },
    { level: 'LOW', count: lowRisk.length },
  ];

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto text-slate-100 pb-8">
      {/* Header Area */}
      <div 
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-700/30 animate-fade-in-up"
        style={{ animationDelay: '0ms' }}
      >
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-slate-500 uppercase mb-3">
            Vulnerability & Impact Modeling
          </p>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-50 tracking-tight">
                Risk Assessment
              </h1>
              <p className="text-slate-400 mt-1 text-base lg:text-lg">
                GIS-based district-level spatial risk and exposure analysis
              </p>
            </div>
          </div>
        </div>
        <DataSourceTag source="DEMO" size="md" />
      </div>

      {/* Concept Formula Banner */}
      <div 
        className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40 backdrop-blur-sm shadow-lg flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm font-semibold text-slate-300 animate-fade-in-up hover:border-slate-600/50 hover:shadow-xl transition-all duration-300"
        style={{ animationDelay: '100ms' }}
      >
        <div className="bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-700/80 shadow-inner flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          PREDICTED TRACK
        </div>
        <div className="text-cyan-400 font-bold text-xl">+</div>
        <div className="bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-700/80 shadow-inner flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
          FORECAST UNCERTAINTY
        </div>
        <div className="text-cyan-400 font-bold text-xl">+</div>
        <div className="bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-700/80 shadow-inner flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          DISTRICT BOUNDARIES
        </div>
        <div className="text-amber-400 font-bold text-xl">=</div>
        <div className="bg-amber-500/15 text-amber-300 px-6 py-3 rounded-xl border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-2.5 font-bold tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          POTENTIALLY AT-RISK DISTRICTS
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Map Area (~60% / 7 cols) */}
        <div 
          className="lg:col-span-7 flex flex-col min-h-[600px] h-[720px] bg-slate-900/90 rounded-2xl border border-slate-700/50 overflow-hidden relative shadow-xl animate-fade-in-up hover:shadow-2xl transition-all duration-300"
          style={{ animationDelay: '200ms' }}
        >
          <div className="px-6 py-4 border-b border-slate-700/40 bg-slate-800/60 backdrop-blur-sm flex justify-between items-center z-10">
            <h3 className="font-bold text-slate-200 flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-cyan-400" />
              Interactive Risk Boundary Map
            </h3>
            <span className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50">
              Click a district to inspect impact details
            </span>
          </div>
          
          <div className="flex-1 relative w-full h-full">
            <CycloneMap center={[16.0, 85.0]} zoom={6}>
              {prediction && prediction.forecastPoints && (
                <>
                  <PredictedTrack 
                    forecastPoints={prediction.forecastPoints}
                  />
                  <UncertaintyCone 
                    cones={prediction.uncertaintyCones || []} 
                  />
                  <CycloneMarker 
                    position={[
                      prediction.forecastPoints[0].lat, 
                      prediction.forecastPoints[0].lon
                    ]} 
                    windSpeed={prediction.forecastPoints[0].predictedWind}
                  />
                </>
              )}
              <DistrictBoundaries 
                districts={mockRiskDistricts}
                onDistrictClick={(dist) => setSelectedDistrict(dist)}
              />
              <MapLegend type="risk" />
            </CycloneMap>
          </div>
        </div>

        {/* Right Panel (~40% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Summary Card */}
          <div 
            className="bg-slate-800/40 rounded-2xl border border-slate-700/40 p-6 lg:p-7 shadow-lg backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <div className="p-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                Overall Risk Summary
              </h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50">
                {mockRiskDistricts.length} Assessed Districts
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-40 shrink-0 flex items-center justify-center">
                <RiskDistributionChart data={chartData} height={160} />
              </div>
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-center bg-slate-900/70 p-3 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-colors">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    HIGH RISK
                  </span>
                  <span className="font-extrabold text-white text-base bg-red-500/15 text-red-400 px-3 py-0.5 rounded-lg border border-red-500/30">
                    {highRisk.length} districts
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/70 p-3 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                    MODERATE RISK
                  </span>
                  <span className="font-extrabold text-white text-base bg-amber-500/15 text-amber-400 px-3 py-0.5 rounded-lg border border-amber-500/30">
                    {modRisk.length} districts
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/70 p-3 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    LOW RISK
                  </span>
                  <span className="font-extrabold text-white text-base bg-emerald-500/15 text-emerald-400 px-3 py-0.5 rounded-lg border border-emerald-500/30">
                    {lowRisk.length} districts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected District Detail */}
          {selectedDistrict && (
            <div 
              className={`rounded-2xl border-2 p-6 lg:p-7 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 animate-fade-in-up ${
                selectedDistrict.riskLevel === 'HIGH'
                  ? 'border-red-500/40 bg-gradient-to-br from-red-950/30 via-slate-800/40 to-slate-900/50 shadow-[0_0_25px_rgba(239,68,68,0.1)] hover:border-red-500/60'
                  : selectedDistrict.riskLevel === 'MODERATE'
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-800/40 to-slate-900/50 shadow-[0_0_25px_rgba(245,158,11,0.1)] hover:border-amber-500/60'
                  : 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-800/40 to-slate-900/50 shadow-[0_0_25px_rgba(34,197,94,0.1)] hover:border-emerald-500/60'
              }`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Selected District Analysis
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white">{selectedDistrict.district.name}</h2>
                  <p className="text-slate-400 font-medium">{selectedDistrict.district.state}, India</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border shadow-sm ${getRiskColor(selectedDistrict.riskLevel)}`}>
                  {selectedDistrict.riskLevel} RISK
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Distance from Track</p>
                  <p className="text-2xl font-extrabold text-white">{selectedDistrict.distanceFromTrack} <span className="text-sm font-normal text-slate-400">km</span></p>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Forecast Window</p>
                  <p className="text-lg font-bold text-white mt-0.5">{selectedDistrict.forecastWindow}</p>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 col-span-2">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Intersect Uncertainty Cone?</p>
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    {selectedDistrict.intersectsUncertaintyCone ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 font-bold">Yes — Directly in potential path</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-300">No — Outside primary cone</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60 text-sm">
                <span className="text-slate-400 font-semibold block mb-1">Impact Analysis:</span>
                <span className="text-slate-200 leading-relaxed">{selectedDistrict.reason}</span>
              </div>
            </div>
          )}

          {/* District List */}
          <div 
            className="bg-slate-800/40 rounded-2xl border border-slate-700/40 flex flex-col shadow-lg backdrop-blur-sm overflow-hidden animate-fade-in-up hover:shadow-xl transition-all duration-300"
            style={{ animationDelay: '500ms' }}
          >
            <div className="p-5 border-b border-slate-700/40 bg-slate-800/70 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                At-Risk Districts List
              </h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/50">
                {sortedDistricts.length} districts
              </span>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[360px] custom-scrollbar">
              {sortedDistricts.map(dist => {
                const isSelected = selectedDistrict?.district.id === dist.district.id;
                return (
                  <div 
                    key={dist.district.id} 
                    onClick={() => setSelectedDistrict(dist)}
                    className={`p-4 rounded-xl border-l-4 border-t border-r border-b cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${getRiskBorder(dist.riskLevel)} ${
                      isSelected 
                        ? 'bg-slate-700/60 border-t-cyan-500/40 border-r-cyan-500/40 border-b-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'bg-slate-900/70 border-t-slate-800 border-r-slate-800 border-b-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white text-sm lg:text-base">
                        {dist.district.name}, <span className="text-xs font-normal text-slate-400">{dist.district.state}</span>
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskColor(dist.riskLevel)}`}>
                        {dist.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        {dist.distanceFromTrack} km away
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {dist.forecastWindow}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Methodology Accordion */}
          <div 
            className="bg-slate-800/40 rounded-2xl border border-slate-700/40 overflow-hidden shadow-lg backdrop-blur-sm animate-fade-in-up hover:border-slate-600/50 transition-all duration-300"
            style={{ animationDelay: '600ms' }}
          >
            <button 
              className="w-full p-5 flex justify-between items-center hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
              onClick={() => setMethodologyExpanded(!methodologyExpanded)}
            >
              <div className="flex items-center gap-3 font-bold text-slate-200">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Info className="w-4 h-4 text-cyan-400" />
                </div>
                Risk Classification Methodology
              </div>
              {methodologyExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {methodologyExpanded && (
              <div className="p-6 pt-2 text-sm text-slate-300 space-y-4 bg-slate-800/20 border-t border-slate-700/30">
                <p className="leading-relaxed">
                  The risk classification is algorithmically determined based on the intersection of district spatial boundaries with the forecast track and its spatial uncertainty cone.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-red-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <div>
                      <strong className="text-red-400 font-bold">HIGH RISK:</strong>
                      <span className="text-slate-300 ml-1.5">District boundary directly intersects the forecast uncertainty cone within the 24-hour forecast window. Direct landfall or hurricane-force winds imminent.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-amber-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                    <div>
                      <strong className="text-amber-400 font-bold">MODERATE RISK:</strong>
                      <span className="text-slate-300 ml-1.5">Within 100km of predicted track OR intersects the 48–72h uncertainty cone. Significant gale winds and localized heavy precipitation expected.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    <div>
                      <strong className="text-emerald-400 font-bold">LOW RISK:</strong>
                      <span className="text-slate-300 ml-1.5">Within 200km of predicted track. Peripheral squally weather and sea condition advisories in effect.</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

