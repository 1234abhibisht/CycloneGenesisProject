import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCyclone } from '../hooks/useCyclone';
import { useLanguage } from '../features/multilingual/LanguageContext';

const STORMS = {
  calm: { cat: 0, name: '', wind: 0, press: 1013, gust: 0, surge: 0, fs: 0, msg: '' },
  1: { name: 'DIVINE', cat: 1, wind: 64, press: 985, gust: 82, surge: 1.2, fs: 12, msg: 'CAT1 · Hazardous wind · Secure loose objects' },
  2: { name: 'KAIROS', cat: 2, wind: 90, press: 968, gust: 110, surge: 1.8, fs: 9, msg: 'CAT2 · Extremely dangerous · Evacuate low-lying zones' },
  3: { name: 'THALIA', cat: 3, wind: 112, press: 955, gust: 138, surge: 2.7, fs: 15, msg: 'CAT3 · Devastating damage will occur' },
  4: { name: 'VANTA', cat: 4, wind: 133, press: 940, gust: 164, surge: 4.0, fs: 11, msg: 'CAT4 · Catastrophic · Seek shelter immediately' },
  5: { name: 'OMEGA', cat: 5, wind: 160, press: 915, gust: 200, surge: 5.6, fs: 8, msg: 'CAT5 · Total destruction expected' }
};

const CATCOLOR = {
  1: '#4ade80', 2: '#ffe066', 3: '#ffb347', 4: '#ff8a4c', 5: '#ff4d6d'
};

const CATROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

interface StormParticle {
  arm: number;
  r: number;
  theta: number;
  speed: number;
  size: number;
  alpha: number;
  hue: number;
  grew: number;
}

interface CalmParticle {
  x: number;
  y: number;
  s: number;
  a: number;
  sp: number;
  ph: number;
}

interface Puff {
  x: number;
  y: number;
  r: number;
  grow: number;
  max: number;
  drift: number;
  up: number;
  a: number;
  hue: number;
  sat: number;
  blobs: Array<{ ang: number; off: number; s: number }>;
}

interface EyeParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  hue: number;
}

interface LightningBolt {
  x: number;
  y: number;
  segments: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
}

const colors = {
  base: '#070b16',
  sea: '#0d1a26',
  sea2: '#0f2634',
  ink: '#eaf4f8',
  inkDim: '#8fa9b8',
  cyan: '#7fd7ff',
  cyanBright: '#c9f1ff',
  amber: '#ffc857',
  magenta: '#ff4d6d',
  grid: 'rgba(127,215,255,.14)',
  hairline: 'rgba(127,215,255,.28)',
};

