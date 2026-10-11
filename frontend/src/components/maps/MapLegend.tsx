import React from 'react';

interface MapLegendProps {
  type: 'intensity' | 'risk';
}

export const MapLegend: React.FC<MapLegendProps> = ({ type }) => {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-[#E1F4F6]/90 backdrop-blur rounded-lg border border-[#CFE5E9] p-3 shadow-xl">
      <h4 className="text-xs font-semibold text-[#0B2A33] uppercase tracking-wider mb-2">
        {type === 'intensity' ? 'Cyclone Intensity (IMD)' : 'Risk Level'}
      </h4>
      
      {type === 'intensity' ? (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>D / DD (≤ 33 kts)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>CS (34 - 47 kts)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>SCS (48 - 63 kts)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>VSCS (64 - 89 kts)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>ESCS (90 - 119 kts)</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>SuCS (≥ 120 kts)</div>
        </div>
      ) : (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500 mr-2"></span>HIGH</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-amber-500/50 border border-amber-500 mr-2"></span>MODERATE</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500 mr-2"></span>LOW</div>
        </div>
      )}
    </div>
  );
};
