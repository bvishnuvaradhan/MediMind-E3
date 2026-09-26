# MediMind Frontend Service Contract & API Mapping Audit

**Audit Date:** 2026-09-26  
**Auditor:** MediMind Engineering & API Architecture  
**Purpose:** Formal specification of all frontend service methods, data shapes, authorization scopes, and their corresponding future backend REST endpoints.

---

## 1. Chairman Service (`src/services/chairmanService.js`)

| Service Method | Purpose | Role & Scope | Source Data | Expected REST Endpoint | HTTP Method | Target Backend Controller |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| `getPlatformSummary()` | Platform-wide KPIs & counts | `CHAIRMAN` (Ecosystem) | `summary` | `/api/v1/chairman/summary` | `GET` | `ChairmanController.getSummary` |
| `getHospitals()` | Active network hospitals | `CHAIRMAN` (Ecosystem) | `initialHospitals` | `/api/v1/chairman/hospitals` | `GET` | `HospitalController.getAll` |
| `getHospitalRequests(status)` | Pending/Approved/Rejected requests | `CHAIRMAN` (Ecosystem) | `initialHospitalRequests` | `/api/v1/chairman/hospital-requests?status={status}` | `GET` | `HospitalRequestController.getRequests` |
| `reviewHospitalRequest(id, status, reason)` | Approve or reject onboarding | `CHAIRMAN` (Ecosystem) | Mutates request & hospital list | `/api/v1/chairman/hospital-requests/{id}/review` | `POST` | `HospitalRequestController.review` |
| `getHospitalAdmins()` | List hospital administrators | `CHAIRMAN` (Ecosystem) | `initialHospitalAdmins` | `/api/v1/chairman/admins` | `GET` | `AdminController.getAll` |
| `createHospitalAdmin(adminData)` | Provision new hospital admin | `CHAIRMAN` (Ecosystem) | Mutates admin roster | `/api/v1/chairman/admins` | `POST` | `AdminController.create` |
| `getFamilyAccounts()` | List ecosystem family accounts | `CHAIRMAN` (Ecosystem) | `initialFamilyAccounts` | `/api/v1/chairman/family-accounts` | `GET` | `FamilyAccountController.getAccounts` |
| `getAppointments(filters)` | Platform appointment logs | `CHAIRMAN` (Ecosystem) | `initialPresentationData.Appointments` | `/api/v1/chairman/appointments` | `GET` | `AppointmentController.getPlatformLogs` |
| `getAiAnalytics()` | 4-Model performance & volume | `CHAIRMAN` (Ecosystem) | `aiAggregateMetrics` | `/api/v1/chairman/ai-analytics` | `GET` | `AiAnalyticsController.getEcosystemMetrics` |
| `getReports()` | Governance audit reports | `CHAIRMAN` (Ecosystem) | `initialReports` | `/api/v1/chairman/reports` | `GET` | `ReportController.getReports` |
| `generateReport(reportConfig)` | Generate new platform report | `CHAIRMAN` (Ecosystem) | Mutates reports state | `/api/v1/chairman/reports/generate` | `POST` | `ReportController.generate` |

---

## 2. Hospital Admin Service (`src/services/hospitalAdminService.js`)

