import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { clsx } from 'clsx';

interface CycloneMarkerProps {
  position: [number, number];
  windSpeed: number;
  name?: string;
  isActive?: boolean;
}

export const CycloneMarker: React.FC<CycloneMarkerProps> = ({
  position,
  windSpeed,
  name = 'Unnamed System',
  isActive = true,
}) => {
  const size = windSpeed > 100 ? 'w-16 h-16 text-6xl' : windSpeed > 50 ? 'w-12 h-12 text-4xl' : 'w-8 h-8 text-2xl';
  const animationClass = isActive ? 'animate-spin' : '';

  const icon = L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="${clsx('flex items-center justify-center text-cyan-500 drop-shadow-lg', size, animationClass)}" style="animation-duration: 3s;">🌀</div>`,
    iconSize: [64, 64], // generous size for the container
    iconAnchor: [32, 32],
  });

  return (
    <Marker position={position} icon={icon}>
      <Tooltip direction="top" offset={[0, -20]} opacity={1} className="dark-leaflet-tooltip bg-slate-800 text-slate-100 border-slate-700">
        <div className="font-semibold text-center">
          <div className="text-cyan-400">{name}</div>
          <div className="text-xs text-slate-400">{windSpeed} kts</div>
        </div>
      </Tooltip>
    </Marker>
  );
};
