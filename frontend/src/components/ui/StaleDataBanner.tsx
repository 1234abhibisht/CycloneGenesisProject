import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface StaleDataBannerProps {
  lastUpdated: string;
  onRefresh?: () => void;
}

export const StaleDataBanner: React.FC<StaleDataBannerProps> = ({ lastUpdated, onRefresh }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <div className="flex items-center gap-3 text-[#A15C07]">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-sm">
          <span className="font-semibold">⚠ Data may be outdated.</span> Last successful update: {lastUpdated}
        </p>
      </div>
      {onRefresh && (
        <button 
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#A15C07] hover:text-[#A15C07] hover:bg-amber-500/20 rounded transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      )}
    </div>
  );
};
