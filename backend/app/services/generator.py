import json
import re
from typing import Any, Dict, List, Optional, Tuple
from app.models.jev_types import CandidateSchema, QuestionType
from app.config import settings

class GeneratorService:
    """
    Extracts candidate {state, candidate_schema} from plain-language input.
    Operates in live mode via LLM provider, or in high-fidelity deterministic simulation mode.
    """

    def generate_candidate(
        self,
        prompt: str,
        existing_state: Optional[Dict[str, Any]] = None
    ) -> Tuple[CandidateSchema, Dict[str, Any]]:
        """
        Parses user prompt into state and candidate schema.
        """
        prompt_clean = prompt.strip()
        state: Dict[str, Any] = existing_state.copy() if existing_state else {}

        # 1. State extraction
        # If user supplied contextual clues (emails, messages, numbers, quotes)
        quotes = re.findall(r'["\'](.*?)["\']', prompt_clean)
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', prompt_clean)
        
        state["raw_query"] = prompt_clean
        if quotes:
            state["quoted_context"] = quotes[0]
        if emails:
            state["sender_email"] = emails[0]
            
        # If prompt has text following "email:", "message:", "saying:", or "ticket:"
        match_context = re.search(r'(?:email|message|ticket|saying|text|content)\s*[:\-]\s*(.*)', prompt_clean, re.IGNORECASE)
        if match_context:
            state["content_text"] = match_context.group(1).strip()
        elif len(prompt_clean) > 50:
            state["content_text"] = prompt_clean

        # 2. Schema classification and generation
        lower = prompt_clean.lower()

        # Score type detection
        if any(w in lower for w in ["rate", "score", "scale of", "how urgent", "urgency", "severity", "priority"]):
            schema = CandidateSchema(
                type=QuestionType.SCORE,
                question="Rate the operational urgency or priority level of this item.",
                min_score=1.0,
                max_score=5.0,
                criteria="Evaluation of impact and time criticality"
            )
            return schema, state

        # Noul (Boolean / assertion) detection
        if any(w in lower for w in ["is it true", "verify whether", "does it contain", "is this legitimate", "is this valid"]):
            schema = CandidateSchema(
                type=QuestionType.NOUL,
                question=f"Verify assertion: {prompt_clean}",
                assertion=prompt_clean
            )
            return schema, state

        # Default: Choice (Categorization)
        # Extract explicit options if user provided "between X, Y, or Z" or "into X, Y, Z"
        options_match = re.search(r'(?:between|into|among|one of)\s*[:\-]?\s*([^?.]+)', prompt_clean, re.IGNORECASE)
        options: List[str] = []
        if options_match:
            raw_opts = re.split(r',|\bor\b|\band\b', options_match.group(1))
            options = [o.strip().title() for o in raw_opts if o.strip() and len(o.strip()) > 1]

        # Domain heuristics if no explicit options found
        if not options:
            if any(w in lower for w in ["email", "ticket", "inquiry", "support", "customer"]):
                options = ["Billing & Invoicing", "Technical Support", "Account Management", "General Inquiries"]
            elif any(w in lower for w in ["job", "offer", "career", "salary"]):
                options = ["Accept Company A", "Accept Company B", "Negotiate Compensation", "Decline Both"]
            elif any(w in lower for w in ["sentiment", "tone", "feeling"]):
                options = ["Positive", "Neutral", "Negative", "Frustrated"]
            elif any(w in lower for w in ["priority", "triage", "importance"]):
                options = ["Critical / Immediate", "High Priority", "Normal", "Low Priority"]
            else:
                options = ["Category A", "Category B", "Category C", "Other"]

        schema = CandidateSchema(
            type=QuestionType.CHOICE,
            question="What is the most accurate classification for this item?",
            options=options
        )
        return schema, state

    def translate_to_plain_language(self, schema: CandidateSchema) -> str:
        """
        Deterministic templated translation from validated schema to plain English.
        Never exposes raw JSON to the user.
        """
        if schema.type == QuestionType.CHOICE:
            opts = schema.options or []
            if len(opts) == 1:
                opts_str = opts[0]
            elif len(opts) == 2:
                opts_str = f"{opts[0]} or {opts[1]}"
            else:
                opts_str = f"{', '.join(opts[:-1])}, or {opts[-1]}"
            return f"I'll sort this into one of: {opts_str}. Sound right?"

        elif schema.type == QuestionType.SCORE:
            min_s = int(schema.min_score) if schema.min_score.is_integer() else schema.min_score
            max_s = int(schema.max_score) if schema.max_score.is_integer() else schema.max_score
            criteria = schema.criteria or "specified criteria"
            return f"I'll evaluate this on a scale of {min_s} to {max_s} based on {criteria}. Sound right?"

        elif schema.type == QuestionType.NOUL:
            assertion = schema.assertion or schema.question
            return f"I'll verify whether: {assertion}. Sound right?"

        return "I've structured a decision question for your request. Sound right?"

    def generate_fallback_response(self, prompt: str) -> str:
        """
        Emitted when validation retries fail to converge on a strict Jev schema.
        Provides a polite, helpful unstructured response with guidance.
        """
        return (
            f"Here is a general assessment of your query: '{prompt}'. "
            f"To evaluate this with TypeSafe AI's deterministic Jev engine, try phrasing your request with explicit "
            f"choices (e.g. 'Categorize this email into Billing or Support') or a numerical scale (e.g. 'Rate urgency from 1 to 5')."
        )

generator_service = GeneratorService()
