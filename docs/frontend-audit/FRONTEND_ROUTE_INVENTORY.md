# MediMind Frontend Route & Navigation Inventory

**Audit Date:** 2026-09-27  
**Git Branch:** `frontend/vishnu`  
**Total Defined Views:** 66  
**Total Primary & Sub-Routes:** 68  
**Verification Result:** 100% Accessible, Zero Dead Routes, Zero Stale Aliases

---

## 1. Routing Architecture

MediMind employs a resilient stateful navigation architecture synchronized with `window.location.hash` and `sessionStorage`:
- **Deep Linking**: Accessing `#family/appointments` directly loads the authenticated Family portal at the Appointments view.
- **Refresh Resilience**: Browser reload preserves the current active role, view, and selected item IDs.
- **Role Isolation**: Role boundaries strictly gate route rendering; invalid or unauthenticated routes redirect to the Landing Page (`/`).
- **Clean Logout**: Logging out clears active session credentials and returns cleanly to `#landing`.

---

## 2. Route Inventory by User Role

### A. Public / Authentication Layer
| Route / Hash | View Component | Purpose | Permitted Roles | Actions & Destinations |
| :--- | :--- | :--- | :--- | :--- |
| `#landing` / `""` | `LandingPage` | Platform overview, features, role selection | Public | Login modal, Signup modal |
| `#login` | `LoginModal` (in `AuthPages`) | Credential entry & authenticated role launch | Public | Launches authenticated portal dashboard |
| `#signup` | `SignupModal` (in `AuthPages`)| Self-service patient/family onboarding | Public | Creates family account, logs in |

---

### B. Family / Patient Portal (`#family/*`) — 18 Views
| Route / Hash | View Component | Purpose | Key Data Inputs | Destination Views |
| :--- | :--- | :--- | :--- | :--- |
| `#family/dashboard` | `DashboardView` | Health summary, quick actions, max-3 appointments | `familyMembers`, `appointments` | All family sub-views |
| `#family/members` | `FamilyMembersView` | Family roster, relationship cards, vitals | `familyMembers` | `#family/member-profile` |
| `#family/member-profile` | `MemberProfileView` | Detailed vitals, medical history, emergency contacts | Selected member | `#family/members`, `#family/records` |
| `#family/records` | `MedicalRecordsView` | Document repository, category filters, AI badges | `medicalRecords` | `#family/upload-record`, `#family/predictions` |
| `#family/upload-record` | `UploadRecordView` | Drag-and-drop report upload & AI pre-check trigger | Form payload | `#family/records` |
| `#family/predictions` | `AiPredictionsView` | 4-model prediction list, risk chips, confidence | `aiPredictions` | `#family/prediction-detail` |
| `#family/prediction-detail`| `PersonalPredictionDetailView` | Deep dive finding, Grad-CAM heatmap, doctor referral | Selected prediction | `#family/book-appointment` |
| `#family/doctors` | `DoctorsView` | Multi-specialist directory, AI matching score | `doctors`, `recommendDoctors()` | `#family/doctor-profile`, `#family/book-appointment` |
| `#family/doctor-profile` | `DoctorProfileView` | Qualifications, OPD room, fee schedule, ratings | Selected doctor | `#family/book-appointment` |
| `#family/doctor-access` | `DoctorAccessView` | Patient consent manager, active/revoked list | `recordAccesses` | Grant / Revoke modal |
| `#family/appointments` | `AppointmentsView` | Scheduled/past appointments, status badges | `appointments` | `#family/book-appointment` |
| `#family/book-appointment`| `BookAppointmentView` | Date picker, slot selector, triage reason | Doctor availability | `#family/appointment-assessment` |
| `#family/appointment-assessment` | `AppointmentAssessmentView` | Pre-visit AI symptom check & triage | Symptom input | `#family/appointments` |
| `#family/consultations` | `ConsultationsView` | Clinical notes, diagnoses, treatment plans | `consultations` | View consultation details |
| `#family/prescriptions` | `PrescriptionsView` | Medication schedule, dosages, refill timelines | `prescriptions` | View Rx details |
| `#family/general-health-risk` | `GeneralHealthRiskView` | Multi-system wellness index & lifestyle metrics | `aiPredictions` (`ai_general`) | Dashboard |
| `#family/help` | `HelpCenterView` | FAQ, teleconsultation guides, emergency numbers | Knowledge base | Contact modal |
| `#family/settings` | `SettingsView` | Profile preferences, notification toggles, dark mode | Local preferences | Self |

