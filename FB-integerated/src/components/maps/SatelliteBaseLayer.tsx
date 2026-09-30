import React from 'react';
import { TileLayer } from 'react-leaflet';

interface SatelliteBaseLayerProps {
  layerName: string; // GIBS layer identifier
  date: string; // YYYY-MM-DD
  opacity?: number;
  format?: 'jpg' | 'png';
  maxNativeZoom?: number;
  tileMatrixSet?: string;
}

export const SatelliteBaseLayer: React.FC<SatelliteBaseLayerProps> = ({
  layerName,
  date,
  opacity = 1,
  format = 'jpg',
  maxNativeZoom = 8,
  tileMatrixSet = 'GoogleMapsCompatible_Level9'
}) => {
  const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${date}/${tileMatrixSet}/{z}/{y}/{x}.${format}`;

  return (
    <TileLayer
      url={url}
      attribution="NASA GIBS"
      opacity={opacity}
      maxNativeZoom={maxNativeZoom}
      maxZoom={18}
      bounds={[[-85.0511287776, -180], [85.0511287776, 180]]}
    />
  );
};
