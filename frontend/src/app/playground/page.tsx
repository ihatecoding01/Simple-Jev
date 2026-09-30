'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import ConfirmationCard from '../../components/ConfirmationCard';
import DeltaPrompt from '../../components/DeltaPrompt';
import DecisionCard from '../../components/DecisionCard';
import Stepper from '../../components/Stepper';
import ProgressiveTrustBanner from '../../components/ProgressiveTrustBanner';
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
  unpinSchema,
  renamePinnedSchema,
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

interface RecentInquiry {
  id: string;
  title: string;
  query: string;
  type: 'choice' | 'score' | 'noul';
  verdict?: string;
  timestamp: string;
}

// ────────────────────────────────────────────────────────────────────
// FEATURED TEMPLATES FOR THE HERO CAROUSEL BANNER
// ────────────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: 'slide-router',
    badge: 'FEATURED TEMPLATE • CHOICE',
    title: 'Customer Email & Ticket Router',
    description: 'Sort incoming emails into Billing, Support, or Account with deterministic Jev schemas.',
    query: "Categorize customer email: 'I was charged twice on invoice #994. Please issue a refund ASAP.'",
    color: '#8B5CF6',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: 'slide-urgency',
    badge: 'FEATURED TEMPLATE • SCORE (1-5)',
    title: 'Production Incident Urgency Scorer',
    description: 'Score system outage impact and customer disruption on a deterministic 1 to 5 scale.',
    query: 'Rate urgency: Primary database cluster has failed and all customer logins are returning errors.',
    color: '#C8FF00',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    id: 'slide-spf',
    badge: 'FEATURED TEMPLATE • NOUL (CLAIM)',
    title: 'Security & Domain Policy Verifier',
    description: 'Verify if sender domain passes strict SPF authentication with mathematical certainty.',
    query: 'Verify: The incoming email SPF record passes verification for paypal.com domain.',
    color: '#10B981',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'slide-lead',
    badge: 'FEATURED TEMPLATE • CHOICE',
    title: 'Sales Opportunity Qualifier',
    description: 'Triage enterprise prospects vs self-serve signups by headcount and deployment scope.',
    query: 'Qualify lead: Fortune 500 enterprise requesting 25,000 seat dedicated cloud deployment.',
    color: '#06B6D4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
      </svg>
    ),
  },
];

