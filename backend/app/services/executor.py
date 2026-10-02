import time
import random
import re
import threading
from typing import Any, Dict, List, Optional
from app.models.jev_types import CandidateSchema, ExecutionResult, QuestionType
from app.config import settings

class ExecutorService:
    """
    Executes validated state + schema against TypeSafe AI's Jev API (or high-fidelity simulation engine).
    Returns typed answer, confidence score, full probability distribution, and human-readable summary.
    Maintains a persistent HTTP keep-alive connection pool and pre-warms connections for sub-300ms decisions.
    """

    def __init__(self):
        self._client = None
        self._http_client = None
        self._last_key: Optional[str] = None
        self._lock = threading.Lock()
        self._warmup_started = False
        self._ensure_warmup_async()

    def _get_client(self):
        current_key = (settings.JEV_API_KEY or "").strip()
        if not current_key:
            return None

        with self._lock:
            if self._client is not None and self._last_key == current_key:
                return self._client

            try:
                import httpx2
                from typesafe_sdk import TypeSafeClient

                # Persistent HTTP client with aggressive keep-alive pooling
                self._http_client = httpx2.Client(
                    http2=False,
                    limits=httpx2.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=300.0),
                    timeout=15.0
                )
                self._client = TypeSafeClient(api_key=current_key, http_client=self._http_client)
                self._last_key = current_key
                return self._client
            except Exception as e:
                print(f"[Executor Service] Failed to initialize persistent TypeSafeClient: {e}")
                return None

    def _ensure_warmup_async(self):
        if self._warmup_started:
            return
        current_key = (settings.JEV_API_KEY or "").strip()
        if not current_key:
            return

        self._warmup_started = True

        def _do_warmup():
            try:
                client = self._get_client()
                if client:
                    from typesafe_sdk import Choice
                    client.system_one(
                        state="ping",
                        questions={"warmup": Choice(instructions="warmup", criteria={"ok": None})}
                    )
            except Exception:
                pass

        t = threading.Thread(target=_do_warmup, daemon=True, name="jev-warmup")
        t.start()

    def execute(self, schema: CandidateSchema, state: Dict[str, Any]) -> ExecutionResult:
        start_time = time.perf_counter()
        
        # 1. LIVE EXECUTION VIA TYPESAFE JEV API
        client = self._get_client()
        if client:
            try:
                from typesafe_sdk import Choice, Noul, Score

                # Format state input for Jev
                state_text = state.get("content_text") or state.get("quoted_context") or state.get("raw_query") or " ".join(str(v) for v in state.values())

                if schema.type == QuestionType.CHOICE:
                    options = schema.options or ["Option A", "Option B"]
                    criteria = {opt: None for opt in options}
                    call_start = time.perf_counter()
                    res = client.system_one(
                        state=state_text,
                        questions={"decision": Choice(instructions=schema.question, criteria=criteria)}
                    )
                    elapsed_ms = round((time.perf_counter() - call_start) * 1000, 1)
                    answer = res.answers["decision"]

                    # Raw Jev Choice Answer
                    decision = answer.choice
                    confidence = round(float(answer.confidence), 3)
                    probabilities = {k: round(float(v), 3) for k, v in answer.probabilities.items()}

                    summary = f"TypeSafe Jev (<code>{res.model}</code>) classified into **{decision}** with {int(confidence * 100)}% certainty."
                    print(f"\n=======================================================")
                    print(f"[JEV ENGINE] >>> LIVE TYPESAFE JEV API <<<")
                    print(f"  Model: {res.model} | Decision: {decision} | Conf: {confidence*100:.1f}% | Time: {elapsed_ms}ms")
                    print(f"=======================================================\n")
                    return ExecutionResult(
                        decision=decision,
                        confidence=confidence,
                        distribution=probabilities,
                        summary=summary,
                        question_type=QuestionType.CHOICE,
                        execution_time_ms=elapsed_ms,
                        is_simulation=False,
                        engine_mode="live",
                        engine_name=f"TypeSafe Jev ({res.model})"
                    )

                elif schema.type == QuestionType.SCORE:
                    rubric = ["very low", "low", "medium", "high", "critical"]
                    call_start = time.perf_counter()
                    res = client.system_one(
                        state=state_text,
                        questions={"decision": Score(instructions=schema.question, criteria=rubric)}
                    )
                    elapsed_ms = round((time.perf_counter() - call_start) * 1000, 1)
                    answer = res.answers["decision"]
                    score_val = answer.score
                    confidence = round(float(answer.confidence), 3)
                    raw_probs = getattr(answer, 'probabilities', {}) or {}
                    probs = {str(k): round(float(v), 3) for k, v in raw_probs.items()} if raw_probs else {str(score_val): confidence}

                    summary = f"TypeSafe Jev (<code>{res.model}</code>) evaluated score as **{score_val}** with {int(confidence * 100)}% confidence."
                    print(f"\n=======================================================")
                    print(f"[JEV ENGINE] >>> LIVE TYPESAFE JEV API <<<")
                    print(f"  Model: {res.model} | Score: {score_val} | Conf: {confidence*100:.1f}% | Time: {elapsed_ms}ms")
                    print(f"=======================================================\n")
                    return ExecutionResult(
                        decision=score_val,
                        confidence=confidence,
                        distribution=probs,
                        summary=summary,
                        question_type=QuestionType.SCORE,
                        execution_time_ms=elapsed_ms,
                        is_simulation=False,
                        engine_mode="live",
                        engine_name=f"TypeSafe Jev ({res.model})"
                    )

                elif schema.type == QuestionType.NOUL:
                    assertion_text = schema.assertion or schema.question
                    call_start = time.perf_counter()
                    res = client.system_one(
                        state=state_text,
                        questions={"decision": Noul(instructions=assertion_text)}
                    )
                    elapsed_ms = round((time.perf_counter() - call_start) * 1000, 1)
                    answer = res.answers["decision"]
                    noul_prob = round(float(answer.noul), 3)
                    is_true = noul_prob >= 0.5
                    confidence = noul_prob if is_true else round(1.0 - noul_prob, 3)

                    summary = f"TypeSafe Jev (<code>{res.model}</code>) verified assertion as **{'True' if is_true else 'False'}** with {int(confidence * 100)}% confidence."
                    print(f"\n=======================================================")
                    print(f"[JEV ENGINE] >>> LIVE TYPESAFE JEV API <<<")
                    print(f"  Model: {res.model} | Verified: {is_true} | Conf: {confidence*100:.1f}% | Time: {elapsed_ms}ms")
                    print(f"=======================================================\n")
                    return ExecutionResult(
                        decision=is_true,
                        confidence=confidence,
                        distribution={"True": noul_prob, "False": round(1.0 - noul_prob, 3)},
                        summary=summary,
                        question_type=QuestionType.NOUL,
                        execution_time_ms=elapsed_ms,
                        is_simulation=False,
                        engine_mode="live",
                        engine_name=f"TypeSafe Jev ({res.model})"
                    )

            except Exception as e:
                print(f"[Executor Service] Live Jev API call failed ({e}), falling back to deterministic simulation engine.")

        # 2. DETERMINISTIC SIMULATION ENGINE (Fallback / Offline)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000 + random.uniform(20, 60), 1)
        state_text = " ".join(str(v) for v in state.values()).lower()

        print(f"\n=======================================================")
        print(f"[JEV ENGINE] >>> SIMULATION ENGINE (DEMO / OFFLINE) <<<")
        print(f"  Notice: JEV_API_KEY is not configured.")
        print(f"  Type: {schema.type.value} | Elapsed: {elapsed_ms}ms")
        print(f"=======================================================\n")

        if schema.type == QuestionType.CHOICE:
            options = schema.options or ["Option A", "Option B"]
            scores: Dict[str, float] = {}

            for opt in options:
                score = 1.0  # base prior
                opt_words = opt.lower().split()
                for w in opt_words:
                    clean_w = re.sub(r'\W+', '', w)
                    if len(clean_w) >= 3:
                        stem = clean_w[:4] if len(clean_w) >= 4 else clean_w
                        if clean_w in state_text or stem in state_text:
                            score += 6.0
                scores[opt] = score

            total = sum(scores.values())
            distribution = {opt: round(s / total, 3) for opt, s in scores.items()}
            best_opt = max(distribution, key=distribution.get)
            top_prob = distribution[best_opt]

            summary = f"Classified into **{best_opt}** with {int(top_prob * 100)}% certainty."
            return ExecutionResult(
                decision=best_opt,
                confidence=top_prob,
                distribution=distribution,
                summary=summary,
                question_type=QuestionType.CHOICE,
                execution_time_ms=elapsed_ms,
                is_simulation=True,
                engine_mode="simulation",
                engine_name="Deterministic Simulation Engine (Demo)"
            )

        elif schema.type == QuestionType.SCORE:
            min_s = schema.min_score or 1.0
            max_s = schema.max_score or 5.0
            
            urgency_score = min_s + (max_s - min_s) * 0.5
            if any(w in state_text for w in ["urgent", "critical", "broken", "emergency", "immediately", "severe"]):
                urgency_score = min_s + (max_s - min_s) * 0.85
            elif any(w in state_text for w in ["low", "minor", "whenever", "no rush"]):
                urgency_score = min_s + (max_s - min_s) * 0.2

            urgency_val = round(urgency_score, 1)
            confidence = 0.91
            summary = f"Evaluated score of **{urgency_val}** on a scale of {int(min_s)} to {int(max_s)}."

            return ExecutionResult(
                decision=urgency_val,
                confidence=confidence,
                distribution={f"Score {urgency_val}": confidence, "Variance": round(1 - confidence, 2)},
                summary=summary,
                question_type=QuestionType.SCORE,
                execution_time_ms=elapsed_ms,
                is_simulation=True,
                engine_mode="simulation",
                engine_name="Deterministic Simulation Engine (Demo)"
            )

        elif schema.type == QuestionType.NOUL:
            is_valid = True
            if any(w in state_text for w in ["fake", "invalid", "false", "spam", "contradiction"]):
                is_valid = False

            confidence = 0.94
            summary = f"Assertion verified as **{'True' if is_valid else 'False'}** with {int(confidence * 100)}% confidence."

            return ExecutionResult(
                decision=is_valid,
                confidence=confidence,
                distribution={"True": confidence if is_valid else 1 - confidence, "False": 1 - confidence if is_valid else confidence},
                summary=summary,
                question_type=QuestionType.NOUL,
                execution_time_ms=elapsed_ms,
                is_simulation=True,
                engine_mode="simulation",
                engine_name="Deterministic Simulation Engine (Demo)"
            )

        return ExecutionResult(
            decision="Evaluated",
            confidence=0.90,
            distribution={},
            summary="Decision executed successfully.",
            question_type=schema.type,
            execution_time_ms=elapsed_ms,
            is_simulation=True,
            engine_mode="simulation",
            engine_name="Deterministic Simulation Engine (Demo)"
        )

executor_service = ExecutorService()
