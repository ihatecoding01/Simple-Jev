from app.models.jev_types import CandidateSchema, QuestionType
from app.services.validator import validator_service
from app.services.patcher import patcher_service

def test_patcher_resolves_type_mismatch():
    bad_schema = CandidateSchema(
        type=QuestionType.CHOICE,
        question="Rate the urgency from 1 to 5",
        options=["Option 1", "Option 2"]
    )
    state = {"content_text": "Production server is down!"}
    report = validator_service.validate(bad_schema, state)
    assert report.passed is False

    patched = patcher_service.patch_schema(bad_schema, report, "Rate the urgency from 1 to 5")
    assert patched.type == QuestionType.SCORE
    assert patched.min_score == 1.0
    assert patched.max_score == 5.0

def test_patcher_stall_detection():
    bad_schema = CandidateSchema(
        type=QuestionType.CHOICE,
        question="Which category?",
        options=["A"]  # too narrow (< 2 options)
    )
    state = {"content_text": "sample text"}
    report1 = validator_service.validate(bad_schema, state)
    report2 = validator_service.validate(bad_schema, state)
    assert patcher_service.has_stalled(report1, report2) is True
