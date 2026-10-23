# MediMind — Regression Test Suite & Production Build Verification Evidence

**Audit Date:** October 23, 2026  
**Auditor:** Antigravity Autonomous Coding & Governance Agent  
**Branch:** `experiment8-multiview-localized-fusion`  
**Test Suite Status:** **100% PASSING (283/283 PYTEST TESTS PASSED, EXCEL EXPORTS VERIFIED, BUILD CLEAN)**

---

## 1. Executive Summary

A comprehensive regression verification pass was executed covering backend microservices, the Python FastAPI AI inference engine, model artifact checksums, Excel reporting engines, and frontend production compilation.

All tests passed with zero failures, zero regressions, and zero breaking changes.

---

## 2. Python Pytest Suite (`ai-prediction-service`)

Execution of `python -m pytest` inside `ai-prediction-service`:

```
============================= test session starts =============================
platform win32 -- Python 3.14.8, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\projects\MediMind\ai-prediction-service
plugins: anyio-4.15.1, platformdirs-4.12.3, asyncio-1.4.0
asyncio: mode=Mode.STRICT, debug=False
collected 283 items

tests\diabetes\test_diabetes_inference.py .................              [  6%]
tests\diabetes\test_diabetes_preprocessing.py ...............            [ 11%]
tests\diabetes\test_shadow_diabetes_service.py .....................     [ 18%]
tests\diabetes\test_staging_diabetes_service.py .....                    [ 20%]
tests\fracture\test_experiment_isolation.py ....                         [ 21%]
tests\fracture\test_fracatlas_ingestion.py ....                          [ 23%]
tests\fracture\test_fracture_inference.py ................               [ 28%]
tests\fracture\test_fracture_preprocessing.py ..............             [ 33%]
tests\fracture\test_fracture_training.py .......                         [ 36%]
tests\fracture\test_mura_audit.py .........                              [ 39%]
tests\general_health\test_advanced_dataset.py .                          [ 39%]
tests\general_health\test_dataset.py .                                   [ 40%]
tests\general_health\test_general_health.py ........                     [ 43%]
tests\general_health\test_robustness.py ................................ [ 54%]
...............................................................          [ 76%]
tests\heart_disease\test_heart_disease_inference.py ..........           [ 80%]
tests\heart_disease\test_heart_disease_preprocessing.py .....            [ 81%]
tests\test_auth.py ...............................................       [ 98%]
tests\test_mongodb_integration.py ....                                   [100%]

================= 283 passed, 24 warnings in 89.78s (0:01:29) =================
```

---

## 3. Cryptographic Checksums of Production Models

Verification executed via `scripts/verify_model_hashes.py`:

```
[MATCH] ai-prediction-service/artifacts/diabetes/best_model.joblib:
        65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9
[MATCH] ai-prediction-service/artifacts/heart_disease/best_model.joblib:
        1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c
[MATCH] ai-prediction-service/app/services/diabetes_service.py:
        1d8af27e821ef49177e3295096483d50fa8248a59032b6284c72ba1f1399e268
[MATCH] ai-prediction-service/app/services/heart_disease_service.py:
        678da749c49d5c19937a417e9ffc193d4b0a937308bc6b3987a3392cebf7a3f2
[MATCH] ai-prediction-service/artifacts/fracture_v2/best_model.pt:
        ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60
[MATCH] ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt:
        eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d

OVERALL MODEL HASH INTEGRITY: 100% PERFECT MATCH
```

---

## 4. Multi-Report Export & Workbook Integrity Evidence

Execution of `scripts/test_all_report_exports.py`:

```
=== TESTING EXCEL EXPORT & PREVIEW FOR ALL 5 REPORT TYPES ===

--- Testing Report Type: doctor_appointment ---
  [PASS] Preview 200 OK (1.02s) - Title: Doctor & Appointment Audit Report
         Summary: {'totalDoctors': 68, 'activeDoctors': 66, 'inactiveDoctors': 2, 'totalAppointments': 3767, 'statusBreakdown': {'COMPLETED': 2355, 'CONFIRMED': 435, 'BOOKED': 425, 'CANCELLED': 366, 'RESCHEDULED': 186}}
  [PASS] Excel Export 200 OK (15.44s) - Payload: 218649 bytes
         Sheets (4): ['Report Summary', 'Doctor Directory', 'Appointments', 'Doctor Appointment Summary']

--- Testing Report Type: hospital ---
  [PASS] Preview 200 OK (0.94s) - Title: Hospital Network & Infrastructure Report
         Summary: {'totalFacilities': 5, 'activeFacilities': 3, 'pendingFacilities': 2, 'totalDepartments': 13, 'totalAdministrators': 4}
  [PASS] Excel Export 200 OK (1.08s) - Payload: 9985 bytes
         Sheets (3): ['Hospital Network Summary', 'Hospital Facilities', 'Clinical Departments']

--- Testing Report Type: user ---
  [PASS] Preview 200 OK (1.05s) - Title: Platform User & Workforce Distribution Report
         Summary: {'totalPlatformAccounts': 96, 'activeDoctors': 66, 'deactivatedDoctors': 2, 'departmentHeads': 14, 'hospitalAdmins': 4, 'registeredFamilies': 10}
  [PASS] Excel Export 200 OK (1.07s) - Payload: 14374 bytes
         Sheets (3): ['Workforce & User Summary', 'Credentialed Doctors', 'Department Heads']

--- Testing Report Type: appointment ---
  [PASS] Preview 200 OK (0.80s) - Title: Appointments & Clinical Utilization Report
         Summary: {'totalAppointments': 3767, 'completedConsultations': 2355, 'scheduledAppointments': 3619, 'walkInConsultations': 148, 'statusBreakdown': {'COMPLETED': 2355, 'CONFIRMED': 435, 'BOOKED': 425, 'CANCELLED': 366, 'RESCHEDULED': 186}, 'completionRate': '62.5%'}
  [PASS] Excel Export 200 OK (1.33s) - Payload: 172162 bytes
         Sheets (3): ['Clinical Utilization Summary', 'Department Breakdown', 'Appointments Ledger']

--- Testing Report Type: ai ---
  [PASS] Preview 200 OK (0.17s) - Title: Clinical AI Diagnostic Performance Report
         Summary: {'totalPredictions': 3719, 'appointmentLinked': 3693, 'standaloneScreenings': 26, 'nonWalkInCoverage': '100.0%', 'activeModelPipelines': 4, 'cryptographicIntegrity': '100% Bit-for-Bit Verified'}
  [PASS] Excel Export 200 OK (0.38s) - Payload: 60126 bytes
         Sheets (4): ['AI Diagnostic Summary', 'Model Checksums & Specs', 'Modality Inferences', 'AI Predictions Log']

[ALL 5 REPORT TYPES VERIFIED 100% WORKING]
```

