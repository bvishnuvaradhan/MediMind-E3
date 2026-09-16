"""Lazy-loaded Heart Disease risk inference service."""

from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.models.heart_disease.heart_disease_preprocessing import CARDIOVASCULAR_FEATURES
from app.schemas.prediction_schemas import HeartDiseaseRequest


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