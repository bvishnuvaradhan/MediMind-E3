# MediMind — Platform-Wide Data Source & Element Provenance Audit Report

**Date of Execution:** October 23, 2026  
**Auditor / Agent:** Antigravity Advanced Agentic Coding (Google DeepMind)  
**Authoritative Environment:** MongoDB Atlas Production Cluster (`cluster0.plxllln.mongodb.net`, MongoDB 8.0.34, TLS 1.3)  
**Repository:** `D:\projects\MediMind`  
**Feature Branch:** `experiment8-multiview-localized-fusion`  

---

## 1. Provenance Taxonomy Framework

Every displayed figure, table row, chart data point, and analytical KPI across all user roles (Chairman, Hospital Administrator, Department Head, Doctor, Family Patient) is audited and classified into one of the nine mandated provenance categories:

1. **Global operational database** — Authoritative MongoDB Atlas cluster collections accessible across authorized roles without user-specific row scoping.
2. **Role-scoped operational database data** — Genuine records from MongoDB Atlas strictly filtered by authenticated user ID, assigned hospital facility ID, or authorized family membership.
3. **Local mock or fixture data** — Hardcoded JSON arrays, test fixtures, prototype objects, or simulated responses.
4. **Hardcoded/static values** — In-code constants, manually entered numeric strings, fixed percentage targets, placeholder chart datasets, or static descriptive labels.
5. **Fallback data** — Default values or placeholder objects silently substituted when an API returns an error or empty result (`||`, `??`, or catch blocks).
6. **Cached data** — In-memory cached responses (TTL-based caching layer in services).
7. **Derived/aggregated data** — Calculations, sums, ratios, or groupings computed directly from genuine operational database records or API responses.
8. **External service/model output** — Genuine inference results or diagnostic probabilities returned directly by an AI model execution pipeline.
9. **Unknown/unverified source** — Origin cannot be traced or established from current codebase and database evidence.

---

## 2. Authoritative Platform Census & Reconciliation

| Entity / Dimension | Authoritative Atlas Count | Frontend Displayed Value | Provenance Classification | Notes / Resolution |
| :--- | :---: | :---: | :--- | :--- |
| **Total Appointments** | **3,767** | 3,767 | Global DB / Derived | Verified in `medimind_appointment.appointments` across all facilities |
| **Completed Non-Walk-In Appts** | **2,207** | 2,207 | Global DB / Derived | Completed clinical consultations |
| **Walk-In Consultations** | **148** | 148 | Global DB / Derived | All completed; strictly exempt from automated AI inference generation |
| **Booked / Upcoming Appts** | **860** | 860 | Global DB / Derived | 425 `BOOKED` + 435 `CONFIRMED` |
| **Rescheduled Appts** | **186** | 186 | Global DB / Derived | Rescheduled clinical encounters |
| **Cancelled Appts** | **366** | 366 | Global DB / Derived | Cancelled clinical encounters |
| **Total AI Predictions** | **3,719** | 3,719 | Global DB / External | Persisted in `medimind_ai.predictions` with genuine `created_at` timestamps |
| **Appt-Linked AI Inferences** | **3,693** | 3,693 | Global DB / Derived | Non-walk-in clinical encounters linked to AI inferences |
| **Standalone Screenings** | **26** | 26 | Global DB / Derived | Standalone preventative health assessments |
| **Operational Doctor Profiles** | **66** | 66 | Global DB / Derived | `status: 'ACTIVE'`, `is_demonstration: false` |
| **Deactivated Doctor Profiles** | **2** | 2 | Global DB / Derived | `Dr. Arvind Deshpande` & `Dr. Meenakshi Sundaram` (`status: 'INACTIVE'`) |
| **Canonical Active Auth Accounts**| **96** | 96 | Global DB / Derived | 66 Doctors + 14 Dept Heads + 4 Admins + 10 Families + 2 Chairmen |
| **Deactivated Auth Accounts** | **2** | 2 | Global DB / Derived | Auth users with `status: 'INACTIVE'` (Login Denied HTTP 403) |
| **Historical Test Accounts** | **7** | N/A | Global DB (Isolated) | Ephemeral test runner fixtures (`*@test.org`) in `medimind_auth` |
| **Total Auth Records (`users`)** | **105** | N/A | Global DB | Raw document count in `medimind_auth.users` |
| **Active Registered Hospitals** | **3** | 3 | Global DB / Derived | `Aarogyam`, `Nexora`, `Harborview` (`status: 'ACTIVE'`) |
| **Pending Hospital Facilities** | **2** | 2 | Global DB / Derived | `Sunrise Institute`, `Western LifeCare` (`status: 'PENDING'`) |
| **Hospital Clinical Departments** | **13** | 13 | Global DB / Derived | Operational departments across 3 active hospitals |
| **Registered Family Households** | **10** | 10 | Global DB / Derived | `medimind_family.families` |
| **Registered Family Members** | **44** | 44 | Global DB / Derived | `medimind_family.familymembers` |

