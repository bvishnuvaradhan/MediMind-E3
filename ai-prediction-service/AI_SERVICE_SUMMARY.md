# MediMind AI Prediction Service Summary

## Overview
This service is the AI and decision-support component of the MediMind platform. It focuses on clinical symptom triage and prediction workflows for healthcare use cases.

## Current implementation
The service currently includes:

- FastAPI application setup and health endpoints
- MongoDB connectivity with in-memory fallback for local/dev operation
- JWT validation and internal service authentication
- Role-based access checks for family-member data
- General health assessment API endpoints
- NLP-based symptom triage engine for clinical safety screening
- Prediction persistence and history retrieval
- Automated pytest validation

## Main folders
- `app/` — application code
  - `main.py` — FastAPI app entry point
  - `core/` — configuration and database logic
  - `middleware/` — authentication and authorization
  - `schemas/` — Pydantic request/response models
    - `prediction_schemas.py` — shared contracts plus Heart Disease inference request/response models
  - `models/general_health/` — NLP triage engine
  - `models/heart_disease/` — cardiovascular dataset inspection and preprocessing
    - `heart_disease_training.py` — EDA, stratified splitting, baseline models, MLP training, and evaluation artifacts
    - `heart_disease_service.py` — lazy Random Forest inference with thresholded risk estimates
    - `HEART_DISEASE_MODEL_CARD.md` — model limitations and validation scope
    - `INFERENCE_USAGE.md` — standalone script and Swagger usage
  - `services/` — business service layer
    - `heart_disease_service.py` — standalone Heart Disease prediction service
  - `api/v1/` — API routes
    - `general_health.py` — General Health NLP routes
    - `heart_disease.py` — standalone Heart Disease risk route
- `scripts/` — local standalone utilities
  - `predict_heart_disease.py` — sample local Heart Disease prediction
- `tests/` — test suite organized by model, plus shared auth and persistence tests
  - `tests/general_health/` — General Health API, NLP robustness, and dataset tests
  - `tests/heart_disease/` — Heart Disease preprocessing and training tests
  - `tests/test_auth.py` — shared authentication and authorization tests
  - `tests/test_mongodb_integration.py` — shared persistence, pagination, and uniqueness tests
- `test-dataset/` — local-only evaluation datasets; ignored by Git

## API routes
- `POST /api/ai/general-health` — analyze symptom text and produce an AI-assessed response
- `POST /api/ai/heart-disease` — validate 11 patient features and return a cardiovascular risk estimate
- `GET /api/ai/member/{member_id}` — fetch prediction history for a member
- `GET /api/ai/member/{member_id}?skip=0&limit=50` — fetch bounded, newest-first history pages
- `GET /api/ai/{prediction_id}` — fetch a single prediction by ID
- `GET /health` — service health check

## Auth model
The service supports two valid access patterns:

1. Internal service access via `X-Internal-Service-Key`
2. User access via `Authorization: Bearer <JWT>`

Role checks allow:
- Internal system calls
- DOCTOR / ADMIN / DEPARTMENT_HEAD / HOSPITAL_ADMIN / CHAIRMAN access
- FAMILY users only for their own linked family members

## Safety model
The NLP engine is designed as a clinical decision-support tool, not a diagnostic engine. It includes:

 emergency red-flag detection for cardiac, respiratory, neurological, trauma, airway, bleeding, diabetic, poisoning, and burn events
 self-harm and psychiatric emergency detection
 pediatric and neonatal emergency detection
 Hindi/Hinglish and Telugu-English symptom phrase support
 negation, historical, third-person, conditional, and hypothetical context handling
 ambiguous, garbage, and non-specific input handling
- moderate-risk triage rules
- self-care / low-risk classification
- mandatory medical disclaimer in every result
- conservative assessment behavior for urgent symptoms
 model version `1.1.0`

