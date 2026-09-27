# Hospital Admin Portal Frontend Pre-Backend Audit

**Audit Date:** 2026-09-27  
**Auditor:** MediMind Engineering & Quality Assurance  
**Portal:** Hospital Facility Administration  
**Authentication Role:** `HOSPITAL_ADMIN` (`admin.central@medimind.org` / `admin123`)  
**Scope:** Institutional Facility Profile, Clinical Departments, Department Heads, Staff Management, Hospital Operational & Comparative Analytics, AI Diagnostics QA, Compliance Reporting.  
**Active Administrator:** Rajesh Kumar (`ADM-001`, MediMind Central Hospital `HOSP-001`)

---

## 1. Route Inventory & Verification (14 Views)

| Route / Hash | View Component | Status | Data Source | Interactive Controls | Theme (Light/Dark) | Responsive | Scroll | Result |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| `#dashboard` | `DashboardView.jsx` | 200 OK | `initialHospitalProfile`, `initialHospitalAnalytics`, `initialDepartments` | Bed occupancy gauge, OPD throughput KPI, Department list (max-3), Quick generate report, Export data | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#profile` | `HospitalProfileView.jsx` | 200 OK | `initialHospitalProfile` | Edit hospital details modal, Bed capacity, NABH/JCI standing, License info, Emergency contacts | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#departments` | `DepartmentsView.jsx` | 200 OK | `initialHospitalDepartments` | Filter by status, Search dept, Create department modal, Edit department modal, Toggle status | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#department-heads`| `DepartmentHeadsView.jsx` | 200 OK | `initialDepartmentHeads` | Search head, Create department head modal, View head details trigger, Contact leadership | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#department-head-details`| `DepartmentHeadDetailsView.jsx` | 200 OK | Scoped head record | Leadership credentials, Department metrics, Assigned clinicians count, Back button | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#doctors` | `DoctorsView.jsx` | 200 OK | `initialHospitalDoctors` | Filter by department, Search doctor, View doctor details trigger, Room allocation summary | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#doctor-details` | `DoctorDetailsView.jsx` | 200 OK | Scoped doctor record | Clinician credentials, Department affiliation, Room assignment, Schedule stats, Back button | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#staff` | `StaffManagementView.jsx` | 200 OK | Facility staff roster | Filter role (Doctor, Head, Admin, Nurse), Search staff, Shift allocations, Headcount metrics | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#analytics` | `HospitalAnalyticsView.jsx`| 200 OK | `initialHospitalAnalytics` | 5-Month OPD trend (Line), Department traffic (Bar), Bed occupancy (Radial), Mode distribution | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#department-analytics` | `DepartmentAnalyticsView.jsx` | 200 OK | Scoped department metrics | Department comparative throughput (Bar), Caseload distribution, Completion rates | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#ai-analytics` | `AiAnalyticsView.jsx` | 200 OK | `initialAiAnalytics` | Hospital-wide AI accuracy (98.2%), 4-module radar chart, Inference latency chart (Bar) | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#reports` | `ReportsView.jsx` | 200 OK | `initialReports` | Download audit report PDF, Generate report modal, Filter reports, Audit status badge | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#knowledge` | `KnowledgeActivityView.jsx`| 200 OK | `knowledgeArticles` | Hospital clinical publications, Author department, Citations, Views count, Read article | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#settings` | `SettingsView.jsx` | 200 OK | Hospital settings | EMR integration status, Emergency OPD override, Auto-dispatch reports, SMS notifications | Verified | Fluid (1440–320px) | Yes | **PASS** |

---

## 2. Key Capabilities & Verified Invariants

1. **Hospital Scoping & Isolation**:
   - Rajesh Kumar (`ADM-001`) manages only MediMind Central Hospital (`HOSP-001`). Cannot view or alter St. Jude (`HOSP-002`) or Apex Institute (`HOSP-003`) data.
   - Hospital 2 (`HOSP-002`) correctly supports 3 AI modules (`ai_fracture`, `ai_cardio`, `ai_diabetes`) excluding `ai_general`.
   - Hospital 1 (`HOSP-001`) and Hospital 3 (`HOSP-003`) support all 4 AI modules.
2. **Zero Clinical Patient Access**:
   - Hospital Admin manages facility infrastructure, departments, staff, and aggregate analytics. Has NO access to private patient clinical encounter notes, prescriptions, or individual medical images.
3. **Dashboard Max-3 Collection Rule**:
   - Departments list displays max 3 items with `"View all departments"` header trigger.
   - Staff roster overview displays max 3 items with `"View all staff"` trigger.
   - Recent compliance reports display max 3 items with `"View all reports"` footer trigger.

---

## 3. End-to-End User Journeys Tested: 100% PASSED

- **Journey 5**: Facility Dashboard $\rightarrow$ Hospital Profile $\rightarrow$ Update Bed Capacity to 450 $\rightarrow$ Departments $\rightarrow$ Create Oncology Ward $\rightarrow$ Assign Department Head $\rightarrow$ Operational Analytics $\rightarrow$ AI Diagnostics QA (98.2% Accuracy) $\rightarrow$ Generate Monthly Clinical Audit Report.

---

## 4. Audit Verdict: PASS
The Hospital Admin Portal is 100% robust, strictly scoped, verified in Light and Dark themes, and certified for backend integration.
