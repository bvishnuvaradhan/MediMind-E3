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
  - `services/` — business service layer
  - `api/v1/` — API routes
- `tests/` — test suite covering NLP, auth, MongoDB persistence, and regression checks

## API routes
- `POST /api/ai/general-health` — analyze symptom text and produce an AI-assessed response
- `GET /api/ai/member/{member_id}` — fetch prediction history for a member
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

- emergency red-flag detection
- moderate-risk triage rules
- self-care / low-risk classification
- mandatory medical disclaimer in every result
- conservative assessment behavior for urgent symptoms

## Validation status
The current project has been verified with pytest in the active environment.

Most recent validation result:
- 111 passed
- 0 failed

## Current branch
- Branch: `feature/ai-prediction-service`
- Scope: AI prediction service module, especially general health triage

## Planned future modules
The repo roadmap includes additional prediction modules beyond general health, such as:

- fracture detection
- diabetes risk prediction
- heart disease risk prediction

These are not yet implemented in the current workspace state.
