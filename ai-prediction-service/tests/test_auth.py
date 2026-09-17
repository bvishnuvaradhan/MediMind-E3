import jwt
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import Settings, settings
from app.services.heart_disease_service import HeartDiseaseInferenceService

client = TestClient(app)

HEART_PAYLOAD = {
    "family_member_id": "mem_100",
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


def _payload_for(path: str, member_id: str) -> dict:
    if path == "/api/ai/heart-disease":
        return dict(HEART_PAYLOAD, family_member_id=member_id)
    return {"family_member_id": member_id, "text": "Mild headache today"}


def _stub_heart_persistence(monkeypatch) -> None:
    async def fake_persist(cls, request):
        return {
            "prediction_id": "pred_auth_test_001",
            "family_member_id": request.family_member_id,
            "appointment_id": request.appointment_id,
            "prediction_type": "HEART_DISEASE_RISK",
            "input_type": "HEALTH_PARAMETERS",
            "input_data": {},
            "result": {},
            "risk_level": "LOW",
            "risk_score": 0.1,
            "confidence": 0.1,
            "model_name": "heart_disease_risk",
            "model_version": "0.2.0",
            "explanation_reference": None,
            "created_at": "2026-01-01T00:00:00+00:00",
        }

    monkeypatch.setattr(
        HeartDiseaseInferenceService,
        "predict_and_persist",
        classmethod(fake_persist),
    )

def create_test_token(user_id: str, role: str = "FAMILY", family_member_ids: list = None) -> str:
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "role": role,
        "family_member_ids": family_member_ids or [user_id]
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_missing_auth_header_returns_401(path):
    response = client.post(path, json=_payload_for(path, "mem_100"))
    assert response.status_code == 401

@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_internal_service_key_bypasses_user_jwt(path, monkeypatch):
    if path == "/api/ai/heart-disease":
        _stub_heart_persistence(monkeypatch)
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    response = client.post(path, json=_payload_for(path, "mem_100"), headers=headers)
    assert response.status_code == 200

@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_valid_family_jwt_authorized_exact_member(path, monkeypatch):
    if path == "/api/ai/heart-disease":
        _stub_heart_persistence(monkeypatch)
    token = create_test_token("mem_100", role="FAMILY", family_member_ids=["mem_100", "mem_child_1"])
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(path, json=_payload_for(path, "mem_child_1"), headers=headers)
    assert response.status_code == 200


@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_documented_identity_claims_work_with_exact_member_scope(path, monkeypatch):
    if path == "/api/ai/heart-disease":
        _stub_heart_persistence(monkeypatch)
    token = jwt.encode(
        {
            "userId": "family-auth-user-001",
            "referenceId": "family-profile-001",
            "role": "FAMILY",
            "family_member_ids": ["mem_child_1"],
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    response = client.post(
        path,
        json=_payload_for(path, "mem_child_1"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_family_jwt_non_owned_member_returns_403(path):
    token = create_test_token("mem_100", role="FAMILY", family_member_ids=["mem_100"])
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(path, json=_payload_for(path, "unauthorized_other_family_member"), headers=headers)
    assert response.status_code == 403


@pytest.mark.parametrize("member_id", ["mem_100_suffix", "prefix_mem_100", "other_mem_100_record"])
@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_family_member_id_collisions_return_403(path, member_id):
    token = create_test_token("mem_100", role="FAMILY", family_member_ids=["mem_100"])
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(path, json=_payload_for(path, member_id), headers=headers)
    assert response.status_code == 403


@pytest.mark.parametrize("role", ["DOCTOR", "DEPARTMENT_HEAD", "HOSPITAL_ADMIN", "CHAIRMAN"])
@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_privileged_roles_cannot_access_member_predictions_directly(path, role):
    token = create_test_token("privileged_001", role=role)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(path, json=_payload_for(path, "mem_100"), headers=headers)
    assert response.status_code == 403


@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
@pytest.mark.parametrize(
    "internal_key",
    ["wrong-internal-service-key", "medimind_internal_microservice_secret_key"],
)
def test_wrong_or_former_default_internal_service_key_returns_401(path, internal_key):
    response = client.post(
        path,
        json=_payload_for(path, "mem_100"),
        headers={"X-Internal-Service-Key": internal_key},
    )
    assert response.status_code == 401


@pytest.mark.parametrize("path", ["/api/ai/general-health", "/api/ai/heart-disease"])
def test_former_default_jwt_secret_cannot_authenticate(path):
    token = jwt.encode(
        {"sub": "mem_100", "role": "FAMILY", "family_member_ids": ["mem_100"]},
        "medimind_super_secret_jwt_key_2026",
        algorithm=settings.JWT_ALGORITHM,
    )
    response = client.post(
        path,
        json=_payload_for(path, "mem_100"),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


@pytest.mark.parametrize("missing_name", ["JWT_SECRET", "INTERNAL_SERVICE_KEY"])
def test_missing_required_security_secret_fails_configuration(monkeypatch, missing_name):
    monkeypatch.delenv(missing_name, raising=False)
    with pytest.raises(RuntimeError, match=missing_name):
        Settings()
