import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.models.jev_types import CachedIntent, CandidateSchema, QuestionType
from app.services.embedder import embedder
from app.config import settings

class IntentCache:
    """
    Stores validator-approved schemas keyed by intent vector embedding.
    Tracks exact hits, schema divergences, cold misses, and known-bad rejection patterns.
    """
    def __init__(self):
        self._cache: Dict[str, CachedIntent] = {}
        self._known_bad: List[Dict[str, Any]] = []
        self._seed_default_templates()

    def _seed_default_templates(self):
        """Seed common high-quality schemas so users can test immediately."""
        self.store(
            intent_text="categorize customer support email into billing, technical support, account, or feature request",
            schema_data=CandidateSchema(
                type=QuestionType.CHOICE,
                question="What department should this customer email be routed to?",
                options=["Billing & Invoicing", "Technical Support", "Account Management", "Feature Requests"]
            ),
            state={"context": "customer email router"},
            friendly_name="Customer Email Router"
        )
        self.store(
            intent_text="score urgency of incoming support ticket from low to critical",
            schema_data=CandidateSchema(
                type=QuestionType.SCORE,
                question="Rate the operational urgency of this ticket from 1 to 5.",
                min_score=1.0,
                max_score=5.0,
                criteria="Impact on business operations and time sensitivity"
            ),
            state={"context": "ticket urgency evaluator"},
            friendly_name="Urgency Scorer"
        )

    def store(
        self,
        intent_text: str,
        schema_data: CandidateSchema,
        state: Dict[str, Any],
        friendly_name: Optional[str] = None
    ) -> CachedIntent:
        vec = embedder.embed(intent_text)
        entry_id = str(uuid.uuid4())
        entry = CachedIntent(
            id=entry_id,
            intent_text=intent_text,
            embedding=vec,
            schema_data=schema_data,
            state=state,
            friendly_name=friendly_name or intent_text[:40],
            last_approved_at=datetime.now(timezone.utc).isoformat()
        )
        self._cache[entry_id] = entry
        return entry

    def record_bad_pattern(self, intent_text: str, schema_data: CandidateSchema, reason: str):
        """Stores rejected schema patterns to steer retries away from repeat errors."""
        self._known_bad.append({
            "intent_text": intent_text,
            "schema": schema_data.model_dump(),
            "reason": reason,
            "recorded_at": datetime.now(timezone.utc).isoformat()
        })

    def match(
        self,
        query: str,
        candidate_schema: Optional[CandidateSchema] = None
    ) -> Tuple[str, Optional[CachedIntent], Optional[Dict[str, Any]], float]:
        """
        Evaluates a query against cached intents.
        Returns:
            (status, matched_entry, divergence_delta, similarity_score)
            status is one of: "exact_hit", "diverged", "cold_miss"
        """
        query_vec = embedder.embed(query)
        best_entry: Optional[CachedIntent] = None
        best_score: float = -1.0

        for entry in self._cache.values():
            sim = embedder.cosine_similarity(query_vec, entry.embedding)
            if sim > best_score:
                best_score = sim
                best_entry = entry

        if not best_entry or best_score < settings.CACHE_SIMILARITY_THRESHOLD:
            return "cold_miss", None, None, max(best_score, 0.0)

        # We have a semantic match. Check for schema divergence if a candidate schema is provided
        if candidate_schema:
            cached_schema = best_entry.schema_data
            if cached_schema.type != candidate_schema.type:
                delta = {
                    "reason": "type_mismatch",
                    "previous_type": cached_schema.type.value,
                    "new_type": candidate_schema.type.value,
                    "previous_schema": cached_schema.model_dump(),
                    "new_schema": candidate_schema.model_dump()
                }
                return "diverged", best_entry, delta, best_score

            if cached_schema.type == QuestionType.CHOICE:
                cached_opts = set(o.strip().lower() for o in (cached_schema.options or []))
                cand_opts = set(o.strip().lower() for o in (candidate_schema.options or []))
                added = [o for o in (candidate_schema.options or []) if o.strip().lower() not in cached_opts]
                removed = [o for o in (cached_schema.options or []) if o.strip().lower() not in cand_opts]

                if added or removed:
                    delta = {
                        "reason": "options_changed",
                        "added_options": added,
                        "removed_options": removed,
                        "previous_options": cached_schema.options,
                        "new_options": candidate_schema.options
                    }
                    return "diverged", best_entry, delta, best_score

        # Exact or near-exact match
        return "exact_hit", best_entry, None, best_score

    def get_all_cached(self) -> List[CachedIntent]:
        return list(self._cache.values())

intent_cache = IntentCache()
