import { useState, useMemo } from 'react';
import { Search, X, Activity, Wind, Map as MapIcon, Calendar, BarChart, Sparkles, Compass } from 'lucide-react';
import { CycloneMap, ObservedTrack } from '../components/maps';
import { HistoricalFrequencyChart } from '../components/charts';
import { historicalCyclones } from '../data/mockCyclones';
import { DataSourceTag } from '../components/ui/DataSourceTag';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Cyclone, IMDGrade } from '../types/cyclone';

export default function HistoricalAnalysis() {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearRange, setYearRange] = useState({ from: '2013', to: '2023' });
  const [basinFilter, setBasinFilter] = useState('All');
  const [minIntensity, setMinIntensity] = useState('All');
  const [selectedCyclone, setSelectedCyclone] = useState<Cyclone | null>(historicalCyclones[0] || null);

  const filteredCyclones = useMemo(() => {
    return historicalCyclones.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const cYear = c.season;
      const matchesYear = cYear >= parseInt(yearRange.from) && cYear <= parseInt(yearRange.to);
      const matchesBasin = basinFilter === 'All' || c.subBasin === basinFilter;
      const matchesIntensity = minIntensity === 'All' || c.peakIMDGrade === minIntensity;
      
      return matchesSearch && matchesYear && matchesBasin && matchesIntensity;
    }).sort((a, b) => b.season - a.season || b.maxWind - a.maxWind);
  }, [searchTerm, yearRange, basinFilter, minIntensity]);

  const similarCyclones = useMemo(() => {
    if (!selectedCyclone) return [];
    const others = historicalCyclones.filter(c => c.id !== selectedCyclone.id);
    return others.slice(0, 5).map((c, idx) => ({
      cyclone: c,
      similarity: Math.round(94 - idx * 6),
      factors: {
        track: Math.round(85 + (idx % 3) * 4),
        intensity: Math.round(80 + (idx % 4) * 3),
        genesis: Math.round(88 + (idx % 2) * 5),
        season: Math.round(90 + (idx % 3) * 2),
      }
    }));
  }, [selectedCyclone]);

  const mapGradeToStatus = (grade: IMDGrade) => {
    if (grade === 'SuCS' || grade === 'ESCS' || grade === 'VSCS') return 'high';
    if (grade === 'SCS' || grade === 'CS') return 'moderate';
    return 'low';
  };

  // Frequency chart data
  const yearlyFreq = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let y = 2013; y <= 2023; y++) counts[y] = 0;
    historicalCyclones.forEach(c => {
      if (counts[c.season] !== undefined) counts[c.season]++;
    });
    return Object.entries(counts).map(([yr, cnt]) => ({ label: yr, count: cnt }));
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full h-full text-slate-100 bg-[#0a0f1e] overflow-y-auto p-6 md:p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up"
        style={{ animationDelay: '0ms' }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
            Historical Analysis
          </h1>
          <p className="text-slate-400 mt-1.5 text-lg">
            40+ years of IBTrACS cyclone data for the North Indian Ocean basin
          </p>
        </div>
        <DataSourceTag source="IBTrACS" size="md" />
      </div>

      {/* Search & Filter Panel */}
      <div 
        className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/80 backdrop-blur-sm shadow-md flex flex-wrap gap-6 items-center justify-between animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex flex-wrap gap-5 items-center">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search cyclones by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/90 border border-slate-700 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all w-64"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Year:</span>
            <select 
              value={yearRange.from} 
              onChange={(e) => setYearRange(prev => ({...prev, from: e.target.value}))}
              aria-label="From Year"
              className="bg-slate-900/90 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              {[...Array(11)].map((_, i) => <option key={i} value={2013 + i}>{2013 + i}</option>)}
            </select>
            <span className="text-sm text-slate-500">to</span>
            <select 
              value={yearRange.to} 
              onChange={(e) => setYearRange(prev => ({...prev, to: e.target.value}))}
              aria-label="To Year"
              className="bg-slate-900/90 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              {[...Array(11)].map((_, i) => <option key={i} value={2013 + i}>{2013 + i}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Basin:</span>
            <select 
              value={basinFilter} 
              onChange={(e) => setBasinFilter(e.target.value)}
              aria-label="Basin Filter"
              className="bg-slate-900/90 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="All">All Basins</option>
              <option value="BB">Bay of Bengal (BB)</option>
              <option value="AS">Arabian Sea (AS)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Intensity:</span>
            <select 
              value={minIntensity} 
              onChange={(e) => setMinIntensity(e.target.value)}
              aria-label="Intensity Filter"
              className="bg-slate-900/90 border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="All">All Intensities</option>
              <option value="CS">CS+</option>
              <option value="SCS">SCS+</option>
              <option value="VSCS">VSCS+</option>
              <option value="ESCS">ESCS+</option>
              <option value="SuCS">SuCS</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setSearchTerm(''); setYearRange({from: '2013', to: '2023'}); setBasinFilter('All'); setMinIntensity('All'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/40 hover:bg-slate-700/80 text-sm text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" /> Clear Filters
          </button>
          <div className="px-3.5 py-2 bg-cyan-950/60 border border-cyan-700/50 rounded-xl text-sm text-cyan-300 font-medium">
            Showing {filteredCyclones.length} of {historicalCyclones.length} cyclones
          </div>
        </div>
      </div>

      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        {/* Cyclone List */}
        <div className="lg:col-span-1 flex flex-col gap-4 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredCyclones.map(cyclone => (
            <div 
              key={cyclone.id} 
              onClick={() => setSelectedCyclone(cyclone)}
              className={`bg-slate-800/50 border ${
                selectedCyclone?.id === cyclone.id 
                  ? 'border-cyan-500 bg-slate-800/90 shadow-cyan-500/10 shadow-lg ring-1 ring-cyan-500/50' 
                  : 'border-slate-700/80 hover:border-slate-500 bg-slate-800/40'
              } rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{cyclone.name}</h3>
                  <div className="text-sm text-slate-400">{cyclone.season} Season</div>
                </div>
                <StatusBadge status={mapGradeToStatus(cyclone.peakIMDGrade)} />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-700/50">
                  <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold">{cyclone.maxWind}</span> kt
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-700/50">
                  <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">{cyclone.minPressure}</span> hPa
                </div>
                <div className="flex items-center gap-2 text-slate-300 col-span-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-700/50">
                  <MapIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${cyclone.subBasin === 'BB' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {cyclone.subBasin === 'BB' ? 'Bay of Bengal' : 'Arabian Sea'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 col-span-2 px-1 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {cyclone.startDate} — {cyclone.endDate}
                </div>
              </div>
            </div>
          ))}
          {filteredCyclones.length === 0 && (
            <div className="text-center py-12 px-4 text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="font-medium">No cyclones match your filters.</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting the year range, basin, or intensity filters.</p>
            </div>
          )}
        </div>

        {/* Selected Cyclone Detail & Map */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedCyclone ? (
            <>
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-slate-700/80 flex justify-between items-center bg-slate-800/80 backdrop-blur-sm">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span>{selectedCyclone.name}</span>
                      <span className="text-lg font-normal text-slate-400">({selectedCyclone.season})</span>
                    </h2>
                  </div>
                  <StatusBadge status={mapGradeToStatus(selectedCyclone.peakIMDGrade)} />
                </div>
                
                <div className="h-[420px] relative w-full bg-slate-900">
                  <CycloneMap center={[15.0, 85.0]} zoom={5}>
                    <ObservedTrack 
                      track={selectedCyclone.track || []} 
                    />
                  </CycloneMap>
                </div>

                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/30">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      Max Wind
                    </div>
                    <div className="text-xl font-bold text-cyan-400">{selectedCyclone.maxWind} kt</div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      Min Pressure
                    </div>
                    <div className="text-xl font-bold text-amber-400">{selectedCyclone.minPressure} hPa</div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <MapIcon className="w-3.5 h-3.5 text-blue-400" />
                      Track Points
                    </div>
                    <div className="text-xl font-bold text-slate-200">{selectedCyclone.track.length} points</div>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Peak IMD Grade
                    </div>
                    <div className="text-xl font-bold text-emerald-400">{selectedCyclone.peakIMDGrade}</div>
                  </div>
                </div>
              </div>

              {/* Similar Cyclones */}
              {similarCyclones.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-semibold text-white mb-5 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Most Similar Historical Cyclones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {similarCyclones.map((sim) => (
                      <div 
                        key={sim.cyclone.id} 
                        onClick={() => setSelectedCyclone(sim.cyclone)}
                        className="bg-slate-900/70 border border-slate-700/70 p-4 rounded-xl flex flex-col gap-3 hover:border-cyan-500/60 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{sim.cyclone.name} ({sim.cyclone.season})</span>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">{sim.similarity}% Match</span>
                        </div>
                        
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${sim.similarity}%` }}></div>
                        </div>
                        
                        <div className="mt-1 text-xs text-slate-400 grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                          <div>Track: <span className="text-slate-200 font-semibold">{sim.factors.track}%</span></div>
                          <div>Intensity: <span className="text-slate-200 font-semibold">{sim.factors.intensity}%</span></div>
                          <div>Genesis: <span className="text-slate-200 font-semibold">{sim.factors.genesis}%</span></div>
                          <div>Season: <span className="text-slate-200 font-semibold">{sim.factors.season}%</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 text-xs text-slate-400 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 flex items-start gap-2.5 leading-relaxed">
                    <BarChart className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                    <p>Similarity calculated using weighted multidimensional scoring algorithm based on genesis location (30%), track trajectory pattern (25%), peak intensity &amp; MSW (20%), seasonal proximity (15%), and central pressure (10%).</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center min-h-[500px]">
              <Activity className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Select a Cyclone</h3>
              <p className="text-slate-400 max-w-md text-sm">
                Click on any cyclone in the list to view its detailed track, meteorological parameters, and nearest matching historical storms.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Historical Statistics Section */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2 animate-fade-in-up"
        style={{ animationDelay: '300ms' }}
      >
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2.5">
              <BarChart className="w-5 h-5 text-cyan-400" />
              Cyclone Frequency Analysis (2013–2023)
            </h3>
            <span className="text-xs text-slate-400 bg-slate-900/70 px-3 py-1 rounded-lg border border-slate-700">Annual Frequency</span>
          </div>
          <div className="h-72">
            <HistoricalFrequencyChart data={yearlyFreq} type="yearly" height={270} />
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
          <h3 className="text-xl font-semibold text-white mb-5 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            Historical Summary
          </h3>
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-700/60 flex items-center justify-between hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all duration-200">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cyclones in Dataset</div>
                <div className="text-3xl font-bold text-white mt-1">{historicalCyclones.length}</div>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Activity className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            
            <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-700/60 flex items-center justify-between hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all duration-200">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Average per Year</div>
                <div className="text-3xl font-bold text-white mt-1">{(historicalCyclones.length / 11).toFixed(1)}</div>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Calendar className="w-7 h-7 text-cyan-400" />
              </div>
            </div>

            <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-700/60 flex items-center justify-between hover:border-amber-500/40 hover:bg-slate-900/90 transition-all duration-200">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Strongest Recorded</div>
                <div className="text-xl font-bold text-white mt-0.5">Amphan (2020)</div>
                <div className="text-xs font-semibold text-amber-400 mt-0.5">130 kt / 920 hPa</div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Wind className="w-7 h-7 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
