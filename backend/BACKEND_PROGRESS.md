# MediMind Backend Progress Tracker

This document tracks cumulative backend development, architecture, verified microservices, and database ownership across all development phases.

---

## 1. Architecture & Port Allocations

| Service | Port | Database / Collection | Responsibilities | Status |
|---|:---:|---|---|:---:|
| **API Gateway** | `5000` | N/A | Reverse proxy, JWT validation, anti-spoofing header protection, correlation IDs, rate limiting | **COMPLETE** |
| **Auth Service** | `5001` | `medimind_auth.users` | Authentication, Argon/Bcrypt hashing, JWT issuance & verification, multi-role profile management | **COMPLETE** |
| **Family Service** | `5002` | `medimind_family.families`, `family_members` | Family account registration, profile management, member roster CRUD, relationship scoping | **COMPLETE** |
| **Hospital Service** | `5003` | `medimind_hospital.hospitals`, `departments`, `department_heads`, `hospital_requests` | Hospital profiles, department hierarchy, department head assignment, onboarding requests | **COMPLETE** |
| **Doctor Service** | `5004` | `medimind_doctor.doctors` | Doctor profiles, credentials, department association, availability | **COMPLETE** |
| **Appointment Service** | `5005` | `medimind_appointment` | Appointment booking, slots, status transitions, doctor/patient linkage | NOT STARTED |
| **Medical Record Service** | `5006` | `medimind_records` | Clinical records, lab reports, EHR data, prescriptions | NOT STARTED |
| **AI Service** | `5007` / `8000` | `medimind_ai` | AI disease risk predictions, explainability metrics, audit logs | NOT STARTED |
| **Knowledge Service** | `5008` | `medimind_knowledge` | Medical knowledge articles, clinical protocols, review workflows | NOT STARTED |

---

## 2. Microservice Phase Status

### Phase 1 — API Gateway & Authentication Service
- **Status:** COMPLETE
- **Commit:** `a21efb1` (`feat(backend): implement api gateway and authentication service`)
- **Services Implemented:**
  - `backend/api-gateway/` (Port `5000`)
  - `backend/auth-service/` (Port `5001`)
- **Key Capabilities Verified:**
  - Secure bcrypt password hashing and constant-time verification
  - JWT token generation (24h expiry) and strict verification
  - Role-based account persistence across all 5 roles (`FAMILY`, `DOCTOR`, `DEPARTMENT_HEAD`, `HOSPITAL_ADMIN`, `CHAIRMAN`)
  - Gateway anti-spoofing: strips incoming `x-user-*` headers and injects verified identity claims
  - Internal service authentication via shared `x-internal-service-secret`
  - Centralized error formatting envelope `{ success, message, data, error }`
- **Verification & Test Counts:**
  - Auth Service Unit & Integration Tests: **23 / 23 passing (100%)**
  - API Gateway Tests: **13 / 13 passing (100%)**
  - Live Multi-Service Integration: **11 / 11 checks passing (100%)**
  - Oxlint: **0 errors, 0 warnings**

### Phase 2 — Family Service
- **Status:** COMPLETE
- **Commit:** `7c119ed` (`feat(backend): implement family service and member management`)
- **Services Implemented:**
  - `backend/family-service/` (Port `5002`)
- **Key Capabilities Verified:**
  - `Family` Mongoose schema & collection (`medimind_family.families`)
  - `FamilyMember` Mongoose schema & collection (`medimind_family.family_members`)
  - Endpoints:
    - `POST /api/families` (Public registration)
    - `GET /api/families/me` (Profile retrieval)
    - `PUT /api/families/me` (Creator-only profile update)
    - `POST /api/families/members` (Add member)
    - `GET /api/families/members` (List active members)
    - `GET /api/families/members/:memberId` (Get single member)
    - `PUT /api/families/members/:memberId` (Update member)
    - `DELETE /api/families/members/:memberId` (Soft-delete member, creator only)
    - `GET /health` (Database connectivity & health)
  - Security Invariant: Strict family boundary isolation (cross-family member access blocked with `403 Forbidden`)
  - Security Invariant: Creator-only permissions for member removal and profile modification
- **Verification & Test Counts:**
  - Family Member Test Suite: **13 / 13 passing (100%)**
  - Family Account Test Suite: **9 / 9 passing (100%)**
  - Total Family Service Tests: **22 / 22 passing (100%)**
  - Live Multi-Service Integration: **10 / 10 checks passing (100%)**
  - Oxlint: **0 errors, 0 warnings**

### Phase 3 — Hospital Service
- **Status:** COMPLETE
- **Commit:** Pending (`feat(backend): implement hospital service`)
- **Services Implemented:**
  - `backend/hospital-service/` (Port `5003`, Database: `medimind_hospital`)
