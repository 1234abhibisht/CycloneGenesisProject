import React, { useState } from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

interface MapLayerControlProps {
  layers: Record<string, boolean>;
  onToggle: (layerKey: string) => void;
}

export const MapLayerControl: React.FC<MapLayerControlProps> = ({ layers, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const layerLabels: Record<string, string> = {
    satellite: 'Satellite Imagery',
    observedTrack: 'Observed Track',
    predictedTrack: 'Predicted Track',
    uncertaintyCone: 'Uncertainty Cone',
    districtBoundaries: 'District Boundaries',
    riskZones: 'Risk Zones',
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-700/90 transition-colors shadow-lg"
      >
        <Layers size={20} />
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-xl w-64">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Map Layers</h3>
          <div className="space-y-2">
            {Object.keys(layers).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{layerLabels[key] || key}</span>
                <button
                  onClick={() => onToggle(key)}
                  className={clsx(
                    "p-1.5 rounded-md transition-colors",
                    layers[key] ? "text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20" : "text-slate-500 hover:bg-slate-700"
                  )}
                >
                  {layers[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
