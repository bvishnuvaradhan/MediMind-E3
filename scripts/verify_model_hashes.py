import hashlib

files = [
    'ai-prediction-service/artifacts/diabetes/best_model.joblib',
    'ai-prediction-service/artifacts/heart_disease/best_model.joblib',
    'ai-prediction-service/app/services/diabetes_service.py',
    'ai-prediction-service/app/services/heart_disease_service.py',
    'ai-prediction-service/artifacts/fracture_v2/best_model.pt',
    'ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt'
]

expected = {
    'ai-prediction-service/artifacts/diabetes/best_model.joblib': '65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9',
    'ai-prediction-service/artifacts/heart_disease/best_model.joblib': '1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c',
    'ai-prediction-service/app/services/diabetes_service.py': '1d8af27e821ef49177e3295096483d50fa8248a59032b6284c72ba1f1399e268',
    'ai-prediction-service/app/services/heart_disease_service.py': '678da749c49d5c19937a417e9ffc193d4b0a937308bc6b3987a3392cebf7a3f2',
    'ai-prediction-service/artifacts/fracture_v2/best_model.pt': 'ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60',
    'ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt': 'eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d'
}

all_match = True
for f in files:
    with open(f, 'rb') as fp:
        h = hashlib.sha256(fp.read()).hexdigest()
    match = (h == expected[f])
    if not match:
        all_match = False
    status = "MATCH" if match else "MISMATCH"
    print(f"[{status}] {f}: {h}")

print(f"\nOVERALL MODEL HASH INTEGRITY: {'100% PERFECT MATCH' if all_match else 'FAILED'}")
