import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import (
    GeneralHealthRequest,
    PredictionType,
    InputType
)
from app.core.database import Database

class GeneralHealthService:

    @classmethod
    async def analyze_general_health(cls, request: GeneralHealthRequest) -> Dict[str, Any]:
        # 1. Run NLP triage engine
        result_dict, risk_level, risk_score, confidence = GeneralHealthNLPEngine.evaluate_symptoms(request.text)

        prediction_id = f"pred_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # 2. Build Common AI Prediction Contract payload
        prediction_record = {
            "prediction_id": prediction_id,
            "family_member_id": request.family_member_id,
            "appointment_id": request.appointment_id,
            "prediction_type": PredictionType.GENERAL_HEALTH.value,
            "input_type": InputType.TEXT.value,
            "input_data": {
                "text": request.text
            },
            "result": result_dict,
            "risk_level": risk_level.value,
            "risk_score": risk_score,
            "confidence": confidence,
            "model_name": GeneralHealthNLPEngine.MODEL_NAME,
            "model_version": GeneralHealthNLPEngine.MODEL_VERSION,
            "explanation_reference": None,
            "created_at": now_iso
        }

        # 3. Persist prediction
        saved_id = await Database.save_prediction(prediction_record)
        if saved_id and not prediction_record.get("_id"):
            prediction_record["_id"] = saved_id

        return prediction_record

    @classmethod
    async def get_history_by_member(cls, family_member_id: str) -> List[Dict[str, Any]]:
        return await Database.get_predictions_by_member(family_member_id)

    @classmethod
    async def get_prediction_by_id(cls, prediction_id: str) -> Optional[Dict[str, Any]]:
        return await Database.get_prediction_by_id(prediction_id)
