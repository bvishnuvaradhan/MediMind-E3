# MediMind — Stage 2 Diabetes Shadow Evaluation & Prospective Validation Protocol

**Document Version:** 1.0.0  
**Effective Date:** October 19, 2026  
**Status:** Pre-Evaluation Protocol Specification (Pre-Activation)  
**Governance ID:** MM-AI-GOV-2026-DIAB-SHADOW-01  
**Target Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`

---

## 1. Executive Summary & Objective

The objective of this prospective evaluation protocol is to establish a non-interfering, privacy-preserving shadow evaluation framework for two candidate machine learning models for Type 2 Diabetes risk prediction:
1. **Candidate C:** `appC_mlp_6layer_bottleneck_gelu` (Deep PyTorch MLP with 6-layer bottleneck and GELU activation).
2. **Candidate A:** `appA_extratrees` (Calibrated Extra-Trees ensemble).

These candidates were selected based on the Four-Approach AI Benchmark and Benchmark Integrity Audit. This protocol defines the operational rules, eligibility gates, accounting mechanisms, privacy safeguards, and clinical validation criteria required before any candidate model can be considered for production promotion.

> [!IMPORTANT]
> **Production Safety Invariant:** Production inference continues to be served exclusively by the frozen baseline model (`artifacts/diabetes/best_model.joblib`). The shadow evaluation service operates asynchronously or via an isolated non-blocking error boundary. Shadow predictions are never returned to patients, doctors, or frontend dashboards.

---

## 2. Dual-Candidate Model Specifications

| Parameter | Baseline (Current Production) | Candidate C (Deep MLP) | Candidate A (Extra-Trees) |
| :--- | :--- | :--- | :--- |
| **Model Type** | 3-Layer Scikit-Learn MLP | 6-Layer PyTorch Bottleneck MLP | Calibrated Extra-Trees Ensemble |
| **Artifact Path** | `artifacts/diabetes/best_model.joblib` | `artifacts/experiments/benchmark_four_approaches_20261019/diabetes_appC_mlp_6layer_bottleneck_gelu.joblib` | `artifacts/experiments/benchmark_four_approaches_20261019/diabetes_appA_extratrees.joblib` |
| **SHA-256 Hash** | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` | `26b3a2ae31a19f4a0c84138e6dfd15ee6a17b2b6c7ce1a5401bb26400dbb6be0` | `c0fe202b2de047cb56247fb0dbe422c5e5aa495f2a1b948dc2a046ce59ec47b5` |
| **Preprocessing** | Biological zero imputation missing in pipeline (known production gap) | Encapsulated training median biological-zero imputation + StandardScaler | Encapsulated training median biological-zero imputation + StandardScaler |
| **Operating Threshold** | 0.5000 | 0.4500 (Predeclared clinical threshold) | 0.5000 (Calibrated probability threshold) |
| **Primary Strength** | Established legacy baseline | Superior discriminative power (ROC-AUC 0.8351, Sensitivity 0.8000) | Exceptional calibration (ECE 0.0469, Brier 0.1601) |

---

## 3. Cohort Eligibility & Authorized Scopes

To ensure valid prospective evaluation and patient safety, strict inclusion and exclusion criteria are enforced by the shadow intake engine:

### 3.1 Inclusion Criteria (Eligible Requests)
- Clinical encounter scope: Adult outpatient screening, routine annual physical examination, or general preventive health evaluation.
- Age: Adult patients aged $\ge 18$ years.
- Clinical measurements: Valid numeric records for Glucose, Blood Pressure, Skin Thickness, Insulin, BMI, Diabetes Pedigree Function, and Age within physiological limits.
- Context: Explicit authorized encounter context passed via internal metadata header or request payload (`scope: "authorized_adult_outpatient"`).

### 3.2 Exclusion Criteria (Excluded Requests)
- **Pediatric Patients:** Age $< 18$ years (Type 1 diabetes pathophysiology predominates; model not trained on pediatric distributions).
- **Gestational Diabetes & Pregnancy:** Active pregnancy or gestational screening (altered glycemic kinetics and distinct diagnostic criteria).
- **Inpatient / Acute Crises:** Emergency department, ICU, diabetic ketoacidosis (DKA), hyperosmolar hyperglycemic state (HHS), or acute sepsis.
- **Pre-existing Diagnosed Diabetes:** Known active diagnosis under pharmacotherapy (metformin, insulin, GLP-1 agonists), where risk prediction is redundant and misleading.
- **Unauthorized Contexts:** Batch research exports, test-bed automated pings, or requests outside clinical screening scopes.

---

## 4. Evaluation Window & Sample Size Predeclaration

- **Prospective Evaluation Duration:** Exactly 30 consecutive calendar days from activation date.
- **Target Sample Size:** Minimum 500 eligible prospective requests with ground-truth clinical outcome adjudication within 90 days.
- **Minimum Daily Cadence:** Minimum 10 eligible evaluations/day to avoid burst-sampling bias.

---

## 5. Predeclared Clinical Validation Gates

For either candidate to be certified as eligible for model-promotion consideration, it must satisfy all predeclared performance and operational gates on the prospective adjudicated cohort:

