# MediMind — Appointments & Clinical Utilization Hospital-Wise Excel Report Audit

**Date:** 2026-10-23  
**Target Branch:** `experiment8-multiview-localized-fusion`  
**Service:** `appointment-service` (`reportExportService.js`)

---

## 1. Architectural Transformation & Governance Objective

Prior report exports generated a flat, global `Department Breakdown` worksheet that lumped clinical departments across all network hospitals together without facility attribution. To provide executive and operational visibility into individual hospital operational health, the report export engine in [`backend/appointment-service/src/services/reportExportService.js`](file:///d:/projects/MediMind/backend/appointment-service/src/services/reportExportService.js) was re-architected to generate structured, hospital-oriented workbooks.

---

## 2. Multi-Sheet Workbook Specification

The `Appointments & Clinical Utilization Report` (.xlsx) now strictly generates 6 distinct, professionally formatted worksheets:

| Sheet # | Worksheet Title | Scope / Content | Dimensions Verified |
| :---: | :--- | :--- | :--- |
| **1** | `Clinical Utilization Summary` | Network-wide executive summary (total encounters, completed consultations, walk-in consultations, scheduled, confirmed, cancelled, rescheduled, network completion rate). | 9 rows, 3 cols |
| **2** | `Hospital Overview` | Comparative operational table across all active hospitals: Facility Name, Code, Location, Total Departments, Total Appointments, Completed, Scheduled, Cancelled, and Completion Rate (%). | 4 rows, 10 cols |
| **3** | `Aarogyam Multispeciality Hospit` | Dedicated department-by-department utilization breakdown for Aarogyam Multispeciality Hospital, including department IDs, specializations, volumes, completed, cancellations, completion rate, and facility total summary row. | 5 rows, 8 cols |
| **4** | `Nexora Advanced Care Hospital` | Dedicated department utilization sheet for Nexora Advanced Care Hospital with departmental KPIs and total summary row. | 6 rows, 8 cols |
| **5** | `Harborview Medical Centre` | Dedicated department utilization sheet for Harborview Medical Centre with departmental KPIs and total summary row. | 8 rows, 8 cols |
| **6** | `Appointments Ledger` | Full encounter-level ledger including **Booking Creation Date (`created_at`)** alongside **Scheduled Date & Time (`appointment_date`)**, attending doctor, department, facility, mode, and reason. | 3,768 rows, 10 cols |

---

## 3. Strict Facility Eligibility & Pending Facility Exclusion

The network contains 5 facilities in `medimind_hospital.hospitals`:
1. `Aarogyam Multispeciality Hospital` (`ACTIVE`) — **INCLUDED**
2. `Nexora Advanced Care Hospital` (`ACTIVE`) — **INCLUDED**
3. `Harborview Medical Centre` (`ACTIVE`) — **INCLUDED**
4. `Sunrise Institute of Medical Sciences` (`PENDING`, `MM-BLR-04`) — **STRICTLY EXCLUDED**
5. `Western LifeCare Hospital` (`PENDING`, `MM-PUN-05`) — **STRICTLY EXCLUDED**

### Implementation Safeguards:
- In `appointmentService.js` (`_buildReportFilter`), platform-wide scope explicitly queries `{ status: { $regex: '^active$', $options: 'i' } }`.
- In `reportExportService.js`, `targetHospitals` strictly filters against active approved facilities. Unapproved/expansion facilities never receive operational worksheets or contaminate clinical completion percentages.

---

## 4. Verification Evidence (openpyxl Automated Audit)

Execution of [`scripts/test_all_report_exports.py`](file:///d:/projects/MediMind/scripts/test_all_report_exports.py) verified all 5 report categories end-to-end:
```text
=== TESTING EXCEL EXPORT & PREVIEW FOR ALL 5 REPORT TYPES ===

--- Testing Report Type: appointment ---
  [PASS] Preview 200 OK (1.05s) - Title: Appointments & Clinical Utilization Report
         Summary: {'totalAppointments': 3767, 'completedConsultations': 2355, 'scheduledAppointments': 3619, 'walkInConsultations': 148, 'statusBreakdown': {'COMPLETED': 2355, 'CONFIRMED': 435, 'BOOKED': 425, 'CANCELLED': 366, 'RESCHEDULED': 186}, 'completionRate': '62.5%'}
  [PASS] Excel Export 200 OK (19.94s) - Payload: 195085 bytes
         Sheets (6): ['Clinical Utilization Summary', 'Hospital Overview', 'Aarogyam Multispeciality Hospit', 'Nexora Advanced Care Hospital', 'Harborview Medical Centre', 'Appointments Ledger']
           - 'Clinical Utilization Summary': 9 rows, 3 cols
           - 'Hospital Overview': 4 rows, 10 cols
           - 'Aarogyam Multispeciality Hospit': 5 rows, 8 cols
           - 'Nexora Advanced Care Hospital': 6 rows, 8 cols
           - 'Harborview Medical Centre': 8 rows, 8 cols
           - 'Appointments Ledger': 3768 rows, 10 cols

[ALL 5 REPORT TYPES VERIFIED 100% WORKING]
```
