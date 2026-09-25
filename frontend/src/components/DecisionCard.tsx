'use client';

import React, { useState } from 'react';
import { CandidateSchema, ExecutionResult } from '../types';

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
      className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl border-l-4 border-l-emerald-500 space-y-4"
      id="decision-result-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span>✓ JEV DECISION</span>
            <span>•</span>
            <span>{result.execution_time_ms}ms</span>
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-1.5">
            {String(result.decision)}
          </div>
        </div>

        <div className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm">
          {confidencePct}% Certainty
        </div>
      </div>

      <div
        className="text-sm text-slate-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: result.summary }}
      />

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <button
          className="px-3 py-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
          onClick={handleCopy}
          title="Copy decision to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy Result'}
        </button>

        <button
          className="px-3 py-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
          onClick={handlePin}
          title="Save this validated rule to sidebar"
        >
          {pinned ? '✓ Pinned to Sidebar!' : '📌 Pin Rule to Sidebar'}
        </button>

        {sortedDist.length > 0 && (
          <button
            className="px-3 py-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
            onClick={() => setShowBreakdown(!showBreakdown)}
            title="Inspect probability spread across alternatives"
          >
            {showBreakdown ? 'Hide Breakdown' : '📊 See Why & Alternatives'}
          </button>
        )}
      </div>

      {/* Expandable Breakdown Drawer */}
      {showBreakdown && sortedDist.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 animate-in fade-in">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Probability Distribution (Jev Softmax)
          </div>

          <div className="space-y-2">
            {sortedDist.map(([opt, prob]) => {
              const pct = Math.round(prob * 100);
              return (
                <div key={opt} className="flex items-center gap-3 text-xs">
                  <div className="w-32 sm:w-44 text-slate-300 truncate font-medium" title={opt}>
                    {opt}
                  </div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-10 text-right font-mono text-slate-400 text-[11px]">
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