Supported General Health input is free-text symptom description in English,
Hindi/Hinglish, or Telugu-English phrasing covered by the rule set. The module
does not diagnose disease, interpret images, replace a clinician, or provide
reliable risk assessment for unsupported languages, clinical records without
context, or non-symptom medical questions.

## Robustness and test data
The automated suite covers NLP edge cases, authentication, database lifecycle behavior,
pagination, prediction-ID uniqueness, and API regression checks. Local Excel evaluation files
and larger medical datasets are stored under `test-dataset/` and are intentionally ignored by
Git. Dataset tests use those files when available and skip cleanly when they are not present.

## Where to see results
Run training from `ai-prediction-service/` with:

`py -c "from app.models.heart_disease.heart_disease_training import train_and_evaluate; train_and_evaluate('test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv', 'artifacts/heart_disease')"`

Live progress, model timings, MLP iterations, early stopping, and Random Forest
diagnostics appear in the terminal. Final metrics and training diagnostics are
saved in `artifacts/heart_disease/training_report.json`; trained model files are
saved in the same ignored folder.

## Validation status
The current project has been verified with pytest in the active environment.

Most recent validation result:
- 124 passed
- 0 failed
- 2 existing dependency deprecation warnings

The live service was also checked at `http://localhost:5007/docs` for health,
emergency, negation, multilingual, and authorization flows. MongoDB was
available during validation; the in-memory fallback remains covered by the
database tests.

## Heart Disease module status
The Heart Disease module now has a reproducible local training pipeline for the
comma-separated cardiovascular dataset. It removes 3,820 exact duplicates,
creates a stratified 70/15/15 split, reports EDA/IQR outliers and
feature-target summaries, scales Logistic Regression and MLP inputs, and
compares Logistic Regression, Random Forest, and a regularized MLP. Random
Forest was selected by validation ROC-AUC (0.7944) and achieved 0.7961 test
ROC-AUC; the MLP achieved 0.7956 test ROC-AUC. Metrics include recall,
specificity, precision, F1, ROC-AUC, PR-AUC, Brier score, and confusion matrix.
Artifacts are saved locally under `artifacts/heart_disease/` and ignored by
Git. A standalone inference service and independent API route are available;
successful API predictions are persisted through the shared prediction-history
architecture. Frontend integration has not been added.

Validation methodology now records raw versus deduplicated class balance,
confirms that threshold `0.4` was selected from validation data only, reports
performance and calibration across gender, age bands, cholesterol, and glucose
subgroups, and summarizes false-positive/false-negative rates. Duplicate removal
changed the class balance from raw `34,742/34,041` to deduplicated `31,910/33,053`,
so this sensitivity evidence must be considered during review. The model card
states that outputs are cardiovascular risk estimates and are not diagnoses.

The subgroup report shows materially different operating behavior across age,
cholesterol, and glucose groups. For example, tuned test specificity ranges
from `0.32` in the 55-64 age band to `0.91` in the 30-44 band, and from `0.08`
for cholesterol category 3 to `0.69` for category 1. These results are a
validation finding, not evidence of clinical fairness; external validation and
clinical governance are required before deployment.

## Heart Disease inference status
The standalone inference service loads `random_forest.joblib` lazily, validates
the 11-feature request schema, preserves the trained feature order, applies
threshold `0.4`, and returns a probability, `HIGH`/`LOW` risk category, model
version `0.2.0`, and a non-diagnostic disclaimer. The local script is
`scripts/predict_heart_disease.py`; the independent API can be tested through
Swagger at `http://localhost:5007/docs`. Inference is not yet persisted to
prediction history or integrated with the frontend.

## Current branch
- Branch: `feature/ai-prediction-service`
- Scope: AI prediction service module, especially general health triage

## Planned future modules
The repo roadmap includes additional prediction modules beyond general health, such as:

- fracture detection
- diabetes risk prediction

These are not yet implemented in the current workspace state.

The standalone route has been validated for successful predictions, schema
errors, missing authentication, OpenAPI exposure, and missing-model failure
handling, so it is ready for future integration work.
