import '../../pages/command-workspace.css';
import React, { useState } from 'react';
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
            window.dispatchEvent(new Event('cyclone-refresh'));
          }}
        />
        <main id="main-content" className="google-content flex-1 overflow-y-auto p-5 sm:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
