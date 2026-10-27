# MediMind — Historical Trend Integrity, Staggered Hospital Onboarding & Monotonic Demo Booking Growth Fix Audit Report

**Branch:** `experiment8-multiview-localized-fusion`  
**Commit Target:** `feat(analytics): enforce staggered hospital onboarding, monotonic demo booking growth, and discontinuous line rendering`  
**Verification Date:** October 27, 2026  
**Auditor:** Antigravity Autonomous Agent  

---

## Executive Summary

This comprehensive audit and remediation addressed critical defects in historical monthly operational trends across the Platform Owner (`HospitalPerformanceView.jsx`) and Hospital Admin (`HospitalAnalyticsView.jsx`) workspaces:

1. **Elimination of Non-Monotonic Demo Booking Intake Decreases:** Reconciled historical intake booking records (`created_at`) from each hospital's respective onboarding month through October 2026, establishing a strictly increasing, operationally realistic trajectory with zero monthly drops.
2. **Strict Enforcement of Demonstration Hospital Onboarding Timeline:**
   - **Harborview Medical Centre:** Onboarded **March 2026** (first reporting month `2026-03`). Zero records prior to March 2026.
   - **Aarogyam Multispeciality Hospital:** Onboarded **May 2026** (first reporting month `2026-05`). Zero demo records prior to May 2026.
   - **Nexora Advanced Care Hospital:** Onboarded **July 2026** (first reporting month `2026-07`). Zero demo records prior to July 2026.
3. **Discontinuous SVG Line Rendering (`LineChart.jsx`):** Pre-onboarding months are treated as unavailable (`null`), not zero (`0`). Subpath segmenting breaks SVG line paths cleanly, suppresses misleading zero dots, and renders transparent tooltips indicating `Unavailable` rather than fabricated zero metrics.
4. **Three Independent Operational Metrics:** Intake Bookings (grouped by booking creation timestamp `created_at`), Appointments Served (grouped by completed encounter date `appointment_date`), and Clinical AI Runs (grouped by inference execution timestamp, unique inferences, preserving standalone NLP screenings) remain completely uncoupled.
5. **Strict Enforcement of Operational Thresholds:** Combined cancellations across all 8 reporting months strictly honor defined caps: Harborview = 89 ($\le 100$), Aarogyam = 72 ($\le 100$), Nexora = 65 ($\le 100$), Network Total = 226 ($\le 300$). Slot uniqueness is 100% collision-free. All 460 future bookings remain untouched in `CONFIRMED` or `BOOKED` status.

---

## 1. Actual Root Cause Analysis

### 1.1 Declining Monthly Booking Line
- **Database Distribution Defect:** In earlier database seeds, appointments were populated heavily in early spring (March–June), but July had only 161 total bookings, August spiked to 1,303, September dipped to 1,294 (a non-monotonic drop), and October dropped to 1,009.
- **Aggregation Metric Misalignment:** In `backend/appointment-service/src/services/appointmentService.js`, the `byMonth` aggregation originally grouped by `appointment_date` (the clinical encounter date) rather than `created_at` (the booking intake date). Because future scheduled appointments spread across upcoming weeks while historical intake reflects when patients actually booked, grouping by encounter date caused apparent declines in current and future months.
- **Top-Level Aggregation Pipeline Date Filtering:** In `appointmentService.js`, setting `match.$or = [ { appointment_date: dateFilter }, { created_at: dateFilter } ]` on the top-level `$match` stage of `Appointment.aggregate` inadvertently constrained the multi-month retrospective trend facets (`byHospitalMonthlyIntake`, `byHospitalMonthlyCompleted`, `byHospitalMonthlyPreds`) whenever single-month filters (e.g. `This Month`) were passed by Hospital Admin. This truncated retrospective trends to a single month (`Oct 2026`).

### 1.2 Pre-Onboarding Line Rendering (Zero-Dots & Flat Baseline)
- **Frontend Missing Value Defaulting:** In `frontend/src/services/chairmanService.js`, when mapping multi-month trends across hospitals, missing data points for hospitals prior to their onboarding date defaulted to numeric `0`.
- **Pure-SVG Path Generation Inadequacy:** In `frontend/src/components/common/charts/LineChart.jsx`, the path generator drew a single continuous SVG line `d="M ... L ... L ..."` from index 0 across all months. Any `0` or coerced `null` was plotted on the horizontal axis (`y = 0`) with circle dots (`<circle cx="..." cy="height">`), falsely implying that Aarogyam and Nexora were active facilities with 0 bookings in March and April.

---

## 2. Files Changed and Remediation Rationale

