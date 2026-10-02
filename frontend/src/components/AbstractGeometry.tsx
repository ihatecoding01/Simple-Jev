'use client';

import React, { useState, useEffect } from 'react';

// Dot cluster with matrix grid (from Reference Image 2)
export function DotCluster({
  rows = 3,
  cols = 3,
  color = 'lime',
  className = '',
}: {
  rows?: number;
  cols?: number;
  color?: 'lime' | 'violet' | 'white' | 'dark' | 'red';
  className?: string;
}) {
  const dotColorClass = {
    lime: 'bg-[#C8FF00]',
    violet: 'bg-[#8B5CF6]',
    white: 'bg-white',
    dark: 'bg-[#2E2E32]',
    red: 'bg-[#FF2E54]',
  }[color];

  return (
    <div
      className={`inline-grid gap-1.5 select-none ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${dotColorClass} transition-opacity duration-300`}
        />
      ))}
    </div>
  );
}

// Stepped pixel block shape from Reference Images 1 & 2
export function SteppedBlock({
  variant = 'lime',
  size = 'md',
  className = '',
}: {
  variant?: 'lime' | 'violet' | 'purple-steps' | 'checker';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24';

  if (variant === 'checker') {
    return (
      <div className={`${dim} pattern-checker border border-[#2E2E32] ${className}`} />
    );
  }

  if (variant === 'violet') {
    return (
      <div className={`relative ${dim} ${className}`}>
        <div className="absolute inset-0 bg-[#8B5CF6] shape-stepped shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
        <div className="absolute top-1 left-1 w-2 h-2 bg-[#A78BFA]" />
      </div>
    );
  }

  if (variant === 'purple-steps') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="w-12 h-3 bg-[#8B5CF6]" />
        <div className="w-8 h-3 bg-[#A78BFA] ml-4" />
        <div className="w-4 h-3 bg-[#C4B5FD] ml-8" />
      </div>
    );
  }

  return (
    <div className={`relative ${dim} ${className}`}>
      <div className="absolute inset-0 bg-[#C8FF00] shape-stepped shadow-[0_0_25px_rgba(200,255,0,0.35)]" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-black" />
    </div>
  );
}

// Small localized grid stamp box (not whole screen!)
export function SmallGridBox({
  width = 80,
  height = 80,
  variant = 'default',
  className = '',
}: {
  width?: number;
  height?: number;
  variant?: 'default' | 'lime' | 'violet';
  className?: string;
}) {
  const variantClass = {
    default: 'local-grid-box',
    lime: 'local-grid-box-lime',
    violet: 'local-grid-box-violet',
  }[variant];

  return (
    <div
      className={`${variantClass} pointer-events-none select-none ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}

// Barcode & technical tag stamp from Reference Image 1
export function BarcodeTag({
  code = 'JEV — v1',
  className = '',
}: {
  code?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 font-mono text-[10px] text-[#A1A1AA] ${className}`}>
      <div className="flex items-center gap-[2px] h-3.5">
        <span className="w-[1px] h-full bg-[#C8FF00]" />
        <span className="w-[2px] h-full bg-[#C8FF00]" />
        <span className="w-[1px] h-full bg-[#71717A]" />
        <span className="w-[3px] h-full bg-[#C8FF00]" />
        <span className="w-[1px] h-full bg-[#71717A]" />
        <span className="w-[2px] h-full bg-[#8B5CF6]" />
        <span className="w-[1px] h-full bg-[#8B5CF6]" />
        <span className="w-[4px] h-full bg-[#C8FF00]" />
      </div>
      <span className="tracking-widest uppercase font-semibold text-[#C8FF00]">{code}</span>
      <span className="text-[#71717A]">READY</span>
    </div>
  );
}

// Dynamic ASCII / digital telemetry stream
export function AsciiTelemetry({ className = '' }: { className?: string }) {
  const [frame, setFrame] = useState(0);

  const glyphs = ['■ □ ▣ ▤', '▣ ▤ ▥ ▦', '▤ ▥ ▦ ■', '▥ ▦ ■ □'];
  const telemetry = [
    'READY — ALL SYSTEMS ACTIVE',
    'DECISION SPEED — 70MS',
    'VERIFIED — QUALITY CHECK PASSED',
    'STATUS — ACCEPTING QUERIES',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % telemetry.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [telemetry.length]);

  return (
    <div className={`flex items-center gap-3 font-mono text-[10px] select-none ${className}`}>
      <span className="text-[#C8FF00] font-bold tracking-widest">{glyphs[frame]}</span>
      <span className="text-[#A1A1AA] tracking-wider uppercase">{telemetry[frame]}</span>
    </div>
  );
}

