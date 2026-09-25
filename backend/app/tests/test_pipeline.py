from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

def test_cache_hit_restricted_mode():
    payload = {
        "prompt": "categorize customer support email into billing, technical support, account, or feature request",
        "mode": "restricted",
        "session_id": "test_sess"
    }
    res = client.post("/api/v1/intent/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_confirmation"
    assert data["is_cached"] is True
    assert "billing" in data["plain_translation"].lower()

def test_cache_hit_unrestricted_mode_auto_executes():
    payload = {
        "prompt": "categorize customer support email into billing, technical support, account, or feature request",
        "mode": "unrestricted",
        "session_id": "test_sess"
    }
    res = client.post("/api/v1/intent/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "cache_hit"
    assert data["execution_result"] is not None
    assert data["execution_result"]["decision"] is not None

def test_cold_miss_evaluation():
    payload = {
        "prompt": "Should I accept the job offer from Company A with $120k salary or Company B with $140k salary?",
        "mode": "restricted",
        "session_id": "test_sess"
    }
    res = client.post("/api/v1/intent/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_confirmation"
    assert data["schema_data"]["type"] == "Choice"
    assert len(data["schema_data"]["options"]) >= 2

def test_instant_chip_revalidate():
    payload = {
        "schema_data": {
            "type": "Choice",
            "question": "Assign ticket category",
            "options": ["Billing", "Support", "Refunds"]
        },
        "state": {"content_text": "Need my refund"}
    }
    res = client.post("/api/v1/schema/revalidate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_confirmation"
    assert "Refunds" in data["plain_translation"]

def test_execute_jev_decision():
    payload = {
        "schema_data": {
            "type": "Choice",
            "question": "Assign department",
            "options": ["Billing & Invoicing", "Technical Support"]
        },
        "state": {
            "content_text": "I was billed twice on invoice 994"
        }
    }
    res = client.post("/api/v1/jev/execute", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["decision"] == "Billing & Invoicing"
    assert data["confidence"] > 0.5
    assert "Billing & Invoicing" in data["distribution"]
