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
      className="w-full max-w-2xl bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-5 shadow-xs border-l-4 border-l-[#F59E0B] space-y-3"
      id="delta-prompt-card"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-amber-100 text-amber-800 border border-amber-300">
          <span>⚠️ Schema Variation Detected</span>
        </span>
      </div>

      <div className="text-xs sm:text-sm font-semibold text-[#111111] leading-snug">
        {added.length > 0 && (
          <span>
            Last time this rule ran without <strong>{added.join(', ')}</strong>. This time there&apos;s a new option:{' '}
            <span className="text-[#D97706] font-bold">{added.join(', ')}</span>.
          </span>
        )}
        {removed.length > 0 && (
          <span className="ml-1">
            Previous options <strong>{removed.join(', ')}</strong> were excluded.
          </span>
        )}
      </div>

      <p className="text-xs text-[#6B7280]">
        Would you like to include this updated option set for this decision?
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          className="px-3.5 py-1.5 text-xs font-semibold bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          onClick={onIncludeAndExecute}
          disabled={isExecuting}
        >
          {isExecuting ? 'Running Jev...' : 'Include & Execute'}
        </button>

        <button
          className="px-3 py-1.5 text-xs font-medium bg-[#FFFFFF] hover:bg-slate-50 text-[#374151] rounded-lg border border-[#D1D5DB] transition-colors cursor-pointer shadow-xs"
          onClick={onRevertToPrevious}
          disabled={isExecuting}
        >
          Revert to Previous Rule
        </button>
      </div>
    </div>
  );
}
