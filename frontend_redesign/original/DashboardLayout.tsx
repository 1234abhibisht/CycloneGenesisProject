import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/dashboard/command': 'Command Center',
  '/dashboard/live': 'Live Monitoring',
  '/dashboard/basin': 'Basin Watch',
  '/dashboard/forecast': 'AI Forecast',
  '/dashboard/warnings': 'Warnings & Impact',
  '/dashboard/response': '50km Response & Evacuation',
  '/dashboard/satellite': 'NASA Satellite Intelligence',
  '/dashboard/sdg': 'UN Sustainable Development Goals (SDG)',
  '/sdg': 'UN Sustainable Development Goals (SDG)',
  '/dashboard/historical': 'Historical Intelligence',
  '/dashboard/system': 'System & Data Integrity',
};

export const DashboardLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  const location = useLocation();
  
  const title = pageTitles[location.pathname] || 'Command Center';

  return (
    <div className="google-workspace flex h-dvh overflow-hidden antialiased">
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
        <main className="google-content flex-1 overflow-y-auto p-5 sm:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
