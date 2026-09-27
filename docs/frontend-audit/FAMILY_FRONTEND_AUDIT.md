# Family Portal Frontend Pre-Backend Audit

**Audit Date:** 2026-09-27  
**Auditor:** MediMind Engineering & Quality Assurance  
**Portal:** Family Healthcare Portal  
**Authentication Role:** `FAMILY` (`rohan.kapoor@example.com` / `family123`)  
**Scope:** Family Unified Health Record, Members, Appointments, Clinical Records, AI Diagnostics, and Doctor Consent Management.  
**Active Account:** `FAM-001` (Kapoor Family — Rohan, Priya, Aarav, Kabir)

---

## 1. Route Inventory & Verification (18 Views)

| Route / Hash | View Component | Status | Data Source | Interactive Controls | Theme (Light/Dark) | Responsive | Scroll | Result |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| `#dashboard` | `DashboardView.jsx` | 200 OK | `initialFamilyMembers`, `initialRecords`, `initialBookedSlots`, `initialPresentationData` | Member switch pills, View all appointments, View all records, View prediction detail, Upload modal, Summary refresh | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#family-members` | `FamilyMembersView.jsx` | 200 OK | `familyMembers` | Add member button, Edit member, View member profile, Switch active member | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#member-profile` | `MemberProfileView.jsx` | 200 OK | Active `member` | Edit profile form, Save profile, Emergency contacts, Chronic conditions, Allergies | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#medical-records` | `MedicalRecordsView.jsx` | 200 OK | `records` (`rec_001`–`rec_005`) | Category filter tabs, Search, Upload record modal, View record detail, Delete record confirmation | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#upload-record` | `UploadRecordView.jsx` | 200 OK | Form state | File drag-and-drop, category selector, patient selector, upload progress, pre-check | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#ai-predictions` | `AiPredictionsView.jsx` | 200 OK | `aiPredictions` (`ai_pred_001`–`004`) | Model filter (Fracture, Diabetes, Heart, General), View prediction details, Run triage | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#personal-prediction-detail` | `PersonalPredictionDetailView.jsx` | 200 OK | `selectedPrediction` | Radial risk index, Population bullet benchmark, Risk factor bars, Print/Share, Back to predictions | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#doctors` | `DoctorsView.jsx` | 200 OK | `doctors`, `recommendDoctors()` | Specialty filter pills, Search by name/department, Book appointment trigger, Doctor profile view | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#doctor-profile` | `DoctorProfileView.jsx` | 200 OK | `selectedDoctor` | Experience badges, Available slots grid, Hospital affiliation, Direct booking trigger, Back button | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#doctor-access` | `DoctorAccessView.jsx` | 200 OK | `recordAccesses` (`acc_001`–`003`, `acc_010`) | Grant access modal, Revoke access confirmation, Access log trail (Active/Revoked) | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#appointments` | `AppointmentsView.jsx` | 200 OK | `appointments` (`apt_001`–`apt_004`) | Status filter (Upcoming, Completed, Cancelled), Detail modal trigger, Reschedule, Cancel modal | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#book-appointment` | `BookAppointmentView.jsx` | 200 OK | `doctors`, Slot availability | Member selector dropdown, Date picker, Time slot radio buttons, Consultation reason input, Confirm | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#appointment-assessment` | `AppointmentAssessmentView.jsx` | 200 OK | Assessment engine | Symptom input checklist, Severity scale, Medical history checkboxes, Submit for triage | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#consultations` | `ConsultationsView.jsx` | 200 OK | `consultations` (`cons_001`, `cons_002`, `cons_008`) | Consultation detail modal, Doctor clinical notes viewer, Related prescription link | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#prescriptions` | `PrescriptionsView.jsx` | 200 OK | `prescriptions` (`rx_001`, `rx_002`, `rx_008`) | Active vs History toggle, Medication dosage list, Doctor signature verification, Print Rx | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#general-health-risk` | `GeneralHealthRiskView.jsx` | 200 OK | `aiPredictions` (`ai_general`) | Comprehensive cardiovascular & glycemic assessment, Factor risk sliders, Re-calculate score | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#help-center` | `HelpCenterView.jsx` | 200 OK | Help & FAQs repository | Search FAQ, Category accordion, Emergency contact numbers, Send message form | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#settings` | `SettingsView.jsx` | 200 OK | Family preferences | Notification toggles, Dark/Light mode toggle, Password change form, Language select | Verified | Fluid (1440–320px) | Yes | **PASS** |

