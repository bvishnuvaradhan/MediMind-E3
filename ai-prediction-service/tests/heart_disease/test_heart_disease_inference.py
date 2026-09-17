from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.core.config import settings
from app.core.database import Database
from app.schemas.prediction_schemas import HeartDiseaseRequest
from app.services.heart_disease_service import (
    DISCLAIMER,
    MODEL_VERSION,
    THRESHOLD,
    HeartDiseaseInferenceService,
)


AUTH_HEADERS = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
MODEL_PATH = Path(__file__).parents[2] / "artifacts" / "heart_disease" / "random_forest.joblib"
MODEL_ARTIFACT_AVAILABLE = MODEL_PATH.exists()
VALID = {
    "family_member_id": "heart-test-member",
    "AGE": 55,
    "GENDER": 1,
    "HEIGHT": 170,
    "WEIGHT": 80,
    "AP_HIGH": 140,
    "AP_LOW": 90,
    "CHOLESTEROL": 2,
    "GLUCOSE": 1,
    "SMOKE": 0,
    "ALCOHOL": 0,
    "PHYSICAL_ACTIVITY": 1,
}


def _stubbed_result():
    return {
        "risk_probability": 0.73,
        "risk_category": "HIGH",
        "threshold": THRESHOLD,
        "model_name": "heart_disease_risk",
        "model_version": MODEL_VERSION,
        "feature_order": [
            "AGE", "GENDER", "HEIGHT", "WEIGHT", "AP_HIGH", "AP_LOW",
            "CHOLESTEROL", "GLUCOSE", "SMOKE", "ALCOHOL", "PHYSICAL_ACTIVITY",
        ],
        "disclaimer": DISCLAIMER,
    }


@pytest.mark.skipif(
    not MODEL_ARTIFACT_AVAILABLE,
    reason="Local Heart Disease model artifact is not available",
)
def test_valid_prediction_contains_probability_category_and_disclaimer():
    HeartDiseaseInferenceService.reset_model()
    result = HeartDiseaseInferenceService.predict(HeartDiseaseRequest(**VALID))
    assert 0.0 <= result["risk_probability"] <= 1.0
    assert result["risk_category"] == ("HIGH" if result["risk_probability"] >= THRESHOLD else "LOW")
    assert result["model_version"] == MODEL_VERSION
    assert result["disclaimer"] == DISCLAIMER
    assert result["feature_order"] == [
        "AGE", "GENDER", "HEIGHT", "WEIGHT", "AP_HIGH", "AP_LOW",
        "CHOLESTEROL", "GLUCOSE", "SMOKE", "ALCOHOL", "PHYSICAL_ACTIVITY",
    ]


def test_schema_rejects_missing_invalid_and_impossible_values():
    missing = dict(VALID)
    del missing["AGE"]
    with pytest.raises(ValidationError):
        HeartDiseaseRequest(**missing)

    invalid_type = dict(VALID, AGE="not-a-number")
    with pytest.raises(ValidationError):
        HeartDiseaseRequest(**invalid_type)

    with pytest.raises(ValidationError):
        HeartDiseaseRequest(**dict(VALID, AGE=-1))


@pytest.mark.skipif(
    not MODEL_ARTIFACT_AVAILABLE,
    reason="Local Heart Disease model artifact is not available",
)
def test_model_loading_is_lazy_and_failures_are_clear():
    HeartDiseaseInferenceService.reset_model()
    assert HeartDiseaseInferenceService._model is None
    HeartDiseaseInferenceService.predict(HeartDiseaseRequest(**VALID))
    assert HeartDiseaseInferenceService._model is not None
    HeartDiseaseInferenceService.reset_model()
    with pytest.raises(FileNotFoundError, match="artifact not found"):
        HeartDiseaseInferenceService.predict(
            HeartDiseaseRequest(**VALID),
            model_path=Path("missing-heart-model.joblib"),
        )


@pytest.mark.skipif(
    not MODEL_ARTIFACT_AVAILABLE,
    reason="Local Heart Disease model artifact is not available",
)
def test_api_route_validates_and_returns_prediction():
    client = TestClient(app)
    response = client.post("/api/ai/heart-disease", json=VALID, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_type"] == "HEART_DISEASE_RISK"
    assert data["input_type"] == "HEALTH_PARAMETERS"
    assert data["prediction_id"].startswith("pred_")
    assert data["result"]["model_version"] == MODEL_VERSION
    assert data["result"]["disclaimer"] == DISCLAIMER


def test_api_route_rejects_missing_feature():
    client = TestClient(app)
    payload = dict(VALID)
    del payload["AP_LOW"]
    response = client.post("/api/ai/heart-disease", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 422


def test_api_route_requires_authentication():
    response = TestClient(app).post("/api/ai/heart-disease", json=VALID)
    assert response.status_code == 401


def test_openapi_exposes_heart_disease_route():
    openapi = TestClient(app).get("/openapi.json")
    assert openapi.status_code == 200
    schema = openapi.json()
    assert "/api/ai/heart-disease" in schema["paths"]
    response_schema = schema["paths"]["/api/ai/heart-disease"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert response_schema["$ref"].endswith("/CommonPredictionResponse")


def test_api_route_returns_service_unavailable_when_model_is_missing(monkeypatch):
    def missing_model(cls, model_path=None):
        raise FileNotFoundError("missing model artifact")

    monkeypatch.setattr(
        HeartDiseaseInferenceService,
        "load_model",
        classmethod(missing_model),
    )
    response = TestClient(app).post(
        "/api/ai/heart-disease",
        json=VALID,
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Heart Disease model is unavailable."


def test_api_route_persists_common_record_and_exposes_history(monkeypatch):
    member_id = "heart-history-member"
    payload = dict(VALID, family_member_id=member_id, appointment_id="appointment-123")

    monkeypatch.setattr(
        HeartDiseaseInferenceService,
        "predict",
        classmethod(lambda cls, request: _stubbed_result()),
    )

    with TestClient(app) as client:
        response = client.post("/api/ai/heart-disease", json=payload, headers=AUTH_HEADERS)
        assert response.status_code == 200
        data = response.json()

        assert data["family_member_id"] == member_id
        assert data["appointment_id"] == "appointment-123"
        assert data["prediction_type"] == "HEART_DISEASE_RISK"
        assert data["input_type"] == "HEALTH_PARAMETERS"
        assert data["risk_level"] == "HIGH"
        assert data["risk_score"] == 0.73
        assert data["confidence"] == 0.73
        assert data["model_name"] == "heart_disease_risk"
        assert data["model_version"] == MODEL_VERSION
        assert set(data["input_data"]) == set(_stubbed_result()["feature_order"])
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
        HeartDiseaseInferenceService,
        "predict",
        classmethod(lambda cls, request: _stubbed_result()),
    )
    monkeypatch.setattr(Database, "save_prediction", classmethod(fail_save))

    response = TestClient(app).post(
        "/api/ai/heart-disease",
        json=VALID,
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 500
    assert response.json()["detail"] == "Heart Disease risk assessment failed."
