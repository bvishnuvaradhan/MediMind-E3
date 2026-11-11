# MediMind AI Model Card — Diabetes Risk Prediction

**Document ID:** `MC-AI-DIAB-2026-V1`  
**Model Name:** `diabetes_risk`  
**Evaluation Scope:** Binary Diabetes Mellitus Risk Classification from Physiological & Metabolic Indicators  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Last Verified Date:** November 6, 2026  

---

## Section A — Model Identification

| Property | Verified Value | Repository Ground Truth Reference |
| :--- | :--- | :--- |
| **Model Name** | `diabetes_risk` | `ai-prediction-service/artifacts/diabetes/training_report.json` |
| **MediMind Module** | Diabetes Risk Assessment Service | `ai-prediction-service/app/services/diabetes_service.py` |
| **Model Version** | `0.1.0` | Line 23: `MODEL_VERSION = "0.1.0"` |
| **Primary Checkpoint File** | `artifacts/diabetes/best_model.joblib` | `artifacts/diabetes/mlp.joblib` (Identical binary) |
| **Checkpoint File Size** | 30,193 bytes (29.49 KB) | Filesystem binary measurement |
| **Cryptographic Hash (MD5)** | `7bf85e9a43d9a38e40c8f92e0d0ac4cd` | Verified across both `best_model.joblib` & `mlp.joblib` |
| **Cryptographic Hash (SHA-256)**| `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` | Verified SHA-256 calculation |
| **Model Architecture Type** | Multi-Layer Perceptron Pipeline (`Pipeline[StandardScaler, MLPClassifier]`) | Verified via Python object introspection |
| **Primary Task** | Binary Cross-Sectional Diabetes Classification (`Outcome` $\in \{0, 1\}$) | Supervised metabolic risk classification |
| **Responsible Component** | `ai-prediction-service/app/models/diabetes/` | Codebase location |
| **Current Operational Status** | **Production Validated / Production Baseline** | Loaded lazily by `DiabetesInferenceService` |

> **IMPORTANT ARCHITECTURAL RECONCILIATION:** In older preliminary documentation (`DIABETES_MODEL_CARD.md`), this model was colloquially labeled as "Random Forest classifier". Direct programmatic inspection of the deployed serialized binary `artifacts/diabetes/best_model.joblib` and `training_report.json` conclusively establishes that the active production model is an **MLPClassifier Pipeline** (`hidden_layer_sizes=(32, 16)`, `alpha=0.001`, `early_stopping=True`). This Model Card formally corrects the legacy label against authoritative repository ground truth.

---

## Section B — Intended Use

### 1. Primary Intended Purpose
The MediMind Diabetes Risk Prediction model is an automated clinical decision-support screening tool designed to assess the likelihood of type-2 diabetes mellitus using standard metabolic, physiological, and demographic parameters. The model outputs a continuous estimated risk probability, maps the score to an actionable risk badge (`HIGH`, `MEDIUM`, `LOW`), and prompts healthcare providers to order confirmatory diagnostic laboratory testing (fasting plasma glucose, oral glucose tolerance test, or glycated hemoglobin $\text{HbA}_{1\text{c}}$).

### 2. Intended Users
- **Primary Care Physicians & Internists:** Opportunistic metabolic risk screening during routine physical check-ups.
- **Endocrinology Outpatient Clinics:** Triage prioritization for formal metabolic workups.
- **Family Portal Users:** Receiving personalized preventive lifestyle guidance accompanied by mandatory clinical disclaimers.

### 3. Intended Input & Modality
- **Modality:** Structured Tabular Health Parameters (`HEALTH_PARAMETERS`).
- **Input Vector (8 Features):**
  `[Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age]`

### 4. Target Definition Clarification (Crucial Clinical Boundary)
> **IMPORTANT CLINICAL BOUNDARY:** The model predicts **current binary presence or absence of diabetes** (`Outcome` $\in \{0, 1\}$) at the time of metabolic testing. It is **NOT** a 5-year longitudinal diabetes-onset model. Claims asserting that this system predicts "future 5-year diabetes incidence" are unsupported by the cross-sectional dataset structure and are factually incorrect.

