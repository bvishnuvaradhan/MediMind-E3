# MediMind AI Prediction Service Summary

## Overview
This service is the AI and decision-support microservice of the MediMind platform. It focuses on clinical symptom triage and predictive risk workflows across four distinct clinical modules for healthcare decision support.

## Current implementation
The service includes:

- FastAPI application setup, lifecycle management, and health endpoints
- MongoDB connectivity with in-memory fallback for local/dev operation
- JWT validation and constant-time internal service authentication (`X-Internal-Service-Key`)
- Exact-scope role-based access checks for family-member clinical data
- General health assessment API endpoints (`POST /api/ai/general-health`, `GET /api/ai/member/{member_id}`, `GET /api/ai/{prediction_id}`)
- NLP-based symptom triage engine for clinical safety screening and emergency red-flag detection
- Heart Disease risk prediction module, preprocessing, Random Forest classifier, and inference service
- Diabetes risk prediction module, preprocessing, MLP classifier, and inference service
- Fracture detection module, preprocessing, Stanford MURA v1.1 pretraining + FracAtlas fine-tuned ResNet-18 CNN, and inference service
- Shared prediction persistence and history retrieval with pagination and sort ordering
- Comprehensive automated pytest validation (253 tests passed)

## Main folders
- `app/` — application code
  - `main.py` — FastAPI app entry point with CORS and routers
  - `core/` — configuration (`config.py`) and database logic (`database.py`)
  - `middleware/` — authentication and authorization (`auth.py`)
  - `schemas/` — Pydantic request/response models (`prediction_schemas.py`)
  - `models/general_health/` — NLP triage engine and symptom dictionaries
  - `models/heart_disease/` — cardiovascular dataset inspection, preprocessing, and training pipeline
    - `heart_disease_training.py` — EDA, stratified splitting, baseline models, MLP training, and evaluation artifacts
    - `HEART_DISEASE_MODEL_CARD.md` — model limitations and validation scope
    - `INFERENCE_USAGE.md` — standalone script and Swagger usage
  - `models/diabetes/` — Pima Indians Diabetes preprocessing and reproducible training pipeline
    - `diabetes_preprocessing.py` — 8-feature schema contract, biological-zero imputation, dataset inspection
    - `diabetes_training.py` — stratified 70/15/15 split, Logistic Regression/Random Forest/MLP training, threshold tuning
    - `DIABETES_DATASET.md` — dataset documentation and biological zero imputation policy
    - `DIABETES_MODEL_CARD.md` — model card, performance scope, and clinical non-diagnostic disclaimers
  - `models/fracture/` — Musculoskeletal plain radiograph classification pipeline
    - `mura_audit.py` — Stanford MURA v1.1 zero-copy directory and label auditor
    - `fracatlas_ingestion.py` — FracAtlas dataset ingestion, path resolution, and stratified splitting
    - `fracture_preprocessing.py` — image validation (PNG, JPEG, DICOM), transformations, datasets
    - `fracture_training.py` — MURA representation pretraining, FracAtlas fine-tuning, threshold calibration
    - `FRACTURE_DATASET.md` — dataset specifications and licensing provenance
    - `FRACTURE_MODEL_CARD.md` — model card, evaluation metrics, calibration, and clinical limitations
  - `services/` — business service layer
    - `general_health_service.py` — General Health triage service
    - `heart_disease_service.py` — standalone Heart Disease prediction service
    - `diabetes_service.py` — lazy Diabetes risk inference service with tuned thresholding
    - `fracture_service.py` — lazy Fracture detection inference service with calibrated thresholding
  - `api/v1/` — API routes
    - `general_health.py` — General Health NLP routes & prediction history
    - `heart_disease.py` — Heart Disease risk prediction route
    - `diabetes.py` — Diabetes risk prediction route
    - `fracture.py` — Bone Fracture detection route (multipart/form-data)
- `artifacts/` — saved model weights and training reports (gitignored)
  - `heart_disease/` — `best_model.joblib`, `random_forest.joblib`, `training_report.json`
  - `diabetes/` — `best_model.joblib`, `random_forest.joblib`, `training_report.json`
  - `fracture/` — `best_model.pt`, `mura_pretrained_model.pt`, `baseline_model.pt`, `mura_pretrained_backbone.pt`, `training_report.json`
