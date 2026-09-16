from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class PredictionType(str, Enum):
    FRACTURE_DETECTION = "FRACTURE_DETECTION"
    DIABETES_RISK = "DIABETES_RISK"
    HEART_DISEASE_RISK = "HEART_DISEASE_RISK"
    GENERAL_HEALTH = "GENERAL_HEALTH"

class InputType(str, Enum):
    IMAGE = "IMAGE"
    HEALTH_PARAMETERS = "HEALTH_PARAMETERS"
    TEXT = "TEXT"

class UrgencyLevel(str, Enum):
    EMERGENCY = "EMERGENCY"
    MEDICAL_EVALUATION_RECOMMENDED = "MEDICAL_EVALUATION_RECOMMENDED"
    SELF_CARE = "SELF_CARE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"

class RiskLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNKNOWN = "UNKNOWN"

class GeneralHealthRequest(BaseModel):
    family_member_id: str = Field(..., description="ID of the family member (patient)")
    text: str = Field(..., min_length=3, description="Free-text description of patient symptoms")
    appointment_id: Optional[str] = Field(None, description="Optional associated appointment ID")

class GeneralHealthResultPayload(BaseModel):
    possibleConcerns: List[str] = Field(..., description="Non-definitive possible health concerns identified")
    urgency: UrgencyLevel = Field(..., description="Safety-first urgency classification")
    guidance: str = Field(..., description="General healthcare guidance and recommendations")
    symptomsExtracted: List[str] = Field(..., description="List of recognized symptom keywords/phrases")
    disclaimer: str = Field(
        "AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional.",
        description="Mandatory non-diagnostic medical disclaimer"
    )

class CommonPredictionResponse(BaseModel):
    prediction_id: str
    family_member_id: str
    appointment_id: Optional[str] = None
    prediction_type: PredictionType
    input_type: InputType
    input_data: Dict[str, Any]
    result: Dict[str, Any]
    risk_level: RiskLevel
    risk_score: float
    confidence: float
    model_name: str
    model_version: str
    explanation_reference: Optional[str] = None
    created_at: str
