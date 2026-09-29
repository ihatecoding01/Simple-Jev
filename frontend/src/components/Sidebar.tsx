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
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed top-0 bottom-0 left-0 w-80 sm:w-96 bg-[#111113] border-r border-[#2E2E32] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="p-4 border-b border-[#2E2E32] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-[1px] bg-[#C8FF00]" />
            <span className="font-mono font-semibold text-xs tracking-wider text-white uppercase">
              PINNED RULES & CACHE
            </span>
          </div>
          <button
            className="w-7 h-7 rounded-[4px] bg-[#161618] border border-[#2E2E32] text-[#A1A1AA] hover:text-white hover:border-[#71717A] flex items-center justify-center transition-colors cursor-pointer text-xs font-mono"
            onClick={onClose}
            title="Close sidebar"
            id="close-sidebar-btn"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mb-3 font-semibold">
              PINNED SCHEMAS [{pinnedSchemas.length}]
            </div>

            {pinnedSchemas.length === 0 ? (
              <div className="p-4 rounded-[4px] bg-[#161618] border border-[#2E2E32] text-xs text-[#71717A] font-mono">
                No pinned rules yet. Pin a schema from any completed decision in the playground to reuse it instantly.
              </div>
            ) : (
              <div className="space-y-3">
                {pinnedSchemas.map((schema) => (
                  <div
                    key={schema.id}
                    className="p-3.5 rounded-[4px] bg-[#161618] border border-[#2E2E32] hover:border-[#8B5CF6] hover:shadow-[0_0_15px_rgba(139,92,246,0.12)] transition-all space-y-2 group"
                  >
                    {editingId === schema.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-[#1C1C1F] border border-[#C8FF00] rounded-[4px] text-white outline-none font-mono"
                          autoFocus
                        />
                        <button
                          className="px-2.5 py-1 text-xs bg-[#C8FF00] hover:bg-[#A3CC00] text-[#0A0A0A] rounded-[4px] font-mono font-semibold uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSaveRename(schema.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold text-xs text-white truncate font-mono" title={schema.friendly_name}>
                        {schema.friendly_name}
                      </div>
                    )}

                    <div className="text-xs text-[#A1A1AA] line-clamp-2 font-sans">
                      <span className="font-mono text-[#8B5CF6] mr-1.5 text-[11px]">[{schema.question_type.toUpperCase()}]</span>
                      {schema.options && schema.options.length > 0
                        ? schema.options.join(', ')
                        : schema.intent_summary}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        className="px-2.5 py-1 text-[11px] bg-[#C8FF00] hover:bg-[#A3CC00] text-[#0A0A0A] rounded-[4px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer hover:shadow-[0_0_10px_rgba(200,255,0,0.2)]"
                        onClick={() => {
                          onQuickRun(schema);
                          onClose();
                        }}
                        title="Run new text directly against this schema"
                      >
                        <span>⚡</span> QUICK RUN
                      </button>
                      <button
                        className="px-2 py-1 text-[11px] bg-[#1C1C1F] hover:bg-[#222225] border border-[#2E2E32] text-[#A1A1AA] hover:text-white rounded-[4px] transition-colors cursor-pointer font-mono"
                        onClick={() => handleStartRename(schema)}
                        title="Rename rule"
                      >
                        EDIT
                      </button>
                      <button
                        className="px-2 py-1 text-[11px] bg-[#1C1C1F] hover:bg-rose-950/40 border border-[#2E2E32] hover:border-rose-800 text-[#71717A] hover:text-rose-400 rounded-[4px] transition-colors cursor-pointer font-mono"
                        onClick={() => handleUnpin(schema.id)}
                        title="Unpin rule"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#2E2E32]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mb-2 font-semibold">
              HOW PINNED RULES WORK
            </div>
            <p className="text-xs text-[#71717A] font-sans leading-relaxed">
              Pinned schemas eliminate LLM regeneration time and cost. In <strong className="text-white">Unrestricted Mode</strong>, repeat requests automatically match via semantic vector embeddings and execute immediately at <strong className="text-[#C8FF00]">0 credit cost</strong>.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