- **Collections & Schemas Implemented:**
  - `Hospital` schema & collection (`medimind_hospital.hospitals`)
  - `Department` schema & collection (`medimind_hospital.departments`) with compound unique index `{ hospital_id: 1, name: 1 }`
  - `DepartmentHead` schema & collection (`medimind_hospital.department_heads`)
  - `HospitalRequest` schema & collection (`medimind_hospital.hospital_requests`)
- **Key Capabilities & APIs Implemented:**
  - **Hospital Endpoints:**
    - `GET /api/hospitals` (Public / directory listing; Hospital Admin filtered to assigned hospital; Chairman sees all)
    - `GET /api/hospitals/:hospitalId` (Retrieve hospital details; Hospital Admin scoped; Chairman unrestricted)
    - `PUT /api/hospitals/:hospitalId` (Update hospital details; Hospital Admin scoped to assigned hospital; Chairman unrestricted)
    - `POST /api/hospitals` (Chairman direct creation)
    - `GET /health` (Database connectivity & health)
  - **Department Endpoints:**
    - `POST /api/departments` (Create department; Hospital Admin scoped to assigned hospital; duplicate name rejected with `409 Conflict`)
    - `GET /api/departments` (List departments; Hospital Admin scoped; Chairman cross-hospital filterable)
    - `GET /api/departments/:departmentId` (Get department by ID)
    - `PUT /api/departments/:departmentId` (Update department; Hospital Admin scoped to assigned hospital)
  - **Department Head Endpoints:**
    - `POST /api/department-heads` (Assign department head; Hospital Admin scoped; department ownership validated)
    - `GET /api/department-heads` (List department heads; Hospital Admin scoped)
    - `PUT /api/department-heads/:headId` (Update department head status; Hospital Admin scoped)
  - **Hospital Onboarding Request Workflow:**
    - `POST /api/hospital-requests` (Public onboarding submission)
    - `GET /api/hospital-requests` (Chairman queue listing, status filterable)
    - `GET /api/hospital-requests/:requestId` (Chairman request details)
    - `POST|PUT /api/hospital-requests/:requestId/approve` (Chairman approval; automatically provisions Hospital and requested Departments; duplicate transition returns 400)
    - `POST|PUT /api/hospital-requests/:requestId/reject` (Chairman rejection with reason; duplicate transition returns 400)
- **Role Scoping & Security Invariants:**
  - `HOSPITAL_ADMIN` strictly scoped to assigned hospital (cross-hospital reads and updates blocked with `403 Forbidden`)
  - `CHAIRMAN` has platform administrative scope across all hospitals, departments, and onboarding requests
  - Department names strictly unique per hospital (`409 Conflict` on duplicates within same hospital; same name permitted across different hospitals)
  - Public onboarding submissions allowed without authentication; administrative oversight restricted to Chairman
  - Gateway anti-spoofing and optional identity forwarding intact
  - Resilient Atlas connection timeout with instant local MongoDB fallback
- **Verification & Test Counts:**
  - Hospital Test Suite: **12 / 12 passing (100%)**
  - Department Test Suite: **9 / 9 passing (100%)**
  - Department Head Test Suite: **7 / 7 passing (100%)**
  - Hospital Request Onboarding Test Suite: **10 / 10 passing (100%)**
  - Total Hospital Service Unit Tests: **38 / 38 passing (100%)**
  - Cumulative Workspace Unit Tests: **96 / 96 passing (100%)**
  - Live Multi-Service Integration (`verify:phase3`): **14 / 14 checks passing (100%)**
  - Phase 1 & Phase 2 Regressions (`verify:phase1`, `verify:phase2`): **100% passing**
  - Oxlint: **0 errors, 0 warnings**

### Phase 4 — Doctor Service
- **Status:** COMPLETE
- **Commit:** Pending (`feat(backend): implement doctor service`)
- **Services Implemented:**
  - `backend/doctor-service/` (Port `5004`, Database: `medimind_doctor`)
- **Collections & Schemas Implemented:**
  - `Doctor` schema & collection (`medimind_doctor.doctors`) matching specifications in `Documents/Backend/Database/Doctor Schema.txt`
  - Fields: `user_id`, `hospital_id`, `department_id`, `full_name`, `email`, `mobile`, `specialization`, `qualifications`, `experience_years`, `professional_description`, `availability` (weekly slots with `day`, `start_time`, `end_time`), `status` (`ACTIVE`/`INACTIVE`), `profile_picture`
