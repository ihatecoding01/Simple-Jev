# Conversational Jev Interface — Architecture

**A no-code layer between end users and Jev (TypeSafe AI's System One model), removing the developer as the schema author.**

---

## 1. Problem statement

Jev requires `state` + a typed question schema (Choice / Score / Noul) written by a developer who knows the answer space in advance. This makes Jev powerful for pre-built app logic but inaccessible to anyone who isn't writing code — there's no path from "a person typing a sentence" to "a valid Jev request" without a developer in between.

This system removes that developer layer at request time, while keeping a *one-time* human-authored component (the validator's own schema — see §4) as the safety backstop.

---

## 2. Pipeline overview

```
User (plain language)
      │
      ▼
┌─────────────────┐
│  1. Generator    │  LLM turns free text → candidate {state, schema}
│     (LLM call)   │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  2. Cache check  │  Embed intent, match against known-good schema library
└─────────────────┘
      │ (cache miss)
      ▼
┌─────────────────┐
│  3. Validator    │  Jev call, fixed hand-authored meta-schema, scores the
│     (Jev call)   │  candidate schema's fitness (not the user's answer)
└─────────────────┘
      │
   ┌──┴───┐
  pass   fail → structured rejection → back to Generator (max 2–3 retries)
   │
   ▼
┌─────────────────┐
│  4. Execution    │  Real Jev call using the validated {state, schema}
│     (Jev call)   │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  5. Response     │  Typed answer → plain-language rendering back to user
│     layer        │
└─────────────────┘
      │
      ▼
  Cache write (schema + validator report, keyed by intent embedding)
```

Fallback: if retries are exhausted, drop to a plain conversational LLM response and flag the turn as "did not fit Jev's structured shape" — this is a legitimate outcome, not a crash.

---

## 3. Component details

### 3.1 Generator (LLM call)
- Input: user's raw message + (on retry) the validator's rejection report
- Output: candidate `state` object + one or more typed questions (Choice/Score/Noul)
- On first attempt, this is a cold generation. On retry, it's a **targeted patch**, not a re-roll — see §5.

### 3.2 Cache layer
- Every *validator-approved* schema is stored keyed by an embedding of the user's intent (not the literal text — paraphrases should hit the same entry).
- Also store **known-bad patterns**: rejected schemas + the reason they failed, so the Generator doesn't regenerate the same mistake for similar phrasing later.
- Cache hit → skip straight to Execution (§3.4), bypassing both LLM and validator calls. This is what keeps the cost/latency profile viable — the Generator+Validator pair should be the exception path, not the common path, once the cache has warmed up.

### 3.3 Validator (Jev call)
This is the one piece worth treating as a serious, hand-reviewed artifact rather than something auto-generated, since everything downstream trusts it silently. See §4 for its schema design.

### 3.4 Execution (Jev call)
- The actual decision call, using the validated `state` + schema.
- Returns typed answer + probability/confidence.

### 3.5 Response layer
- Converts the typed answer back into a plain-language response for the end user.
- This can be templated per question type rather than another LLM call, to keep the "happy path" (cache hit → execute → respond) entirely free of generative LLM cost.

---

## 4. Validator schema design (the meta-schema)

The validator doesn't answer the user's question — it scores the **candidate schema's fitness**. Structured as multiple questions per validation pass, not a single pass/fail bit, so failures are diagnosable:

| Question | Type | Purpose |
|---|---|---|
| Does the option set cover plausible user intents, or is there a likely intent with no matching option? | Choice: `complete` / `missing_option` / `unsure` | Coverage check |
| Are the offered options mutually exclusive? | Noul | Catches overlapping categories |
| Does the question *type* (Choice/Score/Noul) match what's actually being asked? | Choice: `correct_type` / `should_be_choice` / `should_be_score` / `should_be_noul` | Catches type mismatches |
| Is the option set too narrow, too broad, or well-formed? | Choice: `too_narrow` / `too_broad` / `well_formed` | Catches padding or over-constraint |
| Does the `state` object contain enough information to answer the question at all? | Noul | Catches incomplete state, separate from schema issues |

Each validator call returns a **fitness report**, not just yes/no — this report is what makes retries targeted (§5) and what gets stored alongside rejected schemas in the cache (§3.2).

---

## 5. Solving the retry-feedback problem

This is the part that determines whether the Generator ↔ Validator loop *converges* (gets better each retry) or *thrashes* (re-rolls blindly and might not improve). A few concrete mechanisms, meant to be combined rather than picked one-or-the-other:

**a) Pass the fitness report verbatim, not a summary of it.**
The Generator's retry prompt should include the validator's structured output field-by-field ("type mismatch: should_be_score, not choice"; "missing_option: user may want to decline entirely, no option covers that"), not a collapsed "this failed, try again." Specific flags let the LLM make a targeted edit instead of regenerating from scratch.

**b) Ask for a diff, not a rewrite.**
Prompt the Generator to patch only the flagged fields of the previous candidate schema ("keep everything else identical, add one option covering X, change question type from Choice to Score") rather than producing a full new schema. This shrinks the space of things that can go newly wrong on retry — a fresh generation can introduce a *new* problem while fixing the old one; a patch mostly can't.

**c) Attach the Choice validator's actual probability distribution, not just its top answer.**
If the validator's `missing_option` judgment comes back with a Choice distribution like `{complete: 0.3, missing_option: 0.6, unsure: 0.1}`, surface that spread to the Generator rather than collapsing it to the winning label. A narrow win (0.6 vs 0.3) versus a landslide (0.95 vs 0.02) should change how aggressively the Generator edits the schema — near-ties may mean the schema is closer to right than a bare "failed" implies.

**d) Give the Generator a small library of before/after examples for common failure types.**
Since the validator's failure categories are a fixed, known set (from §4's table), you can pre-build 2–3 worked examples per category ("here's a schema that was `too_narrow`, here's the corrected version") and inject the relevant one into the retry prompt based on which flag fired. This is cheap to build once and dramatically more reliable than hoping the LLM infers the right kind of fix from an abstract description.

**e) Track retry deltas, not just retry counts, for your cap logic.**
Rather than a flat "3 retries then fall back," compare the fitness report between attempt N and N+1. If the flagged dimensions genuinely changed (schema is closing in on passing), allow the full retry budget. If attempt 2 reproduces the *same* flag as attempt 1, stop immediately and fall back — that pattern means the Generator is stuck, not converging, and burning another retry won't help.

**f) Route different failure types to different repair strategies.**
Not all failures need the same fix:
  - `missing_option` → append, don't regenerate (cheapest, safest patch)
  - `should_be_X_type` → structural rewrite of the question, state usually stays untouched
  - `too_broad` / `too_narrow` → needs actual judgment call, this is the case most likely to need a full regeneration rather than a patch

Branching on failure type keeps the "cheap fix" cases cheap and reserves full regeneration for the cases that actually need it.

---

## 6. Open risks worth tracking

- **Meta-schema blind spots.** The validator can only catch what its own schema asks about. Any failure mode not represented in §4's question set will sail through undetected — this table should be revisited as real failures are observed in production, not treated as finished on day one.
- **Cache staleness.** A cached schema was validated against the state of the world (and the Generator's behavior) at write time. Consider a lightweight re-validation trigger (e.g., periodic spot-checks, or invalidation when the Generator model version changes).
- **Cost floor.** Even with caching, cold-start traffic (new user intents, no cache hit) pays the full Generator + Validator cost. Worth instrumenting cache hit rate early as the core health metric for the whole system's unit economics.