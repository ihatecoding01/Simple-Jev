# Changelog

All notable changes to **Conversational Jev (Simple Jev)** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Expandable context and file attachment drawer for multimodal inquiries.
- Batch document processing endpoint with CSV and JSON Lines export.
- Visual rule chaining canvas for multi-hop decision pipelines.

---

## [1.0.0] - 2026-10-02

### Added
- **Hook-First Public Interface**: Overhauled documentation, live production landing page, and studio playground hosted on Cloudflare Pages (`https://simplejev.pages.dev`).
- **Natural Language Intent Parsing**: Generator LLM integration that extracts candidate schemas across `Choice`, `Score`, and `Noul` primitives.
- **5-Point Meta-Schema Validator**: Evaluates coverage, mutual exclusivity, type fit, scope sizing, and state sufficiency before any execution.
- **Targeted Diff Patcher**: Surgical repair loop for failing candidate schemas with stall-cycle detection.
- **Interactive Visual Chips**: Zero-cost local re-validation endpoint (`POST /api/v1/schema/revalidate`) that avoids invoking LLMs for option edits (`✕` to remove, `+ Add Option` to insert).
- **Dual Verification Modes**:
  - **Restricted Mode**: User confirms every candidate schema before execution.
  - **Unrestricted Mode**: Auto-executes exact semantic cache hits ($\ge 0.95$ similarity) in sub-100ms; pauses on cold misses or structural divergence.
- **Semantic Intent Cache**: 384-dimensional dense vector embeddings using `sentence-transformers` (`all-MiniLM-L6-v2`) with normalized cosine similarity and failure memory.
- **Security & Prompt Injection Barrier**: Input pre-sanitization, structural Pydantic model confinement, and cache isolation.
- **Progressive Trust Milestone**: Automatic suggestion to enable Unrestricted Mode after $N \ge 3$ consecutive unedited confirmations.
- **Decision Certainty Drawer**: Detailed probability distribution charts and latency tracking for each decision.
- **Pinned Schemas & Quick Run**: Sidebar rule bookmarking with zero-credit direct text execution.
- **Docker Compose Scaffolding**: Multi-stage `backend/Dockerfile`, `frontend/Dockerfile`, and `docker-compose.yml` for one-command containerized deployment.
- **Deterministic Simulation Engine**: High-fidelity offline simulation fallback when external API keys are omitted.
- **Backend Test Suite**: 12 automated unit and integration tests passing with 100% coverage across core services.
