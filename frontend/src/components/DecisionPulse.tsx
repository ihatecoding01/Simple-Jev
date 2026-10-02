'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────────
// Interactive Decision Pulse — Fun, Intuitive, Kinetic Micro-Toy
// Built for non-technical users: relaxed pace, pause-at-decision,
// stationary reading bar, and maximum readable animation.
// ────────────────────────────────────────────────────────────────────

interface PulseParticle {
  id: number;
  t: number; // 0 to 1
  speed: number;
  branch: 'choice' | 'score' | 'noul';
  color: string;
  trail: { x: number; y: number }[];
  size: number;
  question: string;
  answer: string;
  pauseFrames: number;
  hasPaused: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

const DECISION_TYPES = {
  choice: {
    label: 'CATEGORIZE',
    hint: 'Sort into buckets',
    color: '#8B5CF6',
    question: 'Refund invoice #994?',
    answer: '→ Billing Support',
    resultText: 'Sorted to: Billing Support',
  },
  score: {
    label: 'RATE 1-5',
    hint: 'How urgent?',
    color: '#C8FF00',
    question: 'Database is down?',
    answer: '→ 5 / 5 Critical Outage',
    resultText: 'Score: 5 / 5 (Critical Emergency)',
  },
  noul: {
    label: 'VERIFY',
    hint: 'True or false?',
    color: '#10B981',
    question: 'Is sender email safe?',
    answer: '→ Verified Authentic',
    resultText: 'Verified: True (Authentic)',
  },
};

export default function DecisionPulse() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Friendly counters & live reaction state
  const [answersCount, setAnswersCount] = useState(24);
  const [activeStory, setActiveStory] = useState<{
    branch: 'choice' | 'score' | 'noul';
    question: string;
    answer: string;
    isDecided: boolean;
  }>({
    branch: 'choice',
    question: 'Refund invoice #994?',
    answer: 'Sorted to: Billing Support',
    isDecided: true,
  });
  const [activeType, setActiveType] = useState<'choice' | 'score' | 'noul' | 'auto'>('auto');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // 60FPS Particle simulation state
  const particlesRef = useRef<PulseParticle[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const nextParticleId = useRef(2);
  const coreFlashRef = useRef(0);
  const targetFlashesRef = useRef({ choice: 0, score: 0, noul: 0 });

  // Spawn an energetic, gently-paced question pulse
  const fireQuestionPulse = useCallback((forcedBranch?: 'choice' | 'score' | 'noul') => {
    const types: ('choice' | 'score' | 'noul')[] = ['choice', 'score', 'noul'];
    const chosen = forcedBranch || (activeType !== 'auto' ? activeType : types[Math.floor(Math.random() * types.length)]);
    const cfg = DECISION_TYPES[chosen];

    // Gentle, readable speed (~3.5 seconds total journey)
    const baseSpeed = 0.0024;

    particlesRef.current.push({
      id: nextParticleId.current++,
      t: 0,
      speed: baseSpeed,
      branch: chosen,
      color: cfg.color,
      trail: [],
      size: 5,
      question: cfg.question,
      answer: cfg.answer,
      pauseFrames: 0,
      hasPaused: false,
    });

    setActiveStory({
      branch: chosen,
      question: cfg.question,
      answer: cfg.answer.replace('→ ', ''),
      isDecided: false,
    });

    setAnswersCount((c) => c + 1);
  }, [activeType]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let autoPlayTimer: NodeJS.Timeout;

    const handleResize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 1000;
      const h = 180;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Continuous play interval: relaxed 4.2 seconds
    if (isAutoPlaying) {
      autoPlayTimer = setInterval(() => {
        fireQuestionPulse();
      }, 4200);
    }

    // Bezier point helper for smooth branching curves
    const getBezierPoint = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
      };
    };

    // Render step
    const render = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 1000;
      const h = 180;

      ctx.clearRect(0, 0, w, h);

