"""Lazy-loaded Diabetes risk inference service."""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd

from app.models.diabetes.diabetes_preprocessing import DIABETES_FEATURES
from app.models.diabetes.explainability import generate_local_explanation
from app.core.database import Database
from app.services.groq_service import GroqService
from app.schemas.prediction_schemas import (
    DiabetesRequest,
    InputType,
    PredictionType,
)


MODEL_VERSION = "0.1.0"
RESEARCH_MODEL_VERSION = "0.2.0-calibrated-ensemble"
THRESHOLD = 0.25  # Baseline tuned threshold
RESEARCH_THRESHOLD = 0.30  # Calibrated ensemble cost-sensitive threshold
MODEL_PATH = (
    Path(__file__).parents[2] / "artifacts" / "diabetes" / "best_model.joblib"
)
RESEARCH_MODEL_PATH = (
    Path(__file__).parents[2] / "artifacts" / "diabetes_research" / "best_calibrated_model.joblib"
)
DISCLAIMER = (
    "This is an AI-assisted diabetes risk estimate, not a medical diagnosis. "
    "Consult a qualified healthcare professional."
)


class DiabetesInferenceService:
    """Lazy-loading diabetes risk inference service.

    The model is loaded once on first use and cached for the lifetime of the process.
    Supports stub injection for testing via reset_model().
    """

    _model: Optional[Any] = None
    _research_model: Optional[Any] = None

    @classmethod
    def load_model(cls, model_path: str | Path = MODEL_PATH) -> Any:
        """Load the diabetes model artifact lazily."""
        if cls._model is None:
            path = Path(model_path)
            if not path.exists():
                raise FileNotFoundError(
                    f"Diabetes model artifact not found: {path}"
                )
            cls._model = joblib.load(path)
        return cls._model

    @classmethod
    def load_research_model(cls, model_path: str | Path = RESEARCH_MODEL_PATH) -> Any:
        """Load the calibrated multi-cohort ensemble research model."""
        if cls._research_model is None:
            path = Path(model_path)
            if not path.exists():
                # Fallback to base model if research artifact is absent
                return cls.load_model()
            cls._research_model = joblib.load(path)
        return cls._research_model

    @classmethod
    def reset_model(cls) -> None:
        """Clear the cached models — used in tests to isolate inference state."""
        cls._model = None
        cls._research_model = None

    @classmethod
    def predict(
        cls,
        request: DiabetesRequest,
        model_path: str | Path = MODEL_PATH,
        use_research: bool = False,
    ) -> Dict[str, Any]:
        """Run inference for a single patient record."""
        values = [getattr(request, feature) for feature in DIABETES_FEATURES]
        numeric_values = np.asarray(values, dtype=float)
        if not np.isfinite(numeric_values).all():
            raise ValueError("All Diabetes features must be finite numbers.")

        feature_frame = pd.DataFrame([numeric_values], columns=DIABETES_FEATURES)

        if use_research:
            model = cls.load_research_model()
            prob = float(model.predict_proba(feature_frame)[0, 1])
            thresh = RESEARCH_THRESHOLD
            v_name = RESEARCH_MODEL_VERSION
            patient_dict = {f: getattr(request, f) for f in DIABETES_FEATURES}
            medians = {"Glucose": 117.0, "BMI": 32.4, "BloodPressure": 72.0, "Age": 29.0}
            local_expl = generate_local_explanation(model, patient_dict, DIABETES_FEATURES, medians)
            return {
                "risk_probability": prob,
                "risk_category": "HIGH" if prob >= thresh else "LOW",
                "threshold": thresh,
                "model_name": "diabetes_risk_calibrated_ensemble",
                "model_version": v_name,
                "feature_order": DIABETES_FEATURES,
                "primary_risk_drivers": local_expl["primary_risk_drivers"],
                "explanation_summary": local_expl["explanation_summary"],
                "disclaimer": DISCLAIMER,
            }

        model = cls.load_model(model_path)
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

        explanation = await GroqService.generate_explanation(
            model_type="Diabetes Risk Scoring (Gradient Boosting)",
            prediction_result=result,
            metadata={"features": prediction_record["input_data"]}
        )
        if explanation:
            prediction_record["explanation_reference"] = explanation

        saved_id = await Database.save_prediction(prediction_record)
        if saved_id and not prediction_record.get("_id"):
            prediction_record["_id"] = saved_id

        return prediction_record
