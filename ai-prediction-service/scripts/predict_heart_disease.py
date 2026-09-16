"""Run one local Heart Disease risk prediction without starting the API."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schemas.prediction_schemas import HeartDiseaseRequest
from app.services.heart_disease_service import HeartDiseaseInferenceService


SAMPLE = {
    "family_member_id": "local-sample",
    "AGE": 55,
    "GENDER": 1,
    "HEIGHT": 170,
    "WEIGHT": 80,
    "AP_HIGH": 140,
    "AP_LOW": 90,
    "CHOLESTEROL": 2,
    "GLUCOSE": 1,
    "SMOKE": 0,
    "ALCOHOL": 0,
    "PHYSICAL_ACTIVITY": 1,
}


if __name__ == "__main__":
    request = HeartDiseaseRequest(**SAMPLE)
    print(json.dumps(HeartDiseaseInferenceService.predict(request), indent=2))