      // Main landmark coordinates
      const startNode = { x: Math.max(52, w * 0.1), y: h * 0.5 };
      const centerNode = { x: w * 0.48, y: h * 0.5 };
      const choiceNode = { x: w - Math.max(90, w * 0.14), y: h * 0.24 };
      const scoreNode = { x: w - Math.max(90, w * 0.14), y: h * 0.5 };
      const noulNode = { x: w - Math.max(90, w * 0.14), y: h * 0.76 };

      // ────────────────────────────────────────────────────────────
      // 1. SLEEK TRACK LINES (Dark cyber circuits with subtle glow)
      // ────────────────────────────────────────────────────────────
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Trunk line: Question -> Simple Jev
      ctx.strokeStyle = '#1E212D';
      ctx.beginPath();
      ctx.moveTo(startNode.x, startNode.y);
      ctx.lineTo(centerNode.x, centerNode.y);
      ctx.stroke();

      // Branch 1: Categorize (Top Curve)
      const cp1_choice = { x: centerNode.x + (choiceNode.x - centerNode.x) * 0.45, y: centerNode.y };
      const cp2_choice = { x: centerNode.x + (choiceNode.x - centerNode.x) * 0.55, y: choiceNode.y };
      ctx.beginPath();
      ctx.moveTo(centerNode.x, centerNode.y);
      ctx.bezierCurveTo(cp1_choice.x, cp1_choice.y, cp2_choice.x, cp2_choice.y, choiceNode.x, choiceNode.y);
      ctx.stroke();

      // Branch 2: Rate (Center Line)
      ctx.beginPath();
      ctx.moveTo(centerNode.x, centerNode.y);
      ctx.lineTo(scoreNode.x, scoreNode.y);
      ctx.stroke();

      // Branch 3: Verify (Bottom Curve)
      const cp1_noul = { x: centerNode.x + (noulNode.x - centerNode.x) * 0.45, y: centerNode.y };
      const cp2_noul = { x: centerNode.x + (noulNode.x - centerNode.x) * 0.55, y: noulNode.y };
      ctx.beginPath();
      ctx.moveTo(centerNode.x, centerNode.y);
      ctx.bezierCurveTo(cp1_noul.x, cp1_noul.y, cp2_noul.x, cp2_noul.y, noulNode.x, noulNode.y);
      ctx.stroke();

      // ────────────────────────────────────────────────────────────
      // 2. SHOCKWAVES & RIPPLES (Tactile impact waves)
      // ────────────────────────────────────────────────────────────
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 1.4;
        sw.alpha *= 0.93;

