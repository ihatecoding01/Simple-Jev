'use client';

import React from 'react';
import { QuotaStatus } from '../types';

interface HeaderProps {
  mode: 'restricted' | 'unrestricted';
  setMode: (mode: 'restricted' | 'unrestricted') => void;
  quota: QuotaStatus;
  onOpenSidebar: () => void;
  pinnedCount: number;
}

export default function Header({
  mode,
  setMode,
  quota,
  onOpenSidebar,
  pinnedCount,
}: HeaderProps) {
  const isUnrestricted = mode === 'unrestricted';

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-[#E5E5E2] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Brand & Metaphor */}
      <div className="flex items-center gap-3">
        <a href="#" className="flex items-center gap-2.5 text-inherit no-underline group">
          <div className="w-7 h-7 rounded-md bg-[#111111] text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm group-hover:bg-[#5B61F6] transition-colors">
            J1
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-[#111111]">Simple Jev</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-[#6B7280] font-normal">
              · Conversational Layer
            </span>
          </div>
        </a>
      </div>

      {/* Live Status Indicator (imdaryl style) */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E5E5E2] text-xs font-mono text-[#4B5563] shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>JEV-1.13.0 ACTIVE</span>
        <span className="text-[#D1D5DB]">|</span>
        <span>GROQ ONLINE</span>
      </div>

      {/* Navigation & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Navigation Anchors */}
        <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-[#4B5563]">
          <a href="#manifesto" className="hover:text-[#111111] transition-colors">The Idea</a>
          <a href="#architecture" className="hover:text-[#111111] transition-colors">Architecture</a>
          <a href="#playground" className="hover:text-[#111111] transition-colors text-[#5B61F6] font-semibold">Playground</a>
        </nav>

        {/* Mode Toggle Group */}
        <div className="flex bg-[#F4F4F1] border border-[#E5E5E2] p-0.5 rounded-full shadow-inner">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              !isUnrestricted
                ? 'bg-[#111111] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
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
                ? 'bg-[#5B61F6] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
            onClick={() => setMode('unrestricted')}
            id="mode-unrestricted-btn"
            title="Unrestricted Mode: Fast auto-execution on approved rules"
          >
            <span>⚡</span> Unrestricted
          </button>
        </div>

        {/* Pinned Rules Drawer Button */}
        <button
          className="relative px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E2] text-xs font-mono text-[#374151] hover:border-[#5B61F6] hover:text-[#111111] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          onClick={onOpenSidebar}
          title="Open Pinned Rules Library"
          id="sidebar-toggle-btn"
        >
          <span>📌 Rules</span>
          {pinnedCount > 0 && (
            <span className="w-4 h-4 bg-[#5B61F6] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {pinnedCount}
            </span>
          )}
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/ihatecoding01/Conversational-Jev"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#E5E5E2] text-[#4B5563] hover:text-[#111111] hover:border-[#111111] transition-colors"
          title="View GitHub Repository"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
