# Product Requirements Document (PRD)
## Conversational Jev Interface (Simple Jev)
**A No-Code Conversational Layer for TypeSafe AI's Jev Model**

---

| Document Metadata | Value |
|---|---|
| **Status** | Approved / Finalized via Architectural Grilling |
| **Target Release** | V1.0 MVP |
| **Authors** | Antigravity AI Engineering & Architecture Team |
| **Core Architecture Ref** | [Architecture.md](file:///c:/Users/perci/Documents/projects_2026/simple_jev/Architecture.md) |
| **Primary Framework** | Python FastAPI (Backend) + React/Vite with Vanilla CSS (Frontend) |

---

## 1. Executive Summary & Vision

### 1.1 The Problem
TypeSafe AI's Jev model is a specialized System 1 decision engine. Unlike general-purpose autoregressive LLMs, Jev executes deterministic, typed decision-making across three primitive types:
- **`Choice`**: Categorical classification over discrete option sets.
- **`Score`**: Continuous ordinal/numerical evaluation across criteria.
- **`Noul`**: Boolean verification and assertion checking.

However, Jev requires a structured `state` payload and a typed question schema written in advance. Today, only software engineers writing JSON payloads can interface with Jev. Non-technical users, business operators, and knowledge workers cannot interact with Jev using natural language.

### 1.2 The Solution: Conversational Jev
Conversational Jev removes the developer from the request loop. It provides an intuitive, chat-based interface that translates free-form natural language into valid, validated Jev schemas, executes the decision via Jev, and renders the result back in clear English.

Crucially, **the user never sees raw JSON**. All candidate schemas, confidence scores, and alternatives are translated into plain-language UI constructs (interactive chips, confirmation cards, and expandable breakdown drawers).

---

## 2. Target Personas & Prioritization

Through systematic design-tree alignment, product priorities are ranked as follows:

| Priority | Persona | Description | Core Need in Simple Jev |
|---|---|---|---|
| **Rank 1 (Primary)** | **General-Purpose Decision Maker** | Everyday users seeking quick, unbiased, objective evaluations on ad-hoc questions (e.g., job offer comparison, purchase decisions, message sentiment). | Single conversational chat input, zero technical terminology, zero signup friction, intuitive plain-English confirmation. |
| **Rank 2 (Secondary)** | **Business Operator / Knowledge Worker** | Support leads, triage managers, operations associates handling recurring repetitive decisions (e.g., email categorization, ticket routing, lead qualification). | Pinned schema library ("always route my emails this way"), implicit intent routing, and explicit "Quick Run" testing. |
| **Rank 3 (Future / Roadmap)** | **Citizen Developer / Automation Builder** | Non-coders seeking to design, stress-test, and export Jev decision rules for Zapier, webhooks, or internal tools. | Visual rule builder, exportable schema endpoints, batch processing (slated for V2). |

---

## 3. System Architecture & End-to-End Pipeline

```
                     ┌──────────────────────────────────────────────┐
                     │          User Plain-Language Prompt          │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │             Vector Cache Lookup              │
                     │  (Intent Embedding Match against Known Good) │
                     └──────┬────────────────────────────────┬──────┘
                            │                                │
                 Cache Hit  │                                │ Cache Miss (< 0.85 similarity)
                            │                                ▼
                            │               ┌──────────────────────────────────────────────┐
                            │               │            Generator LLM (Cold Start)        │
                            │               │   Extracts {state, candidate_schema}         │
                            │               └──────────────────────┬───────────────────────┘
                            │                                      │
                            │                                      ▼
                            │               ┌──────────────────────────────────────────────┐
                            │               │         Validator Meta-Schema (Jev Call)     │
                            │               │   Checks coverage, exclusivity, state, etc.  │
                            │               └──────┬───────────────────────────────────────┘
                            │                      │
                            │           ┌──────────┴──────────┐
                            │      Pass │                     │ Fail (Fitness Rejection)
                            │           │                     ▼
                            │           │   ┌──────────────────────────────────────────────┐
                            │           │   │    Targeted Patch Loop (Max 2-3 Retries)     │
                            │           │   │   Passes verbatim report + diff instruction  │
                            │           │   └──────────────────────┬───────────────────────┘
                            │           │                          │ (If retries exhausted)
                            │           │                          ▼
                            │           │   ┌──────────────────────────────────────────────┐
                            │           │   │    Graceful Fallback (General LLM Turn)      │
                            │           │   └──────────────────────────────────────────────┘
                            │           │
                            ▼           ▼
     ┌────────────────────────────────────────────────────────────────────────┐
     │                      Mode Confirmation Intercept                       │
     ├───────────────────────────────────┬────────────────────────────────────┤
     │ Restricted Mode:                  │ Unrestricted Mode (Safety-First):  │
     │ Always pause and render the       │ - Exact Cache Hit: Auto-execute    │
     │ "What I Understood" card for user │ - Novel Query: Pause for approval  │
     │ confirmation or interactive edits │ - Schema Diverged: Delta prompt    │
     └───────────────────────────────────┴────────────────────────────────────┘
                                            │ (Confirmed / Approved)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │             Execution (Jev Call)             │
                     │   Runs validated state + schema against Jev  │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │           Response Rendering Layer           │
                     │  Headline decision card + expandable drawer │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │        Cache Write & History Logging         │
                     │ (Keyed by intent embedding + client storage) │
                     └──────────────────────────────────────────────┘
```

### 3.1 Validator Meta-Schema (Hand-Reviewed Guardrail)
The Validator does not answer the user's question; it evaluates whether the candidate schema generated by the LLM is fit for purpose. It runs via a fixed, hand-crafted Jev call:

| Dimension Evaluated | Question Type | Verification Logic |
|---|---|---|
| **Coverage Check** | Choice: `complete` / `missing_option` / `unsure` | Does the option set cover plausible user intents, or is an obvious alternative missing? |
| **Mutual Exclusivity** | Noul (Boolean) | Are offered options distinct, or do overlapping categories create decision thrashing? |
| **Question Type Fit** | Choice: `correct_type` / `should_be_choice` / `should_be_score` / `should_be_noul` | Does the primitive match the user's intent? |
| **Scope / Sizing** | Choice: `too_narrow` / `too_broad` / `well_formed` | Is the option list over-constrained or bloated? |
| **State Sufficiency** | Noul (Boolean) | Does the extracted `state` contain sufficient factual basis to answer the question? |

### 3.2 Convergence & Patching Rules
To prevent thrashing during retries:
1. **Verbatim Fitness Reports**: Pass the exact field-by-field diagnostic output to the Generator LLM.
2. **Diffs Over Rewrites**: The Generator is instructed to output only a surgical patch (`+ option`, `modify criteria`), preserving unchanged elements.
3. **Distribution Surfacing**: Probability distributions for `Choice` judgments are attached so the Generator knows whether a failure was marginal or decisive.
4. **Stall Detection**: If attempt $N+1$ produces the exact same failure code as attempt $N$, the loop aborts immediately to the fallback rather than wasting quota.

---

## 4. User Experience & Interface Specifications

### 4.1 Layout Overview
A clean, single-page conversational interface optimized for desktop and mobile, avoiding dense enterprise dashboards.
- **Header**: Mode toggle (Restricted / Unrestricted), Daily Request Meter, and Quick Links.
- **Main Chat Canvas**: Message stream including user queries, conversational follow-ups, interactive "What I Understood" confirmation cards, animated progress steppers, and rich decision cards.
- **Sticky Bottom Input Bar**: Natural language textarea, submit button, mode indicator, and future context toggle slot.
- **Collapsible History Sidebar**: Left drawer displaying past confirmed schemas, pinned rules, and recent sessions.

### 4.2 Universal Input & Conversational Clarification
- **V1 Input Mechanism**: Single universal text input box.
- **Incomplete State Handling**: If the Validator fails on `State Sufficiency` (e.g. user asks "Categorize this email" without providing the email body), the system does **not** fail or show an error. Instead, it emits a friendly assistant follow-up directly in the chat:
  > *"I can help you categorize this into Billing, Support, or General Inquiries, but I need the email text first. Could you paste the message below?"*
- Once the user supplies the missing context, the pipeline merges the state and proceeds.
- **Roadmap Slot (V1.5)**: An expandable "Add Context / Data" drawer below the input box for power users pasting long documentation or raw data.

### 4.3 "What I Understood" Confirmation Panel (Restricted Mode)
Neither mode ever exposes raw JSON. The candidate schema is rendered as a deterministic plain-language translation:

#### Deterministic Translation Templates
- **Choice**: `"I'll sort this into one of: {options}. Sound right?"`
- **Score**: `"I'll evaluate this on a scale of {min} to {max} based on {criteria}. Sound right?"`
- **Noul**: `"I'll check whether: {assertion}. Sound right?"`

#### Interactive Confirmation & Direct Editing
The confirmation panel provides direct manipulation to minimize expensive LLM re-prompts:
1. **Interactive Chips**: Options are rendered as pills with an `(x)` to remove and a `[+ Add Option]` inline button. 
   - *Example*: `[ Billing ✕ ]` `[ Technical Support ✕ ]` `[ Account Management ✕ ]` `[ + Add Option ]`
   - *Efficiency*: Adding or removing a chip modifies the schema locally and triggers immediate re-validation, bypassing the Generator LLM entirely!
2. **Structural Modification Input**: An expandable text box labeled `"Need structural changes?"` (e.g., `"Change this to rate urgency from 1 to 5 instead of categorizing"`). Entering text feeds into the Generator's targeted patch loop.
3. **Action Triggers**:
   - `[ Looks Good — Run Decision ]` (Primary CTA)
   - `[ Edit Schema ]` (Opens chip controls + text patch input)

### 4.4 Operational Modes & Divergence Logic

#### Mode Comparison
| Feature | Restricted Mode | Unrestricted Mode (Safety-First) |
|---|---|---|
| **Default For** | All new users and unverified sessions | Experienced users / Opt-in progressive trust |
| **Exact Cache Hit** | Displays confirmation card; requires 1-click confirm | **Runs straight through to Execution** (Zero pause) |
| **Cold Cache Miss (Novel Intent)** | Runs Generator → Validator → Displays confirmation card | Runs Generator → Validator → **Displays confirmation card** (Vets novel rules once before caching) |
| **Diverged Schema** | Displays confirmation card | Displays **Delta Confirmation Prompt** |

#### Schema Divergence & Delta Prompts
When a query matches an existing intent embedding ($\ge 0.85$ cosine similarity) but the validator generates options that differ from the user's previously approved schema:
- The UI highlights the exact difference in an amber delta card:
  > *"Last time you categorized this into Billing, Support, or Account. This time there's a 4th option: **Refunds**. Include it?"*
- User can click `[ Include & Execute ]` or `[ Revert to Previous Rule ]`.

#### Progressive Trust Mechanic
- Every new user begins in **Restricted Mode**.
- The client tracks consecutive unedited confirmations ($N$).
- When $N \ge 3$, the system presents a celebratory milestone banner:
  > *"You've confirmed 3 schemas in a row without edits! Would you like to switch to **Unrestricted Mode** for faster, instant decisions on repeat queries?"*
- User can toggle with 1 click, or switch back at any time in the header.

### 4.5 History Sidebar & Pinned Schemas ("Always Route This Way")
- **Sidebar Display**: Lists all past confirmed schemas grouped into "Pinned Rules" and "Recent Queries".
- **Dual Execution Pathways**:
  1. *Implicit Semantic Matching*: When a user types text in the main chat matching a pinned schema, Unrestricted mode recognizes it and executes immediately.
  2. *Explicit Quick Run*: Users can click any pinned schema in the sidebar to open a dedicated modal or focused chat input: `"Run text against 'Customer Support Router'"` with the schema pre-locked, guaranteeing zero regeneration latency.
- **Management Capabilities**: Users can rename schemas (e.g., from `"Choice: billing/support"` to `"Customer Support Router"`), inspect their options, unpin, or delete them.

### 4.6 Response Presentation & Result Actions
When Jev returns an execution result, it renders deterministically without secondary LLM latency:
1. **Headline Decision Card**:
   - High-contrast visual verdict (e.g., `Category: Technical Support` or `Score: 84/100`).
   - Confidence indicator badge (e.g., `92% confidence · High certainty`).
2. **Action Toolbar**:
   - `[ Copy Result ]`: Copies decision and state to clipboard.
   - `[ Pin Rule to Sidebar ]`: Saves schema with a custom label for instant reuse.
   - `[ Re-run with Different Context ]`: Clears state while keeping schema intact.
3. **Expandable "See Why & Alternatives" Drawer**:
   - Collapsed by default to keep the interface simple for general users.
   - When clicked, opens a clean bar chart showing probability distribution across all evaluated choices (e.g., `Technical Support: 92%`, `Billing: 6%`, `Account Management: 2%`).

### 4.7 Progress Transparency & Graceful Fallback
- **Dynamic Stepper Tracker**: While the pipeline runs, a subtle animated progress stepper appears:
  $$\text{Understanding request} \longrightarrow \text{Structuring options} \longrightarrow \text{Verifying schema}$$
- **Fallback Handling**: If the Generator ↔ Validator loop exhausts retries (or hits a cycle where Jev cannot model the prompt):
  - The pipeline seamlessly falls back to a standard conversational LLM response.
  - A discreet informational badge is affixed: `General Answer (Unstructured)`.
  - A helpful tooltip states: *"This query couldn't be modeled as a strict decision. Try asking with distinct choices or specific rating criteria for deterministic Jev evaluation."*

---

## 5. Rate Limiting, Identity & Session Management

### 5.1 V1 Authentication: Frictionless Guest Experience
To eliminate user friction while safeguarding API costs:
- **No Mandatory Login for V1**: Visitors can immediately begin interacting with the tool without creating an account or entering an email.
- **Identity Keying**: Rate limiting and quota buckets are tracked server-side using a composite hash of IP address and client browser fingerprint.
- **Data Persistence**: Confirmed schemas, custom names, pinned rules, and interaction history are persisted locally in browser `localStorage`.

### 5.2 Cost-Tiered Quotas & UI Request Meter
Because pipeline calls have drastically different cost profiles:
- **Cache Hits**: Extremely low latency, zero LLM cost, near-free $\longrightarrow$ Generous allowance.
- **Jev Calls (Validation/Execution)**: Low cost, deterministic $\longrightarrow$ Moderate allowance.
- **Generator LLM Calls**: Expensive cold starts $\longrightarrow$ Controlled quota.

#### UI Meter Representation
Rather than exposing complex tokens or multi-bucket math, the UI displays a clean, unified daily counter in the header:
- **Display**: `Daily Inquiries: 18 / 25 remaining`
- **User Education Tooltip**: Hovering reveals: *"Repeat runs and cached schemas use 0 credits. New explorations consume 1 credit."*

---

## 6. Technical Stack & Architecture

### 6.1 Backend Architecture (Python FastAPI)
The backend acts as the secure orchestration gateway, isolating API credentials and running embedding similarity calculations.

```
simple_jev_backend/
├── app/
│   ├── main.py                 # FastAPI application entrypoint & CORS
│   ├── core/
│   │   ├── config.py           # Environment variables (Jev API keys, LLM keys)
│   │   └── rate_limiter.py     # IP/fingerprint token bucket rate limiter
│   ├── services/
│   │   ├── generator.py        # LLM prompt orchestration (Candidate schema & state extraction)
│   │   ├── validator.py        # Jev meta-schema evaluation & fitness report parser
│   │   ├── executor.py         # Jev decision execution client
│   │   ├── embedder.py         # Intent embedding generation & cosine similarity matching
│   │   └── patcher.py          # Diff-based schema repair loop
│   ├── schemas/
│   │   ├── jev_types.py        # Pydantic models for Choice, Score, Noul, State
│   │   └── pipeline.py         # Request/response DTOs for API
│   └── cache/
│       └── memory_store.py     # In-memory vector intent index & negative failure patterns
```

#### API Endpoints
1. `POST /api/v1/intent/evaluate`:
   - Accepts: `{ prompt: string, mode: "restricted"|"unrestricted", session_id: string }`
   - Returns: Status stepper event stream (SSE) or schema confirmation payload.
2. `POST /api/v1/schema/patch`:
   - Accepts: `{ original_schema: dict, user_edits: dict, prompt: string }`
   - Returns: Updated validated schema or re-validation result.
3. `POST /api/v1/jev/execute`:
   - Accepts: `{ state: dict, schema: dict }`
   - Returns: `{ decision: str|int|bool, confidence: float, distribution: dict }`
4. `GET /api/v1/usage/quota`:
   - Returns: `{ remaining: int, total: int, reset_time: str }`

### 6.2 Frontend Architecture (React / Vite + Vanilla CSS)
- **Framework**: React 18+ with Vite for instant HMR and minimal bundle footprint.
- **Styling**: Pure **Vanilla CSS** with a design system based on CSS variables, glassmorphism, fluid typography (Inter font), modern dark/light themes, and smooth micro-animations.
- **State Management**: Lightweight Zustand store or React Context handling:
  - Active session messages and stepper state.
  - Mode toggle state (`restricted` vs `unrestricted`).
  - History sidebar, pinned schemas, and localStorage synchronization.
  - Rate limit quota counter.

---

## 7. Data Models & JSON Schemas

### 7.1 Candidate Schema & State
```json
{
  "intent_id": "uuid-v4",
  "intent_text": "Categorize this customer email",
  "state": {
    "sender": "john@example.com",
    "subject": "Invoice dispute #402",
    "body": "I was billed twice for my subscription this month. Please issue a refund."
  },
  "schema": {
    "type": "Choice",
    "question": "What primary department does this customer inquiry belong to?",
    "options": [
      "Billing & Invoicing",
      "Technical Support",
      "Account Management",
      "Feature Requests"
    ]
  }
}
```

### 7.2 Validator Fitness Report
```json
{
  "passed": true,
  "scores": {
    "coverage": { "judgment": "complete", "confidence": 0.94 },
    "exclusivity": { "is_exclusive": true, "confidence": 0.98 },
    "type_fitness": { "judgment": "correct_type", "confidence": 0.99 },
    "scope": { "judgment": "well_formed", "confidence": 0.91 },
    "state_sufficiency": { "is_sufficient": true, "confidence": 0.95 }
  },
  "diagnostics": []
}
```

### 7.3 Client LocalStorage Schema
```json
{
  "simple_jev_user_prefs": {
    "mode": "restricted",
    "consecutive_unedited_confirmations": 3,
    "theme": "dark"
  },
  "pinned_schemas": [
    {
      "id": "schema-101",
      "friendly_name": "Customer Support Router",
      "intent_summary": "Route customer incoming support messages",
      "question_type": "Choice",
      "options": ["Billing & Invoicing", "Technical Support", "Account Management"],
      "created_at": "2026-09-25T19:00:00Z"
    }
  ]
}
```

---

## 8. Rollout Plan & Phased Roadmap

| Phase | Milestone | Deliverables |
|---|---|---|
| **Phase 1 (MVP)** | **Conversational Jev Core** | - Single universal chat interface with Vanilla CSS styling.<br>- Python FastAPI backend with Jev SDK and Generator LLM integration.<br>- Full Generator ↔ Validator meta-schema loop with targeted patching.<br>- "What I Understood" confirmation card with interactive chips.<br>- Restricted & Unrestricted modes with Progressive Trust auto-suggestion.<br>- Sidebar with localStorage persistence and pinned schemas.<br>- Headline decision card with expandable probability breakdown.<br>- Guest IP/fingerprint rate limiting and daily usage meter. |
| **Phase 2** | **Ops Worker & Knowledge Team Upgrades** | - Expandable "Add Context / Data" drawer for long-form documents/spreadsheets.<br>- Batch run mode (paste 10 items against a pinned schema).<br>- Lightweight email magic-link auth for cross-device schema sync.<br>- Export results as CSV / JSON. |
| **Phase 3** | **Citizen Developer Workbench** | - Visual rule builder & multi-step Jev pipeline chaining.<br>- Webhook generation: trigger pinned Jev schemas via external REST API.<br>- Shared workspace team libraries and analytics. |

---

## 9. Key Success Metrics & Observability

To validate product-market fit and ensure economic viability, the following metrics will be instrumented:

1. **Cache Hit Rate ($\ge 65\%$ target post-warmup)**: The core economic lever; high cache hit rate drives marginal query cost close to zero.
2. **First-Pass Validation Rate ($\ge 80\%$)**: Percentage of candidate schemas passed by the Validator on attempt 1.
3. **Retry Convergence Rate ($\ge 90\%$)**: Percentage of failed candidate schemas successfully repaired within $\le 2$ diff retries.
4. **Edit Friction Rate in Restricted Mode ($\le 15\%$)**: Percentage of confirmation cards modified by the user, indicating high alignment with human intent.
5. **Progressive Trust Adoption Rate ($\ge 60\%$)**: Percentage of users who accept the prompt to switch to Unrestricted Mode after 3 successful runs.
6. **Fallback Rate ($\le 3\%$)**: Queries that fail to model as Jev decisions and drop to general conversational LLM.
