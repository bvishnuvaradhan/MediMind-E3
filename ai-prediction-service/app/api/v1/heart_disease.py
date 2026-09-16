import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import authorize_family_member_access, get_current_user_or_service
from app.schemas.prediction_schemas import HeartDiseaseRequest, HeartDiseaseResponse
from app.services.heart_disease_service import HeartDiseaseInferenceService


router = APIRouter(prefix="/api/ai", tags=["AI Prediction"])
logger = logging.getLogger("ai_service.api.heart_disease")


@router.post("/heart-disease", response_model=HeartDiseaseResponse, status_code=status.HTTP_200_OK)
async def predict_heart_disease(
    request: HeartDiseaseRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_or_service),
):
    authorize_family_member_access(current_user, request.family_member_id)
    try:
        result = HeartDiseaseInferenceService.predict(request)
        return {
            "family_member_id": request.family_member_id,
            "appointment_id": request.appointment_id,
            "prediction_type": "HEART_DISEASE_RISK",
            "input_type": "HEALTH_PARAMETERS",
            "result": result,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Heart Disease model is unavailable.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception:
        logger.exception("Heart Disease inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Heart Disease risk assessment failed.",
        )