- `tests/` — comprehensive test suite organized by module
  - `tests/general_health/` — General Health API, NLP robustness, and dataset tests
  - `tests/heart_disease/` — Heart Disease preprocessing and inference tests
  - `tests/diabetes/` — Diabetes schema, preprocessing, API, and inference tests
  - `tests/fracture/` — Fracture preprocessing, MURA audit, FracAtlas ingestion, CNN training, inference, and API tests
  - `tests/test_auth.py` — cross-cutting authentication, authorization, role security, and parameter collision tests
  - `tests/test_mongodb_integration.py` — shared persistence, pagination, schema integrity, and uniqueness tests
- `test-dataset/` — local-only evaluation datasets; ignored by Git

## API routes
- `POST /api/ai/general-health` — analyze symptom text and produce an AI-assessed triage response
- `POST /api/ai/heart-disease` — validate 11 patient features and return a cardiovascular risk estimate
- `POST /api/ai/diabetes` — validate 8 patient health parameters and return a diabetes risk estimate
- `POST /api/ai/fracture` — accept plain radiograph X-ray image upload (PNG, JPEG, DICOM) and return fracture screening result
- `GET /api/ai/member/{member_id}` — fetch prediction history for a family member
- `GET /api/ai/member/{member_id}?skip=0&limit=50` — fetch bounded, newest-first history pages
- `GET /api/ai/{prediction_id}` — fetch a single prediction by ID
- `GET /health` — service health check
- `GET /docs` & `GET /openapi.json` — OpenAPI documentation and Swagger UI

## Auth model
The service supports two valid access patterns:

1. Internal service access via `X-Internal-Service-Key` (compared in constant time with `hmac.compare_digest`)
2. User access via `Authorization: Bearer <JWT>`

Role checks allow:
- Internal system calls (full service access)
- FAMILY users only for exact linked member IDs in their trusted `family_member_ids` scope

`JWT_SECRET` and `INTERNAL_SERVICE_KEY` are required environment settings. The service fails fast at startup if either secret is missing or empty; development fallback credentials have been removed.

Direct JWT access to private predictions is strictly limited to FAMILY tokens carrying exact `family_member_ids` scope entries. Doctors and organizational roles must use an authorized internal service path rather than receiving direct access to private prediction records.

## Safety model
All AI modules are designed as clinical decision-support screening tools, not diagnostic engines:

- Emergency red-flag detection for cardiac, respiratory, neurological, trauma, airway, bleeding, diabetic, poisoning, and burn events
- Multilingual NLP triage handling English, Hindi/Hinglish, and Telugu-English phrasing
- Negation, historical, third-person, conditional, and hypothetical context handling
- Conservative calibrated thresholds maximizing clinical recall under minimum specificity constraints
- Mandatory non-diagnostic disclaimer included in every inference response across all four modules
- Safe failure modes returning HTTP 503 if model weights are missing and HTTP 422 for malformed or out-of-range inputs

## Validation status
The complete AI Prediction Service test suite has been verified with pytest:
- **253 passed**
- **0 skipped**
- **0 failed**
- 3 benign warnings (1 Starlette multipart deprecation warning, 2 single-class ROC-AUC subgroup warnings for extreme age bands)

---

## Production Readiness Review & Audit Findings

### 1. General Health NLP Triage Module
- **Endpoint**: `POST /api/ai/general-health`
- **Model**: Deterministic clinical safety rule engine + multilingual NLP matcher (v1.1.0).
- **Safety Screening**: Traps high-acuity red flags (chest pain, acute dyspnea, stroke signs, severe hemorrhage, pediatric respiratory distress, anaphylaxis).
- **Input Handling**: Robust against prompt injection, empty text, gibberish, negation, and non-English phrasing.
- **Persistence & Audit**: Persists to MongoDB with `PredictionType.GENERAL_HEALTH_ASSESSMENT` and `InputType.SYMPTOMS`.
- **Readiness**: Production ready.

