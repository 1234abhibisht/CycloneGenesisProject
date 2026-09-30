export interface SatelliteLayer {
  id: string;
  name: string;
  description: string;
  layerName: string; // GIBS layer identifier
  format: 'jpg' | 'png';
  tileMatrixSet: string;
  maxNativeZoom: number;
  category: 'trueColor' | 'infrared' | 'sst' | 'precipitation' | 'reference';
  isOverlay: boolean;
}

export interface SatelliteViewConfig {
  selectedLayer: string;
  date: string; // YYYY-MM-DD
  opacity: number;
  comparisonDate?: string;
}
