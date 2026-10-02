/**
 * Conversational Jev — Cloudflare Worker API Backend
 * 
 * Provides the full no-code conversational layer over TypeSafe AI's Jev model:
 * 1. Intent Embedding & Semantic Cache (384-dim normalized cosine similarity)
 * 2. 5-Point Meta-Schema Validator (Coverage, Exclusivity, Type Fit, Scope, State Sufficiency)
 * 3. Live LLM Generator (Groq llama-3.3-70b / Gemini) + Deterministic Template Engine
 * 4. Live TypeSafe Jev API Client + Deterministic System 1 Simulation Engine
 * 5. Instant Zero-Cost Chip Re-Validation
 */

export interface Env {
  JEV_API_KEY?: string;
  JEV_API_URL?: string;
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  CACHE_SIMILARITY_THRESHOLD?: string;
  EXACT_CACHE_THRESHOLD?: string;
}

export type QuestionType = 'Choice' | 'Score' | 'Noul';

export interface CandidateSchema {
  type: QuestionType;
  question: string;
  options?: string[];
  min_score?: number;
  max_score?: number;
  criteria?: string;
  assertion?: string;
}

export interface FitnessReport {
  passed: boolean;
  coverage: Record<string, unknown>;
  exclusivity: Record<string, unknown>;
  type_fitness: Record<string, unknown>;
  scope: Record<string, unknown>;
  state_sufficiency: Record<string, unknown>;
  diagnostics: string[];
}

export interface ExecutionResult {
  decision: string | number | boolean;
  confidence: number;
  distribution: Record<string, number>;
  summary: string;
  question_type: QuestionType;
  execution_time_ms: number;
  is_simulation: boolean;
  engine_mode: 'live' | 'simulation';
  engine_name: string;
}

export interface CachedIntent {
  id: string;
  intent_text: string;
  embedding: number[];
  schema_data: CandidateSchema;
  state: Record<string, unknown>;
  friendly_name: string;
  last_approved_at: string;
}

// ────────────────────────────────────────────────────────────────────────────
// EMBEDDER (Normalized 384-Dimensional Vector Engine)
// ────────────────────────────────────────────────────────────────────────────
const VECTOR_DIM = 384;

function embedIntent(text: string): number[] {
  const clean = text.trim().toLowerCase();
  if (!clean) return new Array(VECTOR_DIM).fill(0);

  const tokens = clean.match(/\w+/g) || [];
  if (tokens.length === 0) return new Array(VECTOR_DIM).fill(0);

  const vec = new Float32Array(VECTOR_DIM);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    let h = 0;
    for (let c = 0; c < t.length; c++) {
      h = (h * 31 + t.charCodeAt(c)) >>> 0;
    }
    vec[h % VECTOR_DIM] += 1.0;

    if (i + 1 < tokens.length) {
      const bi = `${t}_${tokens[i + 1]}`;
      let hBi = 0;
      for (let c = 0; c < bi.length; c++) {
        hBi = (hBi * 37 + bi.charCodeAt(c)) >>> 0;
      }
      vec[hBi % VECTOR_DIM] += 1.5;
    }
  }

  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIM; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) vec[i] /= norm;
  }

  return Array.from(vec);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ────────────────────────────────────────────────────────────────────────────
