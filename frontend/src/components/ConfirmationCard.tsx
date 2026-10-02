'use client';

import React, { useState, useEffect } from 'react';
import { CandidateSchema } from '../types';
import { DotCluster } from './AbstractGeometry';

interface ConfirmationCardProps {
  schema: CandidateSchema;
  plainTranslation?: string;
  onConfirm: () => void;
  onOptionRemove: (index: number) => void;
  onOptionAdd: (newOption: string) => void;
  onStructuralPatch: (patchText: string) => void;
  onPrefetch?: () => void;
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
  onPrefetch,
  isExecuting,
  isCached,
}: ConfirmationCardProps) {
  const [showEditBox, setShowEditBox] = useState(false);
  const [isAddingChip, setIsAddingChip] = useState(false);
  const [newChipText, setNewChipText] = useState('');
  const [patchText, setPatchText] = useState('');

  // Speculatively prefetch decision on mount while user is reviewing options
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isExecuting) {
        onPrefetch?.();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [schema, onPrefetch, isExecuting]);

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
      className="w-full max-w-2xl bg-[#0E0E10] border border-[#27272B] border-l-[3px] border-l-[#8B5CF6] rounded-[4px] p-5 sm:p-6 shadow-[0_0_30px_rgba(139,92,246,0.12)] relative overflow-hidden animate-fade-in"
      id="confirmation-card"
    >
      {/* Decorative top-right stepped shape and dot matrix */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-50 pointer-events-none select-none">
        <DotCluster rows={2} cols={3} color="violet" />
        <div className="w-3 h-3 bg-[#C8FF00] shape-stepped" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="gt-badge gt-badge--violet font-mono">
            {isCached ? '[CACHED RULE]' : '[CANDIDATE SCHEMA]'}
          </span>
          <span className="gt-badge gt-badge--violet font-mono">
            {schema.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Plain-language translation */}
      <div className="mb-4 text-white font-sans text-base sm:text-lg font-semibold leading-snug">
        {plainTranslation || "I've structured a decision schema for your request. Sound right?"}
      </div>

      {/* Divider */}
      <div className="border-t border-[#19191C] mb-4" />

      {/* Interactive visual chips for Choice schema */}
      {isChoice && (
        <div className="mb-5">
          <div className="mb-2 font-mono text-[10px] tracking-wider uppercase text-[#71717A]">
            Click x to remove, + to add options (local re-verification, 0 credits):
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {options.map((opt, idx) => (
              <span key={`${opt}-${idx}`} className="gt-chip">
                <span className="font-sans text-white">{opt}</span>
                {options.length > 2 && (
                  <button
                    className="gt-chip--remove-btn"
                    onClick={() => onOptionRemove(idx)}
                    title={`Remove "${opt}"`}
                  >
                    x
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
                  className="gt-input w-36 px-2.5 py-1 text-xs"
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
            className="gt-input flex-1 text-xs"
            autoFocus
          />
          <button type="submit" className="gt-btn-primary px-4 py-2 text-xs">
            Update
          </button>
        </form>
      )}

      {/* Action buttons — High-Importance Crimson Red for Run Decision */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          className={`gt-btn-execute inline-flex items-center gap-2 ${isExecuting ? 'opacity-95 cursor-wait shadow-[0_0_25px_rgba(200,255,0,0.5)] border-[#C8FF00]' : ''}`}
          onClick={onConfirm}
          onMouseEnter={onPrefetch}
          onPointerDown={onPrefetch}
          onFocus={onPrefetch}
          disabled={isExecuting}
          id="confirm-decision-btn"
        >
          {isExecuting ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-ping" />
              <span className="font-mono text-white tracking-wide">EXECUTING JEV (~300ms)...</span>
            </>
          ) : (
            'Run Decision'
          )}
        </button>

        <button
          className="gt-btn-secondary px-3.5 py-2 text-xs font-mono"
          onClick={() => setShowEditBox(!showEditBox)}
          id="toggle-edit-btn"
        >
          {showEditBox ? 'Cancel' : 'Edit Phrasing'}
        </button>
      </div>
    </div>
  );
}
