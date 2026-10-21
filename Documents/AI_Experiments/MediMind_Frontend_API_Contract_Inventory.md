# MediMind — Frontend API Contract Inventory & Verification

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-21  
**Target Branch:** `experiment8-multiview-localized-fusion`  
**Repository Baseline:** `725eedef02d4daf0248f3f5599330329e8719943`  
**Target Environment:** Local Staging / Microservices Gateway (`http://localhost:5000`)

---

## 1. Executive Summary

This document establishes the exhaustive, production-grade inventory of every API contract invoked across the MediMind frontend application (`frontend/src`). Each endpoint was audited through source code inspection across service layers, React layout and view components, and verified against API Gateway routing and downstream microservice controllers.

All frontend API calls pass through the centralized API Gateway on port `5000` via `/api/*` proxies, with standardized JWT authorization, request correlation (`x-request-id`), anti-spoofing header injection (`x-user-id`, `x-user-role`), and standardized response envelopes `{ success, message, data }`.

---

## 2. API Contract Inventory Matrix

| # | Endpoint Route | HTTP Method | Gateway Downstream Port | Frontend Service Caller | Component Consumer | Authentication | Request Body / Query | Expected Response Envelope | Experimental Flag / Gate |
|---|----------------|-------------|-------------------------|-------------------------|--------------------|----------------|----------------------|----------------------------|--------------------------|
| 1 | `/api/auth/login` | POST | 5001 (auth) | `authService.login` | `LoginModal.jsx` | Public | `{ email, password }` | `{ success: true, message: string, data: { user, token } }` | None |
| 2 | `/api/auth/me` | GET | 5001 (auth) | `authService.getCurrentUser` | `App.jsx`, Navbars | Bearer JWT | None | `{ success: true, message: string, data: { user } }` | None |
| 3 | `/api/auth/logout` | POST | 5001 (auth) | `authService.logout` | Layout navbars | Bearer JWT | None | `{ success: true, message: string }` | None |
| 4 | `/api/hospitals` | GET | 5003 (hospital) | `chairmanService.getHospitals` | `PlatformDashboard.jsx`, `HospitalListView.jsx` | Bearer JWT | `statusFilter` (optional) | `{ success: true, data: Hospital[] }` | None |
| 5 | `/api/departments` | GET | 5003 (hospital) | `chairmanService.getDepartments` | `DepartmentsView.jsx`, `BookingModal.jsx` | Bearer JWT | `hospitalId` (optional) | `{ success: true, data: Department[] }` | None |
| 6 | `/api/doctors` | GET | 5004 (doctor) | `doctorService.getDoctors` | `DoctorRosterView.jsx`, `BookingModal.jsx` | Bearer JWT | `hospitalId`, `departmentId` (optional) | `{ success: true, data: Doctor[] }` | None |
| 7 | `/api/doctors/:id` | GET | 5004 (doctor) | `doctorService.getDoctorById` | `DoctorProfileModal.jsx` | Bearer JWT | None (URL parameter) | `{ success: true, data: Doctor }` | None |
| 8 | `/api/appointments` | GET | 5005 (appointment) | `appointmentService.getAppointments` | Doctor, Family, Dept Head views | Bearer JWT | `familyMemberId`, `doctorId`, `departmentId` | `{ success: true, data: Appointment[] }` | None |
| 9 | `/api/appointments/stats` | GET | 5005 (appointment) | `chairmanService.getPlatformSummary` | `PlatformDashboard.jsx` | Bearer JWT | `hospitalId` (optional) | `{ success: true, data: { total, completed, upcoming, cancelled, byStatus, byHospital } }` | **New Aggregated Read Model** |
| 10 | `/api/appointments` | POST | 5005 (appointment) | `appointmentService.bookAppointment` | `BookingModal.jsx` | Bearer JWT | `{ family_member_id, doctor_id, appointment_date, start_time }` | `{ success: true, data: Appointment }` | None |
| 11 | `/api/appointments/:id/cancel` | PUT | 5005 (appointment) | `appointmentService.cancelAppointment` | `AppointmentDetailsModal.jsx` | Bearer JWT | `{ reason }` | `{ success: true, data: Appointment }` | None |
| 12 | `/api/appointments/:id/reschedule` | PUT | 5005 (appointment) | `appointmentService.rescheduleAppointment` | `RescheduleModal.jsx` | Bearer JWT | `{ appointment_date, start_time, reason }` | `{ success: true, data: Appointment }` | None |
| 13 | `/api/appointments/:id/complete` | PUT | 5005 (appointment) | `appointmentService.completeAppointment` | `DoctorConsultationView.jsx` | Bearer JWT | `{ notes }` | `{ success: true, data: Appointment }` | None |
| 14 | `/api/appointments/alternatives` | GET | 5005 (appointment) | `appointmentService.getAlternatives` | `AlternativesModal.jsx` | Bearer JWT | `appointmentId` | `{ success: true, data: AlternativeSlot[] }` | None |
| 15 | `/api/families/my-family` | GET | 5002 (family) | `familyService.getMyFamily` | `FamilyLayout.jsx`, `FamilyDashboard.jsx` | Bearer JWT | None | `{ success: true, data: Family }` | None |
| 16 | `/api/families/members` | GET | 5002 (family) | `familyService.getFamilyMembers` | `FamilyMembersView.jsx` | Bearer JWT | None | `{ success: true, data: FamilyMember[] }` | None |
| 17 | `/api/medical-records` | GET | 5006 (records) | `recordService.getRecords` | `MedicalRecordsView.jsx` | Bearer JWT | `memberId`, `dateFrom`, `dateTo` | `{ success: true, data: MedicalRecord[] }` | None |
| 18 | `/api/ai/general-health` | POST | 5007 (ai) | `aiService.predictGeneralHealth` | `GeneralHealthAssessment.jsx` | Bearer JWT | `{ symptoms, lifestyle, family_history }` | `{ success: true, data: GeneralHealthPrediction }` | Production |
| 19 | `/api/ai/heart-disease` | POST | 5007 (ai) | `aiService.predictHeartDisease` | `HeartDiseaseScreening.jsx` | Bearer JWT | `{ age, sex, chest_pain_type, resting_bp, cholesterol, ... }` | `{ success: true, data: CardiovascularRiskPrediction }` | Production |
| 20 | `/api/ai/diabetes` | POST | 5007 (ai) | `aiService.predictDiabetes` | `DiabetesScreening.jsx` | Bearer JWT | `{ pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, dpf, age }` | `{ success: true, data: DiabetesRiskPrediction }` | Production Baseline (`ENABLE_DIABETES_SHADOW_EVAL=false`) |
| 21 | `/api/ai/fracture` | POST | 5007 (ai) | `aiService.predictFracture` | `XrayAnalysisView.jsx` | Bearer JWT | Multipart form-data: `image` (X-ray), `pain_level` (1-10) | `{ success: true, data: FractureRiskPrediction }` | Production V2 (`best_model.pt`) |
| 22 | `/api/knowledge/articles` | GET | 5008 (knowledge) | `knowledgeService.getArticles` | `KnowledgeHub.jsx` | Bearer JWT | `category`, `search` | `{ success: true, data: Article[] }` | None |
| 23 | `/api/hospital-requests` | GET | 5003 (hospital) | `chairmanService.getHospitalRequests` | `HospitalRequestsView.jsx` | Bearer JWT | `status=Pending` | `{ success: true, data: HospitalRequest[] }` | None |

---

## 3. Data Integrity & Header Forwarding Verification

1. **Request Correlation:** The API Gateway intercepts every incoming request, validates or assigns a unique UUID `x-request-id`, and forwards it across microservices.
2. **Anti-Spoofing Identity Enforcement:** Client-supplied `x-user-id`, `x-user-role`, `x-hospital-id`, and `x-department-id` headers are unconditionally stripped at the API Gateway. Downstream services strictly receive cryptographically verified identity claims extracted from the verified JWT payload.
3. **Response Enveloping:** All controllers adhere to the standard `{ success: boolean, message?: string, data?: any }` structure, ensuring uniform error handling on the frontend.
4. **Safety Flags:**
   - `ENABLE_DIABETES_SHADOW_EVAL`: `false` (enforced in gateway and AI service).
   - `ENABLE_STAGING_DIABETES`: `false` (enforced).
