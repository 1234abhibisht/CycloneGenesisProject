import { useState, type MouseEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Menu, X, ArrowUpRight } from 'lucide-react';
import '../../pages/public-site.css';

// Same pages as the former sidebar, shown as a header (same style as the public site header).
const mainLinks: [string, string][] = [
  ['command', 'Overview'],
  ['live', 'Live monitoring'],
  ['basin', 'Basin watch'],
  ['forecast', 'Forecast (6-24 h)'],
  ['warnings', 'District strike rate (live)'],
];
const exploreLinks: [string, string][] = [
  ['historical', 'Forecast (Test Storms)'],
  ['test-strike', 'District Strike Rate (Test Storms)'],
  ['models', 'Model performance'],
  ['system', 'Data & sources'],
];

export function DashboardNavigation() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const current = pathname.split('/').filter(Boolean).pop() || 'command';
  const exploreActive = exploreLinks.some(([path]) => path === current);
  const close = (e?: MouseEvent<HTMLElement>) => {
    setOpen(false);
    e?.currentTarget.closest('details')?.removeAttribute('open');
  };
  return (
    <header className="public-navigation">
      <NavLink to="/" end className="public-brand" onClick={() => setOpen(false)}>
        <Compass size={32} strokeWidth={1.5} />
        <span>Cyclone<span className="brand-light"> AI</span><small>UNDERSTAND. PREPARE. STAY INFORMED.</small></span>
      </NavLink>
      <button className="public-menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav aria-label="Main navigation" className={open ? 'public-menu is-open' : 'public-menu'}>
        {mainLinks.map(([path, title]) => (
          <NavLink key={path} to={`/dashboard/${path}`} onClick={() => setOpen(false)}
            className={({ isActive }) => (isActive || (path === 'command' && pathname === '/dashboard') ? 'active' : '')}>
            {title}
          </NavLink>
        ))}
        <details>
          <summary className={exploreActive ? 'active' : ''}>Explore</summary>
          <div className="explore-menu">
            {exploreLinks.map(([path, title]) => (
              <NavLink key={path} to={`/dashboard/${path}`} onClick={close}>{title}</NavLink>
            ))}
          </div>
        </details>
      </nav>
      <a className="official-nav" href="https://rsmcnewdelhi.imd.gov.in/" target="_blank" rel="noreferrer">
        Official advisories <ArrowUpRight size={15} />
      </a>
    </header>
  );
}
