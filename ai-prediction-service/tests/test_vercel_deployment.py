import io
import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import jwt
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import settings
from app.main import app as vercel_app, normalize_ai_path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _make_family_token(member_ids=None):
    return jwt.encode(
        {
            "userId": "user_fam_1",
            "role": "FAMILY",
            "familyId": "FAM-001",
            "family_member_ids": member_ids or ["MEM-FAM-001-01"],
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def _valid_png_bytes() -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (64, 64), color=(128, 128, 128))
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_vercel_single_project_config_layout():
    root_config = json.loads((REPO_ROOT / "vercel.json").read_text(encoding="utf-8"))
    services = root_config["services"]

    for required_service in [
        "frontend",
        "backend",
        "auth",
        "family",
        "hospital",
        "doctor",
        "appointment",
        "records",
        "knowledge",
        "ai",
    ]:
        assert required_service in services, f"Missing service {required_service} in root vercel.json"

    assert services["ai"]["entrypoint"] == "app.main:app"
    backend_bindings = {b["env"]: b["service"] for b in services["backend"]["bindings"]}
    assert backend_bindings["AI_SERVICE_URL"] == "ai"
    assert backend_bindings["AUTH_SERVICE_URL"] == "auth"
    assert backend_bindings["APPOINTMENT_SERVICE_URL"] == "appointment"

    rewrites = root_config["rewrites"]
    sources = [r["source"] for r in rewrites]
    assert "/api/(.*)" in sources
    assert "/ai/(.*)" in sources
    assert "/(.*)" in sources
    assert sources.index("/api/(.*)") < sources.index("/(.*)")
    assert sources.index("/ai/(.*)") < sources.index("/(.*)")

    ai_vercel = json.loads((REPO_ROOT / "ai-prediction-service" / "vercel.json").read_text(encoding="utf-8"))
    assert "rewrites" not in ai_vercel
    assert not (REPO_ROOT / "ai-prediction-service" / "api" / "index.py").exists()


def test_ai_prefix_normalization_and_health_routes():
    assert normalize_ai_path("/ai") == "/health"
    assert normalize_ai_path("/ai/health") == "/health"
    assert normalize_ai_path("/ai/fracture") == "/api/ai/fracture"
    assert normalize_ai_path("/ai/api/ai/fracture") == "/api/ai/fracture"
    assert normalize_ai_path("/api/ai/diabetes") == "/api/ai/diabetes"

    with TestClient(vercel_app) as client:
        for path in ("/health", "/ai", "/ai/health"):
            resp = client.get(path)
            assert resp.status_code == 200
            body = resp.json()
            assert body["status"] == "healthy"
            assert body["eureka_enabled"] is False


def test_fracture_blob_url_rejects_non_vercel_hosts():
    token = _make_family_token()
    with TestClient(vercel_app) as client:
        for bad_url in [
            "http://example.public.blob.vercel-storage.com/xray.png",
            "https://127.0.0.1/secret.png",
            "https://evil.example.com/xray.png",
        ]:
            resp = client.post(
                "/api/ai/fracture",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "family_member_id": "MEM-FAM-001-01",
                    "blob_url": bad_url,
                    "filename": "xray.png",
                },
            )
            assert resp.status_code == 422, f"Expected 422 for {bad_url}, got {resp.status_code}"


def test_fracture_private_blob_requires_token_when_private_host():
    token = _make_family_token()
    with patch.object(settings, "BLOB_READ_WRITE_TOKEN", ""):
        with TestClient(vercel_app) as client:
            resp = client.post(
                "/ai/fracture",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "family_member_id": "MEM-FAM-001-01",
                    "blob_url": "https://teststore.private.blob.vercel-storage.com/wrist-xray-123.png",
                    "filename": "wrist-xray.png",
                },
            )
    assert resp.status_code == 503
    assert "BLOB_READ_WRITE_TOKEN" in resp.json()["detail"]


def test_fracture_blob_url_accepts_private_vercel_blob_and_infers():
    token = _make_family_token()
    png_bytes = _valid_png_bytes()

    with patch(
        "app.api.v1.fracture._fetch_blob_image",
        new=AsyncMock(return_value=(png_bytes, "image/png")),
    ):
        with TestClient(vercel_app) as client:
            for endpoint in ("/api/ai/fracture", "/ai/fracture", "/ai/api/ai/fracture"):
                resp = client.post(
                    endpoint,
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "family_member_id": "MEM-FAM-001-01",
                        "blob_url": "https://teststore.private.blob.vercel-storage.com/wrist-xray-123.png",
                        "filename": "wrist-xray.png",
                    },
                )
                assert resp.status_code == 200, resp.text
                body = resp.json()
                assert body["prediction_type"] == "FRACTURE_DETECTION"
                assert "risk_score" in body
                assert "possibleFracture" in body["result"]
