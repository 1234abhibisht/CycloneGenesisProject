import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Globe2, Layers, Target } from 'lucide-react';
import './command-workspace.css';

/**
 * SDG alignment, in the same visual language as the Overview page.
 * Every figure here is either a documented model result (2007-08 unseen test storms)
 * or a plain description of what the system does. Nothing is projected or invented.
 */

interface Goal {
  n: number;
  title: string;
  color: string;
  role: 'Direct' | 'Supporting';
  summary: string;
  targets: { code: string; title: string; how: string }[];
  evidence: { label: string; value: string; note: string }[];
}

const GOALS: Goal[] = [
  {
    n: 13, title: 'Climate Action', color: '#3F7E44', role: 'Direct',
    summary: 'Earlier, clearer cyclone guidance for the Bay of Bengal and Arabian Sea strengthens adaptive capacity to climate-related hazards.',
    targets: [
      { code: '13.1', title: 'Resilience and adaptive capacity to climate hazards',
        how: 'Basin-wide screening of where a cyclone may form within 200 km in the next 24 h, plus 24 h track and intensity predictions.' },
      { code: '13.3', title: 'Education and awareness on early warning',
        how: 'Plain-language pages explain forecasts, uncertainty and what each warning colour means, and point to IMD for official advice.' },
    ],
    evidence: [
      { label: 'Formation events caught', value: '96%', note: 'Unseen 2007-08 test years, 0.09 false-alarm zones per forecast' },
      { label: '24 h track error', value: '126 km', note: '23% lower than the CLIPER benchmark (164 km)' },
      { label: '24 h wind error', value: '8.4 kt', note: '23% lower than the SHIFOR benchmark (10.9 kt)' },
    ],
  },
  {
    n: 11, title: 'Sustainable Cities & Communities', color: '#FD9D24', role: 'Direct',
    summary: 'District-level strike probabilities help coastal administrations see which communities may be affected and when.',
    targets: [
      { code: '11.5', title: 'Reduce deaths and losses from disasters',
        how: 'Risk information for each coastal district from West Bengal to Gujarat, based on how close the predicted track passes.' },
      { code: '11.b', title: 'Integrated disaster risk management',
        how: 'Red / orange / yellow / green tiers give planners one consistent, explainable scale across states.' },
    ],
    evidence: [
      { label: 'District strike skill', value: '61%', note: 'Brier skill vs climatology, 0-24 h, 2007-08 test years' },
      { label: 'Coastal districts covered', value: '49', note: 'West Bengal to Gujarat' },
      { label: 'Warning tiers', value: '4', note: 'Red ≥ 50%, orange ≥ 25%, yellow ≥ 10%, green' },
    ],
  },
  {
    n: 3, title: 'Good Health & Well-Being', color: '#4C9F38', role: 'Supporting',
    summary: 'Timely risk information supports health-system preparedness ahead of a landfall.',
    targets: [
      { code: '3.d', title: 'Early warning and risk management for health risks',
        how: 'Hospitals and health departments can use the district outlook to plan staffing and supplies; official orders still come from authorities.' },
    ],
    evidence: [
      { label: 'Forecast horizon', value: '24 h', note: 'Research prediction of track and wind at +24 hours' },
    ],
  },
  {
    n: 9, title: 'Industry, Innovation & Infrastructure', color: '#F36E25', role: 'Supporting',
    summary: 'An open, reproducible machine-learning pipeline built on public reanalysis and forecast data.',
    targets: [
      { code: '9.5', title: 'Enhance scientific research and technology',
        how: 'Gradient-boosted models trained on ERA5 (1990-2008) and IBTrACS, verified on storms never used in training.' },
      { code: '9.1', title: 'Resilient infrastructure',
        how: 'Ports, power and telecom operators can read the same outlook as planners, with the model error stated alongside.' },
    ],
    evidence: [
      { label: 'Training data', value: '19 yr', note: 'ERA5 reanalysis 1990-2008 + IBTrACS best tracks' },
      { label: 'Historical storms', value: '463', note: 'North Indian Ocean storms available for replay' },
    ],
  },
  {
    n: 14, title: 'Life Below Water', color: '#0A97D9', role: 'Supporting',
    summary: 'Marine warnings matter for fishing communities; basin-wide formation chances show where storms may develop at sea.',
    targets: [
      { code: '14.b', title: 'Support for small-scale fishers',
        how: 'The occurrence map covers open sea across both basins, not only the coastline.' },
    ],
    evidence: [
      { label: 'Sea area mapped', value: '0.5° grid', note: '5-35°N, 55-100°E' },
    ],
  },
  {
    n: 17, title: 'Partnerships for the Goals', color: '#19486A', role: 'Supporting',
    summary: 'Built entirely on openly shared data from international agencies, and designed to complement, never replace, IMD.',
    targets: [
      { code: '17.18', title: 'Availability of high-quality data',
        how: 'Uses Copernicus ERA5, NOAA IBTrACS and other open sources; the code and trained models are published openly.' },
    ],
    evidence: [
      { label: 'Core open datasets', value: '2', note: 'Copernicus ERA5 reanalysis and NOAA IBTrACS' },
    ],
  },
];

const SENDAI = [
  ['Target G', 'Increase availability of multi-hazard early warning systems and risk information.'],
  ['Priority 1', 'Understanding disaster risk: probabilities are published with their measured error.'],
  ['Priority 4', 'Enhancing preparedness: district outlooks up to 24 h ahead of closest approach.'],
];

