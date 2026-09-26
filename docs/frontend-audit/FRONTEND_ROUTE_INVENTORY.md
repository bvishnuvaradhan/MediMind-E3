# MediMind Complete Frontend Route Inventory

**Audit Date:** 2026-09-26  
**Total Platform Routes:** 68  
**Architecture:** Hash-Based Client-Side Routing with `sessionStorage` State Restoration and PopState History Synchronization.

---

## 1. Public & Authentication Layer (2 Routes)

| URL / Hash | View Component | Description | Access Role | Target State |
| :--- | :--- | :--- | :---: | :--- |
| `http://localhost:5173/` | `LoginPage` in `AuthPages.jsx` | Multi-role authentication entry with role tabs (Doctor, Dept Head, Hosp Admin, Chairman, Family) | Public / Anonymous | Default unauthenticated landing |
| `http://localhost:5173/#signup` | `SignupPage` in `AuthPages.jsx` | Family account registration portal | Public / Anonymous | Family account creation |

---

## 2. Family Healthcare Portal (18 Routes)

| Hash Route | View Component | File Location | Primary Function |
| :--- | :--- | :--- | :--- |
| `#dashboard` | `DashboardView` | `src/components/family/views/DashboardView.jsx` | Family account wellness overview, upcoming appointments, recent records |
| `#family-members` | `FamilyMembersView` | `src/components/family/views/FamilyMembersView.jsx` | Family roster management, member creation, profile switching |
| `#member-profile` | `MemberProfileView` | `src/components/family/views/MemberProfileView.jsx` | Personal biometrics, chronic conditions, emergency contacts |
| `#medical-records` | `MedicalRecordsView` | `src/components/family/views/MedicalRecordsView.jsx` | Unified health records repository, category filtering, document upload |
| `#ai-predictions` | `AiPredictionsView` | `src/components/family/views/AiPredictionsView.jsx` | Diagnostic screening archive (Fracture, Diabetes, Heart, General) |
| `#personal-prediction-detail`| `PersonalPredictionDetailView` | `src/components/family/views/PersonalPredictionDetailView.jsx` | In-depth biomarker breakdown, risk gauges, population bullet benchmarks |
| `#doctors` | `DoctorsView` | `src/components/family/views/DoctorsView.jsx` | Hospital doctor directory, specialty filters, booking triggers |
| `#doctor-profile` | `DoctorProfileView` | `src/components/family/views/DoctorProfileView.jsx` | Physician credentials, consultation fees, available slots |
| `#appointments` | `AppointmentsView` | `src/components/family/views/AppointmentsView.jsx` | Booking schedule, status tracking (Upcoming/Completed/Cancelled) |
| `#appointment-assessment` | `AppointmentAssessmentView` | `src/components/family/views/AppointmentAssessmentView.jsx` | Pre-visit symptom intake questionnaire |
| `#appointment-ai-assessment`| `AppointmentAssessmentView` | `src/components/family/views/AppointmentAssessmentView.jsx` | Clinical AI triage recommendations and clinician matching |
| `#book-appointment` | `BookAppointmentView` | `src/components/family/views/BookAppointmentView.jsx` | Slot selection, reason for visit, appointment confirmation |
| `#consultations` | `ConsultationsView` | `src/components/family/views/ConsultationsView.jsx` | Past consultation summaries and doctor clinical advice |
| `#prescriptions` | `PrescriptionsView` | `src/components/family/views/PrescriptionsView.jsx` | Active prescriptions, medication schedules, digital signatures |
| `#doctor-access` | `DoctorAccessView` | `src/components/family/views/DoctorAccessView.jsx` | Consent management (Grant/Revoke doctor access to records) |
| `#general-health-risk` | `GeneralHealthRiskView` | `src/components/family/views/GeneralHealthRiskView.jsx` | Comprehensive cardiovascular & glycemic health evaluation |
| `#help-center` | `HelpCenterView` | `src/components/family/views/HelpCenterView.jsx` | Patient FAQs, user guides, emergency assistance numbers |
| `#settings` | `SettingsView` | `src/components/family/views/SettingsView.jsx` | Account security, notifications, UI theme toggle |

---

## 3. Doctor Clinical Workspace Portal (12 Routes)

