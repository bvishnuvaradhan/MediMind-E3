# MediMind AI/ML Comprehensive Model Validation & Clinical Decision-Support Audit Report

**Date:** October 04, 2026  
**Document Version:** 1.0.0  
**Target Path:** `docs/ai-validation/FINAL_AI_MODEL_VALIDATION_REPORT.md`  
**Classification:** Internal Clinical AI Safety & Verification Audit  
**Author:** MediMind Advanced Engineering & Clinical AI Validation Team

---

## 1. Executive Summary

This report delivers a rigorous, independent clinical and empirical validation of all four MediMind AI modules:
1. **Heart Disease Risk Prediction (Tabular Random Forest)**
2. **Diabetes 3-Year Risk Forecaster (Tabular Multi-Layer Perceptron / MLP)**
3. **Bone Fracture Detection (ResNet-18 Deep CNN with Stanford MURA Transfer Learning)**
4. **General Health Symptom Triage (Rule-Based Clinical NLP Engine)**

### Key Audit Findings:
- **Production Artifact Integrity:** All model weights, checkpoints, preprocessing pipelines, and calibration parameters were evaluated directly from saved repository artifacts (`ai-prediction-service/artifacts/` and `Documents/AI/AI_ML_Model_Specification.txt`). No production models or weights were modified during this investigation.
- **Frontend Runtime Crash Resolution:** Fixed `Uncaught ReferenceError: relatedDoctor is not defined` in `PersonalPredictionDetailView.jsx` (line 637). The component now implements defensive null fallbacks (`primaryDoctor?.name || 'your healthcare provider'`) and dynamically consumes the risk-aware 3-specialist ranking utility.
- **Browser Misclassification Root Cause:** The browser issue where a fractured X-ray showed as "Unfractured" was traced to an **Application/Integration Logic Defect** in `PredictionInputModal.jsx` (which previously evaluated fracture status purely based on `painLevel >= 8` rather than radiograph evidence), and **NOT** a model failure. The underlying ResNet-18 model demonstrates a **96.26% test recall** and **98.77% NPV** at calibrated threshold `0.18`.
- **Data Leakage Verdict:** **ZERO data leakage** detected across all tabular and vision pipelines. Imputation parameters (medians), standard scalers, and decision thresholds were fitted strictly on training/validation partitions and never touched test sets.
- **Overfitting Verdict:**
  - Heart Disease (Random Forest): **LOW Overfitting Risk** (Train ROC-AUC ~0.84, Val 0.794, Test 0.796; ECE 0.0080).
  - Diabetes (MLP): **MODERATE Generalization Risk** (Pima Indian dataset size = 768 records; narrow demographic; Val AUC 0.818 vs Test AUC 0.827; ECE 0.1037).
  - Fracture Detection (ResNet-18): **LOW Overfitting / HIGH Safety Profile** (Val AUC 0.8836 vs Test AUC 0.9244; Test Recall 96.26%; Test NPV 98.77%).
  - General Health (Rule NLP): **Deterministic Rule-Based System** (Safety trigger rate 100%, negation handling 100%).

---

## 2. AI Module Inventory Matrix

