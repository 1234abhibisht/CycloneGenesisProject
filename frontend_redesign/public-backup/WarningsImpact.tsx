import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, MapPin, FileText, 
  Search, ArrowUpDown, HelpCircle
} from 'lucide-react';
import { fetchCoastalDistrictRoster, fetchDistrictRiskAnalysis } from '../services/riskService';
import { useCyclone } from '../hooks/useCyclone';
import type { GISRiskAnalysisResult, DetailedDistrictRisk } from '../types/risk';
import { coastalDistricts } from '../data/mockDistricts';

const STANDBY_RISK_DATA: GISRiskAnalysisResult = {
  status: 200,
  stormId: 'STANDBY',
  stormName: 'No active cyclone',
  generatedAt: new Date().toISOString(),
  summary: {
    totalDistrictsEvaluated: coastalDistricts.length,
    redAlertCount: 0,
    orangeAlertCount: 0,
    yellowAlertCount: 0,
  },
  landfall: {
    isLandfallPredicted: false,
    message: 'No landfall risk is currently indicated.',
  },
  bulletin: {
    bulletinId: 'STANDBY-MONITORING',
    issuedAt: new Date().toISOString(),
    cycloneName: 'No active cyclone',
    headline: 'Coastal district monitoring is active.',
    bulletinText: 'No live district risk analysis was available. This is the operational standby district roster, not an official warning.',
    actionDirectives: ['Continue routine coastal monitoring.', 'Refer to IMD for official advisories.'],
  },
  districts: coastalDistricts.map((district): DetailedDistrictRisk => ({
    districtId: district.id,
    districtName: district.name,
    state: district.state,
    centroid: district.centroid,
    distanceKm: 0,
    closestHour: 0,
    forecastWindow: 'Routine monitoring',
    bufferZone: 'MONITORING_OUTER',
    riskScore: 0,
    warningLevel: 'GREEN',
    statusText: 'No active warning',
    actionCode: 'MONITOR',
    estimatedWindKts: 0,
    expectedSurgeM: 0,
    populationAtRisk: 0,
    vulnerabilityIndex: 0,
  })),
};

function standbyRiskDataFor(districts: typeof coastalDistricts): GISRiskAnalysisResult {
  return {
    ...STANDBY_RISK_DATA,
    generatedAt: new Date().toISOString(),
    summary: { ...STANDBY_RISK_DATA.summary, totalDistrictsEvaluated: districts.length },
    districts: districts.map((district): DetailedDistrictRisk => ({
      districtId: district.id, districtName: district.name, state: district.state, centroid: district.centroid,
      distanceKm: 0, closestHour: 0, forecastWindow: 'Routine monitoring', bufferZone: 'MONITORING_OUTER',
      riskScore: 0, warningLevel: 'GREEN', statusText: 'No active warning', actionCode: 'MONITOR',
      estimatedWindKts: 0, expectedSurgeM: 0, populationAtRisk: 0, vulnerabilityIndex: 0,
    })),
  };
}