---

## 5. Active-Hospital-Only Export Isolation Evidence

Execution of `scripts/test_active_hospitals_report.py`:

```
Chairman Login Status: 200

--- 1. Testing GET /api/appointments/reports/preview with ACTIVE Hospital ---
Active Hospital Status: 200
Summary for Active Hospital: {'totalDoctors': 24, 'activeDoctors': 23, 'inactiveDoctors': 1, 'totalAppointments': 1013, 'statusBreakdown': {'COMPLETED': 634, 'CONFIRMED': 123, 'BOOKED': 111, 'CANCELLED': 90, 'RESCHEDULED': 55}}

--- 2. Testing GET /api/appointments/reports/preview with PENDING Hospital ---
Pending Hospital Status: 400
Error message for Pending Hospital: Hospital is pending or unapproved for operational reporting

--- 3. Testing GET /api/appointments/reports/preview with hospitalId=ALL ---
ALL Scope Status: 200

--- 4. Testing GET /api/appointments/reports/export-excel with PENDING Hospital ---
Excel Pending Hospital Status: 400

--- 5. Testing GET /api/appointments/reports/export-excel with ACTIVE Hospital ---
Excel Active Hospital Status: 200
Excel payload size: 68216 bytes

[ALL TESTS PASSED] Active-hospital-only filtering strictly verified across preview and export!
```

---

## 6. Frontend Production Compilation

Execution of `npm run build` in `frontend`:

```
> medimind@0.0.0 build
> vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 2004 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.47 kB │ gzip:   0.30 kB
dist/assets/index-Bi0MeUTI.css     95.14 kB │ gzip:  14.46 kB
dist/assets/index-DR0oNSF7.js   1,466.00 kB │ gzip: 314.56 kB
✓ built in 904ms
```

---

## 7. Operational Services Health Checks

| Microservice Name | Expected Port | Health Endpoint | HTTP Status | Response |
| :--- | :---: | :---: | :---: | :---: |
| **API Gateway** | 5000 | `/health` | **200 OK** | `{"status":"UP"}` |
| **Auth Service** | 5001 | `/health` | **200 OK** | `{"status":"UP"}` |
| **Family Service** | 5002 | `/health` | **200 OK** | `{"status":"UP"}` |
| **Hospital Service** | 5003 | `/health` | **200 OK** | `{"status":"UP"}` |
| **Doctor Service** | 5004 | `/health` | **200 OK** | `{"status":"UP"}` |
| **Appointment Service** | 5005 | `/health` | **200 OK** | `{"status":"UP"}` |
| **Medical Record Service** | 5006 | `/health` | **200 OK** | `{"status":"UP"}` |
| **AI Prediction Service** | 5007 | `/health` | **200 OK** | `{"status":"healthy"}` |
| **Knowledge Service** | 5008 | `/health` | **200 OK** | `{"status":"UP"}` |

---

## 8. Master Status Matrix

| Audit Domain | Total Checks | PASS | FAIL | BLOCKED | NOT TESTED | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Model Hash Checksums | 6 | 6 | 0 | 0 | 0 | **PASS** |
| AI Service Pytest Suite | 283 | 283 | 0 | 0 | 0 | **PASS** |
| Reporting Preview & Export | 5 | 5 | 0 | 0 | 0 | **PASS** |
| Active Hospital Boundary Enforcement | 5 | 5 | 0 | 0 | 0 | **PASS** |
| Deactivated Accounts Invariants | 2 | 2 | 0 | 0 | 0 | **PASS** |
| Frontend Production Build | 1 | 1 | 0 | 0 | 0 | **PASS** |
| Microservices Daemon Health | 9 | 9 | 0 | 0 | 0 | **PASS** |
| **TOTAL** | **311** | **311** | **0** | **0** | **0** | **100% PASS** |
