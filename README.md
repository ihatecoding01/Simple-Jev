# Conversational Jev (Simple Jev)

<p align="center">
  <strong>A No-Code Conversational Layer for TypeSafe AI's Jev Model</strong><br>
  <em>Removing the developer as the schema author while keeping typed determinism and safety intact.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

---

## 📖 Overview

TypeSafe AI's **Jev** is a high-speed, deterministic **System 1 decision engine**. Unlike standard autoregressive LLMs, Jev executes typed decision-making across three primitive structures:
- **`Choice`**: Discrete categorical classification.
- **`Score`**: Continuous ordinal/numerical evaluation across criteria.
- **`Noul`**: Boolean verification and assertion checking.

Traditionally, using Jev requires an engineer to pre-author a JSON question schema and `state` payload in advance. **Simple Jev** removes that developer requirement. It translates free-form user intent into valid Jev schemas, scores the candidate schema against a hand-crafted meta-schema validator, executes the decision on Jev, and renders the result in plain English.

**The user never sees raw JSON.** All schemas are converted into plain-language translations and interactive UI elements.

---

## ✨ Key Features

- **"What I Understood" Confirmation Panel**: Translates candidate schemas into human-friendly sentences (e.g., *"I'll sort this into one of: Billing, Technical Support, or Account Management. Sound right?"*).
- **Interactive Visual Chips**: Add or remove options directly using chips (`✕` to remove, `+ Add Option` to insert). Modifying chips re-validates instantly without an LLM call, saving latency and cost.
- **Dual Verification Modes**:
  - **🔒 Restricted Mode**: Waits for user confirmation on every pass before executing (ideal for new users and high-stakes tasks).
  - **⚡ Unrestricted Mode (Safety-First)**: Automatically executes previously approved cache hits without pausing. Only interrupts when a query is completely novel or diverges from past choices.
- **Progressive Trust**: Tracks consecutive unedited confirmations ($N \ge 3$) and auto-suggests upgrading to Unrestricted Mode.
- **Schema Divergence Delta Alerts**: If an approved rule changes (e.g. an extra option is generated), an amber prompt highlights the delta: *"Last time: billing/support/account. This time adds refunds. Include it?"*
- **Pinned Schemas & Quick Run**: Save rules to the sidebar (e.g. *"Customer Support Router"*). Click **Quick Run** to execute text directly against a fixed schema at zero credit cost.
- **Decision Breakdown Drawer**: Inspect the certainty percentage and probability distribution bar chart without secondary LLM overhead.
- **Graceful Fallback**: If an intent cannot be structured into a strict decision, the system softly falls back to a standard conversational response with actionable rephrasing tips.

---

## 🏛️ System Architecture

```
User (Plain Language)
      │
      ▼
┌─────────────────┐
│  Intent Cache   │ ──(Exact Cache Hit)──► [Unrestricted Auto-Execute] ──► Final Decision
└────────┬────────┘
         │ (Cache Miss)
         ▼
┌─────────────────┐
│  Generator LLM  │ ──► Extracts {state, candidate_schema}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validator (Jev) │ ──► Scores fitness across 5 meta-schema checks
└────────┬────────┘
         ├── (Pass) ──► Confirmation Card ──► Execution (Jev) ──► Result Card
         │
         └── (Fail) ──► Targeted Diff Patch Loop (Max 2-3 retries with stall detection)
```