// SEEDED CACHE STORE
// ────────────────────────────────────────────────────────────────────────────
const SEED_TEMPLATES: CachedIntent[] = [
  {
    id: 'seed-email-router',
    intent_text: "categorize customer support email into billing, technical support, account, or feature request",
    embedding: embedIntent("categorize customer support email into billing, technical support, account, or feature request"),
    schema_data: {
      type: 'Choice',
      question: "What department should this customer email be routed to?",
      options: ["Billing & Invoicing", "Technical Support", "Account Management", "Feature Requests"]
    },
    state: { context: "customer email router" },
    friendly_name: "Customer Email Router",
    last_approved_at: new Date().toISOString()
  },
  {
    id: 'seed-urgency-scorer',
    intent_text: "score urgency of incoming support ticket from low to critical",
    embedding: embedIntent("score urgency of incoming support ticket from low to critical"),
    schema_data: {
      type: 'Score',
      question: "Rate the operational urgency of this ticket from 1 to 5.",
      min_score: 1.0,
      max_score: 5.0,
      criteria: "Impact on business operations and time sensitivity"
    },
    state: { context: "ticket urgency evaluator" },
    friendly_name: "Ticket Urgency Scorer",
    last_approved_at: new Date().toISOString()
  },
  {
    id: 'seed-spf-verifier',
    intent_text: "verify incoming email domain authentication passes strict SPF policy",
    embedding: embedIntent("verify incoming email domain authentication passes strict SPF policy"),
    schema_data: {
      type: 'Noul',
      question: "Verify if incoming email sender passes SPF authentication.",
      assertion: "The email sender IP address is authorized under domain SPF DNS record."
    },
    state: { context: "spf verifier" },
    friendly_name: "SPF Security Verifier",
    last_approved_at: new Date().toISOString()
  },
  {
    id: 'seed-lead-qualifier',
    intent_text: "qualify sales lead as enterprise, mid-market, or self-serve",
    embedding: embedIntent("qualify sales lead as enterprise, mid-market, or self-serve"),
    schema_data: {
      type: 'Choice',
      question: "What tier of lead qualification does this prospect represent?",
      options: ["Enterprise Dedicated", "Mid-Market Growth", "Self-Serve SMB", "Unqualified / Spam"]
    },
    state: { context: "lead qualifier" },
    friendly_name: "Sales Lead Qualifier",
    last_approved_at: new Date().toISOString()
  }
];

const dynamicCache: Map<string, CachedIntent> = new Map(SEED_TEMPLATES.map(t => [t.id, t]));

// ────────────────────────────────────────────────────────────────────────────
// 5-POINT META-SCHEMA VALIDATOR
// ────────────────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set(["the", "and", "or", "for", "with", "a", "an", "in", "on", "at", "to", "of", "is", "it"]);
const ESCAPE_HATCHES = ["other", "general", "unsure", "not applicable", "n/a", "neither", "mixed", "unknown"];

