import type { MouseEvent } from 'react';
import { ArrowRight, CloudSun, Waves, ShieldCheck } from 'lucide-react';
import '../../pages/public-site.css';

/** The public site's hero banner (cloud image, serif quote, action buttons), used at the top of dashboard pages. */
export function DashboardHero({ kicker, title, text, actionLabel, targetId }: {
  kicker: string; title: string; text: string; actionLabel: string; targetId: string;
}) {
  const jump = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(targetId)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  };
  return (
    <section className="public-hero public-hero--dashboard">
      <div className="hero-copy">
        <span className="hero-kicker"><CloudSun size={17} />{kicker}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="hero-actions">
          <a href={`#${targetId}`} onClick={jump}>{actionLabel}<ArrowRight size={16} /></a>
          <a href="https://rsmcnewdelhi.imd.gov.in/" target="_blank" rel="noreferrer">Read official advisories ↗</a>
        </div>
      </div>
      <div className="hero-caption">
        <Waves size={18} />
        <span>North Indian Ocean<small>Bay of Bengal & Arabian Sea</small></span>
        <span className="decorative-label">Illustrative atmosphere</span>
      </div>
      <div className="hero-trust"><ShieldCheck size={15} /><span>Independent research platform · Official warnings are issued by IMD and local authorities.</span></div>
    </section>
  );
}
