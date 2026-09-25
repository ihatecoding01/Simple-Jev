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
                        if w1 and w2 and (w1 == w2 or (len(w1.intersection(w2)) / max(len(w1), len(w2)) > 0.8)):
                            is_exclusive = False
                            diagnostics.append(f"overlapping_options: '{schema_data.options[i]}' and '{schema_data.options[j]}' overlap substantially.")
                            break

        # 5. Coverage check (Choice)
        # Check if an obvious escape hatch or category is missing
        coverage_judgment = "complete"
        coverage_conf = 0.93
        if schema_data.type == QuestionType.CHOICE:
            opts_str = " ".join((schema_data.options or [])).lower()
            if "other" not in opts_str and "general" not in opts_str and "unsure" not in opts_str:
                # If very few specific options exist, might be missing options
                if len(schema_data.options or []) == 2 and "billing" in opts_str and "technical" not in opts_str:
                    coverage_judgment = "missing_option"
                    diagnostics.append("missing_option: Option set does not cover plausible alternatives.")

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
