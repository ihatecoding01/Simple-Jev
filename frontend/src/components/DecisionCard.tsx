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
      className="w-full max-w-2xl animate-fade-in"
      style={{
        backgroundColor: '#111113',
        border: '1px solid #2E2E32',
        borderLeft: '3px solid #10B981',
        borderRadius: '4px',
        padding: '20px 24px',
      }}
      id="decision-result-card"
    >
      {/* Top row: badge + execution time */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="gt-badge gt-badge--emerald">
            ✓ JEV DECISION
          </span>
          <span className="gt-badge gt-badge--emerald">
            {result.execution_time_ms}ms
          </span>
        </div>
        {/* Confidence meter */}
        <div
          className="flex items-center gap-2"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#71717A',
          }}
        >
          <span>CERTAINTY</span>
          <div
            style={{
              width: '80px',
              height: '4px',
              backgroundColor: '#1C1C1F',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${confidencePct}%`,
                height: '100%',
                backgroundColor: '#10B981',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <span style={{ color: '#10B981', fontWeight: 700 }}>{confidencePct}%</span>
        </div>
      </div>

      {/* Decision verdict */}
      <div
        className="mb-3"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(1.375rem, 3vw, 1.75rem)',
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {String(result.decision)}
      </div>

      {/* Summary */}
      <div
        className="mb-4 leading-relaxed"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.875rem',
          color: '#A1A1AA',
        }}
        dangerouslySetInnerHTML={{ __html: result.summary }}
      />

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1F1F23', marginBottom: '12px' }} />

      {/* Action toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="gt-btn-ghost"
          onClick={handleCopy}
          title="Copy decision to clipboard"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>

        <button
          className="gt-btn-ghost"
          onClick={handlePin}
          title="Save this validated rule to sidebar"
        >
          {pinned ? '✓ Pinned!' : '📌 Pin Rule'}
        </button>

        {sortedDist.length > 0 && (
          <button
            className="gt-btn-ghost"
            onClick={() => setShowBreakdown(!showBreakdown)}
            title="Inspect probability spread across alternatives"
          >
            {showBreakdown ? '↑ Hide' : '📊 Breakdown'}
          </button>
        )}
      </div>

      {/* Probability breakdown */}
      {showBreakdown && sortedDist.length > 0 && (
        <div
          className="mt-4 animate-fade-in"
          style={{
            backgroundColor: '#161618',
            border: '1px solid #1F1F23',
            borderRadius: '4px',
            padding: '16px',
          }}
        >
          <div
            className="mb-3"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#71717A',
            }}
          >
            Probability Distribution · Jev Softmax
          </div>

          <div className="space-y-2.5">
            {sortedDist.map(([opt, prob]) => {
              const pct = Math.round(prob * 100);
              const isTop = opt === String(result.decision);
              return (
                <div key={opt} className="flex items-center gap-3">
                  <div
                    className="truncate font-medium"
                    style={{
                      width: '140px',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.75rem',
                      color: isTop ? '#FFFFFF' : '#A1A1AA',
                    }}
                    title={opt}
                  >
                    {opt}
                  </div>
                  <div
                    className="flex-1 overflow-hidden"
                    style={{
                      height: '4px',
                      backgroundColor: '#1C1C1F',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: isTop ? '#C8FF00' : '#8B5CF6',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: '36px',
                      textAlign: 'right',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.6875rem',
                      color: isTop ? '#C8FF00' : '#71717A',
                      fontWeight: isTop ? 700 : 400,
                    }}
                  >
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
