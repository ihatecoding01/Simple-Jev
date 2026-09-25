from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

class QuestionType(str, Enum):
    CHOICE = "Choice"
    SCORE = "Score"
    NOUL = "Noul"

class CandidateSchema(BaseModel):
    type: QuestionType = QuestionType.CHOICE
    question: str
    options: Optional[List[str]] = Field(default_factory=list)
    min_score: Optional[float] = 0.0
    max_score: Optional[float] = 100.0
    criteria: Optional[str] = None
    assertion: Optional[str] = None

class FitnessReport(BaseModel):
    passed: bool
    coverage: Dict[str, Any] = Field(default_factory=dict)
    exclusivity: Dict[str, Any] = Field(default_factory=dict)
    type_fitness: Dict[str, Any] = Field(default_factory=dict)
    scope: Dict[str, Any] = Field(default_factory=dict)
    state_sufficiency: Dict[str, Any] = Field(default_factory=dict)
    diagnostics: List[str] = Field(default_factory=list)

class ExecutionResult(BaseModel):
    decision: Union[str, float, bool, int]
    confidence: float
    distribution: Dict[str, float] = Field(default_factory=dict)
    summary: str
    question_type: QuestionType
    execution_time_ms: float = 0.0

class CachedIntent(BaseModel):
    id: str
    intent_text: str
    embedding: List[float]
    schema_data: CandidateSchema
    state: Dict[str, Any]
    friendly_name: Optional[str] = None
    last_approved_at: str
