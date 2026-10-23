# MediMind — Account Status & Platform User Directory Audit Report

**Date:** 2026-10-23  
**Repository:** `D:\projects\MediMind`  
**Branch:** `experiment8-multiview-localized-fusion`  
**Execution Environment:** Production MongoDB Atlas (`cluster0.plxllln.mongodb.net`) & Auth Service

---

## 1. Executive Summary

This audit establishes the full implementation and verification of dynamic account counting, genuine deactivated doctor account provisioning, and the unified Platform User Directory in MediMind.

### Key Audit Findings:
1. **Dynamic Dashboard Badges:** Eliminated static labels from the Chairman / Platform Owner overview. Account metrics and badges are now dynamically computed from live MongoDB collections:
   - Stat Card Delta: `66 Operational Doctors (2 Deactivated Doctor Accounts)`
   - Account Header Badge: `96 Active (2 Deactivated)`
   - Subtitle Roster: `66 Doctors · 10 Families · 14 Dept Heads · 4 Admins · 2 Owners`
2. **Genuine Deactivated Doctor Accounts:** Decoupled the two intended inactive accounts from old demonstration profiles and provisioned canonical clinical identities:
   - **`Dr. Arvind Deshpande`** (`dr.arvind.deshpande@medimind.test`) — Retired Senior Orthopedic Consultant
   - **`Dr. Meenakshi Sundaram`** (`dr.meenakshi.sundaram@medimind.test`) — Former Senior Endocrinologist
3. **Strict Zero-Record Invariant & Auth Denial:** Both accounts have exactly 0 appointments, 0 consultations, 0 prescriptions, and 0 medical records. All authentication attempts are strictly denied with `HTTP 403: Account is inactive or suspended`.
4. **Platform User Directory Implemented:** Integrated a full-featured identity directory inside Platform Analytics featuring search, role filtering, status pills (`All`, `Active`, `Deactivated`), and strict zero-credential security.

---

## 2. Canonical Platform Account Breakdown

Live count reconciliation across `medimind_auth.users`, `medimind_doctor.doctors`, `medimind_hospital`, and `medimind_family`:

$$\begin{aligned}
\mathbf{Total\ Platform\ Accounts} &= 96\text{ Active Canonical Accounts} \\
\mathbf{Deactivated\ Accounts} &= 2\text{ Inactive Doctor Accounts} \\
\mathbf{Historical\ Test\ Fixtures} &= 7\text{ Ephemeral/Audit Records (Isolated)} \\
\mathbf{Total\ Auth\ Collection\ Documents} &= 105\text{ Documents}
\end{aligned}$$

| Role | Active Operational | Deactivated / Inactive | Total Profiles | Target Status | Primary Source Collection |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Doctors** | **66** | **2** | **68** | `ACTIVE` / `INACTIVE` | `medimind_doctor.doctors` |
| **Department Heads** | **14** | 0 | 14 | `ACTIVE` | `medimind_hospital.departmentheads` |
| **Hospital Admins** | **4** | 0 | 4 | `ACTIVE` | `medimind_hospital.hospitaladmins` |
| **Family Accounts** | **10** | 0 | 10 | `ACTIVE` | `medimind_family.families` |
| **Platform Owners (Chairman)** | **2** | 0 | 2 | `ACTIVE` | `medimind_auth.users` |
| **Total Canonical Accounts** | **96** | **2** | **98** | — | — |

---

## 3. Deactivated Doctor Account Verification

### A. Profile Specification
- **Account 1:**
  - Name: `Dr. Arvind Deshpande`
  - Email: `dr.arvind.deshpande@medimind.test`
  - Specialization: `Orthopedics & Trauma`
  - Qualifications: `MBBS, MS (Orthopedics), FRCS`
  - Experience: 28 Years
  - Status: `INACTIVE` | `is_demonstration: false`
  - Reason: `Retired from active clinical practice`
  - Document IDs: Doctor `6adb00e9fddd89ae76d77438` \| Auth User `6adb00e9fddd89ae76d77439`
- **Account 2:**
  - Name: `Dr. Meenakshi Sundaram`
  - Email: `dr.meenakshi.sundaram@medimind.test`
  - Specialization: `Diabetology & Endocrinology`
  - Qualifications: `MBBS, MD (Medicine), DM (Endocrinology)`
  - Experience: 24 Years
  - Status: `INACTIVE` | `is_demonstration: false`
  - Reason: `Transitioned from platform network`
  - Document IDs: Doctor `6adb00e9fddd89ae76d7743a` \| Auth User `6adb00e9fddd89ae76d7743b`

### B. Invariant Proof (`scripts/verify_deactivated_doctors.py`)
Both accounts were audited against the authoritative MongoDB database:
```
--- Doctor Profile: 6adb00e9fddd89ae76d77438 (Dr. Arvind Deshpande) ---
  Doctor Status: INACTIVE | Auth User Status: INACTIVE
  Appointments: 0
  Consultations: 0
  Prescriptions: 0
  Clinical Notes: 0

--- Doctor Profile: 6adb00e9fddd89ae76d7743a (Dr. Meenakshi Sundaram) ---
  Doctor Status: INACTIVE | Auth User Status: INACTIVE
  Appointments: 0
  Consultations: 0
  Prescriptions: 0
  Clinical Notes: 0

[ALL ZERO-RECORD INVARIANTS VERIFIED]
```

### C. Authentication Denial Test (`scripts/test_deactivated_accounts_auth.py`)
Login requests with valid passwords and invalid passwords against `POST /api/auth/login`:
```
Login attempt: dr.arvind.deshpande@medimind.test | Status: 403 | Msg: Account is inactive or suspended
Login attempt: dr.meenakshi.sundaram@medimind.test | Status: 403 | Msg: Account is inactive or suspended
[PASS] All deactivated account authentication attempts strictly rejected (HTTP 403)!
```

---

## 4. Platform User Directory (UI Implementation)

Implemented in [`frontend/src/components/chairman/views/PlatformAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/chairman/views/PlatformAnalyticsView.jsx):
1. **Unified Canonical Dataset:** Merges live active doctors (66), deactivated doctors (2), hospital administrators (4), registered family accounts (10), and executive chairmen (2) into a cohesive 98-record table.
2. **Status Filtering:**
   - `All (98)`: Displays the entire platform workforce and patient family accounts.
   - `Active (96)`: Restricts view to operational accounts.
   - `Deactivated (2)`: Exclusively highlights the two emeritus deactivated doctors with reason for deactivation and enforcement banner.
3. **Role & Search Filtering:** Instant substring matching across name, email, role, and hospital facility.
4. **Security Enforcement:** Displays `Authorized` or `Login Denied (HTTP 403)` status badge. Zero password hashes, reset tokens, or private patient identifiers are exposed.
