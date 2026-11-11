# MediMind Phase 20: Architecture and Integration Audit

**Project:** MediMind – Intelligent Healthcare & Disease Prediction Platform  
**Repository Path:** `D:\projects\MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Base Commit Checkpoint:** `ba11bd5` (Head of branch; parent derivation: `a83c9388c12b055fd75f719f4654bd8847c2ae4f`)  
**Audit Scope:** End-to-End Architectural Enumeration, Inter-Service Communication, and Data Persistence Contracts  
**Audit Date:** 2026-11-04  

---

## 1. Architectural Overview

MediMind is an enterprise-grade, Service-Oriented Architecture (SOA) and microservices healthcare platform composed of three primary operational tiers:

```
                    +------------------------------------+
                    |       React / Vite Frontend        |
                    |            (Port 5173)             |
                    +-----------------+------------------+
                                      | HTTP / REST (JWT)
                                      v
                    +-----------------+------------------+
                    |      Express.js API Gateway        |
                    |            (Port 5000)             |
                    +-----------------+------------------+
                                      |
         +----------------------------+----------------------------+
         | Internal Service Proxy     | Kafka Events (Optional)    | Service Discovery
         v                            v                            v
+-------------------+      +----------------------+      +--------------------+
| Node Microservices|      | Apache Kafka Cluster |      | Netflix Eureka Svr |
| (Ports 5001-5006, |      |    (Port 9092)       |      |    (Port 8761)     |
|       5008)       |      +----------------------+      +--------------------+
+---------+---------+
          |                                  +---------------------+
          +--------------------------------->| FastAPI AI Service  |
          | HTTP Proxy / Header Forwarding   |     (Port 5007)     |
          |                                  +----------+----------+
          v                                             v
