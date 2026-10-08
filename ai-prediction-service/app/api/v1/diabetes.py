import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import authorize_family_member_access, get_current_user_or_service
from app.schemas.prediction_schemas import CommonPredictionResponse, DiabetesRequest
from app.services.diabetes_service import DiabetesInferenceService


router = APIRouter(prefix="/api/ai", tags=["AI Prediction"])
logger = logging.getLogger("ai_service.api.diabetes")


@router.post(
    "/diabetes",
    response_model=CommonPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Diabetes Risk Assessment (Structured Health Parameters)",
)
async def predict_diabetes(
    request: DiabetesRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_or_service),
):
    """
    Estimates diabetes risk from 8 structured health parameters.

    Enforces authentication (JWT or X-Internal-Service-Key) and family-member
    authorization. Returns a CommonPredictionResponse and persists the result
    to the shared prediction history.

    Returns HTTP 503 when the trained model artifact is unavailable.
    Returns HTTP 422 for invalid or out-of-range input values.
    """
    authorize_family_member_access(current_user, request.family_member_id)
    try:
        return await DiabetesInferenceService.predict_and_persist(request)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Diabetes model is unavailable.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception:
        logger.exception("Diabetes inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Diabetes risk assessment failed.",
        )