- **Key Capabilities & APIs Implemented:**
  - `GET /api/doctors` (Public directory listing; search by name/email/specialization; filter by specialization, hospitalId, departmentId; scoped for Hospital Admin and Department Head; Chairman unrestricted)
  - `GET /api/doctors/:doctorId` (Doctor profile details; scoped for Hospital Admin and Department Head)
  - `POST /api/doctors` (Doctor account provisioning by Department Head, Hospital Admin, or Chairman; cross-service provisioning to Auth Service via internal REST `POST /api/auth/internal/users` with `x-internal-service-secret`)
  - `PUT /api/doctors/:doctorId` (Doctor profile updates; Doctor can update own profile only; Department Head and Hospital Admin scoped; Chairman unrestricted; status changes restricted to administrative roles)
  - `GET /api/doctors/:doctorId/availability` (Public schedule retrieval)
  - `PUT /api/doctors/:doctorId/availability` (Doctor updates own weekly availability; Department Head / Admin scoped)
  - `GET /health` (Database connectivity & health)
- **Role Scoping & Security Invariants:**
  - `DOCTOR`: own profile and availability management only; blocked from modifying other doctors (`403 Forbidden`)
  - `DEPARTMENT_HEAD`: creates doctors within assigned department; updates doctors and schedules in assigned department; cross-department updates blocked (`403 Forbidden`)
  - `HOSPITAL_ADMIN`: creates and manages doctors within assigned hospital; cross-hospital updates blocked (`403 Forbidden`)
  - `CHAIRMAN`: platform-wide visibility and administrative authority across all hospitals and departments
  - `FAMILY` / Public: directory browsing and availability viewing only; administrative management blocked (`403 Forbidden`)
  - Cross-service credential provisioning: Doctor Service coordinates via internal REST with Auth Service without directly manipulating `medimind_auth`
- **Verification & Test Counts:**
  - Doctor Retrieval & Scoping Test Suite: **12 / 12 passing (100%)**
  - Doctor Creation & Provisioning Test Suite: **11 / 11 passing (100%)**
  - Doctor Update & Permissions Test Suite: **12 / 12 passing (100%)**
  - Doctor Availability Test Suite: **14 / 14 passing (100%)**
  - Total Doctor Service Unit Tests: **49 / 49 passing (100%)**
  - Cumulative Workspace Unit Tests: **145 / 145 passing (100%)**
  - Live Multi-Service Integration (`verify:phase4`): **11 / 11 checks passing (100%)**
  - Prior Phase Regressions (`verify:phase1`, `verify:phase2`, `verify:phase3`): **100% passing**
  - Oxlint: **0 errors, 0 warnings**

### Phase 5 — Appointment Service
- **Status:** COMPLETE
- **Commit:** Pending (`feat(backend): implement appointment service`)
- **Services Implemented:**
  - `backend/appointment-service/` (Port `5005`, Database: `medimind_appointment`)