| Hash Route | View Component | File Location | Primary Function |
| :--- | :--- | :--- | :--- |
| `#dashboard` | `DashboardView` | `src/components/doctor/views/DashboardView.jsx` | Outpatient queue, clinical funnel pipeline, AI alerts |
| `#patients` | `PatientsView` | `src/components/doctor/views/PatientsView.jsx` | Authorized patient roster (filtered by active consent) |
| `#patient_profile` | `PatientProfileView` | `src/components/doctor/views/PatientProfileView.jsx` | Patient clinical history, past records, diagnostic timeline |
| `#appointments` | `AppointmentsView` | `src/components/doctor/views/AppointmentsView.jsx` | OPD consultation schedule, token tracking, visit status |
| `#consultations` | `ConsultationsView` | `src/components/doctor/views/ConsultationsView.jsx` | Clinical encounter notes (Draft, Final, Amended) |
| `#prescriptions` | `PrescriptionsView` | `src/components/doctor/views/PrescriptionsView.jsx` | Digital prescriptions (Draft, Final, Corrected) |
| `#ai_diagnostics` | `AiDiagnosticView` | `src/components/doctor/views/AiDiagnosticView.jsx` | Fracture Detection CNN scan pre-screenings |
| `#ai_explain` | `AiExplainabilityView` | `src/components/doctor/views/AiExplainabilityView.jsx` | Grad-CAM saliency heatmaps, opacity slider, feature weights |
| `#availability` | `AvailabilityView` | `src/components/doctor/views/AvailabilityView.jsx` | OPD shift configuration, weekly slots, patient caps |
| `#patient_access` | `PatientAccessView` | `src/components/doctor/views/PatientAccessView.jsx` | Consent audit log (Active vs Revoked permissions) |
| `#knowledge` | `KnowledgeView` | `src/components/doctor/views/KnowledgeView.jsx` | Clinical guideline reader and article publication |
| `#settings` | `SettingsView` | `src/components/doctor/views/SettingsView.jsx` | Clinic room configuration, consultation fee, preferences |

---

## 4. Department Head Portal (10 Routes)

| Hash Route | View Component | File Location | Primary Function |
| :--- | :--- | :--- | :--- |
| `#dashboard` | `DashboardView` | `src/components/department-head/views/DashboardView.jsx` | Department hub, roster summary, daily OPD schedule |
| `#doctors` | `DoctorsView` | `src/components/department-head/views/DoctorsView.jsx` | Doctor provisioning, status toggles, room assignments |
| `#doctor_details` | `DoctorDetailsView` | `src/components/department-head/views/DoctorDetailsView.jsx` | Physician performance metrics and consultation throughput |
| `#appointments` | `AppointmentsView` | `src/components/department-head/views/AppointmentsView.jsx` | Department-wide OPD schedule and token distribution |
| `#workload` | `WorkloadView` | `src/components/department-head/views/WorkloadView.jsx` | Physician capacity utilization and shift rebalancing |
| `#analytics` | `DepartmentAnalyticsView` | `src/components/department-head/views/DepartmentAnalyticsView.jsx` | Daily throughput, subspecialty mix, hourly activity heatmap |
| `#ai_analytics` | `AiAnalyticsView` | `src/components/department-head/views/AiAnalyticsView.jsx` | Fracture anomaly distribution and model safety radar |
| `#performance` | `DoctorPerformanceView` | `src/components/department-head/views/DoctorPerformanceView.jsx` | Bivariate scatter plot (Caseload vs On-Time rate) |
| `#knowledge` | `KnowledgeView` | `src/components/department-head/views/KnowledgeView.jsx` | Department guideline authoring and protocol review |
| `#settings` | `SettingsView` | `src/components/department-head/views/SettingsView.jsx` | Department ward capacity and emergency on-call setup |

---

## 5. Hospital Admin Portal (14 Routes)

