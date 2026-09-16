import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel

client = TestClient(app)

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
    response = client.post("/api/ai/general-health", json=payload)
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
    # Submit prediction
    payload = {
        "family_member_id": "mem_hist_77",
        "text": "Persistent cough and fever for 3 days."
    }
    post_res = client.post("/api/ai/general-health", json=payload)
    assert post_res.status_code == 200
    pred_data = post_res.json()
    pred_id = pred_data["prediction_id"]

    # Query history for member
    hist_res = client.get(f"/api/ai/member/mem_hist_77")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert history[0]["prediction_id"] == pred_id

    # Query specific prediction by ID
    single_res = client.get(f"/api/ai/{pred_id}")
    assert single_res.status_code == 200
    single_data = single_res.json()
    assert single_data["prediction_id"] == pred_id
