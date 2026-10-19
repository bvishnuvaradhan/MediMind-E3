# MediMind — Stage 2 Diabetes Shadow Governance Approval Matrix

**Document Version:** 1.0.0  
**Effective Date:** October 19, 2026  
**Governance ID:** MM-AI-GOV-2026-DIAB-APPR-05  
**Current Governance Status:** **`BLOCKED_PENDING_APPROVAL`**  
**Runtime Activation Eligibility:** **INELIGIBLE (0 / 5 Approvals Cleared)**  

---

## 1. Governance Policy & Non-Bypass Guarantee

In compliance with the MediMind Clinical AI Governance Framework:
1. Setting `ENABLE_DIABETES_SHADOW_EVAL=true` alone **CANNOT** activate shadow inference.
2. The runtime engine (`ShadowDiabetesService.is_enabled()`) programmatically interrogates the `GovernanceActivationGate`.
3. Activation remains strictly **BLOCKED** until all five mandatory governance domains below are formally marked `APPROVED` by their designated organizational owners.
4. Falsifying signatures, creating mock approvals in production configurations, or bypassing domains is strictly prohibited.

---

## 2. Multi-Disciplinary Approval Matrix

| Domain # | Governance Domain | Designee Role | Required Verification Criteria | Current Status | Designated Approver | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D1** | **Clinical Protocol & Thresholds** | Chief Medical Officer (CMO) | Clinical validation protocol sign-off; confirmation of inclusion/exclusion criteria; predeclared sensitivity/specificity gates; target $N=500$ sample size. | **`PENDING`** | *Awaiting CMO Review* | `MediMind_Diabetes_Shadow_Evaluation_Protocol.md` |
| **D2** | **Privacy & Data Minimization** | Healthcare Privacy Officer | HIPAA de-identification review; validation of keyed HMAC-SHA-256 tokens; confirmation of zero plaintext PHI in shadow logs or telemetry. | **`PENDING`** | *Awaiting Privacy Review* | `MediMind_Shadow_Activation_Readiness_Audit.md` Section 3 |
| **D3** | **Security, Key Mgmt & Escrow** | Security / SRE Lead | Verification of external KMS secret storage for `MEDIMIND_ESCROW_HMAC_SECRET`; secure offline escrow store initialization; audit logging. | **`BLOCKED`** | *Awaiting KMS & Escrow Setup* | `SecureOutcomeEscrowInterface` (Unconfigured) |
| **D4** | **Runtime Deployment & Rollback** | Platform / Deployment Owner | Verification of microservice CPU/memory isolation; non-blocking error boundary; automated circuit breaker; RTO $<2\text{ min}$ rollback. | **`PENDING`** | *Awaiting SRE Sign-off* | `MediMind_Diabetes_Shadow_Operations_Runbook.md` |
| **D5** | **Data Source & Adjudication Access** | Data Governance Owner | Authorization of Laboratory Information System (LIS) outcome feed ($\text{HbA1c} \ge 6.5\%$); confirmation of 90-day adjudication window. | **`PENDING`** | *Awaiting Data Owner Sign-off* | Clinical LIS Integration Agreement |

---

## 3. Detailed Approval Criteria & Outstanding Deliverables

### Domain 1: Clinical Protocol & Thresholds
- **Status:** `PENDING`
- **Owner:** Chief Medical Officer (CMO)
- **Required Action:** Formal clinical review and countersignature of `MediMind_Diabetes_Shadow_Evaluation_Protocol.md`.
- **Key Decision Points:**
  - Confirmation of operating thresholds: Candidate C at $t = 0.4000$ (Sensitivity $87.80\%$) vs Candidate A at $t = 0.4300$ (Sensitivity $85.37\%$).
  - Clinical appropriateness of pediatric ($<18$) and gestational diabetes exclusion rules.
  - Review of 30-day / 500-sample cohort statistical power.

### Domain 2: Privacy & Data Minimization
- **Status:** `PENDING`
- **Owner:** Healthcare Privacy & Compliance Officer
- **Required Action:** Certification of the pseudonymous token architecture.
- **Key Decision Points:**
  - Verification that HMAC-SHA-256 correlation tokens (`corr_<hmac[:16]>`) satisfy HIPAA Expert Determination or Safe Harbor standards.
  - Confirmation that raw clinical features (Glucose, BMI, Blood Pressure) are discarded immediately from memory and never persisted in shadow telemetry.

### Domain 3: Security, Key Management & Escrow
- **Status:** `BLOCKED`
- **Owner:** Security / Site Reliability Engineering (SRE) Lead
- **Blocker Description:** Production key-management infrastructure (AWS KMS, Azure Key Vault, or HashiCorp Vault) is not yet provisioned in this environment. The environment variable `MEDIMIND_ESCROW_HMAC_SECRET` is unset.
- **Remediation Steps:**
  1. Provision a dedicated 256-bit symmetric key in the secure secret manager.
  2. Inject key into container runtime via secure secret injection.
  3. Initialize isolated, encrypted escrow database (`escrow_store/linkage_escrow_records.jsonl`).
  4. Document key rotation schedule (90-day lifecycle) and incident response plan.

### Domain 4: Runtime Deployment & Rollback
- **Status:** `PENDING`
- **Owner:** Platform Architect / Deployment Lead
- **Required Action:** Execution of deployment readiness checks per `MediMind_Diabetes_Shadow_Operations_Runbook.md`.
- **Key Decision Points:**
  - Automated circuit-breaker triggering if shadow candidate latency exceeds $100\text{ ms}$.
  - Verification that primary clinical serving latency ($p99$) is completely decoupled from shadow inference.
  - Validation of one-command emergency rollback ($RTO < 2\text{ minutes}$).

### Domain 5: Data Source & Adjudication Access
- **Status:** `PENDING`
- **Owner:** Clinical Data Governance Lead
- **Required Action:** Formal agreement establishing the automated or manual ingestion channel for confirmatory laboratory outcomes ($\text{HbA1c} \ge 6.5\%$ or fasting glucose $\ge 126\text{ mg/dL}$) within 30–90 days post-screening.

---

## 4. Activation Decision Policy

Once all 5 domains are verified and updated in `artifacts/experiments/shadow_diabetes_eval/governance_activation_matrix.json`, the overall status will transition from `BLOCKED_PENDING_APPROVAL` to `APPROVED`. Until that occurs:
- `ShadowDiabetesService.is_enabled()` returns `False`.
- Primary production inference continues unaffected.
- No live patient data enters shadow pipelines.
