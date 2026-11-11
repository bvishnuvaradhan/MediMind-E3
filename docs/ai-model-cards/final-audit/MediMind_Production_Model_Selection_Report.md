# MediMind Clinical AI Platform — Production Model Selection Report

**Academic Year:** 2026–2027  
**Department:** Department of Data Science & Artificial Intelligence  
**Institution:** MediMind Clinical AI Platform Consortium  
**Repository:** `D:/projects/MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Audit Completion Date:** November 6, 2026  
**Governing Standards:** NIST AI RMF 1.0, FDA SaMD Action Plan (Tier II Clinical Decision Support), ISO/IEC 42001

---

## 1. Production Model Selection Methodology

The selection of production AI models for the MediMind Clinical AI Platform is governed by clinical safety, statistical reliability, inference stability, and operational integration capabilities, rather than superficial ranking by raw test accuracy or isolated metric maximization.

### 1.1 Decision Classification Tiers
Each evaluated model candidate is assigned to one of four authoritative governance categories:
1. **PRODUCTION-READY:** Evidence is sufficient for the intended clinical scope, all mandatory technical and safety gates are passed, inference integration is verified, and calibration error is acceptable.
2. **CONDITIONALLY ACCEPTABLE:** Promising candidate that meets baseline screening requirements, but carries specific documented clinical boundaries, population constraints, or pending validation gates that restrict its operational scope.
3. **RESEARCH-ONLY:** High-potential experimental architecture demonstrating strong exploratory or benchmark performance, but lacking required clinical infrastructure (e.g., multi-view DICOM ingestion, real-time PACS routing) or full prospective clinical validation.
4. **REJECTED:** Architecture with demonstrated diagnostic failure modes, severe data leakage vulnerabilities, or unmitigated clinical safety risks that render it unsuitable for deployment.

---

## 2. Module-by-Module Candidate Evaluation & Selection

### 2.1 Bone Fracture Detection Module

#### 2.1.1 Candidates Evaluated
1. **Production Baseline (ResNet-18 MURA-Pretrained):**
   - Single-view plain radiograph classifier trained on Stanford MURA v1.1 and fine-tuned on FracAtlas.
   - Operating threshold: $\tau = 0.1800$.
   - Held-out test performance ($N=613$): Sensitivity $96.26\%$ ($103/107$), Specificity $63.64\%$ ($322/506$), PPV $35.89\%$, NPV $98.77\%$, ROC-AUC $0.9244$, ECE $0.1021$.
2. **Experiment 8A (`DualViewROIResNet18`):**
   - Paired AP/Lateral dual-view architecture with YOLOv8 anatomical wrist ROI localization and cross-view attention fusion.
   - Operating threshold: $\tau = 0.0100$.
   - Internal paired test performance (GRAZ $N=350$ studies): Sensitivity $95.18\%$ ($237/249$), Specificity $75.25\%$ ($76/101$), PPV $90.46\%$, NPV $86.36\%$, ROC-AUC $0.9586$, ECE $0.0897$.
   - Pediatric normal controls specificity ($N=251$): $87.25\%$ ($219/251$).
   - Multi-center external sensitivity (Shenzhen PediURF $N=1,053$ studies): $94.59\%$ ($996/1,053$).
   - Lateral projection rescues: 24 occult fractures detected on lateral projection only.
3. **Experiment 7A (Global Dual-View ResNet-18):**
   - Dual-view whole-image concatenation without localization.
   - Result: Severe growth-plate collapse; $0.0\%$ specificity on normal pediatric controls (flagged all open physes as fractures).
4. **Experiment 2B / Graz Single-View ResNet-18:**
   - Single-view ResNet-18 trained exclusively on GRAZPEDWRI-DX.
   - Result: $0.0\%$ normal control specificity due to growth-plate confounding.

#### 2.1.2 Production Selection & Governance Verdict
- **Selected Model:** **Retain Existing Baseline (MURA-Pretrained ResNet-18)**
- **Governance Classification:** **CONDITIONALLY ACCEPTABLE** (Adult Use Only, Age $\ge 18$)
- **Status of Experiment 8A:** **RESEARCH-ONLY (FROZEN CANDIDATE)**

#### 2.1.3 Detailed Rationale
- **Why Baseline is Retained:** The production inference service (`ai-prediction-service/app/services/fracture_service.py`) operates via a standard HTTP multipart upload endpoint accepting a single image buffer (`image_bytes`). It achieves $96.26\%$ sensitivity for adult emergency triage.
- **Why Experiment 8A Cannot Be Promoted Yet:** Despite outstanding scientific performance ($95.18\%$ sensitivity, $87.25\%$ growth-plate specificity, 24 lateral rescues, and $94.59\%$ external transfer), Exp 8A requires **simultaneous paired AP and Lateral views** with DICOM series grouping. The current MediMind API contracts, database schemas, and frontend upload widgets do not support multi-file study-level ingestion. Promoting Exp 8A prematurely would break production API contracts.
- **Mandatory Clinical Safety Guardrail:** The baseline ResNet-18 is **strictly contraindicated for pediatric patients ($<18$ years)** due to false positives on open growth plates. A hard age-verification gate must be enforced at the API layer.

---

### 2.2 Cardiovascular Disease Detection Module

#### 2.2.1 Candidates Evaluated
1. **Random Forest Classifier (200 Trees, Max Depth 12):**
   - Ensemble of 200 decision trees trained on 64,963 clean records (after excising 3,820 exact duplicates).
   - Operating threshold: $\tau = 0.4000$ (clinically tuned on validation set).
   - Held-out test performance ($N=9,745$): Sensitivity $80.01\%$ ($3,967/4,958$), Specificity $63.40\%$ ($3,035/4,787$), PPV $69.37\%$, NPV $75.38\%$, ROC-AUC $0.7961$, Brier Score $0.1829$, ECE $0.0080$.
2. **Logistic Regression Baseline:**
   - Linear model trained on normalized features.
   - Held-out test performance ($N=9,745$ at $\tau = 0.50$): Sensitivity $68.80\%$, Specificity $76.04\%$, PPV $74.84\%$, ROC-AUC $0.7866$, ECE $0.0142$.
   - Limitation: Insufficient sensitivity for screening ($68.80\% < 80.0\%$ target).
3. **Multi-Layer Perceptron (MLP Candidate):**
   - 2-layer neural network with standard scaling.
   - Held-out test performance ($N=9,745$ at $\tau = 0.50$): Sensitivity $67.45\%$, Specificity $77.82\%$, ROC-AUC $0.7912$, ECE $0.0189$.
   - Limitation: Lacks tree ensemble robustness to non-linear blood pressure interactions; higher training complexity without discrimination gain.

#### 2.2.2 Production Selection & Governance Verdict
- **Selected Model:** **Random Forest Classifier (`random_forest.joblib`)**
- **Governance Classification:** **PRODUCTION-READY**

#### 2.2.3 Detailed Rationale
- **Clinical Screening Optimization:** Operating at $\tau = 0.4000$ delivers $80.01\%$ sensitivity, successfully meeting the platform requirement for clinical triage without imposing an unmanageable false-positive burden (specificity $63.40\%$, PPV $69.37\%$).
- **Exemplary Probability Calibration:** The model achieves an Expected Calibration Error of $\text{ECE} = 0.0080$ ($<0.01$), ensuring that predicted probability scores accurately reflect true empirical risk.
- **Interpretability & Resilience:** Random Forest provides stable Gini feature importances (Systolic BP $38.6\%$, Cholesterol $18.2\%$, Age $14.7\%$) that align with established cardiovascular pathophysiology.
- **Clinical Target Definition:** The model is formally documented as predicting **point-in-time cross-sectional disease presence**, preventing clinician confusion with 10-year longitudinal risk scores.

---

### 2.3 Type 2 Diabetes Prediction Module

#### 2.3.1 Candidates Evaluated
1. **Scikit-Learn Pipeline (`StandardScaler` + `MLPClassifier`):**
   - 2-layer neural network ($(32, 16)$ hidden neurons, ReLU, Adam, $\alpha=0.001$, early stopping).
   - Operating threshold: $\tau = 0.2500$ (tuned on validation set for recall $\ge 80\%$).
   - Held-out test performance ($N=116$): Sensitivity $80.49\%$ ($33/41$), Specificity $68.00\%$ ($51/75$), PPV $57.89\%$, NPV $86.44\%$, Accuracy $72.41\%$, ROC-AUC $0.8267$, Brier Score $0.1647$, ECE $0.1037$.
2. **Random Forest Benchmark Candidate:**
   - Evaluated on identical test split ($N=116$ at $\tau = 0.50$): Sensitivity $48.78\%$, Specificity $89.33\%$, ROC-AUC $0.8332$.
   - Tuned operating point ($\tau = 0.35$): Sensitivity $73.17\%$, Specificity $74.67\%$.
   - Limitation: Failed to reach the mandatory $80.0\%$ clinical sensitivity target.
3. **Logistic Regression Benchmark:**
   - Evaluated on test split ($N=116$ at $\tau = 0.50$): Sensitivity $51.22\%$, Specificity $92.00\%$, ROC-AUC $0.8624$.
   - Limitation: Severe under-detection of diabetic cases at default thresholds ($51.22\%$ recall).

#### 2.3.2 Production Selection & Governance Verdict
- **Selected Model:** **Pipeline[`StandardScaler`, `MLPClassifier`] (`best_model.joblib`)**
- **Governance Classification:** **CONDITIONALLY ACCEPTABLE**

#### 2.3.3 Detailed Rationale
- **Superior Sensitivity Capture:** The MLP Pipeline at $\tau = 0.2500$ is the only candidate achieving $\ge 80\%$ recall ($80.49\%$, $33/41$ cases detected), essential for pre-diabetes and diabetes screening.
- **Why Classified as Conditionally Acceptable (Not Production-Ready):**
  1. *Calibration Failure:* The measured ECE is **0.1037** (10.37%), which slightly exceeds the platform target of $\le 0.10$. Predicted probabilities must be banded into risk tiers (Low, Moderate, High) rather than presented as exact calibrated percentages.
  2. *Statistical Sampling Variance:* With only 116 test samples and 41 positive cases, the $95\%$ Wilson confidence interval is wide ($[65.99\%, 89.77\%]$).
  3. *Demographic Limitation:* The Pima Indians cohort consists exclusively of adult females of Pima indigenous heritage, requiring external clinical validation across diverse multi-ethnic populations.

---

### 2.4 General Health Clinical NLP Triage Module

#### 2.4.1 Candidates Evaluated
1. **Deterministic Expert Rule Engine (`GeneralHealthNLPEngine` v1.1.0):**
   - Deterministic rule-based engine utilizing regex patterns, 50-character contextual lookbehind for negation, code-mixed multilingual lexicons (Hindi, Telugu, Hinglish), and mandatory safety overrides.
   - Test suite evaluation: $100.0\%$ pass rate across 69 clinical scenarios ($29/29$ baseline and $40/40$ advanced edge cases).
   - Execution latency: $<1.0\text{ ms}$ (pure engine execution).
2. **Generative Large Language Model (Direct LLM Zero-Shot Triage):**
   - Direct prompting of external LLMs for triage.
   - Limitation: Rejected due to non-deterministic outputs, hallucination risks, latency spikes ($>1,500\text{ ms}$), and potential catastrophic misses of red-flag symptoms.

#### 2.4.2 Production Selection & Governance Verdict
- **Selected Model:** **`GeneralHealthNLPEngine` v1.1.0 (Safety-First Rule Engine)**
- **Governance Classification:** **PRODUCTION-READY (DETERMINISTIC DECISION SUPPORT)**

#### 2.4.3 Detailed Rationale
- **Deterministic Emergency Guarantee:** Zero stochastic drift ensures that any high-risk symptom (crushing chest pain, severe hemorrhage, acute dyspnea, stroke signs, pediatric lethargy, suicidal ideation) is guaranteed an immediate `UrgencyLevel.EMERGENCY` escalation without latency or probabilistic variance.
- **Linguistic Accessibility:** Robust support for Hinglish and Telugu code-mixed phrasing broadens patient intake equity.
- **Operational Boundary:** Explicitly scoped as non-diagnostic educational decision support with mandatory medical disclaimers on every output payload.

---

## 3. Comprehensive Production Decision Matrix

| AI Module | Evaluated Model Architecture | Assigned Governance Tier | Primary Performance Metrics | Key Clinical Risks & Boundaries | Recommended Operational Action |
|---|---|---|---|---|---|
| **Bone Fracture Detection** | ResNet-18 (MURA-pretrained) | **CONDITIONALLY ACCEPTABLE** | Sensitivity: $96.26\%$, Specificity: $63.64\%$, ROC-AUC: $0.9244$ | High false-positive rate on open pediatric physes ($<2\%$ spec) | Deploy for adult triage ($\ge 18$ yrs) only; enforce age-verification gate |
| **Bone Fracture (Research)** | `DualViewROIResNet18` (Exp 8A) | **RESEARCH-ONLY** | Sensitivity: $95.18\%$, Spec: $75.25\%$, Norm Spec: $87.25\%$, Ext Sens: $94.59\%$ | Requires paired AP+Lateral DICOM series; single-view API unsupported | Retain in `artifacts/fracture_v2/`; build DICOM multi-view gateway |
| **Cardiovascular Disease** | Random Forest (200 trees, depth 12) | **PRODUCTION-READY** | Sensitivity: $80.01\%$, Specificity: $63.40\%$, ROC-AUC: $0.7961$, ECE: $0.0080$ | Cross-sectional presence, not 10-year Framingham risk | Active production deployment for adult primary care screening |
| **Type 2 Diabetes** | StandardScaler + MLPClassifier (32, 16) | **CONDITIONALLY ACCEPTABLE** | Sensitivity: $80.49\%$, Specificity: $68.00\%$, ROC-AUC: $0.8267$, ECE: $0.1037$ | ECE exceeds 0.10 target; historical Pima female cohort | Active production deployment; band probabilities into Low/Med/High tiers |
| **General Health NLP** | GeneralHealthNLPEngine v1.1.0 | **PRODUCTION-READY** | $100.0\%$ pass rate on 69 curated scenarios, $<1\text{ ms}$ latency | Rule-based; cannot infer unmodeled complex clinical presentations | Active production deployment for intake triage & navigation support |

---

## 4. Migration & Future Promotion Roadmap

1. **Exp 8A Promotion Path:**
   - Develop API endpoint `POST /api/v2/fracture/study` supporting multi-view DICOM payloads.
   - Implement automated series grouping for AP and Lateral projections.
   - Execute prospective clinical demonstration across $\ge 500$ pediatric trauma encounters before promoting Exp 8A to replace baseline ResNet-18.
2. **Diabetes Model Recalibration:**
   - Apply isotonic regression or Platt scaling to reduce MLP ECE from $0.1037$ to $<0.0500$.
   - Ingest multi-ethnic clinical screening data to eliminate Pima demographic bias.
3. **Cardiovascular Risk Expansion:**
   - Investigate prospective cohort linkages to transition from cross-sectional disease presence to validated 10-year ASCVD risk scoring.
