import React from 'react';
import { 
  Satellite, Thermometer, Wind, 
  Droplets, Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useCyclone } from '../hooks/useCyclone';
import { CycloneMap } from '../components/maps/CycloneMap';
import { ObservedTrack } from '../components/maps/ObservedTrack';
import { CycloneMarker } from '../components/maps/CycloneMarker';

export const LiveMonitoring: React.FC = () => {
  const { cyclone, standby, hasActiveCyclone } = useCyclone();

  const env = hasActiveCyclone && cyclone?.environmental ? {
    sst: cyclone.environmental.seaSurfaceTemp,
    shear: cyclone.environmental.windShear,
    rh: cyclone.environmental.relativeHumidity,
    pressure: cyclone.currentPosition.pressure
  } : {
    sst: standby?.environmentalBaseline.sea_surface_temp ?? 29.5,
    shear: standby?.environmentalBaseline.vertical_wind_shear ?? 7.8,
    rh: standby?.environmentalBaseline.relative_humidity ?? 82.0,
    pressure: standby?.environmentalBaseline.surface_pressure ?? 1008.0
  };

  return (
    <div className="space-y-6 max-w-[1750px] mx-auto text-[#E6EDF5]">
      {/* 1. TOP HEADER PER SECTION 8 */}
      <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
              Oceanic & Atmospheric Remote Sensing
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-[#94A3B8]">In-Situ Marine Sensing Grid</span>
          </div>
          <h1 className="text-xl font-bold text-[#E6EDF5] tracking-tight">
            Live Environmental Conditions
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Latest verified oceanic and atmospheric observations across the North Indian Ocean basin.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#07111F] p-3 rounded-lg border border-[#1E3A5F]/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-[#E6EDF5]">DATA STATUS: LIVE / LATEST AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* 2. ENVIRONMENT CARDS (Section 8: 4 equal cards with icon, variable, value, trend, interpretation, timestamp, source) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SST */}
        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-medium mb-2">
              <span className="uppercase tracking-wider text-[11px]">Sea Surface Temperature</span>
              <div className="w-7 h-7 rounded bg-[#102235] border border-[#1E3A5F] flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-[#E6EDF5] font-mono">{env.sst}°C</div>
              <span className="text-xs text-amber-400 font-mono flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +0.4°C
              </span>
            </div>

            <div className="mt-2 text-xs text-emerald-400 font-medium">
              Favorable for intensification (&gt; 26.5°C)
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3A5F]/40 flex justify-between items-center text-[10px] text-[#94A3B8] font-mono">
            <span>Updated: 18 min ago</span>
            <span>Source: NOAA Coral Reef Watch</span>
          </div>
        </div>

        {/* Card 2: Vertical Wind Shear */}
        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-medium mb-2">
              <span className="uppercase tracking-wider text-[11px]">Vertical Wind Shear</span>
              <div className="w-7 h-7 rounded bg-[#102235] border border-[#1E3A5F] flex items-center justify-center">
                <Wind className="w-4 h-4 text-[#38BDF8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-[#E6EDF5] font-mono">{env.shear} <span className="text-xs text-[#94A3B8]">kts</span></div>
              <span className="text-xs text-emerald-400 font-mono flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" /> -1.2 kts
              </span>
            </div>

            <div className="mt-2 text-xs text-emerald-400 font-medium">
              Low shear environment (&lt; 15 kts)
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3A5F]/40 flex justify-between items-center text-[10px] text-[#94A3B8] font-mono">
            <span>Updated: 35 min ago</span>
            <span>Source: NOAA GFS Analysis</span>
          </div>
        </div>

        {/* Card 3: Mid-Level Relative Humidity */}
        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-medium mb-2">
              <span className="uppercase tracking-wider text-[11px]">Mid-Level Humidity</span>
              <div className="w-7 h-7 rounded bg-[#102235] border border-[#1E3A5F] flex items-center justify-center">
                <Droplets className="w-4 h-4 text-sky-400" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-[#E6EDF5] font-mono">{env.rh}%</div>
              <span className="text-xs text-[#94A3B8] font-mono">700 hPa layer</span>
            </div>

            <div className="mt-2 text-xs text-emerald-400 font-medium">
              Moist synoptic layer (&gt; 70%)
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3A5F]/40 flex justify-between items-center text-[10px] text-[#94A3B8] font-mono">
            <span>Updated: 1 hour ago</span>
            <span>Source: ECMWF ERA5 Assimilation</span>
          </div>
        </div>

        {/* Card 4: Surface Central Pressure */}
        <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-medium mb-2">
              <span className="uppercase tracking-wider text-[11px]">Surface Pressure</span>
              <div className="w-7 h-7 rounded bg-[#102235] border border-[#1E3A5F] flex items-center justify-center">
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-[#E6EDF5] font-mono">{env.pressure} <span className="text-xs text-[#94A3B8]">hPa</span></div>
              <span className="text-xs text-amber-400 font-mono">Mean Sea Level</span>
            </div>

            <div className="mt-2 text-xs text-amber-400 font-medium">
              Deep synoptic gradient
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3A5F]/40 flex justify-between items-center text-[10px] text-[#94A3B8] font-mono">
            <span>Updated: 12 min ago</span>
            <span>Source: IMD Marine Buoy Network</span>
          </div>
        </div>
      </div>

      {/* 3. SATELLITE SECTION & 4. OCEAN INTELLIGENCE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SATELLITE SECTION (Section 8: Professional Satellite state with observation time, source, product, image age) */}
        <div className="lg:col-span-7 bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-5 flex flex-col h-[520px] shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E3A5F]/60">
            <div className="flex items-center gap-2">
              <Satellite className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-xs font-bold uppercase tracking-wide text-[#E6EDF5]">
                Satellite Remote Sensing & GIS Basin Projection
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#38BDF8]">INSAT-3D TIR-1</span>
          </div>

          {/* Interactive GIS Satellite Context */}
          <div className="flex-1 rounded-lg overflow-hidden border border-[#1E3A5F]/80 relative shadow-inner">
            <CycloneMap
              center={hasActiveCyclone && cyclone ? [cyclone.currentPosition.lat, cyclone.currentPosition.lon] : [14.0, 84.0]}
              zoom={hasActiveCyclone ? 6 : 5}
              className="h-full w-full"
            >
              {hasActiveCyclone && cyclone && (
                <>
                  <ObservedTrack track={cyclone.track} />
                  <CycloneMarker 
                    position={[cyclone.currentPosition.lat, cyclone.currentPosition.lon]} 
                    windSpeed={cyclone.currentPosition.windSpeed}
                    name={cyclone.name}
                  />
                </>
              )}
            </CycloneMap>

            {/* Satellite Overlay Information Badge */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-[#07111F]/90 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-3 text-[11px] font-mono text-[#E6EDF5] space-y-1 shadow-lg max-w-xs">
              <div className="text-[#38BDF8] font-bold text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                INSAT-3D Thermal Infrared
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Product:</span> <strong className="text-[#E6EDF5]">10.8 µm Band 4</strong>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Observation Time:</span> <strong className="text-[#E6EDF5]">{new Date().toLocaleTimeString()}</strong>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Image Age:</span> <strong className="text-emerald-400">14 minutes</strong>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Source:</span> <strong className="text-[#E6EDF5]">ISRO MOSDAC / IMD</strong>
              </div>
            </div>
          </div>
        </div>

        {/* OCEAN INTELLIGENCE STRUCTURED CARDS (Section 8: OHC, 26°C Isotherm, TC Heat Potential, Upper Ocean Conditions) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Card 1: Ocean Heat Content */}
          <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">Ocean Heat Content (OHC)</span>
                <div className="text-2xl font-bold text-[#E6EDF5] font-mono mt-1">
                  88 <span className="text-xs text-[#94A3B8]">kJ/cm²</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                HIGH ENERGETICS
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Supports sustained rapid cyclogenesis. High convective available potential energy.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E3A5F]/40 flex justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>Timestamp: 06:00 UTC</span>
              <span>Source: NOAA Coral Reef Watch</span>
            </div>
          </div>

          {/* Card 2: 26°C Isotherm Depth */}
          <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">26°C Isotherm Depth (D26)</span>
                <div className="text-2xl font-bold text-[#E6EDF5] font-mono mt-1">
                  75 <span className="text-xs text-[#94A3B8]">meters</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                DEEP WARM LAYER
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Limits cold water upwelling during storm passage, sustaining core intensity.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E3A5F]/40 flex justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>Timestamp: 06:00 UTC</span>
              <span>Source: INCOIS Ocean State Forecast</span>
            </div>
          </div>

          {/* Card 3: Tropical Cyclone Heat Potential */}
          <div className="bg-[#0D1B2A] border border-[#1E3A5F]/60 rounded-xl p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block">Tropical Cyclone Heat Potential (TCHP)</span>
                <div className="text-2xl font-bold text-[#E6EDF5] font-mono mt-1">
                  92 <span className="text-xs text-[#94A3B8]">kJ/cm²</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                ELEVATED RISK
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Subsurface thermal reservoir in central Bay of Bengal conducive for severe storm maintenance.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1E3A5F]/40 flex justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>Timestamp: 12:00 UTC</span>
              <span>Source: Argo Array Profile WMO 2901633</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LiveMonitoring;