| Hash Route | View Component | File Location | Primary Function |
| :--- | :--- | :--- | :--- |
| `#dashboard` | `DashboardView` | `src/components/hospital-admin/views/DashboardView.jsx` | Hospital overview, active departments, operational stats |
| `#hospital-profile` | `HospitalProfileView` | `src/components/hospital-admin/views/HospitalProfileView.jsx` | Facility profile, NABH accreditation, emergency contacts |
| `#departments` | `DepartmentsView` | `src/components/hospital-admin/views/DepartmentsView.jsx` | Department creation, ward bed allocation, status management |
| `#department-heads` | `DepartmentHeadsView` | `src/components/hospital-admin/views/DepartmentHeadsView.jsx` | Department Head onboarding and leadership assignment |
| `#department-head-details` | `DepartmentHeadDetailsView` | `src/components/hospital-admin/views/DepartmentHeadDetailsView.jsx` | Leadership credentials and department oversight data |
| `#doctors` | `DoctorsView` | `src/components/hospital-admin/views/DoctorsView.jsx` | Hospital physician directory and active status control |
| `#doctor-details` | `DoctorDetailsView` | `src/components/hospital-admin/views/DoctorDetailsView.jsx` | Doctor clinical workload and OPD schedule |
| `#staff-management` | `StaffManagementView` | `src/components/hospital-admin/views/StaffManagementView.jsx` | Hospital workforce administration (Nurses, Techs, Admins) |
| `#hospital-operational-analytics` | `HospitalAnalyticsView` | `src/components/hospital-admin/views/HospitalAnalyticsView.jsx` | 5-month admissions trajectory, peak density heatmap, bed bullet charts |
| `#department-comparative-analytics` | `DepartmentAnalyticsView` | `src/components/hospital-admin/views/DepartmentAnalyticsView.jsx` | Cross-department grouped bar comparisons and load share donuts |
| `#ai-analytics` | `AiAnalyticsView` | `src/components/hospital-admin/views/AiAnalyticsView.jsx` | Hospital-wide AI model volume share and 4-model reliability radar |
| `#reports` | `ReportsView` | `src/components/hospital-admin/views/ReportsView.jsx` | Regulatory, audit, and operational report generation & export |
| `#knowledge-activity` | `KnowledgeActivityView` | `src/components/hospital-admin/views/KnowledgeActivityView.jsx` | Institutional audit trail and governance change log |
| `#settings` | `SettingsView` | `src/components/hospital-admin/views/SettingsView.jsx` | Facility system settings, maintenance windows, audit retention |

---

## 6. Chairman & Platform Owner Portal (12 Routes)

| Hash Route | View Component | File Location | Primary Function |
| :--- | :--- | :--- | :--- |
| `#dashboard` | `PlatformDashboard` | `src/components/chairman/views/PlatformDashboard.jsx` | Ecosystem governance, hospital network overview, pending onboarding alert |
| `#platform-analytics` | `PlatformAnalyticsView` | `src/components/chairman/views/PlatformAnalyticsView.jsx` | User account composition, platform uptime gauge, resolution share |
| `#hospitals` | `HospitalsView` | `src/components/chairman/views/HospitalsView.jsx` | Certified hospital network & pending membership requests (Approve/Reject) |
| `#hospital-admins` | `HospitalAdminsView` | `src/components/chairman/views/HospitalAdminsView.jsx` | Hospital administrator provisioning and account management |
| `#departments` | `DepartmentsView` | `src/components/chairman/views/DepartmentsView.jsx` | Aggregated network departments and total bed capacities |
| `#family-accounts` | `FamilyAccountsView` | `src/components/chairman/views/FamilyAccountsView.jsx` | Ecosystem family accounts directory and member counts |
| `#hospital-performance` | `HospitalPerformanceView` | `src/components/chairman/views/HospitalPerformanceView.jsx` | Cross-hospital comparative throughput and inpatient capacity bullet charts |
| `#appointments` | `AppointmentsView` | `src/components/chairman/views/AppointmentsView.jsx` | Platform-wide appointment trends and scheduling metrics |
| `#ai-analytics` | `AiAnalyticsView` | `src/components/chairman/views/AiAnalyticsView.jsx` | 4-Model trajectory, multi-attribute calibration radar, inference latency |
| `#reports` | `ReportsView` | `src/components/chairman/views/ReportsView.jsx` | Executive audit generation, compliance reports, CSV/PDF export |
| `#knowledge-activity` | `KnowledgeActivityView` | `src/components/chairman/views/KnowledgeActivityView.jsx` | System-wide administrative governance audit trail |
| `#settings` | `SettingsView` | `src/components/chairman/views/SettingsView.jsx` | Platform maintenance mode, MFA enforcement, global policies |

---

## 7. Routing Verification Summary
- **Zero Obsolete Hashes**: All navigation links, buttons, shortcuts, and breadcrumbs map 1:1 with the verified 68 route targets.
- **Deep-Link State Preservation**: Direct URL entry with valid hashes successfully initializes the correct view and sets active sidebar navigation.
- **Unauthorized Fallback**: Unauthenticated requests to protected hashes cleanly route to `LoginPage` without flashing protected content.