// Outward shape expansion revealing text from center
export function OutwardApertureHero({
  title,
  subtitle,
  onTrigger,
}: {
  title: string;
  subtitle: string;
  onTrigger?: () => void;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Mount triggers the outward burst
    const t = setTimeout(() => {
      setActive(true);
      onTrigger?.();
    }, 80);
    return () => clearTimeout(t);
  }, [onTrigger]);

  return (
    <div className="relative py-8 sm:py-14 overflow-hidden select-none">
      {/* Intense Ambient Neon Green & Violet Spotlight in the background */}
      <div className="neon-ambient-glow neon-spotlight-hero w-[320px] sm:w-[540px] h-[320px] sm:h-[420px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="neon-ambient-glow neon-spotlight-bottom w-[260px] sm:w-[460px] h-[220px] sm:h-[320px] right-0 bottom-0" />

      {/* Abstract Shape 1: Top-Left Stepped Voxel + Dot cluster expanding out */}
      <div
        className={`absolute top-0 left-2 sm:left-6 z-10 transition-all pointer-events-none ${
          active ? 'anim-burst-tl' : 'opacity-0 scale-50'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#C8FF00] shape-stepped shadow-[0_0_20px_rgba(200,255,0,0.4)]" />
          <div className="flex flex-col gap-1 pt-1">
            <DotCluster rows={3} cols={3} color="violet" />
            <span className="font-mono text-[9px] text-[#A78BFA] tracking-widest uppercase">26.03</span>
          </div>
        </div>
      </div>

      {/* Abstract Shape 2: Top-Right Local Grid Stamp + Violet Stepped Block */}
      <div
        className={`absolute top-2 right-2 sm:right-8 z-10 transition-all pointer-events-none ${
          active ? 'anim-burst-tr' : 'opacity-0 scale-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <SmallGridBox width={50} height={50} variant="violet" />
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#8B5CF6] shape-stepped shadow-[0_0_20px_rgba(139,92,246,0.35)]" />
        </div>
      </div>

      {/* Abstract Shape 3: Bottom-Left Checkerboard Stamp + Dots */}
      <div
        className={`absolute bottom-2 left-4 sm:left-10 z-10 transition-all pointer-events-none ${
          active ? 'anim-burst-bl' : 'opacity-0 scale-50'
        }`}
      >
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 pattern-checker border border-[#2E2E32]" />
          <DotCluster rows={2} cols={4} color="lime" />
        </div>
      </div>

      {/* Abstract Shape 4: Bottom-Right Diagonal Stripe Block + L-shaped Dots */}
      <div
        className={`absolute bottom-0 right-3 sm:right-12 z-10 transition-all pointer-events-none ${
          active ? 'anim-burst-br' : 'opacity-0 scale-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-6 pattern-stripes-lime border border-[#C8FF00]/40" />
          <div className="w-2.5 h-2.5 bg-[#FF2E54] shadow-[0_0_12px_rgba(255,46,84,0.5)]" />
        </div>
      </div>

      {/* Centered High-Contrast Revealed Content */}
      <div
        className={`relative z-20 text-center max-w-3xl mx-auto px-4 ${
          active ? 'anim-reveal-text' : 'opacity-0'
        }`}
      >
        {/* Scanned Badge */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-[2px] bg-[#141416] border border-[#27272B] mb-5 shadow-[0_0_15px_rgba(200,255,0,0.1)]">
          <span className="w-2 h-2 bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-white uppercase">
            SIMPLE JEV — DECISION ENGINE
          </span>
          <span className="text-[#8B5CF6] font-mono text-[10px]">v1.13</span>
        </div>

        {/* Commanding White Display Headline */}
        <h1 className="type-display text-white">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-[#A1A1AA] font-sans max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {/* ASCII / Barcode Telemetry strip below headline */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 border-t border-[#27272B] pt-4">
          <BarcodeTag code="JEV CORE" />
          <span className="hidden sm:inline text-[#27272B]">|</span>
          <AsciiTelemetry />
        </div>
      </div>
    </div>
  );
}
