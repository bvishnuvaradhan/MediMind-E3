import io
import os
from unittest.mock import AsyncMock, patch

import jwt
from fastapi.testclient import TestClient
from PIL import Image

from api.index import app as vercel_app
from app.core.config import settings


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


def test_vercel_entrypoint_exports_fastapi_and_health():
    with TestClient(vercel_app) as client:
        resp = client.get("/health")
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


def test_fracture_blob_url_accepts_vercel_blob_and_infers():
    token = _make_family_token()
    png_bytes = _valid_png_bytes()

    with patch(
        "app.api.v1.fracture._fetch_blob_image",
        new=AsyncMock(return_value=(png_bytes, "image/png")),
    ):
        with TestClient(vercel_app) as client:
            resp = client.post(
                "/api/ai/fracture",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "family_member_id": "MEM-FAM-001-01",
                    "blob_url": "https://teststore.public.blob.vercel-storage.com/wrist-xray-123.png",
                    "filename": "wrist-xray.png",
                },
            )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["prediction_type"] == "FRACTURE_DETECTION"
    assert "risk_score" in body
    assert "possibleFracture" in body["result"]
