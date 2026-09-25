import time
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.api_types import (
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

def get_client_id(request: Request, body_fingerprint: str = None) -> str:
    """Derives client identity from body fingerprint or client host IP."""
    if body_fingerprint and body_fingerprint.strip():
        return body_fingerprint.strip()
    client_host = request.client.host if request.client else "127.0.0.1"
    return f"ip_{client_host}"

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "mode": "Simulation / Pluggable Jev" if not settings.JEV_API_KEY else "Live Jev Connected"
    }

@app.get("/api/v1/usage/quota", response_model=UsageQuotaResponse)
def get_quota(request: Request, fingerprint: str = ""):
    client_id = get_client_id(request, fingerprint)
    status = rate_limiter.get_quota_status(client_id)
    return UsageQuotaResponse(**status)

@app.get("/api/v1/cache/all")
def get_cached_schemas():
    return intent_cache.get_all_cached()

@app.post("/api/v1/intent/evaluate", response_model=EvaluateResponse)
def evaluate_intent(req: EvaluateRequest, request: Request):
    client_id = get_client_id(request, req.client_fingerprint)
    
    stages: List[Dict[str, str]] = [
        {"stage": "intent_understanding", "label": "Understanding request", "status": "completed"}
    ]

    # 1. Check Cache
    cache_status, matched_entry, delta, sim_score = intent_cache.match(req.prompt)

    # EXACT CACHE HIT
    if cache_status == "exact_hit" and matched_entry:
        stages.append({"stage": "cache_lookup", "label": "Found approved rule in cache", "status": "completed"})
        rate_limiter.check_and_consume(client_id, is_cold_run=False)

        schema = matched_entry.schema_data
        state = req.existing_state or matched_entry.state.copy()
        state["prompt_input"] = req.prompt
        translation = generator_service.translate_to_plain_language(schema)

        # In Unrestricted Mode: Exact cache hits run straight through to execution without interruption!
        if req.mode.lower() == "unrestricted":
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
            # Restricted Mode: Always wait for user confirmation
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
def execute_jev_schema(req: ExecuteRequest, request: Request):
    """
    Executes confirmed schema against Jev and caches the validated rule for future instant runs.
    """
    client_id = get_client_id(request)
    rate_limiter.check_and_consume(client_id, is_cold_run=False)

    result = executor_service.execute(req.schema_data, req.state)

    # Cache write (schema + state, keyed by prompt / context intent)
    intent_summary = req.state.get("raw_query") or req.schema_data.question
    intent_cache.store(
        intent_text=intent_summary,
        schema_data=req.schema_data,
        state=req.state,
        friendly_name=req.schema_data.question[:40]
    )

    return result
