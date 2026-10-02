import logging
import re
import time
from typing import Any, Dict, List, Optional
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.api_types import (
    CachedIntentSummary,
    EvaluateRequest,
    EvaluateResponse,
    ExecuteRequest,
    PatchRequest,
    RevalidateRequest,
    UsageQuotaResponse
)
from app.models.jev_types import CandidateSchema, ExecutionResult, FitnessReport
from app.cache.intent_cache import intent_cache
from app.services.embedder import embedder
from app.services.generator import generator_service
from app.services.validator import validator_service
from app.services.patcher import patcher_service
from app.services.executor import executor_service
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger("simple_jev")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Conversational Jev Interface Backend"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client_id(request: Request, body_fingerprint: Optional[str] = None) -> str:
    """
    Derives secure client identity for rate-limiting.

    TRUST BOUNDARY & PROXY SPECIFICATION:
    - In production, Simple Jev is deployed behind Cloudflare (which sets CF-Connecting-IP)
      or a trusted reverse proxy (which appends to X-Forwarded-For).
    - CF-Connecting-IP is trusted first as Cloudflare edge infrastructure strips and sets this header.
    - X-Forwarded-For is read as a comma-separated list of IPs; the client IP is taken from the leftmost entry.
    - If no proxy headers are present, falls back to direct socket address (request.client.host).
    - Security fix: A client-provided body_fingerprint CANNOT replace the IP address to bypass rate limits.
      Instead, it supplements the IP as a sub-identifier: 'ip_{client_ip}_fp_{fingerprint}'.
    """
    client_ip = None

    # 1. Cloudflare connecting IP (trusted edge)
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip and cf_ip.strip():
        client_ip = cf_ip.strip()

    # 2. X-Forwarded-For header
    if not client_ip:
        xff = request.headers.get("x-forwarded-for")
        if xff and xff.strip():
            # Leftmost IP represents the initial client before proxy hops
            client_ip = xff.split(",")[0].strip()

    # 3. Direct socket host
    if not client_ip:
        client_ip = request.client.host if request.client else "127.0.0.1"

    # Sanitize IP string
    clean_ip = re.sub(r"[^0-9a-fA-F\.\:]", "", client_ip) or "127.0.0.1"

    # If client supplied fingerprint, bind it under the IP rather than replacing it
    if body_fingerprint and body_fingerprint.strip():
        clean_fp = re.sub(r"[^0-9a-zA-Z\-_]", "", body_fingerprint.strip())[:64]
        if clean_fp:
            return f"ip_{clean_ip}_fp_{clean_fp}"

    return f"ip_{clean_ip}"

@app.on_event("startup")
def startup_banner():
    is_sim = not bool(settings.JEV_API_KEY and settings.JEV_API_KEY.strip())
    engine_name = "SIMULATION ENGINE (DEMO / OFFLINE)" if is_sim else "LIVE TYPESAFE JEV API"
    print("\n" + "=" * 76)
    print(f"[{settings.APP_NAME.upper()} v{settings.VERSION}] INITIALIZING")
    print(f"  EXECUTION ENGINE : {engine_name}")
    if is_sim:
        print(f"  SIMULATION NOTICE: Running local deterministic simulation. Set JEV_API_KEY to switch to live Jev.")
    else:
        print(f"  LIVE JEV ENDPOINT: {settings.JEV_API_URL}")
    print(f"  EMBEDDING MODEL  : SentenceTransformers (all-MiniLM-L6-v2, 384 dimensions)")
    print(f"  INTENT CACHE     : 384-d normalized vector index initialized")
    print("=" * 76 + "\n")

@app.get("/")
def read_root():
    is_sim = not bool(settings.JEV_API_KEY and settings.JEV_API_KEY.strip())
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "is_simulation": is_sim,
        "engine_mode": "simulation" if is_sim else "live",
        "engine_name": "Deterministic Simulation Engine (Demo)" if is_sim else "TypeSafe Jev Cloud",
        "embedding_model": "all-MiniLM-L6-v2 (384-d)",
        "mode": "Simulation / Pluggable Jev" if is_sim else "Live Jev Connected"
    }

@app.get("/api/v1/usage/quota", response_model=UsageQuotaResponse)
def get_quota(request: Request, fingerprint: str = ""):
    client_id = get_client_id(request, fingerprint)
    status = rate_limiter.get_quota_status(client_id)
    return UsageQuotaResponse(**status)

