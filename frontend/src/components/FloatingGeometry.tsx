'use client';

import React, { useRef, useEffect, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────────
// Floating Geometry Canvas — Inspired by Reference Video
// Renders continuously drifting geometric primitives:
//   - Stepped pixel blocks (lime/violet/grey)
//   - Pulsing dot grids
//   - Glitch scan lines
//   - Floating neon particles
//   - Checker pattern fragments
// All in the brand palette: #C8FF00, #8B5CF6, #FF2E54
// ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  type: 'dot' | 'block' | 'stepped' | 'checker' | 'line';
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
  lifetime: number;
  maxLifetime: number;
}

interface GlitchLine {
  y: number;
  width: number;
  speed: number;
  color: string;
  alpha: number;
}

const COLORS = {
  lime: '#C8FF00',
  violet: '#8B5CF6',
  red: '#FF2E54',
  grey: '#71717A',
  dimGrey: '#3A3D4A',
  white: '#FFFFFF',
};

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomColor(): string {
  const palette = [COLORS.lime, COLORS.violet, COLORS.red, COLORS.grey, COLORS.dimGrey];
  return palette[Math.floor(Math.random() * palette.length)];
}

function randomAccentColor(): string {
  const palette = [COLORS.lime, COLORS.violet, COLORS.lime, COLORS.violet, COLORS.red];
  return palette[Math.floor(Math.random() * palette.length)];
}

function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  const types: Particle['type'][] = ['dot', 'block', 'stepped', 'checker', 'line', 'dot', 'dot'];
  const type = types[Math.floor(Math.random() * types.length)];
  const maxLifetime = randomRange(4000, 12000);

  return {
    x: randomRange(-50, canvasWidth + 50),
    y: randomRange(-50, canvasHeight + 50),
    vx: randomRange(-0.3, 0.3),
    vy: randomRange(-0.2, 0.2),
    size: type === 'dot' ? randomRange(2, 5) : type === 'line' ? randomRange(20, 80) : randomRange(8, 32),
    color: type === 'dot' ? randomAccentColor() : randomColor(),
    alpha: randomRange(0.08, 0.35),
    type,
    rotation: randomRange(0, Math.PI * 2),
    rotationSpeed: randomRange(-0.008, 0.008),
    pulsePhase: randomRange(0, Math.PI * 2),
    lifetime: 0,
    maxLifetime,
  };
}

function createGlitchLine(canvasWidth: number, canvasHeight: number): GlitchLine {
  return {
    y: randomRange(0, canvasHeight),
    width: randomRange(canvasWidth * 0.3, canvasWidth),
    speed: randomRange(1, 4),
    color: randomAccentColor(),
    alpha: randomRange(0.03, 0.1),
  };
}

function drawSteppedBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  // Main block with stepped corner
  const step = size * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y + step);
  ctx.lineTo(x + step, y + step);
  ctx.lineTo(x + step, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size - step);
  ctx.lineTo(x + size - step, y + size - step);
  ctx.lineTo(x + size - step, y + size);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCheckerBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const cellSize = size / 4;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = color;
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
      }
    }
  }
  ctx.restore();
}


export default function FloatingGeometry({
  className = '',
  particleCount = 35,
  glitchLineCount = 4,
}: {
  className?: string;
  particleCount?: number;
  glitchLineCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const glitchLinesRef = useRef<GlitchLine[]>([]);
  const lastTimeRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(canvas.width, canvas.height)
    );
    glitchLinesRef.current = Array.from({ length: glitchLineCount }, () =>
      createGlitchLine(canvas.width, canvas.height)
    );
  }, [particleCount, glitchLineCount]);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = lastTimeRef.current ? time - lastTimeRef.current : 16;
    lastTimeRef.current = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale for devicePixelRatio
    const dpr = window.devicePixelRatio || 1;

    // Update & draw particles
    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.lifetime += dt;

      // Fade in/out lifecycle
      let lifeFactor = 1;
      const fadeIn = 800;
      const fadeOut = 1200;
      if (p.lifetime < fadeIn) {
        lifeFactor = p.lifetime / fadeIn;
      } else if (p.lifetime > p.maxLifetime - fadeOut) {
        lifeFactor = Math.max(0, (p.maxLifetime - p.lifetime) / fadeOut);
      }

      if (p.lifetime >= p.maxLifetime) {
        particlesRef.current[i] = createParticle(canvas.width, canvas.height);
        continue;
      }

      // Movement
      p.x += p.vx * (dt * 0.06);
      p.y += p.vy * (dt * 0.06);
      p.rotation += p.rotationSpeed * (dt * 0.06);

      const pulseValue = Math.sin(time * 0.002 + p.pulsePhase) * 0.5 + 0.5;
      const currentAlpha = p.alpha * lifeFactor;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      switch (p.type) {
        case 'dot':
          ctx.globalAlpha = currentAlpha * (0.5 + 0.5 * pulseValue);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * dpr, 0, Math.PI * 2);
          ctx.fill();
          // Subtle glow for accent dots
          if (p.color === COLORS.lime || p.color === COLORS.violet) {
            ctx.globalAlpha = currentAlpha * 0.15 * pulseValue;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * dpr * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'block':
          ctx.globalAlpha = currentAlpha;
          ctx.fillStyle = p.color;
          const hs = p.size * dpr * 0.5;
          ctx.fillRect(-hs, -hs, p.size * dpr, p.size * dpr);
          break;

        case 'stepped':
          drawSteppedBlock(ctx, -p.size * dpr * 0.5, -p.size * dpr * 0.5, p.size * dpr, p.color, currentAlpha);
          break;

        case 'checker':
          drawCheckerBlock(ctx, -p.size * dpr * 0.5, -p.size * dpr * 0.5, p.size * dpr, p.color, currentAlpha * 0.7);
          break;

        case 'line':
          ctx.globalAlpha = currentAlpha * 0.6;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(-p.size * dpr * 0.5, 0);
          ctx.lineTo(p.size * dpr * 0.5, 0);
          ctx.stroke();
          break;
      }

      ctx.restore();
    }
  }, []);

  useEffect(() => {
    init();
    let animId = 0;
    const loop = (time: number) => {
      render(time);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const handleResize = () => {
      init();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [init, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
