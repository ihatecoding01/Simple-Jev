'use client';

import React from 'react';

// ────────────────────────────────────────────────────────────
// Decision Pulse — bottom-of-page animation replacing Pacman
// A signal pulse travels forward, hits a decision node,
// and splits into colored branches (Choice/Score/Noul).
// Represents the core product concept visually.
// ────────────────────────────────────────────────────────────

export default function DecisionPulse() {
  return (
    <div className="w-full border-t border-[#22242D] bg-[#0E0F13]/90 py-4 px-4 overflow-hidden relative select-none">
      <div className="max-w-7xl mx-auto">
        {/* Animated SVG track */}
        <svg
          viewBox="0 0 1200 60"
          className="w-full h-[50px]"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Main input path */}
          <line x1="0" y1="30" x2="500" y2="30" stroke="#272A35" strokeWidth="1.5" />

          {/* Decision node */}
          <circle cx="520" cy="30" r="8" fill="none" stroke="#272A35" strokeWidth="1.5" />
          <circle cx="520" cy="30" r="3" fill="#C8FF00" opacity="0.6">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="2.5;4;2.5" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Branch 1 — top (Choice) */}
          <path d="M528 28 Q560 8 650 10 L900 10" fill="none" stroke="#272A35" strokeWidth="1.5" />
          {/* Branch label */}
          <text x="910" y="14" fill="#8B5CF6" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="600" opacity="0.7">
            CHOICE
          </text>

          {/* Branch 2 — middle (Score) */}
          <line x1="528" y1="30" x2="900" y2="30" stroke="#272A35" strokeWidth="1.5" />
          <text x="910" y="34" fill="#C8FF00" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="600" opacity="0.7">
            SCORE
          </text>

          {/* Branch 3 — bottom (Noul) */}
          <path d="M528 32 Q560 52 650 50 L900 50" fill="none" stroke="#272A35" strokeWidth="1.5" />
          <text x="910" y="54" fill="#10B981" fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="600" opacity="0.7">
            NOUL
          </text>

          {/* End dots */}
          <circle cx="900" cy="10" r="3" fill="#8B5CF6" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" begin="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="900" cy="30" r="3" fill="#C8FF00" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="900" cy="50" r="3" fill="#10B981" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" begin="1.2s" repeatCount="indefinite" />
          </circle>

          {/* Traveling pulse along the input line */}
          <circle r="3" fill="#C8FF00" opacity="0.9">
            <animateMotion dur="3s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href="#pulse-path-main" />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Pulse along branch 1 */}
          <circle r="2.5" fill="#8B5CF6" opacity="0">
            <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.5s" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href="#pulse-path-b1" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.7;1" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Pulse along branch 2 */}
          <circle r="2.5" fill="#C8FF00" opacity="0">
            <animateMotion dur="2s" repeatCount="indefinite" begin="1.7s" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href="#pulse-path-b2" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.7;1" dur="2s" begin="1.7s" repeatCount="indefinite" />
          </circle>

          {/* Pulse along branch 3 */}
          <circle r="2.5" fill="#10B981" opacity="0">
            <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.9s" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href="#pulse-path-b3" />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.7;1" dur="2.5s" begin="1.9s" repeatCount="indefinite" />
          </circle>

          {/* Hidden motion paths */}
          <defs>
            <path id="pulse-path-main" d="M0 30 L520 30" />
            <path id="pulse-path-b1" d="M528 28 Q560 8 650 10 L900 10" />
            <path id="pulse-path-b2" d="M528 30 L900 30" />
            <path id="pulse-path-b3" d="M528 32 Q560 52 650 50 L900 50" />
          </defs>

          {/* Ambient glow behind node */}
          <circle cx="520" cy="30" r="20" fill="url(#nodeGlow)" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
          </circle>

          <defs>
            <radialGradient id="nodeGlow">
              <stop offset="0%" stopColor="#C8FF00" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C8FF00" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Input label */}
          <text x="10" y="24" fill="#71717A" fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="500" opacity="0.6">
            YOUR QUESTION
          </text>

          {/* Node label */}
          <text x="498" y="55" fill="#71717A" fontSize="7.5" fontFamily="'JetBrains Mono', monospace" fontWeight="500" textAnchor="middle" opacity="0.5">
            DECISION
          </text>
        </svg>
      </div>
    </div>
  );
}