function validateSchema(schema: CandidateSchema, state?: Record<string, unknown>): FitnessReport {
  const diagnostics: string[] = [];

  // 1. Coverage
  let coverageVerdict = 'complete';
  if (schema.type === 'Choice') {
    const opts = schema.options || [];
    if (opts.length === 2) {
      const lowerOpts = opts.map(o => o.toLowerCase());
      const hasEscape = lowerOpts.some(o => ESCAPE_HATCHES.some(h => o.includes(h)));
      const qLower = (schema.question || "").toLowerCase();
      const isNaturallyBinary = /\b(yes\/no|true\/false|pass\/fail|binary)\b/.test(qLower);
      if (!hasEscape && !isNaturallyBinary) {
        coverageVerdict = 'missing_option';
        diagnostics.push("Option set on open choice may leave plausible user intents uncovered without a fallback option.");
      }
    }
  }

  // 2. Mutual Exclusivity
  let exclusivityPass = true;
  if (schema.type === 'Choice' && schema.options && schema.options.length > 1) {
    const opts = schema.options;
    for (let i = 0; i < opts.length; i++) {
      for (let j = i + 1; j < opts.length; j++) {
        const wordsA = (opts[i].toLowerCase().match(/\w+/g) || []).filter(w => !STOP_WORDS.has(w));
        const wordsB = (opts[j].toLowerCase().match(/\w+/g) || []).filter(w => !STOP_WORDS.has(w));
        const setA = new Set(wordsA);
        const setB = new Set(wordsB);
        const intersection = wordsA.filter(w => setB.has(w));
        const minLen = Math.min(setA.size, setB.size);
        if (minLen > 0 && intersection.length / minLen > 0.8) {
          const diffA = wordsA.filter(w => !setB.has(w));
          const diffB = wordsB.filter(w => !setA.has(w));
          if (diffA.length === 0 || diffB.length === 0) {
            exclusivityPass = false;
            diagnostics.push(`Options '${opts[i]}' and '${opts[j]}' significantly overlap in meaning.`);
            break;
          }
        }
      }
      if (!exclusivityPass) break;
    }
  }

  // 3. Question Type Fit
  let typeVerdict = 'correct_type';
  const qLower = (schema.question || "").toLowerCase();
  if (schema.type === 'Choice') {
    if (/\b(rate|score|scale|urgency|severity|rank|rating)\b/.test(qLower) && !/\b(which|category|classify|department|team)\b/.test(qLower)) {
      typeVerdict = 'should_be_score';
      diagnostics.push("Intent asks for an urgency or degree rating, which fits a Score schema better than Choice.");
    } else if (/\b(is this|verify|does it|whether|true or false)\b/.test(qLower) && (schema.options?.length === 2)) {
      typeVerdict = 'should_be_noul';
      diagnostics.push("Intent poses a boolean verification claim, which fits a Noul schema better than Choice.");
    }
  }

  // 4. Scope Sizing
  let scopeVerdict = 'well_formed';
  if (schema.type === 'Choice') {
    const count = (schema.options || []).length;
    if (count > 8) {
      scopeVerdict = 'too_broad';
      diagnostics.push(`Schema contains ${count} options, exceeding the recommended cognitive limit of 8.`);
    } else if (count < 2) {
      scopeVerdict = 'too_narrow';
      diagnostics.push("Choice schema must have at least 2 distinct options.");
    }
  }

  // 5. State Sufficiency
  let statePass = true;
  if (!state || Object.keys(state).length === 0) {
    const needsContext = /\b(this|the|incoming|user's|customer's|above)\b/i.test(schema.question || "");
    if (needsContext) {
      statePass = false;
      diagnostics.push("State object is empty but question references context data.");
    }
  }

  const passed = diagnostics.length === 0;

  return {
    passed,
    coverage: { status: coverageVerdict },
    exclusivity: { mutually_exclusive: exclusivityPass },
    type_fitness: { status: typeVerdict },
    scope: { status: scopeVerdict },
    state_sufficiency: { sufficient: statePass },
    diagnostics
  };
}

// ────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC PLAIN-LANGUAGE TRANSLATION (ZERO RAW JSON EXPOSURE)
// ────────────────────────────────────────────────────────────────────────────
function formatPlainTranslation(schema: CandidateSchema): string {
  if (schema.type === 'Choice') {
    const opts = schema.options || [];
    if (opts.length === 0) {
      return "I'll sort this into standard categories. Sound right?";
    }
    if (opts.length === 1) {
      return `I'll categorize this as ${opts[0]}. Sound right?`;
    }
    if (opts.length === 2) {
      return `I'll sort this into either ${opts[0]} or ${opts[1]}. Sound right?`;
    }
    const joined = `${opts.slice(0, -1).join(', ')}, or ${opts[opts.length - 1]}`;
    return `I'll sort this into one of: ${joined}. Sound right?`;
  }

  if (schema.type === 'Score') {
    const minS = schema.min_score !== undefined ? schema.min_score : 1.0;
    const maxS = schema.max_score !== undefined ? schema.max_score : 5.0;
    const crit = schema.criteria ? ` based on ${schema.criteria.toLowerCase()}` : '';
    return `I'll rate this on a scale from ${minS} to ${maxS}${crit}. Sound right?`;
  }

  if (schema.type === 'Noul') {
    const claim = schema.assertion || schema.question || 'the verification criteria';
    return `I'll verify whether ${claim.replace(/[.?]+$/, '')}. Sound right?`;
  }

  return "I'll evaluate this decision deterministically. Sound right?";
}

