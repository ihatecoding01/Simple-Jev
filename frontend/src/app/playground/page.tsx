'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import ConfirmationCard from '../../components/ConfirmationCard';
import DeltaPrompt from '../../components/DeltaPrompt';
import DecisionCard from '../../components/DecisionCard';
import Stepper from '../../components/Stepper';
import ProgressiveTrustBanner from '../../components/ProgressiveTrustBanner';
import {
  IconChatBubble,
  IconFlame,
  IconFolder,
  IconUserProfile,
  IconSpeedometerArc,
  IconShield,
  IconSendDecision,
  IconStudioTerminal,
  IconTemplatesMatrix,
  IconSavedRulesPin,
  IconScannerReticle,
  IconCyberChevronRight,
  IconCyberChevronLeft,
  IconSidebarToggle,
  IconSearchTerminal,
  IconClose,
} from '../../components/CyberIcons';
import { CandidateSchema, ExecutionResult, PinnedSchema, QuotaStatus } from '../../types';
import {
  evaluateIntent,
  revalidateSchema,
  patchSchema,
  executeJev,
  fetchQuota,
  fetchSystemStatus,
} from '../../services/api';
import {
  getPreferences,
  savePreferences,
  getPinnedSchemas,
  pinSchema,
  unpinSchema,
  renamePinnedSchema,
  getRecentInquiries,
  saveRecentInquiry,
  StoredInquiry,
} from '../../services/storage';

interface ChatMessage {
  id: string;
  type: 'user' | 'confirmation' | 'delta' | 'decision' | 'assistant_clarification' | 'fallback' | 'error' | 'validation_warning';
  text?: string;
  timestamp?: string;
  schema?: CandidateSchema;
  state?: Record<string, unknown>;
  plainTranslation?: string;
  result?: ExecutionResult;
  delta?: Record<string, unknown>;
  isCached?: boolean;
}

