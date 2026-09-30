import { useEffect, useRef, useState } from 'react';
import { CloudRain } from 'lucide-react';

/**
 * Decorative weather layer for the dashboard:
 *   - a satellite-style tropical cyclone: hundreds of soft cloud puffs on spiral rain bands,
 *     rotating counter-clockwise (northern hemisphere), inner bands faster than outer ones,
 *     a clear eye and a bright eyewall
 *   - thunderstorm: branching lightning bolts with glow, a sky flash and eyewall lightning
 *   - wind-driven rain steered by the cursor:
 *       cursor left/right of centre -> rain slants that way
 *       fast cursor movement        -> gusts (faster, more slanted rain, more lightning)
 * Purely visual: pointer-events are off, so the page underneath works exactly as before.
 * Respects "reduce motion" (static storm, no flashes) and has an on/off switch remembered per browser.
 */

interface Drop { x: number; y: number; len: number; speed: number; alpha: number; width: number }
interface Puff { r: number; th: number; size: number; shade: number; alpha: number; band: number }
interface Bolt { segs: [number, number, number, number, number][]; life: number; max: number }

const STORAGE_KEY = 'cyclone-weather-effects';
const readPref = () => {
  try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch { return true; }
};

/** soft round cloud sprite (drawn once, reused for every puff) */
function makePuffSprite(size: number, rgb: string) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.45, `rgba(${rgb},0.55)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** jagged lightning path with side branches (midpoint displacement) */
function makeBolt(x0: number, y0: number, x1: number, y1: number, rough: number, depth = 0):
  [number, number, number, number, number][] {
  let pts: [number, number][] = [[x0, y0], [x1, y1]];
  for (let i = 0; i < 6; i++) {
    const next: [number, number][] = [];
    const disp = rough / Math.pow(1.9, i);
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
      next.push([ax, ay], [(ax + bx) / 2 + (Math.random() - 0.5) * disp, (ay + by) / 2 + (Math.random() - 0.5) * disp * 0.3]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  const width = depth === 0 ? 2.4 : 1.2;
  const segs: [number, number, number, number, number][] = [];
  for (let k = 0; k < pts.length - 1; k++) segs.push([pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], width]);
  if (depth < 2) {
    const nBranch = depth === 0 ? 2 + Math.floor(Math.random() * 3) : 1;
    for (let b = 0; b < nBranch; b++) {
      const i = Math.floor(pts.length * (0.2 + Math.random() * 0.5));
      const [bx, by] = pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0) * (0.25 + Math.random() * 0.3);
      const ang = Math.atan2(y1 - y0, x1 - x0) + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.6);
      segs.push(...makeBolt(bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, rough * 0.5, depth + 1));
    }
  }
  return segs;
}

export function RainCycloneEffect({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enabled, setEnabled] = useState<boolean>(readPref);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch { /* private mode */ }
  }, [enabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const lightSprite = makePuffSprite(64, '250,252,253');   // sunlit cloud tops
    const darkSprite = makePuffSprite(64, '70,88,104');      // shadowed cloud base

    let w = 0, h = 0, dpr = 1, R = 200, cx = 0, cy = 0;
    let drops: Drop[] = [];
    let puffs: Puff[] = [];

    const makeDrop = (anyY: boolean): Drop => ({
      x: Math.random() * (w + 400) - 200,
      y: anyY ? Math.random() * h : -20 - Math.random() * 120,
      len: 10 + Math.random() * 18,
      speed: 0.55 + Math.random() * 0.6,
      alpha: 0.18 + Math.random() * 0.3,
      width: Math.random() < 0.2 ? 1.4 : 0.9,
    });

    const makePuffs = () => {
      const list: Puff[] = [];
      const arms = 3;
      // spiral rain bands (log spiral), wide and ragged like on satellite pictures
      for (let i = 0; i < 560; i++) {
        const band = i % arms;
        const t = Math.pow(Math.random(), 0.9);             // 0 = eyewall, 1 = outer edge
        const r = R * (0.18 + 0.95 * t);
        const spread = 0.35 + 0.55 * t;                      // outer bands are more ragged
        const th = band * (Math.PI * 2 / arms) - Math.log(r / (R * 0.18)) * 1.35 + (Math.random() - 0.5) * spread;
        list.push({ r, th, size: R * (0.05 + 0.11 * t) * (0.7 + Math.random() * 0.7),
          shade: Math.random(), alpha: 0.10 + 0.20 * (1 - t) + Math.random() * 0.06, band });
      }
      // scattered convection between the bands
      for (let i = 0; i < 90; i++) {
        const r = R * (0.3 + Math.random() * 0.85);
        list.push({ r, th: Math.random() * Math.PI * 2, size: R * (0.03 + Math.random() * 0.06),
          shade: Math.random(), alpha: 0.06 + Math.random() * 0.08, band: -2 });
      }
      // central dense overcast around the eye
      for (let i = 0; i < 200; i++) {
        const r = R * (0.1 + Math.pow(Math.random(), 0.7) * 0.3);
        list.push({ r, th: Math.random() * Math.PI * 2, size: R * (0.07 + Math.random() * 0.09),
          shade: 0.7 + Math.random() * 0.3, alpha: 0.18 + Math.random() * 0.14, band: -1 });
      }
      return list;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.max(140, Math.min(w, h) * 0.36);
      cx = w * 0.8; cy = h * 0.3;
      drops = Array.from({ length: Math.min(Math.round((w * h) / 9000 * density), 420) }, () => makeDrop(true));
      puffs = makePuffs();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // cursor-driven wind
    let targetWind = 0, wind = 0, gust = 0;
    let lastX = 0, lastY = 0, lastT = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      targetWind = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2.2;
      if (lastT) {
        const dt = Math.max(now - lastT, 1);
        const vx = (e.clientX - lastX) / dt, vy = (e.clientY - lastY) / dt;
        gust = Math.min(2.5, gust + Math.hypot(vx, vy) * 0.35);
        targetWind += Math.max(-1, Math.min(1, vx * 0.6));
      }
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // thunderstorm state
    const bolts: Bolt[] = [];
    let flash = 0, eyeFlash = 0, nextStrike = 1500 + Math.random() * 2500;

    const strike = () => {
      const fromStorm = Math.random() < 0.65;
      const x0 = fromStorm ? cx + (Math.random() - 0.5) * R * 1.4 : Math.random() * w;
      const y0 = fromStorm ? cy + (Math.random() - 0.3) * R * 0.6 : Math.random() * h * 0.15;
      const x1 = x0 + (Math.random() - 0.5) * 160 + wind * 60;
      const y1 = Math.min(h, y0 + h * (0.35 + Math.random() * 0.45));
      const max = 220 + Math.random() * 180;
      bolts.push({ segs: makeBolt(x0, y0, x1, y1, 90), life: max, max });
      flash = 0.22 + Math.random() * 0.18;
      if (fromStorm) eyeFlash = 1;
      if (Math.random() < 0.35) window.setTimeout(() => { flash = Math.max(flash, 0.15); }, 90);  // double flicker
    };

    const drawStorm = (angle: number) => {
      ctx.save();
      ctx.translate(cx + wind * 14, cy);
      // storm shadow on the "sea"
      const shadow = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.25);
      shadow.addColorStop(0, 'rgba(30,45,60,0.16)');
      shadow.addColorStop(1, 'rgba(30,45,60,0)');
      ctx.fillStyle = shadow;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.25, 0, Math.PI * 2); ctx.fill();

      for (const p of puffs) {
        // differential rotation: inner cloud turns faster (counter-clockwise on screen)
        const th = p.th - angle * (R * 0.35 / Math.max(p.r, R * 0.12));
        const x = Math.cos(th) * p.r, y = Math.sin(th) * p.r * 0.86;
        const s = p.size;
        ctx.globalAlpha = p.alpha * 0.55;
        ctx.drawImage(darkSprite, x - s / 2 + s * 0.12, y - s / 2 + s * 0.14, s, s);
        ctx.globalAlpha = p.alpha * (0.55 + 0.45 * p.shade) * (1 + eyeFlash * 0.6);
        ctx.drawImage(lightSprite, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      // the eye: clear, slightly darker centre with a bright rim
      const eyeR = R * 0.085;
      const eye = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeR * 1.9);
      eye.addColorStop(0, 'rgba(40,60,78,0.38)');
      eye.addColorStop(0.45, 'rgba(40,60,78,0.18)');
      eye.addColorStop(0.8, `rgba(250,252,253,${0.28 + eyeFlash * 0.5})`);
      eye.addColorStop(1, 'rgba(245,248,250,0)');
      ctx.fillStyle = eye;
      ctx.beginPath(); ctx.ellipse(0, 0, eyeR * 1.9, eyeR * 1.9 * 0.86, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawBolts = (dtMs: number) => {
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life -= dtMs;
        if (b.life <= 0) { bolts.splice(i, 1); continue; }
        const f = b.life / b.max;
        const flicker = f > 0.5 ? 1 : (Math.random() < 0.7 ? f * 1.6 : 0.15);
        ctx.save();
        // dark storm cloud behind the strike so the bolt stands out on the light page
        const [sx, sy] = [b.segs[0][0], b.segs[0][1]];
        const ey = b.segs[b.segs.length - 1][3];
        const cloudR = Math.max(220, (ey - sy) * 0.9);
        const dark = ctx.createRadialGradient(sx, sy + cloudR * 0.25, 10, sx, sy + cloudR * 0.25, cloudR);
        dark.addColorStop(0, `rgba(18,28,42,${0.42 * Math.min(1, f * 1.5)})`);
        dark.addColorStop(1, 'rgba(18,28,42,0)');
        ctx.fillStyle = dark;
        ctx.fillRect(sx - cloudR, sy - cloudR * 0.75, cloudR * 2, cloudR * 2);
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(140,175,255,0.95)';
        ctx.shadowBlur = 22;
        for (const [x0, y0, x1, y1, lw] of b.segs) {
          ctx.strokeStyle = `rgba(160,190,255,${0.9 * flicker})`;
          ctx.lineWidth = lw + 2.5;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        ctx.shadowBlur = 0;
        for (const [x0, y0, x1, y1, lw] of b.segs) {
          ctx.strokeStyle = `rgba(255,255,255,${flicker})`;
          ctx.lineWidth = lw * 0.6;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        ctx.restore();
      }
    };

    let angle = 0, raf = 0, prev = performance.now();
    const frame = (now: number) => {
      const dtMs = Math.min(now - prev, 50);
      const dt = dtMs / 16.7;
      prev = now;
      wind += (targetWind - wind) * 0.05 * dt;
      targetWind *= Math.pow(0.985, dt);
      gust *= Math.pow(0.95, dt);
      angle += (0.0022 + gust * 0.0015) * dt;
      flash *= Math.pow(0.86, dt);
      eyeFlash *= Math.pow(0.9, dt);

      nextStrike -= dtMs * (1 + gust * 0.8);
      if (nextStrike <= 0) { strike(); nextStrike = 2200 + Math.random() * 4500; }

      ctx.clearRect(0, 0, w, h);
      drawStorm(angle);

      // rain
      const fall = 9 * (1 + gust * 0.6);
      const slant = wind * (1 + gust * 0.3);
      ctx.lineCap = 'round';
      for (const d of drops) {
        const vy = fall * d.speed, vx = slant * fall * d.speed * 0.35;
        d.x += vx * dt; d.y += vy * dt;
        if (d.y > h + 30 || d.x < -220 || d.x > w + 220) Object.assign(d, makeDrop(false));
        const k = d.len / Math.hypot(vx, vy);
        ctx.strokeStyle = `rgba(70,110,140,${Math.min(0.85, d.alpha + flash * 0.8)})`;
        ctx.lineWidth = d.width;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - vx * k, d.y - vy * k); ctx.stroke();
      }

      drawBolts(dtMs);
      if (flash > 0.01) {                       // whole-sky flash
        ctx.fillStyle = `rgba(225,235,255,${flash})`;
        ctx.fillRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(frame);
    };

    if (reduceMotion) drawStorm(0);             // one calm, static frame: no rain motion, no flashes
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      ctx.clearRect(0, 0, w, h);
    };
  }, [enabled, density]);

  return (
    <>
      <div aria-hidden="true" style={{ position: 'sticky', top: 0, height: 0, zIndex: 30, pointerEvents: 'none' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100dvh - 70px)', pointerEvents: 'none', display: enabled ? 'block' : 'none' }}
        />
      </div>
      <button
        type="button"
        onClick={() => setEnabled((v) => !v)}
        aria-pressed={enabled}
        title={enabled ? 'Turn weather effects off' : 'Turn weather effects on'}
        style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 1000 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#1E3A5F]/60 bg-[#0D1B2A]/90 px-3 py-1.5 text-[11px] font-semibold text-[#E6EDF5] shadow-lg backdrop-blur hover:bg-[#102235]"
      >
        <CloudRain className="w-3.5 h-3.5 text-[#38BDF8]" /> {enabled ? 'Weather effects on' : 'Weather effects off'}
      </button>
    </>
  );
}

export default RainCycloneEffect;
