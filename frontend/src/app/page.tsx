'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import InputBar from '../components/InputBar';
import Stepper from '../components/Stepper';
import ConfirmationCard from '../components/ConfirmationCard';
import DeltaPrompt from '../components/DeltaPrompt';
import DecisionCard from '../components/DecisionCard';
import ProgressiveTrustBanner from '../components/ProgressiveTrustBanner';
import { CandidateSchema, ExecutionResult, PinnedSchema, QuotaStatus } from '../types';
import {
  evaluateIntent,
  revalidateSchema,
  patchSchema,
  executeJev,
  fetchQuota,
} from '../services/api';
import {
  getPreferences,
  savePreferences,
  getPinnedSchemas,
  pinSchema,
} from '../services/storage';

interface ChatMessage {
  id: string;
  type: 'user' | 'confirmation' | 'delta' | 'decision' | 'assistant_clarification' | 'fallback' | 'error';
  text?: string;
  timestamp?: string;
  schema?: CandidateSchema;
  state?: Record<string, any>;
  plainTranslation?: string;
  result?: ExecutionResult;
  delta?: Record<string, any>;
  isCached?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'restricted' | 'unrestricted'>('restricted');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pinnedSchemas, setPinnedSchemas] = useState<PinnedSchema[]>([]);
  const [quota, setQuota] = useState<QuotaStatus>({ daily_limit: 25, remaining: 25, cached_runs: 0, cold_runs: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQuickRunSchema, setActiveQuickRunSchema] = useState<PinnedSchema | null>(null);
  const [consecutiveUnedited, setConsecutiveUnedited] = useState(0);
  const [showTrustBanner, setShowTrustBanner] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize client settings from localStorage
  useEffect(() => {
    const prefs = getPreferences();
    setMode(prefs.mode || 'restricted');
    setTheme(prefs.theme || 'dark');
    setConsecutiveUnedited(prefs.unedited_count || 0);

    const pinned = getPinnedSchemas();
    setPinnedSchemas(pinned);

    fetchQuota().then(setQuota);
  }, []);

  const handleModeChange = (newMode: 'restricted' | 'unrestricted') => {
    setMode(newMode);
    savePreferences({ mode: newMode, theme, unedited_count: consecutiveUnedited });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    savePreferences({ mode, theme: newTheme, unedited_count: consecutiveUnedited });
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Main prompt submission
  const handleSendPrompt = async (text: string) => {
    if (!text || !text.trim() || isProcessing) return;
    const cleanText = text.trim();
    setInputValue('');
    setIsProcessing(true);

    const userMessageId = `msg-${Date.now()}`;
    const newTurnId = `turn-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        type: 'user',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Check if running directly via Quick Run on a pinned schema
    if (activeQuickRunSchema) {
      try {
        const state = { content_text: cleanText, raw_query: cleanText };
        const result = await executeJev(activeQuickRunSchema.schema_data, state);

        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'decision',
            result,
            schema: activeQuickRunSchema.schema_data,
          },
        ]);
        setActiveQuickRunSchema(null);
        fetchQuota().then(setQuota);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'error',
            text: `Quick Run execution failed: ${err.message}`,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Normal pipeline evaluation
    try {
      const response = await evaluateIntent(cleanText, mode);
      fetchQuota().then(setQuota);

      if (response.status === 'cache_hit' && response.execution_result && response.schema_data) {
        // Auto-executed cache hit in Unrestricted Mode
        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'decision',
            result: response.execution_result,
            schema: response.schema_data,
            isCached: true,
          },
        ]);
      } else if (response.status === 'needs_confirmation' && response.schema_data) {
        // Restricted mode or novel cold-miss vetting
        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'confirmation',
            schema: response.schema_data,
            state: response.state,
            plainTranslation: response.plain_translation,
            isCached: response.is_cached,
          },
        ]);
      } else if (response.status === 'diverged' && response.schema_data) {
        // Schema divergence detected in Unrestricted Mode
        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'delta',
            delta: response.divergence_delta,
            schema: response.schema_data,
            state: response.state,
          },
        ]);
      } else if (response.status === 'incomplete_state') {
        // Incomplete state follow-up
        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'assistant_clarification',
            text: response.assistant_message,
            schema: response.schema_data,
            state: response.state,
          },
        ]);
      } else if (response.status === 'fallback') {
        // Soft fallback to general conversational response
        setMessages((prev) => [
          ...prev,
          {
            id: newTurnId,
            type: 'fallback',
            text: response.assistant_message,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: newTurnId,
          type: 'error',
          text: `Evaluation error: ${err.message}`,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execution confirmation
  const handleConfirmDecision = async (turnId: string, schema: CandidateSchema, state?: Record<string, any>) => {
    setIsProcessing(true);
    try {
      const result = await executeJev(schema, state || {});

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === turnId
            ? {
                ...msg,
                type: 'decision',
                result,
                schema,
              }
            : msg
        )
      );

      // Progressive trust tracking
      const newCount = consecutiveUnedited + 1;
      setConsecutiveUnedited(newCount);
      savePreferences({ mode, theme, unedited_count: newCount });

      if (mode === 'restricted' && newCount >= 3) {
        setShowTrustBanner(true);
      }

      fetchQuota().then(setQuota);
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove option from interactive chips
  const handleOptionRemove = async (turnId: string, optionIdx: number) => {
    const turn = messages.find((m) => m.id === turnId);
    if (!turn || !turn.schema) return;

    const newOptions = (turn.schema.options || []).filter((_, idx) => idx !== optionIdx);
    const updatedSchema = { ...turn.schema, options: newOptions };

    try {
      const reval = await revalidateSchema(updatedSchema, turn.state);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === turnId
            ? {
                ...msg,
                schema: reval.schema_data,
                plainTranslation: reval.plain_translation,
              }
            : msg
        )
      );
    } catch (err) {
      console.error('Revalidation error', err);
    }
  };

  // Add option to interactive chips
  const handleOptionAdd = async (turnId: string, newOption: string) => {
    const turn = messages.find((m) => m.id === turnId);
    if (!turn || !turn.schema) return;

    const newOptions = [...(turn.schema.options || []), newOption];
    const updatedSchema = { ...turn.schema, options: newOptions };

    try {
      const reval = await revalidateSchema(updatedSchema, turn.state);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === turnId
            ? {
                ...msg,
                schema: reval.schema_data,
                plainTranslation: reval.plain_translation,
              }
            : msg
        )
      );
    } catch (err) {
      console.error('Revalidation error', err);
    }
  };

  // Structural patch via text input
  const handleStructuralPatch = async (turnId: string, patchText: string) => {
    const turn = messages.find((m) => m.id === turnId);
    if (!turn || !turn.schema) return;

    try {
      const patched = await patchSchema(turn.schema, turn.state || null, patchText);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === turnId
            ? {
                ...msg,
                schema: patched.schema_data,
                state: patched.state,
                plainTranslation: patched.plain_translation,
              }
            : msg
        )
      );
    } catch (err: any) {
      alert(`Patch failed: ${err.message}`);
    }
  };

  // Delta prompt actions
  const handleIncludeAndExecuteDelta = async (turnId: string, schema: CandidateSchema, state?: Record<string, any>) => {
    await handleConfirmDecision(turnId, schema, state);
  };

  const handleRevertToPrevious = async (turnId: string, delta: Record<string, any>, state?: Record<string, any>) => {
    const prevSchema: CandidateSchema = delta.previous_schema || {
      type: 'Choice',
      question: 'Categorize item',
      options: delta.previous_options || ['Option A', 'Option B'],
    };
    await handleConfirmDecision(turnId, prevSchema, state);
  };

  // Pin rule to sidebar
  const handlePinRule = (schema: CandidateSchema) => {
    const updated = pinSchema(schema);
    setPinnedSchemas(updated);
  };

  // Quick Run trigger
  const handleTriggerQuickRun = (schema: PinnedSchema) => {
    setActiveQuickRunSchema(schema);
    setInputValue('');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors`}>
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pinnedSchemas={pinnedSchemas}
        setPinnedSchemas={setPinnedSchemas}
        onQuickRun={handleTriggerQuickRun}
      />

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4">
        {/* Header */}
        <Header
          mode={mode}
          setMode={handleModeChange}
          quota={quota}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          pinnedCount={pinnedSchemas.length}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Chat Stream Canvas */}
        <main className="flex-1 py-8 pb-32 space-y-6">
          {/* Progressive Trust Milestone Banner */}
          {showTrustBanner && mode === 'restricted' && (
            <ProgressiveTrustBanner
              onSwitch={() => {
                handleModeChange('unrestricted');
                setShowTrustBanner(false);
              }}
              onDismiss={() => setShowTrustBanner(false)}
            />
          )}

          {/* Quick Run Active Banner */}
          {activeQuickRunSchema && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold tracking-wider">⚡ QUICK RUN MODE</span>
                <div className="font-semibold text-sm text-slate-100">Executing against: "{activeQuickRunSchema.friendly_name}"</div>
                <div className="text-xs text-slate-400">Bypasses Generator LLM entirely (0 credit cost). Enter context below.</div>
              </div>
              <button
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                onClick={() => setActiveQuickRunSchema(null)}
              >
                Cancel Quick Run
              </button>
            </div>
          )}

          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && !activeQuickRunSchema && (
            <div className="text-center py-12 sm:py-16 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-lg shadow-indigo-500/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Conversational Jev
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                Type in plain language. Simple Jev structures your question, checks schema safety via Jev System 1, and renders deterministic decisions without exposing raw JSON.
              </p>

              <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto pt-3">
                <button
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all cursor-pointer shadow-sm"
                  onClick={() => handleSendPrompt("Categorize customer email: 'I was billed twice on invoice #994. Please issue a refund.'")}
                >
                  <span>📧</span> Categorize customer email
                </button>

                <button
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all cursor-pointer shadow-sm"
                  onClick={() => handleSendPrompt("Rate ticket urgency: 'Production database cluster is down and customer logins are failing.'")}
                >
                  <span>🚨</span> Rate ticket urgency
                </button>

                <button
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all cursor-pointer shadow-sm"
                  onClick={() => handleSendPrompt("Verify assertion: 'The email authentication header matches the SPF and DKIM records.'")}
                >
                  <span>🛡️</span> Verify security assertion
                </button>

                <button
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all cursor-pointer shadow-sm"
                  onClick={() => handleSendPrompt("Should I accept Job Offer A ($125k remote) or Job Offer B ($145k hybrid)?")}
                >
                  <span>⚖️</span> Job offer decision
                </button>
              </div>
            </div>
          )}

          {/* Conversation Turns */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
              {msg.type === 'user' && (
                <div className="max-w-[85%] sm:max-w-xl px-4 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm sm:text-base leading-relaxed shadow-md">
                  {msg.text}
                </div>
              )}

              {msg.type === 'confirmation' && msg.schema && (
                <ConfirmationCard
                  schema={msg.schema}
                  plainTranslation={msg.plainTranslation}
                  onConfirm={() => handleConfirmDecision(msg.id, msg.schema!, msg.state)}
                  onOptionRemove={(optIdx) => handleOptionRemove(msg.id, optIdx)}
                  onOptionAdd={(newOpt) => handleOptionAdd(msg.id, newOpt)}
                  onStructuralPatch={(patchText) => handleStructuralPatch(msg.id, patchText)}
                  isExecuting={isProcessing}
                  isCached={msg.isCached}
                />
              )}

              {msg.type === 'delta' && msg.delta && msg.schema && (
                <DeltaPrompt
                  delta={msg.delta}
                  schema={msg.schema}
                  onIncludeAndExecute={() => handleIncludeAndExecuteDelta(msg.id, msg.schema!, msg.state)}
                  onRevertToPrevious={() => handleRevertToPrevious(msg.id, msg.delta!, msg.state)}
                  isExecuting={isProcessing}
                />
              )}

              {msg.type === 'decision' && msg.result && msg.schema && (
                <DecisionCard
                  result={msg.result}
                  schema={msg.schema}
                  onPinRule={handlePinRule}
                />
              )}

              {msg.type === 'assistant_clarification' && (
                <div className="w-full max-w-2xl p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 border-l-4 border-l-purple-500 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    💬 CLARIFICATION NEEDED
                  </span>
                  <div className="text-sm text-slate-200">{msg.text}</div>
                </div>
              )}

              {msg.type === 'fallback' && (
                <div className="w-full max-w-2xl p-4 rounded-2xl bg-slate-900/60 border border-slate-800 border-l-4 border-l-slate-500 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
                    ℹ️ GENERAL ANSWER (UNSTRUCTURED)
                  </span>
                  <div className="text-sm text-slate-300">{msg.text}</div>
                </div>
              )}

              {msg.type === 'error' && (
                <div className="w-full max-w-2xl p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 border-l-4 border-l-rose-500 text-rose-300 text-sm">
                  ⚠️ {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Stepper while processing */}
          {isProcessing && (
            <div className="flex justify-start">
              <Stepper
                stages={[
                  { stage: 'intent', label: 'Understanding request' },
                  { stage: 'structuring', label: 'Structuring options & schema' },
                  { stage: 'verifying', label: 'Verifying with Jev System 1' },
                ]}
              />
            </div>
          )}

          <div ref={chatBottomRef} />
        </main>

        {/* Sticky Input Bar */}
        <InputBar
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSubmit={handleSendPrompt}
          isProcessing={isProcessing}
          placeholder={
            activeQuickRunSchema
              ? `Paste text to evaluate against '${activeQuickRunSchema.friendly_name}'...`
              : mode === 'unrestricted'
              ? '⚡ Unrestricted Mode: Type query (repeat rules auto-execute)...'
              : 'Ask a plain-language question or paste text to evaluate...'
          }
        />
      </div>
    </div>
  );
}
