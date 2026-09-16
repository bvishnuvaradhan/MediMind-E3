from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.schemas.prediction_schemas import GeneralHealthRequest, CommonPredictionResponse
from app.services.general_health_service import GeneralHealthService

router = APIRouter(prefix="/api/ai", tags=["AI Prediction"])

@router.post(
    "/general-health",
    response_model=CommonPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="General Health Symptom Assessment (NLP Triage)"
)
async def analyze_general_health(request: GeneralHealthRequest):
    """
    Analyzes free-text patient symptoms and produces a decision-support assessment,
    urgency rating, guidance, and mandatory medical disclaimer.
    """
    try:
        prediction = await GeneralHealthService.analyze_general_health(request)
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during General Health AI analysis: {str(e)}"
        )

@router.get(
    "/member/{member_id}",
    response_model=List[CommonPredictionResponse],
    summary="Get AI Prediction History for a Family Member"
)
async def get_member_prediction_history(member_id: str):
    """
    Retrieves all past AI predictions for a given family member ID.
    """
    history = await GeneralHealthService.get_history_by_member(member_id)
    return history

@router.get(
    "/{prediction_id}",
    response_model=CommonPredictionResponse,
    summary="Get Specific AI Prediction Record by ID"
)
async def get_prediction_by_id(prediction_id: str):
    """
    Retrieves a single AI prediction record by its unique prediction_id or ObjectId.
    """
    prediction = await GeneralHealthService.get_prediction_by_id(prediction_id)
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Prediction record with ID '{prediction_id}' not found."
        )
    return prediction
