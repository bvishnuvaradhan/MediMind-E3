"""Lazy-loaded Diabetes risk inference service."""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.models.diabetes.diabetes_preprocessing import DIABETES_FEATURES
from app.core.database import Database
from app.schemas.prediction_schemas import (
    DiabetesRequest,
    InputType,
    PredictionType,
)


MODEL_VERSION = "0.1.0"
THRESHOLD = 0.25  # Tuned on validation set (max recall under specificity floor 0.60)
MODEL_PATH = (
    Path(__file__).parents[2] / "artifacts" / "diabetes" / "best_model.joblib"
)
DISCLAIMER = (
    "This is an AI-assisted diabetes risk estimate, not a medical diagnosis. "
    "Consult a qualified healthcare professional."
)


class DiabetesInferenceService:
    """Lazy-loading diabetes risk inference service.

    The Random Forest (or best selected) model is loaded once on first use
    and cached for the lifetime of the process. Supports stub injection for
    testing via reset_model().
    """

    _model: Optional[Any] = None

    @classmethod
    def load_model(cls, model_path: str | Path = MODEL_PATH) -> Any:
        """Load the diabetes model artifact lazily.

        Raises:
            FileNotFoundError: If the model artifact does not exist at model_path.
        """
        if cls._model is None:
            path = Path(model_path)
            if not path.exists():
                raise FileNotFoundError(
                    f"Diabetes model artifact not found: {path}"
                )
            cls._model = joblib.load(path)
        return cls._model

    @classmethod
    def reset_model(cls) -> None:
        """Clear the cached model — used in tests to isolate inference state."""
        cls._model = None

    @classmethod
    def predict(
        cls,
        request: DiabetesRequest,
        model_path: str | Path = MODEL_PATH,
    ) -> Dict[str, Any]:
        """Run inference for a single patient record.

        Args:
            request:    Validated DiabetesRequest with all 8 feature fields.
            model_path: Override for testing against a non-default artifact path.

        Returns:
            Dictionary containing risk_probability, risk_category, threshold,
            model metadata, feature_order, and disclaimer.

        Raises:
            FileNotFoundError: Model artifact is missing.
            ValueError:        Non-finite feature values detected.
        """
        values = [getattr(request, feature) for feature in DIABETES_FEATURES]
        numeric_values = np.asarray(values, dtype=float)
        if not np.isfinite(numeric_values).all():
            raise ValueError("All Diabetes features must be finite numbers.")

        model = cls.load_model(model_path)
        feature_frame = pd.DataFrame([numeric_values], columns=DIABETES_FEATURES)
        probability = float(model.predict_proba(feature_frame)[0, 1])

        return {
            "risk_probability": probability,
            "risk_category": "HIGH" if probability >= THRESHOLD else "LOW",
            "threshold": THRESHOLD,
            "model_name": "diabetes_risk",
            "model_version": MODEL_VERSION,
            "feature_order": DIABETES_FEATURES,
            "disclaimer": DISCLAIMER,
        }

    @classmethod
    async def predict_and_persist(
        cls,
        request: DiabetesRequest,
    ) -> Dict[str, Any]:
        """Run inference and persist the result in the shared prediction history.

        Args:
            request: Validated DiabetesRequest.

        Returns:
            Full CommonPredictionResponse-compatible prediction record.
        """
        result = cls.predict(request)
        risk_probability = result["risk_probability"]

        prediction_record = {
            "prediction_id": f"pred_{uuid.uuid4().hex[:12]}",
            "family_member_id": request.family_member_id,
            "appointment_id": request.appointment_id,
            "prediction_type": PredictionType.DIABETES_RISK.value,
            "input_type": InputType.HEALTH_PARAMETERS.value,
            "input_data": {
                feature: getattr(request, feature)
                for feature in DIABETES_FEATURES
            },
            "result": result,
            "risk_level": result["risk_category"],
            "risk_score": risk_probability,
            # The model exposes a risk probability only. It is retained here as
            # the available confidence signal, not as independently calibrated
            # confidence.
            "confidence": risk_probability,
            "model_name": result["model_name"],
            "model_version": result["model_version"],
            "explanation_reference": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        saved_id = await Database.save_prediction(prediction_record)
        if saved_id and not prediction_record.get("_id"):
            prediction_record["_id"] = saved_id

        return prediction_record
