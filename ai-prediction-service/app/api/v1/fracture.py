import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.middleware.auth import authorize_family_member_access, get_current_user_or_service
from app.schemas.prediction_schemas import CommonPredictionResponse
from app.services.fracture_service import FractureInferenceService


router = APIRouter(prefix="/api/ai", tags=["AI Prediction"])
logger = logging.getLogger("ai_service.api.fracture")


@router.post(
    "/fracture",
    response_model=CommonPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Bone Fracture Detection (Musculoskeletal Plain Radiograph X-ray)",
)
async def detect_fracture(
    file: UploadFile = File(..., description="Musculoskeletal X-ray image file (PNG, JPEG, or DICOM)"),
    family_member_id: str = Form(..., description="ID of the family member (patient)"),
    appointment_id: Optional[str] = Form(None, description="Optional associated appointment ID"),
    current_user: Dict[str, Any] = Depends(get_current_user_or_service),
):
    """
    Screens musculoskeletal plain radiograph X-ray images for possible acute bone fractures.

    Accepts multipart/form-data with an image upload (PNG, JPEG, or DICOM preamble).
    Enforces authentication (JWT Bearer or X-Internal-Service-Key) and family-member authorization.
    Persists successful predictions to the shared MongoDB prediction history.

    Returns:
        CommonPredictionResponse containing possibleFracture (true/false), confidence,
        risk_score, risk_level (HIGH/LOW), model metadata, and a non-diagnostic disclaimer.

    Error Responses:
        - HTTP 401: Missing or invalid authentication.
        - HTTP 403: Unauthorized access for requested family member.
        - HTTP 422: Corrupt, missing, unsupported, or invalid image input / missing family_member_id.
        - HTTP 503: Model artifact unavailable or failed to load.
        - HTTP 500: Internal server error during inference or persistence.
    """
    if not family_member_id or not family_member_id.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="family_member_id is required.",
        )

    clean_family_member_id = family_member_id.strip()
    authorize_family_member_access(current_user, clean_family_member_id)

    # Read uploaded file bytes
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to read uploaded image file: {str(e)}",
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image payload is empty (0 bytes received).",
        )

    try:
        prediction_record = await FractureInferenceService.predict_and_persist(
            image_bytes=image_bytes,
            family_member_id=clean_family_member_id,
            appointment_id=appointment_id.strip() if appointment_id and appointment_id.strip() else None,
            filename=file.filename,
            content_type=file.content_type,
        )
        return prediction_record
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Fracture Detection model artifact is unavailable.",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception:
        logger.exception("Fracture detection inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fracture detection assessment failed.",
        )
