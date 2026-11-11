# MediMind

Intelligent clinical decision support and multi-hospital healthcare platform unifying patient families, clinicians, department heads, hospital administrators, and network platform owners.

---

## Architecture Overview

MediMind preserves a modular microservice architecture backed by MongoDB Atlas and a dedicated Python FastAPI ML inference service:

```text
React + Vite Frontend (frontend/)  ──Vercel Project 1──┐
                                                       ▼
API Gateway + 8 Express Services (backend/)  ──Vercel Project 2 (vercel.json + api/*.js)──┐
  ├── Gateway        (/api/*, /health)                                                    │
  ├── Auth           (/_internal/auth/*         -> medimind_auth)                         │
  ├── Family         (/_internal/family/*       -> medimind_family)                       │
  ├── Hospital       (/_internal/hospital/*     -> medimind_hospital)                     │
  ├── Doctor         (/_internal/doctor/*       -> medimind_doctor)                       │
  ├── Appointment    (/_internal/appointment/*  -> medimind_appointment)                  ├──▶ MongoDB Atlas
  ├── Medical Record (/_internal/records/*      -> medimind_records)                      │
  └── Knowledge      (/_internal/knowledge/*    -> medimind_knowledge)                    │
                                                                                          │
AI Prediction Service (ai-prediction-service/)  ──Docker (Render/Railway/Cloud Run)───────┘
  └── FastAPI (Port 5007 -> medimind_ai): Fracture CNN, Diabetes MLP, Heart Disease RF, General Health NLP
```

---

## User Roles & RBAC

The platform enforces role-based access control and gateway header anti-spoofing across five roles:

1. **`FAMILY`**: Household profiles, dependent records, standalone AI screenings, appointment booking, and access consent controls.
2. **`DOCTOR`**: Appointment triage queues, clinical consultations, e-prescriptions, and AI diagnostic decision support.
3. **`DEPARTMENT_HEAD`**: Clinical department oversight, OPD shifts, clinical guideline publishing, and practitioner management.
4. **`HOSPITAL_ADMIN`**: Facility capacity, department provisioning, and hospital throughput analytics.
5. **`CHAIRMAN`**: Multi-hospital network governance, onboarding approvals, eligibility controls, and executive analytics.

---

## AI Decision Support Modules

The Python FastAPI service (`ai-prediction-service/`) provides four production diagnostic models:

- **Fracture Detection (`ai_fracture`)**: ResNet-18 CNN (`artifacts/fracture/best_model.pt`, threshold `0.1800`) for musculoskeletal radiographs.
- **Diabetes Risk Assessment (`ai_diabetes`)**: MLP classifier (`artifacts/diabetes/best_model.joblib`, threshold `0.2500`).
- **Heart Disease Risk Assessment (`ai_cardio`)**: Calibrated Random Forest classifier (`artifacts/heart_disease/random_forest.joblib`, threshold `0.4000`).
- **General Health Triage (`ai_general`)**: Deterministic clinical NLP engine with negation handling, attribution filtering, and emergency rules.
- **Groq NLP Explanations (Optional)**: Controlled by `GROQ_ENABLED` / `GROQ_API_KEY` with non-blocking fallback to primary model output.

Detailed model documentation lives in [`docs/ai-model-cards/`](docs/ai-model-cards/) and [`Documents/AI/AI_ML_Model_Specification.txt`](Documents/AI/AI_ML_Model_Specification.txt).

---

## Deployment Documentation

- **Step-by-step Production Guide (Vercel + Docker + Atlas):** [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)
- **Environment Variable Matrix:** [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md)
- **Verification & Test Results:** [`docs/DEPLOYMENT_VERIFICATION.md`](docs/DEPLOYMENT_VERIFICATION.md)

---

## Local Development

### Prerequisites
- Node.js `>= 18`
- Python `>= 3.11` (`scikit-learn==1.7.0` recommended to match saved `.joblib` artifacts; PEP 508 environment markers handle Python `< 3.14` vs `>= 3.14`)
- Local MongoDB (`127.0.0.1:27017`) or MongoDB Atlas connection string

### Quick Start

1. **Install Dependencies:**
   ```bash
   npm --prefix backend install
   npm --prefix frontend install
   pip install -r ai-prediction-service/requirements.txt
   ```

2. **Configure Local `.env` Files:**
   Use [`backend/.env.example`](backend/.env.example), [`frontend/.env.example`](frontend/.env.example), and [`ai-prediction-service/.env.example`](ai-prediction-service/.env.example) as templates (never commit real `.env` files).

3. **Run All Services:**
   ```bash
   # Backend Gateway + 8 Express Microservices
   npm --prefix backend run dev

   # Python AI Prediction Service (port 5007)
   cd ai-prediction-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 5007

   # Frontend Vite Dev Server (port 5173)
   npm --prefix frontend run dev
   ```

4. **Run Validation Checks:**
   ```bash
   # Frontend lint & production build
   npm --prefix frontend run lint
   npm --prefix frontend run build

   # AI service tests
   cd ai-prediction-service && python -m pytest tests -v

   # Backend gateway & service Jest tests (run per service with test scripts)
   npm --prefix backend/api-gateway test
   ```

---

## Repository Security

- `.env` files, credentials workbooks, private keys, datasets, and `node_modules` are excluded via [`.gitignore`](.gitignore).
- Eureka (`eureka-server/`) and Kafka (`kafka-dashboard/`) remain available for optional local development and are disabled automatically in production/Vercel runtimes.
