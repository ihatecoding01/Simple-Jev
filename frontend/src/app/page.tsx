'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import DecisionPulse from '../components/DecisionPulse';
import FloatingGeometry from '../components/FloatingGeometry';
import ScrollReveal from '../components/ScrollReveal';
import {
  DotCluster,
  SteppedBlock,
  SmallGridBox,
  BarcodeTag,
  OutwardApertureHero,
} from '../components/AbstractGeometry';

// ────────────────────────────────────────────────────────────────────
// Flowing text ticker — non-dev-friendly version
// ────────────────────────────────────────────────────────────────────
function StreamBanner() {
  const line1 = '█▓░ INSTANT DECISIONS — ASK IN PLAIN ENGLISH — NO CODE NEEDED ░▓█    ';
  const line2 = '■□▣ CATEGORIZE — SCORE — VERIFY — ALL IN UNDER A SECOND ▣□■    ';

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
// Metric Card with hover micro-interaction
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
// Floating block compositions that drift gently
// ────────────────────────────────────────────────────────────────────
function FloatingBlockComposition({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <div className="absolute top-[8%] left-[3%] anim-float-slow opacity-20">
        <SteppedBlock variant="lime" size="lg" />
      </div>
      <div className="absolute top-[12%] left-[8%] anim-float opacity-15">
        <DotCluster rows={3} cols={3} color="violet" />
      </div>
      <div className="absolute top-[5%] right-[5%] anim-float-fast opacity-15">
        <SteppedBlock variant="violet" size="md" />
      </div>
      <div className="absolute top-[18%] right-[3%] anim-float-slow opacity-10">
        <SmallGridBox width={60} height={60} variant="lime" />
      </div>
      <div className="absolute top-[45%] left-[2%] anim-float opacity-12">
        <SteppedBlock variant="checker" size="sm" />
      </div>
      <div className="absolute top-[50%] right-[4%] anim-breathe opacity-20">
        <DotCluster rows={4} cols={4} color="lime" />
      </div>
      <div className="absolute bottom-[15%] left-[5%] anim-float-fast opacity-15">
        <div className="w-12 h-6 pattern-stripes-lime border border-[#C8FF00]/20" />
      </div>
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
  

  return (
    <div className="terminal-sheet bg-[#0B0C0E] text-[#FFFFFF] min-h-screen relative overflow-hidden flex flex-col">
      {/* Canvas-based floating geometry particles (no glitch lines) */}
      <FloatingGeometry particleCount={40} glitchLineCount={0} />

      {/* Static floating block compositions */}
      <FloatingBlockComposition className="hidden md:block" />

      {/* Neon ambient spotlights */}
      <div className="neon-ambient-glow neon-spotlight-hero w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] left-1/2 top-[12%] -translate-x-1/2" />
      <div className="neon-ambient-glow neon-spotlight-bottom w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] right-[-120px] top-[45%]" />

      <Header />

      <main className="flex-1 relative z-10">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* HERO                                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="relative px-4 sm:px-8 pt-6 pb-8 text-center">
          

          <OutwardApertureHero
            title="Instant Decisions. Zero Code."
            subtitle="Ask any question in plain English. Simple Jev turns your words into structured, deterministic decisions; categorize, score, or verify all in under a second."
          />

          <ScrollReveal variant="fade-up" delay={400} duration={800}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-20">
              <Link
                href="/playground"
                className="gt-btn-execute text-xs sm:text-sm px-6 py-3 shadow-[0_0_20px_rgba(255,46,84,0.4)] hover:shadow-[0_0_30px_rgba(255,46,84,0.6)] hover:scale-105 active:scale-95 transition-all"
                id="hero-launch-playground-btn"
              >
                <span>TRY IT NOW ↵</span>
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

        {/* Flowing text ticker */}
        <StreamBanner />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* KEY NUMBERS                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="border-b border-[#272A35] bg-[#131418]/60 py-10 px-4 sm:px-8 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard value="70ms" label="Decision Speed" sublabel="Faster than a blink of an eye" color="lime" delay={0} />
            <MetricCard value="Zero" label="Code Required" sublabel="Just type what you need" color="white" delay={100} />
            <MetricCard value="5-Point" label="Quality Check" sublabel="Every answer is verified first" color="violet" delay={200} />
            <MetricCard value="Free" label="Repeat Queries" sublabel="Same question? Instant replay" color="lime" delay={300} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* COMPARISON: The Hard Way vs The Easy Way                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="comparison" className="terminal-section py-14 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <ScrollReveal variant="glitch-in" duration={800}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-[#8B5CF6] font-bold tracking-widest uppercase block mb-1">
                    [ BEFORE vs AFTER ]
                  </span>
                  <h2 className="type-headline text-white">
                    From complex code to a simple conversation.
                  </h2>
                </div>
                <BarcodeTag code="COMPARE 01" />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left: The Hard Way */}
              <ScrollReveal variant="fade-left" delay={200}>
                <div className="group p-5 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-3 opacity-80 hover:opacity-100 transition-all duration-300 hover:border-[#FF2E54]/40">
                  <div className="flex items-center justify-between border-b border-[#272A35] pb-2">
                    <span className="font-mono text-[10px] text-[#FF2E54] font-bold tracking-wider uppercase">
                      THE HARD WAY — WRITING CODE
                    </span>
                    <span className="text-[10px] text-[#71717A] font-mono">10+ minutes</span>
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
                    Requires manual JSON engineering. One syntax error and everything breaks.
                  </p>
                </div>
              </ScrollReveal>

              {/* Right: The Easy Way */}
              <ScrollReveal variant="fade-right" delay={350}>
                <div className="group p-5 rounded-[4px] bg-[#131418] border border-[#C8FF00]/40 neon-edge-glow-lime space-y-3 relative overflow-hidden hover:shadow-[0_0_35px_rgba(200,255,0,0.2)] transition-shadow duration-500">
                  <div className="absolute top-2 right-2 opacity-30 pointer-events-none anim-breathe">
                    <SmallGridBox width={40} height={40} variant="lime" />
                  </div>
                  <div className="flex items-center justify-between border-b border-[#272A35] pb-2 relative z-10">
                    <span className="font-mono text-[10px] text-[#C8FF00] font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
                      THE EASY WAY — JUST ASK
                    </span>
                    <span className="text-[10px] text-[#C8FF00] font-mono font-bold">Under 1 second</span>
                  </div>
                  <div className="p-3 bg-[#181A20] rounded-[2px] border border-[#272A35] space-y-2 relative z-10">
                    <div className="text-xs text-white font-medium font-sans">
                      &ldquo;I was charged twice on invoice #994. Please issue a refund ASAP.&rdquo;
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#C8FF00] text-black font-mono text-[10px] font-bold">
                        Billing (98%)
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
                    Type any sentence. It&apos;s automatically understood, verified, and decided in under a second.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 3 DECISION TYPES                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="terminal-section py-14 px-4 sm:px-8 bg-[#131418]/60">
          <div className="max-w-4xl mx-auto space-y-6">
            <ScrollReveal variant="glitch-in" duration={800}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-[#C8FF00] font-bold tracking-widest uppercase block mb-1">
                    [ THREE DECISION TYPES ]
                  </span>
                  <h2 className="type-headline text-white">
                    Every question becomes one of three types.
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0D0F14] border border-[#232735] rounded-[8px] shadow-sm">
                  <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider pl-2 pr-1 hidden sm:inline">
                    Select Type:
                  </span>
                  {[
                    { id: 'choice' as const, label: 'CHOICE', hint: 'Categorize', color: '#8B5CF6' },
                    { id: 'score' as const, label: 'SCORE', hint: 'Rate 1-5', color: '#C8FF00' },
                    { id: 'noul' as const, label: 'NOUL', hint: 'Verify', color: '#10B981' },
                  ].map((prim) => {
                    const isActive = activePrimitive === prim.id;
                    return (
                      <button
                        key={prim.id}
                        className={`px-3.5 py-1.5 font-mono text-xs font-semibold rounded-[6px] cursor-pointer transition-all duration-200 flex items-center gap-2 border shadow-sm ${
                          isActive
                            ? 'bg-[#C8FF00] text-black border-[#C8FF00] shadow-[0_0_14px_rgba(200,255,0,0.35)] scale-[1.03] font-bold'
                            : 'bg-[#151720] hover:bg-[#1E2230] text-[#D4D4D8] hover:text-white border-[#2A2E3E] hover:border-white/20'
                        }`}
                        onClick={() => setActivePrimitive(prim.id)}
                        id={`tab-primitive-${prim.id}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: isActive ? '#000000' : prim.color,
                          }}
                        />
                        <span>{prim.label}</span>
                        <span
                          className={`text-[10px] font-mono tracking-wider ${
                            isActive ? 'text-black/70' : 'text-[#71717A]'
                          }`}
                        >
                          ({prim.hint})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="scale-up" delay={200}>
              <div className="p-6 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-4 relative overflow-hidden anim-border-glow-morph">
                <div className="absolute top-3 right-3 opacity-30 pointer-events-none anim-float">
                  <DotCluster rows={2} cols={4} color="violet" />
                </div>

                {activePrimitive === 'choice' && (
                  <div className="space-y-3 animate-fade-in" key="choice">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6] font-mono text-[10px] font-bold rounded-[2px]">
                        CATEGORIZE
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">Pick one from many</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      &ldquo;Which category does this belong to?&rdquo;
                    </h3>
                    <div className="p-4 bg-[#181A20] border border-[#272A35] rounded-[2px] flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#71717A] font-mono mr-2">Categories:</span>
                      {['Billing & Invoicing', 'Technical Support', 'Account Access'].map((opt, i) => (
                        <span
                          key={opt}
                          className={`px-2.5 py-1 bg-[#1F222A] border ${
                            i === 0 ? 'border-[#8B5CF6]' : 'border-[#272A35]'
                          } ${i === 0 ? 'text-white' : 'text-[#A1A1AA]'} text-xs font-medium rounded-[2px] transition-all duration-300 hover:border-[#8B5CF6] hover:text-white cursor-default`}
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
                        RATE
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">Score on a scale</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      &ldquo;How urgent is this, from 1 to 5?&rdquo;
                    </h3>
                    <div className="p-4 bg-[#181A20] border border-[#272A35] rounded-[2px] flex items-center gap-3">
                      <span className="text-xs text-[#71717A] font-mono">Urgency:</span>
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
                          5 (Critical)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activePrimitive === 'noul' && (
                  <div className="space-y-3 animate-fade-in" key="noul">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-mono text-[10px] font-bold rounded-[2px]">
                        VERIFY
                      </span>
                      <span className="text-xs font-mono text-[#71717A]">True or false?</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      &ldquo;Is this claim actually true?&rdquo;
                    </h3>
                    <div className="p-4 bg-[#181A20] border border-[#272A35] rounded-[2px] flex items-center justify-between">
                      <span className="text-xs text-white font-mono">Claim: &ldquo;SPF passes for paypal.com&rdquo;</span>
                      <span className="text-xs font-mono text-[#10B981] font-bold bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded-[2px]">
                        TRUE (99.4%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* WHY DID I CREATE THIS AND FOR WHOM                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="terminal-section py-16 px-4 sm:px-8 relative overflow-hidden">
          <ScrollReveal variant="fade-up" duration={800}>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#181A20] border border-[#272A35] rounded-[2px] text-[10px] font-mono text-[#C8FF00] font-bold tracking-widest uppercase">
                [ A NOTE FROM THE CREATOR ]
              </div>

              <h2 className="type-headline text-2xl sm:text-3xl font-extrabold text-white">
                Why did I create this — and for whom?
              </h2>

              <div className="space-y-4 font-sans text-base sm:text-lg text-[#D4D4D8] leading-relaxed">
                <p>
                  Most modern AI tools demand a computer science degree just to get a straight answer. To make a deterministic, mathematically grounded decision with Jev, you previously had to configure rigid JSON schemas, map complex state graphs, and write backend boilerplate. If you just had an urgent question in plain English, you were left behind.
                </p>

                <p>
                  I created Simple Jev with a simple, caring belief: you shouldn&apos;t have to write code to get answers you can count on. Whether you are trying to route customer emails to the right queue, rate the urgency of a midnight database crash, or verify if an incoming payment domain is authentic, the software should understand your words and do the hard math for you.
                </p>

                <p>
                  This is built for the solo founders juggling everything at once, the customer support teams drowned in tickets, the curious builders who love clean tools, and anyone exhausted by unpredictable AI hallucinations. It&apos;s made to feel calm, effortless, and dependable — turning your everyday questions into deterministic decisions in under a second.
                </p>
              </div>

              <div className="pt-4 border-t border-[#222532] flex items-center justify-between text-xs font-mono text-[#71717A]">
                <span className="text-[#C8FF00]">Built with care for everyday thinkers &amp; builders.</span>
                <span>Free to use • Zero setup</span>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Decision pulse animation */}
      <DecisionPulse />

      {/* Clean Modern Footer */}
      <footer className="border-t border-[#272A35] bg-[#0B0C0E] pt-14 pb-10 px-4 sm:px-8 text-xs text-[#71717A]">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Playground Invitation Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-[#1C1F2B]">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
                <span className="font-mono text-[10px] text-[#C8FF00] tracking-widest uppercase font-semibold">
                  [ INTERACTIVE PLAYGROUND ]
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                Make decisions in real time.
              </h3>
              <p className="text-xs sm:text-sm text-[#8E92A4] font-sans leading-relaxed">
                No setup or API key required. Explore pre-loaded templates for email routing, incident triage, and logic verification.
              </p>
            </div>

            <div className="shrink-0 flex items-center">
              <Link
                href="/playground"
                id="footer-launch-playground-btn"
                className="px-6 py-3.5 bg-[#C8FF00] hover:bg-[#D4FF00] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-[2px] shadow-[0_0_20px_rgba(200,255,0,0.25)] hover:shadow-[0_0_30px_rgba(200,255,0,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Playground</span>
                <span className="text-sm font-sans font-bold">↵</span>
              </Link>
            </div>
          </div>

          {/* Footer Navigation Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-[#1C1F2B]">
            {/* Column 1: Brand & Philosophy */}
            <div className="space-y-3">
              <div className="font-mono text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                <span className="text-[#C8FF00]">◆</span> SIMPLE JEV
              </div>
              <p className="text-xs text-[#71717A] leading-relaxed">
                A zero-code conversational layer over TypeSafe AI&apos;s Jev model. Deterministic decisions with 5-point mathematical validation.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#10B981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                SYSTEM OPERATIONAL
              </div>
            </div>

            {/* Column 2: Primitives */}
            <div className="space-y-3 font-mono text-xs">
              <div className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-bold">
                Decision Primitives
              </div>
              <ul className="space-y-2 text-[#71717A]">
                <li>
                  <span className="text-white">Choice</span> — Categorization &amp; Routing
                </li>
                <li>
                  <span className="text-white">Score</span> — 1-5 Numerical Priority
                </li>
                <li>
                  <span className="text-white">Noul</span> — Truth &amp; Verification
                </li>
              </ul>
            </div>

            {/* Column 3: Playground Links */}
            <div className="space-y-3 font-mono text-xs">
              <div className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-bold">
                Playground
              </div>
              <ul className="space-y-2">
                <li>
                  <Link href="/playground" className="text-[#C8FF00] hover:underline flex items-center gap-1">
                    <span>Open Playground</span>
                    <span>↗</span>
                  </Link>
                </li>
                <li>
                  <Link href="/playground" className="text-[#71717A] hover:text-white transition-colors">
                    Customer Email Router
                  </Link>
                </li>
                <li>
                  <Link href="/playground" className="text-[#71717A] hover:text-white transition-colors">
                    Urgency Scorer
                  </Link>
                </li>
                <li>
                  <Link href="/playground" className="text-[#71717A] hover:text-white transition-colors">
                    Security SPF Verifier
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Project & Source */}
            <div className="space-y-3 font-mono text-xs">
              <div className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-bold">
                Project
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/ihatecoding01/Conversational-Jev"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8B5CF6] hover:underline flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <span>↗</span>
                  </a>
                </li>
                <li>
                  <span className="text-[#71717A]">5-Point Meta Validator</span>
                </li>
                <li>
                  <span className="text-[#71717A]">Zero Raw JSON</span>
                </li>
                <li>
                  <span className="text-[#71717A]">Free • Zero Setup</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest text-[#71717A]">
            <div>SIMPLE JEV © 2026 — ZERO CODE DECISION LAYER</div>
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
        </div>
      </footer>
    </div>
  );
}
