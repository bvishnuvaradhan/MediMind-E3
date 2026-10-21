import os
import sys
from pathlib import Path

# Add ai-prediction-service to path
sys.path.insert(0, str(Path("ai-prediction-service").resolve()))

from app.services.fracture_service import FractureInferenceService

frac_img_path = Path("ai-prediction-service/test-dataset/Bone Facture/FracAtlas/FracAtlas/images/Fractured/IMG0000019.jpg")
non_frac_img_path = Path("ai-prediction-service/test-dataset/Bone Facture/FracAtlas/FracAtlas/images/Non_fractured/IMG0000000.jpg")

print("Testing Fracture Detection Model Inference on Real FracAtlas Images...")

with open(frac_img_path, "rb") as f:
    frac_bytes = f.read()

res_frac = FractureInferenceService.predict(frac_bytes, filename=frac_img_path.name)
print("\n--- Fractured Image (IMG0000019.jpg) Result ---")
print(f"Possible Fracture: {res_frac.get('possibleFracture')}")
print(f"Confidence: {res_frac.get('confidence')}")
print(f"Risk Score: {res_frac.get('risk_score')}")
print(f"Risk Level: {res_frac.get('risk_level')}")
print(f"Image Metadata: {res_frac.get('image_metadata')}")

with open(non_frac_img_path, "rb") as f:
    non_frac_bytes = f.read()

res_non_frac = FractureInferenceService.predict(non_frac_bytes, filename=non_frac_img_path.name)
print("\n--- Non-Fractured Image (IMG0000000.jpg) Result ---")
print(f"Possible Fracture: {res_non_frac.get('possibleFracture')}")
print(f"Confidence: {res_non_frac.get('confidence')}")
print(f"Risk Score: {res_non_frac.get('risk_score')}")
print(f"Risk Level: {res_non_frac.get('risk_level')}")
print(f"Image Metadata: {res_non_frac.get('image_metadata')}")
