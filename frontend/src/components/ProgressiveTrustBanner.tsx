'use client';

import React from 'react';
import { DotCluster } from './AbstractGeometry';

interface ProgressiveTrustBannerProps {
  onSwitch: () => void;
  onDismiss: () => void;
}

export default function ProgressiveTrustBanner({ onSwitch, onDismiss }: ProgressiveTrustBannerProps) {
  return (
    <div
      className="p-4 sm:p-5 rounded-[4px] bg-[#131418] border border-[#272A35] border-l-[3px] border-l-[#FF2E54] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(255,46,84,0.15)] relative overflow-hidden animate-fade-in"
      id="progressive-trust-banner"
    >
      <div className="absolute top-2 right-2 opacity-50 pointer-events-none select-none">
        <DotCluster rows={2} cols={3} color="red" />
      </div>

      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-[2px] bg-[#FF2E54]/15 border border-[#FF2E54]/40 flex items-center justify-center text-[10px] shrink-0 font-mono font-bold text-[#FF2E54] shadow-[0_0_12px_rgba(255,46,84,0.25)]">
          3/3
        </div>
        <div>
          <div className="font-semibold text-xs sm:text-sm text-white font-mono tracking-wide">
            PROGRESSIVE TRUST MILESTONE // 3 CONFIRMED RUNS
          </div>
          <div className="text-xs text-[#A1A1AA] font-sans mt-0.5">
            You haven&apos;t needed to edit any generated schemas. Ready to enable <strong className="text-white">Unrestricted Mode</strong> for instant, zero-click execution on repeat queries?
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono">
        <button
          className="gt-btn-execute text-xs px-3.5 py-1.5"
          onClick={onSwitch}
        >
          Switch to Unrestricted
        </button>
        <button
          className="px-3 py-1.5 text-xs font-mono font-medium bg-transparent hover:bg-[#1F222A] text-[#71717A] hover:text-white rounded-[4px] border border-[#272A35] uppercase tracking-wider transition-colors cursor-pointer"
          onClick={onDismiss}
        >
          Keep Restricted
        </button>
      </div>
    </div>
  );
}
