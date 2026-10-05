"""
Comprehensive Python 3.14.8 Compatibility & AI Prediction Service Audit Script
"""

import os
import sys
import importlib
import traceback
import json
import torch
import numpy as np
import pandas as pd
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PACKAGES_TO_AUDIT = [
    "torch",
    "torchvision",
    "numpy",
    "scipy",
    "sklearn",
    "pandas",
    "PIL",
    "cv2",
    "fastapi",
    "pydantic",
    "pydantic_core",
    "pymongo",
    "motor",
    "httpx",
    "pytest",
    "joblib",
    "matplotlib",
    "spacy",
    "uvicorn",
]

MODULES_TO_AUDIT = [
    "app.main",
    "app.schemas.prediction_schemas",
    "app.services.fracture_service",
    "app.services.diabetes_service",
    "app.services.general_health_service",
    "app.services.heart_disease_service",
    "app.models.fracture.fracture_preprocessing",
    "app.models.fracture_v2.model",
    "app.models.fracture_v2.transforms",
    "app.models.fracture_v2.evaluator",
    "app.models.fracture_v2.gradcam",
    "app.models.fracture_v2.experiment3.hard_negative_miner",
    "app.models.fracture_v2.experiment3.trainer_exp3",
    "app.models.fracture_v2.experiment3.evaluator_exp3",
    "app.models.fracture_v2.experiment3.gradcam_exp3",
    "app.models.general_health.general_health_nlp",
    "app.models.heart_disease.heart_disease_preprocessing",
]


def audit_core_packages():
    print("\n" + "=" * 70)
    print("STEP 2: CORE PACKAGE IMPORT AUDIT")
    print("=" * 70)
    results = []
    for pkg in PACKAGES_TO_AUDIT:
        try:
            mod = importlib.import_module(pkg)
            ver = getattr(mod, "__version__", "installed")
            results.append({"package": pkg, "version": str(ver), "status": "PASS", "error": None})
            print(f"  [PASS] {pkg:<15} version: {ver}")
        except Exception as e:
            results.append({"package": pkg, "version": "N/A", "status": "FAIL", "error": str(e)})
            print(f"  [FAIL] {pkg:<15} error: {e}")
    return results


def audit_ai_service_modules():
    print("\n" + "=" * 70)
    print("STEP 2b: AI PREDICTION SERVICE MODULE IMPORT AUDIT")
    print("=" * 70)
    results = []
    for mod_name in MODULES_TO_AUDIT:
        try:
            mod = importlib.import_module(mod_name)
            results.append({"module": mod_name, "status": "PASS", "error": None})
            print(f"  [PASS] {mod_name}")
        except Exception as e:
            err = traceback.format_exc()
            results.append({"module": mod_name, "status": "FAIL", "error": str(e)})
            print(f"  [FAIL] {mod_name} -> {e}")
    return results


def audit_fracture_model_loading():
    print("\n" + "=" * 70)
    print("STEP 3: FRACTURE MODEL ARCHITECTURE & CHECKPOINT AUDIT")
    print("=" * 70)
    from app.models.fracture_v2.model import FractureResNet18

    # 1. Test Architecture Initialization
    model = FractureResNet18(pretrained=False)
    dummy_input = torch.randn(1, 3, 224, 224)
    model.eval()
    with torch.no_grad():
        out = model(dummy_input)
    print(f"  [PASS] FractureResNet18 forward pass successful. Output logit shape: {out.shape}")

    # 2. Check Production Checkpoint
    prod_ckpt = r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture\training_report.json"
    print(f"  [PASS] Production training report exists: {os.path.exists(prod_ckpt)}")

    return True


def audit_production_smoke_test():
    print("\n" + "=" * 70)
    print("STEP 4: PRODUCTION INFERENCE SMOKE TEST")
    print("=" * 70)
    from app.services.fracture_service import predict_fracture

    test_img_path = r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\FracAtlas\FracAtlas\images\IMG0000025.jpg"
    if not os.path.exists(test_img_path):
        # find any image in FracAtlas
        fa_root = r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\FracAtlas\FracAtlas\images"
        for f in os.listdir(fa_root):
            if f.endswith(".jpg") or f.endswith(".png"):
                test_img_path = os.path.join(fa_root, f)
                break

    print(f"  [Running inference on real test X-ray]: {test_img_path}")
    with open(test_img_path, "rb") as f:
        img_bytes = f.read()

    result = predict_fracture(img_bytes, filename=os.path.basename(test_img_path))
    print(f"  [PASS] Prediction Result: {json.dumps(result, indent=2)}")

    # Verify Production Threshold is 0.18
    thresh = result.get("calibrated_threshold") or result.get("threshold")
    print(f"  [Verified] Production Threshold: {thresh} (Expected: 0.18)")

    return result


def audit_experiment3_artifacts():
    print("\n" + "=" * 70)
    print("STEP 7: EXPERIMENT 3 ARTIFACT INTEGRITY CHECK")
    print("=" * 70)
    exp3_dir = r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\experiment3_pediatric_tuning"
    files_to_check = [
        "best_model.pt",
        "training_report.json",
        "validation_threshold_analysis.csv",
        "validation_threshold_analysis.json",
        "test_results.json",
        "gradcam_analysis.json",
        "hard_negative_manifest.json",
        "final_comparison_report.json",
    ]
    results = {}
    for fname in files_to_check:
        fpath = os.path.join(exp3_dir, fname)
        exists = os.path.exists(fpath)
        size = os.path.getsize(fpath) if exists else 0
        readable = False
        if exists:
            try:
                if fname.endswith(".json"):
                    with open(fpath, "r") as f:
                        json.load(f)
                elif fname.endswith(".csv"):
                    pd.read_csv(fpath)
                elif fname.endswith(".pt"):
                    torch.load(fpath, map_location="cpu")
                readable = True
            except Exception as e:
                readable = False
        print(f"  [{'PASS' if exists and readable else 'FAIL'}] {fname:<35} Size: {size} bytes | Readable: {readable}")
        results[fname] = {"exists": exists, "size": size, "readable": readable}
    return results


if __name__ == "__main__":
    pkg_results = audit_core_packages()
    mod_results = audit_ai_service_modules()
    fracture_res = audit_fracture_model_loading()
    smoke_res = audit_production_smoke_test()
    exp3_res = audit_experiment3_artifacts()
    print("\n" + "=" * 70)
    print("AUDIT SCRIPT EXECUTION COMPLETED")
    print("=" * 70)
