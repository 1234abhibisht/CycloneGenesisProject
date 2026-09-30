import React from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import type { TrackPoint } from '../../types/cyclone';
import { getCycloneTrackColor } from '../../utils/colors';

interface ObservedTrackProps {
  track: TrackPoint[];
  showMarkers?: boolean;
  showLabels?: boolean;
}

export const ObservedTrack: React.FC<ObservedTrackProps> = ({
  track,
  showMarkers = true,
  showLabels: _showLabels = true,
}) => {
  if (!track || track.length === 0) return null;

  const positions: [number, number][] = track.map(p => [p.lat, p.lon]);

  return (
    <>
      <Polyline positions={positions} color="#38BDF8" weight={3} opacity={0.9} />
      {showMarkers && track.map((point, idx) => (
        <CircleMarker
          key={`track-pt-${idx}`}
          center={[point.lat, point.lon]}
          radius={point.windSpeed > 100 ? 10 : point.windSpeed > 50 ? 8 : 6}
          color={getCycloneTrackColor(point.windSpeed)}
          fillColor={getCycloneTrackColor(point.windSpeed)}
          fillOpacity={0.9}
          weight={2}
        >
          <Popup className="dark-leaflet-popup">
            <div className="text-sm">
              <p className="font-bold">{point.timestamp}</p>
              <p>Position: {point.lat.toFixed(2)}°N, {point.lon.toFixed(2)}°E</p>
              <p>Wind Speed: {point.windSpeed} knots</p>
              <p>Pressure: {point.pressure} hPa</p>
              <p>Grade: {point.imdGrade}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};
