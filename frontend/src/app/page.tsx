'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import PacmanTrack from '../components/PacmanTrack';
import FloatingGeometry from '../components/FloatingGeometry';
import ScrollReveal, { StaggerReveal } from '../components/ScrollReveal';
import {
  DotCluster,
  SteppedBlock,
  SmallGridBox,
  BarcodeTag,
  AsciiTelemetry,
  OutwardApertureHero,
} from '../components/AbstractGeometry';

// ────────────────────────────────────────────────────────────────────
// Typing ASCII Banner — Reference video style streaming text
// ────────────────────────────────────────────────────────────────────
function AsciiStreamBanner() {
  const line1 = '█▓░ SYSTEM.ONE // NON-AUTOREGRESSIVE DECISION ENGINE ░▓█    ';
  const line2 = '■□▣ PARALLEL EXECUTION // 70ms LATENCY // TYPED SCHEMAS ▣□■    ';

  return (
    <div className="w-full overflow-hidden py-3 border-y border-[#1C1E26] bg-[#0B0C0E]/80 select-none">
      <div className="flex gap-12 anim-ascii-stream whitespace-nowrap">
        <span className="font-mono text-[10px] text-[#C8FF00]/40 tracking-[0.25em] uppercase">
          {line1}{line1}
        </span>
        <span className="font-mono text-[10px] text-[#8B5CF6]/30 tracking-[0.25em] uppercase">
          {line2}{line2}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Interactive Metric Card with hover micro-interaction
// ────────────────────────────────────────────────────────────────────
function MetricCard({
  value,
  label,
  sublabel,
  color,
  delay,
}: {
  value: string;
  label: string;
  sublabel: string;
  color: 'lime' | 'white' | 'violet';
  delay: number;
}) {
  const colorMap = {
    lime: 'text-[#C8FF00]',
    white: 'text-white',
    violet: 'text-[#8B5CF6]',
  };

  return (
    <ScrollReveal variant="fade-up" delay={delay} duration={600}>
      <div className="group relative p-5 rounded-[4px] bg-[#131418] border border-[#272A35] hover:border-[#3A3D4A] transition-all duration-300 cursor-default overflow-hidden anim-hover-pulse">
        {/* Shimmer overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 anim-neon-shimmer" />
        
        <div className="relative z-10 space-y-1.5">
          <div className={`text-3xl sm:text-4xl font-extrabold font-mono ${colorMap[color]}`}>
            {value}
          </div>
          <div className="text-xs font-mono text-white font-semibold uppercase tracking-wider">
            {label}
          </div>
          <p className="text-[11px] text-[#71717A] font-sans">{sublabel}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}

// ────────────────────────────────────────────────────────────────────
// Animated stepped block composition — floats and drifts
// ────────────────────────────────────────────────────────────────────
function FloatingBlockComposition({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      {/* Top-left cluster */}
      <div className="absolute top-[8%] left-[3%] anim-float-slow opacity-20">
        <SteppedBlock variant="lime" size="lg" />
      </div>
      <div className="absolute top-[12%] left-[8%] anim-float opacity-15">
        <DotCluster rows={3} cols={3} color="violet" />
      </div>

      {/* Top-right cluster */}
      <div className="absolute top-[5%] right-[5%] anim-float-fast opacity-15">
        <SteppedBlock variant="violet" size="md" />
      </div>
      <div className="absolute top-[18%] right-[3%] anim-float-slow opacity-10">
        <SmallGridBox width={60} height={60} variant="lime" />
      </div>

      {/* Mid-left */}
      <div className="absolute top-[45%] left-[2%] anim-float opacity-12">
        <SteppedBlock variant="checker" size="sm" />
      </div>

      {/* Mid-right */}
      <div className="absolute top-[50%] right-[4%] anim-breathe opacity-20">
        <DotCluster rows={4} cols={4} color="lime" />
      </div>

      {/* Bottom-left */}
      <div className="absolute bottom-[15%] left-[5%] anim-float-fast opacity-15">
        <div className="w-12 h-6 pattern-stripes-lime border border-[#C8FF00]/20" />
      </div>

      {/* Bottom-right */}
      <div className="absolute bottom-[10%] right-[6%] anim-float-slow opacity-18">
        <SteppedBlock variant="lime" size="sm" />
      </div>
      <div className="absolute bottom-[20%] right-[2%] anim-float opacity-10">
        <DotCluster rows={2} cols={5} color="violet" />
      </div>
    </div>
  );
}

export default function Home() {
  const [activePrimitive, setActivePrimitive] = useState<'choice' | 'score' | 'noul'>('choice');
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = '> INITIALIZING SYSTEM ONE DECISION ENGINE...';

  // Typewriter effect for terminal feel
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (idx <= fullText.length) {
        setTypewriterText(fullText.slice(0, idx));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="terminal-sheet bg-[#0B0C0E] text-[#FFFFFF] min-h-screen relative overflow-hidden flex flex-col">
      {/* Canvas-based floating geometry particles */}
      <FloatingGeometry particleCount={40} glitchLineCount={5} />

      {/* Static floating block compositions */}
      <FloatingBlockComposition className="hidden md:block" />

      {/* Neon ambient spotlights */}
      <div className="neon-ambient-glow neon-spotlight-hero w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] left-1/2 top-[12%] -translate-x-1/2" />
      <div className="neon-ambient-glow neon-spotlight-bottom w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] right-[-120px] top-[45%]" />

      <Header />

      <main className="flex-1 relative z-10">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HERO: Outward Aperture + ASCII Terminal Bootup             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative px-4 sm:px-8 pt-6 pb-8 text-center">
          {/* Terminal bootup line */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#131418] border border-[#272A35] rounded-[2px]">
              <span className="font-mono text-[10px] text-[#C8FF00] tracking-wider">
                {typewriterText}
              </span>
              <span className="w-2 h-3.5 bg-[#C8FF00] anim-cursor-blink" />
            </div>
          </div>

          <OutwardApertureHero
            title="Parallel Decisions in 70ms."
            subtitle="TypeSafe AI Jev requires rigid JSON schemas. Simple Jev bridges plain English into deterministic System 1 decisions with zero raw code exposed."
          />

          {/* CTA Buttons */}
          <ScrollReveal variant="fade-up" delay={400} duration={800}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-20">
              <Link
                href="/playground"
                className="gt-btn-execute text-xs sm:text-sm px-6 py-3 shadow-[0_0_20px_rgba(255,46,84,0.4)] hover:shadow-[0_0_30px_rgba(255,46,84,0.6)] hover:scale-105 active:scale-95 transition-all"
                id="hero-launch-playground-btn"
              >
                <span>LAUNCH PLAYGROUND ↵</span>
              </Link>
              <a
                href="#comparison"
                className="gt-btn-secondary text-xs px-5 py-3 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
              >
                <span>SEE HOW IT WORKS ↓</span>
              </a>
            </div>
          </ScrollReveal>
        </section>

        {/* ASCII streaming ticker */}
        <AsciiStreamBanner />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KEY NUMBERS: Animated metric cards                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="border-b border-[#272A35] bg-[#131418]/60 py-10 px-4 sm:px-8 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard value="70ms" label="Parallel Latency" sublabel="Non-autoregressive System 1" color="lime" delay={0} />
            <MetricCard value="0 JSON" label="Raw Code Exposed" sublabel="Interactive visual chips only" color="white" delay={100} />
            <MetricCard value="5-PT" label="Meta-Schema Contract" sublabel="Pre-execution fitness audit" color="violet" delay={200} />
            <MetricCard value="0 CR" label="Cached Repeat Runs" sublabel="384-d normalized vector cache" color="lime" delay={300} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* COMPARISON: Old Way vs Conversational Way                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="comparison" className="terminal-section py-14 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <ScrollReveal variant="glitch-in" duration={800}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-[#8B5CF6] font-bold tracking-widest uppercase block mb-1">
                    [ 01 // ARCHITECTURAL PARADIGM SHIFT ]
                  </span>
                  <h2 className="type-headline text-white">
                    Why engineers wrote schemas — and why you don't have to.
                  </h2>
                </div>
                <BarcodeTag code="COMPARE // 01" />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Old Manual Way */}
              <ScrollReveal variant="fade-left" delay={200}>
                <div className="group p-5 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-3 opacity-80 hover:opacity-100 transition-all duration-300 hover:border-[#FF2E54]/40">
                  <div className="flex items-center justify-between border-b border-[#272A35] pb-2">
                    <span className="font-mono text-[10px] text-[#FF2E54] font-bold tracking-wider uppercase">
                      [MANUAL] THE OLD WAY // RIGID JSON CODE
                    </span>
                    <span className="text-[10px] text-[#71717A] font-mono">10+ mins scripting</span>
                  </div>
                  <pre className="p-3 bg-[#181A20] rounded-[2px] border border-[#272A35] font-mono text-[11px] text-[#71717A] overflow-x-auto leading-relaxed">
{`{
  "schema": {
    "type": "Choice",
    "options": ["Billing", "Support", "Fraud"]
  },
  "state": {
    "user_input": "Charged twice on #994..."
  }
}`}
                  </pre>
                  <p className="text-xs text-[#71717A] font-sans">
                    Requires manual JSON engineering upfront. Syntax errors or mismatched schemas break Jev entirely.
                  </p>
                </div>
              </ScrollReveal>

              {/* Right: Conversational Jev Way */}
              <ScrollReveal variant="fade-right" delay={350}>
                <div className="group p-5 rounded-[4px] bg-[#131418] border border-[#C8FF00]/40 neon-edge-glow-lime space-y-3 relative overflow-hidden hover:shadow-[0_0_35px_rgba(200,255,0,0.2)] transition-shadow duration-500">
                  <div className="absolute top-2 right-2 opacity-30 pointer-events-none anim-breathe">
                    <SmallGridBox width={40} height={40} variant="lime" />
                  </div>
                  <div className="flex items-center justify-between border-b border-[#272A35] pb-2 relative z-10">
                    <span className="font-mono text-[10px] text-[#C8FF00] font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
                      [SIMPLE JEV] PLAIN ENGLISH
                    </span>
                    <span className="text-[10px] text-[#C8FF00] font-mono font-bold">70ms instant</span>
                  </div>
                  <div className="p-3 bg-[#181A20] rounded-[2px] border border-[#272A35] space-y-2 relative z-10">
                    <div className="text-xs text-white font-medium font-sans">
                      "I was charged twice on invoice #994. Please issue a refund ASAP."
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#C8FF00] text-black font-mono text-[10px] font-bold">
                        [PASS] Billing (98%)
                      </span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#1F222A] text-[#71717A] font-mono text-[10px]">
                        Support (1%)
                      </span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#1F222A] text-[#71717A] font-mono text-[10px]">
                        Fraud (1%)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#A1A1AA] font-sans relative z-10">
                    Type any sentence. Auto-translated to visual chips with 5-point safety check and executed instantly.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 3 PRIMITIVES: Interactive cards with animations             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="terminal-section py-14 px-4 sm:px-8 bg-[#131418]/60">
          <div className="max-w-4xl mx-auto space-y-6">
            <ScrollReveal variant="glitch-in" duration={800}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-[#C8FF00] font-bold tracking-widest uppercase block mb-1">
                    [ 02 // THREE SYSTEM ONE PRIMITIVES ]
                  </span>
                  <h2 className="type-headline text-white">
                    Deterministic decision archetypes.
                  </h2>
                </div>
                <div className="flex gap-1.5">
                  {(['choice', 'score', 'noul'] as const).map((prim) => (
                    <button
                      key={prim}
                      className={`px-3 py-1 font-mono text-xs font-semibold rounded-[2px] cursor-pointer transition-all duration-300 ${
                        activePrimitive === prim
                          ? 'bg-[#C8FF00] text-black shadow-[0_0_12px_rgba(200,255,0,0.3)] scale-105'
                          : 'bg-[#181A20] text-[#71717A] hover:text-white hover:bg-[#1F222A]'
                      }`}
                      onClick={() => setActivePrimitive(prim)}
                    >
                      {prim.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Primitive Dynamic Feature Card */}
            <ScrollReveal variant="scale-up" delay={200}>
              <div className="p-6 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-4 relative overflow-hidden anim-border-glow-morph">
                <div className="absolute top-3 right-3 opacity-30 pointer-events-none anim-float">
                  <DotCluster rows={2} cols={4} color="violet" />
                </div>

                {activePrimitive === 'choice' && (
                  <div className="space-y-3 animate-fade-in" key="choice">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6] font-mono text-[10px] font-bold rounded-[2px]">
                        CLASSIFICATION
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">Multi-Class Categorization</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      Select exactly one category from discrete mutually exclusive options.
                    </h3>
                    <div className="p-4 bg-[#181A20] border border-[#272A35] rounded-[2px] flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#71717A] font-mono mr-2">Example Options:</span>
                      {['Billing & Invoicing', 'Technical Infrastructure', 'Account Access'].map((opt, i) => (
                        <span
                          key={opt}
                          className={`px-2.5 py-1 bg-[#1F222A] border ${
                            i === 0 ? 'border-[#8B5CF6]' : 'border-[#272A35]'
                          } ${i === 0 ? 'text-white' : 'text-[#A1A1AA]'} text-xs font-medium rounded-[2px] transition-all duration-300 hover:border-[#8B5CF6] hover:text-white cursor-default`}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activePrimitive === 'score' && (
                  <div className="space-y-3 animate-fade-in" key="score">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#C8FF00]/20 border border-[#C8FF00]/40 text-[#C8FF00] font-mono text-[10px] font-bold rounded-[2px]">
                        ORDERED RUBRIC
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">Monotonic Integer Sizing</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      Score severity or urgency along an ordered numerical scale (1 to 5).
                    </h3>
                    <div className="p-4 bg-[#181A20] border border-[#272A35] rounded-[2px] flex items-center gap-3">
                      <span className="text-xs text-[#71717A] font-mono">Severity:</span>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className="px-2.5 py-1 bg-[#1F222A] text-[#71717A] rounded-[2px] transition-all hover:bg-[#272A35] hover:text-white cursor-default"
                          >
                            {n}
                          </span>
                        ))}
                        <span className="px-2.5 py-1 bg-[#FF2E54] text-white font-bold rounded-[2px] shadow-[0_0_10px_#FF2E54]">
                          5 (P1 Outage)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activePrimitive === 'noul' && (
                  <div className="space-y-3 animate-fade-in" key="noul">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-mono text-[10px] font-bold rounded-[2px]">
                        BOOLEAN ASSERTION
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">Deterministic Truth Verification</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      Verify whether a claim holds True or False with a calibrated probability score.
                    </h3>
                    <div className="p-4 bg-[#181A20] border border-[#272A35] rounded-[2px] flex items-center justify-between">
                      <span className="text-xs text-white font-mono">Assertion: "SPF passes for paypal.com"</span>
                      <span className="text-xs font-mono text-[#10B981] font-bold bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded-[2px]">
                        TRUE (99.4% Certainty)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BOTTOM POSTER CTA                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="terminal-section py-16 px-4 sm:px-8 relative overflow-hidden">
          <ScrollReveal variant="scale-up" duration={900}>
            <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-[4px] bg-[#131418] border border-[#272A35] border-l-[4px] border-l-[#C8FF00] shadow-[0_0_40px_rgba(200,255,0,0.12)] relative overflow-hidden anim-border-glow-morph">
              <div className="absolute top-4 right-4 opacity-40 pointer-events-none anim-float-slow">
                <DotCluster rows={3} cols={4} color="lime" />
              </div>

              {/* Animated scan line inside the CTA card */}
              <div className="absolute left-0 top-0 h-[1px] w-[60%] bg-gradient-to-r from-transparent via-[#C8FF00]/30 to-transparent anim-glitch-scan" />

              <div className="relative z-10 space-y-5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#181A20] border border-[#272A35] rounded-[2px] text-[10px] font-mono text-[#C8FF00] font-bold tracking-widest uppercase">
                  [ ZERO SETUP // TEST IN YOUR BROWSER ]
                </div>

                <h2 className="type-headline text-2xl sm:text-3xl font-extrabold text-white">
                  Ready to evaluate live decisions?
                </h2>

                <p className="text-sm sm:text-base text-[#A1A1AA] font-sans leading-relaxed">
                  Experience deterministic System 1 speed. No API key needed for simulation mode — pre-seeded with customer email routing and outage triage.
                </p>

                <div className="pt-2">
                  <Link
                    href="/playground"
                    className="gt-btn-execute text-sm px-6 py-3.5 shadow-[0_0_20px_rgba(255,46,84,0.4)] hover:shadow-[0_0_30px_rgba(255,46,84,0.6)] hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                    id="footer-launch-playground-btn"
                  >
                    <span>LAUNCH PLAYGROUND ↵</span>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Pacman chase animation */}
      <PacmanTrack />

      {/* Footer */}
      <footer className="border-t border-[#272A35] bg-[#0B0C0E] py-8 px-4 sm:px-8 text-xs text-[#71717A]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest">
          <div>CONVERSATIONAL JEV // SYSTEM ONE DECISION ENGINE</div>
          <div className="flex items-center gap-4">
            <Link href="/playground" className="text-[#C8FF00] hover:underline">
              PLAYGROUND ↗
            </Link>
            <a
              href="https://github.com/ihatecoding01/Conversational-Jev"
              target="_blank"
              rel="noreferrer"
              className="text-[#8B5CF6] hover:underline"
            >
              GITHUB ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
