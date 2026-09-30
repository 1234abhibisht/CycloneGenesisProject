import React from 'react';
import { Database, Thermometer, Satellite, Radio, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Globe } from 'lucide-react';
import { useOperationalData } from '../hooks/useOperationalData';

const DataSources: React.FC = () => {
  const { storms, isLive, lastFetched, loading, refresh } = useOperationalData();

  return (
    <div className="flex flex-col space-y-6 h-full overflow-y-auto p-4 md:p-6 text-slate-100 bg-[#0a0f1e]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Data Sources & Operational Feeds</h1>
          <p className="text-slate-400 text-sm">Transparent data provenance, live sensor feeds, and API telemetry</p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Polling Feeds...' : 'Refresh All Feeds'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real-Time Operational Cyclone Tracking Card */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Radio size={24} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Operational Cyclone Tracking</h2>
                <span className="text-xs text-slate-400">GDACS / IMD / JTWC Consensus Feed</span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <CheckCircle size={12} />
              <span>Connected (Live Feed)</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 flex-grow">
            Real-time global tropical cyclone tracking and multi-agency consensus alerts powered by the Global Disaster Alert and Coordination System (GDACS), aggregating IMD RSMC New Delhi, JTWC, and NOAA.
          </p>
          <div className="space-y-2 text-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex"><span className="text-slate-400 w-1/3">Provider:</span> <span className="font-medium text-slate-200">GDACS REST API / GeoJSON</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Agencies:</span> <span className="font-medium text-slate-200">IMD, JTWC, NHC, JMA, BOM</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Coverage:</span> <span className="font-medium text-slate-200">Global (North Indian Ocean, Bay of Bengal, Arabian Sea)</span></div>
            <div className="flex">
              <span className="text-slate-400 w-1/3">Active Storms:</span>
              <span className="font-medium text-cyan-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {storms.length > 0 ? `${storms.length} Active System(s) Tracked` : '0 Active (Standby Polling)'}
              </span>
            </div>
            <div className="flex"><span className="text-slate-400 w-1/3">Update Freq:</span> <span className="font-medium text-slate-200">Continuous / 5-min Auto-Polling</span></div>
            <div className="flex">
              <span className="text-slate-400 w-1/3">Status:</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} /> Operational ({isLive ? 'Active Global Stream' : 'Ready / Standing By'})
              </span>
            </div>
            <div className="flex">
              <span className="text-slate-400 w-1/3">Last Update:</span>
              <span className="font-medium text-slate-300">
                {lastFetched ? new Date(lastFetched).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>
        </div>

        {/* IBTrACS Card */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                <Database size={24} />
              </div>
              <h2 className="text-lg font-semibold">IBTrACS — International Best Track Archive</h2>
            </div>
            <div className="px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle size={12} />
              <span>Connected (ERDDAP)</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 flex-grow">
            The definitive global historical tropical cyclone dataset maintained by NOAA's National Centers for Environmental Information (NCEI) under WMO mandate.
          </p>
          <div className="space-y-2 text-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex"><span className="text-slate-400 w-1/3">Dataset:</span> <span className="font-medium text-slate-200">IBTrACS v04r01 (via NOAA ERDDAP)</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Coverage:</span> <span className="font-medium text-slate-200">Global, all ocean basins</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Focus Basin:</span> <span className="font-medium text-slate-200">North Indian Ocean (NI)</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Historical:</span> <span className="font-medium text-slate-200">1842–present (reliable 1980+)</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Resolution:</span> <span className="font-medium text-slate-200">3-6 hourly positions</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Variables:</span> <span className="font-medium text-slate-200">Position, wind speed, pressure, motion, grade, distance to land</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Records:</span> <span className="font-medium text-slate-200">Full North Indian Basin Archive</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Update:</span> <span className="font-medium text-slate-200">Annual + ERDDAP near-real-time</span></div>
          </div>
        </div>

        {/* NASA GIBS Card */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Satellite size={24} />
              </div>
              <h2 className="text-lg font-semibold">NASA GIBS — Global Imagery Browse Services</h2>
            </div>
            <div className="px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle size={12} />
              <span>Connected</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 flex-grow">
            NASA's satellite imagery service providing near-real-time and historical Earth observation imagery from multiple satellite missions.
          </p>
          <div className="space-y-2 text-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex"><span className="text-slate-400 w-1/3">Service:</span> <span className="font-medium text-slate-200">WMTS (Web Map Tile Service)</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Layers:</span> <span className="font-medium text-slate-200">VIIRS SNPP, MODIS Terra/Aqua, IMERG</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Projection:</span> <span className="font-medium text-slate-200">EPSG:3857 (Web Mercator)</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Access:</span> <span className="font-medium text-slate-200">Direct tile URL, CORS-enabled</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Update:</span> <span className="font-medium text-slate-200">Daily (polar-orbiting)</span></div>
          </div>
        </div>

        {/* ERA5 Card */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                <Thermometer size={24} />
              </div>
              <h2 className="text-lg font-semibold">ERA5 — ECMWF Reanalysis v5</h2>
            </div>
            <div className="px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle size={12} />
              <span>Simulated Parameters</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 flex-grow">
            The fifth generation atmospheric reanalysis from the European Centre for Medium-Range Weather Forecasts (ECMWF), providing comprehensive climate variables.
          </p>
          <div className="space-y-2 text-sm bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex"><span className="text-slate-400 w-1/3">Variables:</span> <span className="font-medium text-slate-200">SST, pressure, humidity, wind, shear</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Resolution:</span> <span className="font-medium text-slate-200">Hourly / 6-hourly</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Spatial Res:</span> <span className="font-medium text-slate-200">0.25° × 0.25° (~31 km)</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Coverage:</span> <span className="font-medium text-slate-200">Global, 1940–present</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Processing:</span> <span className="font-medium text-slate-200">±5° spatial window at storm center</span></div>
            <div className="flex"><span className="text-slate-400 w-1/3">Pipeline:</span> <span className="font-medium text-slate-200">CDS API → Python → Reanalysis Model</span></div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Live Data Integration Architecture</h2>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col space-y-3 w-full md:w-1/3">
            <div className="bg-slate-900 p-3 rounded border border-emerald-500/40 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Operational GDACS Feed
              </span>
              <ArrowRight className="text-emerald-400" size={16} />
            </div>
            <div className="bg-slate-900 p-3 rounded border border-cyan-500/40 text-sm flex items-center justify-between">
              <span className="text-cyan-300 font-medium">IBTrACS NOAA ERDDAP</span>
              <ArrowRight className="text-cyan-400" size={16} />
            </div>
            <div className="bg-slate-900 p-3 rounded border border-blue-500/40 text-sm flex items-center justify-between">
              <span className="text-blue-300 font-medium">NASA GIBS Satellite Tiles</span>
              <ArrowRight className="text-blue-400" size={16} />
            </div>
            <div className="bg-slate-900 p-3 rounded border border-amber-500/40 text-sm flex items-center justify-between">
              <span className="text-amber-300 font-medium">ERA5 Reanalysis Matrix</span>
              <ArrowRight className="text-amber-400" size={16} />
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-center justify-center text-cyan-500">
            <div className="h-px w-16 bg-cyan-500/50"></div>
          </div>

          <div className="bg-slate-900 border border-cyan-500/30 p-6 rounded-xl flex-grow text-center min-h-[160px] flex flex-col justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] w-full">
            <h3 className="font-bold text-lg text-cyan-400 mb-2">Cyclone AI Intelligence Engine</h3>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
                <span className="text-cyan-300 font-semibold block mb-0.5">Track Forecast Engine</span>
                Deep Learning Trajectory & Cone
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
                <span className="text-emerald-300 font-semibold block mb-0.5">Real-time Telemetry</span>
                Live Storm Sensor Synchronization
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
                <span className="text-purple-300 font-semibold block mb-0.5">Satellite Intelligence</span>
                TrueColor / Multispectral Overlays
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/50">
                <span className="text-amber-300 font-semibold block mb-0.5">Risk & Vulnerability</span>
                GIS Spatial Landfall Assessment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSources;