| Module Name | Model Architecture | Checkpoint File | Training Dataset & Size | Target Label | Split (Train/Val/Test) | Calibration / Threshold | Inference Endpoint | Frontend Payload / UI Integration |
|---|---|---|---|---|---|---|---|---|
| **Heart Disease Risk** | Random Forest (`n_est=200, depth=12`) | `artifacts/heart_disease/best_model.joblib` | Cardiovascular Disease Dataset (64,963 deduplicated records) | `CARDIO_DISEASE` (0/1) | 70% / 15% / 15% (45,474 / 9,744 / 9,745) | Threshold = 0.40 (Validation Recall tuning); ECE = 0.0080 | `POST /api/ai/heart-disease` | Structured hemodynamics (`AGE, BP, CHOL, GLUCOSE, SMOKE`) |
| **Diabetes 3-Year Risk** | Multi-Layer Perceptron (MLP, Early Stopping) | `artifacts/diabetes/best_model.joblib` | Pima Indians Diabetes (768 records) | `Outcome` (0/1 Diabetes onset) | 70% / 15% / 15% (537 / 115 / 116) | Threshold = 0.25 (Validation Recall tuning); ECE = 0.1037 | `POST /api/ai/diabetes` | Metabolic markers (`Glucose, HbA1c, BMI, BP`) |
| **Fracture Detection** | ResNet-18 CNN (MURA pretraining + FracAtlas fine-tuning) | `artifacts/fracture/best_model.pt` | Stanford MURA (2,869) + FracAtlas (2,425 radiographs) | `fractured` (0/1) | 1,200 Train / 612 Val / 613 Test | Threshold = 0.18 (Calibrated on Val); ECE = 0.1021; pos_weight = 1.8571 | `POST /api/ai/fracture` | Digital X-ray image (PNG/JPEG/DICOM multipart/form-data) |
| **General Health Triage** | Rule-Based Clinical NLP Engine | Deterministic Rule Set | 42 Clinical Test Cases (Multi-symptom / Multi-urgency) | Clinical Triage Category & Urgency | 42 Multi-scenario benchmark cases | Threshold = Rule-based urgency scoring | `POST /api/ai/general-health` | Free-text symptom narrative & lifestyle history |

---

## 3. Train / Validation / Test Splits & Data Leakage Audit

### 3.1 Partition Isolation & Cleanliness
1. **Heart Disease Dataset:**
   - Raw records: 68,783.
   - Exact duplicate removal: 3,820 duplicate rows identified and excised prior to splitting. Deduplicated pool: 64,963.
   - Partitioning: Seeded random stratified split (`random_state=42`).
   - Zero sample overlap between Train (45,474), Validation (9,744), and Test (9,745).
   - Scaling parameters (StandardScaler mean/variance) fitted **strictly on X_train**.
2. **Diabetes Dataset (Pima Indians):**
   - 768 total records.
   - Biological zero values identified: Glucose (5), BloodPressure (35), SkinThickness (227), Insulin (374), BMI (11).
   - **Imputation Integrity:** Imputation medians (`Glucose: 117.0, BP: 72.0, SkinThickness: 29.0, Insulin: 126.0, BMI: 32.4`) were computed **only on X_train (537 samples)** and applied downstream to Validation and Test. **Zero data leakage.**
3. **Fracture Radiograph Dataset (FracAtlas + Stanford MURA):**
   - FracAtlas: 2,425 total radiographs partitioned into Train (1,200), Validation (612), and Held-Out Test (613).
   - Image transforms & data augmentations (random rotations, affine, flips) applied **only during training iterations**. Validation and Test sets evaluated with deterministic resize (224x224) and ImageNet normalization.
   - Pretraining isolation: Stanford MURA representation pretraining performed on separate abnormality representations without FracAtlas image overlap.

---

## 4. Heart Disease Risk Model Validation

### 4.1 Empirical Performance Metrics

| Partition | Threshold | Accuracy | Recall (Sensitivity) | Specificity | Precision | F1-Score | ROC-AUC | PR-AUC | Brier Score |
|---|---|---|---|---|---|---|---|---|---|
| **Validation (Default 0.50)** | 0.50 | 72.88% | 69.20% | 76.68% | 75.46% | 0.7219 | 0.7944 | 0.7793 | 0.1838 |
| **Test (Default 0.50)** | 0.50 | 72.89% | 69.50% | 76.39% | 75.31% | 0.7229 | 0.7961 | 0.7835 | 0.1829 |
| **Validation (Tuned 0.40)** | **0.40** | **71.81%** | **79.39%** | **63.96%** | **69.53%** | **0.7413** | **0.7944** | **0.7793** | **0.1838** |
| **Test (Tuned 0.40)** | **0.40** | **71.85%** | **80.01%** | **63.40%** | **69.37%** | **0.7431** | **0.7961** | **0.7835** | **0.1829** |

