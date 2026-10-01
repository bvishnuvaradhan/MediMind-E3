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
| **Appointment Service** | `5005` | `medimind_appointment.appointments` | Appointment booking, slots, status transitions, doctor/patient linkage | **COMPLETE** |
| **Medical Record Service** | `5006` | `medimind_records.medical_records`, `consultations`, `prescriptions`, `record_access` | Clinical records, consultations, prescriptions, doctor access control | **COMPLETE** |
| **AI Service** | `5007` / `8000` | `medimind_ai` | AI disease risk predictions, explainability metrics, audit logs | NOT STARTED |
| **Knowledge Service** | `5008` | `medimind_knowledge.articles` | Medical knowledge articles, clinical protocols, review workflows | **COMPLETE** |

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
- **Status:** COMPLETE
- **Commit:** Pending (`feat(backend): implement medical record service`)
- **Services Implemented:**
  - `backend/medical-record-service/` (Port `5006`, Database: `medimind_records`)
- **Collections & Schemas Implemented:**
  - `MedicalRecord` schema & collection (`medimind_records.medical_records`)
    - Fields: `family_member_id`, `record_type` (`REPORT`, `TEST`, `XRAY`, `SCAN`, `ECG`, `PRESCRIPTION_DOCUMENT`, `OTHER`), `file_name`, `file_url`, `description`, `record_date`, `uploaded_by`, `source` (`FAMILY`, `DOCTOR`), `status` (`ACTIVE`, `DELETED`), timestamps
  - `RecordAccess` schema & collection (`medimind_records.record_access`)
    - Fields: `family_member_id`, `doctor_id`, `granted_by`, `granted_at`, `revoked_at`, `status` (`ACTIVE`, `REVOKED`), timestamps
  - `Consultation` schema & collection (`medimind_records.consultations`)
    - Fields: `family_member_id`, `doctor_id`, `appointment_id`, `symptoms`, `observations`, `clinical_assessment`, `treatment_plan`, `ai_prediction_ids`, `notes`, `status` (`DRAFT`, `FINAL`, `AMENDED`), `finalized_at`, `amendment_of`, timestamps
  - `Prescription` schema & collection (`medimind_records.prescriptions`)
    - Fields: `family_member_id`, `doctor_id`, `consultation_id`, `medicines` (`[{ name, dosage, frequency, duration, instructions }]`), `general_instructions`, `status` (`DRAFT`, `FINAL`, `CORRECTED`), `finalized_at`, `correction_of`, timestamps
- **Key Capabilities & APIs Implemented:**
  - **Medical Records:**
    - `POST /api/records` & `POST /api/records/upload` (Upload medical record metadata by Family or Doctor)
    - `GET /api/records/member/:memberId` (Unified patient clinical records; scoped to Family owner and authorized Doctors)
    - `GET /api/records/:recordId` (Single record retrieval)
    - `PUT /api/records/:recordId` (Update record description)
    - `DELETE /api/records/:recordId` (Soft-delete record, status `DELETED`)
  - **Doctor Record Access Control:**
    - `POST /api/records/access` (Family grants Doctor full record access for member; status `ACTIVE`)
    - `GET /api/records/access/member/:memberId` (Active authorized doctors for family member)
    - `PUT /api/records/access/:accessId/revoke` (Family revokes Doctor access; transitions to `REVOKED`)
    - `GET /api/records/access/doctor/me` (Doctor retrieves own access grant history)
  - **Consultation Lifecycle:**
    - `POST /api/consultations` (Doctor creates consultation in `DRAFT` status; validates appointment ownership)
    - `GET /api/consultations/member/:memberId` (List member consultations)
    - `GET /api/consultations/:consultationId` (Get consultation details)
    - `PUT /api/consultations/:consultationId` (Doctor updates `DRAFT` consultation)
    - `PUT /api/consultations/:consultationId/finalize` (Transitions `DRAFT` -> `FINAL`, sets `finalized_at`)
    - `POST /api/consultations/:consultationId/amend` (Creates linked `AMENDED` consultation via `amendment_of`)
  - **Prescription Lifecycle:**
    - `POST /api/prescriptions` (Doctor creates prescription in `DRAFT` status linked to consultation)
    - `GET /api/prescriptions/member/:memberId` (List member prescriptions)
    - `GET /api/prescriptions/:prescriptionId` (Get prescription details)
    - `PUT /api/prescriptions/:prescriptionId` (Doctor updates `DRAFT` prescription)
    - `PUT /api/prescriptions/:prescriptionId/finalize` (Transitions `DRAFT` -> `FINAL`, sets `finalized_at`)
    - `POST /api/prescriptions/:prescriptionId/correct` (Creates linked `CORRECTED` prescription via `correction_of`)
  - **Health Check:**
    - `GET /health` & `GET /api/records/health` (Database state and UP status)
- **Role Scoping & Security Invariants:**
  - **Explicit RecordAccess Requirement:** A doctor with an appointment alone does NOT get record access; explicit `RecordAccess` state must be `ACTIVE` (`403 Forbidden` if missing or revoked).
  - **Administrative Boundary Isolation:** Hospital Admin, Department Head, and Chairman cannot access private patient clinical records, consultations, or prescriptions (`403 Forbidden`).
  - **Family Boundary Isolation:** Cross-family access to records, consultations, or prescriptions is blocked (`403 Forbidden`).
  - **Immutability of Finalized Clinical Data:** Direct modification of `FINAL` consultations or prescriptions is prohibited (`400 Bad Request`). Changes must follow the audited `amend` and `correct` creation workflows.
