import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}

def test_nlp_red_flag_chest_pain_emergency():
    text = "Having severe chest pain and shortness of breath since 1 hour ago."
    result, risk_level, risk_score, confidence = GeneralHealthNLPEngine.evaluate_symptoms(text)

    assert result["urgency"] == UrgencyLevel.EMERGENCY.value
    assert risk_level == RiskLevel.HIGH
    assert risk_score >= 0.90
    assert result["disclaimer"] == GeneralHealthNLPEngine.MANDATORY_DISCLAIMER
    assert any("Chest pain" in c or "breathing" in c for c in result["possibleConcerns"])

def test_nlp_moderate_fever_and_vomiting():
    text = "Having 102F temperature, vomiting, and body pain."
    result, risk_level, risk_score, confidence = GeneralHealthNLPEngine.evaluate_symptoms(text)

    assert result["urgency"] == UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED.value
    assert risk_level == RiskLevel.MEDIUM
    assert result["disclaimer"] == GeneralHealthNLPEngine.MANDATORY_DISCLAIMER

def test_nlp_minor_headache_self_care():
    text = "I have a mild headache and runny nose today."
    result, risk_level, risk_score, confidence = GeneralHealthNLPEngine.evaluate_symptoms(text)

    assert result["urgency"] == UrgencyLevel.SELF_CARE.value
    assert risk_level == RiskLevel.LOW
    assert result["disclaimer"] == GeneralHealthNLPEngine.MANDATORY_DISCLAIMER

def test_api_post_general_health():
    payload = {
        "family_member_id": "mem_12345",
        "text": "Having 103F temperature, headache and severe chest tightness",
        "appointment_id": "app_99"
    }
    response = client.post("/api/ai/general-health", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()

    assert data["family_member_id"] == "mem_12345"
    assert data["prediction_type"] == "GENERAL_HEALTH"
    assert data["input_type"] == "TEXT"
    assert data["risk_level"] == "HIGH"
    assert data["result"]["urgency"] == "EMERGENCY"
    assert "disclaimer" in data["result"]
    assert data["result"]["disclaimer"] == GeneralHealthNLPEngine.MANDATORY_DISCLAIMER

def test_api_prediction_history_endpoints():
    payload = {
        "family_member_id": "mem_hist_77",
        "text": "Persistent cough and fever for 3 days."
    }
    post_res = client.post("/api/ai/general-health", json=payload, headers=AUTH_HEADERS)
    assert post_res.status_code == 200
    pred_data = post_res.json()
    pred_id = pred_data["prediction_id"]

    # Query history for member
    hist_res = client.get(f"/api/ai/member/mem_hist_77", headers=AUTH_HEADERS)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert history[0]["prediction_id"] == pred_id

    # Query specific prediction by ID
    single_res = client.get(f"/api/ai/{pred_id}", headers=AUTH_HEADERS)
    assert single_res.status_code == 200
    single_data = single_res.json()
    assert single_data["prediction_id"] == pred_id

def test_api_prediction_history_pagination():
    member_id = "mem_api_page_001"
    for index in range(3):
        response = client.post(
            "/api/ai/general-health",
            json={"family_member_id": member_id, "text": f"Mild headache {index}"},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 200

    page = client.get(
        f"/api/ai/member/{member_id}?skip=1&limit=1",
        headers=AUTH_HEADERS,
    )
    assert page.status_code == 200
    assert len(page.json()) == 1
