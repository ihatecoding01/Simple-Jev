'use client';

import React from 'react';
import { CandidateSchema } from '../types';

interface DeltaPromptProps {
  delta: Record<string, any>;
  schema: CandidateSchema;
  onIncludeAndExecute: () => void;
  onRevertToPrevious: () => void;
  isExecuting: boolean;
}

export default function DeltaPrompt({
  delta,
  schema,
  onIncludeAndExecute,
  onRevertToPrevious,
  isExecuting,
}: DeltaPromptProps) {
  const added = delta.added_options || [];
  const removed = delta.removed_options || [];

  return (
    <div
      className="w-full max-w-2xl bg-amber-950/20 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl border-l-4 border-l-amber-500 space-y-3"
      id="delta-prompt-card"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span>⚠️ Schema Variation Detected</span>
        </span>
      </div>

      <div className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
        {added.length > 0 && (
          <span>
            Last time this rule ran without <strong>{added.join(', ')}</strong>. This time there's a new option:{' '}
            <span className="text-amber-400 font-bold">{added.join(', ')}</span>.
          </span>
        )}
        {removed.length > 0 && (
          <span className="ml-1">
            Previous options <strong>{removed.join(', ')}</strong> were excluded.
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-400">
        Would you like to include this updated option set for this decision?
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          className="px-4 py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
          onClick={onIncludeAndExecute}
          disabled={isExecuting}
        >
          {isExecuting ? 'Running Jev...' : 'Include & Execute'}
        </button>

        <button
          className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          onClick={onRevertToPrevious}
          disabled={isExecuting}
        >
          Revert to Previous Rule
        </button>
      </div>
    </div>
  );
}
