# Contributing to Conversational Jev (Simple Jev)

Thank you for your interest in contributing to **Conversational Jev**! We welcome bug reports, feature proposals, documentation improvements, and code contributions.

Please review this guide before submitting an issue or pull request to ensure alignment with our architectural invariants and code quality standards.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior according to the instructions provided there.

---

## Architectural Invariants (Non-Negotiables)

When designing features, writing backend services, or modifying the frontend UI, you **must preserve these six core architectural invariants**:

1. **Zero Raw JSON Exposure**:
   - The end user must never see raw `{state, candidate_schema}` JSON.
   - All schemas must be translated into human-readable sentences using deterministic templates (e.g., *"I'll sort this into one of: Billing, Technical Support, or Account Management. Sound right?"*).
   - Question alternatives must render as interactive visual chips, not JSON code blocks.

2. **The Validator is a Meta-Schema Evaluator**:
   - The Validator does **NOT** answer the user's question.
   - It audits the fitness of the candidate schema across 5 specific dimensions:
     - **Semantic Coverage** (`Choice`: complete / missing_option / unsure)
     - **Mutual Exclusivity** (`Noul`: boolean)
     - **Question Type Fit** (`Choice`: correct_type / should_be_choice / should_be_score / should_be_noul)
     - **Scope Sizing** (`Choice`: well_formed / too_broad / too_narrow)
     - **State Sufficiency** (`Noul`: boolean)
   - Any modifications to `backend/app/services/validator.py` must preserve this contract.

3. **Diff-Based Targeted Patching Over Full Rewrites**:
   - When candidate schemas fail validation, the repair loop applies surgical diffs to flagged fields rather than regenerating from scratch.
   - Always preserve stall cycle detection: if consecutive attempts produce identical error diagnostics, abort early to the conversational fallback.

4. **Zero-Cost Local Chip Re-Validation**:
   - When a user modifies options via interactive chips (`✕` to remove, `+ Add Option` to insert), call `POST /api/v1/schema/revalidate`.
   - **Do NOT invoke the Generator LLM for chip edits.** Local re-validation is fast, deterministic, and preserves user quota.

5. **Safety-First Unrestricted Mode**:
   - Unrestricted Mode does not bypass validation.
   - Exact cache hits ($\ge 0.95$ similarity) execute straight through without pausing.
   - Novel intents (cold misses) and structural mutations **must pause for explicit user confirmation** before caching.

6. **Two-Tier Cost-Aware Metering**:
   - Cold Generator LLM invocations consume 1 credit from daily inquiry limits.
   - Cached runs and pinned schema runs consume **0 credits** (free).

---

## Development Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**
- **Docker & Docker Compose** (optional, for containerized workflows)

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/Conversational-Jev.git
cd Conversational-Jev
git remote add upstream https://github.com/ihatecoding01/Conversational-Jev.git
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the unit test suite
python backend/test_runner.py

# Launch FastAPI development server (runs on http://127.0.0.1:8000)
python backend/run.py
```

### 3. Frontend Setup
```bash
# In a separate terminal
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

### 4. Running with Docker Compose
```bash
docker compose up --build
```
Both services will boot in simulation mode with zero API keys required.

---

## Environment Variables & Simulation Mode

Simple Jev is built with a pluggable simulation layer. When `JEV_API_KEY` or `GEMINI_API_KEY` are not set in `backend/.env`, the system runs high-fidelity simulations deterministically.

Never hardcode credentials or commit `.env` files to git. Use `backend/.env.example` as a template:

```ini
JEV_API_KEY=
JEV_API_URL=https://api.typesafe.ai/v1
LLM_PROVIDER=mock
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
CACHE_SIMILARITY_THRESHOLD=0.85
EXACT_CACHE_THRESHOLD=0.95
MAX_RETRY_ATTEMPTS=3
DAILY_INQUIRY_LIMIT=25
```

---

## Verification Protocols (Required Before Opening a PR)

Before committing or opening a pull request, you **must run and pass both checks**:

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
*Expected Result*: Turbopack compilation succeeds with 0 TypeScript errors and 0 ESLint warnings.

---

## Contribution Workflow

1. **Create an Issue**: Check existing issues first. For major architectural changes or new Jev primitives, open an issue to discuss design before writing code.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
3. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add batch document processing drawer`
   - `fix: correct boundary regex in keyword matcher`
   - `docs: update quickstart instructions in README`
   - `test: add unit test for stall cycle patcher`
4. **Push & Open a Pull Request**:
   - Fill out the PR template completely.
   - Link related issue(s) using GitHub keywords (e.g., `Closes #42`).
   - Confirm that both verification protocols passed.

---

## Community & Questions

- **Issues**: Use [GitHub Issues](https://github.com/ihatecoding01/Conversational-Jev/issues) for bug reports and feature requests.
- **Security**: See [SECURITY.md](SECURITY.md) for responsible disclosure procedures.
