'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ConfirmationCard from '../../components/ConfirmationCard';
import DeltaPrompt from '../../components/DeltaPrompt';
import DecisionCard from '../../components/DecisionCard';
import Stepper from '../../components/Stepper';
import ProgressiveTrustBanner from '../../components/ProgressiveTrustBanner';
import PacmanTrack from '../../components/PacmanTrack';
import { DotCluster, BarcodeTag } from '../../components/AbstractGeometry';
import { CandidateSchema, ExecutionResult, PinnedSchema, QuotaStatus } from '../../types';
import {
  evaluateIntent,
  revalidateSchema,
  patchSchema,
  executeJev,
  fetchQuota,
} from '../../services/api';
import {
  getPreferences,
  savePreferences,
  getPinnedSchemas,
  pinSchema,
} from '../../services/storage';

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

export default function PlaygroundPage() {
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
  };

  return (
    <div className="terminal-sheet bg-[#0B0C0E] text-[#FFFFFF] min-h-screen relative overflow-hidden flex flex-col">
      {/* Intense Ambient Neon Green Spotlights */}
      <div className="neon-ambient-glow neon-spotlight-hero w-[400px] h-[400px] left-[-150px] top-[10%]" />
      <div className="neon-ambient-glow neon-spotlight-bottom w-[450px] h-[450px] right-[-100px] bottom-[15%]" />

      {/* Main Global Header */}
      <Header />

      {/* Playground Dedicated Control Sub-bar */}
      <div className="border-b border-[#272A35] bg-[#131418] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs select-none relative z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 font-mono text-[11px] text-[#A1A1AA] hover:text-white transition-colors"
          >
            <span>←</span>
            <span>OVERVIEW</span>
          </Link>
          <span className="text-[#272A35]">|</span>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#C8FF00] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]" />
            LIVE PLAYGROUND
          </div>
        </div>

        {/* Center/Right Control Group: Mode switcher + Quota + Pinned Rules */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Mode Switcher */}
          <div className="flex p-0.5 bg-[#181A20] border border-[#272A35] rounded-[4px]">
            <button
              className={`px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase rounded-[2px] transition-all cursor-pointer ${
                mode === 'restricted'
                  ? 'bg-[#C8FF00] text-black shadow-[0_0_10px_rgba(200,255,0,0.3)]'
                  : 'text-[#71717A] hover:text-white'
              }`}
              onClick={() => handleModeChange('restricted')}
              id="mode-restricted-btn"
            >
              [RESTRICTED]
            </button>
            <button
              className={`px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase rounded-[2px] transition-all cursor-pointer ${
                mode === 'unrestricted'
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                  : 'text-[#71717A] hover:text-white'
              }`}
              onClick={() => handleModeChange('unrestricted')}
              id="mode-unrestricted-btn"
            >
              [UNRESTRICTED]
            </button>
          </div>

          {/* Credits */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[#181A20] border border-[#272A35] rounded-[2px] font-mono text-[10px] text-[#71717A]">
            <span className="text-[#C8FF00] font-bold">{quota.remaining}</span>
            <span>/{quota.daily_limit}</span>
            <span>CR</span>
          </div>

          {/* Pinned Rules Drawer Toggle */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181A20] hover:bg-[#1F222A] border border-[#272A35] hover:border-[#8B5CF6] text-white rounded-[2px] font-mono text-[10px] cursor-pointer transition-colors"
            onClick={() => setIsSidebarOpen(true)}
            id="sidebar-toggle-btn"
          >
            <span>[RULES]</span>
            {pinnedSchemas.length > 0 && (
              <span className="px-1 bg-[#8B5CF6] text-white text-[9px] rounded-[1px] font-bold">
                {pinnedSchemas.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pinnedSchemas={pinnedSchemas}
        setPinnedSchemas={setPinnedSchemas}
        onQuickRun={handleTriggerQuickRun}
      />

      {/* Main Interactive Playground Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col space-y-5 relative z-10">
        {/* Preset Selector Rectangular Blocks */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] border transition-all cursor-pointer ${
                activeTab === 'choice'
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-[#181A20] text-[#A1A1AA] border-[#272A35] hover:border-[#8B5CF6] hover:text-white'
              }`}
              onClick={() => loadPreset('choice')}
            >
              <span className="mr-1 text-[#C8FF00]">■</span> CHOICE: Email Triage
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] border transition-all cursor-pointer ${
                activeTab === 'score'
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-[#181A20] text-[#A1A1AA] border-[#272A35] hover:border-[#8B5CF6] hover:text-white'
              }`}
              onClick={() => loadPreset('score')}
            >
              <span className="mr-1 text-[#C8FF00]">■</span> SCORE: Urgency (1-5)
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[2px] border transition-all cursor-pointer ${
                activeTab === 'noul'
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-[#181A20] text-[#A1A1AA] border-[#272A35] hover:border-[#8B5CF6] hover:text-white'
              }`}
              onClick={() => loadPreset('noul')}
            >
              <span className="mr-1 text-[#C8FF00]">■</span> NOUL: SPF Assertion
            </button>
          </div>

          <BarcodeTag code="JEV // RUNTIME" />
        </div>

        {/* Active Quick Run Banner */}
        {activeQuickRunSchema && (
          <div className="p-3.5 rounded-[4px] bg-[#181A20] border border-[#C8FF00] flex items-center justify-between shadow-[0_0_15px_rgba(200,255,0,0.15)] animate-fade-in">
            <div>
              <span className="text-[10px] font-mono text-[#C8FF00] font-semibold tracking-widest block uppercase">
                [QUICK RUN MODE ACTIVE]
              </span>
              <div className="font-semibold text-xs text-white font-mono mt-0.5">
                Pre-locked rule: "{activeQuickRunSchema.friendly_name}" (0 credits used)
              </div>
            </div>
            <button
              className="px-2.5 py-1 text-[11px] font-mono bg-transparent hover:bg-[#1F222A] text-[#C8FF00] hover:text-white rounded-[2px] border border-[#C8FF00] transition-colors cursor-pointer"
              onClick={() => setActiveQuickRunSchema(null)}
            >
              Cancel
            </button>
          </div>
        )}

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

        {/* Conversation Thread Canvas */}
        <div className="flex-1 min-h-[440px] p-5 sm:p-6 rounded-[4px] bg-[#131418] border border-[#272A35] space-y-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-25 pointer-events-none select-none">
            <DotCluster rows={3} cols={3} color="lime" />
          </div>

          {messages.length === 0 && !isProcessing && (
            <div className="text-center py-20 space-y-4">
              <div className="w-12 h-12 rounded-[2px] bg-[#181A20] border border-[#272A35] flex items-center justify-center mx-auto text-[#C8FF00] font-mono text-sm shadow-[0_0_20px_rgba(200,255,0,0.15)]">
                [STANDBY]
              </div>
              <div className="font-mono text-xs text-white uppercase tracking-wider">
                PLAYGROUND READY // SYSTEM STANDBY
              </div>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto font-sans leading-relaxed">
                Choose a preset scenario above or enter your question below to evaluate live with TypeSafe Jev.
              </p>
            </div>
          )}

          {/* Render Turn Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
              {msg.type === 'user' && (
                <div className="max-w-[85%] sm:max-w-xl px-4 py-2.5 rounded-[4px] bg-[#181A20] border border-[#272A35] text-white text-xs sm:text-sm leading-relaxed shadow-sm font-sans">
                  <div className="text-[10px] font-mono text-[#71717A] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                    USER QUERY
                  </div>
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
                <div className="w-full max-w-2xl p-4 rounded-[4px] bg-[#181A20] border border-[#272A35] border-l-[3px] border-l-[#8B5CF6] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#8B5CF6] tracking-wider uppercase">[CLARIFICATION NEEDED]</span>
                  <div className="text-xs sm:text-sm text-white font-sans">{msg.text}</div>
                </div>
              )}

              {msg.type === 'fallback' && (
                <div className="w-full max-w-2xl p-4 rounded-[4px] bg-[#181A20] border border-[#272A35] border-l-[3px] border-l-[#71717A] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#71717A] tracking-wider uppercase">[GENERAL ANSWER]</span>
                  <div className="text-xs sm:text-sm text-white font-sans">{msg.text}</div>
                </div>
              )}

              {msg.type === 'error' && (
                <div className="w-full max-w-2xl p-4 rounded-[4px] bg-[#181A20] border border-[#272A35] border-l-[3px] border-l-[#FF2E54] text-[#FF2E54] text-xs sm:text-sm font-mono">
                  [ERROR] {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Stepper Progress */}
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

        {/* Input Bar with High-Importance Crimson Red Execute CTA */}
        <div className="flex items-center bg-[#181A20] border border-[#272A35] rounded-[4px] px-3.5 sm:px-4 py-2.5 focus-within:border-[#C8FF00] focus-within:shadow-[0_0_20px_rgba(200,255,0,0.18)] transition-all">
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
                ? '[Unrestricted Mode] Enter query to auto-execute approved rules...'
                : 'Type your decision query (e.g. "Rate ticket urgency: database is down")...'
            }
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-[#52525B] font-sans"
            disabled={isProcessing}
            id="playground-prompt-input"
          />
          <button
            className="ml-2 px-4 py-2 bg-[#FF2E54] hover:bg-[#E01B42] text-white text-xs font-mono font-bold rounded-[4px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(255,46,84,0.4)] hover:shadow-[0_0_26px_rgba(255,46,84,0.65)] hover:scale-105 active:scale-95"
            onClick={() => {
              if (inputValue.trim() && !isProcessing) handleSendPrompt(inputValue.trim());
            }}
            disabled={!inputValue.trim() || isProcessing}
            id="playground-send-btn"
          >
            {isProcessing ? 'PROCESSING...' : 'RUN ↵'}
          </button>
        </div>
      </main>

      {/* Pacman Track Animation at Bottom */}
      <PacmanTrack />
    </div>
  );
}
