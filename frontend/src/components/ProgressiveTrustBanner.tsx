'use client';

import React from 'react';

interface ProgressiveTrustBannerProps {
  onSwitch: () => void;
  onDismiss: () => void;
}

export default function ProgressiveTrustBanner({ onSwitch, onDismiss }: ProgressiveTrustBannerProps) {
  return (
    <div
      className="p-4 rounded-xl bg-white border border-[#E5E5E2] border-l-4 border-l-[#5B61F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in"
      id="progressive-trust-banner"
    >
      <div className="flex items-start sm:items-center gap-3">
        <span className="text-xl">🎉</span>
        <div>
          <div className="font-semibold text-xs sm:text-sm text-[#111111]">
            Progressive Trust Milestone: 3 Confirmed Runs!
          </div>
          <div className="text-xs text-[#6B7280]">
            You haven&apos;t needed to edit any generated schemas. Ready to switch to <strong>Unrestricted Mode</strong> for instant, zero-click execution on repeat queries?
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          className="px-3 py-1.5 text-xs font-semibold bg-[#111111] hover:bg-[#5B61F6] text-white rounded-lg shadow-xs transition-all cursor-pointer"
          onClick={onSwitch}
        >
          Switch to Unrestricted
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium bg-[#F4F4F1] hover:bg-[#E5E5E2] text-[#374151] rounded-lg border border-[#E5E5E2] transition-colors cursor-pointer"
          onClick={onDismiss}
        >
          Keep Restricted
        </button>
      </div>
    </div>
  );
}
