# Department Head Portal Frontend Pre-Backend Audit & Certification

**Audit Date:** 2026-09-27  
**Auditor:** MediMind Engineering & Quality Assurance  
**Portal:** Clinical Department Head Hub  
**Authentication Role:** `DEPARTMENT_HEAD` (`priya.sharma@central.medimind.org` / `head123`)  
**Scope:** Department Roster, Doctor Performance Analytics, Room Allocations, OPD Scheduling, AI Diagnostic Quality Assurance, Knowledge & Publication Peer-Reviewer Workflow, Department Operating Settings.  
**Active Clinical Leader:** Dr. Priya Sharma (`DH-H1-ORTHO`, Head of Orthopedics & Musculoskeletal Sciences, MediMind Central Hospital `HOSP-001`, Department `DEP-H1-ORTHO`)

---

## 1. Route & View Inventory (10 Verified Views)

| Route / Hash | View Component | Status | Data Source | Interactive Controls | Theme (Light/Dark) | Responsive (1440px–320px) | Audit Verdict |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| `#dashboard` | `DashboardView.jsx` | 200 OK | `initialDepartmentHeadProfile`, `initialDepartmentInfo`, `initialDepartmentDoctors`, `initialDepartmentAppointments`, `initialDepartmentArticles` | Scoped OPD schedule (Max-3), Workload summary (Max-3), AI Diagnostic Telemetry (Max-3), Pending review alert, Quick Provision Doctor, Knowledge Review Queue trigger | Verified | PASS (No horizontal scroll) | **PASS** |
| `#doctors` | `DoctorsView.jsx` | 200 OK | `initialDepartmentDoctors` | Filter by status (Active/Inactive), Search by name/specialty/room, Provision Doctor Modal, Edit Room Modal, Toggle Status (Active/Inactive), View Profile | Verified | PASS | **PASS** |
| `#doctor_details` | `DoctorDetailsView.jsx` | 200 OK | Scoped doctor record (`selectedDoctorId`) | Clinician credentials, Allocated OPD room, Active caseload, Satisfaction rating, Assigned OPD schedule today, Edit & Toggle status | Verified | PASS | **PASS** |
| `#appointments` | `AppointmentsView.jsx` | 200 OK | `initialDepartmentAppointments` | Filter by attending doctor, Filter by status, Search by token/patient/doctor, Interactive AI Triage Pre-Check modal for screened appointments, Manual Triage for walk-ins, Operational table | Verified | PASS | **PASS** |
| `#workload` | `WorkloadView.jsx` | 200 OK | `initialDepartmentDoctors` | Live caseload bar chart (Active vs Completed throughput), Doctor caseload cards, Room allocation overview | Verified | PASS | **PASS** |
| `#analytics` | `DepartmentAnalyticsView.jsx` | 200 OK | `initialDepartmentAnalytics`, `initialDepartmentDoctors` | Monthly consultations, Completed consultations, Avg consultation duration, Ward bed occupancy (88%), Weekly volume chart, Subspecialty Donut chart, Hourly shift Heatmap with dynamic doctor-level breakdown tooltip | Verified | PASS | **PASS** |
| `#ai_analytics` | `AiAnalyticsView.jsx` | 200 OK | `initialDepartmentAnalytics.aiPipelineSummary`, `initialDepartmentInfo` | ResNet50-Ortho-v2.4 telemetry (Accuracy 98.4%, Sensitivity 98.1%, Specificity 98.8%), Anatomical fracture distribution Donut chart, Single department-relevant Model Calibration & Reliability Radar chart | Verified | PASS | **PASS** |
| `#performance` | `DoctorPerformanceView.jsx` | 200 OK | `initialDoctorPerformance`, `initialDepartmentDoctors` | Clinician Caseload vs Punctuality Scatter Plot (95% benchmark), Scheduled vs Completed throughput Grouped Bar Chart, Multi-sort table (consultations, on-time, rating, completion, workload), Filters | Verified | PASS | **PASS** |
| `#knowledge` | `KnowledgeView.jsx` | 200 OK | `initialDepartmentArticles` (`DEP-H1-ORTHO`) | Status tabs (All, Under Review, Changes Requested, Published, Drafts), Category filter, Search, Full Article Reader Modal, Peer-Review Decision Modal (Approve & Publish / Request Changes with mandatory written feedback) | Verified | PASS | **PASS** |
| `#settings` | `SettingsView.jsx` | 200 OK | `initialDepartmentHeadProfile`, `initialDepartmentSettings` | Scope-locked Hospital & Department fields, Profile editor (designation, phone, qualifications, hours), Notification toggles (trauma alerts, AI anomaly), Default slot duration selector | Verified | PASS | **PASS** |

---

## 2. Verified Invariants & Scope Guardrails

### 1. Strict Department & Hospital Scoping
- Dr. Priya Sharma is strictly scoped to `HOSP-001` (MediMind Central Hospital) and `DEP-H1-ORTHO` (Orthopedics & Musculoskeletal Sciences).
- Department Head can only provision, view, and assign OPD rooms for doctors belonging to `DEP-H1-ORTHO` (Dr. Rahul Mehta, Dr. Vikram Anand, Dr. Sneha Reddy, Dr. Rohan Joshi, etc.).
- Department OPD appointments are strictly filtered to `DEP-H1-ORTHO` appointments.

### 2. AI Triage Pre-Check Logic & Walk-in Classification
- Normal booked appointments (e.g. `ORTHO-101`, `ORTHO-102`, `ORTHO-202`, `ORTHO-402`, `ORTHO-601`) with valid AI screening display an interactive **AI Triage Pre-Check** indicator.
- Clicking the indicator opens an Operational AI Screening Status modal confirming automated pre-screening while maintaining clinical privacy.
- Walk-in appointments (`W-101`, `W-102`, `W-103`) display **Manual Triage** because AI triage is not required for emergency walk-ins.

### 3. Hourly Shift Activity Heatmap Doctor-Level Breakdown
- Hovering any hourly cell displays:
  - Total activity for that hour
  - Breakdown among doctors working in Orthopedics during that hour
  - Doctor name + individual count
  - Preserves total sum consistency (`sum(doctor_counts) === total_activity`).

### 4. Single-Model Calibration & Reliability Radar
- AI Analytics displays ONE single department-relevant radar for Fracture Detection AI (`ResNet-50 CNN`), avoiding multi-model / cross-department clutter.
- Reuses verified model metrics: Accuracy `98.4%`, Sensitivity `98.1%`, Specificity `98.8%`, Precision `97.5%`, Uptime `99.9%`.

### 5. Knowledge & Publication Reviewer Workflow
- Clearly visible in sidebar navigation with active review count badge.
- Dashboard highlights pending manuscripts with 1-click review action.
- Department Head can open Review Protocol, read full text, Approve & Publish, or Request Changes with mandatory written feedback.
- Changes Requested articles display reviewer feedback to the author; Published articles are read-only.

### 6. Strict Clinical Privacy Boundaries
- Zero leakage of private patient medical records, raw probability distributions, or confidential prescription drugs in Department Head view.

---

## 3. Verification & Certification Verdict: PASS (CERTIFIED)
- `oxlint`: 0 errors, 0 warnings across 129 files.
- `npm run build`: Success in 640ms.
- `validateCentralDataset()`: `valid: true, errors: []`.
- All Department Head workflows certified.
