import os
import sys
import time
import json
from dotenv import load_dotenv

# Load backend environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.models.jev_types import CandidateSchema, QuestionType
from app.config import settings
from app.services.generator import generator_service
from app.services.executor import executor_service
from app.services.validator import validator_service

test_cases = [
    {
        "name": "Customer Support Email Categorization (Choice)",
        "prompt": "I was charged twice on invoice #994. Please issue a refund ASAP.",
        "schema": CandidateSchema(
            type=QuestionType.CHOICE,
            question="Which department should handle this customer email?",
            options=["Billing & Invoicing", "Technical Support", "Account Management", "General Inquiries"]
        ),
        "state": {
            "content_text": "I was charged twice on invoice #994. Please issue a refund ASAP."
        }
    },
    {
        "name": "Production Outage Urgency Rating (Score)",
        "prompt": "Rate urgency: Primary Postgres database cluster has failed and all customer logins are returning 500 internal server errors.",
        "schema": CandidateSchema(
            type=QuestionType.SCORE,
            question="Rate the operational urgency of this incident.",
            min_score=1.0,
            max_score=5.0,
            criteria="Impact on production operations and revenue"
        ),
        "state": {
            "content_text": "Primary Postgres database cluster has failed and all customer logins are returning 500 internal server errors."
        }
    },
    {
        "name": "Security Assertion Verification (Noul)",
        "prompt": "Verify assertion: The incoming email SPF record passes verification for paypal.com domain.",
        "schema": CandidateSchema(
            type=QuestionType.NOUL,
            question="Verify whether the email authentication passes.",
            assertion="The incoming email SPF record passes verification for paypal.com domain."
        ),
        "state": {
            "content_text": "Received: from mail.paypal.com by mx.google.com with ESMTPS; SPF: pass (google.com: domain of support@paypal.com designates 173.0.84.1 as permitted sender)"
        }
    }
]

print("=" * 80)
print("COMPARING LIVE TYPESAFE JEV + GROQ API vs. DETERMINISTIC SIMULATION")
print("=" * 80)
print(f"JEV API Key Present: {bool(settings.JEV_API_KEY)}")
print(f"GROQ API Key Present: {bool(settings.GROQ_API_KEY)}")
print(f"LLM Provider: {settings.LLM_PROVIDER}")
print("=" * 80)

results = []

for idx, tc in enumerate(test_cases, 1):
    print(f"\n[{idx}/3] TEST CASE: {tc['name']}")
    print(f"Input Prompt: \"{tc['prompt']}\"")
    
    # 1. LIVE JEV EXECUTION
    live_start = time.time()
    live_result = executor_service.execute(tc["schema"], tc["state"])
    live_time = live_result.execution_time_ms

    # 2. SIMULATION EXECUTION (Temporarily bypass live key to benchmark simulation)
    orig_jev_key = settings.JEV_API_KEY
    settings.JEV_API_KEY = None  # Force simulation mode
    
    sim_start = time.time()
    sim_result = executor_service.execute(tc["schema"], tc["state"])
    sim_time = sim_result.execution_time_ms
    
    settings.JEV_API_KEY = orig_jev_key  # Restore live key

    results.append({
        "case": tc["name"],
        "prompt": tc["prompt"],
        "schema_type": tc["schema"].type.value,
        "live": {
            "decision": live_result.decision,
            "confidence": live_result.confidence,
            "distribution": live_result.distribution,
            "latency_ms": live_time,
            "summary": live_result.summary
        },
        "simulation": {
            "decision": sim_result.decision,
            "confidence": sim_result.confidence,
            "distribution": sim_result.distribution,
            "latency_ms": sim_time,
            "summary": sim_result.summary
        }
    })

    print("-" * 60)
    print("LIVE TYPESAFE JEV RESULT:")
    print(f"  Decision:   {live_result.decision}")
    print(f"  Confidence: {int(live_result.confidence * 100)}%")
    print(f"  Latency:    {live_time}ms")
    print(f"  Spread:     {live_result.distribution}")
    print(f"  Summary:    {live_result.summary}")
    print("-" * 60)
    print("SIMULATION RESULT:")
    print(f"  Decision:   {sim_result.decision}")
    print(f"  Confidence: {int(sim_result.confidence * 100)}%")
    print(f"  Latency:    {sim_time}ms")
    print(f"  Spread:     {sim_result.distribution}")
    print(f"  Summary:    {sim_result.summary}")

# Also test Groq Generation vs Heuristic Generation
print("\n" + "=" * 80)
print("TESTING GROQ LLM GENERATOR vs. HEURISTIC GENERATOR")
print("=" * 80)

gen_prompt = "Categorize this email: 'Our team is unable to login to the admin panel since 10am. Please check server status.'"

# Live Groq
settings.LLM_PROVIDER = "groq"
groq_schema, groq_state = generator_service.generate_candidate(gen_prompt)

# Heuristic
settings.LLM_PROVIDER = "mock"
mock_schema, mock_state = generator_service.generate_candidate(gen_prompt)
settings.LLM_PROVIDER = "groq" # Restore

print("PROMPT: " + gen_prompt)
print("\n[GROQ LLM GENERATOR]:")
print(f"  Question: {groq_schema.question}")
print(f"  Type:     {groq_schema.type.value}")
print(f"  Options:  {groq_schema.options}")
print(f"  State:    {groq_state}")

print("\n[HEURISTIC GENERATOR]:")
print(f"  Question: {mock_schema.question}")
print(f"  Type:     {mock_schema.type.value}")
print(f"  Options:  {mock_schema.options}")
print(f"  State:    {mock_state}")

print("\n" + "=" * 80)
print("BENCHMARK COMPLETED SUCCESSFULLY!")
print("=" * 80)
