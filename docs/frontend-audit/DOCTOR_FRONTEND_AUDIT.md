# Doctor Clinical Portal Frontend Pre-Backend Audit

**Audit Date:** 2026-09-26  
**Auditor:** MediMind Engineering & Quality Assurance  
**Portal:** Doctor Clinical Workspace Portal  
**Authentication Role:** `DOCTOR` (`rahul.mehta@medimindhospital.com` / `doctor123`)  
**Scope:** Clinical Outpatient Queue, Authorized Patient Records, Clinical Consultations (Draft $\rightarrow$ Final $\rightarrow$ Amended), E-Prescriptions (Draft $\rightarrow$ Final $\rightarrow$ Corrected), AI Diagnostic Saliency & Heatmap Explainability, and OPD Availability.

---

## 1. Route Inventory & Verification

| Route / Hash | View Component | Status | Data Source | Interactive Controls | Theme (Light/Dark) | Responsive | Scroll | Result |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| `#dashboard` | `DashboardView.jsx` | 200 OK | `doctorService` (`doctorProfile`, `todayApts`, `activePatients`) | New consultation shortcut, Issue Rx shortcut, Open record buttons, Grad-CAM heatmap trigger, View all patients | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#patients` | `PatientsView.jsx` | 200 OK | `doctorService.getAuthorizedPatients()` | Patient search bar, Gender/Age filter, Blood group filter, Patient profile card click, Chief complaint view | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#patient_profile` | `PatientProfileView.jsx` | 200 OK | Selected patient object & unified record | Medical records viewer, AI prediction history, New consultation trigger, Issue Rx trigger, Back to patients | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#appointments` | `AppointmentsView.jsx` | 200 OK | `doctorService.getAppointments()` | Date range filter, Time slot sort, Start consultation button, Mark completed, Reschedule trigger | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#consultations` | `ConsultationsView.jsx` | 200 OK | `doctorService.getConsultations()` | Status filter (Draft/Final/Amended), Search by patient/token, Open consultation detail, Amend consultation | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#prescriptions` | `PrescriptionsView.jsx` | 200 OK | `doctorService.getPrescriptions()` | Status filter (Draft/Final/Corrected), Search medication, View Rx modal, Correct Rx trigger, Print prescription | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#ai_diagnostics` | `AiDiagnosticView.jsx` | 200 OK | Fracture Detection CNN scans | Risk level filter (High, Moderate, Low), Search scan ID, View Grad-CAM explainability modal, Batch review | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#ai_explain` | `AiExplainabilityView.jsx` | 200 OK | Selected AI Prediction & Grad-CAM data | Visual saliency toggle, Heatmap opacity slider, Feature activation bar chart, Confidence radial gauge, Confirm AI finding | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#availability` | `AvailabilityView.jsx` | 200 OK | Doctor OPD schedule & shift config | Day toggle buttons (Mon–Sat), OPD session time pickers, Max patient capacity input, Save schedule | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#patient_access` | `PatientAccessView.jsx` | 200 OK | `doctorService.getAccessHistory()` | Access status filter (Active/Revoked), Search patient name, Access expiration date view, Patient consent audit log | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#knowledge` | `KnowledgeView.jsx` | 200 OK | `doctorService.getArticles()` | Clinical guidelines search, Subspecialty category pills, Create article modal trigger, Full article reader | Verified | Fluid (1440–320px) | Yes | **PASS** |
| `#settings` | `SettingsView.jsx` | 200 OK | `doctorService.getSettings()` | Room/OPD location input, Consultation fee input, Notification toggles, Dark/Light mode toggle, Save settings | Verified | Fluid (1440–320px) | Yes | **PASS** |

---

## 2. Page & Feature Analysis

### Dashboard (`DashboardView.jsx`)
- **Max-3 Rule Enforcement**:
  - `Today's Patient Queue`: Exactly max 3 visible slots with `"All Appointments →"` navigating to `#appointments`.
  - `AI Decision Support Alerts`: Exactly max 3 items with `"Full Telemetry →"` navigating to `#ai_diagnostics`.
  - `My Authorized Patients Grid`: Exactly max 3 cards with `"View All Patients →"` navigating to `#patients`.
