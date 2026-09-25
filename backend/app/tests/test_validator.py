from app.models.jev_types import CandidateSchema, QuestionType
from app.services.validator import validator_service

def test_validator_passes_well_formed_schema():
    schema = CandidateSchema(
        type=QuestionType.CHOICE,
        question="Which department should this ticket be assigned to?",
        options=["Billing", "Technical Support", "General Inquiries"]
    )
    state = {"content_text": "Customer has an issue with invoice #123"}
    report = validator_service.validate(schema, state)
    assert report.passed is True
    assert report.coverage["judgment"] == "complete"
    assert report.exclusivity["is_exclusive"] is True
    assert report.type_fitness["judgment"] == "correct_type"

def test_validator_fails_incomplete_state():
    schema = CandidateSchema(
        type=QuestionType.CHOICE,
        question="Categorize this email",
        options=["Billing", "Support"]
    )
    state = {}  # Empty state
    report = validator_service.validate(schema, state)
    assert report.passed is False
    assert report.state_sufficiency["is_sufficient"] is False

def test_validator_catches_overlapping_options():
    schema = CandidateSchema(
        type=QuestionType.CHOICE,
        question="Categorize ticket",
        options=["Technical Support", "technical support", "Billing"]
    )
    state = {"content_text": "Sample text"}
    report = validator_service.validate(schema, state)
    assert report.passed is False
    assert report.exclusivity["is_exclusive"] is False

def test_validator_catches_type_mismatch():
    schema = CandidateSchema(
        type=QuestionType.CHOICE,
        question="Rate the urgency from 1 to 5",
        options=["Option 1", "Option 2"]
    )
    state = {"content_text": "System down!"}
    report = validator_service.validate(schema, state)
    assert report.passed is False
    assert report.type_fitness["judgment"] == "should_be_score"
