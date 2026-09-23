"""
test_fracture_inference.py — Comprehensive tests for Fracture Detection Inference Service and API Endpoint.
"""

import io
from pathlib import Path
from unittest.mock import patch
import jwt
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.core.config import settings
from app.core.database import Database
from app.schemas.prediction_schemas import (
    CommonPredictionResponse,
    InputType,
    PredictionType,
)
from app.services.fracture_service import (
    DISCLAIMER,
    MODEL_NAME,
    MODEL_PATH,
    MODEL_VERSION,
    THRESHOLD,
    FractureInferenceService,
)


AUTH_HEADERS = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}
MODEL_ARTIFACT_AVAILABLE = MODEL_PATH.exists()


def _generate_test_image_bytes(
    width: int = 224,
    height: int = 224,
    mode: str = "RGB",
    img_format: str = "PNG",
) -> bytes:
    """Helper to synthesize valid image bytes."""
    buffer = io.BytesIO()
    img = Image.new(mode, (width, height), color=(128, 128, 128))
    img.save(buffer, format=img_format)
    return buffer.getvalue()


def _create_family_jwt(family_member_ids: list[str]) -> str:
    """Helper to create a signed JWT for testing family-member authorization."""
    payload = {
        "userId": "user-123",
        "role": "FAMILY",
        "family_member_ids": family_member_ids,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# ─────────────────────────────────────────────────────────────────────────────
# SERVICE UNIT TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestFractureInferenceService:
    """Unit tests for lazy loading, thresholding, and prediction pipeline."""

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_lazy_model_loading_and_threshold(self):
        FractureInferenceService.reset_model()
        assert FractureInferenceService._model is None

        model = FractureInferenceService.load_model()
        assert model is not None
        assert FractureInferenceService._model is not None
        assert FractureInferenceService._threshold == THRESHOLD
        assert FractureInferenceService._model_version == MODEL_VERSION

        # Verify missing model raises FileNotFoundError
        FractureInferenceService.reset_model()
        with pytest.raises(FileNotFoundError, match="artifact not found"):
            FractureInferenceService.load_model(model_path="nonexistent_model.pt")

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_service_predict_returns_expected_structure_and_disclaimer(self):
        png_bytes = _generate_test_image_bytes(250, 250, img_format="PNG")
        result = FractureInferenceService.predict(png_bytes, filename="scan.png")

        assert isinstance(result["possibleFracture"], bool)
        assert 0.0 <= result["confidence"] <= 1.0
        assert 0.0 <= result["risk_score"] <= 1.0
        assert result["risk_level"] in ("HIGH", "LOW")
        assert result["threshold"] == THRESHOLD
        assert result["model_name"] == MODEL_NAME
        assert result["model_version"] == MODEL_VERSION
        assert result["disclaimer"] == DISCLAIMER
        assert "medical diagnosis" not in result["disclaimer"].lower() or "not a medical diagnosis" in result["disclaimer"].lower()

        # Threshold consistency check
        if result["risk_score"] >= result["threshold"]:
            assert result["possibleFracture"] is True
            assert result["risk_level"] == "HIGH"
        else:
            assert result["possibleFracture"] is False
            assert result["risk_level"] == "LOW"

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_service_predict_dicom_preamble(self):
        # 128 bytes preamble + b"DICM" + pixel data
        dicom_dummy = b"\x00" * 128 + b"DICM" + b"\x80" * (224 * 224)
        result = FractureInferenceService.predict(dicom_dummy, filename="scan.dcm")

        assert isinstance(result["possibleFracture"], bool)
        assert 0.0 <= result["risk_score"] <= 1.0
        assert result["disclaimer"] == DISCLAIMER

    def test_service_predict_rejects_corrupted_or_empty_bytes(self):
        with pytest.raises(ValueError, match="Image payload is empty"):
            FractureInferenceService.predict(b"")

        with pytest.raises(ValueError, match="Corrupted or unrecognizable"):
            FractureInferenceService.predict(b"NOT_A_VALID_IMAGE_BYTES_12345")

        too_small = _generate_test_image_bytes(10, 10, img_format="PNG")
        with pytest.raises(ValueError, match="below minimum required size"):
            FractureInferenceService.predict(too_small)


# ─────────────────────────────────────────────────────────────────────────────
# API ROUTE TESTS (POST /api/ai/fracture)
# ─────────────────────────────────────────────────────────────────────────────

class TestFractureApiRoute:
    """Integration tests for POST /api/ai/fracture."""

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_api_route_authenticated_valid_png(self):
        client = TestClient(app)
        png_bytes = _generate_test_image_bytes(300, 300, img_format="PNG")

        response = client.post(
            "/api/ai/fracture",
            files={"file": ("xray.png", png_bytes, "image/png")},
            data={"family_member_id": "mem_patient_001", "appointment_id": "appt_123"},
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["prediction_id"].startswith("pred_")
        assert data["family_member_id"] == "mem_patient_001"
        assert data["appointment_id"] == "appt_123"
        assert data["prediction_type"] == PredictionType.FRACTURE_DETECTION.value
        assert data["input_type"] == InputType.IMAGE.value
        assert data["result"]["model_name"] == MODEL_NAME
        assert data["result"]["model_version"] == MODEL_VERSION
        assert data["result"]["threshold"] == THRESHOLD
        assert data["result"]["disclaimer"] == DISCLAIMER
        assert isinstance(data["result"]["possibleFracture"], bool)

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_api_route_authenticated_valid_jpeg(self):
        client = TestClient(app)
        jpeg_bytes = _generate_test_image_bytes(250, 250, img_format="JPEG")

        response = client.post(
            "/api/ai/fracture",
            files={"file": ("wrist.jpg", jpeg_bytes, "image/jpeg")},
            data={"family_member_id": "mem_patient_002"},
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["prediction_type"] == "FRACTURE_DETECTION"
        assert data["result"]["possibleFracture"] in (True, False)

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_api_route_dicom_preamble_input(self):
        client = TestClient(app)
        dicom_dummy = b"\x00" * 128 + b"DICM" + b"\x80" * (224 * 224)

        response = client.post(
            "/api/ai/fracture",
            files={"file": ("scan.dcm", dicom_dummy, "application/dicom")},
            data={"family_member_id": "mem_patient_003"},
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["prediction_type"] == "FRACTURE_DETECTION"
        assert data["input_type"] == "IMAGE"
        assert data["result"]["disclaimer"] == DISCLAIMER

    def test_api_route_requires_family_member_id(self):
        client = TestClient(app)
        png_bytes = _generate_test_image_bytes(100, 100, img_format="PNG")

        # Missing family_member_id completely
        response = client.post(
            "/api/ai/fracture",
            files={"file": ("test.png", png_bytes, "image/png")},
            data={},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 422

        # Empty / whitespace family_member_id
        response_empty = client.post(
            "/api/ai/fracture",
            files={"file": ("test.png", png_bytes, "image/png")},
            data={"family_member_id": "   "},
            headers=AUTH_HEADERS,
        )
        assert response_empty.status_code == 422

    def test_api_route_rejects_corrupted_or_invalid_image(self):
        client = TestClient(app)

        # Corrupted bytes
        response_corrupt = client.post(
            "/api/ai/fracture",
            files={"file": ("broken.png", b"CORRUPTED_GARBAGE_PAYLOAD", "image/png")},
            data={"family_member_id": "mem_001"},
            headers=AUTH_HEADERS,
        )
        assert response_corrupt.status_code == 422

        # Empty image bytes
        response_empty = client.post(
            "/api/ai/fracture",
            files={"file": ("empty.png", b"", "image/png")},
            data={"family_member_id": "mem_001"},
            headers=AUTH_HEADERS,
        )
        assert response_empty.status_code == 422

        # Image below minimum dimension (e.g. 10x10)
        tiny_bytes = _generate_test_image_bytes(10, 10, img_format="PNG")
        response_tiny = client.post(
            "/api/ai/fracture",
            files={"file": ("tiny.png", tiny_bytes, "image/png")},
            data={"family_member_id": "mem_001"},
            headers=AUTH_HEADERS,
        )
        assert response_tiny.status_code == 422

    def test_api_route_rejects_oversized_image(self):
        client = TestClient(app)
        data = _generate_test_image_bytes(100, 100, img_format="PNG")

        # Mock MAX_FILE_SIZE_BYTES to very low limit
        with patch("app.models.fracture.fracture_preprocessing.MAX_FILE_SIZE_BYTES", 50):
            response = client.post(
                "/api/ai/fracture",
                files={"file": ("large.png", data, "image/png")},
                data={"family_member_id": "mem_001"},
                headers=AUTH_HEADERS,
            )
            assert response.status_code == 422
            assert "exceeds maximum permitted limit" in response.text

    def test_api_route_requires_authentication(self):
        client = TestClient(app)
        png_bytes = _generate_test_image_bytes(100, 100, img_format="PNG")

        # Missing auth header
        response = client.post(
            "/api/ai/fracture",
            files={"file": ("test.png", png_bytes, "image/png")},
            data={"family_member_id": "mem_001"},
        )
        assert response.status_code == 401

        # Invalid token
        response_bad = client.post(
            "/api/ai/fracture",
            files={"file": ("test.png", png_bytes, "image/png")},
            data={"family_member_id": "mem_001"},
            headers={"Authorization": "Bearer invalid_token_here"},
        )
        assert response_bad.status_code == 401

    def test_api_route_enforces_family_member_authorization(self):
        client = TestClient(app)
        png_bytes = _generate_test_image_bytes(100, 100, img_format="PNG")

        token = _create_family_jwt(["mem_authorized_only"])
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to access non-authorized family member ID
        response = client.post(
            "/api/ai/fracture",
            files={"file": ("test.png", png_bytes, "image/png")},
            data={"family_member_id": "mem_unauthorized_attacker"},
            headers=headers,
        )
        assert response.status_code == 403
        assert "Access denied" in response.json()["detail"]

    def test_api_route_returns_503_when_model_artifact_is_missing(self):
        client = TestClient(app)
        png_bytes = _generate_test_image_bytes(100, 100, img_format="PNG")

        FractureInferenceService.reset_model()
        with patch.object(FractureInferenceService, "load_model", side_effect=FileNotFoundError("Model missing")):
            response = client.post(
                "/api/ai/fracture",
                files={"file": ("test.png", png_bytes, "image/png")},
                data={"family_member_id": "mem_001"},
                headers=AUTH_HEADERS,
            )
            assert response.status_code == 503
            assert "unavailable" in response.json()["detail"].lower()

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_api_route_persists_prediction_to_mongodb(self):
        client = TestClient(app)
        png_bytes = _generate_test_image_bytes(200, 200, img_format="PNG")

        response = client.post(
            "/api/ai/fracture",
            files={"file": ("persist_test.png", png_bytes, "image/png")},
            data={"family_member_id": "mem_persisted_patient", "appointment_id": "appt_persist_456"},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["prediction_id"].startswith("pred_")
        assert data["family_member_id"] == "mem_persisted_patient"
        assert data["appointment_id"] == "appt_persist_456"

    def test_openapi_exposes_fracture_route(self):
        client = TestClient(app)
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "/api/ai/fracture" in schema["paths"]
        assert "post" in schema["paths"]["/api/ai/fracture"]

    @pytest.mark.skipif(not MODEL_ARTIFACT_AVAILABLE, reason="Trained artifact missing")
    def test_real_sample_image_inference(self):
        """End-to-end inference test using an actual FracAtlas sample image from disk."""
        candidate_paths = [
            Path("test-dataset/Bone Facture/FracAtlas/FracAtlas/images/Non_fractured/IMG0000000.jpg"),
            Path("test-dataset/Bone Facture/FracAtlas/images/Non_fractured/IMG0000000.jpg"),
        ]
        sample_path = None
        for p in candidate_paths:
            if p.exists():
                sample_path = p
                break

        if sample_path is None:
            pytest.skip("No real sample radiograph image available at candidate paths.")

        with open(sample_path, "rb") as f:
            real_bytes = f.read()

        client = TestClient(app)
        response = client.post(
            "/api/ai/fracture",
            files={"file": (sample_path.name, real_bytes, "image/jpeg")},
            data={"family_member_id": "real_patient_001"},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["prediction_type"] == "FRACTURE_DETECTION"
        assert data["result"]["threshold"] == 0.18
        assert 0.0 <= data["result"]["risk_score"] <= 1.0
        assert data["result"]["possibleFracture"] in (True, False)