- **Collections & Schemas Implemented:**
  - `Appointment` schema & collection (`medimind_appointment.appointments`) matching locked specifications in `Documents/Backend/Database/Mongoose Schemas.txt`
  - Fields: `family_member_id`, `doctor_id`, `hospital_id`, `department_id`, `appointment_date`, `start_time`, `end_time`, `reason`, `status` (`BOOKED`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`), `appointment_type` (`BOOKED`, `WALK_IN`), `ai_prediction_id` (nullable for walk-ins), `cancelled_at`, `cancellation_reason`, `created_at`, `updated_at`
  - Indexes: `{ doctor_id: 1, appointment_date: 1, start_time: 1 }`, `{ hospital_id: 1, department_id: 1 }`
- **Key Capabilities & APIs Implemented:**
  - `POST /api/appointments` (Book appointment; verifies Family ownership via Family Service REST; verifies Doctor existence and status via Doctor Service REST; resolves hospital and department IDs; detects slot conflicts; supports walk-in bookings without pre-assigned AI triage)
  - `GET /api/appointments` (List appointments scoped by caller identity: Family sees family members only; Doctor sees own assigned appointments; Department Head sees department appointments; Hospital Admin sees hospital appointments; Chairman has unrestricted platform visibility; query filters by status, doctorId, appointmentType, date)
  - `GET /api/appointments/:appointmentId` (Retrieve appointment details with strict role and tenancy scoping)
  - `PUT /api/appointments/:appointmentId/reschedule` (Reschedule date and time slot; enforces conflict detection; updates status to `RESCHEDULED`)
  - `PUT /api/appointments/:appointmentId/cancel` (Cancel appointment with reason and timestamp tracking; prevents cancellation of completed appointments)
  - `PUT /api/appointments/:appointmentId/complete` (Mark appointment completed by assigned Doctor, Hospital Admin, or Chairman; blocks Family from completing)
  - `PUT /api/appointments/:appointmentId/status` (Clinical lifecycle state machine: `BOOKED` -> `CONFIRMED` -> `CHECKED_IN` -> `IN_PROGRESS` -> `COMPLETED`)
  - `GET /health` (Database connectivity & health)
- **Role Scoping & Security Invariants:**
  - Double booking conflict prevention: Doctor cannot have overlapping appointments on the same date (`409 Conflict`)
  - Family membership boundary: Family user cannot book or view appointments for members outside their family (`403 Forbidden`)
  - Doctor boundary: Doctor can only access and update appointments where they are the assigned doctor (`403 Forbidden`)
  - Hospital boundary: Hospital Admin can only access appointments belonging to their assigned hospital (`403 Forbidden`)
  - Department boundary: Department Head can only access appointments within their department (`403 Forbidden`)
  - Terminal state invariant: Cancelled and completed appointments cannot be reopened or mutated (`400 Bad Request`)
  - Walk-in support: Walk-in appointments created without requiring AI prediction linkage
- **Verification & Test Counts:**
  - Appointment Booking Test Suite: **8 / 8 passing (100%)**
  - Appointment Lifecycle Test Suite: **8 / 8 passing (100%)**
  - Appointment Scoping & Retrieval Test Suite: **10 / 10 passing (100%)**
  - Total Appointment Service Unit Tests: **26 / 26 passing (100%)**
  - Cumulative Workspace Unit Tests: **171 / 171 passing (100%)**
  - Live Multi-Service Integration (`verify:phase5`): **11 / 11 checks passing (100%)**
  - Prior Phase Regressions (`verify:phase1`, `verify:phase2`, `verify:phase3`, `verify:phase4`): **100% passing**
  - Oxlint: **0 errors, 0 warnings**

### Phase 6 — Medical Record Service
- **Status:** NOT STARTED

### Phase 7 — Knowledge Service
- **Status:** NOT STARTED

### Phase 8 — Backend Integration & Final Verification
- **Status:** NOT STARTED

---

## 3. Database Ownership Matrix

| Logical Database Name | Service Owner | Primary Collections | Description |
|---|---|---|---|
| `medimind_auth` | Auth Service | `users` | User credentials, roles, account types, auth status |
| `medimind_family` | Family Service | `families`, `family_members` | Family profiles and patient member rosters |
| `medimind_hospital` | Hospital Service | `hospitals`, `departments`, `department_heads`, `hospital_requests` | Hospital facilities, department hierarchies, head assignments, onboarding requests |
| `medimind_doctor` | Doctor Service | `doctors` | Doctor profiles, credentials, department association, schedules |
| `medimind_appointment`| Appointment Service | `appointments`, `time_slots` | Booking workflows, schedules, and visits |
| `medimind_records` | Medical Record Service | `medical_records`, `prescriptions` | Clinical records, lab reports, EHR data |
| `medimind_ai` | AI Service | `ai_predictions`, `ai_audit_logs` | Risk predictions, explanations, telemetry |
| `medimind_knowledge` | Knowledge Service | `articles`, `protocols` | Clinical articles, protocols, peer reviews |

---

## 4. Current Git State & Verification Baseline

- **Current Branch:** `backend-development`
- **Latest Verified Commit:** `563c836` (plus completed Phase 3 and Phase 4 changes)
- **Infrastructure Consolidation:** Monorepo root npm workspace with shared `backend/node_modules/`, unified `backend/.env` with one global `MONGODB_URI`, and isolated logical databases per service.

---

## 5. Preservation Invariants

1. **Frontend Isolation:** `frontend/` (branch `frontend/vishnu`) is frozen and remains untouched.
2. **AI Service Isolation:** `ai-prediction-service/` is frozen and remains untouched.
3. **No AI Code Copying:** Standalone AI algorithms/scripts must NOT be copied into backend microservices.
4. **Credential Security:** MongoDB Atlas credentials and secrets must NEVER be committed to Git or printed in logs/reports.
5. **Specification Compliance:** All endpoints, status codes, and scoping models strictly follow `Documents/Backend/`.

---

## 6. Future Phase Development Checklist

- [x] Phase 1: API Gateway & Auth Service
- [x] Phase 2: Family Service
- [x] Phase 3: Hospital Service (`backend/hospital-service/`, port 5003, `medimind_hospital`)
- [x] Phase 4: Doctor Service (`backend/doctor-service/`, port 5004, `medimind_doctor`)
- [ ] Phase 5: Appointment Service (`backend/appointment-service/`, port 5005, `medimind_appointment`)
- [ ] Phase 6: Medical Record Service (`backend/medical-record-service/`, port 5006, `medimind_records`)
- [ ] Phase 7: Knowledge Service (`backend/knowledge-service/`, port 5008, `medimind_knowledge`)
- [ ] Phase 8: End-to-End System Integration & Gateway Certification
