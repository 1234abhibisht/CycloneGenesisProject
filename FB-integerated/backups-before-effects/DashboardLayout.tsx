import '../../pages/command-workspace.css';
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavigation } from './PublicNavigation';
import { PublicHero } from './PublicHero';
import '../../pages/public-site.css';
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

  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  const location = useLocation();
  
  const title = pageTitles[location.pathname] || 'Command Center';

  return (
    <div className="google-workspace observatory-shell public-site antialiased">
      <PublicNavigation />
      <div className="flex flex-col relative">
        <TopBar 
          title={title} 
          lastUpdated={lastUpdated}
          onRefresh={() => {
            setLastUpdated(new Date().toISOString());
            window.dispatchEvent(new Event('cyclone-refresh'));
          }}
        />
        <PublicHero />
        <main id="main-content" className="google-content public-main">
          <Outlet />
        </main>
        <footer className="public-footer"><span>Cyclone AI · Independent coastal weather research</span><span>North Indian Ocean · <a href="https://rsmcnewdelhi.imd.gov.in/" target="_blank" rel="noreferrer">Official IMD advisories ↗</a></span></footer>
      </div>
    </div>
  );
};
