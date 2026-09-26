# MediMind End-to-End Business Flow & Lifecycle Matrix

**Audit Date:** 2026-09-26  
**Auditor:** MediMind Systems Engineering  
**Scope:** Complete cross-role workflows, lifecycle state machines, and end-to-end user journeys.

---

## 1. Master Cross-Role Business Flow Matrix

```mermaid
sequenceDiagram
    autonumber
    actor Family as Family Patient (Rohan)
    actor Doctor as Doctor (Dr. Rahul)
    actor DeptHead as Dept Head (Dr. Priya)
    actor HospAdmin as Hosp Admin (Admin)
    actor Chairman as Chairman (Owner)

    Note over Family,Doctor: Clinical Care & Consent Journey
    Family->>Family: 1. Review AI Health Risk & Biomarkers
    Family->>Doctor: 2. Grant RecordAccess Consent
    Family->>Doctor: 3. Book OPD Consultation Slot
    Doctor->>Doctor: 4. View Authorized Patient Chart
    Doctor->>Doctor: 5. Inspect AI Fracture Grad-CAM Heatmap
    Doctor->>Doctor: 6. Draft & Finalize Clinical Note
    Doctor->>Doctor: 7. Formulate & Certify E-Prescription
    Doctor-->>Family: 8. Prescription Appears in Family Portal

    Note over DeptHead,Doctor: Department Coordination
    DeptHead->>Doctor: 9. Monitor Caseload & Rebalance OPD Shift
    DeptHead->>DeptHead: 10. Publish Clinical Fracture Protocol

    Note over HospAdmin,DeptHead: Institutional Administration
    HospAdmin->>DeptHead: 11. Create Department & Assign Head Leadership
    HospAdmin->>HospAdmin: 12. Review Operational Admissions & Bed Occupancy

    Note over Chairman,HospAdmin: Platform Network Governance
    Chairman->>Chairman: 13. Review Pending Hospital Onboarding Application
    Chairman->>HospAdmin: 14. Approve Application -> Onboard Hospital to Network
    Chairman->>Chairman: 15. Inspect 4-Model AI Engine Trajectory
```

---

## 2. Lifecycle State Transition Matrix

| Entity | Initial State | Transition Trigger | Next State | Addendum / Terminal State | Verified |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Clinical Consultation** | `DRAFT` | Doctor signs & completes clinical exam | `FINAL` | `AMENDED` (With clinical addendum) | **PASS** |
| **E-Prescription** | `DRAFT` | Doctor signs medication regimen | `FINAL` | `CORRECTED` (With adjustment log) | **PASS** |
| **RecordAccess Consent** | `ACTIVE` | Patient/Family revokes access | `REVOKED` | `ACTIVE` (Upon re-granting consent) | **PASS** |
| **Hospital Onboarding** | `PENDING` | Chairman reviews credentialing docs | `APPROVED` | Active Network Member | **PASS** |
| **Hospital Onboarding** | `PENDING` | Chairman rejects application | `REJECTED` | Archived with recorded rationale | **PASS** |
| **OPD Appointment** | `SCHEDULED` | Doctor completes consultation | `COMPLETED` | Visit Concluded | **PASS** |
| **OPD Appointment** | `SCHEDULED` | Patient cancels appointment | `CANCELLED` | Slot Released | **PASS** |
| **Staff Doctor Status** | `ACTIVE` | Dept Head toggles leave/sabbatical | `INACTIVE` | Shift reallocated | **PASS** |
| **Clinical Department** | `ACTIVE` | Hosp Admin toggles department status | `INACTIVE` | Ward capacity updated | **PASS** |

---

## 3. Workflow Matrix Verdict: PASS
All 9 lifecycle state transitions and end-to-end multi-role workflows execute cleanly with zero race conditions or state desynchronization.
