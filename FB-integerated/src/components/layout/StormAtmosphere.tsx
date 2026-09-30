import { useEffect, useRef, useState } from 'react';
import { CloudRain, Pause, Play, Wind } from 'lucide-react';
import './storm-atmosphere.css';

type Drop = { x: number; y: number; depth: number };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Decorative only: cursor motion is never presented as measured weather. */
export function StormAtmosphere({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meterRef = useRef<HTMLOutputElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const host = canvas.parentElement!;
    let width = 1, height = 1, frame = 0, last = 0, time = 0, visible = true;
    let drops: Drop[] = [];
    let wind = 0, speed = 1, targetWind = 0, targetSpeed = 1, lastMeter = 0;
    let pointer = { x: 0, y: 0, at: 0 };
    const stationary = paused || reduced;
    const draw = (stamp: number) => {
      frame = 0;
      if (!visible || document.hidden) { last = 0; return; }
      const dt = stationary ? 0 : Math.min((stamp - (last || stamp)) / 1000, .04);
      last = stamp;
      time += dt;
      if (stamp - pointer.at > 240) { targetSpeed = 1; targetWind *= .985; }
      const ease = 1 - Math.exp(-dt * 5);
      wind += (targetWind - wind) * ease;
      speed += (targetSpeed - speed) * ease;
      context.clearRect(0, 0, width, height);

      // A cloud spiral with a quiet central eye, placed away from the heading.
      const cx = width * (width < 600 ? .84 : .79), cy = height * .42;
      const radius = Math.min(width * .25, height * .61);
      context.save();
      context.translate(cx, cy);
      context.scale(1, .72);
      const haze = context.createRadialGradient(0, 0, 14, 0, 0, radius);
      haze.addColorStop(0, 'rgba(30,78,100,0)');
      haze.addColorStop(.22, 'rgba(37,91,116,.14)');
      haze.addColorStop(.64, 'rgba(65,120,145,.16)');
      haze.addColorStop(1, 'rgba(52,105,133,0)');
      context.fillStyle = haze;
      context.fillRect(-radius, -radius, radius * 2, radius * 2);
      for (let arm = 0; arm < 5; arm++) {
        for (let ribbon = 0; ribbon < 3; ribbon++) {
          context.beginPath();
          for (let i = 0; i <= 92; i++) {
            const fraction = i / 92;
            const r = 17 + fraction * radius * (.8 + ribbon * .05);
            const angle = arm * Math.PI * .4 + fraction * 4.25 - time * .15 + ribbon * .07;
            const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
            if (!i) context.moveTo(x, y); else context.lineTo(x, y);
          }
          context.lineCap = 'round';
          context.lineWidth = 8 + ribbon * 5;
          context.strokeStyle = ribbon === 1 ? 'rgba(255,255,255,.24)' : 'rgba(111,155,174,.17)';
          context.stroke();
        }
      }
      context.restore();

      // Frame-rate independent motion; both cursor position and velocity drive gusts.
      for (const drop of drops) {
        const fall = (240 + drop.depth * 390) * speed;
        const drift = wind * fall * .78;
        drop.x += drift * dt;
        drop.y += fall * dt;
        if (drop.y > height + 65) { drop.y = -65; drop.x = Math.random() * width; }
        if (drop.x > width + 70) drop.x = -60;
        if (drop.x < -70) drop.x = width + 60;
        const length = 11 + drop.depth * 22;
        const tailX = wind * length * .78;
        context.beginPath();
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x - tailX, drop.y - length);
        context.lineWidth = .65 + drop.depth * .7;
        context.strokeStyle = `rgba(43,102,136,${.12 + drop.depth * .35})`;
        context.stroke();
        context.beginPath();
        context.moveTo(drop.x + 1, drop.y);
        context.lineTo(drop.x - tailX + 1, drop.y - length * .55);
        context.strokeStyle = `rgba(255,255,255,${.2 + drop.depth * .4})`;
        context.stroke();
      }
      if (stamp - lastMeter > 120 || stationary) {
        lastMeter = stamp;
        canvas.dataset.rainDirection = wind.toFixed(2);
        canvas.dataset.rainSpeed = speed.toFixed(2);
        if (meterRef.current) meterRef.current.textContent = stationary ? (reduced ? 'Reduced motion' : 'Paused') : `${wind < -.15 ? '↙' : wind > .15 ? '↘' : '↓'} ${speed.toFixed(1)}×`;
      }
      if (!stationary) frame = requestAnimationFrame(draw);
    };
    const kick = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const resize = () => {
      width = host.clientWidth; height = host.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.round(clamp(width * height / 3500, 60, 230)) }, () => ({ x: Math.random() * width, y: Math.random() * height, depth: Math.random() }));
      kick();
    };
    const move = (event: PointerEvent) => {
      if (stationary || !visible || event.pointerType === 'touch') return;
      const stamp = performance.now();
      const elapsed = stamp - pointer.at;
      const velocity = pointer.at && elapsed < 180 ? (event.clientX - pointer.x) / Math.max(elapsed, 8) : 0;
      const travel = pointer.at && elapsed < 180 ? Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) / Math.max(elapsed, 8) : 0;
      targetWind = clamp((event.clientX / window.innerWidth - .5) * 1.7 + velocity * .22, -1.45, 1.45);
      targetSpeed = clamp(1 + travel * .38, 1, 2.8);
      pointer = { x: event.clientX, y: event.clientY, at: stamp };
    };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else kick(); };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick(); else { cancelAnimationFrame(frame); frame = 0; last = 0; }
    });
    intersection.observe(host);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); intersection.disconnect();
      window.removeEventListener('pointermove', move);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [enabled, paused, reduced]);

  return <>
    {enabled && <canvas ref={canvasRef} className="storm-atmosphere" aria-hidden="true" />}
    <div className="atmosphere-controls" aria-label="Decorative weather effects">
      <button type="button" onClick={onToggle} aria-pressed={enabled}><CloudRain size={15} />Rain & cyclone <span>{enabled ? 'On' : 'Off'}</span></button>
      {enabled && <>
        <button type="button" disabled={reduced} onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume weather animation' : 'Pause weather animation'}>{paused || reduced ? <Play size={14} /> : <Pause size={14} />}</button>
        <output ref={meterRef} className="atmosphere-meter" aria-label="Decorative rain speed">{reduced ? 'Reduced motion' : '↓ 1.0×'}</output>
      </>}
      <small><Wind size={12} />{enabled && !paused && !reduced ? 'Move your cursor to steer the rain' : 'Atmosphere effect'} · illustrative</small>
    </div>
  </>;
}