### 5. Out-of-Scope & Prohibited Use Cases
- **Autonomous Prescription of Hypoglycemic Therapy:** The model must never be used to initiate, titrate, or discontinue insulin or oral anti-diabetic medications without laboratory confirmation.
- **Pediatric & Male Populations:** Not trained on male individuals or patients under 21 years of age.
- **Gestational Diabetes Triage:** Not calibrated for pregnancy-induced glucose intolerance.

---

## Section C — Dataset Documentation

### 1. Dataset Origin & Population Scope
- **Dataset File:** `ai-prediction-service/test-dataset/Diabetes/diabetes.csv`
- **Origin:** National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK) / UCI Machine Learning Repository (Pima Indians Diabetes Database).
- **Study Population:** Exclusively female patients aged $\ge 21$ years of Pima Indian heritage residing near Phoenix, Arizona.
- **Total Dataset Size:** 768 patient observations.
- **Raw Class Balance:** 500 Class 0 (Non-Diabetic, $65.10\%$) and 268 Class 1 (Diabetic, $34.90\%$).

### 2. Invalid Biological Zero Values & Data Quality Audit
In standard medical physiology, several metabolic parameters cannot be zero in living humans. Five columns contain erroneous zero recordings representing unrecorded or missing data:

| Physiological Feature | Unit | Observed Invalid Zeros | Missingness Percentage | Physiological Impossibility Rationale |
| :--- | :--- | :---: | :---: | :--- |
| **`Glucose`** | $\text{mg/dL}$ | 5 | 0.65% | Fasting plasma glucose cannot be 0 in viable human physiology |
| **`BloodPressure`** | $\text{mmHg}$ | 35 | 4.56% | Diastolic blood pressure of 0 indicates circulatory collapse / arrest |
| **`SkinThickness`** | $\text{mm}$ | 227 | 29.56% | Triceps skin fold thickness is non-zero in all anatomical subjects |
| **`Insulin`** | $\mu\text{U/mL}$ | 374 | **48.70%** | 2-hour serum insulin is absent in nearly half the patient cohort |
| **`BMI`** | $\text{kg/m}^2$ | 11 | 1.43% | Body Mass Index cannot be zero in living subjects |

```
[Diabetes Partitioning & Leakage Elimination]
Raw Pima Cohort: 768 Records (500 Class 0 / 268 Class 1)
     │
     └── Stratified 70/15/15 Partitioning (BEFORE Imputation or Scaling)
          │
          ├── Stratified Train Split (70%): 537 Records (350 Class 0 / 187 Class 1)
          │    └── Fit Imputation Medians & StandardScaler strictly on this fold
          │
          ├── Stratified Val Split (15%):   115 Records (75 Class 0 / 40 Class 1)
          │    └── Transform using Train Medians & Scaler; sweep thresholds
          │
          └── Stratified Test Split (15%):  116 Records (75 Class 0 / 41 Class 1)
               └── Transform using Train Medians & Scaler; locked final evaluation
```

---

## Section D — Data Preprocessing

### 1. Training-Only Median Imputation Protocol (Leakage Elimination)
To prevent severe data snooping and optimistic bias, missing value medians were computed **strictly on the 537 training records** after stratified partitioning:

| Biomarker Feature | Fit Train-Only Median ($N=537$) | Contaminated Full-Cohort Median ($N=768$) | Preprocessing Action Taken |
| :--- | :---: | :---: | :--- |
| **`Glucose`** | **117.0 $\text{mg/dL}$** | 117.0 $\text{mg/dL}$ | Invalid zeros replaced with train median |
| **`BloodPressure`** | **72.0 $\text{mmHg}$** | 72.0 $\text{mmHg}$ | Invalid zeros replaced with train median |
| **`SkinThickness`** | **29.0 $\text{mm}$** | 23.0 $\text{mm}$ | Invalid zeros replaced with train median |
| **`Insulin`** | **126.0 $\mu\text{U/mL}$** | *125.0 $\mu\text{U/mL}$* | **Corrected from 125.0 to 126.0** (Train-only) |
| **`BMI`** | **32.4 $\text{kg/m}^2$** | *32.3 $\text{kg/m}^2$* | **Corrected from 32.3 to 32.4** (Train-only) |

### 2. Feature Standardization Pipeline
- **Standardization (`StandardScaler`):** Fit strictly on imputed training fold:
  $$x_{\text{scaled}} = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}}$$