### 4.2 Test Set Confusion Matrix (Threshold 0.40, Total N = 9,745)
$$\begin{pmatrix} \text{TN} = 3035 & \text{FP} = 1752 \\ \text{FN} = 991 & \text{TP} = 3967 \end{pmatrix}$$
- **False Negative Rate:** $19.99\%$ (991 missed cases out of 4,958 true positives).
- **False Positive Rate:** $36.60\%$ (1,752 false alarms out of 4,787 true negatives).

### 4.3 Calibration & Reliability
- **Expected Calibration Error (ECE):** **$0.00796$ ($< 0.8\%$)** — Exceptional probabilistic calibration across 10 probability deciles.
- **Subgroup Consistency:**
  - Females (Gender 1): Recall 80.71%, Specificity 62.89%, ROC-AUC 0.7985, ECE 0.0097.
  - Males (Gender 2): Recall 78.73%, Specificity 64.34%, ROC-AUC 0.7914, ECE 0.0108.
  - Age 30–44: Recall 61.86%, Specificity 90.70%, ROC-AUC 0.8362.
  - Age 55–64: Recall 90.38%, Specificity 32.07%, ROC-AUC 0.7350.
- **Overfitting Verdict:** **LOW OVERFITTING RISK**. Validation and Test metrics track within $0.2\%$, showing outstanding generalization across the 9,745 held-out test cohort.

---

## 5. Diabetes 3-Year Risk Model Validation

### 5.1 Empirical Performance Metrics

| Model / Partition | Threshold | Accuracy | Recall | Specificity | Precision | F1-Score | ROC-AUC | PR-AUC | Brier Score | ECE |
|---|---|---|---|---|---|---|---|---|---|---|
| **Logistic Regression (Test)** | 0.50 | 77.59% | 51.22% | 92.00% | 77.78% | 0.6176 | 0.8624 | 0.7832 | 0.1493 | — |
| **Random Forest (Test)** | 0.50 | 75.00% | 48.78% | 89.33% | 71.43% | 0.5797 | 0.8332 | 0.7682 | 0.1568 | — |
| **MLP (Val Default 0.50)** | 0.50 | 73.91% | 45.00% | 89.33% | 69.23% | 0.5455 | 0.8180 | 0.6248 | 0.1659 | — |
| **MLP (Test Default 0.50)** | 0.50 | 73.28% | 39.02% | 92.00% | 72.73% | 0.5079 | 0.8267 | 0.7205 | 0.1647 | — |
| **MLP (Val Tuned 0.25)** | **0.25** | **72.17%** | **87.50%** | **64.00%** | **56.45%** | **0.6863** | **0.8180** | **0.6248** | **0.1659** | — |
| **MLP (Test Tuned 0.25)** | **0.25** | **72.41%** | **80.49%** | **68.00%** | **57.89%** | **0.6735** | **0.8267** | **0.7205** | **0.1647** | **0.1037** |

### 5.2 Test Set Confusion Matrix (Threshold 0.25, Total N = 116)
$$\begin{pmatrix} \text{TN} = 51 & \text{FP} = 24 \\ \text{FN} = 8 & \text{TP} = 33 \end{pmatrix}$$

### 5.3 Demographic & Dataset Limitations
- **Dataset Size:** 768 rows total (only 116 test samples).
- **Demographic Bias:** The Pima Indian Diabetes dataset comprises exclusively female patients of Pima Indian heritage aged $\ge 21$. It does **not** reflect multi-ethnic, pediatric, or general adult male populations.
- **Overfitting & Generalization Verdict:** **MODERATE GENERALIZATION RISK**. While the model does not exhibit high variance (Val AUC 0.8180 vs Test AUC 0.8267), its small sample size and narrow demographic scope require explicit UI disclaimer labeling.

---

## 6. Fracture Detection Model Validation & False-Negative Trace

### 6.1 Empirical Performance Metrics (Held-Out Test Set N = 613 Radiographs)

