import type { SatelliteLayer } from '../types/satellite';

export const satelliteLayers: SatelliteLayer[] = [
  { id: 'viirs-snpp-true-color', name: 'VIIRS SNPP True Color', description: 'High resolution daytime imagery from Suomi NPP', layerName: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', format: 'jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxNativeZoom: 9, category: 'trueColor', isOverlay: false },
  { id: 'modis-terra-true-color', name: 'MODIS Terra True Color', description: 'Morning orbit true color composite (Terra)', layerName: 'MODIS_Terra_CorrectedReflectance_TrueColor', format: 'jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxNativeZoom: 9, category: 'trueColor', isOverlay: false },
  { id: 'modis-aqua-true-color', name: 'MODIS Aqua True Color', description: 'Afternoon orbit true color composite (Aqua)', layerName: 'MODIS_Aqua_CorrectedReflectance_TrueColor', format: 'jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxNativeZoom: 9, category: 'trueColor', isOverlay: false },
  { id: 'modis-terra-bands721', name: 'MODIS Bands 7-2-1 False Color', description: 'Enhanced convection and ice cloud separation', layerName: 'MODIS_Terra_CorrectedReflectance_Bands721', format: 'jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxNativeZoom: 9, category: 'trueColor', isOverlay: false },
  { id: 'sst', name: 'Sea Surface Temperature', description: 'GHRSST Level 4 global sea surface temperature', layerName: 'GHRSST_L4_MUR_Sea_Surface_Temperature', format: 'png', tileMatrixSet: 'GoogleMapsCompatible_Level7', maxNativeZoom: 7, category: 'sst', isOverlay: true },
  { id: 'cloud-top-temp', name: 'Cloud Top Temperature', description: 'Thermal infrared cloud-top brightness temperature', layerName: 'MODIS_Terra_Cloud_Top_Temperature_Day', format: 'png', tileMatrixSet: 'GoogleMapsCompatible_Level7', maxNativeZoom: 7, category: 'infrared', isOverlay: true },
  { id: 'imerg-precip', name: 'IMERG Precipitation Rate', description: 'GPM satellite precipitation rate estimates', layerName: 'GPM_3IMERGHHL_Precipitation_Rate', format: 'png', tileMatrixSet: 'GoogleMapsCompatible_Level6', maxNativeZoom: 6, category: 'precipitation', isOverlay: true },
  { id: 'reference-features', name: 'Reference Coastlines & Borders', description: 'High-contrast global coastlines and boundaries', layerName: 'Reference_Features_15m', format: 'png', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxNativeZoom: 9, category: 'reference', isOverlay: true },
  { id: 'reference-labels', name: 'Reference Labels', description: 'City and region place labels', layerName: 'Reference_Labels_15m', format: 'png', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxNativeZoom: 9, category: 'reference', isOverlay: true },
];

export const buildGIBSUrl = (layer: SatelliteLayer, date: string): string => {
  const baseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
  return `${baseUrl}/${layer.layerName}/default/${date}/${layer.tileMatrixSet}/{z}/{y}/{x}.${layer.format}`;
};