- **Zero Data Leakage:** The pipeline encapsulates both the scaler and MLPClassifier into an atomic `sklearn.pipeline.Pipeline`, guaranteeing that validation and test partitions are transformed strictly using training statistics.

---

## Section E — Model Architecture

### 1. Selected Deployed Architecture: `Pipeline[StandardScaler, MLPClassifier]`
- **Model Pipeline Type:** Two-stage Scikit-learn Pipeline.
- **Stage 1 (Feature Normalization):** `StandardScaler()` standardizing all 8 continuous metabolic features to zero mean and unit variance.
- **Stage 2 (Classification Engine):** `MLPClassifier`:
  - **Hidden Layer Topology:** Two fully connected hidden layers with 32 and 16 neurons respectively (`hidden_layer_sizes = (32, 16)`).
  - **Activation Function:** Rectified Linear Unit ($\text{ReLU}(z) = \max(0, z)$).
  - **$L_2$ Regularization Penalty:** $\alpha = 0.001$ (`alpha = 0.001`) preventing weight explosion on the small 537-record training fold.
  - **Optimization Algorithm:** Adam optimizer with adaptive moment estimation.
  - **Early Stopping:** Monitored on an internal $15\%$ validation fraction (`validation_fraction = 0.15`, `n_iter_no_change = 15`) with a maximum budget of 300 iterations (`max_iter = 300`).
  - **Convergence:** Model training stopped early at **iteration 48** with final loss of $0.4500$, successfully averting overfitting.

```
[Diabetes Production MLP Pipeline]
Input (8 Features) ──► StandardScaler ──► Dense(8->32, ReLU) ──► Dense(32->16, ReLU) ──► Dense(16->1, Sigmoid) ──► tau=0.2500
```

### 2. Candidate Algorithm Exploration
Phase 6 model comparison benchmarked three distinct model families:
1. **Logistic Regression:** Linear baseline with $L_2$ regularization.
2. **Random Forest Classifier:** 200 trees with maximum depth 10.
3. **Multi-Layer Perceptron (MLP):** 2-hidden layer feed-forward network with early stopping.

---

## Section F — Training Methodology

- **Framework:** Scikit-learn `1.7.0` / Python `3.11+`.
- **Training Duration:** 0.308 seconds (CPU execution).
- **Optimization Parameters:**
  - Initial learning rate: $\eta = 0.001$
  - Exponential decay rates: $\beta_1 = 0.9, \beta_2 = 0.999$
  - Numerical stability constant: $\epsilon = 1 \times 10^{-8}$
- **Validation Strategy:** Stratified hold-out validation partition ($N=115$) used exclusively for candidate ranking and operating threshold optimization.

---

## Section G — Model Evaluation

### 1. Candidate Model Comparison (Held-Out Test Partition, $N=116$)
Verified against `artifacts/diabetes/training_report.json`:

| Model Paradigm | Operating Threshold | Sensitivity (Recall) | Specificity | Precision | F1-Score | ROC-AUC | PR-AUC | Brier Score | ECE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | $\tau = 0.50$ | 51.22% | 92.00% | 77.78% | 0.6176 | **0.8624** | **0.7832** | **0.1493** | 0.0891 |
| **Random Forest** | $\tau = 0.50$ | 48.78% | 89.33% | 71.43% | 0.5797 | 0.8332 | 0.7682 | 0.1568 | 0.0914 |
| **MLP (Default)** | $\tau = 0.50$ | 39.02% | **92.00%** | 72.73% | 0.5079 | 0.8267 | 0.7205 | 0.1647 | 0.1037 |
| **MLP (Tuned)** | **$\tau = 0.25$** | **80.49%** | **68.00%** | **57.89%** | **0.6735** | **0.8267** | **0.7205** | **0.1647** | **0.1037** |

### 2. Comprehensive Test Confusion Matrix (Tuned MLP, $\tau = 0.25$)
- **Total Held-Out Test Patients ($N=116$):** 41 diabetic, 75 non-diabetic.
- **True Positives ($\text{TP}$):** 33 (80.49% sensitivity)
- **False Negatives ($\text{FN}$):** 8 (missed diabetic patients)
- **True Negatives ($\text{TN}$):** 51 (68.00% specificity)
- **False Positives ($\text{FP}$):** 24 (flagged for laboratory testing)
- **Precision (PPV):** $\frac{33}{33 + 24} = 57.89\%$
- **Negative Predictive Value (NPV):** $\frac{51}{51 + 8} = 86.44\%$

