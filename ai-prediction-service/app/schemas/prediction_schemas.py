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
    family_member_id: str = Field(..., min_length=1, description="ID of the family member (patient)")
    text: str = Field(..., min_length=3, description="Free-text description of patient symptoms")
    appointment_id: Optional[str] = Field(None, description="Optional associated appointment ID")

class HeartDiseaseRequest(BaseModel):
    family_member_id: str = Field(..., min_length=1, description="ID of the family member (patient)")
    AGE: float = Field(..., ge=1, le=120)
    GENDER: float = Field(..., ge=1, le=2)
    HEIGHT: float = Field(..., gt=0, le=300)
    WEIGHT: float = Field(..., gt=0, le=500)
    AP_HIGH: float = Field(..., gt=0, le=300)
    AP_LOW: float = Field(..., gt=0, le=250)
    CHOLESTEROL: float = Field(..., ge=1, le=3)
    GLUCOSE: float = Field(..., ge=1, le=3)
    SMOKE: float = Field(..., ge=0, le=1)
    ALCOHOL: float = Field(..., ge=0, le=1)
    PHYSICAL_ACTIVITY: float = Field(..., ge=0, le=1)
    appointment_id: Optional[str] = Field(None, description="Optional associated appointment ID")

class DiabetesRequest(BaseModel):
    family_member_id: str = Field(..., min_length=1, description="ID of the family member (patient)")
    Pregnancies: int = Field(..., ge=0, le=25, description="Number of times pregnant")
    Glucose: float = Field(..., ge=0.0, le=500.0, description="Plasma glucose concentration")
    BloodPressure: float = Field(..., ge=0.0, le=250.0, description="Diastolic blood pressure (mm Hg)")
    SkinThickness: float = Field(..., ge=0.0, le=100.0, description="Triceps skin fold thickness (mm)")
    Insulin: float = Field(..., ge=0.0, le=1000.0, description="2-Hour serum insulin (mu U/ml)")
    BMI: float = Field(..., ge=0.0, le=100.0, description="Body mass index")
    DiabetesPedigreeFunction: float = Field(..., ge=0.0, le=3.5, description="Diabetes pedigree function")
    Age: int = Field(..., ge=1, le=120, description="Age in years")
    appointment_id: Optional[str] = Field(None, description="Optional associated appointment ID")

class HeartDiseaseResponse(BaseModel):
    family_member_id: str
    appointment_id: Optional[str] = None
    prediction_type: str
    input_type: str
    result: Dict[str, Any]

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