---

## 3. Comprehensive Provenance Audit by Page & Role

### A. Chairman / Platform Owner Views

| View / Component | Data Element | Displayed Value | Provenance Classification | API Endpoint & Query | Audit Result | Remediation Applied |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Platform Dashboard** | Total Operational Doctors | 66 | Global DB / Derived | `GET /api/doctors` (`status: 'ACTIVE'`) | **PASS** | Stat delta dynamically displays: `66 Operational Doctors (2 Deactivated Doctor Accounts)` |
| **Platform Dashboard** | Total Platform Accounts Badge | 96 Active (2 Deactivated) | Global DB / Derived | `chairmanService.getPlatformSummary()` | **PASS** | Dynamic badge computing live active vs deactivated account counts |
| **Platform Dashboard** | Role Breakdown Subtitle | 66 Doctors · 10 Families · 14 Dept Heads · 4 Admins · 2 Owners | Global DB / Derived | `chairmanService.getPlatformSummary()` | **PASS** | Concise dynamic format displaying active accounts by role |
| **Platform Dashboard** | Registered Hospitals KPI | 3 Active (+2 Pending) | Global DB / Derived | `GET /api/hospitals` | **PASS** | Separates approved facilities from expansion requests |
| **Platform Analytics** | Platform User Directory | 98 Canonical Accounts (96 Active, 2 Deactivated) | Global DB / Derived | `GET /api/doctors?status=ALL`, `GET /api/auth/users` | **PASS** | Full user directory table implemented with status pills (`All`, `Active`, `Deactivated`) and zero credentials |
| **Platform Analytics** | Relative Date Filter | Dynamic Periods | Client Utility | `dateUtils.js` | **PASS** | Replaced static date arrays with standardized `RELATIVE_PERIOD_OPTIONS` |
| **AI Analytics** | Total Model Inferences | 3,719 (All Time) / 870 (This Month) / 1,255 (Previous Month) | External Service / Model Output | `GET /api/ai/analytics?period=...` | **PASS** | Driven strictly by prediction `created_at` timestamps; eliminated fallback numbers (`\|\| 1301`, `\|\| 412`) |
| **AI Analytics** | Prediction Trajectory Subtitle | Dynamic Period Label | Derived / Dynamic | `getRelativeDateRange(dateRange).label` | **PASS** | Eliminated hardcoded `(Aug – Oct 2026)` literal |
| **Appointments View** | Monthly Volume Trend | Dynamic Monthly Aggregation | Derived / Aggregated | `GET /api/appointments/stats` | **PASS** | Subtitle and baseline comparison dynamically computed from `historicalMonthlyTrends` |
| **Departments View** | Hospital Filter Selector | 3 Active Facilities | Role-Scoped DB | `chairmanService.getHospitals('Active')` | **PASS** | Excludes pending hospitals (`Sunrise`, `Western LifeCare`) from operational department management |
| **Hospital Admins View** | Facility Assignment Selector | 3 Active Facilities | Role-Scoped DB | `chairmanService.getHospitals('Active')` | **PASS** | Prevents assigning administrators to unapproved expansion hospitals |
| **Reports View** | Facility Scope Selector | 3 Active Facilities | Role-Scoped DB | `chairmanService.getHospitals('Active')` | **PASS** | Operational report preview and export strictly limited to active approved facilities |

