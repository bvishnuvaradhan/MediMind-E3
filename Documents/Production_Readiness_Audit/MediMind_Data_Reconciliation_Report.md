# MediMind Data Reconciliation & Phase 1 Baseline Inspection Report

**Execution Date:** 2026-10-19 12:35:00 UTC  
**Active Git Branch:** `experiment8-multiview-localized-fusion`  
**MongoDB Service:** Community Server 8.0.13 (`mongodb://127.0.0.1:27017` Windows Service)  
**Verified Backup:** `D:\MediMind_Backups\MediMind_DB_Backup_20261016_202100\` (Preserved & Intact)  
**Audit Scope:** Read-Only Inventory, Repository Baseline, Entity Linkages & Root-Cause Analysis  

---

## 1. Executive Summary & Core Baselines

| Subsystem / Metric | Live Database Count | Workbook Count | Frontend / Reported | Status / Root Cause |
| :--- | :---: | :---: | :---: | :--- |
| **Authentication Users** | **63** (59 Canonical + 4 Test) | 59 Canonical | 59 Canonical | 4 test accounts created by offline test harness (`doctorCreate.test.js`) |
| **Family Households** | **10** | 10 | 10 | 100% Parity across MongoDB, Workbook, and UI |
| **Family Members** | **44** | 44 (referenced) | 44 | 100% Parity (min 2, max 8 per household) |
| **Hospitals** | **5** (3 Active, 2 Pending) | 5 (3 Active, 2 Pending) | 3 Active on UI | 3 operating facilities, 2 pending onboarding |
| **Departments** | **13** | 13 | 13 | 100% Parity across 3 operating hospitals |
| **Department Heads** | **14** | 14 | 14 | 100% Parity |
| **Hospital Administrators** | **4** | 4 | 4 | 100% Parity across 3 active facilities |
| **Doctors (Login Accounts)** | **29** | 29 | 29 | Canonical doctors with active login credentials |
| **Doctor Profiles (Total Scope)** | **29** in DB | 29 in Excel | **66** in historical mock | 37 non-login domain profiles existed in `medimindData.js` |
| **Appointments** | **2,847** | N/A | **~500** on Dashboard | UI read hardcoded mock constant (`totalAppointments: 570`) |
| **AI Predictions** | **1,301** | N/A | Variable | 100% linked to the 44 family members (10 to 55 per member) |
| **Medical Records** | **25** | N/A | 25 | Active medical records in `medimind_records` |
| **Consultations** | **1,763** | N/A | 1,763 | Exactly matches 1,763 COMPLETED appointments |
| **Prescriptions** | **1,312** | N/A | 1,312 | Prescriptions linked to consultations |
| **Knowledge Articles** | **39** | N/A | 39 | 100% Parity in `medimind_knowledge` |

---

## 2. MongoDB Database & Collection Inventory

Direct inspection of all 8 databases running on `127.0.0.1:27017` confirmed:

```
Database: medimind_auth
  - users: 63 (59 canonical accounts + 4 transient test records from unit test harness)

Database: medimind_family
  - families: 10
  - familymembers: 44 (exact 1:N linkage, zero orphaned members)

Database: medimind_doctor
  - doctors: 29 (all status: ACTIVE)

Database: medimind_hospital
  - hospitals: 5 (3 ACTIVE: Aarogyam, Nexora, Harborview; 2 PENDING: Sunrise, Western LifeCare)
  - departments: 13 (Aarogyam: 4, Nexora: 4, Harborview: 5)
  - departmentheads: 14 (all active and linked to valid departments)
  - hospitalrequests: 5 (onboarding applications)

Database: medimind_appointment
  - appointments: 2,847 (date range: 2026-08-03 to 2026-11-30)
  - notifications: 9

Database: medimind_records
  - consultations: 1,763
  - prescriptions: 1,312
  - recordaccesses: 904
  - medicalrecords: 25

Database: medimind_knowledge
  - articles: 39

Database: medimind_ai
  - predictions: 1,301