// ────────────────────────────────────────────────────────────────────
// 6 READY-TO-RUN TEMPLATES (WHIRL.CHAT 2-COLUMN GRID)
// ────────────────────────────────────────────────────────────────────
const READY_TEMPLATES = [
  {
    id: 'email-router',
    type: 'choice' as const,
    title: 'Customer Email Router',
    description: 'Sort incoming emails into Billing, Support, or Account automatically.',
    query: "Categorize customer email: 'I was charged twice on invoice #994. Please issue a refund ASAP.'",
    color: '#8B5CF6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: 'incident-scorer',
    type: 'score' as const,
    title: 'Incident Urgency Scorer',
    description: 'Score production downtime impact from 1 (minor) to 5 (critical emergency).',
    query: 'Rate urgency: Primary database cluster has failed and all customer logins are returning errors.',
    color: '#C8FF00',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    id: 'spf-verifier',
    type: 'noul' as const,
    title: 'SPF & Security Verifier',
    description: 'Verify if incoming email domain passes SPF and security policies.',
    query: 'Verify: The incoming email SPF record passes verification for paypal.com domain.',
    color: '#10B981',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'lead-qualifier',
    type: 'choice' as const,
    title: 'Sales Lead Qualifier',
    description: 'Triage incoming leads: Enterprise, Mid-Market, SMB, or Unqualified.',
    query: 'Qualify lead: Fortune 500 enterprise requesting 25,000 seat dedicated deployment.',
    color: '#06B6D4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
      </svg>
    ),
  },
  {
    id: 'feedback-sentiment',
    type: 'score' as const,
    title: 'Review Sentiment Gauge',
    description: 'Quantify customer satisfaction and churn risk on a 1 to 10 scale.',
    query: "Score sentiment: 'Product is fast and sleek, but checkout failed twice and documentation is lacking.'",
    color: '#F59E0B',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'gdpr-compliance',
    type: 'noul' as const,
    title: 'GDPR Compliance Check',
    description: 'Verify whether a user deletion request requires immediate Article 17 action.',
    query: 'Verify: User requests complete data deletion under Article 17 of GDPR within 30 days.',
    color: '#EC4899',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'restricted' | 'unrestricted'>('restricted');
  const [pinnedSchemas, setPinnedSchemas] = useState<PinnedSchema[]>([]);
  const [quota, setQuota] = useState<QuotaStatus>({ daily_limit: 25, remaining: 25, cached_runs: 0, cold_runs: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQuickRunSchema, setActiveQuickRunSchema] = useState<PinnedSchema | null>(null);
  const [consecutiveUnedited, setConsecutiveUnedited] = useState(0);
  const [showTrustBanner, setShowTrustBanner] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // App shell states (Whirl.chat inspired)
  const [activeTab, setActiveTab] = useState<'browse' | 'chat' | 'saved'>('browse');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([
    {
      id: 'rec-1',
      title: 'Invoice Billing Refund',
      query: "Categorize customer email: 'I was charged twice on invoice #994. Please issue a refund ASAP.'",
      type: 'choice',
      verdict: 'Billing',
      timestamp: 'Today',
    },
    {
      id: 'rec-2',
      title: 'Database Outage Scorer',
      query: 'Rate urgency: Primary database cluster has failed and all customer logins are returning errors.',
      type: 'score',
      verdict: '5 / 5 Critical',
      timestamp: 'Yesterday',
    },
    {
      id: 'rec-3',
      title: 'PayPal SPF Domain Check',
      query: 'Verify: The incoming email SPF record passes verification for paypal.com domain.',
      type: 'noul',
      verdict: 'True',
      timestamp: '3d ago',
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Automatic hero carousel cycle every 8 seconds if idle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSendPrompt = async (text: string) => {
    if (!text || !text.trim() || isProcessing) return;
    const cleanText = text.trim();
    setInputValue('');
    setIsProcessing(true);
    setActiveTab('chat');

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

    // Add to recent inquiries history
    const shortTitle = cleanText.length > 30 ? `${cleanText.slice(0, 27)}...` : cleanText;
    setRecentInquiries((prev) => [
      {
        id: `rec-${Date.now()}`,
        title: shortTitle,
        query: cleanText,
        type: 'choice',
        timestamp: 'Just now',
      },
      ...prev.slice(0, 9),
    ]);

    if (activeQuickRunSchema) {
      try {
        const state = { content_text: cleanText, raw_query: cleanText };
        const result = await executeJev(activeQuickRunSchema.schema_data, state);
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'decision', result, schema: activeQuickRunSchema.schema_data },
        ]);
        setActiveQuickRunSchema(null);
        fetchQuota().then(setQuota);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'error', text: `Quick Run failed: ${err.message}` },
        ]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const response = await evaluateIntent(cleanText, mode);
      fetchQuota().then(setQuota);

      if (response.status === 'cache_hit' && response.execution_result && response.schema_data) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'decision', result: response.execution_result, schema: response.schema_data, isCached: true },
        ]);
      } else if (response.status === 'needs_confirmation' && response.schema_data) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'confirmation', schema: response.schema_data, state: response.state, plainTranslation: response.plain_translation, isCached: response.is_cached },
        ]);
      } else if (response.status === 'diverged' && response.schema_data) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'delta', delta: response.divergence_delta, schema: response.schema_data, state: response.state },
        ]);
      } else if (response.status === 'incomplete_state') {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'assistant_clarification', text: response.assistant_message, schema: response.schema_data, state: response.state },
        ]);
      } else if (response.status === 'fallback') {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'fallback', text: response.assistant_message },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: newTurnId, type: 'error', text: `Something went wrong: ${err.message}` },
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
          msg.id === turnId ? { ...msg, type: 'decision', result, schema } : msg
        )
      );
      const newCount = consecutiveUnedited + 1;
      setConsecutiveUnedited(newCount);
      savePreferences({ mode, theme: 'dark', unedited_count: newCount });
      if (mode === 'restricted' && newCount >= 3) setShowTrustBanner(true);
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
          msg.id === turnId ? { ...msg, schema: reval.schema_data, plainTranslation: reval.plain_translation } : msg
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
          msg.id === turnId ? { ...msg, schema: reval.schema_data, plainTranslation: reval.plain_translation } : msg
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
          msg.id === turnId ? { ...msg, schema: patched.schema_data, state: patched.state, plainTranslation: patched.plain_translation } : msg
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
    setActiveTab('chat');
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleStartNewSession = () => {
    setMessages([]);
    setActiveQuickRunSchema(null);
    setInputValue('');
    setActiveTab('browse');
  };

  const filteredTemplates = READY_TEMPLATES.filter((tpl) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return tpl.title.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q);
  });

  const activeSlide = HERO_SLIDES[currentSlideIndex];

  return (
    <div className="bg-[#0B0C0E] text-white min-h-screen flex flex-col font-sans selection:bg-[#C8FF00] selection:text-black">
      {/* Global Top Navbar */}
      <Header />

      {/* Main Studio Shell: Whirl.chat Inspired Split-Pane App Layout */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden">
        {/* ──────────────────────────────────────────────────────── */}
        {/* LEFT APP SIDEBAR (WHIRL.CHAT STYLE)                      */}
        {/* ──────────────────────────────────────────────────────── */}
        <aside
          className={`shrink-0 border-r border-[#1C1E26] bg-[#0E0F13] flex flex-col transition-all duration-300 z-30 ${
            isSidebarCollapsed ? 'w-16' : 'w-64 sm:w-72'
          }`}
        >
          {/* Sidebar Top: Action & Toggle */}
          <div className="p-4 border-b border-[#1C1E26] flex items-center justify-between gap-2">
            {!isSidebarCollapsed && (
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[8px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold shadow-[0_0_15px_rgba(139,92,246,0.25)] transition-all cursor-pointer group active:scale-[0.98]"
                onClick={handleStartNewSession}
                id="new-inquiry-btn"
                title="Start a new decision prompt"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>New Decision</span>
                <span className="text-[10px] text-white/60 ml-auto hidden sm:inline">⌘N</span>
              </button>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-[6px] text-[#71717A] hover:text-white hover:bg-[#181A20] transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>

          {/* Quick Search in sidebar */}
          {!isSidebarCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-[#14161C] border border-[#232630] text-xs text-[#A1A1AA]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#71717A]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-[#52525B]"
                />
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-[#181A20] text-white border border-[#272A35]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#131418]'
              }`}
              title="Browse Templates"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8FF00]">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              {!isSidebarCollapsed && <span>Decision Templates</span>}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#181A20] text-white border border-[#272A35]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#131418]'
              }`}
              title="Live Studio Session"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B5CF6]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {!isSidebarCollapsed && (
                <>
                  <span>Studio Session</span>
                  {messages.length > 0 && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/30 text-[#A78BFA] font-bold">
                      {messages.length}
                    </span>
                  )}
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-[#181A20] text-white border border-[#272A35]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#131418]'
              }`}
              title="Saved & Pinned Rules"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF2E54]">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {!isSidebarCollapsed && (
                <>
                  <span>Saved Rules</span>
                  {pinnedSchemas.length > 0 && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF2E54]/30 text-[#FF2E54] font-bold">
                      {pinnedSchemas.length}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Whirl.chat Style Recent History List */}
          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#52525B] px-2 font-semibold">
                Recent Inquiries
              </div>
              <div className="space-y-1">
                {recentInquiries.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSendPrompt(item.query)}
                    className="w-full text-left p-2 rounded-[6px] hover:bg-[#14161C] transition-colors group cursor-pointer"
                    title={item.query}
                  >
                    <div className="text-xs text-[#D4D4D8] font-medium truncate group-hover:text-[#C8FF00] transition-colors">
                      {item.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#71717A] mt-0.5">
                      <span className="capitalize">{item.type}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Account / Quota Footer (Whirl.chat Style) */}
          <div className="p-3 border-t border-[#1C1E26] bg-[#0A0B0E]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#181A20] border border-[#2E313D] flex items-center justify-center text-xs font-bold text-[#C8FF00]">
                J1
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">Guest User</div>
                  <div className="text-[10px] text-[#71717A] flex items-center gap-1.5">
                    <span>Free Tier</span>
                    <span>•</span>
                    <span className="text-[#C8FF00] font-mono">{quota.remaining} runs left</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ──────────────────────────────────────────────────────── */}
        {/* MAIN STUDIO CANVAS                                      */}
        {/* ──────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0B0C0E] overflow-y-auto">
          {/* Main Top Header Controls */}
          <header className="sticky top-0 z-20 px-6 py-4 bg-[#0B0C0E]/90 backdrop-blur-md border-b border-[#1C1E26] flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight flex items-center gap-2">
                <span>Playground Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20 font-mono uppercase">
                  No-Code Jev
                </span>
              </h1>
              <p className="text-xs text-[#71717A] mt-0.5">
                Ask in plain English. Simple Jev generates and runs deterministic decision schemas.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Mode Toggle with Explanation */}
              <div className="flex p-0.5 bg-[#14161C] border border-[#232630] rounded-[6px]">
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-all cursor-pointer ${
                    mode === 'restricted'
                      ? 'bg-[#C8FF00] text-black font-semibold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                  onClick={() => handleModeChange('restricted')}
                  id="mode-restricted-btn"
                  title="Confirms decision choices before execution (Safest)"
                >
                  Restricted
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-all cursor-pointer ${
                    mode === 'unrestricted'
                      ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                  onClick={() => handleModeChange('unrestricted')}
                  id="mode-unrestricted-btn"
                  title="Auto-executes exact cache hits for fastest response"
                >
                  Unrestricted
                </button>
              </div>

              {/* Quota Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#14161C] border border-[#232630] text-xs">
                <span className="text-[#71717A]">Quota:</span>
                <span className="text-[#C8FF00] font-mono font-bold">{quota.remaining}</span>
                <span className="text-[#52525B]">/ {quota.daily_limit}</span>
              </div>
            </div>
          </header>

          <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
            {/* Quick Run Banner */}
            {activeQuickRunSchema && (
              <div className="flex items-center justify-between p-3.5 rounded-[8px] bg-[#C8FF00]/10 border border-[#C8FF00]/30 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C8FF00] animate-pulse" />
                  <span className="text-xs sm:text-sm text-white font-medium">
                    Quick Run Mode: <strong className="text-[#C8FF00]">{activeQuickRunSchema.friendly_name}</strong>
                  </span>
                  <span className="text-[11px] text-[#A1A1AA] bg-black/40 px-2 py-0.5 rounded-[4px]">
                    0 credits used (Free)
                  </span>
                </div>
                <button
                  className="px-2.5 py-1 text-xs text-[#A1A1AA] hover:text-white bg-[#14161C] hover:bg-[#1F222A] rounded-[4px] border border-[#272A35] cursor-pointer transition-colors"
                  onClick={() => setActiveQuickRunSchema(null)}
                >
                  Exit Quick Run
                </button>
              </div>
            )}

            {/* Progressive Trust Milestone Banner */}
            {showTrustBanner && mode === 'restricted' && (
              <ProgressiveTrustBanner
                onSwitch={() => { handleModeChange('unrestricted'); setShowTrustBanner(false); }}
                onDismiss={() => setShowTrustBanner(false)}
              />
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* PROMINENT NATURAL LANGUAGE INPUT BAR                     */}
            {/* ──────────────────────────────────────────────────────── */}
            <div
              className={`p-2 rounded-[12px] border transition-all duration-300 shadow-xl ${
                inputFocused
                  ? 'bg-[#131418] border-[#C8FF00]/50 shadow-[0_0_30px_rgba(200,255,0,0.12)]'
                  : 'bg-[#131418] border-[#22252F] hover:border-[#333745]'
              }`}
            >
              <div className="flex items-center gap-3 px-2">
                <div className="text-[#71717A] shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim() && !isProcessing) {
                      handleSendPrompt(inputValue.trim());
                    }
                  }}
                  placeholder={
                    activeQuickRunSchema
                      ? `Enter input to test with "${activeQuickRunSchema.friendly_name}"...`
                      : 'Ask anything, e.g. "Categorize this customer email: I need an invoice refund"'
                  }
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#52525B] font-sans py-2.5"
                  disabled={isProcessing}
                  id="playground-prompt-input"
                />
                {inputValue && (
                  <button
                    onClick={() => setInputValue('')}
                    className="text-[#71717A] hover:text-white text-xs px-1.5 py-1 cursor-pointer"
                    title="Clear input"
                  >
                    ✕
                  </button>
                )}
                <button
                  className="shrink-0 px-5 py-2.5 bg-[#FF2E54] hover:bg-[#E01B42] text-white text-xs font-semibold rounded-[8px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,46,84,0.3)] hover:shadow-[0_0_25px_rgba(255,46,84,0.5)] active:scale-[0.98]"
                  onClick={() => {
                    if (inputValue.trim() && !isProcessing) handleSendPrompt(inputValue.trim());
                  }}
                  disabled={!inputValue.trim() || isProcessing}
                  id="playground-send-btn"
                >
                  {isProcessing ? 'Thinking...' : 'Run Decision ↵'}
                </button>
              </div>
            </div>

            {/* ──────────────────────────────────────────────────────── */}
            {/* VIEW A: TEMPLATES BROWSER (WHIRL.CHAT STYLE)             */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'browse' && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. HERO FEATURED BANNER CARD (Directly matching Whirl.chat) */}
                <div className="relative w-full rounded-2xl overflow-hidden border border-[#272A35] shadow-2xl group min-h-[220px] sm:min-h-[250px] flex flex-col justify-end p-6 sm:p-8">
                  {/* Banner Image Background */}
                  <img
                    src="/playground-header.jpg"
                    alt="Featured Template Illustration"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay to ensure perfect contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/70 to-transparent" />

                  {/* Overlaid Banner Content */}
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono tracking-wider text-[#C8FF00] uppercase font-semibold">
                        {activeSlide.badge}
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 shadow-lg"
                          style={{ backgroundColor: `${activeSlide.color}25`, color: activeSlide.color, border: `1px solid ${activeSlide.color}50` }}
                        >
                          {activeSlide.icon}
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                            {activeSlide.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-[#D4D4D8] font-sans mt-0.5 leading-relaxed">
                            {activeSlide.description}
                          </p>
                        </div>
                      </div>

                      {/* Carousel Pagination Dots */}
                      <div className="flex items-center gap-1.5 pt-2">
                        {HERO_SLIDES.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              currentSlideIndex === idx
                                ? 'w-6 bg-[#C8FF00]'
                                : 'w-1.5 bg-white/30 hover:bg-white/60'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => handleSendPrompt(activeSlide.query)}
                        className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F4F4F5] text-black font-semibold text-xs tracking-wide shadow-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <span>Try This Template</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. READY-TO-RUN DECISION TEMPLATES (WHIRL.CHAT 2-COLUMN GRID) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        Decision Templates
                      </h3>
                      <p className="text-xs text-[#71717A]">
                        Click any template to load and execute an instant deterministic decision.
                      </p>
                    </div>
                    {messages.length > 0 && (
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Current Chat ({messages.length})</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleSendPrompt(template.query)}
                        className="group flex items-start gap-4 p-4 rounded-[12px] bg-[#131418] border border-[#22252F] hover:border-[#383C4B] hover:bg-[#171920] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg relative overflow-hidden"
                      >
                        {/* App Icon */}
                        <div
                          className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                          style={{
                            backgroundColor: `${template.color}15`,
                            color: template.color,
                            border: `1px solid ${template.color}35`,
                          }}
                        >
                          {template.icon}
                        </div>

                        {/* Text description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-[#C8FF00] transition-colors truncate">
                              {template.title}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 text-[#71717A] border border-white/5">
                              {template.type}
                            </span>
                          </div>
                          <p className="text-xs text-[#8E909B] mt-1 line-clamp-2 leading-relaxed">
                            {template.description}
                          </p>
                        </div>

                        {/* Right Chevron Slide Icon */}
                        <div className="text-[#52525B] group-hover:text-white transition-all transform group-hover:translate-x-1 shrink-0 pt-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* VIEW B: CONVERSATION THREAD (CLEAN & ZERO-DISTRESS)       */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'chat' && (
              <div className="space-y-6 animate-fade-in">
                {/* Chat Header Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1C1E26]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="px-2.5 py-1 text-xs text-[#A1A1AA] hover:text-white bg-[#14161C] hover:bg-[#1F222A] rounded-[6px] border border-[#272A35] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>←</span>
                      <span>Templates</span>
                    </button>
                    <span className="text-xs text-[#71717A]">
                      {messages.length} message{messages.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <button
                    onClick={handleStartNewSession}
                    className="text-xs text-[#71717A] hover:text-[#FF2E54] cursor-pointer transition-colors"
                  >
                    Clear Thread
                  </button>
                </div>

                {messages.length === 0 && !isProcessing && (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#181A20] text-[#71717A] mx-auto flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white">No active conversation</h3>
                    <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                      Type your question in the bar above or select a template to see how Simple Jev evaluates intent.
                    </p>
                  </div>
                )}

                {/* Messages Stack */}
                <div className="space-y-5">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} space-y-2 animate-fade-in`}
                    >
                      {msg.type === 'user' && (
                        <div className="max-w-[85%] sm:max-w-xl px-4 py-3 rounded-[12px] bg-[#1F222A] border border-[#2E3240] text-white text-sm leading-relaxed font-sans shadow-md">
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
                        <div className="w-full max-w-2xl p-4 rounded-[10px] bg-[#131418] border border-[#8B5CF6]/30 space-y-1">
                          <span className="text-xs font-semibold text-[#8B5CF6]">Need more information</span>
                          <div className="text-sm text-white font-sans">{msg.text}</div>
                        </div>
                      )}

                      {msg.type === 'fallback' && (
                        <div className="w-full max-w-2xl p-4 rounded-[10px] bg-[#131418] border border-[#272A35] space-y-1">
                          <span className="text-xs font-semibold text-[#71717A]">General Answer</span>
                          <div className="text-sm text-white font-sans">{msg.text}</div>
                        </div>
                      )}

                      {msg.type === 'error' && (
                        <div className="w-full max-w-2xl p-4 rounded-[10px] bg-[#FF2E54]/10 border border-[#FF2E54]/30 text-sm font-sans">
                          <span className="text-[#FF2E54] font-semibold">Error: </span>
                          <span className="text-[#D4D4D8]">{msg.text}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Processing Stepper */}
                  {isProcessing && (
                    <div className="flex justify-start py-2 animate-fade-in">
                      <Stepper
                        stages={[
                          { stage: 'intent', label: 'Extracting intent and candidate schema...' },
                          { stage: 'verifying', label: 'Running 5-point quality validation...' },
                        ]}
                      />
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────── */}
            {/* VIEW C: SAVED & PINNED RULES                             */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'saved' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-[#1C1E26]">
                  <div>
                    <h2 className="text-base font-bold text-white font-sans">
                      Pinned Schemas & Saved Rules
                    </h2>
                    <p className="text-xs text-[#71717A]">
                      Pinned rules execute with 0 credits and instant 0ms latency.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#8B5CF6]/20 text-[#A78BFA] font-mono">
                    {pinnedSchemas.length} saved
                  </span>
                </div>

                {pinnedSchemas.length === 0 ? (
                  <div className="p-8 rounded-[12px] bg-[#131418] border border-[#22252F] text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#181A20] text-[#71717A] mx-auto flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-white">No pinned rules yet</div>
                    <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                      Run any inquiry in the playground and click &ldquo;Pin Rule&rdquo; on the decision card to save it for free 1-click execution.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedSchemas.map((schema) => (
                      <div
                        key={schema.id}
                        className="p-4 rounded-[12px] bg-[#131418] border border-[#22252F] hover:border-[#8B5CF6]/60 transition-all space-y-3 group"
                      >
                        {editingId === schema.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs bg-[#1C1E26] border border-[#C8FF00] rounded-[6px] text-white outline-none"
                              autoFocus
                            />
                            <button
                              className="px-3 py-1.5 text-xs bg-[#C8FF00] text-black font-semibold rounded-[6px] cursor-pointer"
                              onClick={() => {
                                if (editName.trim()) {
                                  const updated = renamePinnedSchema(schema.id, editName.trim());
                                  setPinnedSchemas(updated);
                                }
                                setEditingId(null);
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-white truncate">
                              {schema.friendly_name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] uppercase">
                              {schema.question_type}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-[#8E909B] line-clamp-2">
                          {schema.options && schema.options.length > 0
                            ? `Options: ${schema.options.join(', ')}`
                            : schema.intent_summary}
                        </p>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#1C1E26]">
                          <button
                            className="px-3 py-1.5 text-xs bg-[#C8FF00] hover:bg-[#B5E600] text-black font-semibold rounded-[6px] cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                            onClick={() => handleTriggerQuickRun(schema)}
                          >
                            <span>Quick Run</span>
                            <span>⚡</span>
                          </button>
                          <button
                            className="px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-white bg-[#181A20] rounded-[6px] border border-[#272A35] cursor-pointer"
                            onClick={() => {
                              setEditingId(schema.id);
                              setEditName(schema.friendly_name);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            className="px-2.5 py-1.5 text-xs text-[#71717A] hover:text-[#FF2E54] bg-[#181A20] rounded-[6px] border border-[#272A35] cursor-pointer ml-auto"
                            onClick={() => {
                              const updated = unpinSchema(schema.id);
                              setPinnedSchemas(updated);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
