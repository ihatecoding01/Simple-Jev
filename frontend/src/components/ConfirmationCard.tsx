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
      className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E5E5E2] rounded-2xl p-5 sm:p-6 shadow-xs border-l-4 border-l-[#5B61F6] space-y-4"
      id="confirmation-card"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-[#5B61F6] border border-indigo-200">
          <span>{isCached ? '⚡ CACHED RULE' : '✨ CANDIDATE SCHEMA'}</span>
          <span>•</span>
          <span>{schema.type.toUpperCase()}</span>
        </span>
      </div>

      <div className="text-base sm:text-lg font-bold text-[#111111] leading-snug">
        {plainTranslation || "I've structured a decision schema for your request. Sound right?"}
      </div>

      {/* Interactive visual chips for Choice schema */}
      {isChoice && (
        <div className="space-y-2">
          <div className="text-xs text-[#6B7280]">
            Click ✕ to remove or add options directly (instant local re-verification):
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {options.map((opt, idx) => (
              <span
                key={`${opt}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F4F4F1] border border-[#E5E5E2] text-[#111111] hover:border-[#5B61F6] transition-all shadow-2xs"
              >
                <span>{opt}</span>
                {options.length > 2 && (
                  <button
                    className="text-[#9CA3AF] hover:text-rose-600 cursor-pointer transition-colors p-0.5"
                    onClick={() => onOptionRemove(idx)}
                    title={`Remove "${opt}"`}
                  >
                    ✕
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
                  placeholder="New option name..."
                  className="px-2.5 py-1 text-xs bg-[#FFFFFF] border border-[#5B61F6] rounded-full text-[#111111] outline-none w-36 shadow-xs"
                  autoFocus
                  onBlur={() => {
                    if (!newChipText.trim()) setIsAddingChip(false);
                  }}
                />
              </form>
            ) : (
              <button
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs text-[#5B61F6] border border-dashed border-[#5B61F6]/50 hover:border-[#5B61F6] hover:bg-indigo-50/50 transition-all cursor-pointer font-medium"
                onClick={() => setIsAddingChip(true)}
                title="Add a custom choice"
              >
                <span>+</span> Add Option
              </button>
            )}
          </div>
        </div>
      )}

      {/* Structural Patch Box */}
      {showEditBox && (
        <form onSubmit={handlePatchSubmit} className="flex gap-2 pt-2 animate-in fade-in">
          <input
            type="text"
            value={patchText}
            onChange={(e) => setPatchText(e.target.value)}
            placeholder="e.g. 'Rate urgency from 1 to 5 instead' or 'Add a refunds category'..."
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#D1D5DB] focus:border-[#5B61F6] rounded-xl text-[#111111] outline-none transition-colors"
            autoFocus
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#111111] hover:bg-[#5B61F6] text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Update
          </button>
        </form>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[#111111] hover:bg-[#5B61F6] text-white rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          onClick={onConfirm}
          disabled={isExecuting}
          id="confirm-decision-btn"
        >
          {isExecuting ? 'Running Jev...' : 'Looks Good — Run Decision ↵'}
        </button>

        <button
          className="px-3 py-2 text-xs sm:text-sm font-medium bg-[#F4F4F1] hover:bg-[#E5E5E2] text-[#374151] rounded-xl border border-[#E5E5E2] transition-colors cursor-pointer"
          onClick={() => setShowEditBox(!showEditBox)}
          id="toggle-edit-btn"
        >
          {showEditBox ? 'Cancel' : 'Edit Phrasing'}
        </button>
      </div>
    </div>
  );
}
