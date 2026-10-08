# MediMind

Intelligent clinical decision support and multi-hospital healthcare platform unifying patient families, clinicians, department heads, hospital administrators, and network platform owners.

---

## Overview

MediMind is a comprehensive, production-grade digital health ecosystem that bridges everyday clinical care with machine learning diagnostics. It provides:
- **Family Health Management:** Household-scoped records, dependent tracking, diagnostic screening, and appointments.
- **Clinical Physician Workspace:** Patient queue triage, clinical consultations, e-prescriptions, and AI-assisted radiological/risk decision support.
- **Departmental Governance:** Clinical department coordination, OPD shift scheduling, and practitioner performance oversight.
- **Hospital Administration:** Facility capacity, department provisioning, accreditation, and operational throughput monitoring.
- **Executive Network Governance:** Cross-hospital onboarding, multi-facility metrics, and platform-wide diagnostic utilization.

---

## Architecture

MediMind uses an asynchronous microservice architecture mediated by a unified API Gateway and a dedicated high-performance Python FastAPI AI inference service.

```
                               ┌─────────────────────────────────┐
                               │   MediMind Frontend (React 19)  │
                               │   Vite / Pure-SVG Charts (5173) │
                               └────────────────┬────────────────┘
                                                │ REST / JSON
                                                ▼
                               ┌─────────────────────────────────┐
                               │     API Gateway (Express)       │
                               │     Port: 5000                  │
                               │  Anti-Spoofing & Header Scoping │
                               └────────────────┬────────────────┘
                                                │
         ┌──────────────┬──────────────┬────────┼───────┬──────────────┬──────────────┐
         ▼              ▼              ▼        ▼       ▼              ▼              ▼
   ┌───────────┐  ┌───────────┐  ┌───────────┐ ... ┌───────────┐  ┌───────────┐  ┌──────────────────┐
   │   Auth    │  │  Family   │  │ Hospital  │     │  Record   │  │ Knowledge │  │   AI Prediction  │
   │  Service  │  │  Service  │  │  Service  │     │  Service  │  │  Service  │  │      Service     │
   │ Port 5001 │  │ Port 5002 │  │ Port 5003 │     │ Port 5006 │  │ Port 5008 │  │ Port 5007 (FastAPI)│
   └───────────┘  └───────────┘  └───────────┘     └───────────┘  └───────────┘  └──────────────────┘
```

---

## User Roles

The platform enforces strict Role-Based Access Control (RBAC) across five canonical personas:

1. **`FAMILY`**: Household health portal for managing family members, booking consultations, accessing medical records, and running patient-facing AI symptom/risk screenings.
2. **`DOCTOR`**: Clinical practitioner workspace for viewing scheduled patient appointments, conducting consultations, prescribing medications, and inspecting model explainability (e.g., Grad-CAM heatmaps).
3. **`DEPARTMENT_HEAD`**: Clinical department leadership overseeing departmental doctors, OPD shifts, and clinical practice guideline publication.
4. **`HOSPITAL_ADMIN`**: Hospital operational management administering facility beds, clinical departments, department heads, and hospital admissions trends.
5. **`CHAIRMAN`**: Platform owner governing multi-hospital network accreditation, onboarding applications, and system-wide clinical analytics.

---

## AI Modules

MediMind integrates four validated clinical decision support modules:

- **Fracture Detection (`ai_fracture`):** Deep convolutional neural network (ResNet-18 initialized on Stanford MURA v1.1 and calibrated on FracAtlas) detecting bone fractures in musculoskeletal radiographs.
  - *Production Operating Threshold:* `0.1800`
- **Diabetes Risk Assessment (`ai_diabetes`):** Multi-Layer Perceptron (MLP) trained on validated metabolic indicators (PIMA cohort) predicting type-2 diabetes onset.
  - *Production Operating Threshold:* `0.2500`
- **Heart Disease Risk Assessment (`ai_cardio`):** Calibrated Random Forest ensemble predicting 10-year cardiovascular disease risk from patient clinical profiles.
  - *Production Operating Threshold:* `0.4000`
- **General Health Assessment (`ai_general`):** Deterministic clinical Natural Language Processing (NLP) triage engine featuring negation detection, third-person attribution filtering, and emergency tri-pillar rules.

For an extensive technical breakdown of model architectures and validation experiments, refer to [MediMind AI/ML Final Report](MediMind_AI_ML_Final_Report.md).

---

## Backend Services

| Service | Purpose | Port | Database |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Entry point, routing, anti-spoofing, rate limiting, and request correlation | `5000` | Stateless (Reverse Proxy) |
| **Auth Service** | User authentication, password hashing, and JWT token issuance | `5001` | MongoDB (`medimind_auth`) |
| **Family Service** | Household accounts, member profiles, and dependent records | `5002` | MongoDB (`medimind_family`) |
| **Hospital Service** | Facilities, clinical departments, and onboarding workflows | `5003` | MongoDB (`medimind_hospital`) |
| **Doctor Service** | Doctor rosters, clinical specializations, and OPD availability | `5004` | MongoDB (`medimind_doctor`) |
| **Appointment Service**| Patient appointment scheduling and lifecycle management | `5005` | MongoDB (`medimind_appointment`) |
| **Medical Record Service** | Consultations, electronic prescriptions, and access consent | `5006` | MongoDB (`medimind_record`) |
| **AI Prediction Service** | Clinical AI model inference, thresholding, and validation persistence | `5007` | MongoDB (`medimind_ai`) |
| **Knowledge Service** | Clinical articles, guidelines, and patient health education | `5008` | MongoDB (`medimind_knowledge`) |