### Meta-Schema Verification Matrix
| Dimension | Type | Purpose |
|---|---|---|
| **Coverage** | Choice (`complete` / `missing_option` / `unsure`) | Ensures the option set covers plausible user intents. |
| **Mutual Exclusivity** | Noul (Boolean) | Detects overlapping or duplicate categories. |
| **Question Type Fit** | Choice (`correct_type` / `should_be_choice` / `should_be_score` / `should_be_noul`) | Ensures the primitive matches user intent. |
| **Scope / Sizing** | Choice (`well_formed` / `too_broad` / `too_narrow`) | Catches bloated or over-constrained option sets. |
| **State Sufficiency** | Noul (Boolean) | Verifies the extracted context contains enough facts to answer the question. |

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── cache/
│   │   │   └── intent_cache.py     # 384-dim normalized vector index + failure history
│   │   ├── models/
│   │   │   ├── api_types.py        # Request & Response DTOs
│   │   │   └── jev_types.py        # Pydantic schemas (Choice, Score, Noul, FitnessReport)
│   │   ├── services/
│   │   │   ├── embedder.py         # Intent vector embedding engine
│   │   │   ├── executor.py         # Jev execution & deterministic simulation
│   │   │   ├── generator.py        # LLM parsing & plain translation templates
│   │   │   ├── patcher.py          # Surgical diff repair & stall detection
│   │   │   ├── rate_limiter.py     # IP/fingerprint daily inquiry bucket
│   │   │   └── validator.py        # Meta-schema rule evaluator
│   │   ├── config.py               # Environment settings
│   │   ├── main.py                 # FastAPI application routes & CORS
│   │   └── tests/                  # Unit test suite
│   ├── requirements.txt            # Python dependencies
│   ├── run.py                      # Server launcher
│   └── test_runner.py              # Zero-dependency test runner
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout & SEO metadata
│   │   │   ├── page.tsx            # Main conversational UI canvas
│   │   │   └── globals.css         # Tailwind CSS styling
│   │   ├── components/
│   │   │   ├── ConfirmationCard.tsx# "What I Understood" card with interactive chips
│   │   │   ├── DecisionCard.tsx    # Verdict card with probability breakdown
│   │   │   ├── DeltaPrompt.tsx     # Schema divergence amber alert
│   │   │   ├── Header.tsx          # Mode switcher, usage meter, theme toggle
│   │   │   ├── InputBar.tsx        # Sticky natural language input bar
│   │   │   ├── ProgressiveTrustBanner.tsx # Milestone banner
│   │   │   ├── Sidebar.tsx         # Pinned rules library & Quick Run trigger
│   │   │   └── Stepper.tsx         # Animated progress stepper
│   │   ├── services/
│   │   │   ├── api.ts              # Typed backend client
│   │   │   └── storage.ts          # LocalStorage persistence manager
│   │   └── types/
│   │       └── index.ts            # Shared TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts              # API proxy rewrites to FastAPI backend
├── Architecture.md                 # Detailed architecture specification
├── PRD.md                          # Comprehensive Product Requirements Document
├── AGENTS.md                       # AI Coding Agent reference & development guide
└── README.md                       # This document
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/ihatecoding01/Conversational-Jev.git
cd Conversational-Jev

# Install Python dependencies
pip install -r backend/requirements.txt

# Run backend unit test suite
python backend/test_runner.py

# Start the FastAPI backend server (defaults to port 8000)
python backend/run.py
```

### 3. Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install Node dependencies
npm install

# Build to verify TypeScript and Tailwind compilation
npm run build

# Start the Next.js development server (defaults to port 3000)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## ⚙️ Configuration & Environment

Create a `.env` file in `backend/` (refer to `backend/.env.example`):

```ini
# When API keys are blank, the backend operates in high-fidelity simulation mode.
JEV_API_KEY=
JEV_API_URL=https://api.typesafe.ai/v1
LLM_PROVIDER=mock
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=

# Thresholds
CACHE_SIMILARITY_THRESHOLD=0.85
EXACT_CACHE_THRESHOLD=0.95
MAX_RETRY_ATTEMPTS=3
DAILY_INQUIRY_LIMIT=25
```

> **Note**: If API keys are omitted, Simple Jev runs in **simulation mode** out-of-the-box. You can immediately interact with the interface, test chip modifications, trigger divergence prompts, and inspect probability distributions without needing external credentials.

---

## 🧪 Testing

### Backend Test Suite
Run the 12-test validation suite:
```bash
python backend/test_runner.py
```
Tests cover:
- Meta-schema validation across well-formed, incomplete, and overlapping schemas.
- Diff patch repair and stall cycle aborts.
- Cache hit auto-execution in Unrestricted mode.
- Instant chip re-validation without LLM calls.
- Decision execution and probability distribution normalization.

### Frontend Quality Checks
```bash
cd frontend
npm run lint
npm run build
```

---

## 🗺️ Roadmap
- [x] Phase 1 MVP: Full conversational bridge, interactive chips, dual verification modes, pinned rules, probability distribution drawers.
- [ ] Phase 2: Expandable "Add Context / Attachment" drawer, batch document processing, CSV export.
- [ ] Phase 3: Citizen developer workbench, visual rule chaining, external webhook generation.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
