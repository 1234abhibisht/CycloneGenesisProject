import { satelliteLayers, buildGIBSUrl } from '../data/satelliteLayers';
import type { SatelliteLayer } from '../types/satellite';

export function getAvailableLayers(): SatelliteLayer[] {
  return satelliteLayers;
}

export function buildLayerUrl(layerId: string, date: string): string {
  const layer = satelliteLayers.find(l => l.id === layerId) || satelliteLayers[0];
  return buildGIBSUrl(layer, date);
}

export function getDefaultDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}