---

## 2. Key Capabilities & Verified Invariants

1. **Dashboard Member-Scoping & Max-3 Collection Rule**:
   - Family members selector strip displays max 3 items with `"View all"` linking to `#family-members`.
   - Selecting any family member updates all member-scoped dashboard metrics, records, appointments, and telemetry gauges specifically for that member.
   - Recent appointments section displays max 3 items with `"View all appointments"` in card footer.
   - Recent medical records panel displays max 3 items with `"View all"` in section heading.
2. **Explicit Naming Convention**:
   - All member selectors, headers, and badge indicators follow the explicit `{fullName || name} — {relationship || relation}` format.
3. **Dynamic Member Filters & Exact Count Derivation**:
   - `AppointmentsView`, `ConsultationsView`, `PrescriptionsView`, `MedicalRecordsView`, `AiPredictionsView`, and `DoctorAccessView` strictly derive their data from the authenticated Family Account (`FAM-001`) and its registered members.
   - `All Family Members ({total})` displays ONLY the count of records belonging to the current family (e.g. 4 Appointments, 3 Consultations, 3 Prescriptions, 5 Medical Records, 4 Doctor Access entries) — never the global 16 appointments dataset.
   - Individual member dropdown options `{fullName || name} — {relationship || relation} ({count})` derive their counts from the exact relational foreign keys (`memberId` / `patientId` / `familyId`).
   - Selecting a member filters the list strictly to that member's records; selecting "All Family Members" displays all family-scoped records without global record leakage.
4. **Clinical Network Hospital $\rightarrow$ Department Dependency (`DoctorsView.jsx`)**:
   - In the specialist directory (`#doctors`), selecting a hospital dynamically recalibrates the department filter to display ONLY departments active at the chosen hospital facility.
   - Switching hospital facilities automatically resets any obsolete department selection back to `'All Departments'` to prevent invalid combinations.
5. **Multi-Modality Record Handling**:
   - Accurately categorizes X-Rays (`rec_002`, `rec_005`), Blood tests (`rec_001`, `rec_004`), and ECGs (`rec_003`).
   - Links records directly to clinical AI inference results with instant access to diagnostic finding details.
6. **Clinical AI Flow**:
   - All 4 locked models accessible: Fracture Detection (`ai_fracture`), Diabetes Risk (`ai_diabetes`), Heart Disease Risk (`ai_cardio`), General Health Assessment (`ai_general`).
   - Personal prediction details feature pure-SVG `RadialGauge` and `BulletChart` visual indicators with clear AI safety disclaimer.
7. **Consent Protocol (`DoctorAccessView.jsx`)**:
   - Patient grants or revokes physician access with real-time state synchronization.
   - Revoking consent for Aarav (`acc_010`) instantly prevents physician access to private records.

---

## 3. End-to-End User Journeys Tested: 100% PASSED

- **Journey 1**: Member Selection $\rightarrow$ Medical Records $\rightarrow$ AI Prediction Detail $\rightarrow$ Doctor Directory $\rightarrow$ Book Appointment $\rightarrow$ Appointment Ledger $\rightarrow$ Consultation $\rightarrow$ Prescription.
- **Journey 2**: Doctor Access Management $\rightarrow$ Grant Record Access to Dr. Rahul Mehta $\rightarrow$ Verify Active $\rightarrow$ Revoke Access $\rightarrow$ Status updated to Revoked.

---

## 4. Security & Scope Boundaries

- **Account Isolation**: Logged-in user Rohan Kapoor can only view and modify family members associated with Family Account `FAM-001` (Rohan, Priya, Aarav, Kabir). Cannot access `FAM-002` through `FAM-006`.
- **Administrative Boundary**: Family members cannot access Hospital Admin configurations, Department Head rosters, or Chairman network governance.
- **Record Access Boundary**: Only doctors explicitly granted active consent appear in the authorized access matrix.

---

## 5. Audit Verdict: PASS
The Family Portal is 100% stable, fully responsive, dark/light theme verified, and ready for backend API integration.
