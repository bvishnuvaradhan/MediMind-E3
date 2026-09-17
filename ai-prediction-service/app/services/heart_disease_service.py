"""Lazy-loaded Heart Disease risk inference service."""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.models.heart_disease.heart_disease_preprocessing import CARDIOVASCULAR_FEATURES
from app.core.database import Database
from app.schemas.prediction_schemas import (
    HeartDiseaseRequest,
    InputType,
    PredictionType,
)


MODEL_VERSION = "0.2.0"
THRESHOLD = 0.4
MODEL_PATH = Path(__file__).parents[2] / "artifacts" / "heart_disease" / "random_forest.joblib"
DISCLAIMER = "This is an AI-assisted cardiovascular risk estimate, not a medical diagnosis. Consult a qualified healthcare professional."


class HeartDiseaseInferenceService:
    _model: Optional[Any] = None

    @classmethod
    def load_model(cls, model_path: str | Path = MODEL_PATH) -> Any:
        if cls._model is None:
            path = Path(model_path)
            if not path.exists():
                raise FileNotFoundError(f"Heart Disease model artifact not found: {path}")
            cls._model = joblib.load(path)
        return cls._model

    @classmethod
    def reset_model(cls) -> None:
        cls._model = None

    @classmethod
    def predict(cls, request: HeartDiseaseRequest, model_path: str | Path = MODEL_PATH) -> Dict[str, Any]:
        values = [getattr(request, feature) for feature in CARDIOVASCULAR_FEATURES]
        numeric_values = np.asarray(values, dtype=float)
        if not np.isfinite(numeric_values).all():
            raise ValueError("All Heart Disease features must be finite numbers")
        model = cls.load_model(model_path)
        feature_frame = pd.DataFrame([numeric_values], columns=CARDIOVASCULAR_FEATURES)
        probability = float(model.predict_proba(feature_frame)[0, 1])
        return {
            "risk_probability": probability,
            "risk_category": "HIGH" if probability >= THRESHOLD else "LOW",
            "threshold": THRESHOLD,
            "model_name": "heart_disease_risk",
            "model_version": MODEL_VERSION,
            "feature_order": CARDIOVASCULAR_FEATURES,
            "disclaimer": DISCLAIMER,
        }

    @classmethod
    async def predict_and_persist(cls, request: HeartDiseaseRequest) -> Dict[str, Any]:
        """Run inference and persist the result in the shared prediction history."""
        result = cls.predict(request)
        risk_probability = result["risk_probability"]

        prediction_record = {
            "prediction_id": f"pred_{uuid.uuid4().hex[:12]}",
            "family_member_id": request.family_member_id,
            "appointment_id": request.appointment_id,
            "prediction_type": PredictionType.HEART_DISEASE_RISK.value,
            "input_type": InputType.HEALTH_PARAMETERS.value,
            "input_data": {
                feature: getattr(request, feature)
                for feature in CARDIOVASCULAR_FEATURES
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
