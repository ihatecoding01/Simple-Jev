'use client';

import React, { useState } from 'react';
import { CandidateSchema } from '../types';

interface ConfirmationCardProps {
  schema: CandidateSchema;
  plainTranslation?: string;
  onConfirm: () => void;
  onOptionRemove: (index: number) => void;
  onOptionAdd: (newOption: string) => void;
  onStructuralPatch: (patchText: string) => void;
  isExecuting: boolean;
  isCached?: boolean;
}

export default function ConfirmationCard({
  schema,
  plainTranslation,
  onConfirm,
  onOptionRemove,
  onOptionAdd,
  onStructuralPatch,
  isExecuting,
  isCached,
}: ConfirmationCardProps) {
  const [showEditBox, setShowEditBox] = useState(false);
  const [isAddingChip, setIsAddingChip] = useState(false);
  const [newChipText, setNewChipText] = useState('');
  const [patchText, setPatchText] = useState('');

  const isChoice = schema.type === 'Choice';
  const options = schema.options || [];

  const handleAddChipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChipText.trim()) {
      onOptionAdd(newChipText.trim());
      setNewChipText('');
      setIsAddingChip(false);
    }
  };

  const handlePatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patchText.trim()) {
      onStructuralPatch(patchText.trim());
      setPatchText('');
      setShowEditBox(false);
    }
  };

  return (
    <div
      className="w-full max-w-2xl animate-fade-in"
      style={{
        backgroundColor: '#111113',
        border: '1px solid #2E2E32',
        borderLeft: '3px solid #8B5CF6',
        borderRadius: '4px',
        padding: '20px 24px',
      }}
      id="confirmation-card"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="gt-badge gt-badge--violet"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {isCached ? '⚡ CACHED RULE' : '✦ CANDIDATE SCHEMA'}
          </span>
          <span
            className="gt-badge gt-badge--violet"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {schema.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Plain-language translation */}
      <div
        className="mb-4 leading-snug"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1rem',
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1.4,
        }}
      >
        {plainTranslation || "I've structured a decision schema for your request. Sound right?"}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1F1F23', marginBottom: '16px' }} />

      {/* Interactive chips for Choice schema */}
      {isChoice && (
        <div className="mb-4">
          <div
            className="mb-2"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#71717A',
            }}
          >
            Click × to remove · + to add options (local re-verification, 0 credits):
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {options.map((opt, idx) => (
              <span key={`${opt}-${idx}`} className="gt-chip">
                <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{opt}</span>
                {options.length > 2 && (
                  <button
                    className="gt-chip--remove-btn"
                    onClick={() => onOptionRemove(idx)}
                    title={`Remove "${opt}"`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {isAddingChip ? (
              <form onSubmit={handleAddChipSubmit} className="inline-flex">
                <input
                  type="text"
                  value={newChipText}
                  onChange={(e) => setNewChipText(e.target.value)}
                  placeholder="New option..."
                  className="gt-input"
                  style={{ width: '140px', padding: '6px 12px', fontSize: '0.75rem' }}
                  autoFocus
                  onBlur={() => { if (!newChipText.trim()) setIsAddingChip(false); }}
                />
              </form>
            ) : (
              <button
                className="gt-chip gt-chip--add"
                onClick={() => setIsAddingChip(true)}
                title="Add a custom choice"
              >
                + Add Option
              </button>
            )}
          </div>
        </div>
      )}

      {/* Structural patch box */}
      {showEditBox && (
        <form onSubmit={handlePatchSubmit} className="flex gap-2 mb-4 animate-fade-in">
          <input
            type="text"
            value={patchText}
            onChange={(e) => setPatchText(e.target.value)}
            placeholder="e.g. 'Rate urgency 1-5' or 'Add a refunds category'..."
            className="gt-input flex-1"
            style={{ fontSize: '0.8125rem' }}
            autoFocus
          />
          <button type="submit" className="gt-btn-primary" style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
            Update
          </button>
        </form>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="gt-btn-primary"
          onClick={onConfirm}
          disabled={isExecuting}
          id="confirm-decision-btn"
        >
          {isExecuting ? '⟳ Running Jev...' : 'Looks Good — Run Decision ↵'}
        </button>

        <button
          className="gt-btn-secondary"
          onClick={() => setShowEditBox(!showEditBox)}
          id="toggle-edit-btn"
          style={{ padding: '10px 16px' }}
        >
          {showEditBox ? 'Cancel' : 'Edit Phrasing'}
        </button>
      </div>
    </div>
  );
}
