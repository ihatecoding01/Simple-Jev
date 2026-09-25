# AGENTS.md — Development Guide for AI Coding Agents

> **Audience**: AI Coding Agents (Antigravity, Claude Code, Cursor, Copilot, Devin, etc.) and human developers contributing to **Conversational Jev (Simple Jev)**.

This repository provides a no-code conversational layer over TypeSafe AI's Jev model. When generating, refactoring, or extending code in this repository, **you MUST follow the architectural invariants, conventions, and testing protocols outlined below.**

---

## 1. Core Architectural Invariants (Non-Negotiables)

1. **Zero Raw JSON Exposure**:
   - The user must **never** see raw `{state, schema}` JSON.
   - All schemas must be translated into human-readable sentences using deterministic templates (e.g., *"I'll sort this into one of: Billing, Support, or Account. Sound right?"*).
   - Question alternatives must be rendered as interactive visual chips, not code blocks.

2. **The Validator is a Meta-Schema Evaluator**:
   - The Validator does **NOT** answer the user's question.
   - It scores the *fitness* of the candidate schema across 5 specific dimensions:
     - Coverage (`Choice`: complete / missing_option / unsure)
     - Mutual exclusivity (`Noul`: boolean)
     - Question type fit (`Choice`: correct_type / should_be_choice / should_be_score / should_be_noul)
     - Scope sizing (`Choice`: well_formed / too_broad / too_narrow)
     - State sufficiency (`Noul`: boolean)
   - Any modifications to `backend/app/services/validator.py` must preserve this 5-point contract.

3. **Diff-Based Targeted Patching Over Rewrites**:
   - When candidate schemas fail validation, the retry loop must apply **surgical diffs** to the flagged fields rather than regenerating from scratch.
   - Always check for stall cycles: if consecutive attempts produce identical error diagnostics, abort early to the conversational fallback.

4. **Zero-Cost Local Chip Re-Validation**:
   - When a user modifies options via interactive chips (`✕` to delete, `+ Add Option` to insert), call `POST /api/v1/schema/revalidate`.
   - **Do NOT invoke the Generator LLM for chip edits.** Local re-validation is fast, deterministic, and preserves user quota.

5. **Safety-First Unrestricted Mode**:
   - Unrestricted Mode does **not** mean "no safety net."
   - Exact cache hits ($\ge 0.95$ similarity) execute straight through without pausing.
   - Completely novel intents (cold misses) and diverged schemas **must pause for user confirmation** before caching.

6. **Two-Tier Cost-Aware Metering**:
   - Cold Generator calls consume 1 credit from the user's daily limit.
   - Cached runs and pinned schema runs consume **0 credits** (free).

---

## 2. Directory Layout & Key Responsibilities

```
Conversational-Jev/
├── backend/
│   ├── app/
│   │   ├── cache/
│   │   │   └── intent_cache.py     # 384-dimensional normalized vector index + failure memory
│   │   ├── models/
│   │   │   ├── api_types.py        # Request & Response DTOs (Pydantic)
│   │   │   └── jev_types.py        # Core primitives (Choice, Score, Noul, FitnessReport)
│   │   ├── services/
│   │   │   ├── embedder.py         # Dense vector intent representation
│   │   │   ├── executor.py         # Jev execution client + deterministic simulation engine
│   │   │   ├── generator.py        # LLM parsing & deterministic plain-language translation
│   │   │   ├── patcher.py          # Surgical schema repair & stall detection
│   │   │   ├── rate_limiter.py     # IP/fingerprint daily inquiry bucket
│   │   │   └── validator.py        # 5-point meta-schema evaluator
│   │   ├── config.py               # Pydantic Settings reading .env
│   │   ├── main.py                 # FastAPI endpoints & CORS
│   │   └── tests/                  # Unit tests (validator, patcher, pipeline)
│   ├── requirements.txt
│   ├── run.py                      # Starts uvicorn on port 8000
│   └── test_runner.py              # Zero-dependency test execution script
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout & SEO meta tags
│   │   │   ├── page.tsx            # Main conversational canvas & state orchestrator
│   │   │   └── globals.css         # Tailwind CSS styling & custom scrollbars
│   │   ├── components/
│   │   │   ├── ConfirmationCard.tsx# "What I Understood" card with interactive chips
│   │   │   ├── DecisionCard.tsx    # Verdict card with probability breakdown
│   │   │   ├── DeltaPrompt.tsx     # Amber divergence alert
│   │   │   ├── Header.tsx          # Mode switcher, usage meter, theme toggle
│   │   │   ├── InputBar.tsx        # Sticky natural language input bar
│   │   │   ├── ProgressiveTrustBanner.tsx # Milestone banner for N >= 3 unedited runs
│   │   │   ├── Sidebar.tsx         # Pinned schemas library & Quick Run trigger
│   │   │   └── Stepper.tsx         # Dynamic animated progress stepper
│   │   ├── services/
│   │   │   ├── api.ts              # Typed backend client
│   │   │   └── storage.ts          # LocalStorage persistence manager
│   │   └── types/
│   │       └── index.ts            # Shared TypeScript interfaces
│   ├── next.config.ts              # API proxy rewrites to http://127.0.0.1:8000
│   ├── package.json
│   └── tsconfig.json
├── Architecture.md                 # Foundational architecture specification
├── PRD.md                          # Comprehensive Product Requirements Document
├── AGENTS.md                       # This guide
└── README.md                       # Public-facing repository documentation
```

---

## 3. Technology Stack Guidelines

### Backend (Python FastAPI)
- **Framework**: FastAPI with Python 3.11+.
- **Data Validation**: Strict Pydantic V2 models (`BaseModel`).
- **Pluggable Architecture**: The backend must run seamlessly in simulation mode when `JEV_API_KEY` or `GEMINI_API_KEY` are not set. Never crash on missing credentials.
- **NLP Matching**: When matching keywords or intent strings, **always use word boundary regex** (`\bword\b`) rather than bare substring matching to avoid false positives (e.g. "rate" matching inside "accurate").

### Frontend (Next.js, TypeScript, Tailwind CSS)
- **Framework**: Next.js 16+ App Router (`src/app/`).
- **Language**: Strict TypeScript (`.tsx` and `.ts`). No `any` where a concrete type can be defined.
- **Styling**: Tailwind CSS v4. Maintain sleek dark mode aesthetics with slate/indigo palettes and glassmorphism.
- **State & Storage**: Ephemeral state in React hooks; persistent data (pinned rules, mode preferences, progressive trust metrics) in browser `localStorage` via `frontend/src/services/storage.ts`.

---

## 4. Verification Protocols for Agents

Before committing or claiming any task complete, **you MUST run and pass both checks**:

### 1. Backend Test Suite
```bash
python backend/test_runner.py
```
*Expected Result*: `TOTAL: 12 | PASSED: 12 | FAILED: 0`.

### 2. Frontend Production Build
```bash
cd frontend
npm run build
```
*Expected Result*: Turbopack compilation succeeds with 0 TypeScript and 0 ESLint errors.

---

## 5. Coding Conventions & Best Practices

- **Never hardcode secrets**: All API keys must come from environment variables via `backend/app/config.py`.
- **Maintain backward compatibility**: Keep seeded templates intact (`Customer Email Router`, `Ticket Urgency Scorer`) so automated tests and demo flows run deterministically out of the box.
- **Do not install heavyweight heavy ML frameworks on startup**: The embedding engine uses a lightweight, offline-reliable normalized vectorizer that operates without downloading multi-gigabyte models on cold boots.
