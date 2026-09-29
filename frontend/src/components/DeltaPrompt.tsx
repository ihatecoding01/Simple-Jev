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
      className="w-full max-w-2xl animate-fade-in"
      style={{
        backgroundColor: '#111113',
        border: '1px solid #2E2E32',
        borderLeft: '3px solid #F59E0B',
        borderRadius: '4px',
        padding: '20px 24px',
      }}
      id="delta-prompt-card"
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="gt-badge gt-badge--amber">
          ⚠ Schema Variation Detected
        </span>
      </div>

      {/* Delta description */}
      <div
        className="mb-2 leading-snug"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1.4,
        }}
      >
        {added.length > 0 && (
          <span>
            Last time this ran without{' '}
            <span style={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>
              {added.join(', ')}
            </span>
            . A new option has appeared.
          </span>
        )}
        {removed.length > 0 && (
          <span className="ml-1">
            Options{' '}
            <span style={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>
              {removed.join(', ')}
            </span>{' '}
            were excluded.
          </span>
        )}
      </div>

      <p
        className="mb-4"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.8125rem',
          color: '#71717A',
          lineHeight: 1.6,
        }}
      >
        Include the updated option set for this decision run?
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="gt-btn-primary"
          style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
          onClick={onIncludeAndExecute}
          disabled={isExecuting}
          onMouseEnter={e => {
            if (!isExecuting) {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#D97706';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.2)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#F59E0B';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          {isExecuting ? '⟳ Running Jev...' : 'Include & Execute'}
        </button>

        <button
          className="gt-btn-secondary"
          onClick={onRevertToPrevious}
          disabled={isExecuting}
          style={{ padding: '10px 16px' }}
        >
          Revert to Previous Rule
        </button>
      </div>
    </div>
  );
}
