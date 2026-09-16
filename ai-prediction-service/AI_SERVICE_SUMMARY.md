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
  - `models/general_health/` — NLP triage engine
  - `models/heart_disease/` — cardiovascular dataset inspection and preprocessing
  - `services/` — business service layer
  - `api/v1/` — API routes
- `tests/` — test suite covering NLP, auth, MongoDB persistence, and regression checks
- `test-dataset/` — local-only evaluation datasets; ignored by Git

## API routes
- `POST /api/ai/general-health` — analyze symptom text and produce an AI-assessed response
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

## Validation status
The current project has been verified with pytest in the active environment.

Most recent validation result:
- 114 passed
- 0 failed
- 2 existing dependency deprecation warnings

The live service was also checked at `http://localhost:5007/docs` for health,
emergency, negation, multilingual, and authorization flows. MongoDB was
available during validation; the in-memory fallback remains covered by the
database tests.

## Next module preparation
The Heart Disease module has started with dataset inspection and preprocessing
only. The available cardiovascular dataset contains 68,783 rows, 11 numeric
features, no missing values, and a binary target with 34,742 negative and
34,041 positive records. Training, model saving, inference routes, and frontend
integration are intentionally not started. Dataset details are documented in
`app/models/heart_disease/HEART_DISEASE_DATASET.md`.

## Current branch
- Branch: `feature/ai-prediction-service`
- Scope: AI prediction service module, especially general health triage

## Planned future modules
The repo roadmap includes additional prediction modules beyond general health, such as:

- fracture detection
- diabetes risk prediction
- heart disease risk prediction

These are not yet implemented in the current workspace state.
