'use client';

import React from 'react';

interface ProgressiveTrustBannerProps {
  onSwitch: () => void;
  onDismiss: () => void;
}

export default function ProgressiveTrustBanner({ onSwitch, onDismiss }: ProgressiveTrustBannerProps) {
  return (
    <div
      className="p-4 rounded-[4px] bg-[#111113] border border-[#2E2E32] border-l-[3px] border-l-[#8B5CF6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(139,92,246,0.08)] animate-in fade-in"
      id="progressive-trust-banner"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-7 h-7 rounded-[2px] bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center text-xs shrink-0 font-mono text-[#8B5CF6]">
          ✦
        </div>
        <div>
          <div className="font-semibold text-xs sm:text-sm text-white font-mono">
            PROGRESSIVE TRUST MILESTONE: 3 CONFIRMED RUNS
          </div>
          <div className="text-xs text-[#A1A1AA] font-sans mt-0.5">
            You haven&apos;t needed to edit any generated schemas. Ready to enable <strong>Unrestricted Mode</strong> for instant, zero-click execution on repeat queries?
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono">
        <button
          className="px-3 py-1.5 text-xs font-semibold bg-[#C8FF00] hover:bg-[#A3CC00] text-[#0A0A0A] rounded-[4px] uppercase tracking-wider transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(200,255,0,0.2)]"
          onClick={onSwitch}
        >
          Switch to Unrestricted
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium bg-transparent hover:bg-[#1C1C1F] text-[#71717A] hover:text-white rounded-[4px] border border-[#2E2E32] uppercase tracking-wider transition-colors cursor-pointer"
          onClick={onDismiss}
        >
          Keep Restricted
        </button>
      </div>
    </div>
  );
}