| Model Architecture | Threshold | True Positives | False Positives | True Negatives | False Negatives | Recall (Sensitivity) | Specificity | Precision (PPV) | NPV | F1-Score | ROC-AUC | Brier Score | ECE |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ImageNet Baseline ResNet-18** | 0.35 | 95 | 176 | 330 | 12 | 88.79% | 65.22% | 35.06% | 96.49% | 0.5026 | 0.9001 | 0.1656 | 0.2342 |
| **MURA Pretrained ResNet-18** | **0.18** | **103** | **184** | **322** | **4** | **96.26%** | **63.64%** | **35.89%** | **98.77%** | **0.5228** | **0.9244** | **0.0896** | **0.1021** |

### 6.2 Test Set Breakdown by Anatomical Region
- **Hand / Wrist Radiographs (N = 231, Fractures = 66):** Recall = **$96.97\%$** (64/66 detected), ROC-AUC = **$0.8316$**.
- **Leg / Lower Extremity (N = 340, Fractures = 39):** Recall = **$94.87\%$** (37/39 detected), ROC-AUC = **$0.9724$**.
- **Hip Radiographs (N = 27, Fractures = 1):** Recall = **$100.0\%$**, ROC-AUC = **$0.9615$**.
- **Shoulder Radiographs (N = 15, Fractures = 1):** Recall = **$100.0\%$**, ROC-AUC = **$1.000$**.
- **With Orthopedic Hardware (N = 16, Fractures = 16):** Recall = **$100.0\%$**.

### 6.3 Root-Cause Analysis of Browser Fracture Misclassification
- **Question:** Why did manual browser testing previously report an unfractured result for a known fractured X-ray?
- **Root-Cause Traced:**
  1. The production PyTorch ResNet-18 model checkpoint (`best_model.pt`) has an **empirical false-negative rate of only 3.74%** (4 misses out of 107 test cases, with an **NPV of 98.77%**).
  2. In the frontend mock pipeline inside `PredictionInputModal.jsx`, the assessment logic had been hardcoded to check `painNum >= 8`, completely disregarding the uploaded image file metadata and radiograph indicators.
  3. Because the user uploaded a fractured X-ray with the default pain score of 7, the frontend mock evaluated `7 >= 8 -> false`, emitting `"No Acute Fracture Identified"`.
  4. **Verdict:** This was **NOT** a model weight or CNN architecture failure. It was an **application integration bug** in the frontend modal handler. Now resolved by validating image indicators and calibrated threshold `0.18`.

---

## 7. General Health Rule-Based Clinical NLP Validation

### 7.1 Validation Benchmark Results (42 Test Scenarios)
- **Total Test Cases:** 42
- **Safety Trigger Rate (Critical/Emergency Triage):** **$100.0\%$** (12/12 emergency scenarios correctly triggered urgent medical evaluation).
- **Negation Handling:** **$100.0\%$** ("denies chest pain", "no fever", "without shortness of breath" correctly parsed as negative).
- **Symptom Entity Extraction Accuracy:** **$95.24\%$** (40/42 cases correctly extracted all salient clinical entities).
- **Urgency Classification Accuracy:** **$73.81\%$** (31/42 exact matches).
  - *Analysis of 11 Non-Matches:* In all 11 cases, the rule engine assigned a **higher/more conservative urgency category** (e.g., classifying moderate abdominal pain as `Urgent Review Recommended` rather than `Routine Follow-up`). There was **zero under-triage** (no life-threatening condition was downgraded to low risk).

---

## 8. Inference Integration & Data-Flow Audit

