"""
conftest.py — Shared pytest fixtures for MediMind AI Prediction Service tests.

Provides:
  - test_client          : FastAPI TestClient (in-memory DB fallback, no MongoDB required)
  - internal_auth_headers: Headers using X-Internal-Service-Key for service-to-service calls
  - family_token         : JWT for a FAMILY-role user owning a specific family member
  - doctor_token         : JWT for a DOCTOR-role user (full access)
  - make_family_token    : Factory fixture to create custom FAMILY JWTs
  - cleanup_test_database: Autouse session fixture cleaning up isolated test DB
"""

import logging
import os
import re
import uuid

import jwt
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

logger = logging.getLogger("ai_service.tests")

# Explicit session-isolated test database identifier
_SESSION_ID = uuid.uuid4().hex[:8]
_SESSION_TEST_DB_NAME = f"medimind_ai_test_{_SESSION_ID}"

os.environ["DB_NAME"] = _SESSION_TEST_DB_NAME
os.environ["JWT_SECRET"] = "test-only-jwt-secret-not-for-deployment"
os.environ["INTERNAL_SERVICE_KEY"] = "test-only-internal-service-key-not-for-deployment"

from app.main import app
from app.core.config import settings


# ─────────────────────────────────────────────────────────────────────────────
# Session Database Lifecycle & Cleanup
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database():
    """
    Session-level fixture that automatically drops the session's isolated test database
    (medimind_ai_test_<unique_session_id>) upon pytest completion, ensuring clean state.
    Strictly guards against dropping any production or non-session database.
    """
    yield

    # Strict guard verification before teardown
    expected_pattern = re.compile(r"^medimind_ai_test_[0-9a-f]{8}$")
    if (
        not _SESSION_TEST_DB_NAME
        or not expected_pattern.match(_SESSION_TEST_DB_NAME)
        or _SESSION_TEST_DB_NAME == "medimind_ai"
        or _SESSION_TEST_DB_NAME != f"medimind_ai_test_{_SESSION_ID}"
    ):
        logger.error(
            "Teardown guard aborted: '%s' is not a valid isolated test database name for session '%s'.",
            _SESSION_TEST_DB_NAME,
            _SESSION_ID,
        )
        return

    # Close any lingering async Motor client connections if active
    try:
        from app.core.database import Database
        if Database.client:
            Database.client.close()
            Database.client = None
            Database.db = None
    except Exception as exc:
        logger.warning("Error closing async Database client during teardown: %s", exc)

    # Connect synchronously with short timeout to drop the session test database
    mongo_client = None
    try:
        mongo_client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        existing_dbs = mongo_client.list_database_names()
        if _SESSION_TEST_DB_NAME in existing_dbs:
            mongo_client.drop_database(_SESSION_TEST_DB_NAME)
            logger.info("Successfully dropped session test database '%s'.", _SESSION_TEST_DB_NAME)
        else:
            logger.info("Session test database '%s' was not persisted to disk; no drop needed.", _SESSION_TEST_DB_NAME)
    except Exception as exc:
        logger.warning(
            "Failed to clean up test database '%s' during teardown: %s",
            _SESSION_TEST_DB_NAME,
            exc,
        )
    finally:
        if mongo_client:
            mongo_client.close()


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
