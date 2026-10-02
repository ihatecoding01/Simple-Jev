import { CachedIntentSummary, CandidateSchema, EvaluateResponse, ExecutionResult, QuotaStatus } from '../types';

const BACKEND_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev'))
    ? 'https://simple-jev-backend.forhack10892.workers.dev'
    : '';
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api/v1` : '/api/v1';

export async function evaluateIntent(
  prompt: string,
  mode: 'restricted' | 'unrestricted' = 'restricted',
  existingState: Record<string, unknown> | null = null,
  clientFingerprint = ''
): Promise<EvaluateResponse> {
  const res = await fetch(`${API_BASE}/intent/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      mode,
      session_id: 'browser_session',
      client_fingerprint: clientFingerprint,
      existing_state: existingState,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${res.status})`);
  }
  return res.json();
}

export async function revalidateSchema(
  schemaData: CandidateSchema,
  state: Record<string, unknown> | null = null
): Promise<EvaluateResponse> {
  const res = await fetch(`${API_BASE}/schema/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema_data: schemaData,
      state: state,
    }),
  });
  if (!res.ok) {
    throw new Error('Revalidation failed');
  }
  return res.json();
}

export async function patchSchema(
  originalSchema: CandidateSchema,
  state: Record<string, unknown> | null,
  userCorrection: string,
  originalPrompt = ''
): Promise<EvaluateResponse> {
  const res = await fetch(`${API_BASE}/schema/patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      original_schema: originalSchema,
      state: state,
      user_correction: userCorrection,
      original_prompt: originalPrompt,
    }),
  });
  if (!res.ok) {
    throw new Error('Patching failed');
  }
  return res.json();
}

export async function executeJev(
  schemaData: CandidateSchema,
  state: Record<string, unknown>
): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE}/jev/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema_data: schemaData,
      state: state,
      session_id: 'browser_session',
    }),
  });
  if (!res.ok) {
    throw new Error('Execution failed');
  }
  return res.json();
}

export async function fetchQuota(fingerprint = ''): Promise<QuotaStatus> {
  try {
    const res = await fetch(`${API_BASE}/usage/quota?fingerprint=${encodeURIComponent(fingerprint)}`);
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Quota fetch failed, using fallback:', e);
  }
  return { daily_limit: 25, remaining: 25, cached_runs: 0, cold_runs: 0 };
}

export async function fetchCachedTemplates(): Promise<CachedIntentSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/cache/all`);
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('Cache fetch failed:', e);
  }
  return [];
}

export interface SystemEngineStatus {
  status: string;
  is_simulation: boolean;
  engine_mode: 'live' | 'simulation';
  engine_name: string;
  embedding_model: string;
}

export async function fetchSystemStatus(): Promise<SystemEngineStatus> {
  try {
    const rootUrl = BACKEND_URL ? `${BACKEND_URL}/` : '/';
    const res = await fetch(rootUrl);
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('System status fetch failed:', e);
  }
  return {
    status: 'online',
    is_simulation: true,
    engine_mode: 'simulation',
    engine_name: 'Deterministic Simulation Engine (Demo)',
    embedding_model: 'all-MiniLM-L6-v2 (384-d)',
  };
}