type RecentInquiry = StoredInquiry;

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
    color: '#3B82F6',
    icon: <IconChatBubble size={24} color="#3B82F6" />,
  },
  {
    id: 'slide-urgency',
    badge: 'FEATURED TEMPLATE • SCORE (1-5)',
    title: 'Production Incident Urgency Scorer',
    description: 'Score system outage impact and customer disruption on a deterministic 1 to 5 scale.',
    query: 'Rate urgency: Primary database cluster has failed and all customer logins are returning errors.',
    color: '#EF4444',
    icon: <IconFlame size={24} color="#EF4444" />,
  },
  {
    id: 'slide-spf',
    badge: 'FEATURED TEMPLATE • NOUL (CLAIM)',
    title: 'Security & Domain Policy Verifier',
    description: 'Verify if sender domain passes strict SPF authentication with mathematical certainty.',
    query: 'Verify: The incoming email SPF record passes verification for paypal.com domain.',
    color: '#10B981',
    icon: <IconShield size={24} color="#10B981" />,
  },
  {
    id: 'slide-lead',
    badge: 'FEATURED TEMPLATE • CHOICE',
    title: 'Sales Opportunity Qualifier',
    description: 'Triage enterprise prospects vs self-serve signups by headcount and deployment scope.',
    query: 'Qualify lead: Fortune 500 enterprise requesting 25,000 seat dedicated cloud deployment.',
    color: '#06B6D4',
    icon: <IconUserProfile size={24} color="#06B6D4" />,
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
    color: '#3B82F6',
    icon: <IconChatBubble size={22} color="#3B82F6" />,
  },
  {
    id: 'incident-scorer',
    type: 'score' as const,
    title: 'Incident Urgency Scorer',
    description: 'Score production downtime impact from 1 (minor) to 5 (critical emergency).',
    query: 'Rate urgency: Primary database cluster has failed and all customer logins are returning errors.',
    color: '#EF4444',
    icon: <IconFlame size={22} color="#EF4444" />,
  },
  {
    id: 'spf-verifier',
    type: 'noul' as const,
    title: 'SPF & Security Verifier',
    description: 'Verify if incoming email domain passes SPF and security policies.',
    query: 'Verify: The incoming email SPF record passes verification for paypal.com domain.',
    color: '#10B981',
    icon: <IconShield size={22} color="#10B981" />,
  },
  {
    id: 'lead-qualifier',
    type: 'choice' as const,
    title: 'Sales Lead Qualifier',
    description: 'Triage incoming leads: Enterprise, Mid-Market, SMB, or Unqualified.',
    query: 'Qualify lead: Fortune 500 enterprise requesting 25,000 seat dedicated deployment.',
    color: '#06B6D4',
    icon: <IconUserProfile size={22} color="#06B6D4" />,
  },
  {
    id: 'feedback-sentiment',
    type: 'score' as const,
    title: 'Review Sentiment Gauge',
    description: 'Quantify customer satisfaction and churn risk on a 1 to 10 scale.',
    query: "Score sentiment: 'Product is fast and sleek, but checkout failed twice and documentation is lacking.'",
    color: '#06B6D4',
    icon: <IconSpeedometerArc size={22} color="#06B6D4" />,
  },
  {
    id: 'gdpr-compliance',
    type: 'noul' as const,
    title: 'GDPR Compliance Check',
    description: 'Verify whether a user deletion request requires immediate Article 17 action.',
    query: 'Verify: User requests complete data deletion under Article 17 of GDPR within 30 days.',
    color: '#F59E0B',
    icon: <IconFolder size={22} color="#F59E0B" />,
  },
];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'restricted' | 'unrestricted'>('restricted');
  const [pinnedSchemas, setPinnedSchemas] = useState<PinnedSchema[]>([]);
  const [quota, setQuota] = useState<QuotaStatus>({ daily_limit: 25, remaining: 25, cached_runs: 0, cold_runs: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [executingTurnId, setExecutingTurnId] = useState<string | null>(null);
  const [isQuickRunning, setIsQuickRunning] = useState(false);
  const [activeQuickRunSchema, setActiveQuickRunSchema] = useState<PinnedSchema | null>(null);
  const [consecutiveUnedited, setConsecutiveUnedited] = useState(0);
  const [showTrustBanner, setShowTrustBanner] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [engineStatus, setEngineStatus] = useState<{ is_simulation: boolean; engine_name: string }>({
    is_simulation: true,
    engine_name: 'Deterministic Simulation Engine (Demo)',
  });

  // Speculative prefetch cache: stores in-flight background promises triggered on hover or mount
  const prefetchCacheRef = useRef<Map<string, { key: string; promise: Promise<ExecutionResult> }>>(new Map());

  const getPrefetchKey = (schema: CandidateSchema, state?: Record<string, unknown>) => {
    return `${schema.type}_${schema.question}_${(schema.options || []).join('|')}_${schema.assertion || ''}_${JSON.stringify(state || {})}`;
  };

  const handlePrefetchDecision = (turnId: string, schema: CandidateSchema, state?: Record<string, unknown>) => {
    const key = getPrefetchKey(schema, state);
    const existing = prefetchCacheRef.current.get(turnId);
    if (existing && existing.key === key) {
      return;
    }

    const promise = executeJev(schema, state || {}).catch((err) => {
      prefetchCacheRef.current.delete(turnId);
      throw err;
    });

    prefetchCacheRef.current.set(turnId, { key, promise });
  };

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

  const hasProcessedInitialQuery = useRef(false);

  const handleSendPrompt = async (text: string, overrideMode?: 'restricted' | 'unrestricted') => {
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
    const updatedHistory = saveRecentInquiry({
      title: shortTitle,
      query: cleanText,
      type: 'choice',
      timestamp: 'Just now',
    });
    setRecentInquiries(updatedHistory);

    if (activeQuickRunSchema) {
      setIsQuickRunning(true);
      try {
        const state = { content_text: cleanText, raw_query: cleanText };
        const result = await executeJev(activeQuickRunSchema.schema_data, state);
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'decision', result, schema: activeQuickRunSchema.schema_data },
        ]);
        const qType = (activeQuickRunSchema.schema_data.type?.toLowerCase() || 'choice') as 'choice' | 'score' | 'noul';
        const verdictStr = String(result.decision);
        const savedRecents = saveRecentInquiry({
          title: activeQuickRunSchema.friendly_name || shortTitle,
          query: cleanText,
          type: qType,
          verdict: verdictStr,
          timestamp: 'Just now',
        });
        setRecentInquiries(savedRecents);
        setActiveQuickRunSchema(null);
        fetchQuota().then(setQuota);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'error', text: `Quick Run failed: ${errorMsg}` },
        ]);
      } finally {
        setIsQuickRunning(false);
      }
      return;
    }

    try {
      const activeMode = overrideMode || mode;
      const response = await evaluateIntent(cleanText, activeMode);
      fetchQuota().then(setQuota);

      if (response.status === 'cache_hit' && response.execution_result && response.schema_data) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'decision', result: response.execution_result, schema: response.schema_data, isCached: true },
        ]);
        const qType = (response.schema_data.type?.toLowerCase() || 'choice') as 'choice' | 'score' | 'noul';
        const res = response.execution_result;
        const verdictStr = String(res.decision);
        const savedRecents = saveRecentInquiry({
          title: response.schema_data.question ? (response.schema_data.question.length > 30 ? `${response.schema_data.question.slice(0, 27)}...` : response.schema_data.question) : shortTitle,
          query: cleanText,
          type: qType,
          verdict: verdictStr,
          timestamp: 'Just now',
        });
        setRecentInquiries(savedRecents);
      } else if (response.status === 'needs_confirmation' && response.schema_data) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'confirmation', schema: response.schema_data, state: response.state, plainTranslation: response.plain_translation, isCached: response.is_cached },
        ]);
        // Item 12: Trigger speculative background prefetch immediately
        handlePrefetchDecision(newTurnId, response.schema_data, response.state);
      } else if (response.status === 'diverged' && response.schema_data) {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'delta', delta: response.divergence_delta, schema: response.schema_data, state: response.state },
        ]);
        handlePrefetchDecision(newTurnId, response.schema_data, response.state);
      } else if (response.status === 'incomplete_state') {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'assistant_clarification', text: response.assistant_message, schema: response.schema_data, state: response.state },
        ]);
      } else if (response.status === 'validation_warning') {
        const warningDiagnostics = response.fitness_report?.diagnostics?.length
          ? response.fitness_report.diagnostics.join('. ')
          : 'Candidate schema triggered quality validation warnings.';
        if (response.schema_data) {
          setMessages((prev) => [
            ...prev,
            {
              id: newTurnId,
              type: 'confirmation',
              schema: response.schema_data,
              state: response.state,
              plainTranslation: `${response.plain_translation || ''}\n\n⚠️ Validation Notice: ${warningDiagnostics}`.trim(),
              isCached: false,
            },
          ]);
          handlePrefetchDecision(newTurnId, response.schema_data, response.state);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: newTurnId,
              type: 'error',
              text: `Validation warning: ${warningDiagnostics}`,
            },
          ]);
        }
      } else if (response.status === 'fallback') {
        setMessages((prev) => [
          ...prev,
          { id: newTurnId, type: 'fallback', text: response.assistant_message },
        ]);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        { id: newTurnId, type: 'error', text: `Something went wrong: ${errorMsg}` },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      const prefs = getPreferences();
      setMode(prefs.mode || 'restricted');
      setConsecutiveUnedited(prefs.unedited_count || 0);
      const pinned = getPinnedSchemas();
      setPinnedSchemas(pinned);
      const savedInquiries = getRecentInquiries();
      setRecentInquiries(savedInquiries);
    });
    fetchQuota().then(setQuota);
    fetchSystemStatus().then((s) => {
      setEngineStatus({
        is_simulation: s.is_simulation,
        engine_name: s.engine_name,
      });
    });

    if (typeof window !== 'undefined' && !hasProcessedInitialQuery.current) {
      hasProcessedInitialQuery.current = true;
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get('q');
      const queryMode = params.get('mode') as 'restricted' | 'unrestricted' | null;
      queueMicrotask(() => {
        if (queryMode) {
          setMode(queryMode);
        }
        if (queryParam) {
          handleSendPrompt(queryParam, queryMode || undefined);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleConfirmDecision = async (turnId: string, schema: CandidateSchema, state?: Record<string, unknown>) => {
    setExecutingTurnId(turnId);
    // eslint-disable-next-line react-hooks/purity
    const clickStart = performance.now();
    try {
      const key = getPrefetchKey(schema, state);
      const cached = prefetchCacheRef.current.get(turnId);
      let result: ExecutionResult;

      if (cached && cached.key === key) {
        // Await the prefetched execution promise
        result = await cached.promise;
        // eslint-disable-next-line react-hooks/purity
        const perceivedMs = Math.round(performance.now() - clickStart);
        if (perceivedMs < result.execution_time_ms) {
          result = { ...result, execution_time_ms: perceivedMs };
        }
      } else {
        result = await executeJev(schema, state || {});
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === turnId ? { ...msg, type: 'decision', result, schema } : msg
        )
      );
      prefetchCacheRef.current.delete(turnId);
      const qType = (schema.type?.toLowerCase() || 'choice') as 'choice' | 'score' | 'noul';
      const verdictStr = String(result.decision);
      const shortTitle = schema.question ? (schema.question.length > 30 ? `${schema.question.slice(0, 27)}...` : schema.question) : 'Inquiry';
      const queryContent = (state?.content_text as string) || (state?.raw_query as string) || shortTitle;
      const savedRecents = saveRecentInquiry({
        title: shortTitle,
        query: queryContent,
        type: qType,
        verdict: verdictStr,
        timestamp: 'Just now',
      });
      setRecentInquiries(savedRecents);
      const newCount = consecutiveUnedited + 1;
      setConsecutiveUnedited(newCount);
      savePreferences({ mode, theme: 'dark', unedited_count: newCount });
      if (mode === 'restricted' && newCount >= 3) setShowTrustBanner(true);
      fetchQuota().then(setQuota);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Execution failed: ${errorMsg}`);
    } finally {
      setExecutingTurnId(null);
    }
  };

  const handleOptionRemove = async (turnId: string, optionIdx: number) => {
    prefetchCacheRef.current.delete(turnId);
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
    prefetchCacheRef.current.delete(turnId);
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
    prefetchCacheRef.current.delete(turnId);
    const turn = messages.find((m) => m.id === turnId);
    if (!turn || !turn.schema) return;
    try {
      const patched = await patchSchema(turn.schema, turn.state || null, patchText);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === turnId ? { ...msg, schema: patched.schema_data, state: patched.state, plainTranslation: patched.plain_translation } : msg
        )
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Patch failed: ${errorMsg}`);
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
    <div className="bg-[#07080A] text-white h-screen max-h-screen overflow-hidden flex flex-col font-sans selection:bg-[#C8FF00] selection:text-black">
      {/* Global Top Navbar */}
      <Header />

      {/* Main Studio Shell: Whirl.chat Inspired Split-Pane App Layout */}
      <div className="flex-1 min-h-0 flex w-full max-w-[1600px] mx-auto overflow-hidden">
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
              <IconSidebarToggle size={18} />
            </button>
          </div>

          {/* Quick Search in sidebar */}
          {!isSidebarCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-[#14161C] border border-[#232630] text-xs text-[#A1A1AA]">
                <IconSearchTerminal size={14} color="#71717A" />
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
              <IconTemplatesMatrix size={16} color={activeTab === 'browse' ? '#C8FF00' : '#71717A'} className="shrink-0" />
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
              <IconStudioTerminal size={16} color={activeTab === 'chat' ? '#8B5CF6' : '#71717A'} className="shrink-0" />
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
              <IconSavedRulesPin size={16} color={activeTab === 'saved' ? '#FF2E54' : '#71717A'} className="shrink-0" />
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
                      {item.verdict ? (
                        <span className="text-[#C8FF00] font-mono truncate max-w-[110px]" title={item.verdict}>
                          {item.verdict}
                        </span>
                      ) : (
                        <span>{item.timestamp}</span>
                      )}
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
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative bg-[#07080A]">
          {/* Main Top Header Controls */}
          <header className="shrink-0 px-6 py-2.5 bg-[#07080A]/95 backdrop-blur-md border-b border-[#1C1E26] flex items-center justify-between gap-4 z-10">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight flex flex-wrap items-center gap-2">
                <span>Playground Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20 font-mono uppercase">
                  No-Code Jev
                </span>
                {/* Loud Engine State Attribution Badge */}
                {engineStatus.is_simulation ? (
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#F59E0B]/15 border border-[#F59E0B]/50 text-[#F59E0B] font-mono text-[10px] font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    title="Running local deterministic simulation engine (JEV_API_KEY not configured)"
                    id="studio-engine-simulation-pill"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                    <span>SIMULATION (DEMO)</span>
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981] font-mono text-[10px] font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    title="Connected to live TypeSafe AI Jev production cluster"
                    id="studio-engine-live-pill"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>LIVE TYPESAFE JEV</span>
                  </span>
                )}
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

          {/* SCROLLABLE VIEWPORT FOR MESSAGES & TEMPLATES */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-3 sm:py-4">
            <div className="max-w-4xl w-full mx-auto space-y-4">
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
            {/* VIEW A: TEMPLATES BROWSER (WHIRL.CHAT STYLE)             */}
            {/* ──────────────────────────────────────────────────────── */}
            {activeTab === 'browse' && (
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                {/* 1. HERO FEATURED BANNER CARD (Compact Whirl.chat Style) */}
                <div className="relative w-full rounded-xl overflow-hidden border border-[#222530] shadow-xl group min-h-[120px] sm:min-h-[135px] flex flex-col justify-end p-4 sm:p-5">
                  {/* Banner Image Background */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/playground-header.jpg"
                    alt="Featured Template Illustration"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080A] via-[#07080A]/75 to-transparent" />

                  {/* Overlaid Banner Content */}
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono tracking-wider text-[#C8FF00] uppercase font-semibold">
                        {activeSlide.badge}
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center w-11 h-11 shrink-0 transition-transform duration-300 group-hover:scale-110">
                          {activeSlide.icon}
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">
                            {activeSlide.title}
                          </h2>
                          <p className="text-xs text-[#D4D4D8] font-sans line-clamp-1">
                            {activeSlide.description}
                          </p>
                        </div>
                      </div>

                      {/* Carousel Pagination Dots */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {HERO_SLIDES.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              currentSlideIndex === idx
                                ? 'w-5 bg-[#C8FF00]'
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
                        className="px-4 py-2 rounded-full bg-white hover:bg-[#F4F4F5] text-black font-semibold text-xs tracking-wide shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <span>Try Template</span>
                        <IconCyberChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. READY-TO-RUN DECISION TEMPLATES (Default 4 with View More Expansion) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                        Decision Templates
                      </h3>
                      <p className="text-xs text-[#71717A]">
                        Select a template to evaluate instantly with deterministic Jev schemas.
                      </p>
                    </div>
                    {messages.length > 0 && (
                      <button
                        onClick={() => setActiveTab('chat')}
                        className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Current Chat ({messages.length})</span>
                        <IconCyberChevronRight size={13} color="#8B5CF6" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(showAllTemplates ? filteredTemplates : filteredTemplates.slice(0, 4)).map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleSendPrompt(template.query)}
                        className="group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[14px] bg-[#0A0B0E] border border-[#1A1C24] hover:border-[#2C303E] hover:bg-[#0F1116] transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl relative overflow-hidden"
                      >
                        {/* Clean floating duotone icon */}
                        <div className="flex items-center justify-center w-10 h-10 shrink-0 self-center transition-transform duration-300 group-hover:scale-110">
                          {template.icon}
                        </div>

                        {/* Text description with clean inline title + badge */}
                        <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#C8FF00] transition-colors truncate font-sans">
                              {template.title}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A1A1AA] border border-white/[0.08] shrink-0 font-medium tracking-wider">
                              {template.type}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-[#8E909B] line-clamp-2 leading-relaxed font-sans">
                            {template.description}
                          </p>
                        </div>

                        {/* Right Chevron Slide Icon - Centered Vertically */}
                        <div className="text-[#52525B] group-hover:text-[#C8FF00] transition-all transform group-hover:translate-x-1 shrink-0 self-center">
                          <IconCyberChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View More / View Fewer Toggle Button */}
                  {filteredTemplates.length > 4 && (
                    <div className="flex justify-center pt-1 pb-0.5">
                      <button
                        onClick={() => setShowAllTemplates(!showAllTemplates)}
                        className="px-4 py-1.5 rounded-[6px] bg-[#0E1015] hover:bg-[#161820] border border-[#202330] hover:border-[#34384A] text-xs font-mono font-medium text-[#D4D4D8] hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                        id="toggle-view-more-templates-btn"
                      >
                        <span>{showAllTemplates ? 'Show Fewer Templates' : `View More Templates (${filteredTemplates.length - 4} more)`}</span>
                        <IconCyberChevronRight
                          size={13}
                          className={`transition-transform duration-200 ${showAllTemplates ? '-rotate-90' : 'rotate-90'}`}
                        />
                      </button>
                    </div>
                  )}
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
                      <IconCyberChevronLeft size={13} color="#A1A1AA" />
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
                    <div className="w-14 h-14 rounded-[12px] bg-[#14161C] border border-[#272A35] text-[#8B5CF6] mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                      <IconStudioTerminal size={28} color="#8B5CF6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white font-sans">Playground Studio Ready</h3>
                    <p className="text-xs text-[#71717A] max-w-sm mx-auto font-sans leading-relaxed">
                      Type your natural language request in the chatbox below or choose a template to execute deterministic System 1 decisions.
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
                          onPrefetch={() => handlePrefetchDecision(msg.id, msg.schema!, msg.state)}
                          isExecuting={executingTurnId === msg.id}
                          isCached={msg.isCached}
                        />
                      )}

                      {msg.type === 'delta' && msg.delta && msg.schema && (
                        <DeltaPrompt
                          delta={msg.delta}
                          schema={msg.schema}
                          onIncludeAndExecute={() => handleConfirmDecision(msg.id, msg.schema!, msg.state)}
                          onRevertToPrevious={() => {
                            const prev = (msg.delta?.previous_schema as CandidateSchema) || msg.schema!;
                            handleConfirmDecision(msg.id, prev, msg.state);
                          }}
                          onPrefetch={() => handlePrefetchDecision(msg.id, msg.schema!, msg.state)}
                          isExecuting={executingTurnId === msg.id}
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

                  {/* Processing Telemetry / HUD */}
                  {executingTurnId || isQuickRunning ? (
                    <div className="flex justify-start py-2 animate-fade-in">
                      <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-[3px] bg-[#121316] border border-[#C8FF00]/40 text-xs shadow-[0_0_18px_rgba(200,255,0,0.18)] font-mono">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#C8FF00] animate-ping" />
                        <span className="text-[#C8FF00] font-bold text-[11px] tracking-wider uppercase">JEV SYSTEM 1</span>
                        <span className="text-white text-xs">Computing deterministic decision in real time (~300ms)...</span>
                      </div>
                    </div>
                  ) : isProcessing ? (
                    <div className="flex justify-start py-2 animate-fade-in">
                      <Stepper
                        stages={[
                          { stage: 'intent', label: 'Extracting intent and candidate schema...' },
                          { stage: 'verifying', label: 'Running 5-point quality validation...' },
                        ]}
                      />
                    </div>
                  ) : null}

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
                      <IconSavedRulesPin size={20} color="#71717A" />
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
            <div ref={chatBottomRef} className="h-4" />
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* PROMINENT GROUNDED BOTTOM CHATBOX                        */}
        {/* ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 w-full bg-[#07080A]/95 backdrop-blur-xl border-t border-[#1C1E26] px-4 py-2 sm:px-8 sm:py-2.5 z-20 shadow-[0_-15px_35px_rgba(0,0,0,0.7)]">
          <div className="max-w-4xl mx-auto space-y-2.5">
            {/* Quick Prompt Pill / Template Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none text-[11px] font-mono">
              <span className="text-[#52525B] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00]" />
                Quick Prompts:
              </span>
              <button
                type="button"
                onClick={() => handleSendPrompt("Categorize customer email: 'I was charged twice on invoice #994. Please issue a refund ASAP.'")}
                className="shrink-0 px-2.5 py-1 rounded-[4px] bg-[#14161C] hover:bg-[#1E212B] border border-[#272A35] hover:border-[#8B5CF6]/50 text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
              >
                Email Refund Router
              </button>
              <button
                type="button"
                onClick={() => handleSendPrompt("Rate urgency: Primary Postgres database cluster has failed and all customer logins are returning 500 errors.")}
                className="shrink-0 px-2.5 py-1 rounded-[4px] bg-[#14161C] hover:bg-[#1E212B] border border-[#272A35] hover:border-[#C8FF00]/50 text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
              >
                Outage Urgency (1-5)
              </button>
              <button
                type="button"
                onClick={() => handleSendPrompt("Verify assertion: The incoming email SPF record passes verification for paypal.com domain.")}
                className="shrink-0 px-2.5 py-1 rounded-[4px] bg-[#14161C] hover:bg-[#1E212B] border border-[#272A35] hover:border-[#10B981]/50 text-[#D4D4D8] hover:text-white transition-colors cursor-pointer"
              >
                SPF Security Verifier
              </button>
            </div>

            {/* The Input Card */}
            <div
              className={`p-2 sm:p-2.5 rounded-[12px] border transition-all duration-300 shadow-xl ${
                inputFocused
                  ? 'bg-[#121317] border-[#C8FF00]/60 shadow-[0_0_35px_rgba(200,255,0,0.16)]'
                  : 'bg-[#121317] border-[#252833] hover:border-[#383C4B]'
              }`}
            >
              <div className="flex items-center gap-3 px-2">
                <div className="text-[#C8FF00] shrink-0 opacity-80 group-hover:opacity-100">
                  <IconScannerReticle size={20} color={inputFocused ? '#C8FF00' : '#8E909B'} />
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
                      : 'Ask in plain English, e.g. "Categorize customer email: I need an invoice refund"'
                  }
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#52525B] font-sans py-2"
                  disabled={isProcessing}
                  id="playground-prompt-input"
                />
                {inputValue && (
                  <button
                    onClick={() => setInputValue('')}
                    className="text-[#71717A] hover:text-white text-xs px-2 py-1 cursor-pointer flex items-center justify-center"
                    title="Clear input"
                  >
                    <IconClose size={13} color="#71717A" />
                  </button>
                )}
                <button
                  className="shrink-0 px-4 sm:px-5 py-2.5 bg-[#FF2E54] hover:bg-[#E01B42] text-white text-xs font-semibold rounded-[8px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(255,46,84,0.35)] hover:shadow-[0_0_28px_rgba(255,46,84,0.6)] active:scale-[0.98] inline-flex items-center gap-2 font-mono"
                  onClick={() => {
                    if (inputValue.trim() && !isProcessing) handleSendPrompt(inputValue.trim());
                  }}
                  disabled={!inputValue.trim() || isProcessing}
                  id="playground-send-btn"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin rounded-[1px]" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <span>Run Decision</span>
                      <IconSendDecision size={14} color="#FFFFFF" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-telemetry */}
            <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#52525B]">
              <div className="flex items-center gap-2">
                <span className="text-[#C8FF00] font-bold">JEV SYSTEM 1 ENGINE</span>
                <span>•</span>
                <span>PRE-FETCHED SPECULATION (~300MS)</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <span>PRESS</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#1C1E26] text-[#A1A1AA] border border-[#2E313D] text-[9px]">ENTER</kbd>
                <span>TO RUN</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}
