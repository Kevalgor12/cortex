import { useEffect, useRef } from 'react';
import './Confetti.scss';

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#38bdf8', '#a78bfa'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
}

interface ConfettiProps {
  count?: number;
  durationMs?: number;
}

/**
 * A self-contained canvas confetti burst - no dependencies. Particles rain
 * from the top with gravity and rotation, then fade out. Mount it to fire it;
 * it cleans itself up on unmount. Skips entirely under reduced-motion.
 */
export default function Confetti({ count = 140, durationMs = 2600 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: -Math.random() * height * 0.5 - 10,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.35,
    }));

    let raf = 0;
    let startTs: number | null = null;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs;
      const fade = Math.max(0, 1 - Math.max(0, elapsed - (durationMs - 700)) / 700);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      for (const p of particles) {
        p.vy += 0.12;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.rotate(-p.rot);
        ctx.translate(-p.x, -p.y);
      }
      ctx.restore();

      if (elapsed < durationMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, durationMs]);

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />;
}