```

---

## 3. Discrepancy Investigations & Root-Cause Diagnoses

### A. Doctor Inventory: 29 Live Accounts vs. 66 Expected Profiles
- **Investigation:** Git history analysis of `frontend/src/data/medimindData.js` across commits `eefe993`, `a079b5b`, and `14e2be2` revealed an authoritative dataset of **66 doctors**:
  - `HOSP-001` (Aarogyam Multispeciality Hospital): **21 doctors**
  - `HOSP-002` (Nexora Advanced Care Hospital): **6 doctors**
  - `HOSP-003` (Harborview Medical Centre): **39 doctors**
  - Total = 21 + 6 + 39 = **66 doctor profiles**
- **Root Cause:**
  - **29 Doctors** have authentication login accounts in `medimind_auth.users` and were seeded into `medimind_doctor.doctors` and `MediMind_Role_Credentials.xlsx`.
  - The remaining **37 Doctors** are clinical staff profiles without dedicated login accounts that existed in `medimindData.js` to represent full departmental hospital staffing.
- **Resolution Plan:**
  - The canonical staff inventory includes all 66 doctor profiles.
  - The credentials workbook properly lists the 29 doctors with authentication credentials.
  - Domain doctor profiles can be hydrated to match the 66 staffing structure without creating artificial login credentials.

### B. Appointment Volume: 2,847 DB Records vs. ~500 on Dashboard
- **Investigation:** In MongoDB, `appointments` contains 2,847 records:
  - **2026-08:** 928 appointments (32 per doctor)
  - **2026-09:** 928 appointments (32 per doctor)
  - **2026-10:** 639 appointments (22-23 per doctor through Oct 19)
  - **2026-11:** 352 appointments (12-16 per doctor future bookings)
  - **Status Breakdown:** COMPLETED: 1,763, CANCELLED: 296, RESCHEDULED: 149, BOOKED: 315, CONFIRMED: 324.
  - Every one of the 29 doctors has between 98 and 102 appointments.
  - Monthly target of $\ge 30$ appointments per doctor is **100% satisfied** for August and September, and on track for October.
- **Root Cause:**
  - `frontend/src/data/medimindData.js` (line 5429) defined static mock summary constants:
    `totalAppointments: 570, completedAppointments: 428, upcomingAppointments: 108, cancelledAppointments: 34`
  - `frontend/src/services/chairmanService.js` and `PlatformDashboard.jsx` returned and rendered this static mock object (`initialAppointmentAnalytics.totalAppointments = 570`) instead of aggregating live appointment data from `appointment-service`.
- **Resolution Plan:**
  - Update `chairmanService.js` and role dashboard aggregators to calculate totals directly from live appointment responses.
  - No synthetic appointment generation is required to reach the 1,500 target because the database already contains 2,847 valid records dating from 1 August 2026.

### C. AI Predictions: Target Coverage
- **Investigation:**
  - Total predictions in `medimind_ai.predictions`: **1,301**.
  - All 1,301 documents are linked to the 44 canonical family members in `medimind_family.familymembers`.
  - Every family member has between **10 and 55 predictions** (e.g., Ravi Sharma: 10, Sunita Sharma: 15, Kapoor family members: 40-55).
- **Finding:**
  - The requirement of **4 valid AI predictions per family member (min 3)** is **100% satisfied** by existing live data.
  - Zero synthetic predictions are needed.

### D. Excel Workbooks Status
- **Credentials Workbook:** `Documents/MediMind_Role_Credentials.xlsx` exists and contains 59 canonical accounts across 5 role sheets.
- **Staff Inventory Workbook:** Bounded recursive search across `Documents/` and the entire repository confirmed that **no second staff inventory workbook file currently exists**.
- **Reporting Statement:** Per safety rules, this absence is reported explicitly rather than fabricating a replacement workbook.

---

## 4. UI Dashboard Defect Analysis

1. **Hospital Network Overview (`PlatformDashboard.jsx`):**
   - Currently performs static `.slice(0, 3)` with no View more / View less control.
   - Requirement: Show 3 initially; show "View more" when $> 3$ exist; expand to show remaining without duplicates; show "View less" to collapse.
2. **Family Dashboard Member Display (`DashboardView.jsx`):**
   - Currently maps all family members unconditionally (e.g., rendering all 8 Kapoor family members at once).
   - Requirement: Show max 3 initially; show "View more" for $\ge 4$ members; expand/collapse seamlessly without duplicates; show genuine empty state when 0 members exist.
3. **Family Layout Live API Hydration (`FamilyLayout.jsx`):**
   - Requires explicit handling for loading, error, and empty array responses so mock fallbacks are never shown when an authoritative empty response is received.

---

## 5. Preservation Confirmation

- **Backup Unmodified:** `D:\MediMind_Backups\MediMind_DB_Backup_20261016_202100\` remains preserved.
- **Uncommitted Concurrency Files:** All 4 files in `backend/appointment-service/` remain intact in the working tree.
- **AI Models & Artifacts:** Frozen models and Experiment 8A artifacts remain untouched.
- **Database Safety:** Zero mutation, deletion, or reseed operations performed during Phase 1.
