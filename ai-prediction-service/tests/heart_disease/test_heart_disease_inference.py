from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.core.config import settings
from app.schemas.prediction_schemas import HeartDiseaseRequest
from app.services.heart_disease_service import (
    DISCLAIMER,
    MODEL_VERSION,
    THRESHOLD,
    HeartDiseaseInferenceService,
)


AUTH_HEADERS = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
MODEL_PATH = Path(__file__).parents[2] / "artifacts" / "heart_disease" / "random_forest.joblib"
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


def test_api_route_validates_and_returns_prediction():
    client = TestClient(app)
    response = client.post("/api/ai/heart-disease", json=VALID, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_type"] == "HEART_DISEASE_RISK"
    assert data["result"]["model_version"] == MODEL_VERSION
    assert data["result"]["disclaimer"] == DISCLAIMER


def test_api_route_rejects_missing_feature():
    client = TestClient(app)
    payload = dict(VALID)
    del payload["AP_LOW"]
    response = client.post("/api/ai/heart-disease", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 422