### B. Hospital Administrator Views

| View / Component | Data Element | Displayed Value | Provenance Classification | API Endpoint & Query | Audit Result | Remediation Applied |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Hospital Analytics** | Operational Period Filter | Dynamic Relative Periods | Client Utility | `getRelativeDateRange` | **PASS** | Replaced `Sep 2026`, `Aug 2026`, `Q3 2026` with `This Month`, `Previous Month`, `This Quarter`, `This Year` |
| **Hospital Analytics** | Volume Trends Header | Dynamic Month Span | Derived / Aggregated | `monthlyTrends[0].month` – `monthlyTrends[N].month` | **PASS** | Eliminated hardcoded `(May – Sep 2026)` header |
| **Knowledge Activity** | Month Selector Filter | Dynamic Current/Previous Months | Client Utility | `getCurrentMonthLabel()`, `getPreviousMonthLabel()` | **PASS** | Replaced hardcoded `'September 2026'` with dynamic system calendar labels |
| **Reports View** | Period Metrics Badges | Dynamic Month & Quarter Labels | Client Utility | `getRelativeDateRange` | **PASS** | Replaced hardcoded August/September 2026 labels with dynamic relative periods |

### C. Department Head Views

| View / Component | Data Element | Displayed Value | Provenance Classification | API Endpoint & Query | Audit Result | Remediation Applied |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Department Analytics** | Cycle Status Badge | `Current Cycle: Oct 2026` (Dynamic) | Client Utility | `getCurrentCycleText()` | **PASS** | Replaced hardcoded literal `<span className="dh-badge">Current Cycle: Oct 2026</span>` with dynamic calendar utility |

---

## 4. Backend Hospital Eligibility & Validation Boundaries

Backend validation enforcement tested and verified across all creation and scheduling endpoints:

| Endpoint | Operation | Target Facility Status | Expected Behavior | Actual Response | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/departments` | Create Department | `PENDING` (Sunrise / Western LifeCare) | Reject creation | **HTTP 400 Bad Request** (`Cannot create department: hospital is pending approval or inactive`) | `scripts/test_hospital_eligibility_backend.py` |
| `POST /api/doctors` | Create Doctor | `PENDING` (Sunrise / Western LifeCare) | Reject creation | **HTTP 400 Bad Request** (`Cannot assign doctor: hospital is pending approval or inactive`) | `scripts/test_hospital_eligibility_backend.py` |
| `POST /api/appointments` | Book Appointment | `PENDING` (Sunrise / Western LifeCare) | Reject booking | **HTTP 400 Bad Request** (`Cannot book appointment: target hospital is pending approval or inactive`) | `scripts/test_hospital_eligibility_backend.py` |
| `GET /api/appointments/reports/preview` | Preview Report | `PENDING` (Sunrise / Western LifeCare) | Reject preview | **HTTP 400 Bad Request** (`Hospital is pending or unapproved for operational reporting`) | `scripts/test_active_hospitals_report.py` |
| `GET /api/appointments/reports/export-excel` | Export Excel | `PENDING` (Sunrise / Western LifeCare) | Reject export | **HTTP 400 Bad Request** (`Hospital is pending or unapproved for operational reporting`) | `scripts/test_active_hospitals_report.py` |

---

## 5. Security & Secret Protection Compliance

- **Zero Hardcoded Secrets in Source Code:** Verified via static analysis; `.env` files and Atlas connection strings are strictly omitted from version control.
- **Credential Masking in UI:** Passwords, password hashes, and session tokens are completely excluded from the Platform User Directory and all operational tables.
- **Authentication Denial:** Deactivated doctor accounts are strictly denied login with `HTTP 403 Forbidden`.
