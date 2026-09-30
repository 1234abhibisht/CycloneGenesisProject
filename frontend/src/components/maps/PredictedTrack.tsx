import React from 'react';
import { Polyline, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { ForecastPoint } from '../../types/prediction';

interface PredictedTrackProps {
  forecastPoints: ForecastPoint[];
  visibleHorizon?: number; // show points up to this hour
  selectedStep?: number;
  onSelectPoint?: (point: ForecastPoint) => void;
  origin?: [number, number]; // current storm position, so the line starts at the storm
}

export const PredictedTrack: React.FC<PredictedTrackProps> = ({
  forecastPoints,
  visibleHorizon = 24,
  selectedStep,
  onSelectPoint,
  origin,
}) => {
  const visiblePoints = forecastPoints.filter(p => p.forecastHour <= visibleHorizon);
  if (!visiblePoints || visiblePoints.length === 0) return null;

  const positions: [number, number][] = [...(origin ? [origin] : []), ...visiblePoints.map(p => [p.lat, p.lon] as [number, number])];

  return (
    <>
      {/* Uncertainty Cone / Area Circles along forecast track */}
      {visiblePoints.map((point, idx) => {
        // radius that contained 67 % of the model's 2003-2006 track errors at this lead
        const radiusKm = point.uncertainty;
        if (!radiusKm) return null;
        return (
          <Circle
            key={`pred-cone-${idx}`}
            center={[point.lat, point.lon]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#F59E0B',
              fillColor: '#F59E0B',
              fillOpacity: 0.06,
              weight: 1,
              dashArray: '3, 4'
            }}
          />
        );
      })}

      {/* Main Projected Trajectory Polyline: Dashed Orange/Yellow per Section 9 */}
      <Polyline
        positions={positions}
        color="#F59E0B"
        weight={2.5}
        dashArray="6, 6"
      />

      {/* Small Circular Markers with Discrete T+ Labels per Section 9 */}
      {visiblePoints.map((point, idx) => {
        const isSelected = selectedStep === point.forecastHour;
        const isKeyMilestone = [6, 12, 18, 24].includes(point.forecastHour);
        
        const icon = L.divIcon({
          className: 'bg-transparent border-0',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="${isSelected ? 'w-4 h-4 bg-amber-400 ring-4 ring-amber-500/30' : 'w-2.5 h-2.5 bg-amber-400 border border-[#F2FAFB]'} rounded-full shadow-md transition-all"></div>
              ${isKeyMilestone ? `<span class="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-sans font-semibold text-[#A15C07] whitespace-nowrap drop-shadow bg-[#F2FAFB]/80 px-1 py-0.2 rounded">T+${point.forecastHour}</span>` : ''}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const radiusKm = point.uncertainty;

        return (
          <Marker 
            key={`pred-pt-${idx}`} 
            position={[point.lat, point.lon]} 
            icon={icon}
            eventHandlers={{
              click: () => {
                if (onSelectPoint) onSelectPoint(point);
              }
            }}
          >
            <Popup className="dark-leaflet-popup">
              <div className="text-xs p-1">
                <div className="font-semibold text-[#A15C07] border-b border-white/10 pb-1 mb-1">
                  +{point.forecastHour}h Forecast Intercept
                </div>
                <div className="space-y-0.5 text-[#0B2A33]">
                  <p>Coordinates: <span className="font-mono font-medium">{point.lat.toFixed(2)}°N, {point.lon.toFixed(2)}°E</span></p>
                  {point.predictedWind != null && (
                    <p>Wind: <span className="font-mono font-bold text-[#A15C07]">{Math.round(point.predictedWind)} kt</span> ({Math.round(point.predictedWind * 1.852)} km/h){point.predictedIMDGrade ? ` · ${point.predictedIMDGrade}` : ''}</p>
                  )}
                  {point.windChange != null && (
                    <p>Change from now: <span className="font-mono">{point.windChange > 0 ? '+' : ''}{Math.round(point.windChange)} kt</span></p>
                  )}
                  {radiusKm ? <p className="text-[11px] text-[#4A6670]">Uncertainty radius (67 %): ±{Math.round(radiusKm)} km</p> : null}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