+-------------------------------------------------------+----------+
|                     MongoDB Atlas Cluster                        |
|                  (cluster0.plxllln.mongodb.net)                  |
| 8 Tenant Collections: auth, family, hospital, doctor,            |
| appointment, records, knowledge, ai                              |
+------------------------------------------------------------------+
```

---

## 2. Frontend Subsystem Structure

The frontend is a single-page application built on React 18, Vite 8, and vanilla CSS utility design patterns:

- **Build Pipeline:** `frontend/vite.config.js` proxies all `/api/*` traffic to the API Gateway at `http://localhost:5000`.
- **Centralized API Client:** `frontend/src/services/apiClient.js` provides authenticated `authFetch()`, token expiration decoding (`isTokenExpired()`), 5-second boundary pre-checks, and automatic dispatch of `medimind:unauthorized` events on 401 status.
- **Role-Based Portals & Layouts:**
  - `PatientLayout.jsx`: Household overview, appointment booking, alternative doctor discovery, AI risk assessment modal (`PredictionInputModal.jsx`).
  - `DoctorLayout.jsx`: Outpatient consultation workspace, assigned appointment schedules, clinical review queue, signed consultation note creation (`ConsultationsView.jsx`).
  - `HospitalAdminLayout.jsx`: Facility parameters, departmental capacity, doctor roster, hospital-scoped review queue.
  - `ChairmanLayout.jsx`: Executive platform governance, multi-hospital operational trends, intake contract attribution (`AppointmentsView.jsx`, `PlatformDashboard.jsx`).

---

## 3. Backend Microservices Inventory

All backend microservices run as modular Express.js servers with independent MongoDB database scopes, Kafka event publishing hooks, and Netflix Eureka registration clients:

| Service Name | Port | Database Scope | Key Endpoints | Responsibilities |
|---|---:|---|---|---|
| **API Gateway** | 5000 | N/A (Proxy / Security) | `/api/health`, `/api/*` | Reverse proxy, JWT verification, role-based route protection, correlation ID injection (`x-request-id`), identity sanitization. |
| **Auth Service** | 5001 | `medimind_auth` | `/api/auth/login`, `/api/auth/register`, `/api/auth/me` | User provisioning, bcrypt password validation, JWT generation (`HS256`, 24h expiry), role claim embedding. |
| **Family Service** | 5002 | `medimind_family` | `/api/families/my-family`, `/api/families/:id/members` | Household profile management, family member demographic tracking, primary contact verification. |
| **Hospital Service** | 5003 | `medimind_hospital` | `/api/hospitals`, `/api/departments`, `/api/department-heads` | Hospital facility directory (Harborview, Aarogyam, Nexora), department structures, operational status. |
| **Doctor Service** | 5004 | `medimind_doctor` | `/api/doctors`, `/api/doctors/:id`, `/api/doctors/department/:id` | Clinician rosters, specialty mapping, room assignments, active duty schedules. |
| **Appointment Service** | 5005 | `medimind_appointment` | `/api/appointments/stats`, `/api/appointments/review-queue`, `/api/appointments/:id/review` | Appointment lifecycle, scheduled/due workload partitioning, review queue, optimistic concurrency (`expectedUpdatedAt`). |
| **Medical Record Service** | 5006 | `medimind_records` | `/api/records`, `/api/consultations`, `/api/prescriptions` | Clinical consultation notes, diagnostic findings, clinician-signed electronic prescriptions, medical record timelines. |
| **Knowledge Service** | 5008 | `medimind_knowledge` | `/api/knowledge/articles`, `/api/knowledge/faq` | Curated patient education, clinical guidelines, preventive wellness reference articles. |

---

## 4. FastAPI AI Prediction Service Inventory

Located in `ai-prediction-service/`, the AI engine runs on Python 3.14 + FastAPI + Uvicorn:

- **Port:** 5007 (Configured in `ai-prediction-service/.env` and `app/core/config.py`).
- **Database Scope:** `medimind_ai` on MongoDB Atlas (via Motor / PyMongo asynchronous driver).
- **Authentication Middleware:** `app/middleware/auth.py` validates either inbound JWT Bearer tokens or internal shared service secret (`x-internal-service-secret` / `X-Internal-Service-Key`), decoding `family_member_id` scope to prevent cross-patient data access.
- **Registered Model Engines:**
  1. **Fracture Detection:** ResNet-18 plain radiograph convolutional neural network (`models/checkpoints/resnet18_best_fracatlas.pth`, 44.7 MB).
  2. **Diabetes Risk:** Scikit-learn Random Forest / Logistic Regression classifier trained on 8 clinical features.
  3. **Heart Disease Risk:** Gradient boosting / tree classifier trained on 11 cardiovascular parameters (DV3 dataset, 68,783 records).
  4. **General Health NLP:** Rule-based and semantic NLP triage extractor identifying emergency red flags (e.g., acute chest pain, dyspnea) vs routine symptoms.

---

## 5. Database & Entity Relationship Inventory

MongoDB Atlas cluster `cluster0.plxllln.mongodb.net` maintains 8 logically isolated databases:

```
[medimind_auth.users]
        |
        +--(1:1)-- [medimind_family.families]
        |                 |
        |                 +--(1:N)-- [family_members]
        |                                  ^
        |                                  |
        +--(1:1)-- [medimind_doctor.doctors]
        |                 |                |
        |                 v                v
        |          [medimind_appointment.appointments] <--(1:N)-- [medimind_ai.predictions]
        |                 ^                ^
        |                 |                |
        |          (appointment_id) (appointment_id)
        |                 |                |
        |                 +----------------+
        |                 |
        |          [medimind_records.consultations]
        |                 |
        |                 +--(1:N)-- [medimind_records.prescriptions]
        |
        +--(1:1)-- [medimind_hospital.hospitals]
                          |
                          +--(1:N)-- [departments]
```

### Key Relational Constraints Verified:
1. **Appointment $\to$ Patient:** Every appointment enforces an immutable `family_member_id` foreign key.
2. **Appointment $\to$ Doctor:** Appointments link to `doctor_id` in `medimind_doctor.doctors` and `hospital_id` in `medimind_hospital.hospitals`.
3. **AI Prediction $\to$ Appointment:** Pre-screened bookings maintain `appointment_id` foreign key. The 167 standalone triage predictions maintain `appointment_id: null` to preserve their authentic non-encounter status.
4. **Consultation $\to$ Appointment:** Consultations maintain strict 1:1 linkage via `appointment_id`. The 6 completed appointments lacking notes are surfaced in the Doctor review banner for authorized signing.
5. **Prescription $\to$ Consultation:** Prescriptions enforce `consultation_id`, `doctor_id`, and `patient_id` foreign keys; zero un-prescribed synthetic medications exist.

---

## 6. AI Module Integration Contracts

| Module | Route & Method | Input Contract | Response Schema | Output Risk Levels |
|---|---|---|---|---|
| **Fracture Detection** | `POST /api/ai/fracture` | `multipart/form-data`: `file` (image bytes), `family_member_id` (str), `appointment_id` (optional str) | `CommonPredictionResponse`: `prediction_id`, `possibleFracture` (bool), `confidence` (float), `risk_score` (float), `risk_level`, `model_name`, `disclaimer` | `HIGH`, `LOW` |
| **Diabetes Risk** | `POST /api/ai/diabetes` | `application/json`: `family_member_id`, `Pregnancies` (int), `Glucose` (float), `BloodPressure` (float), `SkinThickness` (float), `Insulin` (float), `BMI` (float), `DiabetesPedigreeFunction` (float), `Age` (int) | `CommonPredictionResponse`: `prediction_id`, `risk_level`, `risk_score`, `model_name`, `disclaimer` | `HIGH`, `LOW` |
| **Heart Disease Risk** | `POST /api/ai/heart-disease` | `application/json`: `family_member_id`, `AGE`, `GENDER`, `HEIGHT`, `WEIGHT`, `AP_HIGH`, `AP_LOW`, `CHOLESTEROL`, `GLUCOSE`, `SMOKE`, `ALCOHOL`, `PHYSICAL_ACTIVITY` | `CommonPredictionResponse`: `prediction_id`, `risk_level`, `risk_score`, `model_name`, `disclaimer` | `HIGH`, `LOW` |
| **General Health NLP** | `POST /api/ai/general-health` | `application/json`: `family_member_id` (str), `text` (str, $\ge 3$ chars) | `CommonPredictionResponse`: `prediction_id`, `result` (`possibleConcerns`, `urgency`, `guidance`, `symptomsExtracted`, `disclaimer`) | `EMERGENCY`, `MEDICAL_EVALUATION_RECOMMENDED`, `SELF_CARE`, `REVIEW_REQUIRED` |
| **Member History** | `GET /api/ai/member/{id}` | Query: `skip` (int), `limit` (int), Header: Bearer Token | `List[CommonPredictionResponse]` | Historical list sorted descending by `created_at` |

---

## 7. Identified Integration Gaps & Resolving Actions

1. **History Route Path Convention:**
   - *Observation:* The frontend previously attempted to query `GET /api/ai/general-health/history/:id`, whereas the canonical FastAPI endpoint is `GET /api/ai/member/{id}` and `GET /api/ai/{prediction_id}`.
   - *Resolution:* Validated that API Gateway accurately proxies all `/api/ai/*` routes to FastAPI. The test harness and documentation now target the canonical `GET /api/ai/member/{id}` route.
2. **Uvicorn IPv4 vs IPv6 Binding on Windows:**
   - *Observation:* Node 18+ resolves `localhost` to IPv6 `::1` by default, whereas Uvicorn binds to `127.0.0.1` (IPv4).
   - *Resolution:* Configured API Gateway proxy and test suites to bind to explicit IPv4 target `http://127.0.0.1:5007` to avoid intermittent connection drops.
