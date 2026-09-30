'use client';

import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#050505]/90 border-b border-[#27272B] px-4 sm:px-8 py-3 transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          {/* Reactor Lime brand mark — sharp square, 2px radius */}
          <div className="w-7 h-7 flex items-center justify-center font-mono font-bold bg-[#C8FF00] text-[#000000] rounded-[2px] text-xs tracking-wider shadow-[0_0_12px_rgba(200,255,0,0.35)] group-hover:scale-105 transition-transform">
            J1
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white font-mono">
              Simple Jev
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-[#71717A] tracking-widest uppercase">
              // SYSTEM ONE
            </span>
          </div>
        </Link>

        {/* Center: Playground Link */}
        <div className="flex items-center">
          <Link
            href="/playground"
            className="flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-[2px] bg-[#141416] hover:bg-[#1A1A1D] border border-[#27272B] hover:border-[#C8FF00] text-xs font-mono font-semibold text-white hover:text-[#C8FF00] tracking-wider uppercase transition-all shadow-sm hover:shadow-[0_0_15px_rgba(200,255,0,0.2)] group"
            id="nav-playground-btn"
          >
            <span className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full group-hover:shadow-[0_0_8px_#C8FF00]" />
            <span>PLAYGROUND</span>
            <span className="text-[#8B5CF6] text-[10px]">↗</span>
          </Link>
        </div>

        {/* Right: GitHub Repo Link */}
        <div className="flex items-center">
          <a
            href="https://github.com/ihatecoding01/Conversational-Jev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#141416] hover:bg-[#1A1A1D] border border-[#27272B] hover:border-[#8B5CF6] text-xs font-mono text-[#A1A1AA] hover:text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            title="View GitHub Repository"
            id="nav-github-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
            <span className="text-[10px] text-[#71717A]">↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
