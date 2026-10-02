'use client';

import React, { useEffect } from 'react';
import { CandidateSchema } from '../types';
import { DotCluster } from './AbstractGeometry';

interface DeltaPromptProps {
  delta: Record<string, unknown>;
  schema: CandidateSchema;
  onIncludeAndExecute: () => void;
  onRevertToPrevious: () => void;
  onPrefetch?: () => void;
  isExecuting: boolean;
}

export default function DeltaPrompt({
  delta,
  schema,
  onIncludeAndExecute,
  onRevertToPrevious,
  onPrefetch,
  isExecuting,
}: DeltaPromptProps) {
  const added = (Array.isArray(delta.added_options) ? delta.added_options : []) as string[];
  const removed = (Array.isArray(delta.removed_options) ? delta.removed_options : []) as string[];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isExecuting) {
        onPrefetch?.();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [schema, onPrefetch, isExecuting]);

  return (
    <div
      className="w-full max-w-2xl bg-[#0E0E10] border border-[#27272B] border-l-[3px] border-l-[#F59E0B] rounded-[4px] p-5 sm:p-6 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden animate-fade-in"
      id="delta-prompt-card"
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 pointer-events-none select-none">
        <DotCluster rows={2} cols={2} color="red" />
        <span className="font-mono text-[9px] text-[#F59E0B] tracking-widest">[DELTA]</span>
      </div>

      {/* Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="gt-badge gt-badge--amber font-mono">
          [SCHEMA VARIATION DETECTED]
        </span>
      </div>

      {/* Delta description */}
      <div className="mb-2 text-white font-sans text-sm sm:text-base font-semibold leading-snug">
        {added.length > 0 && (
          <span>
            Last time this ran without{' '}
            <span className="text-[#F59E0B] font-mono text-xs">
              {added.join(', ')}
            </span>
            . A new option has appeared.
          </span>
        )}
        {removed.length > 0 && (
          <span className="ml-1">
            Options{' '}
            <span className="text-[#F59E0B] font-mono text-xs">
              {removed.join(', ')}
            </span>{' '}
            were excluded.
          </span>
        )}
      </div>

      <p className="mb-4 text-xs sm:text-sm text-[#71717A] font-sans leading-relaxed">
        Include the updated option set for this decision run?
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          className={`gt-btn-execute inline-flex items-center gap-2 ${isExecuting ? 'opacity-95 cursor-wait shadow-[0_0_25px_rgba(200,255,0,0.5)] border-[#C8FF00]' : ''}`}
          onClick={onIncludeAndExecute}
          onMouseEnter={onPrefetch}
          onPointerDown={onPrefetch}
          onFocus={onPrefetch}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-ping" />
              <span className="font-mono text-white tracking-wide">EXECUTING JEV (~300ms)...</span>
            </>
          ) : (
            'Include & Execute'
          )}
        </button>

        <button
          className="gt-btn-secondary px-3.5 py-2 text-xs font-mono"
          onClick={onRevertToPrevious}
          disabled={isExecuting}
        >
          Revert to Previous Rule
        </button>
      </div>
    </div>
  );
}
