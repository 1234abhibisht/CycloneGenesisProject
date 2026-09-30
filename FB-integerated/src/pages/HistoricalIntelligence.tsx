import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, 
  MapPin, Wind, Gauge, Award, Sparkles
} from 'lucide-react';
import { fetchHistoricalCatalog, fetchHistoricalReplay } from '../services/historicalService';
import type { HistoricalStormSummary, HistoricalReplayData } from '../types/historical';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';
import type { TrackPoint } from '../types/cyclone';

export const HistoricalIntelligence: React.FC = () => {
  const [catalog, setCatalog] = useState<HistoricalStormSummary[]>([]);
  const [selectedStormId, setSelectedStormId] = useState<string>('HIST-FANI-2019');
  const [replayData, setReplayData] = useState<HistoricalReplayData | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      const storms = await fetchHistoricalCatalog();
      setCatalog(storms);
      if (storms.length > 0) {
        setSelectedStormId(storms[0].id);
      }
    }
    loadCatalog();
  }, []);

  // Load replay data when selected storm or step changes
  useEffect(() => {
    async function loadReplay() {
      const data = await fetchHistoricalReplay(selectedStormId, currentStep - 1);
      if (data) {
        setReplayData(data);
      }
    }
    loadReplay();
  }, [selectedStormId, currentStep]);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && replayData) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= replayData.replayState.totalSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, replayData]);

  const currentStorm = catalog.find(s => s.id === selectedStormId) || catalog[0];

  // Convert points to TrackPoint format for map components
  const trackPoints: TrackPoint[] = replayData?.replayState.observedTrackSoFar.map((p: any) => ({
    timestamp: p.timestamp,
    lat: p.lat,
    lon: p.lon,
    windSpeed: p.windSpeed,
    pressure: p.pressure,
    nature: 'TS',
    stormSpeed: 15,
    stormDir: 330,
    imdGrade: p.imdGrade as any
  })) || [];

  const currentPoint: TrackPoint = trackPoints.length > 0 ? trackPoints[trackPoints.length - 1] : {
    timestamp: new Date().toISOString(),
    lat: 16.0,
    lon: 86.0,
    windSpeed: 65,
    pressure: 985,
    nature: 'TS',
    stormSpeed: 15,
    stormDir: 330
  };

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#E6EDF5]">
      {/* 1. Header Banner */}
      <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
              Verified Climatological Archive
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-[#94A3B8]">NOAA IBTrACS & IMD Best Track Dataset</span>
          </div>
          <h1 className="text-xl font-bold text-[#E6EDF5] tracking-tight">
            Historical Intelligence & Replay
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Archival case study replay and dynamic analog similarity matching for benchmark validation.
          </p>
        </div>

        {/* Storm Selector Dropdown */}
        <div className="flex items-center gap-2 bg-[#07111F] p-2 rounded-lg border border-[#1E3A5F]/80">
          <span className="text-xs text-[#94A3B8] font-mono">SELECT STORM:</span>
          <select 
            value={selectedStormId}
            onChange={(e) => {
              setSelectedStormId(e.target.value);
              setCurrentStep(1);
              setIsPlaying(false);
            }}
            className="bg-[#0D1B2A] border border-[#1E3A5F] text-[#E6EDF5] text-xs font-mono px-3 py-1.5 rounded focus:outline-none focus:border-[#38BDF8] cursor-pointer"
          >
            {catalog.map(s => (
              <option key={s.id} value={s.id}>
                Cyclone {s.name} ({s.season}) — {s.peakIMDGrade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Playback Controls & Timeline Scrubber */}
      <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-lg bg-[#102235] hover:bg-[#1E3A5F] border border-[#1E3A5F] text-xs font-mono font-bold text-[#E6EDF5] flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY REPLAY'}</span>
          </button>

          <button
            onClick={() => {
              setCurrentStep(1);
              setIsPlaying(false);
            }}
            className="p-2 rounded-lg bg-[#102235] hover:bg-[#1E3A5F] border border-[#1E3A5F] text-[#94A3B8] hover:text-[#E6EDF5] transition-colors cursor-pointer"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-mono text-slate-300">
            OBSERVATION STEP: <strong className="text-[#38BDF8]">{currentStep}</strong> / {replayData?.replayState.totalSteps || 12}
          </span>
        </div>

        {/* Range Scrubber */}
        <div className="flex-1 max-w-xl flex items-center gap-3 w-full">
          <span className="text-[11px] font-mono text-slate-500">T=0</span>
          <input
            type="range"
            min={1}
            max={replayData?.replayState.totalSteps || 12}
            value={currentStep}
            onChange={(e) => {
              setCurrentStep(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full accent-[#38BDF8] bg-slate-800 h-1.5 rounded cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-500">LANDFALL</span>
        </div>

        <div className="text-xs font-mono text-[#94A3B8]">
          TIMESTAMP: <span className="text-[#E6EDF5] font-semibold">{currentPoint.timestamp}</span>
        </div>
      </div>

      {/* 3. Telemetry KPI Cards at Selected Step */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1 font-medium">
            <span>Observed Intensity</span>
            <Wind className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#E6EDF5]">
            {currentPoint.windSpeed} <span className="text-xs text-[#94A3B8]">kts</span>
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">
            Grade: <strong className="text-amber-400">{currentPoint.imdGrade || 'VSCS'}</strong>
          </span>
        </div>

        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1 font-medium">
            <span>Central Pressure</span>
            <Gauge className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#E6EDF5]">
            {currentPoint.pressure} <span className="text-xs text-[#94A3B8]">hPa</span>
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">Min Record: {currentStorm?.minPressure} hPa</span>
        </div>

        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1 font-medium">
            <span>Coordinates</span>
            <MapPin className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#E6EDF5]">
            {currentPoint.lat}°N, {currentPoint.lon}°E
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">Basin: {currentStorm?.subBasin === 'BB' ? 'Bay of Bengal' : 'Arabian Sea'}</span>
        </div>

        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1 font-medium">
            <span>Historical Landfall</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-[#E6EDF5] truncate font-sans">
            {currentStorm?.landfallLocation}
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">{currentStorm?.landfallDate}</span>
        </div>
      </div>

      {/* 4. Map Replay Canvas & Similar Historical Cyclones Panel (Section 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Replay Canvas */}
        <div className="lg:col-span-8 bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 h-[520px] flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1E3A5F]/60">
            <div>
              <h3 className="text-xs font-bold text-[#E6EDF5] uppercase tracking-wide">
                Observed Track Reconstruction up to Step {currentStep}
              </h3>
              <p className="text-[11px] text-[#94A3B8]">Verified NOAA IBTrACS & IMD Best Track Record</p>
            </div>
            <span className="text-[11px] font-mono text-[#38BDF8]">
              {trackPoints.length} Positions Tracked
            </span>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-[#1E3A5F]/80 relative shadow-inner">
            <CycloneMap 
              center={[currentPoint.lat, currentPoint.lon]} 
              zoom={6} 
              className="h-full w-full"
            >
              <ObservedTrack track={trackPoints} />
              <CycloneMarker 
                position={[currentPoint.lat, currentPoint.lon]} 
                windSpeed={currentPoint.windSpeed}
                name={currentStorm?.name}
              />
            </CycloneMap>
          </div>
        </div>

        {/* Similar Historical Cyclones Panel (Section 14) */}
        <div className="lg:col-span-4 bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]/60 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF5]">
                  Analog Similarity Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#38BDF8]">IBTrACS Climatology</span>
            </div>

            <p className="text-xs text-[#94A3B8] mb-3">
              Illustrative examples from the original frontend; similarity scores below are not computed by this backend:
            </p>

            <div className="space-y-3">
              {[
                { name: 'Cyclone Phailin', year: '2013', peak: '140 kts', landfall: 'Gopalpur, Odisha', sim: '94.8%' },
                { name: 'Cyclone Hudhud', year: '2014', peak: '115 kts', landfall: 'Visakhapatnam, AP', sim: '89.2%' },
                { name: 'Cyclone Titli', year: '2018', peak: '80 kts', landfall: 'Palasa, Andhra Pradesh', sim: '84.6%' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#07111F] border border-[#1E3A5F]/60 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#E6EDF5] font-sans">{item.name} ({item.year})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {item.sim} MATCH
                    </span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8] text-[11px]">
                    <span>Peak Wind: <strong className="text-[#E6EDF5]">{item.peak}</strong></span>
                    <span>Landfall: <strong className="text-[#E6EDF5]">{item.landfall}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E3A5F]/60 mt-3 text-[11px] text-[#94A3B8] flex justify-between">
            <span>Trajectory Vector Match: DTW</span>
            <span className="text-[#38BDF8] font-medium">Dynamic Time Warping</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HistoricalIntelligence;

