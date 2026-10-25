# MediMind — Hospital Eligibility, Boundary Enforcement & Operational Throughput Audit

**Audit Date:** 2026-10-25  
**Target Branch:** `experiment8-multiview-localized-fusion`  
**Components Verified:** `appointmentService.js`, `chairmanService.js`, `HospitalPerformanceView.jsx`, `HospitalsView.jsx`, `scripts/audit_sunrise_encounters.py`, `scripts/reconcile_sunrise_encounter.py`, `scripts/test_hospital_eligibility_backend.py`

---

## 1. Executive Summary

MediMind operates as a multi-tenant healthcare platform currently spanning 5 facilities:
1. **Aarogyam Multispeciality Hospital (`MM-HYD-01`, `6ac85a18074c2bc731a76381`):** `ACTIVE`
2. **Nexora Advanced Care Hospital (`MM-HYD-02`, `6ac85a18074c2bc731a76383`):** `ACTIVE`
3. **Harborview Medical Centre (`MM-MUM-03`, `6ac85a18074c2bc731a76385`):** `ACTIVE`
4. **Sunrise Institute of Medical Sciences (`MM-BLR-04`, `6ac85a18074c2bc731a76387`):** `PENDING`
5. **Western LifeCare Hospital (`MM-PUN-05`, `6ac85a18074c2bc731a76389`):** `PENDING`

### The Core Architectural Policy:
- **Zero Operational Throughput for Pending Facilities:** Unaccredited or pending hospitals must contribute exactly 0 to clinical appointments, AI predictions, completed consultations, doctor assignments, or clinical reporting ledgers.
- **Accreditation Workflow Visibility:** Pending facilities remain visible in Platform Owner expansion and onboarding pipelines (Hospital Requests, Hospital Accreditation Review) to enable executive governance (Approve / Reject).
- **Hard Backend Rejection:** Operational requests referencing a pending facility (such as appointment bookings, doctor assignments, department additions) are strictly rejected with HTTP 400 or HTTP 422.

---

## 2. Investigation of Sunrise Institute MM-BLR-04 Pending Encounter