---

## Authentication & Security

- **JWT Authentication:** Cryptographically signed tokens encoding verified identity claims (`userId`, `role`, `referenceId`, `accountType`, `hospitalId`, `departmentId`).
- **Multi-Account Identity Isolation:** 26 canonical platform accounts across all five roles operate with strict session and data boundary isolation.
- **Gateway Anti-Spoofing:** The API Gateway strips all client-supplied identity headers (`x-user-id`, `x-user-role`, `x-hospital-id`, `x-department-id`, `x-family-id`) and replaces them with verified JWT claims.
- **Internal Service Authentication:** Downstream inter-service calls require mutual authentication using a private internal microservice secret.
- **Data Scoping:** Queries and mutations are dynamically constrained:
  - Doctors access only patients with active consent or appointment bookings.
  - Department Heads access only doctors and resources within their hospital and department.
  - Hospital Admins access only facilities and personnel belonging to their assigned hospital.
  - Families access only members and records belonging to their authenticated family ID.

---

## Testing & Validation

MediMind maintains exhaustive automated test suites across every tier of the application:

- **Multi-Account Identity Audit:** 523 / 523 checks passed (100% verification across all 26 accounts, cross-role switching, and data boundary isolation).
- **Backend Service Test Suites:** 264 / 264 unit and integration tests passed across 20 test suites (Auth, Gateway, Family, Hospital, Doctor, Appointment, Medical Records, Knowledge).
- **AI Prediction Service Tests:** 253 / 253 tests passed (Diabetes, Heart Disease, General Health NLP, Fracture Inference, Auth & Persistence).
- **Frontend Quality Gates:** Production Vite build passes cleanly with 0 errors; Oxlint passes on 302 files with 0 errors.

---

## AI / Research Status

- **Production Models:**
  - Fracture Detection: ResNet-18 (MURA $\to$ FracAtlas), operating threshold `0.1800`.
  - Heart Disease: Calibrated Random Forest, operating threshold `0.4000`.
  - Diabetes: MLP Classifier, operating threshold `0.2500`.
  - General Health: Deterministic clinical NLP triage engine with negation and attribution handling.
- **Research Experiments (Exp 1 – 8A):**
  - Experiments 1 through 8A systematically explored pediatric musculoskeletal radiograph analysis and dual-view fusion.
  - **Experiment 8A (`DualViewROIResNet18`):** Formally frozen research best achieving 95.18% sensitivity on GRAZ held-out test data and 94.59% on external PediURF cohort while maintaining 87.25% specificity on normal controls.
- **Frozen Artifacts:**
  - The academic *MediMind Data Science Case Study*, historical datasets, and research checkpoints remain frozen and protected.

---

## Development

### Prerequisites
- Node.js $\ge$ 18
- Python $\ge$ 3.11 with PyTorch, Torchvision, Scikit-Learn, and FastAPI
- MongoDB instance running on `localhost:27017`

### Setup & Local Execution

1. **Install Dependencies:**
   ```bash
   # Backend dependencies
   npm --prefix backend install

   # Frontend dependencies
   npm --prefix frontend install

   # AI Service dependencies
   pip install -r ai-prediction-service/requirements.txt
   ```

2. **Run All Backend Microservices:**
   ```bash
   npm --prefix backend run dev
   ```

3. **Run AI Prediction Service:**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 5007
   ```

4. **Run Frontend Application:**
   ```bash
   npm --prefix frontend run dev
   ```

5. **Run Full Live Demonstration Launcher:**
   ```bash
   node backend/scripts/start-live-demo.mjs
   ```

6. **Execute Automated Validation:**
   ```bash
   # Backend test suite
   npm --prefix backend test

   # Multi-account identity audit
   node backend/scripts/audit-all-role-accounts.mjs

   # Frontend production build
   npm --prefix frontend run build
   ```

---

## Repository Safety

- **Excluded Sensitive Assets:** All credentials, private keys, `.env` files, and session tokens are strictly ignored by version control.
- **Local Secret Storage:** `credentials.txt` serves strictly as an offline reference for local testing and demonstration rehearsal and is never committed.
- **Protected Checkpoints:** Large experiment binary weights (`.pt`) and local run result logs are kept locally and excluded from git tracking.

---

## Current Status

- **Authentication & Identity:** Fully completed, hardened, and verified with 523/523 checks passing across 26 canonical accounts.
- **Microservices & API Gateway:** All 8 Node.js services and the API Gateway are fully operational, tested, and integrated.
- **Clinical AI Services:** 4 production models active and tested (253/253 tests passing); Experiment 8A research baseline frozen.
- **Frontend Application:** Certified React 19 / Vite application with 68 routes, pure-SVG interactive visualizations, and zero lint errors.
- **Live Demo Readiness:** Verified and certified ready for evaluator presentation.