---

### C. Doctor Clinical Workspace (`#doctor/*`) — 12 Views
| Route / Hash | View Component | Purpose | Key Data Inputs | Destination Views |
| :--- | :--- | :--- | :--- | :--- |
| `#doctor/dashboard` | `DashboardView` | OPD shift summary, caseload KPIs, max-3 queue | `appointments`, `doctors` | All doctor sub-views |
| `#doctor/patients` | `PatientsView` | Authorized patient roster, consent status | `recordAccesses`, `familyMembers` | `#doctor/patient-profile` |
| `#doctor/patient-profile` | `PatientProfileView` | Complete unified clinical history (Consent-gated) | `medicalRecords`, `aiPredictions` | `#doctor/consultations` |
| `#doctor/patient-access` | `PatientAccessView` | Audit trail of granted/revoked patient records | `initialAccessHistory` | Patient access logs |
| `#doctor/appointments` | `AppointmentsView` | Daily OPD queue, tokens, checked-in triage | Scoped appointments | `#doctor/consultations` |
| `#doctor/consultations` | `ConsultationsView` | Clinical encounter notes (DRAFT $\rightarrow$ FINAL $\rightarrow$ AMENDED) | `consultations` | New consultation modal |
| `#doctor/prescriptions` | `PrescriptionsView` | Rx generation & titration (DRAFT $\rightarrow$ FINAL $\rightarrow$ CORRECTED) | `prescriptions` | New prescription modal |
| `#doctor/ai-diagnostic` | `AiDiagnosticView` | Clinical AI review, 4 pipelines, risk scoring | `aiPredictions` | `#doctor/ai-explainability` |
| `#doctor/ai-explainability`| `AiExplainabilityView` | Grad-CAM activation heatmaps, feature importance | Radiograph & model data | `#doctor/ai-diagnostic` |
| `#doctor/availability` | `AvailabilityView` | Schedule config, slot duration, lunch breaks | Availability settings | Self |
| `#doctor/knowledge` | `KnowledgeView` | Clinical guidelines, department publications | `knowledgeArticles` | Create article modal |
| `#doctor/settings` | `SettingsView` | Notification tones, auto-open AI heatmap toggle | Doctor settings | Self |

---

### D. Department Head Hub (`#department-head/*`) — 10 Views
| Route / Hash | View Component | Purpose | Key Data Inputs | Destination Views |
| :--- | :--- | :--- | :--- | :--- |
| `#department-head/dashboard` | `DashboardView` | Department OPD throughput, doctor roster, KPIs | Scoped department | All dept-head views |
| `#department-head/doctors` | `DoctorsView` | Department clinicians, status toggle, room allocations | Scoped doctors | `#department-head/doctor-details` |
| `#department-head/doctor-details` | `DoctorDetailsView` | Individual doctor performance, caseload, room assignment | Selected doctor | `#department-head/doctors` |
| `#department-head/appointments` | `AppointmentsView` | Department OPD schedule, queue distribution | Scoped appointments | View appointment details |
| `#department-head/analytics` | `DepartmentAnalyticsView` | Hourly patient arrival patterns, completion rates | Analytical datasets | `#department-head/performance` |
| `#department-head/performance` | `DoctorPerformanceView` | Physician caseload comparison, on-time start rates | `initialDoctorPerformance` | Doctor review |
| `#department-head/workload` | `WorkloadView` | Capacity planning, bed occupancy, doctor density | Workload metrics | Capacity optimization |
| `#department-head/ai-analytics` | `AiAnalyticsView` | Departmental AI diagnostic accuracy & concordance | `initialAiAnalytics` | AI audit review |
| `#department-head/knowledge` | `KnowledgeView` | Department clinical protocols & peer-reviewed papers | `knowledgeArticles` | Create article modal |
| `#department-head/settings` | `SettingsView` | Direct booking toggles, AI auto-precheck rules | Dept settings | Self |

---

