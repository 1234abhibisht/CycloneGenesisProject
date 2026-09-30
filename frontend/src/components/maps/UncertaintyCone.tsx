import React from 'react';
import { Polygon } from 'react-leaflet';
import type { UncertaintyCone as ConeType } from '../../types/prediction';

interface UncertaintyConeProps {
  cones: ConeType[];
  visibleHorizon?: number;
}

export const UncertaintyCone: React.FC<UncertaintyConeProps> = ({
  cones,
  visibleHorizon = 120,
}) => {
  const visibleCones = cones.filter(c => c.forecastHour <= visibleHorizon);
  if (!visibleCones || visibleCones.length === 0) return null;

  // Assuming cones array forms a polygon, or each cone object provides a polygon.
  // We'll treat cones as having a polygon property which is an array of [lat, lng].
  
  return (
    <>
      {visibleCones.map((cone, idx) => (
        <Polygon
          key={`cone-${idx}`}
          positions={cone.polygon}
          pathOptions={{
            color: '#06b6d4',
            fillColor: '#06b6d4',
            fillOpacity: 0.1,
            opacity: 0.4,
            dashArray: '5, 5',
          }}
        />
      ))}
    </>
  );
};
