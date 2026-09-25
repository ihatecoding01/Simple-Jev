'use client';

import React, { useState } from 'react';
import { PinnedSchema } from '../types';
import { unpinSchema, renamePinnedSchema } from '../services/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedSchemas: PinnedSchema[];
  setPinnedSchemas: React.Dispatch<React.SetStateAction<PinnedSchema[]>>;
  onQuickRun: (schema: PinnedSchema) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  pinnedSchemas,
  setPinnedSchemas,
  onQuickRun,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleStartRename = (schema: PinnedSchema) => {
    setEditingId(schema.id);
    setEditName(schema.friendly_name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      const updated = renamePinnedSchema(id, editName.trim());
      setPinnedSchemas(updated);
    }
    setEditingId(null);
  };

  const handleUnpin = (id: string) => {
    const updated = unpinSchema(id);
    setPinnedSchemas(updated);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed top-0 bottom-0 left-0 w-80 sm:w-96 bg-[#FBFBFA] border-r border-[#E5E5E2] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="p-4 border-b border-[#E5E5E2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">📌</span>
            <span className="font-semibold text-sm text-[#111111]">Pinned Rules & Cache</span>
          </div>
          <button
            className="w-7 h-7 rounded-lg bg-white border border-[#E5E5E2] text-[#6B7280] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer text-xs"
            onClick={onClose}
            title="Close sidebar"
            id="close-sidebar-btn"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] mb-3 font-semibold">
              Your Pinned Rules ({pinnedSchemas.length})
            </div>

            {pinnedSchemas.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] italic">
                No pinned rules yet. Pin a schema from any completed decision in the playground to reuse it instantly!
              </p>
            ) : (
              <div className="space-y-3">
                {pinnedSchemas.map((schema) => (
                  <div
                    key={schema.id}
                    className="p-3.5 rounded-xl bg-white border border-[#E5E5E2] hover:border-[#5B61F6] transition-all space-y-2 group shadow-xs"
                  >
                    {editingId === schema.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-[#FBFBFA] border border-[#5B61F6] rounded text-[#111111] outline-none"
                          autoFocus
                        />
                        <button
                          className="px-2 py-1 text-xs bg-[#111111] hover:bg-[#5B61F6] text-white rounded font-medium cursor-pointer"
                          onClick={() => handleSaveRename(schema.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold text-sm text-[#111111] truncate" title={schema.friendly_name}>
                        {schema.friendly_name}
                      </div>
                    )}

                    <div className="text-xs text-[#6B7280] line-clamp-2">
                      <span className="font-mono text-[#5B61F6] mr-1.5 font-medium">[{schema.question_type}]</span>
                      {schema.options && schema.options.length > 0
                        ? schema.options.join(', ')
                        : schema.intent_summary}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        className="px-2.5 py-1 text-xs bg-[#111111] hover:bg-[#5B61F6] text-white rounded-md font-medium flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        onClick={() => {
                          onQuickRun(schema);
                          onClose();
                        }}
                        title="Run new text directly against this schema"
                      >
                        <span>⚡</span> Quick Run
                      </button>
                      <button
                        className="p-1 text-xs bg-[#F4F4F1] hover:bg-[#E5E5E2] text-[#374151] rounded-md transition-colors cursor-pointer"
                        onClick={() => handleStartRename(schema)}
                        title="Rename rule"
                      >
                        ✏️
                      </button>
                      <button
                        className="p-1 text-xs bg-[#F4F4F1] hover:bg-rose-50 text-[#374151] hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        onClick={() => handleUnpin(schema.id)}
                        title="Unpin rule"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5E5E2]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] mb-2 font-semibold">
              How Pinned Rules Work
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Pinned schemas eliminate LLM regeneration time and cost. In <strong>Unrestricted Mode</strong>, repeat requests automatically match via semantic vector embeddings and execute immediately at <strong>0 credit cost</strong>.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