### 3. Probability Calibration Analysis (Decile Binning)
- **Expected Calibration Error (ECE):** **$0.1037$** ($10.37\%$ average probabilistic deviation).
- **Clinical Assessment:** ECE slightly exceeds the primary clinical target of $< 0.100$. This occurs primarily in the moderate probability range ($0.20 - 0.45$) where the model underestimates empirical risk.
- **Transparent Limitation Disclosure:** Disclosed as an empirical methodological limitation in the manuscript, justifying why MediMind maps raw probabilities to discrete risk bands rather than presenting uncalibrated raw percentages to patients.

---

## Section H — Threshold and Prediction Interpretation

### 1. Operating Decision Threshold ($\tau = 0.2500$)
- **Selection Rationale:** Under default thresholding ($\tau = 0.50$), the MLP model suffered from severe false-negative failure, capturing only $39.02\%$ of diabetic patients (missing 25 out of 41 cases). In screening, missing undiagnosed diabetes leads to unmitigated microvascular complications (retinopathy, nephropathy, neuropathy).
- **Validation Sweep:** Sweeping candidate thresholds on the validation fold ($N=115$) identified $\tau = 0.2500$ as the optimal operating cutoff, boosting sensitivity to **87.50% on validation** and **80.49% on held-out test data** while preserving an acceptable specificity of **68.00%** (exceeding the $\ge 60\%$ clinical floor).

### 2. Clinical Risk Banding
- **High Risk ($P \ge 0.50$):** High metabolic risk; physician-in-the-loop review and expedited $\text{HbA}_{1\text{c}}$ testing required.
- **Moderate Risk ($0.25 \le P < 0.50$):** Operating screening band; triggers primary care dietary counseling and repeat screening.
- **Low Risk ($P < 0.25$):** Low metabolic probability; standard annual checkup.

---

## Section I — Safety and Risk Analysis

1. **False-Negative Risk (Clinical Impact):** 8 missed diabetic patients in the test partition. In patients with borderline fasting glucose ($< 120\text{ mg/dL}$) and normal BMI, the model may underpredict risk. Clinical disclaimers require that patient symptoms (polydipsia, polyuria, unexplained weight loss) override model outputs.
2. **False-Positive Risk (Operational Impact):** 24 non-diabetic patients flagged for secondary screening. Secondary testing involves standard, safe laboratory blood draws ($\text{HbA}_{1\text{c}}$) with negligible physical risk.
3. **Severe Missingness in Insulin Feature (48.7%):** Nearly half the training cohort had missing insulin recordings. Imputing with the median (126.0 $\mu\text{U/mL}$) reduces variance. Clinicians must not rely on insulin inputs for diagnostic confirmation.

---

## Section J — Limitations

1. **Demographic & Ethnic Specificity:** The Pima Indians Diabetes Database is derived exclusively from adult Pima Indian females. Pima populations possess unique genetic, dietary, and thrifty-gene metabolic profiles that do not generalize directly to diverse multi-ethnic or male cohorts without local re-calibration.
2. **Small Cohort Scale ($N=768$):** The dataset comprises only 768 total instances, limiting statistical power in complex subgroup breakdowns.
3. **Cross-Sectional Diagnosis:** Evaluates point-in-time diabetic status rather than longitudinal conversion from pre-diabetes.
4. **Calibration Target Breach:** ECE of 0.1037 slightly exceeds the 0.100 target, requiring categorical risk bands and physician interpretation.

---

## Section K — Deployment and Operational Status

- **Operational Status:** **Production Validated / Production Baseline**
- **Inference Service Binding:** `ai-prediction-service/app/services/diabetes_service.py`
- **Active Model Checkpoint:** `artifacts/diabetes/best_model.joblib` (29.5 KB, MD5 `7bf85e9a43d9a38e40c8f92e0d0ac4cd`)
- **API Endpoint:** `POST /api/ai/diabetes` (Port 5008, proxied via API Gateway on Port 5000)
- **Event Streaming:** Emits `DIABETES` prediction events to Kafka topic `medimind.predictions`.

