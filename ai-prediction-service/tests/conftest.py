"""
conftest.py — Shared pytest fixtures for MediMind AI Prediction Service tests.

Provides:
  - test_client          : FastAPI TestClient (in-memory DB fallback, no MongoDB required)
  - internal_auth_headers: Headers using X-Internal-Service-Key for service-to-service calls
  - family_token         : JWT for a FAMILY-role user owning a specific family member
  - doctor_token         : JWT for a DOCTOR-role user (full access)
  - make_family_token    : Factory fixture to create custom FAMILY JWTs
"""

import os
import uuid

import pytest
import jwt
from fastapi.testclient import TestClient

os.environ["DB_NAME"] = f"medimind_ai_test_{uuid.uuid4().hex[:8]}"
os.environ["JWT_SECRET"] = "test-only-jwt-secret-not-for-deployment"
os.environ["INTERNAL_SERVICE_KEY"] = "test-only-internal-service-key-not-for-deployment"

from app.main import app
from app.core.config import settings


# ─────────────────────────────────────────────────────────────────────────────
# Core client fixture
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def test_client() -> TestClient:
    """
    Returns a synchronous TestClient for the FastAPI app.
    The DB layer falls back to an in-memory store automatically
    when MongoDB is not available (development / CI environment).
    """
    with TestClient(app) as client:
        yield client


# ─────────────────────────────────────────────────────────────────────────────
# Authentication headers / tokens
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def internal_auth_headers() -> dict:
    """Headers that mimic an API Gateway internal service call."""
    return {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}


@pytest.fixture(scope="session")
def make_family_token():
    """
    Factory fixture.  Usage:
        token = make_family_token(user_id="u1", family_member_ids=["m1", "m2"])
    """
    def _make(user_id: str, family_member_ids: list | None = None) -> str:
        payload = {
            "sub": user_id,
            "user_id": user_id,
            "role": "FAMILY",
            "family_member_ids": family_member_ids or [user_id],
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return _make


@pytest.fixture(scope="session")
def family_token(make_family_token) -> str:
    """Default FAMILY JWT owning member 'test_mem_001'."""
    return make_family_token("test_mem_001", ["test_mem_001", "test_child_002"])


@pytest.fixture(scope="session")
def doctor_token() -> str:
    """JWT for a DOCTOR role — grants access to any family member."""
    payload = {"sub": "doc_001", "user_id": "doc_001", "role": "DOCTOR"}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
