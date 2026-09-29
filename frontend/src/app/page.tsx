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
    savePreferences({ mode: newMode, theme: 'dark', unedited_count: consecutiveUnedited });
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
      savePreferences({ mode, theme: 'dark', unedited_count: newCount });

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
    <div className="terminal-sheet bg-[#0A0A0A] text-[#FFFFFF] min-h-screen">
      {/* Top Technical Grid Wire Ruler */}
      <div className="h-7 border-b border-[#2E2E32] bg-[#0A0A0A] flex items-center justify-between px-4 sm:px-8 text-[10px] font-mono text-[#52525B] select-none tracking-widest uppercase">
        <span className="text-[#C8FF00] font-bold">+</span>
        <span className="hidden sm:inline">-400</span>
        <span className="hidden sm:inline">-200</span>
        <span className="text-[#A1A1AA] font-semibold">GRID 0.00</span>
        <span className="hidden sm:inline">+200</span>
        <span className="hidden sm:inline">+400</span>
        <span className="text-[#71717A]">SYS: JEV-1.13 // COL 1120</span>
        <span className="text-[#C8FF00] font-bold">+</span>
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
      {/* SHEET 01 · THE MANIFESTO & THE PROBLEM                                    */}
      {/* ========================================================================= */}
      <section id="manifesto" className="terminal-section relative overflow-hidden">
        {/* Subtle decorative grid background inspired by reference */}
        <div className="absolute inset-0 gt-pixel-grid opacity-15 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-[1px] bg-[#C8FF00]" />
            <span className="type-label text-[#8B5CF6]">
              ◇ SHEET 01 // PROBLEM STATEMENT & MANIFESTO
            </span>
          </div>

          <div className="max-w-4xl space-y-6">
            <h1 className="type-display leading-[1.05]">
              The Developer Bottleneck.
              <span className="block text-xl sm:text-3xl font-normal text-[#A1A1AA] mt-3 font-sans">
                Removing the human schema author from TypeSafe AI's Jev model.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-3xl font-sans">
              TypeSafe AI's <strong className="text-white">Jev</strong> is a non-autoregressive <strong className="text-white">System One decision engine</strong>. Unlike chat models that generate text token-by-token, Jev executes deterministic, typed decisions (Choice, Score, Noul) in parallel at <strong className="text-[#C8FF00]">70ms to 500ms</strong> speeds.
            </p>

            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-3xl font-sans">
              <strong className="text-white font-mono uppercase text-xs tracking-wider bg-[#1C1C1F] px-2 py-0.5 border border-[#2E2E32] rounded-[2px] mr-1.5">The Invariant Gap</strong>
              Jev requires an engineer to write the exact <code className="text-[#8B5CF6] font-mono text-xs">state</code> object and typed schema in JSON upfront. If you don't write code, Jev is completely inaccessible.
            </p>

            {/* Solution Callout Card */}
            <div className="p-6 rounded-[4px] bg-[#111113] border border-[#2E2E32] border-l-[3px] border-l-[#C8FF00] space-y-2 mt-6">
              <div className="text-[10px] font-mono font-bold text-[#C8FF00] uppercase tracking-wider">
                ✦ THE CONVERSATIONAL JEV SOLUTION
              </div>
              <p className="text-sm sm:text-base text-white font-medium leading-relaxed font-sans">
                A person types a free-form sentence in plain English. Simple Jev generates the typed schema, checks its fitness against a hand-crafted meta-schema, executes via Jev, and renders the result. <span className="text-[#C8FF00] font-semibold">The user never sees raw JSON.</span>
              </p>
            </div>
          </div>

          {/* 3 Core Architecture Pillars (Grid Blocks) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10">
            <div className="p-5 rounded-[4px] bg-[#111113] border border-[#2E2E32] hover:border-[#8B5CF6] transition-all space-y-2 group">
              <span className="text-[10px] font-mono text-[#8B5CF6] font-semibold tracking-wider block">01 // ZERO RAW JSON</span>
              <div className="font-bold text-sm text-white font-mono">Interactive Visual Chips</div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">
                Schemas translate to plain English. Options appear as interactive visual chips (<kbd className="px-1.5 py-0.5 bg-[#1C1C1F] border border-[#2E2E32] rounded-[2px] text-[10px] font-mono text-white">✕</kbd> to delete, <kbd className="px-1.5 py-0.5 bg-[#1C1C1F] border border-[#2E2E32] rounded-[2px] text-[10px] font-mono text-[#C8FF00]">+ Add</kbd>). Local edits re-validate instantly without LLM calls.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#111113] border border-[#2E2E32] hover:border-[#8B5CF6] transition-all space-y-2 group">
              <span className="text-[10px] font-mono text-[#8B5CF6] font-semibold tracking-wider block">02 // META-SCHEMA</span>
              <div className="font-bold text-sm text-white font-mono">5-Point Validator Contract</div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">
                The Validator does not answer the question; it evaluates candidate schema fitness across coverage, exclusivity, type fit, scope sizing, and state sufficiency before execution.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#111113] border border-[#2E2E32] hover:border-[#C8FF00] transition-all space-y-2 group">
              <span className="text-[10px] font-mono text-[#C8FF00] font-semibold tracking-wider block">03 // TRUST ENGINE</span>
              <div className="font-bold text-sm text-white font-mono">Safety-First Unrestricted</div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">
                Cached rules run instantly at 0 credit cost. Novel intents pause once for confirmation. Schema variations trigger amber delta alerts to prevent silent model drift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHEET 02 · ARCHITECTURE & VERIFICATION PIPELINE                           */}
      {/* ========================================================================= */}
      <section id="architecture" className="terminal-section bg-[#0A0A0A]">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#8B5CF6]" />
          <span className="type-label text-[#8B5CF6]">
            ◇ SHEET 02 // SYSTEM ARCHITECTURE & 5-POINT VALIDATOR
          </span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h2 className="type-headline text-white">
            How the verification loop converges without thrashing.
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed font-sans">
            Most LLM generation loops fail because they re-roll blindly upon error. Simple Jev uses <strong className="text-white">targeted diff patching</strong>: the validator passes field-by-field diagnostics, allowing the generator to patch only the flagged field rather than regenerating from scratch.
          </p>
        </div>

        {/* Technical Flow Visualization (Circuit Board Blocks) */}
        <div className="mt-8 p-6 rounded-[4px] bg-[#111113] text-white font-mono text-xs space-y-4 border border-[#2E2E32]">
          <div className="flex flex-wrap items-center justify-between border-b border-[#2E2E32] pb-3 text-[#71717A] text-[10px] uppercase tracking-wider">
            <span className="text-[#A1A1AA]">FIG 2.1 // PIPELINE EXECUTION GRAPH</span>
            <span>SPEC: JEV-1.13.0 · GROQ-GPT-OSS-20B</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center">
            <div className="p-3 rounded-[0px] bg-[#161618] border border-[#2E2E32]">
              <span className="text-[#8B5CF6] block text-[9px] mb-1 tracking-widest font-mono">STAGE 01</span>
              <span className="font-bold text-white text-xs font-mono">Plain Text</span>
            </div>
            <div className="p-3 rounded-[0px] bg-[#161618] border border-[#2E2E32]">
              <span className="text-[#8B5CF6] block text-[9px] mb-1 tracking-widest font-mono">STAGE 02</span>
              <span className="font-bold text-white text-xs font-mono">384-d Cache</span>
            </div>
            <div className="p-3 rounded-[0px] bg-[#161618] border border-[#2E2E32]">
              <span className="text-[#8B5CF6] block text-[9px] mb-1 tracking-widest font-mono">STAGE 03</span>
              <span className="font-bold text-white text-xs font-mono">Groq LLM</span>
            </div>
            <div className="p-3 rounded-[0px] bg-[#161618] border border-[#2E2E32]">
              <span className="text-[#10B981] block text-[9px] mb-1 tracking-widest font-mono">STAGE 04</span>
              <span className="font-bold text-white text-xs font-mono">5-pt Validator</span>
            </div>
            <div className="p-3 rounded-[0px] bg-[#C8FF00] text-[#0A0A0A] font-bold border border-[#C8FF00] shadow-[0_0_15px_rgba(200,255,0,0.18)]">
              <span className="text-black/80 block text-[9px] mb-1 tracking-widest font-mono">STAGE 05</span>
              <span className="font-bold text-xs font-mono">Jev Decision</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHEET 03 · THE INTERACTIVE PLAYGROUND (TEST ON YOUR OWN)                  */}
      {/* ========================================================================= */}
      <section ref={playgroundRef} id="playground" className="terminal-section bg-[#0A0A0A]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-[1px] bg-[#C8FF00]" />
            <span className="type-label text-[#C8FF00]">
              ◇ SHEET 03 // INTERACTIVE DECISION PLAYGROUND
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#71717A] tracking-wider">
            CREDITS: <span className="font-bold text-[#C8FF00]">{quota.remaining}/{quota.daily_limit}</span> [REPEAT RUNS FREE]
          </div>
        </div>

        <div className="space-y-3 max-w-3xl mb-8">
          <h2 className="type-headline text-white">
            Test with live Jev System 1.
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1AA] font-sans">
            Select a preset scenario below or type your own question. Watch how the schema is inferred, confirmed with visual chips, and executed against TypeSafe Jev.
          </p>
        </div>

        {/* Preset Selector Rectangular Blocks (Zero Pills) */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <button
            className={`px-3.5 py-2 text-xs font-mono font-medium rounded-[2px] border transition-all cursor-pointer ${
              activeTab === 'choice'
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'bg-[#161618] text-[#A1A1AA] border-[#2E2E32] hover:border-[#8B5CF6] hover:text-white'
            }`}
            onClick={() => loadPreset('choice')}
          >
            <span className="mr-1.5 text-[#C8FF00]">■</span> CHOICE: Customer Email Triage
          </button>
          <button
            className={`px-3.5 py-2 text-xs font-mono font-medium rounded-[2px] border transition-all cursor-pointer ${
              activeTab === 'score'
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'bg-[#161618] text-[#A1A1AA] border-[#2E2E32] hover:border-[#8B5CF6] hover:text-white'
            }`}
            onClick={() => loadPreset('score')}
          >
            <span className="mr-1.5 text-[#C8FF00]">■</span> SCORE: Outage Urgency (1 to 5)
          </button>
          <button
            className={`px-3.5 py-2 text-xs font-mono font-medium rounded-[2px] border transition-all cursor-pointer ${
              activeTab === 'noul'
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'bg-[#161618] text-[#A1A1AA] border-[#2E2E32] hover:border-[#8B5CF6] hover:text-white'
            }`}
            onClick={() => loadPreset('noul')}
          >
            <span className="mr-1.5 text-[#C8FF00]">■</span> NOUL: Security SPF Assertion
          </button>
        </div>

        {/* Active Quick Run Banner */}
        {activeQuickRunSchema && (
          <div className="mb-6 p-4 rounded-[4px] bg-[#161618] border border-[#C8FF00] flex items-center justify-between shadow-[0_0_16px_rgba(200,255,0,0.1)]">
            <div>
              <span className="text-[10px] font-mono text-[#C8FF00] font-semibold tracking-widest block uppercase">
                ⚡ QUICK RUN MODE ACTIVE
              </span>
              <div className="font-semibold text-sm text-white font-mono mt-0.5">
                Pre-locked rule: "{activeQuickRunSchema.friendly_name}"
              </div>
              <div className="text-xs text-[#A1A1AA] font-sans">
                Bypasses LLM generation. Evaluates directly via Jev (0 credits used).
              </div>
            </div>
            <button
              className="px-3 py-1.5 text-xs font-mono bg-transparent hover:bg-[#1C1C1F] text-[#C8FF00] hover:text-white rounded-[4px] border border-[#C8FF00] transition-colors cursor-pointer"
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
        <div className="min-h-[340px] p-6 rounded-[4px] bg-[#111113] border border-[#2E2E32] space-y-6">
          {messages.length === 0 && !isProcessing && (
            <div className="text-center py-14 space-y-3">
              <div className="w-10 h-10 rounded-[2px] bg-[#161618] border border-[#2E2E32] flex items-center justify-center mx-auto text-[#C8FF00] font-mono text-sm">
                ⚙
              </div>
              <div className="font-mono text-xs text-white uppercase tracking-wider">
                PLAYGROUND STANDBY · SYSTEM READY
              </div>
              <p className="text-xs text-[#71717A] max-w-md mx-auto font-sans">
                Select one of the three preset scenarios above, or enter your own decision prompt in the terminal input below.
              </p>
            </div>
          )}

          {/* Render Turn Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
              {msg.type === 'user' && (
                <div className="max-w-[85%] sm:max-w-xl px-4 py-2.5 rounded-[4px] bg-[#161618] border border-[#2E2E32] text-white text-xs sm:text-sm leading-relaxed shadow-sm font-sans">
                  <div className="text-[10px] font-mono text-[#71717A] mb-1 uppercase tracking-wider">USER QUERY</div>
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
                <div className="w-full max-w-2xl p-4 rounded-[4px] bg-[#161618] border border-[#2E2E32] border-l-[3px] border-l-[#8B5CF6] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#8B5CF6] tracking-wider uppercase">💬 CLARIFICATION NEEDED</span>
                  <div className="text-xs sm:text-sm text-white font-sans">{msg.text}</div>
                </div>
              )}

              {msg.type === 'fallback' && (
                <div className="w-full max-w-2xl p-4 rounded-[4px] bg-[#161618] border border-[#2E2E32] border-l-[3px] border-l-[#71717A] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#71717A] tracking-wider uppercase">ℹ️ GENERAL ANSWER (UNSTRUCTURED)</span>
                  <div className="text-xs sm:text-sm text-white font-sans">{msg.text}</div>
                </div>
              )}

              {msg.type === 'error' && (
                <div className="w-full max-w-2xl p-4 rounded-[4px] bg-[#161618] border border-[#2E2E32] border-l-[3px] border-l-rose-500 text-rose-400 text-xs sm:text-sm font-mono">
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

        {/* Input Bar (embedded directly into playground terminal) */}
        <div className="mt-4 flex items-center bg-[#161618] border border-[#2E2E32] rounded-[4px] px-4 py-2.5 transition-all focus-within:border-[#C8FF00] focus-within:shadow-[0_0_16px_rgba(200,255,0,0.12)]">
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
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-[#52525B] font-sans"
            disabled={isProcessing}
            id="playground-prompt-input"
          />
          <button
            className="ml-2 px-3.5 py-1.5 bg-[#C8FF00] hover:bg-[#A3CC00] text-[#0A0A0A] text-xs font-mono font-semibold rounded-[4px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(200,255,0,0.2)]"
            onClick={() => {
              if (inputValue.trim() && !isProcessing) handleSendPrompt(inputValue.trim());
            }}
            disabled={!inputValue.trim() || isProcessing}
            id="playground-send-btn"
          >
            {isProcessing ? 'PROCESSING...' : 'RUN ↵'}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SHEET 04 · SPECIFICATIONS & DOCUMENTATION                                */}
      {/* ========================================================================= */}
      <footer className="terminal-section bg-[#0A0A0A] text-xs text-[#71717A] space-y-8">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#52525B]" />
          <span className="type-label text-[#71717A]">
            ◇ SHEET 04 // SPECIFICATIONS & RESOURCES
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
          <div>
            <div className="font-mono text-white font-semibold mb-2 uppercase text-[11px] tracking-wider">Core Primitives</div>
            <ul className="space-y-1 font-sans text-[#A1A1AA]">
              <li>Choice (Classification)</li>
              <li>Score (Ordered Rubric)</li>
              <li>Noul (Boolean Probability)</li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-white font-semibold mb-2 uppercase text-[11px] tracking-wider">System Stack</div>
            <ul className="space-y-1 font-sans text-[#A1A1AA]">
              <li>TypeSafe AI Jev (jev-1.13.0)</li>
              <li>Groq LLM (gpt-oss-20b)</li>
              <li>Python 3.11 / FastAPI</li>
              <li>Next.js 16 / TypeScript</li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-white font-semibold mb-2 uppercase text-[11px] tracking-wider">Safety Invariants</div>
            <ul className="space-y-1 font-sans text-[#A1A1AA]">
              <li>Zero raw JSON exposure</li>
              <li>5-Point Meta-Schema</li>
              <li>Local chip re-validation</li>
              <li>Targeted diff patching</li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-white font-semibold mb-2 uppercase text-[11px] tracking-wider">Repository</div>
            <ul className="space-y-1 font-sans">
              <li>
                <a href="https://github.com/ihatecoding01/Conversational-Jev" target="_blank" rel="noreferrer" className="text-[#8B5CF6] hover:text-[#C8FF00] hover:underline font-mono">
                  GitHub Repository ↗
                </a>
              </li>
              <li className="text-[#A1A1AA]">MIT License</li>
              <li className="text-[#A1A1AA]">Built with Antigravity</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2E2E32] flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-[#52525B] uppercase tracking-widest">
          <div>CONVERSATIONAL JEV // SYSTEM ONE DECISION ENGINE</div>
          <div>FOUNDING ARCHITECTURE · 2026</div>
        </div>
      </footer>
    </div>
  );
}