| Service Method | Purpose | Role & Scope | Source Data | Expected REST Endpoint | HTTP Method | Target Backend Controller |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| `getProfile()` | Hospital facility profile | `HOSPITAL_ADMIN` (`hosp_01`) | `initialHospitalProfile` | `/api/v1/hospital/profile` | `GET` | `HospitalProfileController.getProfile` |
| `updateProfile(data)` | Edit facility metadata | `HOSPITAL_ADMIN` (`hosp_01`) | Mutates profile | `/api/v1/hospital/profile` | `PUT` | `HospitalProfileController.updateProfile` |
| `getDepartments()` | Hospital clinical departments | `HOSPITAL_ADMIN` (`hosp_01`) | `initialHospitalDepartments` | `/api/v1/hospital/departments` | `GET` | `DepartmentController.getHospitalDepts` |
| `createDepartment(dept)` | Create new department | `HOSPITAL_ADMIN` (`hosp_01`) | Mutates departments | `/api/v1/hospital/departments` | `POST` | `DepartmentController.create` |
| `updateDepartment(id, data)`| Edit department details | `HOSPITAL_ADMIN` (`hosp_01`) | Mutates department | `/api/v1/hospital/departments/{id}` | `PUT` | `DepartmentController.update` |
| `getDepartmentHeads()` | List hospital department heads | `HOSPITAL_ADMIN` (`hosp_01`) | `initialDepartmentHeads` | `/api/v1/hospital/department-heads` | `GET` | `DepartmentHeadController.getHeads` |
| `createDepartmentHead(head)`| Provision department head | `HOSPITAL_ADMIN` (`hosp_01`) | Mutates heads & staff | `/api/v1/hospital/department-heads` | `POST` | `DepartmentHeadController.create` |
| `getDoctors(deptId)` | List staff doctors | `HOSPITAL_ADMIN` (`hosp_01`) | `initialHospitalDoctors` | `/api/v1/hospital/doctors` | `GET` | `DoctorController.getHospitalDoctors` |
| `getAnalytics()` | Hospital operational metrics | `HOSPITAL_ADMIN` (`hosp_01`) | `initialHospitalAnalytics` | `/api/v1/hospital/analytics` | `GET` | `HospitalAnalyticsController.getAnalytics` |
| `getAuditLogs()` | Institutional activity log | `HOSPITAL_ADMIN` (`hosp_01`) | `initialAuditLogs` | `/api/v1/hospital/audit-logs` | `GET` | `AuditLogController.getLogs` |

---

## 3. Department Head Service (`src/services/departmentHeadService.js`)

| Service Method | Purpose | Role & Scope | Source Data | Expected REST Endpoint | HTTP Method | Target Backend Controller |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| `getDepartmentInfo()` | Department metadata & floor | `DEPARTMENT_HEAD` (`Ortho`) | Department object | `/api/v1/department/info` | `GET` | `DepartmentController.getInfo` |
| `getDoctors()` | Department doctor roster | `DEPARTMENT_HEAD` (`Ortho`) | `doctors` array | `/api/v1/department/doctors` | `GET` | `DoctorController.getDeptDoctors` |
| `createDoctor(docData)` | Provision staff clinician | `DEPARTMENT_HEAD` (`Ortho`) | Mutates doctors | `/api/v1/department/doctors` | `POST` | `DoctorController.provisionDoctor` |
| `updateDoctor(id, data)` | Update doctor status/room | `DEPARTMENT_HEAD` (`Ortho`) | Mutates doctor | `/api/v1/department/doctors/{id}` | `PUT` | `DoctorController.updateDoctor` |
| `getAppointments()` | Department OPD schedule | `DEPARTMENT_HEAD` (`Ortho`) | `appointments` | `/api/v1/department/appointments` | `GET` | `AppointmentController.getDeptSchedule` |
| `getAnalytics()` | Department encounters & mix | `DEPARTMENT_HEAD` (`Ortho`) | `analytics` | `/api/v1/department/analytics` | `GET` | `DepartmentAnalyticsController.getDeptMetrics` |
| `getDoctorPerformance()` | Caseload & on-time stats | `DEPARTMENT_HEAD` (`Ortho`) | `doctorPerformance` | `/api/v1/department/performance` | `GET` | `DepartmentAnalyticsController.getPerformance` |
| `getArticles()` | Department guidelines | `DEPARTMENT_HEAD` (`Ortho`) | `articles` | `/api/v1/department/knowledge` | `GET` | `KnowledgeController.getGuidelines` |
| `createArticle(article)` | Publish clinical guideline | `DEPARTMENT_HEAD` (`Ortho`) | Mutates articles | `/api/v1/department/knowledge` | `POST` | `KnowledgeController.createGuideline` |

---

## 4. Doctor Service (`src/services/doctorService.js`)

