import { useState } from 'react';

export function useMapLayers() {
  const [layers, setLayers] = useState({
    satellite: true,
    observedTrack: true,
    predictedTrack: true,
    uncertaintyCone: true,
    districts: false,
    riskZones: false,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return { layers, toggleLayer, setLayers };
}
