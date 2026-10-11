import React from 'react';
import { GeoJSON } from 'react-leaflet';
import type { DistrictRisk, RiskLevel } from '../../types/risk';
import { getRiskLevelColor } from '../../utils/colors';

interface DistrictBoundariesProps {
  districts?: DistrictRisk[];
  data?: any[];
  onDistrictClick?: (district: DistrictRisk) => void;
  showRiskColors?: boolean;
}

export const DistrictBoundaries: React.FC<DistrictBoundariesProps> = ({
  districts,
  data,
  onDistrictClick,
  showRiskColors = true,
}) => {
  const items = districts || data || [];
  if (!items || items.length === 0) return null;

  return (
    <>
      {items.map((districtRisk, idx) => {
        const geom = (districtRisk as any).district?.geometry || (districtRisk as any).geometry;
        if (!geom) return null;

        const rawLevel = (districtRisk as any).riskLevel || (districtRisk as any).warningLevel;
        const normalizedLevel: RiskLevel = 
          rawLevel === 'HIGH' || rawLevel === 'RED' ? 'RED' :
          rawLevel === 'MODERATE' || rawLevel === 'ORANGE' ? 'ORANGE' :
          rawLevel === 'LOW' || rawLevel === 'YELLOW' ? 'YELLOW' : 'GREEN';

        const geoJsonFeature = {
          type: 'Feature' as const,
          properties: {
            name: (districtRisk as any).district?.name || (districtRisk as any).districtName,
            state: (districtRisk as any).district?.state || (districtRisk as any).state,
            riskLevel: normalizedLevel,
          },
          geometry: geom,
        };

        return (
          <GeoJSON
            key={`district-${idx}-${(districtRisk as any).district?.id || idx}`}
            data={geoJsonFeature as any}
            style={{
              fillColor: showRiskColors ? getRiskLevelColor(normalizedLevel) : 'transparent',
              fillOpacity: 0.35,
              color: '#334155',
              weight: 1.5,
            }}
            eventHandlers={{
              click: () => onDistrictClick && onDistrictClick(districtRisk),
            }}
          />
        );
      })}
    </>
  );
};
