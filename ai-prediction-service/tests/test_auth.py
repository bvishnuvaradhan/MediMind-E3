import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def create_test_token(user_id: str, role: str = "FAMILY", family_member_ids: list = None) -> str:
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "role": role,
        "family_member_ids": family_member_ids or [user_id]
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def test_missing_auth_header_returns_401():
    response = client.post("/api/ai/general-health", json={
        "family_member_id": "mem_100",
        "text": "Fever and cough"
    })
    assert response.status_code == 401

def test_internal_service_key_bypasses_user_jwt():
    headers = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
    payload = {
        "family_member_id": "mem_100",
        "text": "Having severe chest pain"
    }
    response = client.post("/api/ai/general-health", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["risk_level"] == "HIGH"

def test_valid_user_jwt_authorized_member():
    token = create_test_token("mem_100", role="FAMILY", family_member_ids=["mem_100", "mem_child_1"])
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "family_member_id": "mem_child_1",
        "text": "Mild headache and runny nose"
    }
    response = client.post("/api/ai/general-health", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["risk_level"] == "LOW"

def test_user_jwt_unauthorized_member_returns_403():
    token = create_test_token("mem_100", role="FAMILY", family_member_ids=["mem_100"])
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "family_member_id": "unauthorized_other_family_member",
        "text": "Persistent cough"
    }
    response = client.post("/api/ai/general-health", json=payload, headers=headers)
    assert response.status_code == 403

def test_doctor_jwt_access_granted():
    token = create_test_token("doc_55", role="DOCTOR")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "family_member_id": "any_patient_member_99",
        "text": "Severe headache and vomiting"
    }
    response = client.post("/api/ai/general-health", json=payload, headers=headers)
    assert response.status_code == 200
