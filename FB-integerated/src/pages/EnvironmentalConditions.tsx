import { useState } from 'react';
import type { FC } from 'react';
import { EnvironmentalChart } from '../components/charts/EnvironmentalChart';
import { 
  ThermometerSun, 
  Wind, 
  Droplets, 
  Gauge, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { environmentalTimeSeries } from '../data/mockEnvironmental';

export const EnvironmentalConditions: FC = () => {
  const [selectedVariable, setSelectedVariable] = useState<string>('sst');

  const variables = [
    { id: 'sst', name: 'Sea Surface Temperature', unit: '°C', color: '#f87171' },
    { id: 'pressure', name: 'Atmospheric Pressure', unit: 'hPa', color: '#38bdf8' },
    { id: 'humidity', name: 'Relative Humidity', unit: '%' },
    { id: 'windSpeed', name: 'Wind Speed', unit: 'm/s' },
    { id: 'windShear', name: 'Wind Shear', unit: 'm/s', color: '#34d399' },
  ];

  const currentVar = variables.find(v => v.id === selectedVariable) || variables[0];

  // Format data for EnvironmentalChart
  const tsData = environmentalTimeSeries[selectedVariable];
  const chartData = tsData ? tsData.data : [];

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Environmental Conditions</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-900/50 text-cyan-400 border border-cyan-700/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                ERA5 (DEMO)
              </span>
            </div>
            <p className="text-slate-400 text-base md:text-lg">Atmospheric and oceanic data analysis</p>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-slate-300 backdrop-blur-sm">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Assimilation Window: <span className="text-slate-100 font-semibold">T-0 to T+72h</span></span>
          </div>
        </div>
      </div>

      {/* Top Row - Key Variable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: SST */}
        <div 
          onClick={() => setSelectedVariable('sst')}
          className={`cursor-pointer bg-red-950/20 border ${selectedVariable === 'sst' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-red-900/40 hover:border-red-500/50'} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-950/30 transition-all duration-300 animate-fade-in-up flex flex-col justify-between`}
          style={{ animationDelay: '100ms' }}
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <ThermometerSun className="w-5 h-5 text-red-400" />
                </div>
                <span className="font-semibold text-sm text-slate-200">SST</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+0.8°C</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-100 mb-1.5 tracking-tight">29.5°C</div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-red-900/30 flex items-center justify-between">
            <span>Favorable (&gt;26.5°C)</span>
            <span className="text-[10px] text-red-400 font-medium">HIGH HEAT</span>
          </div>
        </div>

        {/* Card 2: Pressure */}
        <div 
          onClick={() => setSelectedVariable('pressure')}
          className={`cursor-pointer bg-slate-800/50 border ${selectedVariable === 'pressure' ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-slate-700/80 hover:border-cyan-500/50'} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-950/30 transition-all duration-300 animate-fade-in-up flex flex-col justify-between`}
          style={{ animationDelay: '150ms' }}
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="font-semibold text-sm text-slate-200">Pressure</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>-6 hPa</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-100 mb-1.5 tracking-tight">1004 hPa</div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span>Decreasing indicates strengthening</span>
            <span className="text-[10px] text-cyan-400 font-medium">FALLING</span>
          </div>
        </div>

        {/* Card 3: Humidity */}
        <div 
          onClick={() => setSelectedVariable('humidity')}
          className={`cursor-pointer bg-slate-800/50 border ${selectedVariable === 'humidity' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700/80 hover:border-blue-500/50'} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-950/30 transition-all duration-300 animate-fade-in-up flex flex-col justify-between`}
          style={{ animationDelay: '200ms' }}
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <span className="font-semibold text-sm text-slate-200">Rel. Humidity</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+4%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-100 mb-1.5 tracking-tight">82%</div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span>Sufficient moisture for convection</span>
            <span className="text-[10px] text-blue-400 font-medium">OPTIMAL</span>
          </div>
        </div>

        {/* Card 4: Wind Speed */}
        <div 
          onClick={() => setSelectedVariable('windSpeed')}
          className={`cursor-pointer bg-slate-800/50 border ${selectedVariable === 'windSpeed' ? 'border-slate-400 ring-2 ring-slate-400/30' : 'border-slate-700/80 hover:border-slate-500'} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up flex flex-col justify-between`}
          style={{ animationDelay: '250ms' }}
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="p-2 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <Wind className="w-5 h-5 text-slate-300" />
                </div>
                <span className="font-semibold text-sm text-slate-200">Wind Speed</span>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-700/40 px-2 py-0.5 rounded-full border border-slate-600/40">
                Surface
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-100 mb-1.5 tracking-tight">12 m/s</div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700/60 flex items-center justify-between">
            <span>Surface wind field measurement</span>
            <span className="text-[10px] text-slate-300 font-medium">CYCLONIC</span>
          </div>
        </div>

        {/* Card 5: Wind Shear */}
        <div 
          onClick={() => setSelectedVariable('windShear')}
          className={`cursor-pointer bg-emerald-950/20 border ${selectedVariable === 'windShear' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-emerald-900/40 hover:border-emerald-500/50'} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/30 transition-all duration-300 animate-fade-in-up flex flex-col justify-between`}
          style={{ animationDelay: '300ms' }}
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Wind className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-semibold text-sm text-slate-200">Wind Shear</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                &lt; 10 m/s
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-100 mb-1.5 tracking-tight">8 m/s</div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-emerald-900/30 flex items-center justify-between">
            <span>Low shear favorable</span>
            <span className="text-[10px] text-emerald-400 font-medium">SUPPORTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Scientific Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div 
          className="lg:col-span-2 bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 md:p-7 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: '350ms' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-slate-100">Time Series Analysis</h2>
              </div>
              <p className="text-xs text-slate-400">Historical trend and multi-temporal assimilation timeline</p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
                aria-label="Select Environmental Variable"
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer shadow-inner"
              >
                {variables.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-slate-200">
                    {v.name} ({v.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="h-[360px] w-full pt-2">
            <EnvironmentalChart 
              variable={currentVar.name} 
              unit={currentVar.unit} 
              data={chartData} 
              height={360}
              color={currentVar.color || '#06b6d4'}
            />
          </div>
        </div>

        {/* Scientific Context & Visualizer Panel */}
        <div className="space-y-6">
          {/* Scientific Context */}
          <div 
            className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 md:p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-slate-100">Scientific Context</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              Environmental conditions heavily influence cyclone genesis and intensification. The following criteria represent the consensus threshold for rapid development.
            </p>
            
            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Conditions for Intensification
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-sm font-medium text-slate-200">SST &gt; 26.5°C</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Met (29.5°C)
                </span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-sm font-medium text-slate-200">Low Vertical Shear (&lt;10 m/s)</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Met (8 m/s)
                </span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-sm font-medium text-slate-200">High Relative Humidity (&gt;70%)</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Met (82%)
                </span>
              </li>
              <li className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-sm font-medium text-slate-200">Pre-existing Disturbance</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Detected
                </span>
              </li>
            </ul>
          </div>
          
          {/* Spatial Visualization Notice */}
          <div 
            className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 md:p-7 text-center shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '450ms' }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Gauge className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Spatial Visualization</h3>
            <p className="text-sm text-slate-300 mb-3">
              Spatial visualization of environmental conditions
            </p>
            <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              Note: Full spatial ERA5 visualization requires backend processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalConditions;

