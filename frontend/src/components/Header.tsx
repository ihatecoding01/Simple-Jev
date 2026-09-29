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
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 transition-all"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2E2E32',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <a href="#" className="flex items-center gap-2.5 no-underline group">
          {/* Reactor Lime brand mark — sharp square, 2px radius */}
          <div
            className="w-7 h-7 flex items-center justify-center font-mono text-xs font-bold transition-all group-hover:opacity-80"
            style={{
              backgroundColor: '#C8FF00',
              color: '#0A0A0A',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.04em',
            }}
          >
            J1
          </div>
          <div>
            <span
              className="font-bold text-sm tracking-tight"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF' }}
            >
              Simple Jev
            </span>
            <span
              className="hidden sm:inline-block ml-2 text-xs font-normal"
              style={{ color: '#71717A', fontFamily: "'JetBrains Mono', monospace" }}
            >
              · GRID TERMINAL
            </span>
          </div>
        </a>
      </div>

      {/* System status */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5"
        style={{
          backgroundColor: '#111113',
          border: '1px solid #2E2E32',
          borderRadius: '2px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.6rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#71717A',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: '#10B981',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <span>JEV-1.13.0</span>
        <span style={{ color: '#2E2E32' }}>|</span>
        <span>GROQ ONLINE</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Nav anchors */}
        <nav
          className="hidden lg:flex items-center gap-4"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <a href="#manifesto" style={{ color: '#71717A' }} className="hover:text-white transition-colors">
            The Idea
          </a>
          <a href="#architecture" style={{ color: '#71717A' }} className="hover:text-white transition-colors">
            Architecture
          </a>
          <a href="#playground" style={{ color: '#C8FF00' }} className="transition-colors">
            Playground
          </a>
        </nav>

        {/* Mode toggle — rectangular, no pills */}
        <div
          className="flex p-0.5 gap-0.5"
          style={{
            backgroundColor: '#111113',
            border: '1px solid #2E2E32',
            borderRadius: '4px',
          }}
        >
          <button
            className="px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: !isUnrestricted ? '#C8FF00' : 'transparent',
              color: !isUnrestricted ? '#0A0A0A' : '#71717A',
              borderRadius: '2px',
              border: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
            onClick={() => setMode('restricted')}
            id="mode-restricted-btn"
            title="Restricted Mode: Always confirms candidate schemas before executing"
          >
            🔒 Restricted
          </button>
          <button
            className="px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: isUnrestricted ? '#8B5CF6' : 'transparent',
              color: isUnrestricted ? '#FFFFFF' : '#71717A',
              borderRadius: '2px',
              border: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
            onClick={() => setMode('unrestricted')}
            id="mode-unrestricted-btn"
            title="Unrestricted Mode: Fast auto-execution on approved rules"
          >
            ⚡ Unrestricted
          </button>
        </div>

        {/* Credit meter */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5"
          style={{
            backgroundColor: '#111113',
            border: '1px solid #2E2E32',
            borderRadius: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#71717A',
          }}
        >
          <span style={{ color: '#C8FF00', fontWeight: 700 }}>{quota.remaining}</span>
          <span>/</span>
          <span>{quota.daily_limit}</span>
          <span>CR</span>
        </div>

        {/* Pinned rules */}
        <button
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer transition-all"
          style={{
            backgroundColor: '#111113',
            border: '1px solid #2E2E32',
            borderRadius: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#71717A',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#8B5CF6';
            (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#2E2E32';
            (e.currentTarget as HTMLElement).style.color = '#71717A';
          }}
          onClick={onOpenSidebar}
          title="Open Pinned Rules Library"
          id="sidebar-toggle-btn"
        >
          📌 Rules
          {pinnedCount > 0 && (
            <span
              className="w-4 h-4 flex items-center justify-center font-bold"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#FFFFFF',
                borderRadius: '2px',
                fontSize: '0.5rem',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {pinnedCount}
            </span>
          )}
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/ihatecoding01/Conversational-Jev"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center justify-center w-8 h-8 transition-colors"
          style={{
            backgroundColor: '#111113',
            border: '1px solid #2E2E32',
            borderRadius: '2px',
            color: '#71717A',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#C8FF00';
            (e.currentTarget as HTMLElement).style.color = '#C8FF00';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#2E2E32';
            (e.currentTarget as HTMLElement).style.color = '#71717A';
          }}
          title="View GitHub Repository"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