export const CycloneVisualization: React.FC = () => {
  const { cyclone, hasActiveCyclone, loading } = useCyclone();
  const { t } = useLanguage();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const dprRef = useRef(1);
  const wRef = useRef(1920);
  const hRef = useRef(1080);

  const [stormActive, setStormActive] = useState(false);
  const [stormLevel, setStormLevel] = useState(0);
  const [autoScan, setAutoScan] = useState(true);
  const [clock, setClock] = useState('');
  const [coords, setCoords] = useState('LAT 0.0° LON 0.0°');
  const [wind, setWind] = useState(0);
  const [pressure, setPressure] = useState(1013);
  const [gust, setGust] = useState(0);
  const [category, setCategory] = useState(0);
  const [surge, setSurge] = useState(0);
  const [forwardSpeed, setForwardSpeed] = useState(0);
  const [stormName, setStormName] = useState('SCANNING');
  const [stormStatus, setStormStatus] = useState('Calm seas · No cyclone detected');
  const [modeText, setModeText] = useState('STANDBY');
  const [pulseColor, setPulseColor] = useState(colors.cyan);
  const [bodyActive, setBodyActive] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('ATMOS · Cyclone Watch');

  const stormParticlesRef = useRef<StormParticle[]>([]);
  const calmParticlesRef = useRef<CalmParticle[]>([]);
  const puffsRef = useRef<Puff[]>([]);
  const eyeParticlesRef = useRef<EyeParticle[]>([]);
  const lightningRef = useRef<LightningBolt[]>([]);
  const burstQueueRef = useRef(0);
  const flashRef = useRef(0);
  const flashTimerRef = useRef(4);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = useRef(false);

  const TAU = Math.PI * 2;
  const rand = useCallback((a: number, b: number) => a + Math.random() * (b - a), []);
  const MAXSTORM = 900;
  const STORM_CORES = 2;

  const getCanvasDims = useCallback((): { w: number; h: number; dpr: number } => {
    if (typeof window === 'undefined') return { w: 1920, h: 1080, dpr: 1 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    dprRef.current = dpr;
    wRef.current = w;
    hRef.current = h;
    return { w, h, dpr };
  }, []);

  const spawnStorm = useCallback(() => {
    const { w, h } = getCanvasDims();
    const particles: StormParticle[] = [];
    const n = MAXSTORM;
    const arms = STORM_CORES;
    for (let i = 0; i < n; i++) {
      const arm = Math.floor(Math.random() * arms);
      const r = Math.pow(Math.random(), 0.6) * Math.max(w, h) * 0.5;
      const theta = (arm / arms) * TAU + r * 0.006 + Math.random() * 0.3;
      particles.push({
        arm, r, theta,
        speed: rand(0.6, 1.6),
        size: rand(1, 3.2) * (r < Math.max(w, h) * 0.16 ? 1.4 : 1),
        alpha: rand(0.25, 0.9),
        hue: Math.random() < 0.35 ? 190 : 210,
        grew: 0
      });
    }
    stormParticlesRef.current = particles;

    // Spawn eye particles
    const eyeParticles: EyeParticle[] = [];
    for (let i = 0; i < 30; i++) {
      eyeParticles.push({
        angle: Math.random() * TAU,
        radius: Math.random() * 30,
        speed: rand(0.01, 0.03),
        size: rand(2, 6),
        alpha: rand(0.3, 0.8),
        hue: rand(200, 220)
      });
    }
    eyeParticlesRef.current = eyeParticles;
  }, [getCanvasDims, rand]);

  const initCalmParticles = useCallback(() => {
    const { w, h } = getCanvasDims();
    const particles: CalmParticle[] = [];
    for (let i = 0; i < 160; i++) {
      particles.push({
        x: rand(0, w),
        y: rand(0, h),
        s: rand(0.6, 2.2),
        a: rand(0.05, 0.4),
        sp: rand(0.1, 0.5),
        ph: rand(0, TAU)
      });
    }
    calmParticlesRef.current = particles;
  }, [getCanvasDims, rand]);

  const addBursts = useCallback((n: number) => {
    burstQueueRef.current = Math.min(burstQueueRef.current + n, 600);
  }, []);

  const makePuff = useCallback((x: number, y: number): Puff => {
    const size = rand(40, 130);
    return {
      x, y,
      r: rand(4, 14),
      grow: rand(0.6, 1.4),
      max: size,
      drift: rand(-0.4, 0.4),
      up: rand(-0.8, -0.2),
      a: rand(0.5, 0.85),
      hue: 205, sat: 22,
      blobs: Array.from({ length: 8 }, () => ({
        ang: rand(0, TAU),
        off: rand(0, size * 0.25),
        s: rand(0.5, 1)
      }))
    };
  }, [rand]);

  const drawPuff = useCallback((ctx: CanvasRenderingContext2D, p: Puff) => {
    const t = p.r / p.max;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.a * (1 - t);
    for (const b of p.blobs) {
      const bx = Math.cos(b.ang) * b.off * t;
      const by = Math.sin(b.ang) * b.off * t;
      ctx.beginPath();
      ctx.arc(bx, by, p.r * 0.5 * b.s + 3, 0, TAU);
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${80 - 40 * t}%,0.9)`;
      ctx.fill();
    }
    ctx.restore();
  }, []);

  const spawnLightning = useCallback((cx: number, cy: number, w: number, h: number) => {
    const bolts = 1 + Math.floor(Math.random() * 3);
    for (let b = 0; b < bolts; b++) {
      const startX = cx + rand(-w * 0.3, w * 0.3);
      const startY = cy + rand(-h * 0.3, h * 0.3);
      const segments: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;
      for (let i = 0; i < 8; i++) {
        currentX += rand(-80, 80);
        currentY += rand(40, 120);
        segments.push({ x: currentX, y: currentY });
      }
      lightningRef.current.push({
        x: startX, y: startY,
        segments,
        life: 0,
        maxLife: rand(0.05, 0.15)
      });
    }
  }, [rand]);

  const setState = useCallback((level: number) => {
    const calm = level === 0;
    const s = calm ? STORMS.calm : STORMS[level as keyof typeof STORMS];

    setStormActive(!calm);
    setBodyActive(!calm);
    setStormLevel(level);
    setPulseColor(calm ? colors.cyan : colors.amber);
    setModeText(calm ? 'STANDBY' : 'ACTIVE');
    setStormName(calm ? 'SCANNING' : s.name);
    setStormStatus(calm ? 'Calm seas · No cyclone detected' : `CATEGORY ${s.cat} · ${s.name} TRACKED · LIVE`);
    setWind(calm ? 0 : s.wind);
    setPressure(calm ? 1013 : s.press);
    setGust(calm ? 0 : s.gust);
    setSurge(calm ? 0 : s.surge);
    setForwardSpeed(calm ? 0 : s.fs);
    setCategory(calm ? 0 : s.cat);
    setDocumentTitle(calm ? 'ATMOS · Cyclone Watch' : `${s.name} · CAT ${s.cat} · ATMOS`);

    if (!calm) {
      const targetHue = s.cat <= 1 ? 205 : 200 - s.cat * 8;
      stormParticlesRef.current.forEach(p => { p.hue = targetHue; });
      stormParticlesRef.current.forEach(p => { p.speed = 0.6 + s.cat * 0.18; });
      addBursts(90 + s.cat * 40);
    } else {
      stormParticlesRef.current.forEach(p => { p.hue = Math.random() < 0.35 ? 190 : 210; });
    }
  }, [addBursts]);

  const nextEvent = useCallback(() => {
    const LEVELS = [0, 3, 5, 2, 0];
    const idx = Math.floor(Math.random() * LEVELS.length);
    setState(LEVELS[idx]);
  }, [setState]);

  const startAuto = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(nextEvent, 5200);
  }, [nextEvent]);

  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = null;
  }, []);

  // Inject global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap');
      @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
      @keyframes rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
      @keyframes risec { from { opacity: 0; transform: translate(-50%,-50%) scale(.94) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
      @media (prefers-reduced-motion: reduce) { * { animation-duration: .001s !important } }
      .scanlines { background: repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 1px, transparent 1px 3px); mix-blend-mode: overlay; opacity: .5; }
      .grid { background-image: linear-gradient(rgba(127,215,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(127,215,255,.14) 1px, transparent 1px); background-size: 72px 72px; mask-image: radial-gradient(circle at 50% 50%, #000 30%, transparent 78%); -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 30%, transparent 78%); opacity: .7; }
      @media (max-width: 640px) { .rail { display: none } .corner.tl h1 { font-size: 16px } #center .name { font-size: 21vmin } }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    initCalmParticles();
    spawnStorm();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const { w, h, dpr } = getCanvasDims();
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };
    window.addEventListener('resize', resize);
    resize();

    reduceMotionRef.current = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frame = () => {
      animationRef.current = requestAnimationFrame(frame);
      const dt = reduceMotionRef.current ? 0 : 1 / 60;
      timeRef.current += dt;

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const context = canvasEl.getContext('2d');
      if (!context) return;
      const w = canvasEl.width;
      const h = canvasEl.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.max(w, h) * 0.5;

      // Background gradient
      const g = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      if (stormActive) {
        g.addColorStop(0, '#16303d');
        g.addColorStop(0.45, '#0d1f2c');
        g.addColorStop(1, '#060a14');
      } else {
        g.addColorStop(0, '#0e2430');
        g.addColorStop(0.5, '#0a1a26');
        g.addColorStop(1, '#060a14');
      }
      context.clearRect(0, 0, w, h);
      context.fillStyle = g;
      context.fillRect(0, 0, w, h);

      // Calm drift particles
      if (!stormActive || reduceMotionRef.current) {
        context.globalCompositeOperation = 'lighter';
        for (const p of calmParticlesRef.current) {
          p.x += p.sp * dt * 1.4;
          if (p.x > w) p.x = 0;
          context.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(timeRef.current * 0.6 + p.ph));
          context.fillStyle = '#9fd8ee';
          context.beginPath();
          context.arc(p.x, p.y + Math.sin(timeRef.current * p.sp + p.ph) * 4, p.s, 0, TAU);
          context.fill();
        }
      }

      // Storm spiral particles
      if (stormActive && !reduceMotionRef.current) {
        context.globalCompositeOperation = 'lighter';
        for (const p of stormParticlesRef.current) {
          p.theta -= 0.004 * p.speed;
          p.r -= 0.5 * p.speed;
          if (p.r < 8) { p.r = maxR * rand(0.9, 1); }
          p.grew += 0.02;
          const wob = Math.sin(timeRef.current * 2 + p.theta * 4) * 6;
          const x = cx + p.r * Math.cos(p.theta) + wob;
          const y = cy + p.r * Math.sin(p.theta) + wob;
          const core = Math.max(1 - p.r / maxR, 0);
          context.globalAlpha = p.alpha * (0.35 + 0.8 * core);
          context.fillStyle = `hsla(${p.hue},90%,${68 + core * 26}%,1)`;
          context.beginPath();
          context.arc(x, y, p.size, 0, TAU);
          context.fill();
        }

        // Eye particles
        for (const ep of eyeParticlesRef.current) {
          ep.angle += ep.speed;
          const ex = cx + ep.radius * Math.cos(ep.angle);
          const ey = cy + ep.radius * Math.sin(ep.angle);
          context.globalAlpha = ep.alpha;
          context.fillStyle = `hsla(${ep.hue}, 80%, 70%, ${ep.alpha})`;
          context.beginPath();
          context.arc(ex, ey, ep.size, 0, TAU);
          context.fill();
        }
      }

      // Cloud bursts
      context.globalCompositeOperation = 'lighter';
      while (burstQueueRef.current > 0) {
        burstQueueRef.current--;
        let x, y;
        if (stormActive) {
          const a = rand(0, TAU);
          const rr = Math.random() < 0.5 ? rand(8, 60) : rand(90, w * 0.32);
          x = cx + Math.cos(a) * rr;
          y = cy + Math.sin(a) * rr;
        } else {
          x = rand(w * 0.2, w * 0.8);
          y = rand(h * 0.25, h * 0.6);
        }
        puffsRef.current.push(makePuff(x, y));
      }
      for (let i = puffsRef.current.length - 1; i >= 0; i--) {
        const p = puffsRef.current[i];
        p.r += p.grow * (stormActive ? 2.2 : 1);
        p.x += p.drift;
        p.y += p.up;
        if (p.r >= p.max || p.y < -60) {
          puffsRef.current.splice(i, 1);
        } else {
          drawPuff(context, p);
        }
      }

      // Lightning
      if (stormActive && !reduceMotionRef.current) {
        flashTimerRef.current -= dt;
        if (flashTimerRef.current <= 0) {
          if (Math.random() < 0.12) {
            flashRef.current = 1;
            spawnLightning(cx, cy, w, h);
          }
          flashTimerRef.current = 4;
        }
        if (flashRef.current > 0) {
          context.globalCompositeOperation = 'source-over';
          context.globalAlpha = flashRef.current * 0.08;
          context.fillStyle = '#cfe9ff';
          context.fillRect(0, 0, w, h);
          flashRef.current = Math.max(0, flashRef.current - 0.04);
        }

        // Draw lightning bolts
        for (let i = lightningRef.current.length - 1; i >= 0; i--) {
          const bolt = lightningRef.current[i];
          bolt.life += dt;
          if (bolt.life >= bolt.maxLife) {
            lightningRef.current.splice(i, 1);
            continue;
          }
          const alpha = 1 - bolt.life / bolt.maxLife;
          context.globalCompositeOperation = 'lighter';
          context.strokeStyle = `rgba(207, 233, 255, ${alpha * 0.8})`;
          context.lineWidth = 2;
          context.lineCap = 'round';
          context.beginPath();
          context.moveTo(bolt.segments[0].x, bolt.segments[0].y);
          for (let j = 1; j < bolt.segments.length; j++) {
            context.lineTo(bolt.segments[j].x, bolt.segments[j].y);
          }
          context.stroke();
          
          // Glow
          context.strokeStyle = `rgba(127, 215, 255, ${alpha * 0.4})`;
          context.lineWidth = 6;
          context.beginPath();
          context.moveTo(bolt.segments[0].x, bolt.segments[0].y);
          for (let j = 1; j < bolt.segments.length; j++) {
            context.lineTo(bolt.segments[j].x, bolt.segments[j].y);
          }
          context.stroke();
        }
      }
    };

    frame();

    const tickClock = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      setClock(`${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`);
      const la = (8.7 + Math.sin(d.getTime() / 9000) * 6).toFixed(2);
      const lo = (45 + Math.cos(d.getTime() / 11000) * 8).toFixed(2);
      setCoords(`LAT ${la}° LON ${lo}°`);
      if (!stormActive && !reduceMotionRef.current && Math.random() < 0.08) addBursts(1);
    };
    tickClock();
    const clockInterval = setInterval(tickClock, 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) { stopAuto(); }
      else if (autoScan) { startAuto(); }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial sequence
    setState(0);
    setTimeout(() => { addBursts(30); setState(3); }, 1800);
    setTimeout(() => { setState(0); addBursts(20); }, 8200);
    startAuto();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearInterval(clockInterval);
      stopAuto();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stormActive, autoScan, spawnStorm, initCalmParticles, addBursts, makePuff, drawPuff, spawnLightning, setState, nextEvent, startAuto, stopAuto]);

  const handleCycloneClick = () => {
    if (autoScan) { setAutoScan(false); stopAuto(); }
    const nextLevel = (stormLevel + 1) % 6;
    setState(nextLevel);
  };

  const handleBurstClick = () => {
    addBursts(140);
    if (stormActive) addBursts(120);
  };

  const handleModeClick = () => {
    setAutoScan(prev => {
      const next = !prev;
      if (next) startAuto();
      else stopAuto();
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b16] flex items-center justify-center" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="text-center">
          <div className="text-4xl font-bold" style={{ color: colors.cyan, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.34em' }}>ATMOS</div>
          <div style={{ color: colors.inkDim, fontFamily: "'JetBrains Mono', monospace" }}>Loading cyclone data...</div>
        </div>
      </div>
    );
  }

  const catColor = category ? CATCOLOR[category as keyof typeof CATCOLOR] : colors.hairline;

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{
      background: colors.base,
      color: colors.ink,
      fontFamily: "'Inter', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{height:100%}
        body{background:${colors.base};color:${colors.ink};font-family:'Inter',system-ui,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
        .corner{position:fixed;z-index:2}
        .corner.tl{top:20px;left:22px}
        .corner.tr{top:20px;right:22px;text-align:right}
        .corner.bl{bottom:20px;left:22px}
        .corner.br{bottom:20px;right:22px;text-align:right}
        .corner .tick{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;color:${colors.inkDim}}
        .corner h1{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:22px;letter-spacing:.34em;color:${colors.cyanBright};text-transform:uppercase}
        .corner .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:${colors.cyan};margin-right:8px;box-shadow:0 0 10px ${colors.cyan}}
        .cross{position:fixed;left:50%;top:50%;width:60px;height:60px;transform:translate(-50%,-50%);z-index:1;pointer-events:none;opacity:.8}
        .cross::before,.cross::after{content:"";position:absolute}
        .cross::before{left:50%;top:0;height:100%;width:1px;background:${colors.hairline}}
        .cross::after{top:50%;left:0;width:100%;height:1px;background:${colors.hairline}}
        .rings{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;pointer-events:none;border:1px solid ${colors.grid};border-radius:50%}
        .rings.r1{width:46vmin;height:46vmin}
        .rings.r2{width:78vmin;height:78vmin}
        .rings.r3{width:118vmin;height:118vmin}
        #center{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;text-align:center;pointer-events:none;animation:risec 1.2s ease both}
        #center .kicker{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.5em;color:${colors.inkDim};margin-bottom:10px;text-transform:uppercase}
        #center .name{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:clamp(56px,12vmin,150px);line-height:.95;letter-spacing:.02em;color:${colors.cyanBright};text-shadow:0 0 30px rgba(127,215,255,.35)}
        #center .status{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.3em;margin-top:16px;color:${colors.ink}}
        #center .status .pulse{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:10px;vertical-align:middle;animation:blink 1.6s infinite}
        .rails{position:fixed;inset:0;z-index:3;pointer-events:none;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr;padding:0}
        .rail{position:fixed;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:16px;opacity:0;transition:opacity .9s ease}
        .rail.l{left:32px;align-items:flex-start}
        .rail.r{right:32px;align-items:flex-end}
        body.active .rails .rail{opacity:1}
        .meter{text-align:left}
        .rail.r .meter{text-align:right}
        .meter .label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.28em;color:${colors.inkDim};text-transform:uppercase}
        .meter .val{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:30px;color:${colors.cyanBright};line-height:1.05}
        .meter .unit{font-family:'JetBrains Mono',monospace;font-size:11px;color:${colors.inkDim};margin-left:6px;font-weight:400}
        #bottom{position:fixed;left:0;right:0;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 26px;pointer-events:none;animation:rise 1.2s ease both}
        .bbox{pointer-events:none;width:0;overflow:hidden;white-space:nowrap;opacity:0;transition:width .7s ease,opacity .7s ease;display:flex;align-items:center;gap:12px}
        body.active .bbox{width:auto;opacity:1;pointer-events:auto}
        .catchip{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.08em;padding:9px 14px;border-radius:2px;background:rgba(7,11,22,.6);border:1px solid ${colors.hairline};color:${colors.ink};white-space:nowrap}
        .catchip .lv{font-size:16px;font-weight:800}
        .ticker{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.1em;color:${colors.inkDim};white-space:nowrap}
        #controls{position:fixed;z-index:5;left:50%;bottom:86px;transform:translateX(-50%);display:flex;gap:10px}
        #controls button{pointer-events:auto;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${colors.ink};background:rgba(7,11,22,.55);border:1px solid ${colors.hairline};padding:10px 18px;border-radius:2px;transition:all .25s;backdrop-filter:blur(4px)}
        #controls button:hover{background:rgba(127,215,255,.14);color:${colors.cyanBright};border-color:${colors.cyan}}
        #controls button.ton{background:${colors.cyan};color:#06202d;border-color:${colors.cyan};font-weight:700}
      ` }} />

      <canvas
        ref={canvasRef}
        id="storm"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      />
      <div className="scanlines" style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
      <div className="grid" style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
      <div className="rings r1" />
      <div className="rings r2" />
      <div className="rings r3" />
      <div className="cross" />

      <div className="corner tl">
        <h1><span className="dot" />ATMOS</h1>
        <div className="tick">TROPICAL CYCLONE WATCH · SECTOR 09</div>
      </div>

      <div className="corner tr">
        <div className="tick" id="clock">{clock}</div>
        <div className="tick" id="coord">{coords}</div>
      </div>

      <div className="corner bl">
        <div className="tick">MODE: <span id="mode">{modeText}</span></div>
        <div className="tick">SCAN · ACTIVE BASIN</div>
      </div>

      <div className="corner br">
        <div className="tick">GRID LOCK</div>
        <div className="tick">SYS ONLINE</div>
      </div>

      <div id="center">
        <div className="kicker">CYCLONE DETECTION</div>
        <div className="name" id="sname">{stormName}</div>
        <div className="status">
          <span className="pulse" id="pulse" style={{ background: pulseColor, boxShadow: `0 0 12px ${pulseColor}` }} />
          <span id="sstatus">{stormStatus}</span>
        </div>
      </div>

      <div className={`rails ${bodyActive ? 'active' : ''}`}>
        <div className="rail l" id="railL">
          <div className="meter">
            <div className="label">Sustained Wind</div>
            <div className="val">{wind}<span className="unit">KT</span></div>
          </div>
          <div className="meter">
            <div className="label">Pressure</div>
            <div className="val">{pressure}<span className="unit">hPa</span></div>
          </div>
          <div className="meter">
            <div className="label">Gusts</div>
            <div className="val">{gust}<span className="unit">KT</span></div>
          </div>
        </div>
        <div className="rail r" id="railR">
          <div className="meter">
            <div className="label">Category</div>
            <div className="val" id="catv" style={{ color: category ? catColor : colors.ink }}>{category || '—'}</div>
          </div>
          <div className="meter">
            <div className="label">Storm Surge</div>
            <div className="val">{surge.toFixed(1)}<span className="unit">m</span></div>
          </div>
          <div className="meter">
            <div className="label">Forward Spd</div>
            <div className="val">{forwardSpeed}<span className="unit">KT</span></div>
          </div>
        </div>
      </div>

      <div id="bottom">
        <div className="bbox" style={{ width: bodyActive ? 'auto' : 0, opacity: bodyActive ? 1 : 0, pointerEvents: bodyActive ? 'auto' : 'none' }}>
          <div className="catchip" id="chip" style={{ borderColor: catColor, color: catColor }}>
            CATEGORY <span className="lv" id="catlv" style={{ color: catColor }}>{category ? CATROMAN[category as keyof typeof CATROMAN] : '—'}</span>
          </div>
          <div className="ticker" id="msg">{stormLevel > 0 ? STORMS[stormLevel as keyof typeof STORMS]?.msg : '--'}</div>
        </div>
        <div className="ticker" id="foot">ATMOS · LOCAL DEMO · DATA SIMULATED</div>
      </div>

      <div id="controls">
        <button id="btnCyclone" onClick={handleCycloneClick}>Trigger Cyclone</button>
        <button id="btnBurst" onClick={handleBurstClick}>Burst Clouds</button>
        <button id="btnMode" onClick={handleModeClick} className={autoScan ? 'ton' : ''}>{autoScan ? 'Auto-Scan On' : 'Auto-Scan Off'}</button>
      </div>

      {hasActiveCyclone && cyclone && (
        <div style={{
          position: 'fixed', bottom: '120px', right: '24px', zIndex: 40,
          padding: '16px', borderRadius: '8px',
          background: 'rgba(7,11,22,.92)',
          border: `1px solid ${colors.hairline}`,
          backdropFilter: 'blur(8px)',
          minWidth: '220px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ color: colors.cyan, fontWeight: 700, marginBottom: '10px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            {t('liveMonitoring')}: {cyclone.name}
          </div>
          <div style={{ color: colors.inkDim, marginBottom: '6px' }}><span style={{ color: colors.cyanBright }}>MAX WIND:</span> {cyclone.currentPosition.windSpeed} KT</div>
          <div style={{ color: colors.inkDim, marginBottom: '6px' }}><span style={{ color: colors.cyanBright }}>PRESSURE:</span> {cyclone.currentPosition.pressure} hPa</div>
          <div style={{ color: colors.inkDim, marginBottom: '6px' }}><span style={{ color: colors.cyanBright }}>IMD GRADE:</span> {cyclone.currentPosition.imdGrade}</div>
          <div style={{ color: colors.inkDim, marginBottom: '6px' }}><span style={{ color: colors.cyanBright }}>MOVEMENT:</span> {cyclone.track[cyclone.track.length - 1]?.stormDir || 0}° @ {cyclone.track[cyclone.track.length - 1]?.stormSpeed || 0} KT</div>
          <div style={{ color: colors.inkDim }}><span style={{ color: colors.cyanBright }}>LAST UPDATE:</span> {new Date(cyclone.lastUpdated).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};

export default CycloneVisualization;