| Service Method | Purpose | Role & Scope | Source Data | Expected REST Endpoint | HTTP Method | Target Backend Controller |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| `getProfile()` | Doctor credentials & room | `DOCTOR` (`Dr. Rahul`) | `doctorProfile` | `/api/v1/doctor/profile` | `GET` | `DoctorController.getMyProfile` |
| `getAuthorizedPatients()` | Patients with active consent | `DOCTOR` (`Dr. Rahul`) | Scoped by `RecordAccess` | `/api/v1/doctor/patients` | `GET` | `PatientController.getAuthorizedPatients` |
| `getAppointments()` | Doctor daily OPD slots | `DOCTOR` (`Dr. Rahul`) | `appointments` | `/api/v1/doctor/appointments` | `GET` | `AppointmentController.getDoctorSchedule` |
| `getConsultations()` | Clinical consultation notes | `DOCTOR` (`Dr. Rahul`) | `consultations` | `/api/v1/doctor/consultations` | `GET` | `ConsultationController.getDoctorConsultations` |
| `saveConsultation(data)` | Create/Amend consultation | `DOCTOR` (`Dr. Rahul`) | Mutates consultations | `/api/v1/doctor/consultations` | `POST` / `PUT` | `ConsultationController.saveConsultation` |
| `getPrescriptions()` | Digital prescriptions | `DOCTOR` (`Dr. Rahul`) | `prescriptions` | `/api/v1/doctor/prescriptions` | `GET` | `PrescriptionController.getDoctorPrescriptions` |
| `savePrescription(data)` | Issue/Correct prescription | `DOCTOR` (`Dr. Rahul`) | Mutates prescriptions | `/api/v1/doctor/prescriptions` | `POST` / `PUT` | `PrescriptionController.savePrescription` |
| `getAccessHistory()` | Consent audit history | `DOCTOR` (`Dr. Rahul`) | `accessHistory` | `/api/v1/doctor/access-history` | `GET` | `ConsentController.getDoctorAccessLogs` |

---

## 5. Family Service & Data Handlers (`src/components/family/`)

| Service Handler | Purpose | Role & Scope | Source Data | Expected REST Endpoint | HTTP Method | Target Backend Controller |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| `getFamilyMembers()` | Family members roster | `FAMILY` (`fam_01`) | `initialFamilyMembers` | `/api/v1/family/members` | `GET` | `FamilyMemberController.getMembers` |
| `addFamilyMember(member)`| Add new family profile | `FAMILY` (`fam_01`) | Mutates members | `/api/v1/family/members` | `POST` | `FamilyMemberController.addMember` |
| `getMedicalRecords()` | Unified health records | `FAMILY` (`fam_01`) | `initialRecords` | `/api/v1/family/records` | `GET` | `MedicalRecordController.getRecords` |
| `uploadRecord(record)` | Upload lab/radiology record | `FAMILY` (`fam_01`) | Mutates records | `/api/v1/family/records/upload` | `POST` (Multipart) | `MedicalRecordController.uploadRecord` |
| `deleteRecord(id)` | Delete medical record | `FAMILY` (`fam_01`) | Mutates records | `/api/v1/family/records/{id}` | `DELETE` | `MedicalRecordController.deleteRecord` |
| `bookAppointment(data)` | Book OPD consultation slot | `FAMILY` (`fam_01`) | Mutates appointments | `/api/v1/family/appointments/book` | `POST` | `AppointmentController.book` |
| `cancelAppointment(id)` | Cancel scheduled visit | `FAMILY` (`fam_01`) | Mutates appointment status | `/api/v1/family/appointments/{id}/cancel` | `POST` | `AppointmentController.cancel` |
| `grantDoctorAccess(grant)`| Grant consent to doctor | `FAMILY` (`fam_01`) | Mutates `doctorAccess` | `/api/v1/family/consent/grant` | `POST` | `ConsentController.grantConsent` |
| `revokeDoctorAccess(entry)`| Revoke clinician consent | `FAMILY` (`fam_01`) | Mutates `doctorAccess` | `/api/v1/family/consent/revoke` | `POST` | `ConsentController.revokeConsent` |

---

## 6. Service Verification Verdict: PASS
All service methods have clean input/output interfaces, well-defined asynchronous patterns, strict role scoping, and are 100% ready to bind to backend REST endpoints.