### 2. Heart Disease Risk Module
- **Endpoint**: `POST /api/ai/heart-disease`
- **Model**: Random Forest classifier (200 trees, max_depth=12, min_samples_leaf=3), calibrated threshold `0.40`.
- **Validation**: Evaluated on 9,745 held-out records (ROC-AUC `0.7961`, PR-AUC `0.7835`, Recall `0.8001`, Specificity `0.6340`, ECE `0.0080`).
- **Input Handling**: Strict Pydantic bounds for 11 clinical features (`AGE`, `GENDER`, `HEIGHT`, `WEIGHT`, `AP_HIGH`, `AP_LOW`, `CHOLESTEROL`, `GLUCOSE`, `SMOKE`, `ALCOHOL`, `PHYSICAL_ACTIVITY`).
- **Inference**: Lazy-loading singleton in `HeartDiseaseInferenceService`. Returns HTTP 503 if checkpoint missing.
- **OpenAPI**: Full docstring, endpoint summary, and schema contracts exposed.
- **Readiness**: Production ready.

### 3. Diabetes Risk Module
- **Endpoint**: `POST /api/ai/diabetes`
- **Model**: Multi-Layer Perceptron (MLP with 32×16 hidden layers, early stopping), calibrated threshold `0.25`.
- **Validation**: Evaluated on 116 held-out test records (ROC-AUC `0.8267`, PR-AUC `0.7205`, Recall `0.8049`, Specificity `0.6800`, Brier score `0.1647`). Non-physiological zeros imputed using non-zero training partition medians with zero test leakage.
- **Input Handling**: 8-feature Pydantic schema contract (`Pregnancies`, `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, `BMI`, `DiabetesPedigreeFunction`, `Age`).
- **Inference**: Lazy-loading singleton in `DiabetesInferenceService`. Returns HTTP 503 if checkpoint missing.
- **OpenAPI**: Full docstring, endpoint summary, and schema contracts exposed.
- **Readiness**: Production ready.

### 4. Bone Fracture Detection Module
- **Endpoint**: `POST /api/ai/fracture`
- **Model**: ResNet-18 CNN pretrained on Stanford MURA v1.1 (representation learning) and fine-tuned on Figshare FracAtlas (v0.1.0), calibrated decision threshold `0.1800`.
- **Validation**: Evaluated on 613 held-out plain radiographs (107 fractures):
  - **Recall (Sensitivity)**: **`0.9626`** (103 / 107 fractures detected, only 4 false negatives)
  - **Specificity**: `0.6364`
  - **NPV**: `0.9877`
  - **ROC-AUC**: **`0.9244`**
  - **PR-AUC**: **`0.7843`**
  - **Brier Score**: `0.0896`
  - **ECE**: `0.1021`
- **Input Handling**: Multipart/form-data accepting PNG, JPEG, and DICOM preamble inputs up to 25MB. Dimension checks (min 32×32, max 10,000×10,000) and byte integrity checks via Pillow `verify()`.
- **Inference**: Lazy-loading singleton in `FractureInferenceService` operating in `eval()` mode with `torch.no_grad()`.
- **OpenAPI**: Fully documented route, summaries, parameter descriptions, and response models.
- **Readiness**: Production ready.

### 5. Cross-Cutting Security & Authorization Audit
- **JWT Secret Enforcement**: Missing or empty `JWT_SECRET` raises immediate `RuntimeError` at application launch. No hardcoded default secrets.
- **Internal Service Key**: Mandatory `INTERNAL_SERVICE_KEY` validated using `hmac.compare_digest` to prevent timing attacks.
- **Family Scoping**: `authorize_family_member_access` checks exact set membership in `family_member_ids` to eliminate ID prefix/suffix collision vulnerabilities.
- **Role Isolation**: Privileged roles (`DOCTOR`, `DEPARTMENT_HEAD`, `HOSPITAL_ADMIN`, `CHAIRMAN`) cannot access private patient records directly via user JWT; they must use the audited internal service gateway.
- **Parameter Tampering Defense**: Prediction retrieval `GET /api/ai/{prediction_id}` verifies that the requesting user owns the `family_member_id` of the stored record.

### 6. MongoDB Persistence & Integrity Audit
- **Collection**: Shared `predictions` collection storing all assessment types.
- **Schema Integrity Guard**: `Database.save_prediction` strictly asserts the presence of required fields (`prediction_id`, `family_member_id`, `risk_level`, `prediction_type`, `created_at`).
- **Pagination & Sort**: `get_predictions_by_member` supports pagination (`skip`, `limit`) and enforces newest-first sorting (`created_at: -1`).
- **In-Memory Fallback**: Seamless in-memory store allows isolated development and fast test execution when the MongoDB daemon is unavailable.

---

## Current branch
- Branch: `feature/ai-prediction-service`
- Status: Fully audited, hardened, and verified production-ready microservice.
