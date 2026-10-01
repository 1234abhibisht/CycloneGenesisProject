import { useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CloudRain, CloudSun, Waves, ShieldCheck, Pause, Play } from 'lucide-react';
import { useCyclone } from '../../hooks/useCyclone';

const content: Record<string, [string, string, string]> = {
  'test-strike':['TEST STORMS / DISTRICT STRIKE','Past storms.\nChecked against reality.','Pick a 2007-08 test storm the model never saw and compare its district strike chances with where the storm really went.'],
  warnings: ['WARNINGS & PREPAREDNESS', 'Know what’s ahead.\nPrepare with confidence.', 'Find your coastal district, understand the information available, and follow official local guidance.'],
  command: ['YOUR COAST. YOUR WEATHER.', 'A clearer forecast.\nA better prepared coast.', 'Understand tropical cyclones with accessible maps, weather observations and the context behind each forecast.'],
  live: ['OCEAN & ATMOSPHERE', 'See the conditions\nshaping our weather.', 'Explore ocean temperature, winds and moisture together to understand the environment around a storm.'],
  forecast: ['TRACK & INTENSITY', 'Follow the path.\nUnderstand the possibilities.', 'Explore the forecast alongside its uncertainty. A predicted track is a range of possibilities, not a promise.'],
  historical: ['THE STORM ARCHIVE', 'Past storms.\nLasting lessons.', 'Explore historical cyclone records and learn how storms have changed across our oceans.'],
};

const drops = Array.from({ length: 40 }, (_, i) => ({
  '--rain-x': `${(i * 37) % 101}%`,
  '--rain-delay': `${-((i * 13) % 29) / 10}s`,
  '--rain-duration': `${1.4 + (i % 7) * 0.13}s`,
  '--rain-length': `${25 + (i % 5) * 9}px`,
  '--rain-rest': `${(i * 23) % 95}%`,
} as CSSProperties));

export function PublicHeroView({ activeCycloneName }: { activeCycloneName?: string }) {
  const { pathname } = useLocation();
  const [rainPaused, setRainPaused] = useState(false);
  const raining = Boolean(activeCycloneName);
  const key = pathname.split('/').filter(Boolean).pop() || 'command';
  const copy = content[key] || ['CYCLONE AI / COASTAL INTELLIGENCE', 'Weather information.\nMade easier to understand.', 'Explore the observations, research and tools that help put tropical cyclone information in context.'];
  const WeatherIcon = raining ? CloudRain : CloudSun;

  return (
    <section className={`public-hero${raining ? ' public-hero--raining' : ''}${rainPaused ? ' rain-paused' : ''}`}>
      {raining && <div className="hero-rain" aria-hidden="true">{drops.map((style, i) => <span key={i} style={style} />)}</div>}
      <div className="hero-copy">
        <span className="hero-kicker"><WeatherIcon size={17} />{copy[0]}</span>
        <h1>{copy[1]}</h1>
        <p>{copy[2]}</p>
        <div className="hero-actions">
          <Link to={key === 'warnings' ? '#district-directory' : '/dashboard/warnings'} onClick={key === 'warnings' ? e => {
            e.preventDefault();
            document.getElementById('district-directory')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          } : undefined}>{key === 'warnings' ? 'Find your district' : 'Explore warnings & safety'}<ArrowRight size={16} /></Link>
          <a href="https://rsmcnewdelhi.imd.gov.in/" target="_blank" rel="noreferrer">Read official advisories ↗</a>
        </div>
      </div>
      {raining && <button type="button" className="rain-toggle" aria-pressed={rainPaused} aria-label={rainPaused ? 'Resume rain animation' : 'Pause rain animation'} onClick={() => setRainPaused(paused => !paused)}>
        {rainPaused ? <Play size={12} /> : <Pause size={12} />}{rainPaused ? 'Resume rain' : 'Pause rain'}
      </button>}
      <div className="hero-caption">
        {raining ? <CloudRain size={18} /> : <Waves size={18} />}
        <span>{raining ? `Tracking ${activeCycloneName}` : 'North Indian Ocean'}<small>{raining ? 'Active cyclone · live data' : 'Bay of Bengal & Arabian Sea'}</small></span>
        <span className="decorative-label">{raining ? 'Illustrative rain · not local rainfall' : 'Illustrative atmosphere'}</span>
      </div>
      <div className="hero-trust"><ShieldCheck size={15} /><span>Independent research platform · Official warnings are issued by IMD and local authorities.</span></div>
    </section>
  );
}

export function PublicHero() {
  const { cyclone, hasActiveCyclone, status, error } = useCyclone();
  // Historical/replay data and stale observations must not suggest a current storm.
  const raining = hasActiveCyclone && status === 'LIVE' && !error &&
    cyclone?.status === 'active' && cyclone.dataSource === 'live' && !cyclone.isReplay;
  return <PublicHeroView activeCycloneName={raining ? cyclone.name || 'active cyclone' : undefined} />;
}
