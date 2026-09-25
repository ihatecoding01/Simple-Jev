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
      className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl border-l-4 border-l-indigo-500 space-y-4 transition-all"
      id="confirmation-card"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          <span>{isCached ? '⚡ Cached Rule' : '✨ Candidate Schema'}</span>
          <span>•</span>
          <span>{schema.type}</span>
        </span>
      </div>

      <div className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
        {plainTranslation || "I've structured a decision schema for your request. Sound right?"}
      </div>

      {/* Interactive visual chips for Choice schema */}
      {isChoice && (
        <div className="space-y-1.5">
          <div className="text-xs text-slate-400">
            Click ✕ to remove or add options directly (instant local re-verification):
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {options.map((opt, idx) => (
              <span
                key={`${opt}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all shadow-sm"
              >
                <span>{opt}</span>
                {options.length > 2 && (
                  <button
                    className="text-slate-400 hover:text-rose-400 cursor-pointer transition-colors p-0.5"
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
                  className="px-2.5 py-1 text-xs bg-slate-950 border border-indigo-500 rounded-full text-slate-100 outline-none w-36 shadow-sm"
                  autoFocus
                  onBlur={() => {
                    if (!newChipText.trim()) setIsAddingChip(false);
                  }}
                />
              </form>
            ) : (
              <button
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs text-indigo-300 border border-dashed border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-950/30 transition-all cursor-pointer"
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
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-slate-100 outline-none transition-colors"
            autoFocus
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            Update
          </button>
        </form>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          className="px-4 py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onConfirm}
          disabled={isExecuting}
          id="confirm-decision-btn"
        >
          {isExecuting ? 'Running Jev...' : 'Looks Good — Run Decision'}
        </button>

        <button
          className="px-3 py-2 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
          onClick={() => setShowEditBox(!showEditBox)}
          id="toggle-edit-btn"
        >
          {showEditBox ? 'Cancel' : 'Edit Phrasing'}
        </button>
      </div>
    </div>
  );
}