| File | Type | Changes & Architectural Rationale |
|---|---|---|
| [`backend/appointment-service/src/services/appointmentService.js`](file:///d:/projects/MediMind/backend/appointment-service/src/services/appointmentService.js) | Backend Service | • Removed top-level `match.$or` date filtering to allow retrospective multi-month trend facets to aggregate historical data across reporting periods.<br>• Uncoupled `byHospitalMonthlyIntake`, `byHospitalMonthlyCompleted`, and `byHospitalMonthlyPreds` from single-period boundaries.<br>• Fixed variable initialization order to eliminate TDZ `ReferenceError`.<br>• Filtered distinct months by `targetHospId` so single-hospital views anchor on their genuine onboarding month. |
| [`frontend/src/components/common/charts/LineChart.jsx`](file:///d:/projects/MediMind/frontend/src/components/common/charts/LineChart.jsx) | UI Component | • Implemented discontinuous SVG path generation (`getSeriesSegments`).<br>• `null` and `undefined` values break the SVG line path instead of plotting to `y = 0`.<br>• Segmented area fills to avoid bleeding under inactive intervals.<br>• Suppressed `<circle>` points for `null` values.<br>• Rendered tooltip text as muted italic `Unavailable` for missing pre-onboarding points. |
| [`frontend/src/services/chairmanService.js`](file:///d:/projects/MediMind/frontend/src/services/chairmanService.js) | Frontend Service | • Added `getOnboardingMonth` mapping: Harborview (`2026-03`), Aarogyam (`2026-05`), Nexora (`2026-07`).<br>• Assigned `null` (not numeric `0`) to pre-onboarding months in intake, completed, and AI trend matrices.<br>• Ensured `All Time` and `This Year` generate full continuous months from `2026-03` to `currentMonthKey`. |
| [`frontend/src/components/hospital-admin/views/HospitalAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/hospital-admin/views/HospitalAnalyticsView.jsx) | UI View | • Replaced static fallback `'March 2026'` with dynamic `defaultStartMonth` aware of hospital facility name (`May 2026` for Aarogyam, `July 2026` for Nexora).<br>• Dynamically formatted trend span header: `Historical Monthly Operational Volume Trends ({trendStartMonth} – {trendEndMonth})`. |
| [`frontend/e2e/test_historical_trends_integrity.mjs`](file:///d:/projects/MediMind/frontend/e2e/test_historical_trends_integrity.mjs) | E2E Test | • End-to-end automated verification script validating authoritative backend stats, monotonic growth, cancellation caps, pre-onboarding boundaries, SVG circle counts (18 circles), and tooltip Unavailable badges. |
| [`frontend/e2e/test_consultation_followup_workflow.mjs`](file:///d:/projects/MediMind/frontend/e2e/test_consultation_followup_workflow.mjs) | E2E Test | • Switched to "All Appointments" tab and stabilized toast locator timeout for asynchronous cross-service encounter completion. |

---

## 3. Verified Authoritative Monthly Booking Intake Trajectory

### 3.1 Facility-Level Intake Counts (`created_at` Calendar Month)

```
Harborview Medical Centre (Onboarded March 2026)
  2026-03: 160 bookings  (Initial Onboarding Month)
  2026-04: 215 bookings  (+55,  +34.4% growth)
  2026-05: 278 bookings  (+63,  +29.3% growth)
  2026-06: 324 bookings  (+46,  +16.5% growth)
  2026-07: 385 bookings  (+61,  +18.8% growth)
  2026-08: 436 bookings  (+51,  +13.2% growth)
  2026-09: 472 bookings  (+36,  +8.3% growth)
  2026-10: 505 bookings  (+33,  +7.0% growth)
  Trajectory: Strictly Monotonic (160 < 215 < 278 < 324 < 385 < 436 < 472 < 505)

Aarogyam Multispeciality Hospital (Onboarded May 2026)
  2026-03: Unavailable (Pre-onboarding)
  2026-04: Unavailable (Pre-onboarding)
  2026-05: 130 bookings  (Initial Onboarding Month)
  2026-06: 165 bookings  (+35,  +26.9% growth)
  2026-07: 205 bookings  (+40,  +24.2% growth)
  2026-08: 245 bookings  (+40,  +19.5% growth)
  2026-09: 278 bookings  (+33,  +13.5% growth)
  2026-10: 295 bookings  (+17,  +6.1% growth)
  Trajectory: Strictly Monotonic (130 < 165 < 205 < 245 < 278 < 295)

Nexora Advanced Care Hospital (Onboarded July 2026)
  2026-03: Unavailable (Pre-onboarding)
  2026-04: Unavailable (Pre-onboarding)
  2026-05: Unavailable (Pre-onboarding)
  2026-06: Unavailable (Pre-onboarding)
  2026-07: 160 bookings  (Initial Onboarding Month)
  2026-08: 220 bookings  (+60,  +37.5% growth)
  2026-09: 265 bookings  (+45,  +20.5% growth)
  2026-10: 289 bookings  (+24,  +9.1% growth)
  Trajectory: Strictly Monotonic (160 < 220 < 265 < 289)
```

### 3.2 Network-Wide Monthly Booking Growth

| Calendar Month | Harborview | Aarogyam | Nexora | Sunrise (Pending) | Network Total | Monotonic Delta | Growth Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **March 2026** | 160 | *Unavailable* | *Unavailable* | 0 | **160** | Baseline | Onboarding Launch |
| **April 2026** | 215 | *Unavailable* | *Unavailable* | 0 | **215** | +55 | PASS (+34.4%) |
| **May 2026** | 278 | 130 | *Unavailable* | 0 | **408** | +193 | PASS (+89.8%) |
| **June 2026** | 324 | 165 | *Unavailable* | 0 | **489** | +81 | PASS (+19.9%) |
| **July 2026** | 385 | 205 | 160 | 0 | **750** | +261 | PASS (+53.4%) |
| **August 2026** | 436 | 245 | 220 | 0 | **901** | +151 | PASS (+20.1%) |
| **September 2026** | 472 | 278 | 265 | 0 | **1,015** | +114 | PASS (+12.7%) |
| **October 2026** | 505 | 295 | 289 | 1 | **1,090** | +75 | PASS (+7.4%) |

---

## 4. Operational Guardrails & Threshold Verification

| Verification Criterion | Expected Constraint | Audited Result | Verification Status |
|---|---|---|---|
| **Harborview Total Cancellations** | $\le 100$ | **89** | PASS |
| **Aarogyam Total Cancellations** | $\le 100$ | **72** | PASS |
| **Nexora Total Cancellations** | $\le 100$ | **65** | PASS |
| **Sunrise Total Cancellations** | $\le 10$ | **1** | PASS |
| **Network Total Cancellations** | $\le 300$ | **227** | PASS |
| **Future Bookings Preserved** | $\ge 400$ on or after `2026-10-26` | **460** in `CONFIRMED`/`BOOKED` status | PASS |
| **Slot Schedule Collisions** | 0 duplicate slots per doctor/date/time | **0 collisions** (100% unique slots) | PASS |
| **Pure-SVG Graph Circles** | Exactly 18 circles (8 + 6 + 4) | **18 circles rendered** | PASS |
| **Pre-Onboarding Tooltip Value** | Display `Unavailable` | **"Unavailable" in italic muted style** | PASS |
| **Aarogyam Retrospective Header** | Anchor at `May 2026` | **"May 2026 – Oct 2026"** | PASS |

---

## 5. Automated Test & Build Evidence

All end-to-end and unit test suites were executed against the live platform:

1. **`frontend/e2e/test_historical_trends_integrity.mjs`:**
   - Authoritative stats validation: PASS
   - Pre-onboarding zero-activity boundary check: PASS
   - Strictly monotonic trajectory check (each hospital + network): PASS
   - Cancellation caps verification: PASS
   - Pure-SVG Intake Bookings 18 circle check: PASS
   - Hover tooltip `Unavailable` marker check: PASS
   - Aarogyam Hospital Admin `May 2026 – Oct 2026` header check: PASS
2. **`frontend/e2e/test_hospital_performance_and_analytics_reconciliation.mjs`:**
   - 15/15 steps PASS (Date range options, Table 1 five columns, Table 2 seven columns, Three monthly trend line charts, AI Analytics attribution, Hospital Admin 5 KPI cards, removal of bed/satisfaction sections).
3. **`backend/scripts/test_date_ranges.mjs`:**
   - 18/18 date range and calendar quarter boundary unit tests PASS.
4. **`frontend/e2e/test_doctor_workspace_remediation.mjs`:**
   - Full clinician workspace verification PASS.
5. **`frontend/e2e/test_universal_pagination_and_audit.mjs`:**
   - 18/18 pagination checks across all 5 workspace roles PASS.
6. **`frontend/e2e/test_consultation_followup_workflow.mjs`:**
   - Gated encounter completion, consultation classification, and prescription linkage PASS.
7. **Production Frontend Build:**
   - `npm --prefix frontend run build` completed with zero errors (`built in 686ms`).

---

## 6. Commit Summary

- **Branch:** `experiment8-multiview-localized-fusion`
- **Files Staged for Commit:**
  - `backend/appointment-service/src/services/appointmentService.js`
  - `frontend/src/components/common/charts/LineChart.jsx`
  - `frontend/src/services/chairmanService.js`
  - `frontend/src/components/hospital-admin/views/HospitalAnalyticsView.jsx`
  - `frontend/e2e/test_historical_trends_integrity.mjs`
  - `frontend/e2e/test_consultation_followup_workflow.mjs`
  - `MediMind_Historical_Trend_Integrity_and_Staggered_Hospital_Onboarding_Audit.md`
- **Remote Push:** Not executed (reserved for explicit authorization).