- **Clinical Funnel Visualization**: Pure-SVG `FunnelChart` tracks live patient throughput progression:
  1. Waiting Room (5) $\rightarrow$ 2. AI Pre-Screened (4) $\rightarrow$ 3. In Consultation (2) $\rightarrow$ 4. Rx Formulated (3) $\rightarrow$ 5. Concluded (3).

### Consultation Workflow & Lifecycle (`NewConsultationModal.jsx`, `ConsultationsView.jsx`)
- **Lifecycle States Supported**:
  - `DRAFT`: In-progress clinical note entry with chief complaint, clinical examination findings, diagnostic impression, and ICD-10 tagging.
  - `FINAL`: Locked signed clinical note, immediately published to the patient's unified record.
  - `AMENDED`: Addendum-supported clinical modification preserving previous timestamps and revision history.
- **Validation**: Enforces non-empty clinical diagnosis and patient selection prior to submission.

### E-Prescription Formulation (`NewPrescriptionModal.jsx`, `PrescriptionsView.jsx`)
- **Lifecycle States Supported**:
  - `DRAFT`: Dynamic multi-row medication formulation (Drug Name, Dosage, Frequency, Duration, Special Instructions).
  - `FINAL`: Clinically certified digital prescription with doctor registration number.
  - `CORRECTED`: Formal clinical correction workflow allowing dosage adjustment while maintaining an immutable audit log.
- **Form Controls**: Add new medicine row, delete row, auto-fill dosage presets (e.g. `1-0-1 After food`), validity period selector.

### AI Decision Support & Grad-CAM Explainability (`AiExplainabilityView.jsx`, `AiExplainabilityModal.jsx`)
- **Visual Saliency Architecture**:
  - Direct side-by-side comparison of original radiological scan and superimposed Grad-CAM heatmap.
  - Interactive opacity slider (`0%` to `100%`) for continuous anatomical structure inspection.
  - Diagnostic certainty arc gauge (`RadialGauge`) calibrated at 96.4% confidence.
  - Biomarker / Feature activation breakdown (`BarChart` Horizontal).

---

## 3. End-to-End User Journeys Tested

1. **Patient Consultation to Prescription Flow**:
   - `Login as Dr. Rahul Mehta` $\rightarrow$ `Dashboard` $\rightarrow$ `Select Patient Rohan Kapoor` $\rightarrow$ `Review Past Records & Fracture Scan` $\rightarrow$ `Start New Consultation` $\rightarrow$ `Enter Examination Notes: Post-reduction radius check` $\rightarrow$ `Finalize Consultation` $\rightarrow$ `Issue E-Prescription: Calcium Citrate 500mg 1-0-1 x 30 days` $\rightarrow$ `Finalize Rx` $\rightarrow$ `Verified in Patient Record`.
2. **AI Heatmap Review & Diagnostic Confirmation Flow**:
   - `Dashboard` $\rightarrow$ `AI Decision Support Alerts` $\rightarrow$ `Open Grad-CAM Heatmap for Kabir Kapoor` $\rightarrow$ `Inspect Distal Radius Cortical Disruption` $\rightarrow$ `Adjust Heatmap Opacity to 65%` $\rightarrow$ `Confirm AI Screening Result` $\rightarrow$ `Success Toast Verified`.
3. **OPD Duty Schedule Modification Flow**:
   - `Availability View` $\rightarrow$ `Toggle Wednesday Afternoon Session` $\rightarrow$ `Update Max Patient Capacity to 25` $\rightarrow$ `Save Schedule` $\rightarrow$ `Immediate Feedback Toast Displayed`.

---

## 4. Security & Role Scope Isolation

- **Patient Consent Protocol**: Dr. Rahul Mehta can only access clinical charts for patients who have granted active consent via `RecordAccess`. Patients with revoked access are hidden or blocked from clinical editing.
- **Hospital / Department Boundary**: Clinician workspace is anchored to Orthopedics in MediMind Central Hospital (`hosp_01`). Platform-level administrative configurations and unauthorized patient charts outside explicit consent are inaccessible.

---

## 5. Audit Verdict: PASS
The Doctor Clinical Workspace is 100% stable, fully compliant with clinical lifecycle state machines (Draft/Final/Amended/Corrected), responsive across all breakpoints, and ready for backend API integration.