@app.get("/api/v1/cache/all", response_model=List[CachedIntentSummary])
def get_cached_schemas():
    """Returns cached intent metadata without serializing raw 384-dimensional embedding vectors."""
    all_cached = intent_cache.get_all_cached()
    return [
        CachedIntentSummary(
            id=item.id,
            intent_text=item.intent_text,
            schema_data=item.schema_data,
            state=item.state,
            friendly_name=item.friendly_name,
            last_approved_at=item.last_approved_at
        )
        for item in all_cached
    ]

@app.post("/api/v1/intent/evaluate", response_model=EvaluateResponse)
def evaluate_intent(req: EvaluateRequest, request: Request):
    client_id = get_client_id(request, req.client_fingerprint)
    
    stages: List[Dict[str, str]] = [
        {"stage": "intent_understanding", "label": "Understanding request", "status": "completed"}
    ]

    try:
        # 1. Check Cache
        cache_status, matched_entry, delta, sim_score = intent_cache.match(req.prompt)

        # EXACT CACHE HIT OR SEMANTIC CACHE HIT
        if cache_status in ("exact_hit", "semantic_match") and matched_entry:
            stages.append({"stage": "cache_lookup", "label": "Found approved rule in cache", "status": "completed"})
            rate_limiter.check_and_consume(client_id, is_cold_run=False)

            schema = matched_entry.schema_data
            state = req.existing_state or matched_entry.state.copy()
            state["prompt_input"] = req.prompt
            translation = generator_service.translate_to_plain_language(schema)

            # In Unrestricted Mode: Exact cache hits (>= EXACT_CACHE_THRESHOLD) run straight through to execution without interruption!
            # Semantic matches (CACHE_SIMILARITY_THRESHOLD <= sim < EXACT_CACHE_THRESHOLD) pause for user confirmation!
            if req.mode.lower() == "unrestricted" and cache_status == "exact_hit":
                stages.append({"stage": "execution", "label": "Auto-executing approved schema", "status": "completed"})
                exec_result = executor_service.execute(schema, state)
                return EvaluateResponse(
                    status="cache_hit",
                    schema_data=schema,
                    state=state,
                    plain_translation=translation,
                    fitness_report=None,
                    retries_attempted=0,
                    stepper_stages=stages,
                    execution_result=exec_result,
                    is_cached=True
                )
            else:
                # Restricted Mode or semantic match: Always wait for user confirmation
                stages.append({"stage": "awaiting_confirmation", "label": "Ready for your review", "status": "active"})
                return EvaluateResponse(
                    status="needs_confirmation",
                    schema_data=schema,
                    state=state,
                    plain_translation=translation,
                    retries_attempted=0,
                    stepper_stages=stages,
                    is_cached=True
                )

        # DIVERGENCE DETECTED (in Unrestricted or Restricted mode)
        if cache_status == "diverged" and matched_entry and delta:
            stages.append({"stage": "divergence_check", "label": "Detected schema variation", "status": "completed"})
            rate_limiter.check_and_consume(client_id, is_cold_run=False)
            
            # Generator generates updated schema
            candidate_schema, extracted_state = generator_service.generate_candidate(req.prompt, req.existing_state)
            translation = generator_service.translate_to_plain_language(candidate_schema)
            
            return EvaluateResponse(
                status="diverged",
                schema_data=candidate_schema,
                state=extracted_state,
                plain_translation=translation,
                divergence_delta=delta,
                retries_attempted=0,
                stepper_stages=stages,
                is_cached=False
            )

        # COLD CACHE MISS: Generator -> Validator Loop
        # Enforce daily quota
        if not rate_limiter.check_and_consume(client_id, is_cold_run=True):
            raise HTTPException(
                status_code=429,
                detail="Daily inquiry limit reached. Pinned and cached schemas can still be run for free."
            )

        stages.append({"stage": "structuring", "label": "Structuring options", "status": "completed"})
        candidate_schema, state = generator_service.generate_candidate(req.prompt, req.existing_state)

        stages.append({"stage": "validation", "label": "Verifying schema safety", "status": "completed"})
        report = validator_service.validate(candidate_schema, state)

        # Check for incomplete state
        if not report.state_sufficiency.get("is_sufficient", True):
            stages.append({"stage": "clarification", "label": "Need additional context", "status": "active"})
            translation = generator_service.translate_to_plain_language(candidate_schema)
            return EvaluateResponse(
                status="incomplete_state",
                schema_data=candidate_schema,
                state=state,
                plain_translation=translation,
                assistant_message=(
                    f"I can evaluate this question ({candidate_schema.question}), but I need the background content or data context first. "
                    "Please paste or describe the text/item to evaluate below."
                ),
                fitness_report=report,
                retries_attempted=0,
                stepper_stages=stages,
                is_cached=False
            )

        # Retry loop if validation failed on schema dimensions
        retries = 0
        prev_report = None
        while not report.passed and retries < settings.MAX_RETRY_ATTEMPTS:
            if patcher_service.has_stalled(prev_report, report):
                # Abort early if Generator is reproducing identical diagnostics
                break

            retries += 1
            stages.append({
                "stage": f"patch_retry_{retries}",
                "label": f"Refining schema (attempt {retries})",
                "status": "completed"
            })
            prev_report = report
            candidate_schema = patcher_service.patch_schema(candidate_schema, report, req.prompt)
            report = validator_service.validate(candidate_schema, state)

        # If retries exhausted and still failing -> Fallback to conversational LLM response
        if not report.passed:
            stages.append({"stage": "fallback", "label": "Standard conversational fallback", "status": "completed"})
            fallback_msg = generator_service.generate_fallback_response(req.prompt)
            return EvaluateResponse(
                status="fallback",
                schema_data=candidate_schema,
                state=state,
                assistant_message=fallback_msg,
                fitness_report=report,
                retries_attempted=retries,
                stepper_stages=stages,
                is_cached=False
            )

        # Schema is validated and passed!
        translation = generator_service.translate_to_plain_language(candidate_schema)
        stages.append({"stage": "ready", "label": "Ready for your review", "status": "completed"})

        return EvaluateResponse(
            status="needs_confirmation",
            schema_data=candidate_schema,
            state=state,
            plain_translation=translation,
            fitness_report=report,
            retries_attempted=retries,
            stepper_stages=stages,
            is_cached=False
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in evaluate_intent: %s", exc)
        stages.append({"stage": "error_recovery", "label": "Pipeline recovered safely", "status": "failed"})
        err_msg = str(exc) if settings.DEBUG else "An unexpected error occurred while evaluating your intent. Please try again or rephrase."
        return EvaluateResponse(
            status="fallback",
            assistant_message=f"I couldn't process this request into a structured decision: {err_msg}",
            retries_attempted=0,
            stepper_stages=stages,
            is_cached=False
        )

@app.post("/api/v1/schema/revalidate", response_model=EvaluateResponse)
def revalidate_schema(req: RevalidateRequest):
    """
    Called when user modifies chips directly (clicks 'x' or adds option).
    Bypasses Generator LLM entirely for zero-cost, instant re-validation!
    """
    report = validator_service.validate(req.schema_data, req.state)
    translation = generator_service.translate_to_plain_language(req.schema_data)

    return EvaluateResponse(
        status="needs_confirmation" if report.passed else "validation_warning",
        schema_data=req.schema_data,
        state=req.state,
        plain_translation=translation,
        fitness_report=report,
        retries_attempted=0,
        stepper_stages=[
            {"stage": "chip_edit", "label": "Updated options locally", "status": "completed"},
            {"stage": "revalidated", "label": "Schema re-verified", "status": "completed"}
        ],
        is_cached=False
    )

@app.post("/api/v1/schema/patch", response_model=EvaluateResponse)
def patch_schema_endpoint(req: PatchRequest):
    """
    Applies user text correction (structural modification) to schema and re-validates.
    """
    # Create synthetic diagnostic or update schema directly
    patched_schema, new_state = generator_service.generate_candidate(
        req.user_correction,
        req.state
    )
    report = validator_service.validate(patched_schema, new_state)
    translation = generator_service.translate_to_plain_language(patched_schema)

    return EvaluateResponse(
        status="needs_confirmation" if report.passed else "validation_warning",
        schema_data=patched_schema,
        state=new_state,
        plain_translation=translation,
        fitness_report=report,
        retries_attempted=1,
        stepper_stages=[
            {"stage": "text_patch", "label": f"Applied correction: '{req.user_correction}'", "status": "completed"},
            {"stage": "revalidated", "label": "Schema re-verified", "status": "completed"}
        ],
        is_cached=False
    )

@app.post("/api/v1/jev/execute", response_model=ExecutionResult)
def execute_jev_schema(req: ExecuteRequest, request: Request, background_tasks: BackgroundTasks):
    """
    Executes confirmed schema against Jev and caches the validated rule for future instant runs.
    """
    client_id = get_client_id(request)
    rate_limiter.check_and_consume(client_id, is_cold_run=False)

    result = executor_service.execute(req.schema_data, req.state)

    # Offload cache write to background task so response is dispatched immediately to client
    intent_summary = req.state.get("raw_query") or req.schema_data.question
    background_tasks.add_task(
        intent_cache.store,
        intent_text=intent_summary,
        schema_data=req.schema_data,
        state=req.state,
        friendly_name=req.schema_data.question[:40]
    )

    return result
