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
- Heart disease risk prediction module and training pipeline
- Diabetes risk prediction module, preprocessing, training pipeline, and inference service
- Shared prediction persistence and history retrieval
- Automated pytest validation

## Main folders
- `app/` — application code
  - `main.py` — FastAPI app entry point
  - `core/` — configuration and database logic
  - `middleware/` — authentication and authorization
  - `schemas/` — Pydantic request/response models
    - `prediction_schemas.py` — shared contracts plus Heart Disease and Diabetes inference request models
  - `models/general_health/` — NLP triage engine
  - `models/heart_disease/` — cardiovascular dataset inspection, preprocessing, and training pipeline
    - `heart_disease_training.py` — EDA, stratified splitting, baseline models, MLP training, and evaluation artifacts
    - `heart_disease_service.py` — lazy Random Forest inference with thresholded risk estimates
    - `HEART_DISEASE_MODEL_CARD.md` — model limitations and validation scope
    - `INFERENCE_USAGE.md` — standalone script and Swagger usage
  - `models/diabetes/` — Pima Indians Diabetes preprocessing and reproducible training pipeline
    - `diabetes_preprocessing.py` — 8-feature schema contract, biological-zero imputation, dataset inspection
    - `diabetes_training.py` — stratified 70/15/15 split, Logistic Regression/Random Forest/MLP training, threshold tuning
    - `DIABETES_DATASET.md` — dataset documentation and biological zero imputation policy
    - `DIABETES_MODEL_CARD.md` — model card, performance scope, and clinical non-diagnostic disclaimers
  - `services/` — business service layer
    - `heart_disease_service.py` — standalone Heart Disease prediction service
    - `diabetes_service.py` — lazy Diabetes risk inference service with tuned thresholding
  - `api/v1/` — API routes
    - `general_health.py` — General Health NLP routes
    - `heart_disease.py` — standalone Heart Disease risk route
    - `diabetes.py` — Diabetes risk prediction route
- `scripts/` — local standalone utilities
  - `predict_heart_disease.py` — sample local Heart Disease prediction
- `tests/` — test suite organized by model, plus shared auth and persistence tests
  - `tests/general_health/` — General Health API, NLP robustness, and dataset tests
  - `tests/heart_disease/` — Heart Disease preprocessing and training tests
  - `tests/diabetes/` — Diabetes schema, preprocessing, API, and inference tests
  - `tests/test_auth.py` — shared authentication and authorization tests
  - `tests/test_mongodb_integration.py` — shared persistence, pagination, and uniqueness tests
- `test-dataset/` — local-only evaluation datasets; ignored by Git

## API routes
- `POST /api/ai/general-health` — analyze symptom text and produce an AI-assessed response
- `POST /api/ai/heart-disease` — validate 11 patient features and return a cardiovascular risk estimate
- `POST /api/ai/diabetes` — validate 8 patient health parameters and return a diabetes risk estimate
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
- FAMILY users only for exact linked member IDs in their trusted scope

`JWT_SECRET` and `INTERNAL_SERVICE_KEY` are required environment settings. The
service does not provide development fallback credentials; local development
must supply explicit values through `.env`.

Until the platform provides an authoritative member-access source, direct JWT
access to private predictions is limited to FAMILY tokens carrying exact
`family_member_ids` scope entries. Doctors and organizational roles must use
an authorized internal service path rather than receiving role-based access to
private prediction records.

## Safety model
The NLP engine is designed as a clinical decision-support tool, not a diagnostic engine. It includes:

- emergency red-flag detection for cardiac, respiratory, neurological, trauma, airway, bleeding, diabetic, poisoning, and burn events
- self-harm and psychiatric emergency detection
- pediatric and neonatal emergency detection
- Hindi/Hinglish and Telugu-English symptom phrase support
- negation, historical, third-person, conditional, and hypothetical context handling
- ambiguous, garbage, and non-specific input handling
- moderate-risk triage rules
- self-care / low-risk classification
- mandatory medical disclaimer in every result
- conservative assessment behavior for urgent symptoms
- model version `1.1.0`