- **Verification & Test Counts:**
  - Medical Record Test Suite: **10 / 10 passing (100%)**
  - Record Access Test Suite: **12 / 12 passing (100%)**
  - Consultation Lifecycle Test Suite: **9 / 9 passing (100%)**
  - Prescription Lifecycle Test Suite: **9 / 9 passing (100%)**
  - Total Medical Record Service Unit Tests: **40 / 40 passing (100%)**
  - Cumulative Workspace Unit Tests: **211 / 211 passing (100%)**
  - Live Multi-Service Integration (`verify:phase6`): **13 / 13 checks passing (100%)**
  - Prior Phase Regressions (`verify:phase1` through `verify:phase5`): **100% passing**
  - Oxlint: **0 errors, 0 warnings**

### Phase 7 — Knowledge Service
- **Status:** COMPLETE
- **Commit:** Pending (`feat(backend): implement knowledge service`)
- **Services Implemented:**
  - `backend/knowledge-service/` (Port `5008`, Database: `medimind_knowledge`)
- **Collections & Schemas Implemented:**
  - `Article` schema & collection (`medimind_knowledge.articles`) with comprehensive indexing:
    - `{ author_doctor_id: 1, status: 1 }`
    - `{ department_id: 1, status: 1 }`
    - `{ hospital_id: 1, status: 1 }`
    - `{ status: 1, published_at: -1 }`
- **Key Capabilities & APIs Implemented:**
  - **Article CRUD & Draft Privacy:**
    - `POST /api/knowledge/articles` (Doctor / Clinician author creates DRAFT or direct SUBMITTED article)
    - `GET /api/knowledge/articles` (Role-scoped article listing with multi-parameter filtering: status, department, author, hospital, category, keyword search, date range)
    - `GET /api/knowledge/articles/:articleId` (Single article retrieval with strict privacy: DRAFTs private to author; published articles public; review statuses scoped)
    - `PUT /api/knowledge/articles/:articleId` (Author updates draft / changes-requested article, optional resubmit)
    - `DELETE /api/knowledge/articles/:articleId` (Author deletes draft article only)
    - `GET /health` (Database connectivity & health)
  - **Review & Publishing Lifecycle Workflow:**
    - `POST /api/knowledge/articles/:articleId/submit` (Author transitions DRAFT / CHANGES_REQUESTED -> UNDER_REVIEW)
    - `POST /api/knowledge/articles/:articleId/review` (Department Head peer-review with mandatory written feedback on `CHANGES_REQUESTED` / `REJECT`, or `APPROVE`)
    - `POST /api/knowledge/articles/:articleId/publish` (Department Head publishes approved article -> PUBLISHED)
  - **Security Invariants & Role Scoping:**
    - **Draft Privacy:** Drafts are strictly private to authoring doctor (other clinicians, hospital admins, public received `403 Forbidden` / `401 Unauthorized`).
    - **Department Scoping:** Department Head can only review and publish articles within their assigned department (`403 Forbidden` for cross-department).
    - **Peer-Review Conflict Prohibition:** Clinicians cannot peer-review their own authored articles (`403 Forbidden`).
    - **Mandatory Feedback:** Requesting changes without written clinical feedback is rejected (`400 Bad Request`).
    - **Hospital Admin Oversight:** Hospital Admin has read-only oversight of non-draft articles within their assigned hospital; cannot view private drafts (`403 Forbidden`) or cross-hospital articles (`403 Forbidden`); cannot review/publish (`403 Forbidden`).
    - **Chairman Oversight:** Unrestricted platform-wide read-only oversight across all hospitals (private drafts excluded).
    - **Public / Family Access:** Can view published articles only without authentication.
- **Verification & Test Counts:**
  - Article Creation & Author Lifecycle Suite: **11 / 11 passing (100%)**
  - Article Review & Publishing Lifecycle Suite: **12 / 12 passing (100%)**
  - Article Scoping & Role Oversight Suite: **12 / 12 passing (100%)**
  - Total Knowledge Service Unit Tests: **35 / 35 passing (100%)**
  - Cumulative Workspace Unit Tests: **244 / 244 passing (100%)**
  - Live Multi-Service Integration (`verify:phase7`): **All checks passing (100%)**
  - Prior Phase Regressions (`verify:phase1` through `verify:phase6`): **100% passing**
  - Oxlint: **0 errors, 0 warnings**

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
| `medimind_records` | Medical Record Service | `medical_records`, `consultations`, `prescriptions`, `record_access` | Clinical records, consultations, prescriptions, doctor access grants |
| `medimind_ai` | AI Service | `ai_predictions`, `ai_audit_logs` | Risk predictions, explanations, telemetry |
| `medimind_knowledge` | Knowledge Service | `articles` | Clinical articles, protocols, peer reviews |

---

## 4. Current Git State & Verification Baseline

- **Current Branch:** `backend-development`
- **Latest Verified Commit:** `83fc738` (plus Phase 7 Knowledge Service implementation)
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
- [x] Phase 5: Appointment Service (`backend/appointment-service/`, port 5005, `medimind_appointment`)
- [x] Phase 6: Medical Record Service (`backend/medical-record-service/`, port 5006, `medimind_records`)
- [x] Phase 7: Knowledge Service (`backend/knowledge-service/`, port 5008, `medimind_knowledge`)
- [ ] Phase 8: End-to-End System Integration & Gateway Certification