### E. Hospital Admin Portal (`#hospital-admin/*`) — 14 Views
| Route / Hash | View Component | Purpose | Key Data Inputs | Destination Views |
| :--- | :--- | :--- | :--- | :--- |
| `#hospital-admin/dashboard` | `DashboardView` | Facility occupancy, revenue, active staff KPIs | Scoped hospital | All hospital admin views |
| `#hospital-admin/profile` | `HospitalProfileView` | Facility NABH/JCI standing, bed capacity, address | `hospitals` | Edit hospital modal |
| `#hospital-admin/departments`| `DepartmentsView` | Ward capacities, active department listing | Scoped departments | Create/Edit dept modals |
| `#hospital-admin/department-heads` | `DepartmentHeadsView` | Clinical leadership roster, assigned departments | Scoped department heads | Create head modal |
| `#hospital-admin/department-head-details` | `DepartmentHeadDetailsView` | Leadership tenure, department metrics, credentials | Selected department head | `#hospital-admin/department-heads` |
| `#hospital-admin/doctors` | `DoctorsView` | Facility staff directory, OPD room assignments | Scoped doctors | `#hospital-admin/doctor-details` |
| `#hospital-admin/doctor-details` | `DoctorDetailsView` | Clinician schedule, performance stats, credentials | Selected doctor | `#hospital-admin/doctors` |
| `#hospital-admin/staff` | `StaffManagementView` | Nursing, administrative & clinical headcount | Staff allocations | Shift rosters |
| `#hospital-admin/analytics` | `HospitalAnalyticsView` | Operational throughput, average stay, bed occupancy | `initialHospitalAnalytics` | Comparative analytics |
| `#hospital-admin/department-analytics` | `DepartmentAnalyticsView` | Cross-department workload & throughput distribution | Department metrics | Hospital analytics |
| `#hospital-admin/ai-analytics`| `AiAnalyticsView` | Hospital-wide AI accuracy, inference volume | AI telemetry | Model performance |
| `#hospital-admin/reports` | `ReportsView` | Monthly audit reports, clinical safety summaries | `initialReports` | Generate report modal |
| `#hospital-admin/knowledge` | `KnowledgeActivityView` | Published hospital clinical guidelines & research | `knowledgeArticles` | Knowledge repository |
| `#hospital-admin/settings` | `SettingsView` | EMR integration status, emergency OPD override | Facility settings | Self |

---

### F. Chairman & Platform Owner Portal (`#chairman/*`) — 12 Views
| Route / Hash | View Component | Purpose | Key Data Inputs | Destination Views |
| :--- | :--- | :--- | :--- | :--- |
| `#chairman/dashboard` | `PlatformDashboard` | Multi-hospital network KPIs, system health, max-3 queue | `initialPlatformSummary` | All chairman views |
| `#chairman/analytics` | `PlatformAnalyticsView` | Platform throughput, multi-hospital growth, financials | Analytics aggregations | Hospital performance |
| `#chairman/hospitals` | `HospitalsView` | Active certified network + 2 Pending onboarding requests | `hospitals`, `hospitalRequests` | Request review modal |
| `#chairman/admins` | `HospitalAdminsView` | Platform-wide administrator credentials & status | `hospitalAdmins` | Create admin modal |
| `#chairman/departments` | `DepartmentsView` | Platform department directory with hospital filters | `departments` | Department detail |
| `#chairman/families` | `FamilyAccountsView` | Registered family accounts, membership density | `families` | Family account detail |
| `#chairman/performance` | `HospitalPerformanceView` | Institutional benchmarking, bed occupancy comparison | Multi-hospital metrics | Facility drill-down |
| `#chairman/appointments` | `AppointmentsView` | Platform appointments transaction ledger & analytics | `initialAppointmentsLedger` | Appointment analytics |
| `#chairman/ai-analytics` | `AiAnalyticsView` | Platform-wide 4-module AI telemetry & radar chart | `initialAiAnalytics` | Model telemetry |
| `#chairman/reports` | `ReportsView` | Governance audits, institutional compliance PDF export | System reports | Download report |
| `#chairman/knowledge` | `KnowledgeActivityView` | Network-wide research repository & clinical papers | `knowledgeArticles` | Knowledge hub |
| `#chairman/settings` | `SettingsView` | Network security tier, HIPAA logging, maintenance mode | `platformSettings` | Save configuration |

---

## 3. Route Verification Verdict: PASS
All 68 routes load cleanly, maintain state during browser refresh/back navigation, and enforce strict role boundaries.