export default function SDGImpactDashboard() {
  const [selected, setSelected] = useState<number>(13);
  const goal = GOALS.find((g) => g.n === selected) ?? GOALS[0];

  return <div className="basin-workspace">
    <div className="basin-heading"><div><p className="eyebrow">IMPACT / UN 2030 AGENDA</p><h1>Why this matters beyond the forecast.</h1><p className="basin-intro">How the system supports the Sustainable Development Goals and the Sendai Framework.</p></div><Link className="basin-link" to="/dashboard/models">Model evidence <ArrowUpRight size={16}/></Link></div>

    <div className="basin-status" role="status"><span className="status-dot"/><strong>{GOALS.filter((g) => g.role === 'Direct').length} goals directly supported · {GOALS.length - 2} supporting</strong><span>Figures come from the unseen 2007-08 test storms, not projections</span></div>

    <div className="basin-grid">
      <section className="basin-map-panel" aria-label="Sustainable Development Goals">
        <div className="panel-heading"><div><span className="eyebrow">01 / GOALS</span><h2>SDG {goal.n} · {goal.title}</h2></div><span className="map-region"><Globe2 size={15}/> {goal.role} contribution</span></div>

        <div className="forecast-strip" style={{ borderTop: 0, paddingTop: 0 }}>
          <span className="eyebrow">SELECT A GOAL</span>
          <div style={{ flexWrap: 'wrap' }}>
            {GOALS.map((g) => (
              <button key={g.n} aria-pressed={g.n === selected} onClick={() => setSelected(g.n)} title={g.title}
                style={g.n === selected ? { background: g.color, color: '#fff' } : undefined}>SDG {g.n}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 22px 8px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', margin: '6px 0 18px' }}>
            <span aria-hidden="true" style={{ minWidth: 46, height: 46, borderRadius: 6, background: goal.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18 }}>{goal.n}</span>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4f6a78' }}>{goal.summary}</p>
          </div>

          <span className="eyebrow">UN TARGETS</span>
          {goal.targets.map((t) => (
            <div key={t.code} className="brief-details"><div style={{ display: 'block' }}>
              <dt style={{ fontSize: 12, fontWeight: 600, color: '#234b60', display: 'flex', gap: 8, alignItems: 'center' }}><Target size={13}/> Target {t.code} · {t.title}</dt>
              <dd style={{ textAlign: 'left', fontSize: 12, lineHeight: 1.7, color: '#657e8e', marginTop: 4 }}>{t.how}</dd>
            </div></div>
          ))}
        </div>

        <div className="map-legend" style={{ flexWrap: 'wrap', gap: 0, padding: 0, borderTop: '1px solid #e5e9e1' }}>
          {goal.evidence.map((e) => (
            <div key={e.label} style={{ flex: '1 1 200px', padding: '18px 22px', borderRight: '1px solid #e5e9e1' }}>
              <span className="eyebrow">{e.label.toUpperCase()}</span>
              <div className="wind-reading" style={{ margin: '8px 0 4px' }}><strong style={{ fontSize: 34, letterSpacing: -1 }}>{e.value}</strong></div>
              <span style={{ fontSize: 11, color: '#6b7a70' }}>{e.note}</span>
            </div>
          ))}
        </div>
      </section>

      <aside className="storm-brief">
        <div className="brief-top"><span className="eyebrow">02 / FRAMEWORKS</span><span className="brief-tag">SENDAI 2015-2030</span></div>
        <h2>Early warning for all.</h2>
        <p>The system is designed to add information for planners, not to replace official warnings from IMD / RSMC New Delhi.</p>
        <dl className="brief-details">
          {SENDAI.map(([k, v]) => <div key={k}><dt>{k}</dt><dd style={{ maxWidth: 170 }}>{v}</dd></div>)}
          <div><dt>UN initiative</dt><dd style={{ maxWidth: 170 }}>Early Warnings for All (EW4All)</dd></div>
        </dl>
        <div className="forecast-note"><span className="eyebrow">WHAT WE DO NOT CLAIM</span><h3>No storm-surge or evacuation model.</h3><p>Forecasts reach 24 hours. Rapid intensification is experimental. Evacuation decisions belong to district authorities.</p></div>
        <Link className="brief-action" to="/dashboard/warnings">See district strike risk <ArrowUpRight size={16}/></Link>
      </aside>
    </div>

    <section className="workspace-paths" aria-label="Related pages">{[
      { n: '03', title: 'Basin watch', body: 'Chance of a cyclone forming within 200 km in the next 24 hours.', to: 'basin' },
      { n: '04', title: 'Warnings & impact', body: 'Strike probability for every coastal district.', to: 'warnings' },
      { n: '05', title: 'Data & provenance', body: 'Where the data comes from and how the models were checked.', to: 'system' },
    ].map((it) => <Link key={it.n} to={`/dashboard/${it.to}`}><span className="eyebrow">{it.n} / EXPLORE</span><h3>{it.title}<ArrowUpRight size={18}/></h3><p>{it.body}</p></Link>)}</section>

    <footer className="basin-footer"><span><Layers size={13}/> Cyclone AI · Research workspace</span><span>For official warnings, consult <a href="https://rsmcnewdelhi.imd.gov.in/" target="_blank" rel="noreferrer">IMD / RSMC New Delhi ↗</a></span></footer>
  </div>;
}
