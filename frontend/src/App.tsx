import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import PublicLanding from './pages/PublicLanding';
import CommandCenter from './pages/CommandCenter';
import LiveMonitoring from './pages/LiveMonitoring';
import AIForecast from './pages/AIForecast';
import WarningsImpact from './pages/WarningsImpact';
import HistoricalIntelligence from './pages/HistoricalIntelligence';
import SystemData from './pages/SystemData';
import BasinWatch from './pages/BasinWatch';
import ModelPerformance from './pages/ModelPerformance';
import { useAlerts } from './features/alerts/AlertContext';

// Pages of the workspace (same set under "/" and "/dashboard")
const pages = [
  ['command', <CommandCenter />],
  ['live', <LiveMonitoring />],
  ['basin', <BasinWatch />],
  ['forecast', <AIForecast />],
  ['warnings', <WarningsImpact variant="live" />],
  ['test-strike', <WarningsImpact variant="test" />],
  ['historical', <HistoricalIntelligence />],
  ['models', <ModelPerformance />],
  ['system', <SystemData />],
] as const;

// Old links that still arrive from bookmarks / slides
const aliases: [string, string][] = [
  ['overview', 'command'], ['track', 'forecast'], ['intensity', 'forecast'], ['environment', 'live'],
  ['environmental', 'live'], ['risk', 'warnings'], ['history', 'historical'], ['replay', 'historical'],
  ['performance', 'models'], ['data-sources', 'system'], ['data', 'system'], ['architecture', 'system'],
  ['satellite', 'live'], ['response', 'warnings'], ['sdg', 'command'],
];

function AppContent() {
  const { unreadCount } = useAlerts();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div id="live-region" className="live-region" role="status" aria-live="polite" aria-atomic="true">
        {unreadCount > 0 && `${unreadCount} new alert${unreadCount !== 1 ? 's' : ''} received`}
      </div>

      <Routes>
        <Route path="/landing" element={<PublicLanding />} />
        <Route path="/public" element={<PublicLanding />} />

        {['/', '/dashboard'].map((base) => (
          <Route key={base} path={base} element={<DashboardLayout />}>
            <Route index element={<CommandCenter />} />
            {pages.map(([path, element]) => (
              <Route key={path} path={path} element={element} />
            ))}
            {aliases.map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={`/dashboard/${to}`} replace />} />
            ))}
          </Route>
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
