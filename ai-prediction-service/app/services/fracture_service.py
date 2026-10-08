"""Lazy-loaded Fracture Detection inference service."""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Union

import torch

from app.models.fracture.fracture_preprocessing import (
    validate_image_bytes,
    preprocess_image_bytes,
)
from app.models.fracture.fracture_training import FractureClassifier
from app.core.database import Database
from app.schemas.prediction_schemas import (
    InputType,
    PredictionType,
)


MODEL_NAME = "fracture_cnn"
MODEL_VERSION = "0.1.0"
THRESHOLD = 0.1800  # Stored validation-calibrated threshold
MODEL_PATH = Path(__file__).parents[2] / "artifacts" / "fracture" / "best_model.pt"
DISCLAIMER = "AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional."


class FractureInferenceService:
    """
    Lazy-loading Fracture Detection inference service.

    Loads the production ResNet-18 model artifact lazily on first use,
    applies the validation-calibrated threshold (0.1800), validates and
    preprocesses plain radiograph images (PNG, JPEG, DICOM preamble),
    and persists predictions to MongoDB.
    """

    _model: Optional[FractureClassifier] = None
    _threshold: float = THRESHOLD
    _model_version: str = MODEL_VERSION

    @classmethod
    def load_model(cls, model_path: Union[str, Path] = MODEL_PATH) -> FractureClassifier:
        """
        Load the fracture model artifact lazily from disk.

        Raises:
            FileNotFoundError: If the model artifact does not exist at model_path.
        """
        if cls._model is None:
            path = Path(model_path)
            if not path.exists():
                raise FileNotFoundError(f"Fracture Detection model artifact not found: {path}")

            checkpoint = torch.load(path, map_location="cpu")
            model = FractureClassifier(pretrained=False)

            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                model.load_state_dict(checkpoint["model_state_dict"])
                if "calibrated_threshold" in checkpoint:
                    cls._threshold = float(checkpoint["calibrated_threshold"])
                if "model_version" in checkpoint:
                    cls._model_version = str(checkpoint["model_version"])
            elif isinstance(checkpoint, dict):
                model.load_state_dict(checkpoint)
            else:
                raise ValueError("Invalid checkpoint format.")

            model.eval()
            cls._model = model

        return cls._model

    @classmethod
    def reset_model(cls) -> None:
        """Clear cached model and reset state for testing isolation."""
        cls._model = None
        cls._threshold = THRESHOLD
        cls._model_version = MODEL_VERSION

    @classmethod
    def predict(
        cls,
        image_bytes: bytes,
        filename: Optional[str] = None,
        model_path: Union[str, Path] = MODEL_PATH,
    ) -> Dict[str, Any]:
        """
        Run inference on raw image bytes for fracture detection.

        Args:
            image_bytes: Raw bytes of the musculoskeletal radiograph image.
            filename: Optional source file name.
            model_path: Path to the trained PyTorch checkpoint.

        Returns:
            Dictionary with possibleFracture, confidence, risk_score, risk_level,
            threshold, model_name, model_version, and disclaimer.

        Raises:
            FileNotFoundError: If the model artifact is missing.
            ValueError: If image validation or preprocessing fails.
        """
        # Validate image format, integrity, size, and dimensions
        meta = validate_image_bytes(image_bytes)

        # Standardize and preprocess to normalized tensor [3, 224, 224]
        tensor = preprocess_image_bytes(image_bytes)
        batch = tensor.unsqueeze(0)  # Shape [1, 3, 224, 224]

        # Load model and run inference
        model = cls.load_model(model_path)
        with torch.no_grad():
            probability = float(model.predict_proba(batch)[0, 0].item())

        threshold = cls._threshold
        possible_fracture = probability >= threshold
        risk_level = "HIGH" if possible_fracture else "LOW"

        return {
            "possibleFracture": bool(possible_fracture),
            "confidence": round(probability, 4),
            "risk_score": round(probability, 4),
            "risk_level": risk_level,
            "threshold": round(threshold, 4),
            "model_name": MODEL_NAME,
            "model_version": cls._model_version,
            "image_metadata": {
                "format": meta.get("format"),
                "width": meta.get("width"),
                "height": meta.get("height"),
                "size_bytes": meta.get("size_bytes"),
                "filename": filename or "image",
            },
            "disclaimer": DISCLAIMER,
        }

    @classmethod
    async def predict_and_persist(
        cls,
        image_bytes: bytes,
        family_member_id: str,
        appointment_id: Optional[str] = None,
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
        model_path: Union[str, Path] = MODEL_PATH,
    ) -> Dict[str, Any]:
        """
        Run fracture inference and persist the prediction record to MongoDB.

        Args:
            image_bytes: Raw image bytes.
            family_member_id: Required family member / patient ID.
            appointment_id: Optional associated appointment ID.
            filename: Original uploaded file name.
            content_type: MIME content type of uploaded file.
            model_path: Checkpoint file path.

        Returns:
            CommonPredictionResponse-compatible dictionary.
        """
        result = cls.predict(image_bytes, filename=filename, model_path=model_path)
        risk_score = result["risk_score"]
        confidence = result["confidence"]
        risk_level = result["risk_level"]

        prediction_record = {
            "prediction_id": f"pred_{uuid.uuid4().hex[:12]}",
            "family_member_id": family_member_id,
            "appointment_id": appointment_id,
            "prediction_type": PredictionType.FRACTURE_DETECTION.value,
            "input_type": InputType.IMAGE.value,
            "input_data": {
                "filename": filename or "image.jpg",
                "content_type": content_type or "image/jpeg",
                "size_bytes": len(image_bytes),
                "format": result["image_metadata"].get("format"),
                "dimensions": [
                    result["image_metadata"].get("width"),
                    result["image_metadata"].get("height"),
                ],
            },
            "result": result,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "confidence": confidence,
            "model_name": result["model_name"],
            "model_version": result["model_version"],
            "explanation_reference": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        saved_id = await Database.save_prediction(prediction_record)
        if saved_id and not prediction_record.get("_id"):
            prediction_record["_id"] = saved_id

        return prediction_record
