## Summary of Changes
Provide a brief, high-level summary of what this pull request introduces or resolves.

## Related Issues
Closes #[issue-number]

## Architectural Invariants Checklist
Before submitting, please ensure your changes uphold Conversational Jev's core invariants:
- [ ] **Zero Raw JSON**: No raw `{state, candidate_schema}` JSON is exposed to the user in UI or plain-language responses.
- [ ] **Meta-Schema Validator**: The 5-point contract (Coverage, Mutual Exclusivity, Question Type Fit, Scope Sizing, State Sufficiency) in `backend/app/services/validator.py` is fully preserved.
- [ ] **Diff-Based Patching**: Failures trigger surgical diffs rather than full prompt regenerations, preserving stall cycle aborts.
- [ ] **Zero-Cost Chip Re-Validation**: Chip mutations call `/api/v1/schema/revalidate` without invoking the Generator LLM.
- [ ] **Safety-First Unrestricted Mode**: Exact cache hits execute straight through; cold misses and divergent schemas pause for confirmation.
- [ ] **Two-Tier Metering**: Cached runs and pinned runs cost 0 credits.

## Verification Protocols
- [ ] Backend test suite passes:
  ```bash
  python backend/test_runner.py
  # Must show: TOTAL: 12 | PASSED: 12 | FAILED: 0
  ```
- [ ] Frontend builds cleanly:
  ```bash
  cd frontend
  npm run build
  # Must compile with 0 TypeScript/ESLint errors
  ```
- [ ] No API keys, credentials, or secrets committed.

## Types of Changes
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
