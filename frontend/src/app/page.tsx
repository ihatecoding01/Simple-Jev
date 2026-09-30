'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import PacmanTrack from '../components/PacmanTrack';
import {
  DotCluster,
  SteppedBlock,
  SmallGridBox,
  BarcodeTag,
  AsciiTelemetry,
  OutwardApertureHero,
} from '../components/AbstractGeometry';

export default function Home() {
  const [activePrimitive, setActivePrimitive] = useState<'choice' | 'score' | 'noul'>('choice');

  return (
    <div className="terminal-sheet bg-[#0B0C0E] text-[#FFFFFF] min-h-screen relative overflow-hidden flex flex-col">
      {/* Intense Ambient Neon Green Spotlights on the Website Canvas */}
      <div className="neon-ambient-glow neon-spotlight-hero w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] left-1/2 top-[12%] -translate-x-1/2" />
      <div className="neon-ambient-glow neon-spotlight-bottom w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] right-[-120px] top-[45%]" />

      {/* Main Navbar: Logo (Left), Playground (Center), GitHub (Right) */}
      <Header />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION: Outward Aperture Animation & Big Action CTA                 */}
        {/* ========================================================================= */}
        <section className="relative px-4 sm:px-8 pt-6 pb-12 text-center">
          <OutwardApertureHero
            title="Parallel Decisions in 70ms."
            subtitle="TypeSafe AI Jev requires rigid JSON schemas. Simple Jev bridges plain English into deterministic System 1 decisions with zero raw code exposed."
          />

          {/* Primary Action Buttons */}
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
        </section>

        {/* ========================================================================= */}
        {/* KEY NUMBERS: High-impact Scannable Proof Metrics                          */}
        {/* ========================================================================= */}
        <section className="border-y border-[#272A35] bg-[#131418] py-8 px-4 sm:px-8 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#C8FF00]">
                70ms
              </div>
              <div className="text-xs font-mono text-white font-semibold uppercase tracking-wider">
                Parallel Latency
              </div>
              <p className="text-[11px] text-[#71717A] font-sans">Non-autoregressive System 1</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                0 JSON
              </div>
              <div className="text-xs font-mono text-white font-semibold uppercase tracking-wider">
                Raw Code Exposed
              </div>
              <p className="text-[11px] text-[#71717A] font-sans">Interactive visual chips only</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#8B5CF6]">
                5-PT
              </div>
              <div className="text-xs font-mono text-white font-semibold uppercase tracking-wider">
                Meta-Schema Contract
              </div>
              <p className="text-[11px] text-[#71717A] font-sans">Pre-execution fitness audit</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#C8FF00]">
                0 CR
              </div>
              <div className="text-xs font-mono text-white font-semibold uppercase tracking-wider">
                Cached Repeat Runs
              </div>
              <p className="text-[11px] text-[#71717A] font-sans">384-d normalized vector cache</p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* VISUAL COMPARISON: The Old Way vs The Conversational Way                  */}
        {/* ========================================================================= */}
        <section id="comparison" className="terminal-section py-14 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: Old Manual Way */}
              <div className="p-5 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-3 opacity-80 hover:opacity-100 transition-opacity">
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

              {/* Right: Conversational Jev Way */}
              <div className="p-5 rounded-[4px] bg-[#131418] border border-[#C8FF00]/40 neon-edge-glow-lime space-y-3 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-30 pointer-events-none">
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
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* THE 3 PRIMITIVES: Visual interactive cards                                 */}
        {/* ========================================================================= */}
        <section className="terminal-section py-14 px-4 sm:px-8 bg-[#131418]/60">
          <div className="max-w-4xl mx-auto space-y-6">
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
                <button
                  className={`px-3 py-1 font-mono text-xs font-semibold rounded-[2px] cursor-pointer transition-all ${
                    activePrimitive === 'choice'
                      ? 'bg-[#C8FF00] text-black shadow-[0_0_12px_rgba(200,255,0,0.3)]'
                      : 'bg-[#181A20] text-[#71717A] hover:text-white'
                  }`}
                  onClick={() => setActivePrimitive('choice')}
                >
                  CHOICE
                </button>
                <button
                  className={`px-3 py-1 font-mono text-xs font-semibold rounded-[2px] cursor-pointer transition-all ${
                    activePrimitive === 'score'
                      ? 'bg-[#C8FF00] text-black shadow-[0_0_12px_rgba(200,255,0,0.3)]'
                      : 'bg-[#181A20] text-[#71717A] hover:text-white'
                  }`}
                  onClick={() => setActivePrimitive('score')}
                >
                  SCORE
                </button>
                <button
                  className={`px-3 py-1 font-mono text-xs font-semibold rounded-[2px] cursor-pointer transition-all ${
                    activePrimitive === 'noul'
                      ? 'bg-[#C8FF00] text-black shadow-[0_0_12px_rgba(200,255,0,0.3)]'
                      : 'bg-[#181A20] text-[#71717A] hover:text-white'
                  }`}
                  onClick={() => setActivePrimitive('noul')}
                >
                  NOUL
                </button>
              </div>
            </div>

            {/* Primitive Dynamic Feature Card */}
            <div className="p-6 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-30 pointer-events-none">
                <DotCluster rows={2} cols={4} color="violet" />
              </div>

              {activePrimitive === 'choice' && (
                <div className="space-y-3 animate-fade-in">
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
                    <span className="px-2.5 py-1 bg-[#1F222A] border border-[#8B5CF6] text-white text-xs font-medium rounded-[2px]">
                      Billing & Invoicing
                    </span>
                    <span className="px-2.5 py-1 bg-[#1F222A] border border-[#272A35] text-[#A1A1AA] text-xs font-medium rounded-[2px]">
                      Technical Infrastructure
                    </span>
                    <span className="px-2.5 py-1 bg-[#1F222A] border border-[#272A35] text-[#A1A1AA] text-xs font-medium rounded-[2px]">
                      Account Access
                    </span>
                  </div>
                </div>
              )}

              {activePrimitive === 'score' && (
                <div className="space-y-3 animate-fade-in">
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
                      <span className="px-2.5 py-1 bg-[#1F222A] text-[#71717A] rounded-[2px]">1</span>
                      <span className="px-2.5 py-1 bg-[#1F222A] text-[#71717A] rounded-[2px]">2</span>
                      <span className="px-2.5 py-1 bg-[#1F222A] text-[#71717A] rounded-[2px]">3</span>
                      <span className="px-2.5 py-1 bg-[#1F222A] text-[#71717A] rounded-[2px]">4</span>
                      <span className="px-2.5 py-1 bg-[#FF2E54] text-white font-bold rounded-[2px] shadow-[0_0_10px_#FF2E54]">5 (P1 Outage)</span>
                    </div>
                  </div>
                </div>
              )}

              {activePrimitive === 'noul' && (
                <div className="space-y-3 animate-fade-in">
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
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BOTTOM POSTER BANNER: Huge CTA to Playground                              */}
        {/* ========================================================================= */}
        <section className="terminal-section py-16 px-4 sm:px-8 relative overflow-hidden">
          <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-[4px] bg-[#131418] border border-[#272A35] border-l-[4px] border-l-[#C8FF00] shadow-[0_0_40px_rgba(200,255,0,0.12)] relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-40 pointer-events-none">
              <DotCluster rows={3} cols={4} color="lime" />
            </div>

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
        </section>
      </main>

      {/* Retro Arcade Bottom Runner: Tiny Ghost made of dots chasing Pacman and vice versa! */}
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