        if (sw.alpha < 0.03 || sw.radius > sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.5 * sw.alpha;
        ctx.globalAlpha = sw.alpha;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ────────────────────────────────────────────────────────────
      // 3. SPARKS (Explosive colorful sparks)
      // ────────────────────────────────────────────────────────────
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.95;
        sp.vy *= 0.95;
        sp.alpha *= 0.93;

        if (sp.alpha < 0.05) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ────────────────────────────────────────────────────────────
      // 4. MOVING QUESTION PARTICLES (With pause at decision diamond)
      // ────────────────────────────────────────────────────────────
      const speedMultiplier = isHovered ? 0.45 : 1.0;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        let curX = 0;
        let curY = 0;

        // PAUSE HANDLING AT CENTER DIAMOND: lets the user comfortably read the question!
        if (p.pauseFrames > 0) {
          p.pauseFrames -= speedMultiplier;
          curX = centerNode.x;
          curY = centerNode.y;
        } else if (p.t < 0.5) {
          // Phase 1: Moving to center
          p.t += p.speed * speedMultiplier;

          // Check if just reached center diamond
          if (p.t >= 0.5 && !p.hasPaused) {
            p.t = 0.5;
            p.hasPaused = true;
            p.pauseFrames = 48; // Pause for ~0.8 seconds!
            coreFlashRef.current = 1.0;

            setActiveStory((prev) => ({ ...prev, isDecided: true }));

            // Expanding ripple wave at center
            shockwavesRef.current.push({
              x: centerNode.x,
              y: centerNode.y,
              radius: 6,
              maxRadius: 36,
              alpha: 0.9,
              color: p.color,
            });

            // Gentle spark burst
            for (let s = 0; s < 7; s++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1.2 + Math.random() * 2.5;
              sparksRef.current.push({
                x: centerNode.x,
                y: centerNode.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                alpha: 1,
                color: p.color,
                size: 1.5 + Math.random() * 1.5,
              });
            }
          }

          const localT = Math.min(p.t / 0.5, 1);
          curX = startNode.x + (centerNode.x - startNode.x) * localT;
          curY = startNode.y;
        } else {
          // Phase 2: Traveling into decided branch
          p.t += p.speed * speedMultiplier;
          const localT = Math.min((p.t - 0.5) / 0.5, 1);

          if (p.branch === 'choice') {
            const pt = getBezierPoint(centerNode, cp1_choice, cp2_choice, choiceNode, localT);
            curX = pt.x;
            curY = pt.y;
          } else if (p.branch === 'score') {
            curX = centerNode.x + (scoreNode.x - centerNode.x) * localT;
            curY = scoreNode.y;
          } else {
            const pt = getBezierPoint(centerNode, cp1_noul, cp2_noul, noulNode, localT);
            curX = pt.x;
            curY = pt.y;
          }

          // Arrival at endpoint gate
          if (p.t >= 1.0) {
            const target = p.branch === 'choice' ? choiceNode : p.branch === 'score' ? scoreNode : noulNode;

            targetFlashesRef.current[p.branch] = 1.0;

            shockwavesRef.current.push({
              x: target.x,
              y: target.y,
              radius: 5,
              maxRadius: 30,
              alpha: 0.9,
              color: p.color,
            });

            for (let s = 0; s < 6; s++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1 + Math.random() * 2.2;
              sparksRef.current.push({
                x: target.x,
                y: target.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                alpha: 1,
                color: p.color,
                size: 1.5,
              });
            }

            particlesRef.current.splice(i, 1);
            continue;
          }
        }

        // Fading comet trail behind pulse
        p.trail.unshift({ x: curX, y: curY });
        if (p.trail.length > 8) p.trail.pop();

        for (let tr = 0; tr < p.trail.length; tr++) {
          const pt = p.trail[tr];
          const trAlpha = (1 - tr / p.trail.length) * 0.45;
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = trAlpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, p.size * (1 - tr / p.trail.length)), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Bright luminous head
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(curX, curY, p.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ────────────────────────────────────────────────────────────
        // HIGH-CONTRAST READABLE BUBBLE ABOVE PULSE
        // Pauses at center so the user can easily read without rushing!
        // ────────────────────────────────────────────────────────────
        const tagText = p.t < 0.5 ? p.question : p.answer;
        const tagColor = p.t < 0.5 ? '#FFFFFF' : p.color;

        ctx.save();
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const textWidth = ctx.measureText(tagText).width;
        const tagX = curX - textWidth / 2;
        const tagY = curY - 16;

        // Dark solid high-contrast bubble
        ctx.fillStyle = 'rgba(12, 14, 20, 0.95)';
        ctx.strokeStyle = p.t >= 0.5 ? p.color : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(tagX - 7, tagY - 11, textWidth + 14, 18, 4);
        ctx.fill();
        ctx.stroke();

        // Crisp text
        ctx.shadowBlur = 0;
        ctx.fillStyle = tagColor;
        ctx.fillText(tagText, tagX, tagY + 2);
        ctx.restore();
      }

      // ────────────────────────────────────────────────────────────
      // 5. LANDMARK NODES WITH CLEAN NON-TECHNICAL LABELS
      // ────────────────────────────────────────────────────────────

      // A. "Your Question" Start Node
      ctx.save();
      ctx.fillStyle = '#101217';
      ctx.strokeStyle = '#323748';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startNode.x, startNode.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#C8FF00';
      ctx.beginPath();
      ctx.arc(startNode.x, startNode.y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Clear readable node label
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#A1A1AA';
      ctx.textAlign = 'center';
      ctx.fillText('Your Question', startNode.x, startNode.y + 24);
      ctx.restore();

      // B. "Simple Jev" Decision Diamond
      const flash = coreFlashRef.current;
      if (coreFlashRef.current > 0) coreFlashRef.current *= 0.92;

      ctx.save();
      ctx.translate(centerNode.x, centerNode.y);

      // Outer diamond ring with impact glow
      ctx.strokeStyle = flash > 0.1 ? '#C8FF00' : '#2D3244';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#C8FF00';
      ctx.shadowBlur = flash * 18;
      ctx.fillStyle = '#101218';

      ctx.beginPath();
      ctx.rect(-11, -11, 22, 22);
      ctx.fill();
      ctx.stroke();

      // Inner glowing core
      ctx.fillStyle = flash > 0.1 ? '#C8FF00' : '#8B5CF6';
      ctx.beginPath();
      ctx.arc(0, 0, 4 + flash * 2, 0, Math.PI * 2);
      ctx.fill();

      // Clear center label
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = flash > 0.1 ? '#C8FF00' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('Simple Jev', 0, 24);
      ctx.restore();

      // C. Endpoint Receptor Gates (Categorize, Rate, Verify)
      const drawGate = (node: { x: number; y: number }, key: 'choice' | 'score' | 'noul', color: string, label: string) => {
        const targetFlash = targetFlashesRef.current[key];
        if (targetFlashesRef.current[key] > 0) targetFlashesRef.current[key] *= 0.92;

        ctx.save();
        ctx.fillStyle = '#101217';
        ctx.strokeStyle = targetFlash > 0.1 ? color : '#2A2E3D';
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = targetFlash * 20;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3.5 + targetFlash * 2, 0, Math.PI * 2);
        ctx.fill();

        // Simple text label next to the gate
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = targetFlash > 0.1 ? '#FFFFFF' : '#A1A1AA';
        ctx.textAlign = 'left';
        ctx.fillText(label, node.x + 16, node.y + 4);
        ctx.restore();
      };

      drawGate(choiceNode, 'choice', DECISION_TYPES.choice.color, 'Categorize');
      drawGate(scoreNode, 'score', DECISION_TYPES.score.color, 'Rate 1-5');
      drawGate(noulNode, 'noul', DECISION_TYPES.noul.color, 'Verify');

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [fireQuestionPulse, isAutoPlaying, isHovered]);