---

## Section L — Reproducibility & Artifact Inventory

| Component | Repository Path | Description / Checksum |
| :--- | :--- | :--- |
| **Production Model Checkpoint** | `ai-prediction-service/artifacts/diabetes/best_model.joblib` | 30,193 bytes, MD5 `7bf85e9a43d9a38e40c8f92e0d0ac4cd` |
| **Secondary Checkpoint File** | `ai-prediction-service/artifacts/diabetes/mlp.joblib` | 30,193 bytes, identical MD5 hash |
| **Inference Service** | `ai-prediction-service/app/services/diabetes_service.py` | Line 24: `THRESHOLD = 0.25`, Line 26: `MODEL_PATH` |
| **Preprocessing Module** | `ai-prediction-service/app/models/diabetes/diabetes_preprocessing.py` | Biological zero replacement & train medians |
| **Training Pipeline** | `ai-prediction-service/app/models/diabetes/diabetes_training.py` | Full imputation & MLP pipeline training |
| **Training Report** | `ai-prediction-service/artifacts/diabetes/training_report.json` | Complete evaluation logs, confusion matrices |
| **Raw Dataset** | `ai-prediction-service/test-dataset/Diabetes/diabetes.csv` | 768 patient records (23.3 KB) |

---

## Section M — Model Card Evidence Register

| Claim / Metric | Supporting Repository Source File | Evidence Location in File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Selected Model (MLP Pipeline)** | `ai-prediction-service/artifacts/diabetes/best_model.joblib` | Serialized estimator object | Python Object Introspection | **VERIFIED** |
| **Model Version (0.1.0)** | `ai-prediction-service/app/services/diabetes_service.py` | Line 23 (`MODEL_VERSION = "0.1.0"`) | Direct Source Inspection | **VERIFIED** |
| **Tuned Threshold ($\tau = 0.25$)** | `ai-prediction-service/app/services/diabetes_service.py` | Line 24 (`THRESHOLD = 0.25`) | Direct Source Inspection | **VERIFIED** |
| **Checkpoint MD5 Hash** | `artifacts/diabetes/best_model.joblib` | Filesystem binary | Cryptographic MD5 Calculation | **VERIFIED** |
| **Dataset Record Count (768)** | `diabetes.csv` | Total line count minus header | CSV Line Count Verification | **VERIFIED** |
| **Biological Zeros (Insulin: 374, Skin: 227)** | `training_report.json` | `preparation.biological_zeros_before_imputation` | JSON Report Inspection | **VERIFIED** |
| **Train-Only Medians (Insulin: 126.0, BMI: 32.4)**| `training_report.json` | `training_imputation_medians` dictionary | JSON Report Inspection | **VERIFIED** |
| **Stratified Split Sizes (537/115/116)** | `training_report.json` | `split_sizes` dictionary | JSON Report Inspection | **VERIFIED** |
| **Test Recall ($\tau = 0.25$: 80.49%)** | `training_report.json` | `models.mlp.tuned_test.recall` (33 / 41 TP) | JSON Evaluation Log | **VERIFIED** |
| **Test Specificity ($\tau = 0.25$: 68.00%)** | `training_report.json` | `models.mlp.tuned_test.specificity` (51 / 75 TN)| JSON Evaluation Log | **VERIFIED** |
| **Test Precision ($\tau = 0.25$: 57.89%)** | `training_report.json` | `models.mlp.tuned_test.precision` (33 / 57) | Reconciled Confusion Matrix | **VERIFIED** |
| **Test ROC-AUC / PR-AUC (0.8267 / 0.7205)** | `training_report.json` | `models.mlp.tuned_test` | JSON Evaluation Log | **VERIFIED** |
| **Expected Calibration Error (0.1037)** | `training_report.json` | `calibration.expected_calibration_error` | Calibration Decile Audit | **VERIFIED** |
| **Confusion Matrix (51/24/8/33)** | `training_report.json` | `models.mlp.tuned_test.confusion_matrix` | Reconciled Confusion Matrix | **VERIFIED** |
| **Discrepancy Correction vs Legacy Card** | `DIABETES_MODEL_CARD.md` vs `best_model.joblib` | Line 9 (claims RF) vs actual MLP checkpoint | Discrepancy Reconciliation | **VERIFIED** |
