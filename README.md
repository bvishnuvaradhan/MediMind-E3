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

## User Roles & Operational Workforce

The platform enforces strict Role-Based Access Control (RBAC) across five canonical personas, managing 96 active operational accounts and 2 deactivated accounts:

1. **`FAMILY`**: 10 Household Accounts (representing 44 registered family members) managing dependent records, booking consultations, accessing medical records, and executing standalone AI symptom/risk screenings.
2. **`DOCTOR`**: 68 Credentialed Doctor Profiles (66 Active, 2 Deactivated) triaging patient appointment queues, conducting clinical consultations, prescribing medications, and inspecting model explainability (e.g., Grad-CAM heatmaps).
3. **`DEPARTMENT_HEAD`**: 14 Department Leadership Accounts overseeing clinical departments across the 3 active network hospitals, OPD shifts, and clinical guideline publication.
4. **`HOSPITAL_ADMIN`**: 4 Hospital Operational Administrators administering facility capacities, clinical departments, department heads, and hospital throughput.
5. **`CHAIRMAN`**: 2 Platform Owners governing multi-hospital network accreditation, onboarding applications, hospital eligibility boundaries, and system-wide clinical analytics.

---

## AI Decision Support & Diagnostic Screenings

MediMind integrates four validated clinical decision support modules with 3,719 persisted predictions (3,693 appointment-linked, 26 standalone screenings with a 76.9% 30-day booking conversion rate):

- **Fracture Detection (`ai_fracture`):** Deep convolutional neural network (ResNet-18 initialized on Stanford MURA v1.1 and calibrated on FracAtlas) detecting bone fractures in musculoskeletal radiographs.
  - *Production Operating Threshold:* `0.1800`
- **Diabetes Risk Assessment (`ai_diabetes`):** Multi-Layer Perceptron (MLP) trained on validated metabolic indicators (PIMA cohort) predicting type-2 diabetes onset.
  - *Production Operating Threshold:* `0.2500`
- **Heart Disease Risk Assessment (`ai_cardio`):** Calibrated Random Forest ensemble predicting 10-year cardiovascular disease risk from patient clinical profiles.
  - *Production Operating Threshold:* `0.4000`
- **General Health Assessment (`ai_general`):** Deterministic clinical Natural Language Processing (NLP) triage engine featuring negation detection, third-person attribution filtering, and emergency tri-pillar rules.

- **Groq NLP Explanations (Optional):** Supports integration with Groq (`GROQ_API_KEY`, `GROQ_ENABLED=true`) for server-side generation of patient-friendly natural language explanations for primary model outputs. Ensures strict zero-dependency fallback to primary models if Groq is unavailable.

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

   # Frontend production build & lint
   npm --prefix frontend run lint
   npm --prefix frontend run build

   # End-to-End Browser Acceptance Suite (Playwright)
   # Requires running stack (ports 5000-5008, 5173)
   npm --prefix frontend run test:e2e
   ```

---

## End-to-End (E2E) Browser Testing

MediMind includes an automated Playwright acceptance suite validating full browser-to-backend-to-AI workflows:
- **Test Framework:** Playwright with headless Chromium
- **Execution Command:** `npm --prefix frontend run test:e2e`
- **Scope Covered:**
  - `01-chairman.spec.js`: Executive network governance, hospital list, platform analytics, and settings.
  - `02-hospital-admin.spec.js`: Hospital admin oversight, multi-hospital analytics (H1, H2, H3), and department rosters.
  - `03-department-head.spec.js`: Department-specific dashboards, clinical guidelines, and cross-department isolation.
  - `04-doctor.spec.js`: Doctor workspaces (Orthopedics, Diabetology), consultations, e-prescriptions, and practitioner identity isolation.
  - `05-family.spec.js`: Family portals, household member switching, and cross-family boundary privacy.
  - `06-ai-predictions.spec.js`: Live clinical inference pipelines: X-ray radiograph fracture upload, metabolic risk scoring, symptom NLP triage, and Groq supporting explanations.

---

## Repository Safety

- **Excluded Sensitive Assets:** All credentials, private keys, `.env` files, and session tokens are strictly ignored by version control.
- **Local Secret Storage:** `credentials.txt` serves strictly as an offline reference for local testing and demonstration rehearsal and is never committed.
- **Protected Checkpoints:** Large experiment binary weights (`.pt`) and local run result logs are kept locally and excluded from git tracking.

---

## Governance, Data Integrity & Master Remediation Audits

The root directory maintains comprehensive, evidence-based audit reports certifying data integrity, security hardening, and release readiness:

1. [MediMind Master Remediation Report](MediMind_Master_Remediation_Report.md) — Overarching release gate certification across all 13 phases.
2. [MediMind Account Lifecycle & Deactivation Audit](MediMind_Account_Lifecycle_and_Deactivation_Audit.md) — Directory vs. dashboard reconciliation and staging deactivation boundaries.
3. [MediMind Hospital Eligibility & Throughput Audit](MediMind_Hospital_Eligibility_and_Throughput_Audit.md) — Zero pending throughput enforcement and Sunrise encounter resolution.
4. [MediMind Appointment & Clinical Record Integrity](MediMind_Appointment_and_Clinical_Record_Integrity.md) — Past unattended closures, October booking creation volume, and zero orphaned records.
5. [MediMind AI Prediction & Standalone Screening Audit](MediMind_AI_Prediction_and_Standalone_Screening_Audit.md) — Prediction timestamps, dynamic relative periods, and 76.9% screening conversion.
6. [MediMind Performance & Cache Freshness Report](MediMind_Performance_and_Cache_Freshness_Report.md) — Sub-second Owner latency benchmarks and 15s/30s dual-tier cache validation.
7. [MediMind E2E Role & Cross-Flow Test Report](MediMind_E2E_Role_and_Cross_Flow_Test_Report.md) — Cross-role workflows, access control denial (HTTP 403), and contract verification.
8. [MediMind Security & Cryptographic Integrity Report](MediMind_Security_and_Data_Integrity_Report.md) — 100% 6/6 SHA-256 model checksum verification and secret scanning.
9. [MediMind Repository Cleanup Report](MediMind_Repository_Cleanup_Report.md) — 5,950 file inventory, safe deletions, and hardened .gitignore rules.

---

## Current Status & Release Certification

- **Target Branch:** `experiment8-multiview-localized-fusion` (Never pushed to `main`).
- **Cryptographic Integrity:** 6/6 Model weights matched bit-for-bit (0% drift).
- **Test Discovery:** Pytest 283/283 passed; Jest 74/74 passed; Vite production build bundled cleanly in 1.30s.
- **Reporting Engine:** 5 multi-sheet OpenXML compliant Excel workbooks verified (< 5s export, zero timeouts).
- **Release Readiness:** Certified Production-Ready for final deployment.
