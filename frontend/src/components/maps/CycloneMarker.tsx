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
      <Tooltip direction="top" offset={[0, -20]} opacity={1} className="dark-leaflet-tooltip bg-[#E1F4F6] text-[#0B2A33] border-[#CFE5E9]">
        <div className="font-semibold text-center">
          <div className="text-[#0B7F8E]">{name}</div>
          <div className="text-xs text-[#4A6670]">{windSpeed} kts</div>
        </div>
      </Tooltip>
    </Marker>
  );
};
