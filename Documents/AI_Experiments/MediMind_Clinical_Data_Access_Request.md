# MediMind — Clinical Data Access Request: Laboratory Adjudication Feed

**Document Version:** 1.0.0  
**Target Reviewer:** Clinical Data Governance Lead & Laboratory Information System (LIS) Administrator  
**Governance Scope:** Stage 2 Diabetes Prospective Shadow Evaluation — Ground-Truth Outcome Adjudication  
**Current Approval Status:** **`PENDING DATA OWNER APPROVAL`**  
**Review Target Date:** October 2026  
**Repository:** `D:\projects\MediMind`  

---

## 1. Executive Purpose & Data Governance Request

This data access request seeks formal authorization from the Clinical Data Governance Owner to establish a secure, blinded clinical outcome adjudication channel for the Stage 2 Diabetes Shadow Evaluation.

To evaluate the prospective diagnostic accuracy (Sensitivity, Specificity, PPV, NPV, and ECE) of Candidate C (`appC_mlp_6layer_bottleneck_gelu`) and Candidate A (`appA_extratrees`), predictions gathered during routine screening encounters must be matched against confirmatory laboratory results collected over a 30- to 90-day follow-up window.

---

## 2. Authorized Ground-Truth Diagnostic Criteria

In accordance with American Diabetes Association (ADA) and WHO standards, an encounter is adjudicated as positive for diabetes ($\text{Truth} = 1$) if any of the following occur within 90 days following the index screening:

1. **Glycated Hemoglobin:** $\text{HbA1c} \ge 6.5\%$ ($48\text{ mmol/mol}$).
2. **Fasting Plasma Glucose (FPG):** Confirmed fasting blood glucose $\ge 126\text{ mg/dL}$ ($7.0\text{ mmol/L}$).
3. **Oral Glucose Tolerance Test (OGTT):** 2-hour plasma glucose $\ge 200\text{ mg/dL}$ ($11.1\text{ mmol/L}$).
4. **Physician Formal Diagnosis:** Verified ICD-10 diagnosis code `E11.x` (Type 2 diabetes mellitus) documented by an attending endocrinologist or primary care physician.

An encounter is adjudicated as negative ($\text{Truth} = 0$) if normal laboratory results are confirmed ($\text{HbA1c} < 5.7\%$ and $\text{FPG} < 100\text{ mg/dL}$) with no new diabetes diagnosis.

---

## 3. Adjudication Matching Workflow & Escrow Integration

```
[ LIS Confirmatory Lab Feed ]
              │
              ▼
[ Escrow Linkage Matching (Offline) ]
  - Input: Patient MRN / Family Member ID + Confirmatory Date
  - Matches to Escrow Store: correlation_id
  - Generates Adjudication Payload: [correlation_id, truth_binary, adjudication_date]
              │
              ▼
[ Shadow Service Adjudication Intake ]
  - ShadowDiabetesService.adjudicate_outcome(correlation_id, confirmed_outcome=1)
  - Updates Ledger: pending_adjudication -> adjudicated_positive / negative
```
At no point does the ML engineering team or prediction service receive raw patient MRNs or names.

---

## 4. Handling of Delayed Outcomes & Missing Follow-Up

- **Standard Window:** 30 to 90 calendar days from the index screening encounter.
- **Lost to Follow-up:** If a patient undergoes no confirmatory glycemic lab testing within 90 days, the encounter outcome is marked as:
  $$\text{outcome\_status} = \text{"OUTCOME\_UNAVAILABLE"}$$
- **Denominator Integrity:** Cases with unavailable outcomes are recorded in the accounting ledger but strictly excluded from the denominators of Sensitivity ($TP + FN$) and Specificity ($TN + FP$) to prevent attrition distortion.

---

## 5. Formal Data Governance Sign-Off

| Review Dimension | Decision | Comments / Notes | Sign-off Date |
| :--- | :--- | :--- | :--- |
| **LIS Outcome Ingestion Authorization** | **`PENDING`** | *Awaiting Data Governance review* | Pending |
| **Ground-Truth Clinical Criteria** | **`PENDING`** | *Awaiting ADA/WHO criteria confirmation* | Pending |
| **90-Day Follow-Up & Attrition Rules** | **`PENDING`** | *Awaiting review of denominator exclusion* | Pending |

**Designated Approver:** Clinical Data Governance Lead & LIS System Administrator  
**Signature:** `________________________________________`  
**Date:** `____ / ____ / 2026`
