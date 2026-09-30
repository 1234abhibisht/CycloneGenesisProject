import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { twMerge } from 'tailwind-merge';
import { Layers, Satellite, Map as MapIcon, Compass } from 'lucide-react';

interface CycloneMapProps {
  center?: [number, number]; // default [15, 85] - Bay of Bengal
  zoom?: number; // default 5
  className?: string;
  children?: React.ReactNode;
  showLayerControl?: boolean;
}

export type TileStyle = 'dark' | 'satellite' | 'terrain';

const TILE_PROVIDERS = {
  dark: {
    name: 'OpenStreetMap Base Map',
    // Deliberately use the public OSM tile endpoint: no account, key, or token prompt.
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  satellite: {
    name: 'Esri World Imagery (HD Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
  },
  terrain: {
    name: 'Ocean & Land Topo',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

// Helper component that dynamically flies/pans map when center coordinates change
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  const [latitude, longitude] = center;
  useEffect(() => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      // Data refreshes should update the map position quietly. Animated
      // recentering is distracting when the feed changes or reconnects.
      map.setView([latitude, longitude], zoom, { animate: false });
    }
  }, [latitude, longitude, zoom, map]);
  return null;
};

export const CycloneMap: React.FC<CycloneMapProps> = ({
  center = [15, 85],
  zoom = 5,
  className,
  children,
  showLayerControl = true,
}) => {
  const [activeTile, setActiveTile] = useState<TileStyle>('dark');
  const [showMenu, setShowMenu] = useState<boolean>(false);

  return (
    <div className={twMerge('w-full h-full rounded-xl overflow-hidden relative border border-[#1E3A5F]', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={activeTile}
          attribution={TILE_PROVIDERS[activeTile].attribution}
          url={TILE_PROVIDERS[activeTile].url}
          maxZoom={TILE_PROVIDERS[activeTile].maxZoom}
        />
        <ZoomControl position="bottomright" />
        <MapViewController center={center} zoom={zoom} />
        {children}
      </MapContainer>

      {/* Map style selector — all listed basemaps work without configuration. */}
      {showLayerControl && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end font-mono">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0D1B2A]/90 hover:bg-[#102235] border border-[#1E3A5F] rounded-md text-xs text-slate-200 shadow-xl backdrop-blur-md transition cursor-pointer"
            title="Switch Map Tiles (Satellite / NASA Dark / Topo)"
          >
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {activeTile === 'satellite' ? 'Satellite' : activeTile === 'dark' ? 'Standard map' : 'Terrain'}
            </span>
          </button>

          {showMenu && (
            <div className="mt-1.5 p-2 bg-[#0D1B2A]/95 backdrop-blur-md border border-[#1E3A5F] rounded-lg shadow-2xl space-y-1 w-44">
              <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase border-b border-[#1E3A5F]/60">
                Map Basemap
              </div>
              <button
                onClick={() => { setActiveTile('dark'); setShowMenu(false); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs cursor-pointer transition ${activeTile === 'dark' ? 'bg-sky-500/20 text-[#38BDF8] font-bold border border-sky-500/40' : 'text-slate-300 hover:bg-[#102235]'}`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Standard Map</span>
              </button>

              <button
                onClick={() => { setActiveTile('satellite'); setShowMenu(false); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs cursor-pointer transition ${activeTile === 'satellite' ? 'bg-sky-500/20 text-[#38BDF8] font-bold border border-sky-500/40' : 'text-slate-300 hover:bg-[#102235]'}`}
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>HD Satellite (Esri)</span>
              </button>

              <button
                onClick={() => { setActiveTile('terrain'); setShowMenu(false); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs cursor-pointer transition ${activeTile === 'terrain' ? 'bg-sky-500/20 text-[#38BDF8] font-bold border border-sky-500/40' : 'text-slate-300 hover:bg-[#102235]'}`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Land & Ocean Topo</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