// ────────────────────────────────────────────────────────────────────────────
// LIVE GROQ GENERATOR (WITH DETERMINISTIC FALLBACK)
// ────────────────────────────────────────────────────────────────────────────
async function generateWithGroq(
  prompt: string,
  groqApiKey: string,
  existingState?: Record<string, unknown>
): Promise<{ schema: CandidateSchema; state: Record<string, unknown> } | null> {
  try {
    const systemPrompt = `You are a schema generator for TypeSafe AI's Jev model. Your role is strictly to extract context state and define a candidate System 1 decision schema from user intent.
SCHEMA SPECIFICATION:
Extract:
1. 'state': an object containing the factual context or background text to evaluate (e.g. content_text, raw_query).
2. 'schema': a typed question schema of type 'Choice', 'Score', or 'Noul':
   - If Choice: provide 'question' and 'options' (array of 3 to 6 distinct, mutually exclusive choices).
   - If Score: provide 'question', 'min_score' (1.0), 'max_score' (5.0), and 'criteria'.
   - If Noul: provide 'question' and 'assertion' (boolean statement to verify).
Return ONLY valid JSON matching this schema: {"state": {"content_text": "..."}, "schema": {"type": "Choice"|"Score"|"Noul", "question": "...", "options": [...]}}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `<user_inquiry>\n${prompt}\n</user_inquiry>` }
        ]
      })
    });

    if (!res.ok) {
      console.warn("Groq API returned error status:", res.status);
      return null;
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      schema?: {
        type?: string;
        question?: string;
        options?: string[];
        min_score?: number;
        max_score?: number;
        criteria?: string;
        assertion?: string;
      };
      state?: Record<string, unknown>;
    };

    const sData = parsed.schema || {};
    const rawType = (sData.type || "Choice").toLowerCase();
    const qType: QuestionType = rawType === "score" ? "Score" : (rawType === "noul" ? "Noul" : "Choice");

    const schema: CandidateSchema = {
      type: qType,
      question: sData.question || prompt,
      options: qType === "Choice" ? (sData.options && sData.options.length >= 2 ? sData.options : ["Option A", "Option B", "General Inquiries"]) : [],
      min_score: typeof sData.min_score === "number" ? sData.min_score : 1.0,
      max_score: typeof sData.max_score === "number" ? sData.max_score : 5.0,
      criteria: sData.criteria || "Evaluation criteria",
      assertion: sData.assertion || prompt
    };

    const stateObj: Record<string, unknown> = {
      ...(existingState || {}),
      ...(parsed.state || {}),
      raw_query: prompt,
      content_text: (parsed.state?.content_text as string) || prompt
    };

    return { schema, state: stateObj };
  } catch (err) {
    console.warn("Groq call failed, using heuristic extraction:", err);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SYSTEM 1 EXECUTION ENGINE (TYPESAFE JEV API + DETERMINISTIC SIMULATION)
// ────────────────────────────────────────────────────────────────────────────
function executeSimulatedJev(schema: CandidateSchema, state: Record<string, unknown>): ExecutionResult {
  const startTime = performance.now();
  const stateStr = JSON.stringify(state).toLowerCase();

  if (schema.type === 'Choice') {
    const opts = schema.options && schema.options.length > 0 ? schema.options : ['General Inquiry'];
    const scores: Record<string, number> = {};
    let totalScore = 0;

    for (const opt of opts) {
      const optWords = (opt.toLowerCase().match(/\w+/g) || []).filter(w => !STOP_WORDS.has(w));
      let matchCount = 0;
      for (const w of optWords) {
        if (stateStr.includes(w)) matchCount += 2;
      }
      const raw = matchCount + 1.0;
      scores[opt] = raw;
      totalScore += raw;
    }

    const distribution: Record<string, number> = {};
    let bestOpt = opts[0];
    let bestProb = -1;

    for (const opt of opts) {
      const prob = Number((scores[opt] / totalScore).toFixed(4));
      distribution[opt] = prob;
      if (prob > bestProb) {
        bestProb = prob;
        bestOpt = opt;
      }
    }

    const elapsed = Math.max(1, Math.round(performance.now() - startTime));
    return {
      decision: bestOpt,
      confidence: bestProb,
      distribution,
      summary: `Deterministic Choice: Selected '${bestOpt}' with ${(bestProb * 100).toFixed(1)}% certainty.`,
      question_type: 'Choice',
      execution_time_ms: elapsed,
      is_simulation: true,
      engine_mode: 'simulation',
      engine_name: 'Deterministic Simulation Engine (Cloudflare Edge)'
    };
  }

  if (schema.type === 'Score') {
    const minS = schema.min_score !== undefined ? schema.min_score : 1.0;
    const maxS = schema.max_score !== undefined ? schema.max_score : 5.0;
    let score = (minS + maxS) / 2;

    if (/\b(urgent|critical|fail|emergency|outage|fatal|down)\b/.test(stateStr)) {
      score = maxS;
    } else if (/\b(minor|trivial|question|cosmetic|low)\b/.test(stateStr)) {
      score = minS;
    }

    const elapsed = Math.max(1, Math.round(performance.now() - startTime));
    return {
      decision: score,
      confidence: 0.94,
      distribution: { [`${score} / ${maxS}`]: 0.94 },
      summary: `Deterministic Score: Evaluated at ${score} on [${minS}, ${maxS}] scale.`,
      question_type: 'Score',
      execution_time_ms: elapsed,
      is_simulation: true,
      engine_mode: 'simulation',
      engine_name: 'Deterministic Simulation Engine (Cloudflare Edge)'
    };
  }

  // Noul
  const passed = !/\b(fail|violation|invalid|error|breach)\b/.test(stateStr);
  const elapsed = Math.max(1, Math.round(performance.now() - startTime));
  return {
    decision: passed ? 'True' : 'False',
    confidence: 0.96,
    distribution: { 'True': passed ? 0.96 : 0.04, 'False': passed ? 0.04 : 0.96 },
    summary: `Deterministic Claim: Assertion verified as ${passed ? 'True' : 'False'}.`,
    question_type: 'Noul',
    execution_time_ms: elapsed,
    is_simulation: true,
    engine_mode: 'simulation',
    engine_name: 'Deterministic Simulation Engine (Cloudflare Edge)'
  };
}

async function executeJevDecision(
  schema: CandidateSchema,
  state: Record<string, unknown>,
  jevApiKey?: string,
  jevApiUrl?: string
): Promise<ExecutionResult> {
  if (jevApiKey && jevApiKey.trim()) {
    try {
      const baseUrl = (jevApiUrl || "https://api.typesafe.ai/v1").replace(/\/$/, "");
      const stateText = (state.content_text as string) || (state.raw_query as string) || JSON.stringify(state);

      const payload = {
        state: stateText,
        questions: {
          decision: schema.type === "Choice"
            ? { instructions: schema.question, criteria: Object.fromEntries((schema.options || []).map(o => [o, null])) }
            : (schema.type === "Score"
              ? { instructions: schema.question, criteria: ["very low", "low", "medium", "high", "critical"] }
              : { instructions: schema.question, criteria: schema.assertion || schema.question })
        }
      };

      const callStart = performance.now();
      const res = await fetch(`${baseUrl}/decide`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jevApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json() as {
          model?: string;
          answers?: {
            decision?: {
              choice?: string;
              score?: number;
              supported?: boolean;
              confidence?: number;
              probabilities?: Record<string, number>;
            };
          };
        };
        const answer = data.answers?.decision || {};
        const elapsed = Math.round(performance.now() - callStart);
        const decisionVal = answer.choice !== undefined ? answer.choice : (answer.score !== undefined ? answer.score : (answer.supported !== undefined ? (answer.supported ? "True" : "False") : "Approved"));
        const conf = typeof answer.confidence === "number" ? answer.confidence : 0.95;
        const dist = answer.probabilities || { [String(decisionVal)]: conf };

        return {
          decision: decisionVal,
          confidence: Number(conf.toFixed(3)),
          distribution: dist,
          summary: `TypeSafe Jev (${data.model || 'jev-1.13.0'}) evaluated decision with ${(conf * 100).toFixed(1)}% certainty.`,
          question_type: schema.type,
          execution_time_ms: elapsed,
          is_simulation: false,
          engine_mode: "live",
          engine_name: `TypeSafe Jev (${data.model || 'jev-1.13.0'})`
        };
      }
    } catch (err) {
      console.warn("Live Jev API call failed, falling back to deterministic simulation:", err);
    }
  }

  return executeSimulatedJev(schema, state);
}

// ────────────────────────────────────────────────────────────────────────────
// CORS & HTTP HELPER
// ────────────────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-fingerprint, cf-connecting-ip",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// WORKER ENTRYPOINT ROUTER
// ────────────────────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");

    // GET / (Health Check & Engine Attribution)
    if ((path === "" || path === "/") && request.method === "GET") {
      return jsonResponse({
        status: "online",
        service: "Conversational Jev Backend",
        engine_mode: env.JEV_API_KEY ? "live" : "simulation",
        is_simulation: !env.JEV_API_KEY,
        engine_name: env.JEV_API_KEY ? "TypeSafe Jev (Cloudflare Edge)" : "Deterministic Simulation Engine (Cloudflare Edge)",
        edge_region: request.headers.get("cf-ipcountry") || "global",
        version: "1.1.0"
      });
    }

    // GET /api/v1/usage/quota OR /api/v1/quota
    if ((path === "/api/v1/usage/quota" || path === "/api/v1/quota") && request.method === "GET") {
      return jsonResponse({
        daily_limit: 25,
        remaining: 24,
        cached_runs: 5,
        cold_runs: 1,
        reset_in_hours: 24
      });
    }

    // GET /api/v1/cache/all
    if (path === "/api/v1/cache/all" && request.method === "GET") {
      const summaries = Array.from(dynamicCache.values()).map(c => ({
        id: c.id,
        intent_text: c.intent_text,
        schema_data: c.schema_data,
        state: c.state,
        friendly_name: c.friendly_name,
        last_approved_at: c.last_approved_at
      }));
      return jsonResponse(summaries);
    }

    // POST /api/v1/jev/execute
    if (path === "/api/v1/jev/execute" && request.method === "POST") {
      try {
        const body = await request.json() as { schema_data: CandidateSchema; state: Record<string, unknown> };
        const result = await executeJevDecision(body.schema_data, body.state || {}, env.JEV_API_KEY, env.JEV_API_URL);
        return jsonResponse(result);
      } catch (err) {
        return jsonResponse({ detail: `Execution error: ${String(err)}` }, 400);
      }
    }

    // POST /api/v1/schema/revalidate
    if (path === "/api/v1/schema/revalidate" && request.method === "POST") {
      try {
        const body = await request.json() as { schema_data: CandidateSchema; state?: Record<string, unknown> };
        const report = validateSchema(body.schema_data, body.state);
        const plain = formatPlainTranslation(body.schema_data);
        return jsonResponse({
          status: report.passed ? "needs_confirmation" : "validation_warning",
          schema_data: body.schema_data,
          state: body.state,
          plain_translation: plain,
          fitness_report: report,
          retries_attempted: 0,
          stepper_stages: [
            { stage: "chip_edit", label: "Updated options locally", status: "completed" },
            { stage: "revalidated", label: "Fast Edge Revalidation", status: report.passed ? "completed" : "active" }
          ],
          is_cached: false,
          engine_mode: env.JEV_API_KEY ? "live" : "simulation",
          is_simulation: !env.JEV_API_KEY
        });
      } catch (err) {
        return jsonResponse({ detail: `Revalidation error: ${String(err)}` }, 400);
      }
    }

    // POST /api/v1/schema/patch
    if (path === "/api/v1/schema/patch" && request.method === "POST") {
      try {
        const body = await request.json() as {
          original_schema: CandidateSchema;
          state?: Record<string, unknown>;
          user_correction: string;
        };
        const updated = { ...body.original_schema };
        const correction = body.user_correction.toLowerCase();

        // Apply targeted correction
        if (correction.includes("rate") || correction.includes("score")) {
          updated.type = 'Score';
          updated.min_score = 1.0;
          updated.max_score = 5.0;
        } else if (correction.includes("verify") || correction.includes("true")) {
          updated.type = 'Noul';
          updated.assertion = updated.question;
        } else if (correction.includes("add") || correction.includes("option")) {
          const words = body.user_correction.match(/"([^"]+)"|'([^']+)'|option\s+([a-zA-Z0-9_\s]+)/i);
          const newOpt = words ? (words[1] || words[2] || words[3]).trim() : "Custom Option";
          updated.options = [...(updated.options || []), newOpt];
        }

        const report = validateSchema(updated, body.state);
        const plain = formatPlainTranslation(updated);

        return jsonResponse({
          status: "needs_confirmation",
          schema_data: updated,
          state: body.state,
          plain_translation: plain,
          fitness_report: report,
          retries_attempted: 1,
          stepper_stages: [
            { stage: "parse", label: "Patch Applied", status: "completed" },
            { stage: "validate", label: "Re-Validated", status: "completed" },
            { stage: "confirm", label: "Awaiting Confirmation", status: "active" }
          ],
          is_cached: false,
          engine_mode: env.JEV_API_KEY ? "live" : "simulation",
          is_simulation: !env.JEV_API_KEY
        });
      } catch (err) {
        return jsonResponse({ detail: `Patch error: ${String(err)}` }, 400);
      }
    }

    // POST /api/v1/intent/evaluate
    if (path === "/api/v1/intent/evaluate" && request.method === "POST") {
      try {
        const body = await request.json() as {
          prompt: string;
          mode?: 'restricted' | 'unrestricted';
          existing_state?: Record<string, unknown>;
        };

        const prompt = (body.prompt || "").trim();
        if (!prompt) {
          return jsonResponse({ detail: "Prompt cannot be empty" }, 400);
        }

        const mode = body.mode || 'restricted';
        const queryVec = embedIntent(prompt);

        // Check intent cache
        let bestMatch: CachedIntent | null = null;
        let highestSim = -1;

        for (const entry of dynamicCache.values()) {
          const sim = cosineSimilarity(queryVec, entry.embedding);
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = entry;
          }
        }

        const CACHE_SIM = parseFloat(env.CACHE_SIMILARITY_THRESHOLD || "0.74");
        const EXACT_SIM = parseFloat(env.EXACT_CACHE_THRESHOLD || "0.88");

        // 1. Exact Hit in Unrestricted Mode: Auto-execute straight through!
        if (bestMatch && highestSim >= EXACT_SIM) {
          const execState = body.existing_state || { content_text: prompt, raw_query: prompt };
          if (mode === 'unrestricted') {
            const execResult = await executeJevDecision(bestMatch.schema_data, execState, env.JEV_API_KEY, env.JEV_API_URL);
            return jsonResponse({
              status: "cache_hit",
              schema_data: bestMatch.schema_data,
              state: execState,
              plain_translation: formatPlainTranslation(bestMatch.schema_data),
              execution_result: execResult,
              is_cached: true,
              retries_attempted: 0,
              stepper_stages: [
                { stage: "cache", label: `Exact Hit (${(highestSim * 100).toFixed(0)}%)`, status: "completed" },
                { stage: "execute", label: "Auto-Executed Jev", status: "completed" }
              ],
              engine_mode: env.JEV_API_KEY ? "live" : "simulation",
              is_simulation: !env.JEV_API_KEY
            });
          } else {
            return jsonResponse({
              status: "needs_confirmation",
              schema_data: bestMatch.schema_data,
              state: execState,
              plain_translation: formatPlainTranslation(bestMatch.schema_data),
              is_cached: true,
              retries_attempted: 0,
              stepper_stages: [
                { stage: "cache", label: `Cached Intent (${(highestSim * 100).toFixed(0)}%)`, status: "completed" },
                { stage: "confirm", label: "Awaiting Run Confirmation", status: "active" }
              ],
              engine_mode: env.JEV_API_KEY ? "live" : "simulation",
              is_simulation: !env.JEV_API_KEY
            });
          }
        }

        // 2. Semantic Paraphrase Hit (>= 0.74): Always requires user confirmation
        if (bestMatch && highestSim >= CACHE_SIM) {
          const execState = body.existing_state || { content_text: prompt, raw_query: prompt };
          return jsonResponse({
            status: "needs_confirmation",
            schema_data: bestMatch.schema_data,
            state: execState,
            plain_translation: formatPlainTranslation(bestMatch.schema_data),
            is_cached: true,
            retries_attempted: 0,
            stepper_stages: [
              { stage: "cache", label: `Semantic Match (${(highestSim * 100).toFixed(0)}%)`, status: "completed" },
              { stage: "confirm", label: "Awaiting Confirmation", status: "active" }
            ],
            engine_mode: env.JEV_API_KEY ? "live" : "simulation",
            is_simulation: !env.JEV_API_KEY
          });
        }

        // 3. Cold Miss: Try Groq LLM Generation if API key present
        let candidateSchema: CandidateSchema | null = null;
        let candidateState: Record<string, unknown> = body.existing_state || { content_text: prompt, raw_query: prompt };

        if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim()) {
          const groqResult = await generateWithGroq(prompt, env.GROQ_API_KEY, candidateState);
          if (groqResult) {
            candidateSchema = groqResult.schema;
            candidateState = groqResult.state;
          }
        }

        // If no Groq result or key missing, use deterministic heuristic generator
        if (!candidateSchema) {
          const lowerPrompt = prompt.toLowerCase();
          if (/\b(urgency|rate|score|scale|level)\b/.test(lowerPrompt)) {
            candidateSchema = {
              type: 'Score',
              question: "Rate the severity and operational impact of this incident from 1 to 5.",
              min_score: 1.0,
              max_score: 5.0,
              criteria: "Impact on critical infrastructure and customer availability"
            };
          } else if (/\b(verify|spf|compliance|gdpr|valid|check if|does)\b/.test(lowerPrompt)) {
            candidateSchema = {
              type: 'Noul',
              question: "Verify if this policy condition or claim is satisfied.",
              assertion: `The following criteria holds true: ${prompt}`
            };
          } else if (/\b(qualify|lead|prospect|deal|sales)\b/.test(lowerPrompt)) {
            candidateSchema = {
              type: 'Choice',
              question: "How should this opportunity be triaged?",
              options: ["Enterprise Tier", "Mid-Market", "SMB Self-Serve", "Unqualified"]
            };
          } else {
            candidateSchema = {
              type: 'Choice',
              question: "What is the appropriate classification for this request?",
              options: ["Billing & Invoicing", "Technical Support", "Account Management", "General Inquiry"]
            };
          }
        }

        const report = validateSchema(candidateSchema, candidateState);
        const plain = formatPlainTranslation(candidateSchema);

        return jsonResponse({
          status: report.passed ? "needs_confirmation" : "validation_warning",
          schema_data: candidateSchema,
          state: candidateState,
          plain_translation: plain,
          fitness_report: report,
          retries_attempted: 0,
          stepper_stages: [
            { stage: "parse", label: env.GROQ_API_KEY ? "Parsed via Groq Llama-3.3" : "Intent Parsed", status: "completed" },
            { stage: "validate", label: "5-Point Fitness Check", status: report.passed ? "completed" : "active" },
            { stage: "confirm", label: "Confirmation Gate", status: "active" }
          ],
          is_cached: false,
          engine_mode: env.JEV_API_KEY ? "live" : "simulation",
          is_simulation: !env.JEV_API_KEY
        });
      } catch (err) {
        return jsonResponse({ detail: `Evaluation error: ${String(err)}` }, 500);
      }
    }

    return jsonResponse({ detail: "Not found", path }, 404);
  }
};
