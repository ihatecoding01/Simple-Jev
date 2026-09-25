'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ConfirmationCard from '../components/ConfirmationCard';
import DeltaPrompt from '../components/DeltaPrompt';
import DecisionCard from '../components/DecisionCard';
import Stepper from '../components/Stepper';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pinnedSchemas, setPinnedSchemas] = useState<PinnedSchema[]>([]);
  const [quota, setQuota] = useState<QuotaStatus>({ daily_limit: 25, remaining: 25, cached_runs: 0, cold_runs: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQuickRunSchema, setActiveQuickRunSchema] = useState<PinnedSchema | null>(null);
  const [consecutiveUnedited, setConsecutiveUnedited] = useState(0);
  const [showTrustBanner, setShowTrustBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'choice' | 'score' | 'noul'>('choice');

  const playgroundRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefs = getPreferences();
    setMode(prefs.mode || 'restricted');
    setConsecutiveUnedited(prefs.unedited_count || 0);

    const pinned = getPinnedSchemas();
    setPinnedSchemas(pinned);

    fetchQuota().then(setQuota);
  }, []);

  const handleModeChange = (newMode: 'restricted' | 'unrestricted') => {
    setMode(newMode);
    savePreferences({ mode: newMode, theme: 'light', unedited_count: consecutiveUnedited });
  };

  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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

      const newCount = consecutiveUnedited + 1;
      setConsecutiveUnedited(newCount);
      savePreferences({ mode, theme: 'light', unedited_count: newCount });

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

  const handlePinRule = (schema: CandidateSchema) => {
    const updated = pinSchema(schema);
    setPinnedSchemas(updated);
  };

  const handleTriggerQuickRun = (schema: PinnedSchema) => {
    setActiveQuickRunSchema(schema);
    setInputValue('');
    playgroundRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPreset = (type: 'choice' | 'score' | 'noul') => {
    setActiveTab(type);
    if (type === 'choice') {
      handleSendPrompt("Categorize customer email: 'I was charged twice on invoice #994. Please issue a refund ASAP.'");
    } else if (type === 'score') {
      handleSendPrompt("Rate urgency: Primary Postgres database cluster has failed and all customer logins are returning 500 internal server errors.");
    } else if (type === 'noul') {
      handleSendPrompt("Verify assertion: The incoming email SPF record passes verification for paypal.com domain.");
    }
    playgroundRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="blueprint-sheet">
      {/* Top Technical Drafting Ruler */}
      <div className="blueprint-ruler">
        <span className="crosshair">+</span>
        <span className="hidden sm:inline">-300</span>
        <span className="hidden sm:inline">-200</span>
        <span className="hidden sm:inline">-100</span>
        <span className="text-[#111111] font-bold">0.00</span>
        <span className="hidden sm:inline">+100</span>
        <span className="hidden sm:inline">+200</span>
        <span className="hidden sm:inline">+300</span>
        <span className="text-[#6B7280]">SCALE 1:1 · COL 1080</span>
        <span className="crosshair">+</span>
      </div>

      {/* Header */}
      <Header
        mode={mode}
        setMode={handleModeChange}
        quota={quota}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        pinnedCount={pinnedSchemas.length}
      />

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pinnedSchemas={pinnedSchemas}
        setPinnedSchemas={setPinnedSchemas}
        onQuickRun={handleTriggerQuickRun}
      />

      {/* ========================================================================= */}
      {/* SHEET 01 · THE MANIFESTO & THE IDEA                                       */}
      {/* ========================================================================= */}
      <section id="manifesto" className="px-6 sm:px-12 pt-12 pb-16 border-b border-[#E5E5E2]">
        <div className="sheet-label mb-4">
          <span>◇ SHEET 01 · THE PROBLEM & THE IDEA</span>
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#111111] leading-[1.12]">
            The Developer Bottleneck.
            <span className="block text-2xl sm:text-4xl font-normal text-[#6B7280] mt-2">
              Removing the human schema author from TypeSafe AI's Jev model.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#374151] leading-relaxed">
            TypeSafe AI's <strong>Jev</strong> is a non-autoregressive <strong>System One decision engine</strong>. Unlike chat models that generate text token-by-token, Jev executes deterministic, typed decisions (Choice, Score, Noul) in parallel at <strong>70ms to 500ms</strong> speeds.
          </p>

          <p className="text-base sm:text-lg text-[#374151] leading-relaxed">
            <strong>The Catch:</strong> Jev requires an engineer to write the exact <code>state</code> object and typed schema in JSON upfront. If you don't write code, Jev is completely inaccessible.
          </p>

          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E5E2] shadow-xs space-y-3">
            <div className="text-xs font-mono font-semibold text-[#5B61F6] uppercase tracking-wider">
              ✦ The Conversational Jev Solution
            </div>
            <p className="text-sm sm:text-base text-[#111111] font-medium leading-normal">
              A person types a free-form sentence in plain English. Simple Jev generates the typed schema, checks its fitness against a hand-crafted meta-schema, executes via Jev, and renders the result. <strong>The user never sees raw JSON.</strong>
            </p>
          </div>
        </div>

        {/* 3 Core Architecture Pillars (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10">
          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E2] space-y-2">
            <span className="text-xs font-mono text-[#5B61F6] font-semibold">01 / ZERO RAW JSON</span>
            <div className="font-bold text-sm text-[#111111]">Interactive Visual Chips</div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Schemas translate to plain English. Options appear as interactive visual chips (<kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">✕</kbd> to delete, <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">+ Add</kbd>). Local edits re-validate instantly without LLM calls.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E2] space-y-2">
            <span className="text-xs font-mono text-[#5B61F6] font-semibold">02 / META-SCHEMA</span>
            <div className="font-bold text-sm text-[#111111]">5-Point Validator Contract</div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              The Validator does not answer the question; it evaluates candidate schema fitness across coverage, exclusivity, type fit, scope sizing, and state sufficiency before execution.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E2] space-y-2">
            <span className="text-xs font-mono text-[#5B61F6] font-semibold">03 / TRUST ENGINE</span>
            <div className="font-bold text-sm text-[#111111]">Safety-First Unrestricted</div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Cached rules run instantly at 0 credit cost. Novel intents pause once for confirmation. Schema variations trigger amber delta alerts to prevent silent model drift.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHEET 02 · ARCHITECTURE & VERIFICATION PIPELINE                           */}
      {/* ========================================================================= */}
      <section id="architecture" className="px-6 sm:px-12 py-14 border-b border-[#E5E5E2] bg-[#FAFAFA]">
        <div className="sheet-label mb-4">
          <span>◇ SHEET 02 · SYSTEM ARCHITECTURE & 5-POINT VALIDATOR</span>
        </div>

        <div className="space-y-6 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            How the verification loop converges without thrashing.
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
            Most LLM generation loops fail because they re-roll blindly upon error. Simple Jev uses <strong>targeted diff patching</strong>: the validator passes field-by-field diagnostics, allowing the generator to patch only the flagged field (append an option, adjust scale) rather than regenerating from scratch.
          </p>
        </div>

        {/* Technical Flow Visualization */}
        <div className="mt-8 p-6 rounded-2xl bg-[#0D0E12] text-white font-mono text-xs shadow-xl space-y-4 border border-[#222530]">
          <div className="flex items-center justify-between border-b border-[#222530] pb-3 text-[#9CA3AF]">
            <span>Fig 2.1 · Pipeline Execution Graph</span>
            <span>MODEL: JEV-1.13.0 · GROQ-GPT-OSS-20B</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-lg bg-[#14161E] border border-[#222530]">
              <span className="text-indigo-400 block text-[10px] mb-1">STAGE 01</span>
              <span className="font-bold">Plain Text</span>
            </div>
            <div className="p-3 rounded-lg bg-[#14161E] border border-[#222530]">
              <span className="text-indigo-400 block text-[10px] mb-1">STAGE 02</span>
              <span className="font-bold">384-d Cache</span>
            </div>
            <div className="p-3 rounded-lg bg-[#14161E] border border-[#222530]">
              <span className="text-indigo-400 block text-[10px] mb-1">STAGE 03</span>
              <span className="font-bold">Groq LLM</span>
            </div>
            <div className="p-3 rounded-lg bg-[#14161E] border border-[#222530]">
              <span className="text-emerald-400 block text-[10px] mb-1">STAGE 04</span>
              <span className="font-bold">5-pt Validator</span>
            </div>
            <div className="p-3 rounded-lg bg-[#5B61F6] text-white">
              <span className="text-white/80 block text-[10px] mb-1">STAGE 05</span>
              <span className="font-bold">Jev Decision</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHEET 03 · THE INTERACTIVE PLAYGROUND (TEST ON YOUR OWN)                  */}
      {/* ========================================================================= */}
      <section ref={playgroundRef} id="playground" className="px-6 sm:px-12 py-14 border-b border-[#E5E5E2]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="sheet-label">
            <span>◇ SHEET 03 · INTERACTIVE DECISION PLAYGROUND</span>
          </div>
          <div className="text-xs font-mono text-[#6B7280]">
            CREDITS: <span className="font-bold text-[#111111]">{quota.remaining}/{quota.daily_limit}</span> (REPEAT RUNS FREE)
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mb-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111111]">
            Test with live Jev System 1.
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563]">
            Select a preset scenario below or type your own question. Watch how the schema is inferred, confirmed with visual chips, and executed against TypeSafe Jev.
          </p>
        </div>

        {/* Preset Selector Pills (imdaryl style) */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <button
            className={`blueprint-pill ${activeTab === 'choice' ? 'active' : ''}`}
            onClick={() => loadPreset('choice')}
          >
            <span>•</span> Choice: Customer Email Triage
          </button>
          <button
            className={`blueprint-pill ${activeTab === 'score' ? 'active' : ''}`}
            onClick={() => loadPreset('score')}
          >
            <span>•</span> Score: Outage Urgency (1 to 5)
          </button>
          <button
            className={`blueprint-pill ${activeTab === 'noul' ? 'active' : ''}`}
            onClick={() => loadPreset('noul')}
          >
            <span>•</span> Noul: Security SPF Assertion
          </button>
        </div>

        {/* Active Quick Run Banner */}
        {activeQuickRunSchema && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-mono text-indigo-700 font-semibold tracking-wider">⚡ QUICK RUN MODE ACTIVE</span>
              <div className="font-semibold text-sm text-[#111111]">Pre-locked rule: "{activeQuickRunSchema.friendly_name}"</div>
              <div className="text-xs text-[#4B5563]">Bypasses LLM generation. Evaluates directly via Jev (0 credits used).</div>
            </div>
            <button
              className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-[#374151] rounded-lg border border-[#D1D5DB] transition-colors cursor-pointer shadow-xs"
              onClick={() => setActiveQuickRunSchema(null)}
            >
              Cancel Quick Run
            </button>
          </div>
        )}

        {/* Progressive Trust Milestone Banner */}
        {showTrustBanner && mode === 'restricted' && (
          <div className="mb-6">
            <ProgressiveTrustBanner
              onSwitch={() => {
                handleModeChange('unrestricted');
                setShowTrustBanner(false);
              }}
              onDismiss={() => setShowTrustBanner(false)}
            />
          </div>
        )}

        {/* Live Conversation Thread / Playground Canvas */}
        <div className="min-h-[320px] p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5E2] shadow-sm space-y-6">
          {messages.length === 0 && !isProcessing && (
            <div className="text-center py-12 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500 font-mono text-sm">
                ⚙️
              </div>
              <div className="font-semibold text-sm text-[#111111]">Playground is Ready</div>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                Click one of the three preset pills above, or write your own decision scenario into the prompt bar below.
              </p>
            </div>
          )}

          {/* Render Turn Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
              {msg.type === 'user' && (
                <div className="max-w-[85%] sm:max-w-xl px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#111111] text-white text-xs sm:text-sm leading-relaxed shadow-sm">
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
                  onIncludeAndExecute={() => handleConfirmDecision(msg.id, msg.schema!, msg.state)}
                  onRevertToPrevious={() => {
                    const prev = msg.delta?.previous_schema || msg.schema!;
                    handleConfirmDecision(msg.id, prev, msg.state);
                  }}
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
                <div className="w-full max-w-2xl p-4 rounded-xl bg-purple-50 border border-purple-200 border-l-4 border-l-purple-500 space-y-1">
                  <span className="text-xs font-mono font-bold text-purple-700">💬 CLARIFICATION NEEDED</span>
                  <div className="text-xs sm:text-sm text-purple-950">{msg.text}</div>
                </div>
              )}

              {msg.type === 'fallback' && (
                <div className="w-full max-w-2xl p-4 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-slate-400 space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-600">ℹ️ GENERAL ANSWER (UNSTRUCTURED)</span>
                  <div className="text-xs sm:text-sm text-slate-700">{msg.text}</div>
                </div>
              )}

              {msg.type === 'error' && (
                <div className="w-full max-w-2xl p-4 rounded-xl bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-800 text-xs sm:text-sm">
                  ⚠️ {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Stepper progress indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <Stepper
                stages={[
                  { stage: 'intent', label: 'Extracting candidate schema via Groq' },
                  { stage: 'verifying', label: 'Scoring with TypeSafe Jev System 1' },
                ]}
              />
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar (embedded directly into playground sheet) */}
        <div className="mt-4 flex items-center bg-[#FFFFFF] border border-[#E5E5E2] rounded-xl px-4 py-2.5 shadow-sm focus-within:border-[#5B61F6] transition-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim() && !isProcessing) {
                handleSendPrompt(inputValue.trim());
              }
            }}
            placeholder={
              activeQuickRunSchema
                ? `Quick Run against '${activeQuickRunSchema.friendly_name}'...`
                : mode === 'unrestricted'
                ? '⚡ Unrestricted Mode: Enter query to auto-execute approved rules...'
                : 'Type your decision query (e.g. "Rate ticket urgency: database is down")...'
            }
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-[#111111] placeholder:text-[#9CA3AF]"
            disabled={isProcessing}
            id="playground-prompt-input"
          />
          <button
            className="ml-2 px-3 py-1.5 bg-[#111111] hover:bg-[#5B61F6] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            onClick={() => {
              if (inputValue.trim() && !isProcessing) handleSendPrompt(inputValue.trim());
            }}
            disabled={!inputValue.trim() || isProcessing}
            id="playground-send-btn"
          >
            {isProcessing ? 'Thinking...' : 'Run Decision ↵'}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHEET 04 · SPECIFICATIONS & DOCUMENTATION                                */}
      {/* ========================================================================= */}
      <footer className="px-6 sm:px-12 py-12 bg-[#F4F4F1] border-t border-[#E5E5E2] text-xs text-[#6B7280] space-y-6">
        <div className="sheet-label">
          <span>◇ SHEET 04 · SPECIFICATIONS & RESOURCES</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
          <div>
            <div className="font-mono text-[#111111] font-semibold mb-2 uppercase text-[11px]">Core Primitives</div>
            <ul className="space-y-1">
              <li>Choice (Classification)</li>
              <li>Score (Ordered Rubric)</li>
              <li>Noul (Boolean Probability)</li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[#111111] font-semibold mb-2 uppercase text-[11px]">System Stack</div>
            <ul className="space-y-1">
              <li>TypeSafe AI Jev (jev-1.13.0)</li>
              <li>Groq LLM (gpt-oss-20b)</li>
              <li>Python 3.11 / FastAPI</li>
              <li>Next.js 16 / TypeScript</li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[#111111] font-semibold mb-2 uppercase text-[11px]">Safety Invariants</div>
            <ul className="space-y-1">
              <li>Zero raw JSON exposure</li>
              <li>5-Point Meta-Schema</li>
              <li>Local chip re-validation</li>
              <li>Targeted diff patching</li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-[#111111] font-semibold mb-2 uppercase text-[11px]">Repository</div>
            <ul className="space-y-1">
              <li>
                <a href="https://github.com/ihatecoding01/Conversational-Jev" target="_blank" rel="noreferrer" className="text-[#5B61F6] hover:underline">
                  GitHub Repository ↗
                </a>
              </li>
              <li>MIT License</li>
              <li>Built with Antigravity</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E5E2] flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
          <div>CONVERSATIONAL JEV · SYSTEM ONE DECISION ENGINE</div>
          <div>FOUNDING ARCHITECTURE · 2026</div>
        </div>
      </footer>
    </div>
  );
}
