# MediMind — Stage 2 Diabetes Shadow Governance Checklist

**Document Version:** 1.0.0  
**Effective Date:** October 19, 2026  
**Governance Scope:** Clinical AI Safety, Regulatory Compliance, Data Privacy & Deployment Authorization  
**Checklist ID:** MM-GOV-CHK-2026-DIAB-SHADOW-04  
**Target Repository:** `D:\projects\MediMind`  

---

## 1. Governance Objectives & Policy Mandate

Before any machine-learning model candidate can be promoted to production serving within MediMind, it must undergo prospective clinical validation under strict governance oversight. This checklist defines the mandatory gates, multi-disciplinary sign-off criteria, and operational verification items required for:
1. **Phase 1: Shadow Activation Authorization** (Authorizing `ENABLE_DIABETES_SHADOW_EVAL=true`).
2. **Phase 2: Prospective Monitoring Oversight** (30-day non-interfering shadow tracking).
3. **Phase 3: Post-Adjudication Promotion Review** (Formal model promotion decision).

---

## 2. Phase 1: Pre-Activation Safety & Compliance Gates

All Phase 1 gates must be verified and certified prior to enabling the shadow flag in any live environment.

| Gate # | Governance Domain | Verification Requirement | Current Status | Evidence / Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **G1.1** | **Production Isolation** | Primary serving path (`diabetes_service.py`) and frozen model (`artifacts/diabetes/best_model.joblib`) must be 100% immutable and cryptographically verified. | **PASSED** | SHA-256 hash verified: `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` |
| **G1.2** | **Error Boundary** | Shadow evaluation execution must be wrapped in non-blocking try/except blocks; zero exceptions may propagate to the client or primary prediction route. | **PASSED** | Automated unit test verified: `test_shadow_service_handles_candidate_failure_gracefully` |
| **G1.3** | **Data Minimization (HIPAA)** | No patient names, MRNs, email addresses, or raw clinical measurements may be persisted in shadow logs or accounting ledgers. | **PASSED** | Pseudonymous SHA-256 tokens (`corr_<sha256>`) used; verified in `test_shadow_diabetes_service.py` |
| **G1.4** | **Scope Authorization** | Cohort filter must reject pediatrics ($<18$), gestational/pregnancy screenings, and acute inpatient encounters from shadow evaluation. | **PASSED** | Tested in `test_shadow_service_records_unauthorized_scope_exclusion` |
| **G1.5** | **Predeclared Evaluation Gates** | Clinical sensitivity, specificity, ECE, and latency thresholds must be predeclared in writing prior to evaluation initiation. | **PASSED** | Predeclared in `MediMind_Diabetes_Shadow_Evaluation_Protocol.md` Section 5 |
| **G1.6** | **Emergency Rollback** | Operations runbook must specify an immediate kill-switch procedure with RTO $< 2\text{ minutes}$. | **PASSED** | Documented in `MediMind_Diabetes_Shadow_Operations_Runbook.md` Section 4 |
| **G1.7** | **Regression Safety** | Full test suite across Heart Disease and Diabetes must pass with zero failures or deprecation regressions. | **PASSED** | Automated test suite: 55/55 passed (100.0%) |

---

## 3. Pre-Activation Sign-Off Matrix

Activation of `ENABLE_DIABETES_SHADOW_EVAL=true` requires all four formal signatures:

| Role | Designee Name | Responsibility | Status | Signature / Date |
| :--- | :--- | :--- | :--- | :--- |
| **AI Lead Engineer** | Lead ML Systems Engineer | Verifies model hashes, pipeline encapsulation, non-blocking error boundaries, and unit tests. | **CERTIFIED** | *Signed (Technical Sign-Off)* / 2026-10-19 |
| **Lead Platform Architect** | Principal SRE / Architect | Verifies microservice performance isolation, memory bounds, circuit breakers, and logging storage. | **PENDING** | *Awaiting SRE Review* |
| **Compliance & Privacy Officer** | Healthcare Privacy Officer | Verifies HIPAA de-identification, SHA-256 pseudonymization, absence of raw PHI in logs. | **PENDING** | *Awaiting Privacy Review* |
| **Chief Medical Officer (CMO)** | Platform Chief Medical Officer | Verifies clinical inclusion/exclusion criteria, safety boundaries, and prospective evaluation protocol. | **PENDING** | *Awaiting Clinical Review* |

---

## 4. Phase 2: Prospective 30-Day Monitoring Cadence

During the prospective shadow evaluation period, weekly audits must be conducted:

- [ ] **Day 7 Interim Review:**
  - Verify minimum 70 eligible requests recorded.
  - Confirm `failed_requests == 0`.
  - Confirm p95 inference latency $\le 50\text{ ms}$.
- [ ] **Day 14 Mid-Point Review:**
  - Verify minimum 140 eligible requests recorded.
  - Audit drift detection on input distributions (Glucose, BMI).
  - Verify zero memory leakage in container metrics.
- [ ] **Day 21 Subgroup Review:**
  - Verify demographic representation across age subgroups ($<50$ vs $\ge 50$).
  - Confirm subgroup disparity ratio $\ge 0.80$.
- [ ] **Day 30 Cohort Closure:**
  - Verify target $N \ge 500$ eligible requests achieved.
  - Freeze shadow evaluation ledger and initiate 90-day clinical outcome adjudication window.

---

## 5. Phase 3: Post-Adjudication Promotion Criteria

A candidate model may **ONLY** be promoted to production if all the following conditions are simultaneously met:

1. **Cohort Completeness:** Minimum 500 adjudicated patient outcomes recorded in `shadow_accounting_ledger.json`.
2. **Predeclared Gates Achieved:**
   - Sensitivity $\ge 0.75$ (Candidate C) or $\ge 0.70$ (Candidate A).
   - Specificity $\ge 0.70$ (Candidate C) or $\ge 0.75$ (Candidate A).
   - ECE $\le 0.10$ (Candidate C) or $\le 0.06$ (Candidate A).
   - Zero runtime crashes or unhandled exceptions.
3. **Statistical Superiority or Equivalence:** Candidate demonstrably outperforms current production baseline on prospectively gathered real-world data.
4. **Clinical Governance Committee Approval:** Unanimous sign-off by the MediMind Clinical AI Governance Board.
