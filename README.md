# MediMind-E3: Intelligent Healthcare & Clinical AI Diagnostic Platform

[![Frontend Certification](https://img.shields.io/badge/Frontend-Certified%20%26%20Backend--Ready-success)](docs/frontend-audit/FRONTEND_E2E_MASTER_AUDIT.md)
[![React](https://img.shields.io/badge/React-19.2.8-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF)](https://vitejs.dev)
[![Linter](https://img.shields.io/badge/Oxlint-0%20errors-brightgreen)](https://oxc.rs)

MediMind-E3 is a multi-tier, AI-assisted healthcare ecosystem unifying hospital networks, clinical departments, practicing physicians, and family health management.

---

## 1. Core Architecture & Stakeholder Roles

MediMind implements strict Role-Based Access Control (RBAC) and explicit patient consent protocols across 5 distinct portals:

1. **Chairman & Platform Owner Portal** (`CHAIRMAN`):
   - Executive network governance across multi-hospital facilities.
   - Hospital membership onboarding & accreditation review (`Pending` $\rightarrow$ `Approved` / `Rejected`).
   - Platform-wide appointment volume, administrator provisioning, and ecosystem AI engine utilization.
2. **Hospital Administrator Portal** (`HOSPITAL_ADMIN`):
   - Facility profile, NABH/JCI accreditation, and ward bed capacity oversight ($210/250$ beds).
   - Clinical department creation, department head onboarding, and staff doctor administration.
   - Operational admissions trajectories (5-month trend) and cross-department comparative analytics.
3. **Department Head Portal** (`DEPARTMENT_HEAD`):
   - Department hub (Orthopedics / Cardiology), clinician provisioning, and OPD shift roster coordination.
   - Physician capacity utilization, workload balancing, and bivariate performance scatter analysis.
   - Clinical practice guideline publication and subspecialty anomaly distribution.
4. **Doctor Clinical Workspace Portal** (`DOCTOR`):
   - Outpatient consultation queue, clinical funnel pipeline, and authorized patient charts (scoped by `RecordAccess`).
   - Clinical consultations lifecycle (`Draft` $\rightarrow$ `Final` $\rightarrow$ `Amended`).
   - Electronic prescriptions formulation (`Draft` $\rightarrow$ `Final` $\rightarrow$ `Corrected`).
   - AI decision support with interactive Grad-CAM heatmap saliency and feature activation weights.
5. **Family Healthcare Portal** (`FAMILY`):
   - Family unified medical records, biometric member profiles, and document repository.
   - Clinical AI diagnostic screenings across 4 locked pipelines with population benchmarks.
   - Direct OPD appointment booking and patient consent management (`Grant` / `Revoke` doctor access).

---

## 2. Centralized Dataset Baseline & Source of Truth

All frontend data flows strictly from `frontend/src/data/medimindData.js` through role-scoped services:

- **Active Network Hospitals**: 3 (`hosp_01` MediMind Central, `hosp_02` Apollo Multispecialty, `hosp_03` Fortis Memorial)
- **Pending Onboarding Hospital Requests**: 2 (`req_01` Manipal Super Specialty Hospital, `req_02` City Care Hospital)
- **Clinical Departments**: 17
- **Department Heads**: 18
- **Staff Physicians**: 66
- **Hospital Administrators**: 6
- **Family Accounts**: 6
- **Family Members**: 29
- **Locked Clinical AI Pipelines**: 4
- **Dataset Validation**: `validateCentralDataset()` $\rightarrow$ `valid: true, errors: []`

---

## 3. 4-Module Clinical AI Engine Portfolio

MediMind integrates 4 locked AI diagnostic pipelines with dedicated mathematical visualizations:

| AI Module Key | Module Name | Primary Specialty | Diagnostic Model Type | Key Metrics |
| :--- | :--- | :--- | :--- | :--- |
| `ai_fracture` | **Fracture Detection** | Orthopedics | Deep Residual CNN | 98.4% Acc, 98.1% Sens, 98.8% Spec, 99.9% Uptime |
| `ai_diabetes` | **Diabetes Risk** | Diabetology / Endocrinology | Gradient Boosted ML | 94.6% Acc, 93.8% Sens, 95.2% Spec, 99.8% Uptime |
| `ai_cardio` | **Heart Disease Risk** | Cardiology | Ensemble Classifier ML | 95.8% Acc, 95.2% Sens, 96.4% Spec, 99.9% Uptime |
| `ai_general` | **General Health Assessment** | General Medicine / Triage | NLP & Triage Classifier | 93.5% Acc, 92.4% Sens, 94.1% Spec, 99.7% Uptime |

---

## 4. Pure-SVG Data Visualization Catalog

MediMind features a pure-SVG mathematical charting engine housed in `frontend/src/components/common/charts/`:

- **LineChart / AreaChart**: Multi-series continuous time-series trajectories with cubic Bézier curves.
- **BarChart**: Grouped vertical, stacked vertical, and horizontal latency comparison layouts.
- **DonutChart / PieChart**: Part-to-whole categorical allocations with animated hover trigonometry.
- **ScatterPlot**: 2D Cartesian bivariate observations (e.g. Caseload vs On-Time Rate) with benchmark lines.
- **FunnelChart**: Multi-stage clinical outpatient workflow throughput and conversion.
- **RadialGauge**: Calibrated semi-circular and $240^\circ$ arc confidence and health index gauges.
- **BulletChart**: Stephen Few qualitative performance bars mapped against target markers.
- **HeatmapChart**: 2D temporal intensity matrix grids (Day of Week $\times$ Hourly Shifts).
- **RadarChart**: 4-Model multidimensional polygonal spider charts with Unified Overlay and 4-Panel Grid modes.

---

## 5. Frontend Route Structure (68 Certified Routes)

- **Public / Auth** (2): `LoginPage`, `SignupPage`
- **Family Portal** (18): `#dashboard`, `#family-members`, `#member-profile`, `#medical-records`, `#ai-predictions`, `#personal-prediction-detail`, `#doctors`, `#doctor-profile`, `#appointments`, `#appointment-assessment`, `#appointment-ai-assessment`, `#book-appointment`, `#consultations`, `#prescriptions`, `#doctor-access`, `#general-health-risk`, `#help-center`, `#settings`
- **Doctor Portal** (12): `#dashboard`, `#patients`, `#patient_profile`, `#appointments`, `#consultations`, `#prescriptions`, `#ai_diagnostics`, `#ai_explain`, `#availability`, `#patient_access`, `#knowledge`, `#settings`
- **Department Head Portal** (10): `#dashboard`, `#doctors`, `#doctor_details`, `#appointments`, `#workload`, `#analytics`, `#ai_analytics`, `#performance`, `#knowledge`, `#settings`
- **Hospital Admin Portal** (14): `#dashboard`, `#hospital-profile`, `#departments`, `#department-heads`, `#department-head-details`, `#doctors`, `#doctor-details`, `#staff-management`, `#hospital-operational-analytics`, `#department-comparative-analytics`, `#ai-analytics`, `#reports`, `#knowledge-activity`, `#settings`
- **Chairman Portal** (12): `#dashboard`, `#platform-analytics`, `#hospitals`, `#hospital-admins`, `#departments`, `#family-accounts`, `#hospital-performance`, `#appointments`, `#reports`, `#ai-analytics`, `#knowledge-activity`, `#settings`

---

## 6. Development & Quality Assurance

### Installation & Local Run
```bash
cd frontend
npm install
npm run dev
```

### Automated Quality Gates
```bash
# 1. Zero-error linter check
npx oxlint

# 2. Production build verification
npm run build

# 3. Central dataset foreign key & count validation
node -e "import('./src/data/medimindData.js').then(m => { const r = m.validateCentralDataset(); console.log('Valid:', r.valid); if(!r.valid) process.exit(1); })"
```

---

## 7. Frontend Certification & Backend Readiness

Complete audit reports and backend REST contracts are documented in `docs/frontend-audit/`:
- [Master E2E Audit](docs/frontend-audit/FRONTEND_E2E_MASTER_AUDIT.md)
- [Route Inventory](docs/frontend-audit/FRONTEND_ROUTE_INVENTORY.md)
- [Service Contract Audit](docs/frontend-audit/FRONTEND_SERVICE_CONTRACT_AUDIT.md)
- [Backend Readiness Contract](docs/frontend-audit/FRONTEND_BACKEND_READINESS.md)
- [Data Integrity Audit](docs/frontend-audit/FRONTEND_DATA_INTEGRITY_AUDIT.md)
- [UI Theme & Accessibility Audit](docs/frontend-audit/FRONTEND_UI_THEME_ACCESSIBILITY_AUDIT.md)
- [Business Flow Matrix](docs/frontend-audit/FRONTEND_FLOW_MATRIX.md)
- [Family Portal Audit](docs/frontend-audit/FAMILY_FRONTEND_AUDIT.md)
- [Doctor Portal Audit](docs/frontend-audit/DOCTOR_FRONTEND_AUDIT.md)
- [Department Head Audit](docs/frontend-audit/DEPARTMENT_HEAD_FRONTEND_AUDIT.md)
- [Hospital Admin Audit](docs/frontend-audit/HOSPITAL_ADMIN_FRONTEND_AUDIT.md)
- [Chairman Portal Audit](docs/frontend-audit/CHAIRMAN_FRONTEND_AUDIT.md)

**Status:** The frontend is certified as complete, fully tested, and ready for backend REST API implementation.
