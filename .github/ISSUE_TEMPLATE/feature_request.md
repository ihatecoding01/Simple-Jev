---
name: Feature Request
about: Suggest an idea or architectural extension for Conversational Jev
title: "[FEATURE] "
labels: ["enhancement"]
assignees: ""
---

### Problem Statement
Is your feature request related to a problem or workflow limitation? Please describe it clearly.
*Example: "I am frustrated when I need to route customer complaints across 10+ sub-departments because the scope validator flags choices exceeding 6 options as too broad."*

### Proposed Solution
A clear and concise description of what you want to happen.

### Architectural Invariant Impact
Conversational Jev maintains strict architectural invariants (see `AGENTS.md` and `CONTRIBUTING.md`). Please confirm how your proposal interacts with them:
- [ ] **Zero Raw JSON**: Does this proposal keep raw schema JSON hidden from the end user?
- [ ] **Meta-Schema Validator**: Does this proposal preserve the 5-point contract (Coverage, Mutual Exclusivity, Type Fit, Scope, State Sufficiency)?
- [ ] **Zero-Cost Chip Re-Validation**: If modifying interactive chips or options, does it avoid unmetered LLM calls?
- [ ] **Safety-First**: Does Unrestricted mode still pause on cold misses and structural divergence?

### Alternative Solutions or Workarounds
Describe any alternative solutions or features you've considered.

### Additional Context
Add any other context, wireframes, mockups, or benchmarks here.
