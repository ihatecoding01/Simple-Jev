# Security Policy

Conversational Jev (Simple Jev) bridges free-form natural language intent with deterministic System 1 decision-making models. Because user text flows into an LLM generation pipeline that constructs executable schemas, security and determinism are architectural priorities.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability within Conversational Jev, please **do not open a public issue**. 

Instead, report it via responsible disclosure:
1. Send an email to the project maintainers or open a [GitHub Private Vulnerability Report](https://github.com/ihatecoding01/Conversational-Jev/security/advisories/new).
2. Include a description of the issue, steps to reproduce, and any proof-of-concept payload or curl command.
3. We will acknowledge receipt within 48 hours and provide an estimated resolution timeline.

---

## Security Architecture & Threat Model

### 1. Prompt Injection Defense (Generator Boundary)
Free-form user input is parsed by a Generator LLM to produce candidate schemas. Without controls, adversarial inputs could attempt to hijack the LLM prompt. Conversational Jev implements defense-in-depth:

- **Pre-Sanitization Barrier**: `backend/app/services/security.py` scans inbound text for prompt-injection signatures, delimiters (e.g., `<system>`, `[INST]`, markdown backtick escapes), and role-reversal patterns.
- **Strict Output Confinement**: The Generator LLM produces structured JSON schemas according to rigid Pydantic models (`CandidateSchema`). Free-form text generation outside of the schema definition is discarded.
- **Untrusted Author Isolation**: The Generator LLM is explicitly treated as an untrusted author. Its output is never executed directly.

### 2. Meta-Schema Validator as an Enforced Security Boundary
Even if a prompt-injection payload manipulates the Generator LLM into proposing an unusual schema, the **5-Point Meta-Schema Validator** audits the candidate schema prior to any execution:
- **Mutual Exclusivity**: Verifies options do not overlap or conflict.
- **Scope & Sizing**: Disallows arbitrary option proliferation or unbounded categories.
- **State Sufficiency**: Confirms that state parameters contain sufficient factual grounding before execution can proceed.
- **Type Safety**: Strictly validates against Jev's primitive definitions (`Choice`, `Score`, `Noul`).

### 3. Intent Cache & Data Isolation
The intent cache utilizes a 384-dimensional dense vector index (`all-MiniLM-L6-v2`) to provide sub-millisecond execution for approved intents:
- **No Cross-Tenant Data Leaks**: Cache entries index normalized semantic intent and approved decision templates. Raw sensitive user data, PII, and credentials are removed prior to vector indexing.
- **Failure Memory**: The cache tracks rejected or stalled schemas to prevent recurring degenerate loops.
- **Divergence Guard**: Any semantic mutation or novelty automatically forces a pause for explicit user confirmation in Restricted Mode.

### 4. Deterministic System 1 Execution Isolation
The Jev decision engine is deterministic and non-autoregressive. Unlike generative models that can hallucinate or leak context during generation, Jev evaluates typed question schemas against closed `state` dictionaries. It cannot run arbitrary code, spawn external network calls, or read local file systems.

### 5. Secrets and API Key Hygiene
- All API keys (`JEV_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`) are read strictly from server-side environment variables via `backend/app/config.py`.
- No credentials or API keys are bundled into frontend assets or transmitted over client-side WebSocket/HTTP payloads.
- In development and demonstration environments, the system defaults to deterministic simulation mode when keys are omitted.
