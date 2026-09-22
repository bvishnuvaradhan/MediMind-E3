"""
test_diabetes_inference.py — API, service, and schema tests for Diabetes Risk.

Covers:
- Schema validation (missing field, wrong type, out-of-range)
- Lazy model loading and FileNotFoundError on bad path (artifact-dependent)
- Full inference round-trip (artifact-dependent)
- API route: missing feature → 422
- API route: missing auth → 401
- API route: OpenAPI exposure and CommonPredictionResponse schema
- API route: 503 when model artifact is unavailable (monkeypatched)
- API route: full persistence and history round-trip (monkeypatched predict)
- API route: 500 on persistence failure (monkeypatched save)

Artifact-dependent tests are skipped when best_model.joblib does not exist.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.core.config import settings
from app.core.database import Database
from app.schemas.prediction_schemas import DiabetesRequest
from app.services.diabetes_service import (
    DISCLAIMER,
    MODEL_VERSION,
    THRESHOLD,
    DiabetesInferenceService,
)


AUTH_HEADERS = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
MODEL_PATH = Path(__file__).parents[2] / "artifacts" / "diabetes" / "best_model.joblib"
MODEL_ARTIFACT_AVAILABLE = MODEL_PATH.exists()

VALID = {
    "family_member_id": "diabetes-test-member",
    "Pregnancies": 2,
    "Glucose": 120.0,
    "BloodPressure": 70.0,
    "SkinThickness": 20.0,
    "Insulin": 80.0,
    "BMI": 28.5,
    "DiabetesPedigreeFunction": 0.5,
    "Age": 35,
}


def _stubbed_result():
    """Return a fixed inference result for monkeypatched tests."""
    from app.models.diabetes.diabetes_preprocessing import DIABETES_FEATURES
    return {
        "risk_probability": 0.68,
        "risk_category": "HIGH",
        "threshold": THRESHOLD,
        "model_name": "diabetes_risk",
        "model_version": MODEL_VERSION,
        "feature_order": DIABETES_FEATURES,
        "disclaimer": DISCLAIMER,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Schema validation — no artifact required
# ─────────────────────────────────────────────────────────────────────────────

def test_schema_rejects_missing_required_field():
    payload = dict(VALID)
    del payload["Glucose"]
    with pytest.raises(ValidationError):
        DiabetesRequest(**payload)


def test_schema_rejects_wrong_type():
    with pytest.raises(ValidationError):
        DiabetesRequest(**dict(VALID, Glucose="not-a-number"))


def test_schema_rejects_glucose_above_maximum():
    with pytest.raises(ValidationError):
        DiabetesRequest(**dict(VALID, Glucose=999))


def test_schema_rejects_negative_pregnancies():
    with pytest.raises(ValidationError):
        DiabetesRequest(**dict(VALID, Pregnancies=-1))


def test_schema_rejects_bmi_above_maximum():
    with pytest.raises(ValidationError):
        DiabetesRequest(**dict(VALID, BMI=200.0))


def test_schema_accepts_biological_zeros_for_pregnancies():
    """Pregnancies = 0 is biologically valid (never been pregnant)."""
    req = DiabetesRequest(**dict(VALID, Pregnancies=0))
    assert req.Pregnancies == 0


def test_schema_accepts_optional_appointment_id():
    req = DiabetesRequest(**dict(VALID, appointment_id="appt-789"))
    assert req.appointment_id == "appt-789"


def test_schema_defaults_appointment_id_to_none():
    req = DiabetesRequest(**VALID)
    assert req.appointment_id is None


# ─────────────────────────────────────────────────────────────────────────────
# Inference service — artifact-dependent
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.skipif(
    not MODEL_ARTIFACT_AVAILABLE,
    reason="Local Diabetes model artifact is not available",
)
def test_valid_prediction_contains_probability_category_and_disclaimer():
    DiabetesInferenceService.reset_model()
    result = DiabetesInferenceService.predict(DiabetesRequest(**VALID))
    assert 0.0 <= result["risk_probability"] <= 1.0
    assert result["risk_category"] == ("HIGH" if result["risk_probability"] >= THRESHOLD else "LOW")
    assert result["model_version"] == MODEL_VERSION
    assert result["disclaimer"] == DISCLAIMER
    from app.models.diabetes.diabetes_preprocessing import DIABETES_FEATURES
    assert result["feature_order"] == DIABETES_FEATURES


@pytest.mark.skipif(
    not MODEL_ARTIFACT_AVAILABLE,
    reason="Local Diabetes model artifact is not available",
)
def test_model_loading_is_lazy_and_failures_are_clear():
    DiabetesInferenceService.reset_model()
    assert DiabetesInferenceService._model is None
    DiabetesInferenceService.predict(DiabetesRequest(**VALID))
    assert DiabetesInferenceService._model is not None
    DiabetesInferenceService.reset_model()
    with pytest.raises(FileNotFoundError, match="artifact not found"):
        DiabetesInferenceService.predict(
            DiabetesRequest(**VALID),
            model_path=Path("missing-diabetes-model.joblib"),
        )


@pytest.mark.skipif(
    not MODEL_ARTIFACT_AVAILABLE,
    reason="Local Diabetes model artifact is not available",
)
def test_api_route_validates_and_returns_prediction():
    client = TestClient(app)
    response = client.post("/api/ai/diabetes", json=VALID, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_type"] == "DIABETES_RISK"
    assert data["input_type"] == "HEALTH_PARAMETERS"
    assert data["prediction_id"].startswith("pred_")
    assert data["result"]["model_version"] == MODEL_VERSION
    assert data["result"]["disclaimer"] == DISCLAIMER


# ─────────────────────────────────────────────────────────────────────────────
# API route — no artifact required
# ─────────────────────────────────────────────────────────────────────────────

def test_api_route_rejects_missing_feature():
    client = TestClient(app)
    payload = dict(VALID)
    del payload["BMI"]
    response = client.post("/api/ai/diabetes", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 422


def test_api_route_requires_authentication():
    response = TestClient(app).post("/api/ai/diabetes", json=VALID)
    assert response.status_code == 401


def test_openapi_exposes_diabetes_route():
    openapi = TestClient(app).get("/openapi.json")
    assert openapi.status_code == 200
    schema = openapi.json()
    assert "/api/ai/diabetes" in schema["paths"]
    response_schema = (
        schema["paths"]["/api/ai/diabetes"]["post"]["responses"]["200"]
        ["content"]["application/json"]["schema"]
    )
    assert response_schema["$ref"].endswith("/CommonPredictionResponse")


def test_api_route_returns_service_unavailable_when_model_is_missing(monkeypatch):
    def missing_model(cls, model_path=None):
        raise FileNotFoundError("missing model artifact")

    monkeypatch.setattr(
        DiabetesInferenceService,
        "load_model",
        classmethod(missing_model),
    )
    response = TestClient(app).post(
        "/api/ai/diabetes",
        json=VALID,
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Diabetes model is unavailable."


def test_api_route_persists_common_record_and_exposes_history(monkeypatch):
    member_id = "diabetes-history-member"
    payload = dict(VALID, family_member_id=member_id, appointment_id="appt-diab-001")

    monkeypatch.setattr(
        DiabetesInferenceService,
        "predict",
        classmethod(lambda cls, request: _stubbed_result()),
    )

    with TestClient(app) as client:
        response = client.post("/api/ai/diabetes", json=payload, headers=AUTH_HEADERS)
        assert response.status_code == 200
        data = response.json()

        assert data["family_member_id"] == member_id
        assert data["appointment_id"] == "appt-diab-001"
        assert data["prediction_type"] == "DIABETES_RISK"
        assert data["input_type"] == "HEALTH_PARAMETERS"
        assert data["risk_level"] == "HIGH"
        assert data["risk_score"] == pytest.approx(0.68, rel=1e-4)
        assert data["confidence"] == pytest.approx(0.68, rel=1e-4)
        assert data["model_name"] == "diabetes_risk"
        assert data["model_version"] == MODEL_VERSION
        assert data["explanation_reference"] is None

        from app.models.diabetes.diabetes_preprocessing import DIABETES_FEATURES
        assert set(data["input_data"]) == set(DIABETES_FEATURES)
        assert "family_member_id" not in data["input_data"]
        assert "appointment_id" not in data["input_data"]

        prediction_id = data["prediction_id"]
        history = client.get(f"/api/ai/member/{member_id}", headers=AUTH_HEADERS)
        assert history.status_code == 200
        assert any(item["prediction_id"] == prediction_id for item in history.json())

        retrieved = client.get(f"/api/ai/{prediction_id}", headers=AUTH_HEADERS)
        assert retrieved.status_code == 200
        assert retrieved.json()["prediction_id"] == prediction_id


def test_api_route_returns_500_when_persistence_fails(monkeypatch):
    async def fail_save(cls, prediction_record):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(
        DiabetesInferenceService,
        "predict",
        classmethod(lambda cls, request: _stubbed_result()),
    )
    monkeypatch.setattr(Database, "save_prediction", classmethod(fail_save))

    response = TestClient(app).post(
        "/api/ai/diabetes",
        json=VALID,
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 500
    assert response.json()["detail"] == "Diabetes risk assessment failed."
