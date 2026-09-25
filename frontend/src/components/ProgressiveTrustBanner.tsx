'use client';

import React from 'react';

interface ProgressiveTrustBannerProps {
  onSwitch: () => void;
  onDismiss: () => void;
}

export default function ProgressiveTrustBanner({ onSwitch, onDismiss }: ProgressiveTrustBannerProps) {
  return (
    <div
      className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in fade-in"
      id="progressive-trust-banner"
    >
      <div className="flex items-start sm:items-center gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <div className="font-semibold text-sm text-slate-100">
            Progressive Trust Milestone: 3 Confirmed Runs!
          </div>
          <div className="text-xs text-slate-400">
            You haven't needed to edit any generated schemas. Ready to switch to <strong>Unrestricted Mode</strong> for instant, zero-click execution on repeat queries?
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
          onClick={onSwitch}
        >
          Switch to Unrestricted
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
          onClick={onDismiss}
        >
          Keep Restricted
        </button>
      </div>
    </div>
  );
}