Supported General Health input is free-text symptom description in English,
Hindi/Hinglish, or Telugu-English phrasing covered by the rule set. The module
does not diagnose disease, interpret images, replace a clinician, or provide
reliable risk assessment for unsupported languages, clinical records without
context, or non-symptom medical questions.

## Robustness and test data
The automated suite covers NLP edge cases, authentication, database lifecycle behavior,
pagination, prediction-ID uniqueness, and API regression checks. Local evaluation files
and medical datasets are stored under `test-dataset/` and are intentionally ignored by
Git. The General Health benchmark Excel datasets (`medimind_general_health_test_dataset.xlsx`
and `medimind_advanced_nlp_triage_test_dataset.xlsx`), the Diabetes dataset (`diabetes.csv`),
and the Heart Disease dataset (`cardiovascular_diseases_dv3.csv`) are present locally.
All preprocessing, inference, and end-to-end integration tests execute and pass 100%.

## Where to see results
Run Heart Disease training from `ai-prediction-service/` with:

`py -c "from app.models.heart_disease.heart_disease_training import train_and_evaluate; train_and_evaluate('test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv', 'artifacts/heart_disease')"`

Run Diabetes training from `ai-prediction-service/` with:

`py -c "from app.models.diabetes.diabetes_training import train_and_evaluate; train_and_evaluate('test-dataset/Diabetes/diabetes.csv', 'artifacts/diabetes')"`

Live progress, model timings, MLP iterations, early stopping, and Random Forest
diagnostics appear in the terminal. Final metrics and training diagnostics are
saved in `artifacts/*/training_report.json`; trained model files are saved in the
same ignored folders.

## Validation status
The current project has been verified with pytest in the active environment.

Most recent validation result:
- 186 passed
- 0 skipped
- 0 failed
- 3 warnings (including 2 expected single-class ROC-AUC subgroup warnings for edge age bands)

The live service health, authorization, persistence, and inference endpoints have been validated.

## Heart Disease module status
The Heart Disease Risk Prediction module is fully trained, validated, and served via FastAPI:
- **Dataset**: Cardiovascular disease tabular dataset (`test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv`, `68,783` raw records, 11 predictive features + 1 binary target `CARDIO_DISEASE` with 34,742 negative / 34,041 positive).
- **Deduplication & Partitions**: Removed 3,820 exact duplicates, retaining 64,963 clean records (31,910 negative / 33,053 positive). Stratified 70/15/15 split: Train (`45,474`), Validation (`9,744`), Test (`9,745`).
- **Models Evaluated**: Logistic Regression (StandardScaler, max_iter=1000), Random Forest (200 trees, max_depth=12, min_samples_leaf=3), and regularized MLP (StandardScaler, hidden layers (32, 16), early stopping).
- **Model Selection**: **Random Forest** selected by validation ROC-AUC (`0.7944` vs LR `0.7882` and MLP `0.7919`).
- **Threshold Tuning**: Threshold `0.40` was selected from validation data under a minimum specificity floor of 0.60 to maximize recall. On the validation set: recall `0.7939`, specificity `0.6396`, precision `0.6953`, F1 `0.7413`.
- **Held-out Test Performance (9,745 rows)**:
  - **ROC-AUC**: `0.7961`
  - **PR-AUC**: `0.7835`
  - **Recall**: `0.8001` (3,967 of 4,958 positive cases detected)
  - **Specificity**: `0.6340` (3,035 of 4,787 negative cases correctly classified)
  - **Precision**: `0.6937`
  - **F1 Score**: `0.7431`
  - **Brier Score**: `0.1829`
  - **Expected Calibration Error (ECE)**: `0.0080` (excellent probability calibration)
  - **Error Analysis**: 1,752 false positives (FPR 36.60%), 991 false negatives (FNR 19.99%)
- **Subgroup Analysis**: Validated across GENDER (1, 2), AGE_BAND (30-44, 45-54, 55-64, 65+), CHOLESTEROL levels (1, 2, 3), and GLUCOSE levels (1, 2, 3).
- **Artifacts**: Stored under `artifacts/heart_disease/` (`best_model.joblib`, `random_forest.joblib`, `logistic_regression.joblib`, `mlp.joblib`, `training_report.json`), ignored by Git.

