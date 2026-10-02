from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.jev_types import CandidateSchema, ExecutionResult, FitnessReport

class EvaluateRequest(BaseModel):
    prompt: str
    mode: str = "restricted"  # "restricted" or "unrestricted"
    session_id: str = "default_session"
    client_fingerprint: Optional[str] = None
    existing_state: Optional[Dict[str, Any]] = None

class EvaluateResponse(BaseModel):
    status: str  # "cache_hit", "needs_confirmation", "diverged", "incomplete_state", "fallback"
    schema_data: Optional[CandidateSchema] = None
    state: Optional[Dict[str, Any]] = None
    plain_translation: Optional[str] = None
    divergence_delta: Optional[Dict[str, Any]] = None
    assistant_message: Optional[str] = None
    fitness_report: Optional[FitnessReport] = None
    retries_attempted: int = 0
    stepper_stages: List[Dict[str, str]] = Field(default_factory=list)
    execution_result: Optional[ExecutionResult] = None
    is_cached: bool = False
    engine_mode: str = "simulation"
    is_simulation: bool = True


class RevalidateRequest(BaseModel):
    schema_data: CandidateSchema
    state: Optional[Dict[str, Any]] = None

class PatchRequest(BaseModel):
    original_schema: CandidateSchema
    state: Optional[Dict[str, Any]] = None
    user_correction: str
    original_prompt: Optional[str] = None

class ExecuteRequest(BaseModel):
    schema_data: CandidateSchema
    state: Dict[str, Any]
    session_id: Optional[str] = "default_session"

class UsageQuotaResponse(BaseModel):
    daily_limit: int
    remaining: int
    cached_runs: int
    cold_runs: int
    reset_in_hours: int = 24

class CachedIntentSummary(BaseModel):
    id: str
    intent_text: str
    schema_data: CandidateSchema
    state: Dict[str, Any]
    friendly_name: Optional[str] = None
    last_approved_at: str
