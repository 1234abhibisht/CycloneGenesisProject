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
      <div className="bg-[#E1F4F6] text-[#0B2A33] p-1 rounded min-w-[200px]">
        <div className="border-b border-[#CFE5E9] pb-2 mb-2 flex justify-between items-center">
          <span className="font-semibold text-[#0B7F8E] text-sm">{point.timestamp}</span>
          {point.imdGrade && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#CFE5E9] text-[#4A6670]">
              {point.imdGrade}
            </span>
          )}
        </div>
        
        <div className="space-y-1.5 text-xs text-[#4A6670]">
          <div className="flex justify-between">
            <span className="text-[#4A6670]">Position</span>
            <span className="font-mono">
              {formatDMS(point.lat, true)}, {formatDMS(point.lon, false)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[#4A6670]">Wind</span>
            <span>
              <span className="font-semibold text-[#0B2A33]">{point.windSpeed} kts</span>
              <span className="text-[#4A6670] ml-1">({kmh} km/h)</span>
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-[#4A6670]">Pressure</span>
            <span><span className="font-semibold text-[#0B2A33]">{point.pressure}</span> hPa</span>
          </div>

          {(point.stormSpeed !== undefined || point.stormDir !== undefined) && (
            <div className="flex justify-between items-center pt-1 border-t border-[#CFE5E9]/50 mt-1">
              <span className="text-[#4A6670]">Movement</span>
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
            <div className="mt-2 text-center bg-red-500/20 text-[#B8322B] font-semibold py-1 rounded border border-red-500/30">
              LANDFALL POINT
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};
