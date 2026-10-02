'use client';

import React, { useState } from 'react';
import { CandidateSchema, ExecutionResult } from '../types';
import { DotCluster } from './AbstractGeometry';

interface DecisionCardProps {
  result: ExecutionResult;
  schema: CandidateSchema;
  onPinRule: (schema: CandidateSchema) => void;
}

export default function DecisionCard({ result, schema, onPinRule }: DecisionCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinned, setPinned] = useState(false);

  const confidencePct = Math.round(result.confidence * 100);
  const distribution = result.distribution || {};
  const sortedDist = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  const handleCopy = () => {
    const text = `Decision: ${result.decision}\nConfidence: ${confidencePct}%\nSummary: ${result.summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePin = () => {
    onPinRule(schema);
    setPinned(true);
    setTimeout(() => setPinned(false), 2500);
  };

  return (
    <div
      className="w-full max-w-2xl bg-[#0E0E10] border border-[#27272B] border-l-[3px] border-l-[#C8FF00] rounded-[4px] p-5 sm:p-6 shadow-[0_0_35px_rgba(200,255,0,0.18)] relative overflow-hidden animate-fade-in"
      id="decision-result-card"
    >
      {/* Decorative dot matrix and neon badge in top-right */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-60 pointer-events-none select-none">
        <DotCluster rows={2} cols={3} color="lime" />
        <div className="w-2.5 h-2.5 bg-[#C8FF00] shadow-[0_0_10px_#C8FF00]" />
      </div>

      {/* Top row: badge + engine state + execution time */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="gt-badge gt-badge--lime font-mono">
            [JEV DECISION]
          </span>
          {result.is_simulation !== false ? (
            <span
              className="px-2 py-0.5 rounded-[2px] bg-[#F59E0B]/20 border border-[#F59E0B]/60 text-[#F59E0B] font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              title="Evaluated via local deterministic simulation engine (JEV_API_KEY not configured in backend)"
              id="badge-engine-simulation"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              <span>SIMULATION (DEMO)</span>
            </span>
          ) : (
            <span
              className="px-2 py-0.5 rounded-[2px] bg-[#10B981]/20 border border-[#10B981]/60 text-[#10B981] font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              title="Evaluated on live TypeSafe Jev model cluster"
              id="badge-engine-live"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>LIVE TYPESAFE JEV</span>
            </span>
          )}
          <span className="gt-badge gt-badge--lime font-mono">
            {result.execution_time_ms}ms
          </span>
        </div>
        {/* Confidence meter */}
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-[#71717A]">
          <span>CERTAINTY</span>
          <div className="w-20 h-1.5 bg-[#1C1C1F] rounded-[1px] overflow-hidden">
            <div
              className="h-full bg-[#C8FF00] shadow-[0_0_10px_#C8FF00] transition-all duration-500"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-[#C8FF00] font-bold">{confidencePct}%</span>
        </div>
      </div>

      {/* High-Contrast White Decision verdict */}
      <div className="mb-2 font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
        {String(result.decision)}
      </div>

      {/* Summary */}
      <div
        className="mb-4 text-sm sm:text-base text-[#A1A1AA] font-sans leading-relaxed"
        dangerouslySetInnerHTML={{ __html: result.summary }}
      />

      {/* Divider */}
      <div className="border-t border-[#19191C] mb-3" />

      {/* Action toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="gt-btn-ghost font-mono text-xs"
          onClick={handleCopy}
          title="Copy decision to clipboard"
        >
          {copied ? '[COPIED]' : 'COPY'}
        </button>

        <button
          className="gt-btn-ghost font-mono text-xs"
          onClick={handlePin}
          title="Save this validated rule to sidebar"
        >
          {pinned ? '[PINNED]' : 'PIN RULE'}
        </button>

        {sortedDist.length > 0 && (
          <button
            className="gt-btn-ghost font-mono text-xs"
            onClick={() => setShowBreakdown(!showBreakdown)}
            title="Inspect probability spread across alternatives"
          >
            {showBreakdown ? 'HIDE' : 'BREAKDOWN'}
          </button>
        )}
      </div>

      {/* Probability breakdown */}
      {showBreakdown && sortedDist.length > 0 && (
        <div className="mt-4 p-4 rounded-[4px] bg-[#141416] border border-[#27272B] animate-fade-in space-y-3">
          <div className="font-mono text-[10px] tracking-wider uppercase text-[#71717A]">
            PROBABILITY BREAKDOWN
          </div>

          <div className="space-y-2.5">
            {sortedDist.map(([opt, prob]) => {
              const pct = Math.round(prob * 100);
              const isTop = opt === String(result.decision);
              return (
                <div key={opt} className="flex items-center gap-3">
                  <div
                    className={`w-36 truncate font-medium text-xs font-sans ${
                      isTop ? 'text-white font-bold' : 'text-[#A1A1AA]'
                    }`}
                    title={opt}
                  >
                    {opt}
                  </div>
                  <div className="flex-1 h-1.5 bg-[#1C1C1F] rounded-[1px] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isTop
                          ? 'bg-[#C8FF00] shadow-[0_0_10px_#C8FF00]'
                          : 'bg-[#8B5CF6]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div
                    className={`w-10 text-right font-mono text-xs ${
                      isTop ? 'text-[#C8FF00] font-bold' : 'text-[#71717A]'
                    }`}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loud benchmark & simulation watermark */}
      <div className="mt-4 pt-3 border-t border-[#1C1C22] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono select-none">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={result.is_simulation !== false ? 'text-[#F59E0B] font-bold flex items-center gap-1' : 'text-[#10B981] font-bold flex items-center gap-1'}>
            <span>{result.is_simulation !== false ? '⚡ BENCHMARK MODE: SIMULATION' : '🔒 BENCHMARK MODE: LIVE JEV'}</span>
          </span>
          <span className="text-[#3F3F46]">•</span>
          <span className="text-[#71717A]">
            {result.is_simulation !== false
              ? 'Local deterministic engine (demo)'
              : result.engine_name || 'TypeSafe AI Jev 1.13'}
          </span>
        </div>
        <span className="text-[#52525B]">SentenceTransformers · all-MiniLM-L6-v2</span>
      </div>
    </div>
  );
}
