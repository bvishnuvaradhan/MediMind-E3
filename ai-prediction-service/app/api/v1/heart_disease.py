import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import authorize_family_member_access, get_current_user_or_service
from app.schemas.prediction_schemas import CommonPredictionResponse, HeartDiseaseRequest
from app.services.heart_disease_service import HeartDiseaseInferenceService


router = APIRouter(prefix="/api/ai", tags=["AI Prediction"])
logger = logging.getLogger("ai_service.api.heart_disease")


@router.post("/heart-disease", response_model=CommonPredictionResponse, status_code=status.HTTP_200_OK)
async def predict_heart_disease(
    request: HeartDiseaseRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_or_service),
):
    authorize_family_member_access(current_user, request.family_member_id)
    try:
        return await HeartDiseaseInferenceService.predict_and_persist(request)
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