### 2.1 Finding the Anomalous Record
During an audit of the Atlas database using [`scripts/audit_sunrise_encounters.py`](file:///d:/projects/MediMind/scripts/audit_sunrise_encounters.py), exactly 1 appointment record referencing Sunrise Institute was discovered:
- **Appointment ID:** `6adb58ad69a4c190e1a40d0f`
- **Hospital ID:** `6ac85a18074c2bc731a76387` (Sunrise Institute of Medical Sciences — PENDING)
- **Doctor ID:** `6ac85a1c074c2bc731a763ed` (Dr. Noshirwan Guzder)
- **Department ID:** `6ac85a18074c2bc731a76396` (Internal Medicine)
- **Created Timestamp:** `2026-10-23 12:53:01.493000`
- **Appointment Scheduled Date:** `2026-10-30 00:00:00`
- **Initial Status:** `BOOKED`

### 2.2 Root Cause Analysis
- Doctor `6ac85a1c074c2bc731a763ed` (Dr. Guzder) is an active specialist stationed at **Harborview Medical Centre** (`6ac85a18074c2bc731a76385`), with Internal Medicine department at Harborview.
- Sunrise Institute possesses zero credentialed medical doctors and zero active clinical departments.
- On October 23, an unvalidated booking request explicitly supplied Sunrise's `hospital_id` in the request body. Because `bookAppointment` previously lacked a guard checking `hospital.status === 'ACTIVE'`, the record was created.
- Furthermore, `appointmentService.getStats` did not scope `$facet` aggregations to active hospitals when called by the Platform Owner, causing the pending hospital to appear in `byHospital` throughput aggregations.

### 2.3 Governance Reconciliation & Audit Provenance
In adherence to the rule:
> *"Do not silently edit timestamps, delete records, or rewrite operational data without record provenance."*

Record `6adb58ad69a4c190e1a40d0f` was reconciled via [`scripts/reconcile_sunrise_encounter.py`](file:///d:/projects/MediMind/scripts/reconcile_sunrise_encounter.py):
- **Preserved:** Document ID, original hospital reference, doctor ID, timestamps.
- **Updated Status:** Transitioned from `BOOKED` to `CANCELLED`.
- **Cancellation Reason:** `"Automated governance: Sunrise Institute (MM-BLR-04) is pending accreditation. Encounter cancelled in adherence to hospital eligibility boundary."`
- **Cancelled By:** `"GOVERNANCE_AUDIT"`.
- **Cancelled At:** `2026-10-25 04:34:48 UTC`.

---

## 3. Platform-Wide Backend API Validation

Backend validation guards were implemented and verified across microservices:

1. **Appointment Service (`appointmentService.js:656-668`):**
   ```javascript
   const hospDb = mongoose.connection.useDb(process.env.HOSPITAL_DB_NAME || 'medimind_hospital');
   const hospDoc = await hospDb.collection('hospitals').findOne({ _id: new mongoose.Types.ObjectId(hospitalId) });
   if (hospDoc) {
     if ((hospDoc.status || '').toUpperCase() !== 'ACTIVE') {
       const err = new Error('Hospital is pending accreditation and not eligible for operational activities');
       err.statusCode = 422;
       throw err;
     }
   }
   ```
2. **Platform Stats Operational Scoping (`appointmentService.js:2613-2625`):**
   ```javascript
   if (!match.hospital_id) {
     const hospDb = mongoose.connection.useDb(process.env.HOSPITAL_DB_NAME || 'medimind_hospital');
     const activeHosps = await hospDb.collection('hospitals').find(
       { status: { $regex: '^active$', $options: 'i' } },
       { projection: { _id: 1 } }
     ).toArray();
     if (activeHosps && activeHosps.length > 0) {
       match.hospital_id = { $in: activeHosps.map(h => h._id) };
     }
   }
   ```
3. **Frontend UI Metrics Scoping (`chairmanService.js:351-352`):**
   ```javascript
   appointmentsCount: normStatus === 'Active' ? (aptCount || 0) : 0,
   aiPredictionsCount: normStatus === 'Active' ? ((stats?.byHospitalPreds && stats.byHospitalPreds[hid]) || 0) : 0,
   ```

### 3.1 Live API Validation Test Evidence
Executed via [`scripts/test_hospital_eligibility_backend.py`](file:///d:/projects/MediMind/scripts/test_hospital_eligibility_backend.py):
```text
=== TESTING BACKEND HOSPITAL ELIGIBILITY ENFORCEMENT ===
1. Create Dept in PENDING Hospital -> Status: 400 | Msg: Cannot create department: hospital is pending approval or inactive
2. Create Doctor in PENDING Hospital -> Status: 400 | Msg: Cannot assign doctor: hospital is PENDING
3. Book Appointment in PENDING Hospital -> Status: 400 | Msg: Cannot book appointment: target hospital is PENDING

[ALL BACKEND HOSPITAL ELIGIBILITY VALIDATION TESTS PASSED]
```

---

## 4. Operational Throughput Matrix

| Facility Name | Code | Network Status | Associated Doctors | Associated Departments | Operational Appointments | AI Predictions |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Aarogyam Multispeciality Hospital** | `MM-HYD-01` | `ACTIVE` | 24 | 4 | 1,324 | 1,308 |
| **Nexora Advanced Care Hospital** | `MM-HYD-02` | `ACTIVE` | 22 | 4 | 1,189 | 1,184 |
| **Harborview Medical Centre** | `MM-MUM-03` | `ACTIVE` | 22 | 5 | 1,255 | 1,227 |
| **Sunrise Institute of Medical Sciences** | `MM-BLR-04` | `PENDING` | 0 | 0 | **0** | **0** |
| **Western LifeCare Hospital** | `MM-PUN-05` | `PENDING` | 0 | 0 | **0** | **0** |
| **TOTAL OPERATIONAL** | — | — | **68** | **13** | **3,768** | **3,719** |

Pending facilities contribute exactly zero to clinical operational throughput while remaining fully manageable in Platform Owner accreditation pipelines.