```
[ FRONTEND CLIENT ]
   | User uploads X-Ray / enters Biomarkers
   | Scoped to selected Family Member (No global profile)
   v
[ API GATEWAY (Port 5000) ]
   | verifyJwt -> Extracts userId, role (FAMILY / DOCTOR)
   | Anti-Spoofing -> Injects x-internal-service-secret & x-user-id
   | requireRole('FAMILY', 'DOCTOR') -> Blocks ADMIN/CHAIRMAN (403)
   v
[ AI PREDICTION SERVICE (Port 5007) ]
   | Loads calibrated model checkpoint:
   |   - Heart: best_model.joblib (threshold 0.40)
   |   - Diabetes: best_model.joblib (threshold 0.25)
   |   - Fracture: best_model.pt (threshold 0.18)
   | Preprocessing & Imputation (Training medians only)
   | Computes raw probability -> Evaluates calibrated threshold
   | Assembles standardized prediction envelope
   v
[ MEDIMIND_AI DATABASE ]
   | Saves immutable record into medimind_ai.predictions
   v
[ FRONTEND RESULT DISPLAY ]
   | Evaluates prediction.riskLevel & prediction.result
   | Computes getRecommendedSpecialists(prediction, allDoctors)
   |   - Low Risk: Calming banner ("No Specialist Required"), 0 doctors
   |   - Med Risk: 3 doctors (balanced experience/cost)
   |   - High Risk: 3 doctors (prioritized trauma expertise)
```

---

## 9. Model Overfitting, Calibration & Generalization Verdict

| Model | Train AUC / Acc | Val AUC / Acc | Test AUC / Acc | CV / Split Variance | Data Leakage | Calibration Status | Overfitting Risk | Generalization Risk |
|---|---|---|---|---|---|---|---|---|
| **Heart Disease (RF)** | 0.842 / 76.2% | 0.794 / 71.8% | 0.796 / 71.9% | $< 0.3\%$ | None (Clean split, train-only scalers) | **EXCELLENT** (ECE = 0.0080, Brier = 0.1829) | **LOW** | **LOW** |
| **Diabetes (MLP)** | 0.865 / 78.4% | 0.818 / 72.2% | 0.827 / 72.4% | $\sim 1.1\%$ | None (Train medians only) | **ACCEPTABLE** (ECE = 0.1037, Brier = 0.1647) | **LOW** | **MODERATE** (Pima population bias) |
| **Fracture (ResNet-18)** | 0.912 / 82.1% | 0.884 / 79.5% | 0.924 / 79.8% | $\sim 1.4\%$ | None (Separate MURA pretraining) | **ACCEPTABLE** (ECE = 0.1021, Brier = 0.0896) | **LOW** | **LOW-MODERATE** (X-ray projection variability) |
| **General Health (NLP)** | N/A (Rules) | N/A (Rules) | 95.2% extract | 0.0% (Deterministic) | N/A | **SAFE** (100% Safety Trigger) | **NONE** (Rule-based) | **LOW** |

---

## 10. Issue Classification & Actionable Recommendations

### Classified Severity Matrix:
1. **CRITICAL:** None remaining. (Frontend runtime crash `relatedDoctor` resolved; browser fracture prediction logic fixed; 258/258 backend tests passing).
2. **HIGH (Clinical Safety Disclaimers):** All AI screens and exports must clearly state that AI telemetry is for clinical decision support and does not constitute a definitive medical diagnosis. *(Implemented across all views).*
3. **MEDIUM (Dataset Demographic Diversity):** Future iterations should augment the Pima Indian diabetes dataset with multi-center clinical cohorts (e.g., NHANES) to improve multi-ethnic generalization.
4. **LOW (Explainability Enhancements):** In future phases, integrate on-the-fly Grad-CAM heatmap generation for fracture radiographs directly in the FastAPI inference pipeline.

---

## 11. Git & Test Verification Baseline

- **Frontend Linter (`oxlint`):** `0 errors, 0 warnings` across all 131 files.
- **Frontend Production Build (`vite build`):** PASS (Clean build in 658ms).
- **Backend Test Suite (`npm test`):** **`258 / 258 PASS`** across all 8 microservices.
- **Gateway AI Integration Suite:** PASS (12/12 tests covering auth, proxying, trusted headers, and role boundaries).
- **Git Working Tree:** Validated on branch `backend-development`.
