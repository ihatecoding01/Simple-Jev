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
      <aside className="fixed top-0 bottom-0 left-0 w-80 sm:w-96 bg-slate-950 border-r border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📌</span>
            <span className="font-semibold text-sm text-slate-100">Pinned Rules & Cache</span>
          </div>
          <button
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            onClick={onClose}
            title="Close sidebar"
            id="close-sidebar-btn"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 font-semibold">
              Your Pinned Rules ({pinnedSchemas.length})
            </div>

            {pinnedSchemas.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No pinned rules yet. Pin a schema from any completed decision to reuse it instantly!
              </p>
            ) : (
              <div className="space-y-3">
                {pinnedSchemas.map((schema) => (
                  <div
                    key={schema.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2 group shadow-sm"
                  >
                    {editingId === schema.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-slate-950 border border-indigo-500 rounded text-slate-100 outline-none"
                          autoFocus
                        />
                        <button
                          className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium cursor-pointer"
                          onClick={() => handleSaveRename(schema.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold text-sm text-slate-100 truncate" title={schema.friendly_name}>
                        {schema.friendly_name}
                      </div>
                    )}

                    <div className="text-xs text-slate-400 line-clamp-2">
                      <span className="font-mono text-indigo-400 mr-1.5 font-medium">[{schema.question_type}]</span>
                      {schema.options && schema.options.length > 0
                        ? schema.options.join(', ')
                        : schema.intent_summary}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        onClick={() => {
                          onQuickRun(schema);
                          onClose();
                        }}
                        title="Run new text directly against this schema"
                      >
                        <span>⚡</span> Quick Run
                      </button>
                      <button
                        className="p-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer"
                        onClick={() => handleStartRename(schema)}
                        title="Rename rule"
                      >
                        ✏️
                      </button>
                      <button
                        className="p-1 text-xs bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 rounded-md transition-colors cursor-pointer"
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

          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              How Pinned Rules Work
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pinned schemas eliminate LLM regeneration time and cost. In <strong>Unrestricted Mode</strong>, repeat requests automatically match via semantic vector embeddings and execute immediately at <strong>0 credit cost</strong>.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
