from typing import Any, Dict, List, Optional
import re
from app.models.jev_types import CandidateSchema, FitnessReport, QuestionType
from app.config import settings

class ValidatorService:
    """
    Implements the Meta-Schema from Section 4 of Architecture.md.
    Scores the candidate schema's fitness (coverage, exclusivity, type fit, scope, state sufficiency)
    instead of answering the user's question directly.
    """

    def validate(self, schema_data: CandidateSchema, state: Optional[Dict[str, Any]] = None) -> FitnessReport:
        diagnostics: List[str] = []
        state = state or {}

        # 1. State sufficiency check (Noul)
        # Catches incomplete state separate from schema issues
        has_state = False
        if state:
            # Check if there is non-empty text content or factual context
            for val in state.values():
                if val and str(val).strip() and str(val).strip() != "None":
                    has_state = True
                    break

        # If state is completely empty or trivial
        state_is_sufficient = has_state
        state_conf = 0.95 if has_state else 0.90
        missing_fields = []
        if not state_is_sufficient:
            missing_fields = ["content_text", "factual_context"]
            diagnostics.append("state_insufficient: The state object contains insufficient factual context to answer the question.")

        # 2. Question type fit check (Choice)
        # Check whether the question demands a choice, a score/rating, or a boolean/noul check
        q_lower = schema_data.question.lower()
        type_judgment = "correct_type"
        type_conf = 0.96

        if schema_data.type == QuestionType.CHOICE:
            if any(re.search(r'\b' + re.escape(w) + r'\b', q_lower) for w in ["rate", "score", "scale of", "how urgent", "how likely", "how severe"]):
                type_judgment = "should_be_score"
                diagnostics.append("should_be_score: The question is rating or scoring on a scale, but Choice was generated.")
            elif any(re.search(r'\b' + re.escape(w) + r'\b', q_lower) for w in ["is it true", "verify whether", "does it contain", "yes or no"]):
                type_judgment = "should_be_noul"
                diagnostics.append("should_be_noul: The question is a binary assertion, but Choice was generated.")
        elif schema_data.type == QuestionType.SCORE:
            if any(re.search(r'\b' + re.escape(w) + r'\b', q_lower) for w in ["which category", "classify into", "choose one", "sort this"]):
                type_judgment = "should_be_choice"
                diagnostics.append("should_be_choice: The question is selecting from categories, but Score was generated.")

        # 3. Scope / sizing check (Choice)
        scope_judgment = "well_formed"
        scope_conf = 0.92
        if schema_data.type == QuestionType.CHOICE:
            opts = schema_data.options or []
            if len(opts) < 2:
                scope_judgment = "too_narrow"
                diagnostics.append("too_narrow: A Choice schema must have at least 2 distinct options.")
            elif len(opts) > 8:
                scope_judgment = "too_broad"
                diagnostics.append("too_broad: Option set has more than 8 categories, causing potential cognitive bloat.")
            else:
                for opt in opts:
                    if len(str(opt)) > 120 or re.search(r'(?i)<\s*(?:script|iframe|object)[^>]*>', str(opt)):
                        scope_judgment = "too_broad"
                        diagnostics.append(f"oversized_or_unsafe_payload: Option '{str(opt)[:25]}...' exceeds safe bounds or contains unsafe markup.")
                        break

        # 4. Mutual exclusivity check (Noul)
        # Check for overlapping options
        is_exclusive = True
        excl_conf = 0.94
        if schema_data.type == QuestionType.CHOICE:
            opts = [o.strip().lower() for o in (schema_data.options or [])]
            # Check for duplicates or near-duplicates
            if len(opts) != len(set(opts)):
                is_exclusive = False
                diagnostics.append("not_exclusive: Duplicate options detected.")
            else:
                for i in range(len(opts)):
                    for j in range(i + 1, len(opts)):
                        w1 = set(re.findall(r"\w+", opts[i]))
                        w2 = set(re.findall(r"\w+", opts[j]))
                        if not w1 or not w2:
                            continue
                        if w1 == w2:
                            is_exclusive = False
                            diagnostics.append(f"overlapping_options: '{schema_data.options[i]}' and '{schema_data.options[j]}' are identical.")
                            break

                        diff1 = w1 - w2
                        diff2 = w2 - w1
                        # If both options have distinguishing unique words, they are mutually exclusive alternatives
                        # (e.g. 'Company A' vs 'Company B', 'Tier 1' vs 'Tier 2', 'Approve' vs 'Reject')
                        has_distinguishing_words = bool(diff1 and diff2)

                        overlap_ratio = len(w1.intersection(w2)) / max(len(w1), len(w2))
                        if overlap_ratio >= 0.85 and not has_distinguishing_words:
                            is_exclusive = False
                            diagnostics.append(f"overlapping_options: '{schema_data.options[i]}' and '{schema_data.options[j]}' overlap substantially.")
                            break

        # 5. Coverage check (Choice)
        # Check if an escape hatch or category is missing for narrow non-binary choice sets.
        coverage_judgment = "complete"
        coverage_conf = 0.93
        if schema_data.type == QuestionType.CHOICE:
            opts = [o.strip().lower() for o in (schema_data.options or [])]
            escape_hatch_terms = {"other", "general", "unsure", "none", "unknown", "misc", "miscellaneous", "neither", "n/a"}
            has_escape_hatch = any(any(term in opt for term in escape_hatch_terms) for opt in opts)

            # Check if options represent an exhaustive binary pair (e.g. Yes/No, True/False, High/Low)
            is_binary_pair = False
            if len(opts) == 2:
                binary_pairs = [
                    {"yes", "no"}, {"true", "false"}, {"approve", "reject"},
                    {"allow", "deny"}, {"pass", "fail"}, {"accept", "decline"},
                    {"positive", "negative"}, {"high", "low"}, {"in", "out"}
                ]
                opts_set = set(opts)
                is_binary_pair = any(pair == opts_set for pair in binary_pairs)

            # Domain-agnostic check: If only 2 non-binary choices exist without an escape hatch
            # on an open-ended classification task, flag missing_option so user/patcher can add an escape hatch.
            if len(opts) == 2 and not is_binary_pair and not has_escape_hatch:
                q_lower = schema_data.question.lower()
                is_open_category = any(k in q_lower for k in ["what", "which category", "classify", "route", "sort", "type", "assign"])
                if is_open_category:
                    coverage_judgment = "missing_option"
                    diagnostics.append("missing_option: Choice set has only 2 specific options without an escape-hatch or catch-all category (e.g., 'Other' or 'General').")

        # Determine overall pass/fail
        passed = (
            type_judgment == "correct_type" and
            scope_judgment == "well_formed" and
            is_exclusive and
            coverage_judgment == "complete" and
            state_is_sufficient
        )

        return FitnessReport(
            passed=passed,
            coverage={
                "judgment": coverage_judgment,
                "confidence": coverage_conf,
                "detail": "Coverage across user intents"
            },
            exclusivity={
                "is_exclusive": is_exclusive,
                "confidence": excl_conf,
                "detail": "Mutual exclusivity of options"
            },
            type_fitness={
                "judgment": type_judgment,
                "confidence": type_conf,
                "detail": "Question type alignment"
            },
            scope={
                "judgment": scope_judgment,
                "confidence": scope_conf,
                "detail": "Option set sizing"
            },
            state_sufficiency={
                "is_sufficient": state_is_sufficient,
                "confidence": state_conf,
                "missing_fields": missing_fields,
                "detail": "State context completeness"
            },
            diagnostics=diagnostics
        )

validator_service = ValidatorService()
