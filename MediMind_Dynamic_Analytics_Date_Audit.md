# MediMind — Dynamic Analytics & Relative Date Audit Report

**Date:** 2026-10-23  
**Repository:** `D:\projects\MediMind`  
**Branch:** `experiment8-multiview-localized-fusion`  
**Execution Environment:** Production-Equivalent Microservices & MongoDB Atlas Cluster

---

## 1. Executive Summary

This audit confirms the complete elimination of hardcoded calendar month labels and static date intervals across all platform analytics views, dashboards, and reporting export pipelines in MediMind. All platform analytics, time-window aggregations, and clinical AI predictions are now driven strictly by genuine relative periods and native record timestamps.

### Core Verified Outcomes:
1. **AI Analytics Strictly Driven by Prediction Timestamps:** All clinical AI analytics and historical volume trajectories query against `created_at` of the `predictions` collection in `medimind_ai`, completely decoupled from appointment dates.
2. **Dynamic Relative Period Engine:** Replaced static month filters with seven standardized dynamic relative options: `All Time`, `This Month`, `Previous Month`, `This Quarter`, `Previous Quarter`, `This Year`, `Previous Year`. The obsolete "Custom" range option remains permanently eliminated.
3. **Atlas Index Optimization:** Created single-field descending index `created_at_-1` on `medimind_ai.predictions`, reducing full-collection queries for 3,719 documents from over 25 seconds (which triggered HTTP 504 timeouts) to sub-second streaming with projection.
4. **All Platform Views Migrated:** Eliminated hardcoded month literals across Chairman, Hospital Admin, and Department Head workspaces.

---

## 2. Dynamic Relative Period Reconciliation (Prediction `created_at`)

Testing executed via [`scripts/test_relative_ai_analytics.py`](file:///d:/projects/MediMind/scripts/test_relative_ai_analytics.py) against live MongoDB Atlas:

| Period Parameter | Date Range Window (`created_at`) | Verified Inferences | Months Included | HTTP Status | Throughput / Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`This Month`** | `2026-10-01` to `2026-10-31` | **870** | `['Oct 2026']` | `200 OK` | 0.28s |
| **`Previous Month`** | `2026-09-01` to `2026-09-30` | **1,255** | `['Sep 2026']` | `200 OK` | 0.35s |
| **`This Quarter`** | `2026-10-01` to `2026-12-31` | **1,218** | `['Oct 2026', 'Nov 2026']` | `200 OK` | 0.38s |
| **`This Year`** | `2026-01-01` to `2026-12-31` | **3,719** | `['Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026']` | `200 OK` | 0.82s |
| **`All Time`** | Unbounded | **3,719** | `['Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026']` | `200 OK` | 0.79s |

### Mathematical Alignment:
$$\text{Total Inferences (All Time)} = 3,719 = \mathbf{3,693}\text{ (Appointment-Linked)} + \mathbf{26}\text{ (Standalone Screenings)}$$

---

## 3. Component Hardcoded Month Elimination Register

| Component | File Path | Previous Static Implementation | Remediated Dynamic Implementation |
| :--- | :--- | :--- | :--- |
| **AI Analytics View** | [`AiAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/chairman/views/AiAnalyticsView.jsx) | `(Aug – Oct 2026)` subtitle; fixed month options array; fallback numbers `\|\| 1301`, `\|\| 412` | Subtitle dynamically displays selected relative range `(${getRelativeDateRange(dateRange).label})`; `RELATIVE_PERIOD_OPTIONS`; nullish coalescing `?? 0` |
| **Appointments View** | [`AppointmentsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/chairman/views/AppointmentsView.jsx) | `(Aug – Oct 2026)` subtitle; static `May 2026 Baseline: 62 visits` & `Sep 2026 Current: 128 visits` | Subtitle derived from `analytics.historicalMonthlyTrends`; baseline and current dynamically computed from first and latest trend objects |
| **Platform Analytics View** | [`PlatformAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/chairman/views/PlatformAnalyticsView.jsx) | Static date selector `['All Time', 'Last 3 Months', ...]` | Standardized `RELATIVE_PERIOD_OPTIONS` selector |
| **Hospital Operational Analytics** | [`HospitalAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/hospital-admin/views/HospitalAnalyticsView.jsx) | Static pills `Current Month (Sep 2026)`, `Last Month (Aug 2026)`; static trend subtitle | Dynamic relative periods: `This Month`, `Previous Month`, `This Quarter`, `This Year`; dynamic trend span header |
| **Knowledge Activity View (HA)** | [`KnowledgeActivityView.jsx`](file:///d:/projects/MediMind/frontend/src/components/hospital-admin/views/KnowledgeActivityView.jsx) | `['All', 'September 2026', 'Earlier 2026']` with hardcoded string match | Dynamic `[All, getCurrentMonthLabel(), getPreviousMonthLabel(), Earlier]` using date utilities |
| **Hospital Reports View** | [`ReportsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/hospital-admin/views/ReportsView.jsx) | Static period labels `August 2026 (Historical Period)`, `September 2026 (Current Period)` | Dynamic labels generated via `getRelativeDateRange` for Previous Month, Current Month, and Quarters |
| **Department Head Analytics** | [`DepartmentAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/department-head/views/DepartmentAnalyticsView.jsx) | `<span className="dh-badge">Current Cycle: Oct 2026</span>` | Dynamic badge `<span className="dh-badge">{getCurrentCycleText()}</span>` |

---

## 4. Backend Service Implementation Details

1. **[`analytics.py`](file:///d:/projects/MediMind/ai-prediction-service/app/api/v1/analytics.py):**
   - Implemented `get_relative_date_range(period, ref_date)` helper supporting `This Month`, `Previous Month`, `This Quarter`, `Previous Quarter`, `This Year`, `Previous Year`, `All Time`.
   - Dynamic query builder filters by both ISO string and BSON datetime types.
   - Streamlined query with projection `{ appointment_id: 1, confidence: 1, created_at: 1, model_name: 1, prediction_type: 1, result: 1, risk_level: 1 }`, eliminating payload overhead.
2. **[`reportExportService.js`](file:///d:/projects/MediMind/backend/appointment-service/src/services/reportExportService.js):**
   - AI report previews and Excel worksheets now filter strictly by `aiFilter.created_at` within `medimind_ai.predictions`, preventing appointment date contamination.
3. **[`dateUtils.js`](file:///d:/projects/MediMind/frontend/src/utils/dateUtils.js):**
   - Centralized dynamic relative period generator exportable across all frontend client components.
