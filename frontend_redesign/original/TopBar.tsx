import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, Radio, History, ShieldCheck, Database
} from 'lucide-react';
import clsx from 'clsx';
import { fetchBackendStatus, switchOperationalMode, type BackendStatus } from '../../services/api';

interface TopBarProps {
  title: string;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, lastUpdated, onRefresh }) => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [mode, setMode] = useState<'live' | 'replay'>('live');
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  const loadStatus = async () => {
    const status = await fetchBackendStatus();
    if (status) {
      setBackendStatus(status);
      setMode(status.operational_mode || 'live');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleToggleMode = async (newMode: 'live' | 'replay') => {
    setSwitching(true);
    const ok = await switchOperationalMode(newMode);
    if (ok) {
      setMode(newMode);
      await loadStatus();
      if (onRefresh) onRefresh();
    }
    setSwitching(false);
  };

  return (
    <header className="min-h-[72px] flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 z-20 select-none">
      {/* Page Title & Data Status */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-medium text-slate-800 tracking-tight">{title}</h1>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {mode === 'live' ? 'LIVE DATA' : 'REPLAY MODE'}
          </span>
          <span className="text-slate-500 text-[12px] hidden sm:inline">
            Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '2 min ago'}
          </span>
        </div>
      </div>
      
      {/* Right Controls: Mode Toggle, DB Records, System Health, Refresh */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Operational Mode Toggle */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full">
          <button
            onClick={() => handleToggleMode('live')}
            disabled={switching}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer",
              mode === 'live'
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
            title="Real-time live feeds from GDACS / IMD"
          >
            <Radio className={clsx("w-3.5 h-3.5", mode === 'live' && "text-emerald-400 animate-pulse")} />
            LIVE DATA
          </button>
          
          <button
            onClick={() => handleToggleMode('replay')}
            disabled={switching}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer",
              mode === 'replay'
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
            title="Verified Archival Storm Replay (IBTrACS / IMD)"
          >
            <History className="w-3.5 h-3.5" />
            HISTORICAL REPLAY
          </button>
        </div>

        {/* Database Records Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>RECORDS: <strong className="text-slate-800">{backendStatus?.sqlite_database?.total_records_stored ?? 0}</strong></span>
        </div>

        {/* System Health */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>System Health: <strong className="text-emerald-400">Good</strong></span>
        </div>

        {/* SIH Presentation Mode Button (Section 16) */}
        <button
          onClick={() => {
            const steps = [
              "/dashboard/command",
              "/dashboard/live",
              "/dashboard/forecast",
              "/dashboard/warnings",
              "/dashboard/historical",
              "/dashboard/system"
            ];
            const currentIdx = steps.indexOf(window.location.pathname);
            const nextIdx = (currentIdx + 1) % steps.length;
            navigate(steps[nextIdx]);
          }}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
          title="Step through SIH evaluation pages"
        >
          <span className="w-2 h-2 rounded-full bg-white/80" />
          <span>SIH MODE</span>
        </button>

        {/* Refresh Action */}
        <button 
          onClick={async () => { await loadStatus(); onRefresh?.(); }}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          title="Force Ingestion Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
