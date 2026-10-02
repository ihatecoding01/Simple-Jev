import json
import re
from typing import Any, Dict, List, Optional, Tuple
from app.models.jev_types import CandidateSchema, QuestionType
from app.config import settings

class GeneratorService:
    """
    Extracts candidate {state, candidate_schema} from plain-language input.
    Operates in live mode via Groq/OpenAI, or in high-fidelity deterministic simulation mode.
    """

    def __init__(self):
        self._groq_client = None

    def _get_groq_client(self):
        if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.strip():
            return None
        if self._groq_client is None:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=settings.GROQ_API_KEY.strip())
            except Exception:
                self._groq_client = None
        return self._groq_client

    def _generate_with_groq(
        self,
        prompt: str,
        existing_state: Optional[Dict[str, Any]]
    ) -> Optional[Tuple[CandidateSchema, Dict[str, Any]]]:
        """Calls Groq API to extract structured state and candidate schema."""
        client = self._get_groq_client()
        if not client:
            return None

        try:
            system_prompt = (
                "You are the schema extractor for Jev, a typed System One decision engine. "
                "Analyze the user's natural language request and extract:\n"
                "1. 'state': an object containing the factual context or background text to evaluate (e.g. email body, ticket text, variables).\n"
                "2. 'schema': a typed question schema of type 'Choice', 'Score', or 'Noul'.\n"
                "   - If Choice: provide 'question' and 'options' (array of 3 to 6 distinct, mutually exclusive choices).\n"
                "   - If Score: provide 'question', 'min_score' (1.0), 'max_score' (5.0), and 'criteria'.\n"
                "   - If Noul: provide 'question' and 'assertion' (boolean statement to verify).\n"
                "Return ONLY valid JSON matching this schema: "
                "{\"state\": {\"content_text\": \"...\"}, \"schema\": {\"type\": \"Choice\"|\"Score\"|\"Noul\", \"question\": \"...\", \"options\": [...]}}"
            )

            res = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            content = res.choices[0].message.content
            data = json.loads(content)

            extracted_state = existing_state.copy() if existing_state else {}
            if "state" in data and isinstance(data["state"], dict):
                extracted_state.update(data["state"])
            extracted_state["raw_query"] = prompt
            if "content_text" not in extracted_state and len(prompt) > 20:
                extracted_state["content_text"] = prompt

            s_data = data.get("schema", {})
            raw_type = s_data.get("type", "Choice")
            q_type = QuestionType.CHOICE
            if raw_type.lower() == "score":
                q_type = QuestionType.SCORE
            elif raw_type.lower() == "noul":
                q_type = QuestionType.NOUL

            options = s_data.get("options", [])
            if q_type == QuestionType.CHOICE and len(options) < 2:
                options = ["Option A", "Option B", "General Inquiries"]

            schema = CandidateSchema(
                type=q_type,
                question=s_data.get("question", prompt),
                options=options if q_type == QuestionType.CHOICE else [],
                min_score=float(s_data.get("min_score", 1.0)),
                max_score=float(s_data.get("max_score", 5.0)),
                criteria=s_data.get("criteria", "Evaluation criteria"),
                assertion=s_data.get("assertion", prompt)
            )

            return schema, extracted_state

        except Exception as e:
            print(f"[Generator Service] Live Groq call failed ({e}), falling back to deterministic extraction.")
            return None

    def generate_candidate(
        self,
        prompt: str,
        existing_state: Optional[Dict[str, Any]] = None
    ) -> Tuple[CandidateSchema, Dict[str, Any]]:
        """
        Parses user prompt into state and candidate schema using Groq if enabled,
        or falling back to deterministic heuristic parsing.
        """
        # Try Groq if configured
        if settings.LLM_PROVIDER.lower() == "groq":
            groq_res = self._generate_with_groq(prompt, existing_state)
            if groq_res:
                return groq_res

        # Heuristic / deterministic fallback
        prompt_clean = prompt.strip()
        state: Dict[str, Any] = existing_state.copy() if existing_state else {}

        quotes = re.findall(r'["\'](.*?)["\']', prompt_clean)
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', prompt_clean)
        
        state["raw_query"] = prompt_clean
        if quotes:
            state["quoted_context"] = quotes[0]
        if emails:
            state["sender_email"] = emails[0]
            
        match_context = re.search(r'(?:email|message|ticket|saying|text|content)\s*[:\-]\s*(.*)', prompt_clean, re.IGNORECASE)
        if match_context:
            state["content_text"] = match_context.group(1).strip()
        elif len(prompt_clean) > 50:
            state["content_text"] = prompt_clean

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
        options_match = re.search(r'(?:between|into|among|one of)\s*[:\-]?\s*([^?.]+)', prompt_clean, re.IGNORECASE)
        options: List[str] = []
        if options_match:
            raw_opts = re.split(r',|\bor\b|\band\b', options_match.group(1))
            options = [o.strip().title() for o in raw_opts if o.strip() and len(o.strip()) > 1]

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
        return (
            f"Here is a general assessment of your query: '{prompt}'. "
            f"To evaluate this with TypeSafe AI's deterministic Jev engine, try phrasing your request with explicit "
            f"choices (e.g. 'Categorize this email into Billing or Support') or a numerical scale (e.g. 'Rate urgency from 1 to 5')."
        )

generator_service = GeneratorService()
