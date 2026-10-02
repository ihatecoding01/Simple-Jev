import re
from typing import Any, Dict, List, Optional, Tuple
from app.models.jev_types import CandidateSchema, QuestionType

class SecurityScanner:
    """
    Security boundary defense for the Generator and Schema Pipeline.
    Prevents prompt injection, context escape, delimiter breaking,
    schema payload weaponization, and state contamination.
    """

    # Signatures for prompt injection and instruction override attempts
    _INJECTION_PATTERNS = [
        r"(?i)\b(?:ignore|disregard|forget|override|bypass)\b\s+(?:all\s+)?(?:previous|prior|system|initial|above)\s+(?:instructions|prompts|rules|commands|directives)",
        r"(?i)\b(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|roleplay\s+as)\s+(?:unrestricted|dan|admin|root|system|developer|god)",
        r"(?i)\b(?:system\s*prompt|system\s*instructions|reveal\s+instructions|print\s+instructions|leak\s+cache|dump\s+cache|show\s+env|dump\s+memory)\b",
        r"(?i)\b(?:jev_api_key|groq_api_key|gemini_api_key|openai_api_key|os\.environ|process\.env|__import__)\b",
        r"(?i)\b(?:eval|exec|compile|subprocess|system)\s*\(",
        r"(?i)<\/?(?:system|instruction|user_inquiry|developer|assistant)[^>]*>",
    ]

    _COMPILED_INJECTION_REGEX = [re.compile(p) for p in _INJECTION_PATTERNS]

    # HTML/Script tag sanitizer pattern
    _SCRIPT_TAG_REGEX = re.compile(r"(?i)<\s*(?:script|iframe|object|embed|svg|style|link|img|applet)[^>]*>.*?<\s*\/\s*(?:script|iframe|object|embed|svg|style|link|img|applet)\s*>|<\s*(?:script|iframe|object|embed|svg|style|link|img|applet)[^>]*\/?>")
    _GENERIC_HTML_REGEX = re.compile(r"<[^>]+>")

    @classmethod
    def detect_prompt_injection(cls, text: str) -> Tuple[bool, Optional[str]]:
        """
        Inspects text for prompt injection signatures.
        Returns: (is_injection_detected, matched_pattern_reason)
        """
        if not text:
            return False, None

        for regex in cls._COMPILED_INJECTION_REGEX:
            match = regex.search(text)
            if match:
                return True, f"Detected injection pattern: '{match.group(0)[:40]}'"

        return False, None

    @classmethod
    def sanitize_input_text(cls, text: str, max_chars: int = 4000) -> str:
        """
        Sanitizes raw user input prior to sending to LLM.
        1. Normalizes unicode and removes null/control characters.
        2. Neutralizes XML tags that match system delimiters.
        3. Enforces reasonable length bounds to stop denial-of-service / token stuffing.
        """
        if not text:
            return ""

        # Remove null bytes and non-printable control characters (except newline, tab, carriage return)
        cleaned = "".join(ch for ch in text if ch in ("\n", "\r", "\t") or (len(ch.encode("utf-8")) <= 4 and ord(ch) >= 32))

        # Neutralize XML tags that could break our boundary isolation
        cleaned = cleaned.replace("<user_inquiry>", "&lt;user_inquiry&gt;")
        cleaned = cleaned.replace("</user_inquiry>", "&lt;/user_inquiry&gt;")
        cleaned = cleaned.replace("<system>", "&lt;system&gt;")
        cleaned = cleaned.replace("</system>", "&lt;/system&gt;")

        # Truncate length
        if len(cleaned) > max_chars:
            cleaned = cleaned[:max_chars]

        return cleaned.strip()

    sanitize_user_input = sanitize_input_text

    @classmethod
    def sanitize_candidate_schema(cls, schema: CandidateSchema) -> CandidateSchema:
        """
        Post-generation sanitization gate.
        Ensures the generated schema does not contain malicious script payloads,
        token stuffing, or unbounded option structures.
        """
        # 1. Sanitize question string
        clean_q = cls._SCRIPT_TAG_REGEX.sub("", schema.question or "")
        clean_q = cls._GENERIC_HTML_REGEX.sub("", clean_q).strip()
        if len(clean_q) > 300:
            clean_q = clean_q[:297] + "..."
        if not clean_q:
            clean_q = "What is the appropriate classification?"

        # 2. Sanitize options
        clean_options: List[str] = []
        seen = set()
        for opt in (schema.options or []):
            opt_str = cls._SCRIPT_TAG_REGEX.sub("", str(opt))
            opt_str = cls._GENERIC_HTML_REGEX.sub("", opt_str).strip()
            # Enforce max length per option
            if len(opt_str) > 100:
                opt_str = opt_str[:97] + "..."
            if opt_str and opt_str.lower() not in seen:
                seen.add(opt_str.lower())
                clean_options.append(opt_str)

        # Enforce max option count (PRD specifies maximum 8 to avoid cognitive bloat)
        if len(clean_options) > 8:
            clean_options = clean_options[:8]

        # 3. Sanitize criteria
        clean_criteria = None
        if schema.criteria:
            crit = cls._SCRIPT_TAG_REGEX.sub("", str(schema.criteria))
            clean_criteria = cls._GENERIC_HTML_REGEX.sub("", crit).strip()[:300]

        # 4. Sanitize assertion
        clean_assertion = None
        if schema.assertion:
            assert_str = cls._SCRIPT_TAG_REGEX.sub("", str(schema.assertion))
            clean_assertion = cls._GENERIC_HTML_REGEX.sub("", assert_str).strip()[:300]

        return CandidateSchema(
            type=schema.type,
            question=clean_q,
            options=clean_options if schema.type == QuestionType.CHOICE else [],
            min_score=float(schema.min_score or 1.0),
            max_score=float(schema.max_score or 5.0),
            criteria=clean_criteria,
            assertion=clean_assertion
        )

    @classmethod
    def sanitize_state(cls, state: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Sanitizes state dictionaries.
        Blocks prototype pollution keys and unbounded memory payloads.
        """
        if not state:
            return {}

        clean_state: Dict[str, Any] = {}
        disallowed_keys = {"__proto__", "constructor", "prototype", "__class__", "__globals__"}

        for k, v in state.items():
            clean_key = str(k).strip()
            if clean_key in disallowed_keys:
                continue

            if isinstance(v, str):
                # Clean script tags and bound length
                clean_val = cls._SCRIPT_TAG_REGEX.sub("", v)[:5000].strip()
                clean_state[clean_key] = clean_val
            elif isinstance(v, (int, float, bool)):
                clean_state[clean_key] = v
            elif isinstance(v, (list, tuple)):
                clean_state[clean_key] = [str(item)[:500] for item in v[:50]]
            elif isinstance(v, dict):
                clean_state[clean_key] = cls.sanitize_state(v)

        return clean_state

security_scanner = SecurityScanner