  // Click on track fires a pulse toward clicked height
  const handleTrackClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const yRatio = (e.clientY - rect.top) / rect.height;

    let target: 'choice' | 'score' | 'noul';
    if (yRatio < 0.35) {
      target = 'choice';
    } else if (yRatio > 0.65) {
      target = 'noul';
    } else {
      target = 'score';
    }

    fireQuestionPulse(target);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full border-t border-b border-[#1C1E26] bg-[#07080A] py-5 px-4 sm:px-8 relative overflow-hidden select-none"
      id="decision-pulse-interactive"
    >
      {/* Soft ambient center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[150px] bg-[#C8FF00]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-2.5 relative z-10">
        {/* Friendly Micro-Header: Clear, non-technical, fun */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
            <span className="font-bold text-white tracking-wide uppercase font-sans text-xs">
              Live Decision Demo
            </span>
            <span className="text-[#52525B] hidden sm:inline">•</span>
            <span className="text-[#8E909B] hidden sm:inline font-sans">
              Watch plain English questions turn into instant decisions
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA] font-sans">
            <span>
              Answers delivered: <strong className="text-[#C8FF00] font-mono">{answersCount}</strong>
            </span>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer transition-colors font-mono ${isAutoPlaying
                  ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]'
                  : 'bg-[#181A22] border-[#2A2E3D] text-[#71717A]'
                }`}
              title="Toggle automatic question stream"
            >
              AUTO PLAY: {isAutoPlaying ? 'ON' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* 60FPS Interactive Visual Track */}
        <div className="relative rounded-[8px] bg-[#0A0C10] border border-[#1C1F2B] overflow-hidden shadow-inner group">
          <canvas
            ref={canvasRef}
            onClick={handleTrackClick}
            className="w-full h-[180px] cursor-pointer block"
            title="Click anywhere to ask a question (hover to slow down)"
          />

          {/* Friendly Type Selector Buttons in Top Right */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            {(['choice', 'score', 'noul'] as const).map((key) => {
              const cfg = DECISION_TYPES[key];
              const isSelected = activeType === key;
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveType(key);
                    fireQuestionPulse(key);
                  }}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${isSelected
                      ? 'bg-white text-black shadow-md scale-105 font-semibold'
                      : 'bg-[#13151D] hover:bg-[#1C1F2B] text-[#D4D4D8] hover:text-white border-[#272B3B] hover:border-white/20'
                    }`}
                  style={{ borderColor: isSelected ? cfg.color : undefined }}
                  title={cfg.hint}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Friendly "Ask a Question" Button Bottom Left */}
          <div className="absolute bottom-3 left-3 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fireQuestionPulse();
              }}
              className="px-3.5 py-1.5 rounded-[4px] bg-[#C8FF00] hover:bg-[#D4FF00] text-black font-sans font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>ASK A QUESTION ↵</span>
            </button>
          </div>

          {/* Plain English Outcome Badge Bottom Right */}
          <div className="absolute bottom-3 right-3 pointer-events-none z-20 animate-fade-in">
            <div className="px-3 py-1 rounded-[4px] bg-black/85 backdrop-blur-md border border-white/15 text-[11px] font-sans text-white flex items-center gap-2 shadow-lg">
              <span className="text-[#8E909B]">Result:</span>
              <strong style={{ color: DECISION_TYPES[activeStory.branch].color }}>
                {activeStory.isDecided
                  ? DECISION_TYPES[activeStory.branch].resultText
                  : 'Thinking in Simple Jev...'}
              </strong>
              <span className="text-[10px] text-[#10B981] font-mono font-bold bg-[#10B981]/10 px-1.5 py-0.2 rounded border border-[#10B981]/30">
                0.08s
              </span>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* STATIONARY LIVE STORYLINE BAR (100% Readable at a Glance!)   */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="p-2.5 sm:p-3 rounded-[6px] bg-[#0E1015] border border-[#1D202A] flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          <div className="flex flex-wrap items-center gap-2 text-white">
            <span className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider">
              Live Question:
            </span>
            <span className="font-semibold text-[#F4F4F5]">
              "{activeStory.question}"
            </span>
            <span className="text-[#52525B]">➔</span>
            <span className="text-[#71717A] text-[10px] font-mono uppercase tracking-wider">
              Answer:
            </span>
            <strong
              className="px-2 py-0.5 rounded text-[11px] font-medium"
              style={{
                color: DECISION_TYPES[activeStory.branch].color,
                backgroundColor: `${DECISION_TYPES[activeStory.branch].color}18`,
              }}
            >
              {activeStory.isDecided ? activeStory.answer : 'Processing...'}
            </strong>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#71717A] shrink-0 font-mono">
            <span>Speed: <strong className="text-[#10B981]">0.08s</strong></span>
            <span>•</span>
            <span className="text-[#A1A1AA]">Hover to slow down</span>
          </div>
        </div>
      </div>
    </div>
  );
}
