'use client';

import React from 'react';

// Dot-matrix Ghost representation (7 columns x 7 rows)
// 1 = ghost body dot, 2 = eye dot, 0 = empty space
const GHOST_MATRIX = [
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 2, 1, 1, 2, 1, 1],
  [1, 2, 1, 1, 2, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
];

export function DotGhost({ isScared = false }: { isScared?: boolean }) {
  return (
    <div
      className="inline-grid gap-[1.5px] select-none"
      style={{
        gridTemplateColumns: 'repeat(7, 3px)',
        gridTemplateRows: 'repeat(7, 3px)',
      }}
    >
      {GHOST_MATRIX.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (cell === 0) {
            return <span key={`${rIdx}-${cIdx}`} className="w-[3px] h-[3px]" />;
          }
          if (cell === 2) {
            // Eyes
            return (
              <span
                key={`${rIdx}-${cIdx}`}
                className={`w-[3px] h-[3px] rounded-full ${
                  isScared ? 'bg-white' : 'bg-[#00FFFF]'
                }`}
              />
            );
          }
          // Body
          return (
            <span
              key={`${rIdx}-${cIdx}`}
              className={`w-[3px] h-[3px] rounded-full transition-colors duration-300 ${
                isScared ? 'bg-[#38BDF8]' : 'bg-[#FF2E54]'
              }`}
            />
          );
        })
      )}
    </div>
  );
}

export function Pacman({ facingLeft = false }: { facingLeft?: boolean }) {
  return (
    <div
      className={`relative w-5 h-5 transition-transform duration-200 select-none ${
        facingLeft ? '-scale-x-100' : 'scale-x-100'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-[#C8FF00] pacman-mouth-chomp shadow-[0_0_12px_rgba(200,255,0,0.4)]" />
    </div>
  );
}

export default function PacmanTrack() {
  return (
    <div className="w-full border-t border-[#22242D] bg-[#0E0F13]/90 py-2.5 px-4 overflow-hidden relative select-none">
      {/* Track info tag */}
      <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-[9px] text-[#71717A] uppercase tracking-widest mb-1.5 px-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
          <span>ARCADE TELEMETRY // CYCLIC CHASE ENGINE</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>PHASE 1: GHOST CHASES PACMAN (L → R)</span>
          <span className="text-[#3A3D4A]">|</span>
          <span>PHASE 2: PACMAN CHASES GHOST (R → L)</span>
        </div>
      </div>

      {/* The Animated Runway Track */}
      <div className="relative h-9 w-full bg-[#13151B] border border-[#22242D] rounded-[2px] overflow-hidden flex items-center">
        {/* Ambient track glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C8FF00]/5 to-transparent pointer-events-none" />

        {/* Pellets along the track */}
        <div className="absolute inset-x-0 flex justify-between px-6 pointer-events-none opacity-25">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-white" />
          ))}
        </div>

        {/* Moving actors group driven by cyclic keyframe */}
        <div className="pacman-chase-cycle absolute left-0 flex items-center gap-6">
          {/* Pacman Actor */}
          <div className="actor-pacman">
            <Pacman />
          </div>

          {/* Dot Ghost Actor */}
          <div className="actor-ghost">
            <DotGhost />
          </div>
        </div>
      </div>
    </div>
  );
}
