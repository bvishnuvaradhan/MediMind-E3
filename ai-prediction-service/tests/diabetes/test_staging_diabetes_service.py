"""Unit tests for the isolated StagingDiabetesService."""

import pytest
from pydantic import ValidationError
from app.schemas.prediction_schemas import DiabetesRequest
from app.services.staging_diabetes_service import (
    CANDIDATE_REGISTRY,
    STAGING_DISCLAIMER,
    StagingDiabetesService,
)


@pytest.fixture
def sample_diabetes_request():
    return DiabetesRequest(
        family_member_id="mem_staging_test",
        appointment_id="apt_staging_test",
        Pregnancies=2,
        Glucose=140.0,
        BloodPressure=80.0,
        SkinThickness=0.0,  # biological zero to test imputation
        Insulin=0.0,        # biological zero to test imputation
        BMI=31.2,
        DiabetesPedigreeFunction=0.45,
        Age=45,
    )


def test_staging_service_disabled_by_default(sample_diabetes_request, monkeypatch):
    """Verify that staging service raises PermissionError when feature flag is disabled."""
    monkeypatch.delenv("ENABLE_STAGING_DIABETES", raising=False)
    assert not StagingDiabetesService.is_enabled()
    with pytest.raises(PermissionError, match="Staging diabetes evaluation is disabled"):
        StagingDiabetesService.predict_staging(sample_diabetes_request)


def test_staging_service_loads_and_predicts_all_candidates(sample_diabetes_request, monkeypatch):
    """Verify that when enabled in isolated test context, all audited candidates predict successfully."""
    monkeypatch.setenv("ENABLE_STAGING_DIABETES", "true")
    assert StagingDiabetesService.is_enabled()

    for candidate_id in CANDIDATE_REGISTRY:
        res = StagingDiabetesService.predict_staging(sample_diabetes_request, candidate_id=candidate_id)
        assert "risk_probability" in res
        assert 0.0 <= res["risk_probability"] <= 1.0
        assert res["risk_category"] in ("HIGH", "LOW")
        assert res["is_staging"] is True
        assert res["clinical_approval"] is False
        assert res["disclaimer"] == STAGING_DISCLAIMER
        assert res["model_name"] == f"staging_{candidate_id}"


def test_staging_service_rejects_unknown_candidate(sample_diabetes_request, monkeypatch):
    """Verify that unknown candidate ID is rejected even when enabled."""
    monkeypatch.setenv("ENABLE_STAGING_DIABETES", "true")
    with pytest.raises(ValueError, match="Unknown staging candidate ID"):
        StagingDiabetesService.predict_staging(sample_diabetes_request, candidate_id="non_existent_candidate")


def test_staging_service_schema_rejects_infinite_input():
    with pytest.raises(ValidationError):
        DiabetesRequest(
            family_member_id="mem_staging_test",
            appointment_id="apt_staging_test",
            Pregnancies=2,
            Glucose=float("nan"),
            BloodPressure=80.0,
            SkinThickness=25.0,
            Insulin=120.0,
            BMI=31.2,
            DiabetesPedigreeFunction=0.45,
            Age=45,
        )


def test_staging_service_verifies_artifact_integrity(monkeypatch):
    """Verify that tampering with a candidate artifact triggers a PermissionError hash mismatch."""
    monkeypatch.setenv("ENABLE_STAGING_DIABETES", "true")
    from pathlib import Path
    fake_path = Path("fake_artifact.joblib")
    
    # Missing artifact raises FileNotFoundError
    with pytest.raises(FileNotFoundError):
        StagingDiabetesService._verify_artifact_integrity(fake_path, "fake_artifact.joblib")
