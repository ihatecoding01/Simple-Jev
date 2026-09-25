'use client';

import React from 'react';
import { QuotaStatus } from '../types';

interface HeaderProps {
  mode: 'restricted' | 'unrestricted';
  setMode: (mode: 'restricted' | 'unrestricted') => void;
  quota: QuotaStatus;
  onOpenSidebar: () => void;
  pinnedCount: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Header({
  mode,
  setMode,
  quota,
  onOpenSidebar,
  pinnedCount,
  theme,
  toggleTheme,
}: HeaderProps) {
  const isUnrestricted = mode === 'unrestricted';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer shadow-sm relative"
          onClick={onOpenSidebar}
          title="Open Saved Rules & History"
          id="sidebar-toggle-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          {pinnedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {pinnedCount}
            </span>
          )}
        </button>

        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3"></path>
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Simple Jev
          </span>
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            System 1
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Mode Toggle Group */}
        <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-full shadow-inner">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              !isUnrestricted
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setMode('restricted')}
            id="mode-restricted-btn"
            title="Restricted Mode: Always confirms candidate schemas before executing"
          >
            <span>🔒</span> Restricted
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              isUnrestricted
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setMode('unrestricted')}
            id="mode-unrestricted-btn"
            title="Unrestricted Mode: Safety-First auto execution on cache hits, confirms deltas & novel queries"
          >
            <span>⚡</span> Unrestricted
          </button>
        </div>

        {/* Daily Request Meter */}
        <div
          className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300 font-mono shadow-sm cursor-help"
          title={`Daily Inquiries: ${quota.remaining} of ${quota.daily_limit} remaining.\nRepeat runs and cached schemas use 0 credits.`}
          id="usage-meter-badge"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              quota.remaining < 5 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
            }`}
          />
          <span>{quota.remaining} / {quota.daily_limit}</span>
        </div>

        {/* Theme Toggle */}
        <button
          className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
