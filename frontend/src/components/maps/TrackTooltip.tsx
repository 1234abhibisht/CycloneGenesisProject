import React from 'react';
import { Popup } from 'react-leaflet';
import type { TrackPoint } from '../../types/cyclone';
import { Navigation } from 'lucide-react';

interface TrackTooltipProps {
  point: TrackPoint;
}

export const TrackTooltip: React.FC<TrackTooltipProps> = ({ point }) => {
  const kmh = Math.round(point.windSpeed * 1.852);

  // Helper to convert lat/lng to DMS for display
  const formatDMS = (coord: number, isLat: boolean) => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    
    let direction = '';
    if (isLat) {
      direction = coord >= 0 ? 'N' : 'S';
    } else {
      direction = coord >= 0 ? 'E' : 'W';
    }
    
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  return (
    <Popup className="dark-leaflet-popup">
      <div className="bg-slate-800 text-slate-100 p-1 rounded min-w-[200px]">
        <div className="border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
          <span className="font-semibold text-cyan-400 text-sm">{point.timestamp}</span>
          {point.imdGrade && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700 text-slate-300">
              {point.imdGrade}
            </span>
          )}
        </div>
        
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Position</span>
            <span className="font-mono">
              {formatDMS(point.lat, true)}, {formatDMS(point.lon, false)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Wind</span>
            <span>
              <span className="font-semibold text-slate-100">{point.windSpeed} kts</span>
              <span className="text-slate-500 ml-1">({kmh} km/h)</span>
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-400">Pressure</span>
            <span><span className="font-semibold text-slate-100">{point.pressure}</span> hPa</span>
          </div>

          {(point.stormSpeed !== undefined || point.stormDir !== undefined) && (
            <div className="flex justify-between items-center pt-1 border-t border-slate-700/50 mt-1">
              <span className="text-slate-400">Movement</span>
              <div className="flex items-center gap-1">
                {point.stormDir !== undefined && (
                  <Navigation 
                    size={12} 
                    className="text-cyan-500 transform" 
                    style={{ transform: `rotate(${point.stormDir}deg)` }} 
                  />
                )}
                <span>{point.stormSpeed} kts</span>
              </div>
            </div>
          )}

          {point.isLandfall && (
            <div className="mt-2 text-center bg-red-500/20 text-red-400 font-semibold py-1 rounded border border-red-500/30">
              LANDFALL POINT
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};