| Evaluation Dimension | Candidate C (Deep MLP) Target Gate | Candidate A (Extra-Trees) Target Gate | Measurement Method |
| :--- | :--- | :--- | :--- |
| **Clinical Sensitivity (Recall)** | $\ge 0.7500$ (75.0%) | $\ge 0.7000$ (70.0%) | Ground-truth adjudicated cohort |
| **Clinical Specificity** | $\ge 0.7000$ (70.0%) | $\ge 0.7500$ (75.0%) | Ground-truth adjudicated cohort |
| **Calibration Error (ECE)** | $\le 0.1000$ | $\le 0.0600$ | 10-bin Equal-Width ECE on uncalibrated/calibrated outputs |
| **Inference Latency (p95)** | $\le 50.0\text{ ms}$ | $\le 20.0\text{ ms}$ | High-resolution wall-clock timer on inference step |
| **Inference Latency (p99)** | $\le 100.0\text{ ms}$ | $\le 40.0\text{ ms}$ | High-resolution wall-clock timer |
| **Runtime Reliability** | $0\text{ unhandled exceptions}$ (100.0%) | $0\text{ unhandled exceptions}$ (100.0%) | Isolated error-boundary telemetry |
| **Subgroup Disparity Ratio** | $\text{Ratio} \ge 0.80$ (80% rule across age $\ge 50$ vs $<50$) | $\text{Ratio} \ge 0.80$ | Sensitivity parity across age cohorts |

---

## 6. Accounting Ledger & Denominator Grounding

To prevent denominator drift and survival bias, all intake encounters are categorized into a strictly partitioned accounting ledger (`shadow_accounting_ledger.json`):

$$\text{Total Requests} = \text{Eligible Requests} + \text{Excluded Requests} + \text{Invalid Schema Requests}$$
$$\text{Eligible Requests} = \text{Shadow Evaluated Requests} + \text{Shadow Execution Failures}$$

### Ledger Categories
1. **Total Requests (`total_requests`):** Every HTTP POST request reaching the diabetes inference gateway.
2. **Eligible Requests (`eligible_requests`):** Requests satisfying all inclusion criteria and zero exclusion criteria.
3. **Shadow Evaluated Requests (`shadow_evaluated_requests`):** Requests where both candidate models successfully completed inference.
4. **Execution Failures (`failed_requests`):** Eligible requests where shadow inference crashed or timed out (isolated without impacting production).
5. **Invalid Schema Requests (`invalid_schema_requests`):** Requests failing Pydantic schema validation (e.g. non-numeric, out-of-bounds $>500$).
6. **Excluded Requests (`excluded_requests`):** Requests flagged as pediatric, gestational, inpatient, or unauthorized scope.

---

## 7. Privacy, Security & HIPAA Minimization

The shadow framework strictly implements Privacy-by-Design and HIPAA minimum-necessary principles:

1. **Pseudonymous Correlation IDs:**
   $$\text{correlation\_id} = \text{"corr\_"} + \text{SHA256}(\text{internal\_encounter\_token} + \text{salt})[:16]$$
   Raw patient IDs, medical record numbers (MRNs), names, and email addresses are cryptographically hashed and never written to shadow storage.
2. **Zero Storage of Raw Clinical Features:**
   The shadow logs and ledger store only:
   - `correlation_id`
   - `timestamp`
   - Candidate prediction probabilities ($p_C, p_A$)
   - Candidate binary decisions ($d_C, d_A$)
   - Latency metrics ($\Delta t_C, \Delta t_A$)
   Raw biological parameters (Glucose, BMI, Blood Pressure) are discarded immediately after in-memory tensor transformation.
3. **At-Rest and In-Transit Isolation:**
   Shadow ledgers are stored in local append-only files protected by operating-system file permissions (`0600`) within `artifacts/experiments/shadow_evaluation/`.

---

## 8. Failure Isolation & Non-Interference Guarantee

The shadow evaluation service (`shadow_diabetes_service.py`) is decoupled from production inference:
- Primary inference executes first, populates the production response, and stores the clinical result.
- Shadow evaluation executes within an isolated `try...except Exception` boundary.
- Any shadow evaluation exception, timeout, out-of-memory error, or unpickling failure is logged to telemetry and recorded in the failure ledger, but **never propagates** to the caller.
- Production response time and HTTP status code ($200\text{ OK}$) remain completely unaffected.

---

## 9. Outcome Adjudication Protocol

Adjudication of clinical ground truth occurs 30–90 days post-encounter via an offline, blinded review:
1. Laboratory outcomes are extracted from the laboratory information system (LIS):
   - Fasting plasma glucose $\ge 126\text{ mg/dL}$, or
   - 2-hour oral glucose tolerance test $\ge 200\text{ mg/dL}$, or
   - $\text{HbA1c} \ge 6.5\%$ ($48\text{ mmol/mol}$), or
   - Clinical endocrinologist formal diagnosis of Type 2 Diabetes.
2. The adjudication engine matches the outcome to the pseudonymous `correlation_id` via secure key escrow.
3. Post-adjudication sensitivity, specificity, PPV, NPV, and calibration are computed using `calculate_prospective_metrics()`.