export const WarningsImpact: React.FC = () => {
  const { cyclone } = useCyclone();
  const [riskData, setRiskData] = useState<GISRiskAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'riskScore' | 'distanceKm' | 'estimatedWindKts'>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function loadRisk() {
      setLoading(true);
      // Always show the complete coastline immediately. The live risk model
      // calls external feeds and may take longer than an operator should wait.
      const roster = await fetchCoastalDistrictRoster();
      if (!active) return;
      setRiskData(standbyRiskDataFor(roster ?? coastalDistricts));
      setLoading(false);

      const data = await fetchDistrictRiskAnalysis(cyclone?.id || 'ACTIVE');
      if (active && data) {
        setRiskData(data);
      }
    }
    loadRisk();
    return () => { active = false; };
  }, [cyclone?.id]);

  const rawDistricts: DetailedDistrictRisk[] = riskData?.districts || [];
  
  // Filter & Search
  const filteredDistricts = rawDistricts
    .filter((d: DetailedDistrictRisk) => {
      if (selectedFilter !== 'ALL' && d.warningLevel !== selectedFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return d.districtName.toLowerCase().includes(query) || d.state.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#0D1B2A] rounded-xl border border-[#1E3A5F]"></div>
          ))}
        </div>
      </div>
    );
  }

  const redCount = riskData?.summary?.redAlertCount ?? 0;
  const hasRisk = redCount > 0 || (riskData?.summary?.orangeAlertCount ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#E6EDF5]">
      {/* 1. TOP ALERT BANNER (Section 12: SYSTEM RISK ASSESSMENT) */}
      {hasRisk && (
        <div className="p-5 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-500/15 via-[#0D1B2A] to-[#0D1B2A] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40">
                  SYSTEM RISK ASSESSMENT
                </span>
                <span className="text-xs text-[#94A3B8]">High Impact Conditions Possible</span>
              </div>
              <h2 className="text-lg font-bold text-[#E6EDF5] mt-1">
                {riskData?.landfall?.isLandfallPredicted 
                  ? `Landfall Intercept: ${riskData.landfall.targetDistrict} (${riskData.landfall.targetState})`
                  : 'Coastal Squall & Heavy Precipitation Warning'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="bg-[#07111F] px-3 py-2 rounded border border-[#1E3A5F]/80">
              <span className="text-[#94A3B8] block text-[10px]">FORECAST WINDOW</span>
              <strong className="text-amber-400">18–24 Hours (±3h)</strong>
            </div>
            <div className="bg-[#07111F] px-3 py-2 rounded border border-[#1E3A5F]/80">
              <span className="text-[#94A3B8] block text-[10px]">AFFECTED DISTRICTS</span>
              <strong className="text-red-400">{filteredDistricts.filter(d => ['RED', 'ORANGE'].includes(d.warningLevel)).length} Coastal Sectors</strong>
            </div>
            <div className="bg-[#07111F] px-3 py-2 rounded border border-[#1E3A5F]/80">
              <span className="text-[#94A3B8] block text-[10px]">LAST VERIFIED</span>
              <strong className="text-slate-300">{new Date().toLocaleTimeString()}</strong>
            </div>
          </div>
        </div>
      )}

      {riskData?.stormId === 'STANDBY' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Operational standby: showing {rawDistricts.length} monitored coastal districts. No official live warning is active.
        </div>
      )}

      {/* 2. WARNING TIERS KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedFilter('RED')}
          className={`bg-[#0D1B2A] border p-4 rounded-xl cursor-pointer transition-all ${
            selectedFilter === 'RED' ? 'border-red-500 bg-red-500/10 shadow-md shadow-red-500/10' : 'border-[#1E3A5F]/60 hover:border-red-500/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-mono text-red-400 mb-1">
            <span className="font-bold">RED WARNING</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#E6EDF5]">
            {riskData?.summary?.redAlertCount ?? 0} <span className="text-xs text-[#94A3B8]">DISTRICTS</span>
          </div>
          <span className="text-[11px] text-red-400/80 font-medium">Evacuation Preparedness Active</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('ORANGE')}
          className={`bg-[#0D1B2A] border p-4 rounded-xl cursor-pointer transition-all ${
            selectedFilter === 'ORANGE' ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10' : 'border-[#1E3A5F]/60 hover:border-amber-500/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-mono text-amber-400 mb-1">
            <span className="font-bold">ORANGE ALERT</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#E6EDF5]">
            {riskData?.summary?.orangeAlertCount ?? 0} <span className="text-xs text-[#94A3B8]">DISTRICTS</span>
          </div>
          <span className="text-[11px] text-amber-400/80 font-medium">Pre-positioning Relief Assets</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('YELLOW')}
          className={`bg-[#0D1B2A] border p-4 rounded-xl cursor-pointer transition-all ${
            selectedFilter === 'YELLOW' ? 'border-yellow-500 bg-yellow-500/10 shadow-md shadow-yellow-500/10' : 'border-[#1E3A5F]/60 hover:border-yellow-500/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-mono text-yellow-400 mb-1">
            <span className="font-bold">YELLOW WATCH</span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#E6EDF5]">
            {riskData?.summary?.yellowAlertCount ?? 0} <span className="text-xs text-[#94A3B8]">DISTRICTS</span>
          </div>
          <span className="text-[11px] text-yellow-400/80 font-medium">Fishermen Advisories Transmitted</span>
        </div>

        <div 
          onClick={() => setSelectedFilter('ALL')}
          className={`bg-[#0D1B2A] border p-4 rounded-xl cursor-pointer transition-all ${
            selectedFilter === 'ALL' ? 'border-[#38BDF8] bg-sky-500/10 shadow-md shadow-sky-500/10' : 'border-[#1E3A5F]/60 hover:border-[#38BDF8]/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-mono text-[#38BDF8] mb-1">
            <span className="font-bold">TOTAL ASSESSED</span>
            <MapPin className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#E6EDF5]">
            {riskData?.summary?.totalDistrictsEvaluated ?? 24} <span className="text-xs text-[#94A3B8]">DISTRICTS</span>
          </div>
          <span className="text-[11px] text-sky-400/80 font-medium">Multi-State Coastal Coverage</span>
        </div>
      </div>

      {/* 3. MAIN SECTION: DISTRICT RISK TABLE + WHY THIS WARNING? EXPLAINABILITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* District Risk Table (Section 12: Search, Sort, Severity Filter) */}
        <div className="lg:col-span-8 bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1E3A5F]/60">
              <div>
                <h3 className="text-xs font-bold text-[#E6EDF5] uppercase tracking-wide">
                  Coastal District Impact Matrix
                </h3>
                <p className="text-[11px] text-[#94A3B8]">
                  Automated GIS proximity, wind radius, surge vulnerability, and civil risk scoring
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search district or state..." 
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#07111F] border border-[#1E3A5F] text-xs text-[#E6EDF5] placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#102235] text-[#94A3B8] border-b border-[#1E3A5F]/80">
                  <tr>
                    <th className="p-3 font-semibold">DISTRICT</th>
                    <th className="p-3 font-semibold">STATE</th>
                    <th 
                      className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF5]"
                      onClick={() => { setSortField('distanceKm'); setSortAsc(!sortAsc); }}
                    >
                      <span className="flex items-center gap-1">PROXIMITY <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th 
                      className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF5]"
                      onClick={() => { setSortField('estimatedWindKts'); setSortAsc(!sortAsc); }}
                    >
                      <span className="flex items-center gap-1">EST. WIND <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 font-semibold">SURGE</th>
                    <th 
                      className="p-3 font-semibold cursor-pointer hover:text-[#E6EDF5]"
                      onClick={() => { setSortField('riskScore'); setSortAsc(!sortAsc); }}
                    >
                      <span className="flex items-center gap-1">RISK SCORE <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="p-3 font-semibold">WARNING TIER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/30">
                  {filteredDistricts.map((d) => (
                    <tr key={d.districtId} className="hover:bg-[#102235]/60 transition-colors">
                      <td className="p-3 font-semibold text-[#E6EDF5] font-sans">{d.districtName}</td>
                      <td className="p-3 text-[#94A3B8]">{d.state}</td>
                      <td className="p-3 text-slate-300">{d.distanceKm} km</td>
                      <td className="p-3 text-slate-300">{d.estimatedWindKts} kts</td>
                      <td className="p-3 text-sky-400">{d.expectedSurgeM > 0 ? `${d.expectedSurgeM} m` : 'Negligible'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#07111F] rounded overflow-hidden border border-[#1E3A5F]">
                            <div 
                              className={`h-full ${d.riskScore >= 70 ? 'bg-red-500' : d.riskScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, d.riskScore)}%` }}
                            />
                          </div>
                          <span className="text-[#E6EDF5] font-bold">{d.riskScore}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.warningLevel === 'RED' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          d.warningLevel === 'ORANGE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          d.warningLevel === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {d.warningLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3A5F]/40 flex justify-between text-[11px] text-[#94A3B8]">
            <span>Algorithm: Multi-Criteria GIS Proximity Matrix</span>
            <span className="text-[#38BDF8]">Showing {filteredDistricts.length} Districts</span>
          </div>
        </div>

        {/* 4. WHY THIS WARNING? EXPLAINABILITY PANEL (Section 12 & 13) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-lg flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E3A5F]/60">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#38BDF8]" />
                  <h3 className="text-xs font-bold text-[#E6EDF5] uppercase tracking-wide">
                    Why This Warning? (Explainable AI)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#38BDF8]">Weight Analysis</span>
              </div>

              <p className="text-xs text-[#94A3B8] mb-4">
                Decomposition of risk score weights driving automated district warning alerts:
              </p>

              <div className="space-y-3">
                {/* Landing / Impact Probability */}
                <div className="p-2.5 rounded bg-[#07111F] border border-[#1E3A5F]/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#E6EDF5] font-semibold">Landing / Impact Probability:</span>
                    <span className="text-red-400 font-mono font-bold">High Contribution (35%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#102235] rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-red-500" />
                  </div>
                </div>

                {/* Cyclone Intensity */}
                <div className="p-2.5 rounded bg-[#07111F] border border-[#1E3A5F]/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#E6EDF5] font-semibold">Cyclone Intensity:</span>
                    <span className="text-red-400 font-mono font-bold">High Contribution (25%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#102235] rounded-full overflow-hidden">
                    <div className="w-[75%] h-full bg-red-500" />
                  </div>
                </div>

                {/* Proximity to Track */}
                <div className="p-2.5 rounded bg-[#07111F] border border-[#1E3A5F]/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#E6EDF5] font-semibold">Proximity to Track:</span>
                    <span className="text-amber-400 font-mono font-bold">Medium Contribution (20%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#102235] rounded-full overflow-hidden">
                    <div className="w-[60%] h-full bg-amber-500" />
                  </div>
                </div>

                {/* Wind Impact */}
                <div className="p-2.5 rounded bg-[#07111F] border border-[#1E3A5F]/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#E6EDF5] font-semibold">Wind Impact:</span>
                    <span className="text-red-400 font-mono font-bold">High Contribution (15%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#102235] rounded-full overflow-hidden">
                    <div className="w-[70%] h-full bg-red-500" />
                  </div>
                </div>

                {/* District Vulnerability */}
                <div className="p-2.5 rounded bg-[#07111F] border border-[#1E3A5F]/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#E6EDF5] font-semibold">District Vulnerability:</span>
                    <span className="text-amber-400 font-mono font-bold">Medium Contribution (5%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#102235] rounded-full overflow-hidden">
                    <div className="w-[50%] h-full bg-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E3A5F]/40 text-[10px] text-[#94A3B8] leading-relaxed">
              <span className="font-semibold text-amber-400">Notice:</span> Prototype risk calculation model. Official advisories must strictly align with IMD and NDMA directives.
            </div>
          </div>

          {/* Official IMD Bulletin Summary */}
          <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#1E3A5F]/60">
              <FileText className="w-4 h-4 text-[#38BDF8]" />
              <h4 className="text-xs font-bold text-[#E6EDF5] uppercase">IMD Operational Bulletin Reference</h4>
            </div>
            <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
              {riskData?.bulletin?.bulletinText ? riskData.bulletin.bulletinText.slice(0, 220) + '...' : 'Operational bulletin generated.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WarningsImpact;