## Heart Disease inference status
The standalone inference service loads `random_forest.joblib` lazily, validates the 11-feature request schema, preserves the trained feature order, applies threshold `0.40`, and returns a probability, `HIGH`/`LOW` risk category, model version `0.2.0`, and a mandatory non-diagnostic disclaimer. The API persists successful inference results to MongoDB prediction history (`POST /api/ai/heart-disease`) with strict JWT family scoping and internal service key authentication. The common `risk_score` and `confidence` fields expose the estimated risk probability.

- **Limitations**: Non-diagnostic clinical decision support tool. Observational dataset cannot establish causality. Self-reported behavioural features (smoking, alcohol, physical activity) are subjective. Requires professional medical evaluation.

## Diabetes Risk Prediction module status
The Diabetes Risk Prediction module is fully trained, validated, and served via FastAPI:
- **Dataset**: Pima Indians Diabetes Database (`test-dataset/Diabetes/diabetes.csv`, `768` records, 8 numeric features, binary target `Outcome` with 500 negative / 268 positive class distribution).
- **Biological Zero Imputation**: Non-physiological zeros in `Glucose` (5), `BloodPressure` (35), `SkinThickness` (227), `Insulin` (374), and `BMI` (11) are imputed using non-zero training partition medians (`Glucose`: 117.0, `BloodPressure`: 72.0, `SkinThickness`: 29.0, `Insulin`: 126.0, `BMI`: 32.4) to avoid data leakage.
- **Model Selection & Metrics**: Evaluated Logistic Regression, Random Forest (200 trees), and a regularized MLP (32x16 hidden layers, early stopping). The **MLP model** was selected by validation ROC-AUC (`0.8180`). On the test set (116 rows), it achieved **0.8267 ROC-AUC**, **0.7205 PR-AUC**, and a Brier score of **0.1647**.
- **Threshold Tuning**: Threshold `0.25` was selected from validation data under a minimum specificity floor of 0.60 (maximizing recall). On the test set, the tuned model achieved **0.8049 recall** (33/41 positive cases detected) and **0.6800 specificity** (51/75 negative cases correctly classified).
- **Subgroup & Calibration Analysis**: Evaluated across age bands (21-30, 31-45, 46-60, 61+) and BMI categories (underweight/normal, overweight, obese). Expected Calibration Error (ECE) is **0.1037**. Error analysis identified 24 false positives and 8 false negatives on the test set.
- **Inference & API Route**: `DiabetesInferenceService` loads `best_model.joblib` lazily, enforces the 8-feature order, applies threshold `0.25`, outputs model version `0.1.0`, includes a mandatory non-diagnostic disclaimer, and persists predictions to MongoDB. `POST /api/ai/diabetes` validates inputs via `DiabetesRequest`, enforces JWT / internal key auth and family authorization, and returns `CommonPredictionResponse`. Returns HTTP 503 if model artifact is absent and HTTP 422 for invalid inputs.
- **Artifact Storage**: Trained model files (`best_model.joblib`, `logistic_regression.joblib`, `random_forest.joblib`, `mlp.joblib`) and `training_report.json` are saved under `artifacts/diabetes/` (ignored by Git).
- **Validation**: 32/32 focused diabetes tests in `tests/diabetes/` pass 100%. Full suite: 186 passed, 0 skipped, 0 failed.

## Current branch
- Branch: `feature/ai-prediction-service`
- Scope: AI prediction service module (General Health Triage, Heart Disease Risk, Diabetes Risk Prediction)

## Planned future modules
The repo roadmap includes additional prediction modules beyond general health, heart disease, and diabetes risk:

- fracture detection (PyTorch CNN for X-ray images)

The diabetes and heart disease routes have been validated for successful predictions, schema errors, missing authentication, OpenAPI exposure, and missing-model failure handling, so they are ready for future integration work.
