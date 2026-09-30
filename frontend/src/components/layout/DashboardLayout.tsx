import '../../pages/command-workspace.css';
import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const pageTitles: Record<string, string> = {
  command: 'Overview',
  live: 'Live Monitoring',
  basin: 'Basin Watch · 24 h formation chance',
  forecast: 'Track & Intensity Forecast (6-24 h)',
  warnings: 'District Strike Risk',
  historical: 'Test-Storm Replay',
  models: 'Model Performance',
  system: 'Data & Sources',
};

export const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  // Bumped after a Live/Replay switch or a manual refresh: remounting the page
  // makes every hook on it refetch, so no page can keep the previous mode's data.
  const [viewKey, setViewKey] = useState(0);
  const drops = useMemo(() => Array.from({ length: 64 }, (_, i) => ({
    left: `${(i * 37 + 11) % 100}%`,
    height: `${40 + ((i * 53) % 55)}px`,
    opacity: 0.14 + ((i * 29) % 25) / 100,
    duration: `${0.95 + ((i * 17) % 70) / 100}s`,
    delay: `-${((i * 41) % 170) / 100}s`,
  })), []);
  const location = useLocation();
  
  const page = location.pathname.split('/').filter(Boolean).pop() || 'command';
  const title = pageTitles[page] || 'Overview';

  return (
    <div className="google-workspace observatory-shell flex h-dvh overflow-hidden antialiased">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <TopBar 
          title={title} 
          lastUpdated={lastUpdated}
          onRefresh={() => {
            setLastUpdated(new Date().toISOString());
            setViewKey((k) => k + 1);
          }}
        />
        <div className="monsoon-rain" aria-hidden="true">
          {drops.map((d, i) => (
            <span key={i} style={{ left: d.left, height: d.height, opacity: d.opacity, animationDuration: d.duration, animationDelay: d.delay }} />
          ))}
        </div>
        <main id="main-content" className="google-content flex-1 overflow-y-auto p-5 sm:p-8 xl:p-10">
          <div key={viewKey} className="monsoon-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
