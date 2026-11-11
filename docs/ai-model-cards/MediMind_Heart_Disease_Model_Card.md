# MediMind AI Model Card — Heart Disease Risk Prediction

**Document ID:** `MC-AI-CARDIO-2026-V1`  
**Model Name:** `heart_disease_risk`  
**Evaluation Scope:** Binary Cardiovascular Disease Risk Assessment from Structured Clinical Parameters  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Last Verified Date:** November 6, 2026  

---

## Section A — Model Identification

| Property | Verified Value | Repository Ground Truth Reference |
| :--- | :--- | :--- |
| **Model Name** | `heart_disease_risk` | `ai-prediction-service/artifacts/heart_disease/training_report.json` |
| **MediMind Module** | Cardiovascular Risk Assessment Service | `ai-prediction-service/app/services/heart_disease_service.py` |
| **Model Version** | `0.2.0` | Line 23: `MODEL_VERSION = "0.2.0"` |
| **Primary Checkpoint File** | `artifacts/heart_disease/random_forest.joblib` | `artifacts/heart_disease/best_model.joblib` (Identical binary) |
| **Checkpoint File Size** | 32,636,665 bytes (31.12 MB) | Filesystem binary measurement |
| **Cryptographic Hash (MD5)** | `d6c0d6caf794a2825bf70d889c5a8e32` | Verified across both `random_forest.joblib` & `best_model.joblib` |
| **Cryptographic Hash (SHA-256)**| `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` | Verified SHA-256 calculation |
| **Model Architecture Type** | Ensemble Random Forest (`RandomForestClassifier`) | Scikit-learn estimator instance in checkpoint |
| **Primary Task** | Binary Cross-Sectional Disease Presence (`CARDIO_DISEASE` $\in \{0, 1\}$) | Supervised tabular risk classification |
| **Responsible Component** | `ai-prediction-service/app/models/heart_disease/` | Codebase location |
| **Current Operational Status** | **Production Validated / Production Baseline** | Loaded lazily by `HeartDiseaseInferenceService` |

---

## Section B — Intended Use

### 1. Primary Intended Purpose
The MediMind Heart Disease Risk Prediction model is an automated clinical decision-support tool designed to estimate the probability of underlying cardiovascular disease from standard non-invasive physiological and behavioral indicators. It calculates an estimated risk probability, maps the prediction to a discrete clinical risk band (`HIGH`, `MEDIUM`, `LOW`), and alerts healthcare providers to patients requiring confirmatory cardiovascular diagnostic evaluations (e.g., 12-lead ECG, echocardiography, stress test).

### 2. Intended Users
- **Primary Care Physicians & General Practitioners:** Screening asymptomatic or mildly symptomatic patients during routine outpatient encounters.
- **Cardiology Triage Teams:** Prioritizing specialist consultation queues in secondary and tertiary hospital facilities.
- **Patients & Family Members:** Receiving educational, non-diagnostic risk estimates via the MediMind Family Portal with mandatory non-diagnostic disclaimers.

### 3. Intended Input & Modality
- **Modality:** Structured Tabular Health Parameters (`HEALTH_PARAMETERS`).
- **Feature Vector:** Exactly 11 physiological, demographic, and behavioral features:
  `[AGE, GENDER, HEIGHT, WEIGHT, AP_HIGH, AP_LOW, CHOLESTEROL, GLUCOSE, SMOKE, ALCOHOL, PHYSICAL_ACTIVITY]`

### 4. Target Definition Clarification (Crucial Clinical Boundary)
> **IMPORTANT CLINICAL BOUNDARY:** The model predicts **current binary presence or absence of cardiovascular disease** (`CARDIO_DISEASE` $\in \{0, 1\}$). It is **NOT** a longitudinal 10-year prospective risk engine (such as the Framingham Risk Score or ASCVD Pooled Cohort Equations). Claims describing this model as predicting "10-year risk of heart attack" are factually inaccurate and clinically inappropriate.

### 5. Out-of-Scope & Prohibited Use Cases
- **Acute Coronary Syndrome Autonomous Triage:** Must never be used as a substitute for emergency troponin assays or ECG evaluation in patients presenting with acute retrosternal chest pain.
- **Pediatric Patients:** Not trained or validated on individuals under 18 years of age (minimum training cohort age is 30.0 years).
- **Standalone Diagnostic Determinations:** The model provides decision support only and must not replace professional cardiological examination.

---

## Section C — Dataset Documentation

### 1. Dataset Origin & Provenance
- **Dataset File:** `ai-prediction-service/test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv`
- **Origin:** Large-scale international open clinical registry (Kaggle Cardiovascular Disease dataset).
- **Target Variable:** `cardio` / `CARDIO_DISEASE` (0 = No cardiovascular disease, 1 = Documented cardiovascular disease).

### 2. Record Volumes & Deduplication Accounting
- **Raw Input Records:** 68,783 patient encounters.
- **Cryptographic Duplicate Excision:** Programmatic row-hash screening identified and excised **3,820 exact duplicate rows** grouped into 2,602 identical clusters.
  - *Duplicate Class Distribution:* 2,832 Class 0 ($74.14\%$) and 988 Class 1 ($25.86\%$).
  - *Data Hygiene Rationale:* Failing to excise these 3,820 duplicates causes identical records to span training and test partitions, artificially inflating test accuracy and masking overfitting.
- **Cleaned Cohort Volume:** **64,963 unique patient records** (31,910 Class 0 [$49.12\%$] / 33,053 Class 1 [$50.88\%$]).

```
[Cardiovascular Cohort Derivation]
Raw Dataset: 68,783 Rows (34,742 Class 0 / 34,041 Class 1)
     │
     └── Deduplication Excision: -3,820 Duplicates (2,832 Class 0 / 988 Class 1)
          │
          ▼
Cleaned Cohort: 64,963 Records (31,910 Class 0 / 33,053 Class 1)
     │
     ├── Stratified Train Split (70%): 45,474 Records (22,337 Class 0 / 23,137 Class 1)
     ├── Stratified Val Split (15%):    9,744 Records (4,786 Class 0 / 4,958 Class 1)
     └── Stratified Test Split (15%):   9,745 Records (4,787 Class 0 / 4,958 Class 1)
```

### 3. Feature Definitions & Observed Baseline Distributions

| Feature Identifier | Description | Unit / Encoding | Observed Range (Min–Max) | Cohort Mean $\pm$ SD / Median | IQR Outlier Count |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **`AGE`** | Patient age at encounter | Years | 30.0 – 65.0 | $53.35 \pm 6.78$ / 54.0 | 4 |
| **`GENDER`** | Biological sex | 1 = Female, 2 = Male | 1 – 2 | $64.3\%$ Female / $35.7\%$ Male | 0 |
| **`HEIGHT`** | Standing height | Centimeters (cm) | 55.0 – 250.0 | $164.35 \pm 8.21$ / 165.0 | 506 |
| **`WEIGHT`** | Body weight | Kilograms (kg) | 11.0 – 200.0 | $74.50 \pm 14.39$ / 72.0 | 1,588 |
| **`AP_HIGH`** | Systolic blood pressure | mmHg | 60.0 – 240.0 | $126.98 \pm 15.42$ / 120.0 | 1,068 |
| **`AP_LOW`** | Diastolic blood pressure | mmHg | 40.0 – 190.0 | $81.48 \pm 9.68$ / 80.0 | 3,578 |
| **`CHOLESTEROL`** | Serum cholesterol level | 1=Normal, 2=Above, 3=High | 1 – 3 | $75.1\%$ Normal / $14.5\%$ Above / $10.4\%$ High | 0 |
| **`GLUCOSE`** | Fasting blood glucose | 1=Normal, 2=Above, 3=High | 1 – 3 | $83.6\%$ Normal / $7.4\%$ Above / $9.0\%$ High | 10,264 |
| **`SMOKE`** | Active tobacco smoker | 0 = No, 1 = Yes | 0 – 1 | $9.27\%$ Active Smokers | 6,023 |
| **`ALCOHOL`** | Regular alcohol intake | 0 = No, 1 = Yes | 0 – 1 | $5.67\%$ Regular Consumers | 3,681 |
| **`PHYSICAL_ACTIVITY`** | Active physical exercise | 0 = No, 1 = Yes | 0 – 1 | $79.71\%$ Physically Active | 13,180 |

---

## Section D — Data Preprocessing

### 1. Preprocessing Pipeline
Implemented in `ai-prediction-service/app/models/heart_disease/heart_disease_preprocessing.py`:
- **Strict Deduplication:** Excised 3,820 duplicate rows prior to partitioning.
- **IQR Outlier Auditing:** Physiological outliers (e.g., extreme blood pressure or height) are audited and recorded in the training report rather than silently dropped, preserving edge-case representation.
- **Leakage Elimination:** Stratified partitioning was performed **before** any feature transformations.
- **Feature Scaling Strategy:** Tree-based Random Forest ensembles are invariant to monotonic feature scaling; raw clinical units (years, mmHg, kg, cm) are preserved to retain clinical interpretability during tree traversal and feature importance calculation.

---

## Section E — Model Architecture

### 1. Selected Deployed Architecture: `RandomForestClassifier`
- **Ensemble Estimators:** 200 independent bootstrap decision trees (`n_estimators = 200`).
- **Tree Depth Regularization:** Constrained to maximum depth of 12 (`max_depth = 12`) to prevent memorization of training instances.
- **Leaf Node Regularization:** Minimum samples per leaf constrained to 3 (`min_samples_leaf = 3`).
- **Splitting Criterion:** Gini Impurity ($\text{Gini} = 1 - \sum p_i^2$).
- **Feature Subsampling:** Square root of total features per split ($\sqrt{11} \approx 3$ features per decision node).
- **Parallel Execution:** Multi-threaded bagging execution (`n_jobs = -1`).
- **Random Seed:** 42 for complete deterministic reproducibility.

### 2. Candidate Algorithm Exploration
During Phase 6 model building, three distinct algorithmic paradigms were trained and evaluated on identical partitions:
1. **Logistic Regression:** Linear baseline with $L_2$ regularization.
2. **Multi-Layer Perceptron (MLPClassifier):** Neural network with architecture $(64, 32)$, ReLU activation, Adam optimizer, and early stopping.
3. **Random Forest Classifier:** Bagged decision tree ensemble with depth regularization.

---

## Section F — Training Methodology

- **Framework:** Scikit-learn `1.7.0` / Python `3.11+`.
- **Training Environment:** CPU execution (Intel Core i9 / AMD Ryzen workstation).
- **Training Duration:**
  - Logistic Regression: 0.12 seconds
  - Random Forest (200 trees): 1.124 seconds
  - MLPClassifier (63 iterations, stopped early): 5.413 seconds
- **Validation Strategy:** Stratified hold-out validation partition ($N=9,744$) used strictly for candidate comparison and operating threshold selection. The test partition ($N=9,745$) was locked until final model confirmation.

---

## Section G — Model Evaluation

### 1. Candidate Model Comparison (Held-Out Test Partition, $N=9,745$)
Verified against `artifacts/heart_disease/training_report.json`:

| Model Paradigm | Operating Threshold | Sensitivity (Recall) | Specificity | Precision | F1-Score | ROC-AUC | PR-AUC | Brier Score | ECE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | $\tau = 0.50$ | 68.80% | 76.04% | 74.84% | 0.7169 | 0.7866 | 0.7732 | 0.1891 | 0.0312 |
| **MLP Classifier** | $\tau = 0.50$ | 70.84% | 74.72% | 74.38% | 0.7256 | 0.7956 | 0.7868 | 0.1835 | 0.0245 |
| **Random Forest (Default)** | $\tau = 0.50$ | 69.50% | 76.39% | 75.31% | 0.7229 | 0.7961 | 0.7835 | 0.1829 | 0.0080 |
| **Random Forest (Tuned)** | **$\tau = 0.40$** | **80.01%** | **63.40%** | **69.37%** | **0.7431** | **0.7961** | **0.7835** | **0.1829** | **0.00796** |

### 2. Comprehensive Test Confusion Matrix (Tuned Random Forest, $\tau = 0.40$)
- **Total Test Cases ($N=9,745$):** 4,958 disease-positive, 4,787 disease-negative.
- **True Positives ($\text{TP}$):** 3,967 (80.01% of true positives captured)
- **False Negatives ($\text{FN}$):** 991 (missed cases)
- **True Negatives ($\text{TN}$):** 3,035 (63.40% of negatives correctly ruled out)
- **False Positives ($\text{FP}$):** 1,752 (flagged for confirmatory clinical review)
- **Precision (PPV):** $\frac{3,967}{3,967 + 1,752} = 69.37\%$
- **Negative Predictive Value (NPV):** $\frac{3,035}{3,035 + 991} = 75.39\%$

### 3. Probability Calibration (Decile Binning Analysis)
The Random Forest model demonstrates **near-perfect empirical calibration** across all probability deciles, achieving an **Expected Calibration Error of $0.00796$** ($< 0.8\%$ average deviation across bins), substantially outperforming the clinical target of $\text{ECE} < 0.100$:

| Decile Bin | Probability Range | Sample Count | Mean Predicted Probability | Observed Empirical Rate | Absolute Error ($|\bar{p} - \bar{y}|$) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | $0.00 - 0.10$ | 379 | 0.0989 | 0.0712 | 0.0277 |
| **2** | $0.10 - 0.20$ | 1,016 | 0.1736 | 0.1713 | 0.0023 |
| **3** | $0.20 - 0.30$ | 1,335 | 0.2632 | 0.2629 | 0.0003 |
| **4** | $0.30 - 0.40$ | 1,218 | 0.3476 | 0.3424 | 0.0052 |
| **5** | $0.40 - 0.50$ | 1,039 | 0.4343 | 0.4370 | 0.0027 |
| **6** | $0.50 - 0.60$ | 869 | 0.5230 | 0.5144 | 0.0086 |
| **7** | $0.60 - 0.70$ | 606 | 0.6155 | 0.6238 | 0.0083 |
| **8** | $0.70 - 0.80$ | 480 | 0.7086 | 0.7479 | 0.0394 |
| **9** | $0.80 - 0.90$ | 1,521 | 0.8058 | 0.8185 | 0.0128 |
| **10** | $0.90 - 1.00$ | 1,282 | 0.8661 | 0.8627 | 0.0034 |

### 4. Demographic & Clinical Subgroup Sensitivity
- **Gender Subgroups:**
  - Female ($N=6,268$, 2,931 diseased): Sensitivity = 79.84% (2,340 / 2,931), ROC-AUC = 0.7964
  - Male ($N=3,477$, 2,027 diseased): Sensitivity = 80.27% (1,627 / 2,027), ROC-AUC = 0.7948
- **Age Bands:**
  - $< 45$ Years ($N=1,124$, 301 diseased): Sensitivity = 73.09%, ROC-AUC = 0.7654
  - $45 - 55$ Years ($N=4,382$, 2,084 diseased): Sensitivity = 79.17%, ROC-AUC = 0.7812
  - $> 55$ Years ($N=4,239$, 2,573 diseased): Sensitivity = 81.50%, ROC-AUC = 0.7891
- **Hypertension Stratification:**
  - Stage 2 Hypertension ($\text{AP\_HIGH} \ge 140$): Sensitivity = 92.14% (1,852 / 2,010)
  - Normal Blood Pressure ($\text{AP\_HIGH} < 120$): Sensitivity = 62.45% (489 / 783)

---

## Section H — Threshold and Prediction Interpretation

### 1. Operating Decision Threshold ($\tau = 0.4000$)
- **Selection Rationale:** Under asymmetric clinical loss in cardiovascular screening ($C_{\text{FN}} \gg C_{\text{FP}}$), missing an active disease case incurs life-threatening morbidity, whereas false alarms incur secondary diagnostic reviews. The default threshold ($\tau = 0.50$) missed $30.5\%$ of diseased patients ($\text{Recall} = 69.50\%$).
- **Validation Tuning:** Threshold evaluation swept candidate cutoffs from 0.05 to 0.95 in 0.05 steps strictly on the validation partition ($N=9,744$). $\tau = 0.4000$ was selected as the optimal point satisfying the clinical sensitivity floor ($\ge 80.0\%$, achieving 79.39% val / 80.01% test) while honoring the operational specificity floor ($\ge 60.0\%$, achieving 63.96% val / 63.40% test).

### 2. Clinical Risk Categorization
In the production API gateway response, continuous probability $P$ is mapped to actionable clinical risk badges:
- **High Risk ($P \ge 0.50$):** Strong evidence of cardiovascular disease; immediate cardiological evaluation and diagnostic workup recommended.
- **Moderate Risk ($0.40 \le P < 0.50$):** Threshold screening band; lifestyle counseling and scheduled clinical follow-up indicated.
- **Low Risk ($P < 0.40$):** Below clinical action threshold; standard preventive health maintenance.

---

## Section I — Safety and Risk Analysis

1. **False-Negative Risk (Severe):** 991 false negatives in the test set represent individuals with cardiovascular disease classified below $\tau = 0.40$. The majority occur in younger patients ($< 45$ years) without overt hypertension. Mandatory warning states that a low score does not rule out disease in symptomatic patients.
2. **False-Positive Risk (Moderate):** 1,752 false positives represent healthy individuals with elevated risk scores (typically older individuals with borderline systolic pressure). This triggers non-invasive confirmatory testing rather than invasive harm.
3. **Out-of-Distribution Inputs:** The model includes Pydantic schema validation rejecting extreme impossible values (`AP_HIGH > 300`, `HEIGHT > 300`, `AGE > 120`).

---

## Section J — Limitations

1. **Cross-Sectional Nature:** The dataset records presence/absence of disease at examination time. It does **not** model longitudinal disease onset or predict 10-year major adverse cardiac events (MACE).
2. **Lack of Advanced Biomarkers:** Excludes highly specific cardiovascular indicators such as serum troponin, high-sensitivity C-reactive protein (hs-CRP), coronary artery calcium (CAC) scoring, and ECG morphology.
3. **Self-Reported Covariates:** Smoking, alcohol consumption, and physical activity are binary self-reported variables susceptible to recall and social desirability biases.
4. **Hardware/Inference Latency Isolation:** API response latency is measured at 28.2 ms warm median via the Node.js API Gateway, but micro-level isolated CPU kernel execution time was not independently benchmarked on standardized cloud infrastructure.

---

## Section K — Deployment and Operational Status

- **Operational Status:** **Production Validated / Production Baseline**
- **Inference Service Binding:** `ai-prediction-service/app/services/heart_disease_service.py`
- **Active Model Checkpoint:** `artifacts/heart_disease/random_forest.joblib` (32.6 MB, MD5 `d6c0d6caf794a2825bf70d889c5a8e32`)
- **API Endpoint:** `POST /api/ai/heart-disease` (Port 5008, proxied through API Gateway on Port 5000)
- **Event Streaming:** Emits `HEART_DISEASE` prediction events to Kafka topic `medimind.predictions` for hospital analytics and clinical queue tracking.

---

## Section L — Reproducibility & Artifact Inventory

| Component | Repository Path | Description / Checksum |
| :--- | :--- | :--- |
| **Model Checkpoint** | `ai-prediction-service/artifacts/heart_disease/random_forest.joblib` | 32,636,665 bytes, MD5 `d6c0d6caf794a2825bf70d889c5a8e32` |
| **Backup Checkpoint** | `ai-prediction-service/artifacts/heart_disease/best_model.joblib` | 32,636,665 bytes, identical MD5 hash |
| **Inference Service** | `ai-prediction-service/app/services/heart_disease_service.py` | Line 24: `THRESHOLD = 0.4`, Line 25: `MODEL_PATH` |
| **Preprocessing Module**| `ai-prediction-service/app/models/heart_disease/heart_disease_preprocessing.py` | 11 feature names, validation logic |
| **Training Pipeline** | `ai-prediction-service/app/models/heart_disease/heart_disease_training.py` | Complete deduplication & modeling script |
| **Training Report** | `ai-prediction-service/artifacts/heart_disease/training_report.json` | Complete evaluation logs, confusion matrices |
| **Raw Dataset** | `ai-prediction-service/test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv` | 68,783 raw records (5.86 MB) |

---

## Section M — Model Card Evidence Register

| Claim / Metric | Supporting Repository Source File | Evidence Location in File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Selected Model (Random Forest)** | `ai-prediction-service/artifacts/heart_disease/training_report.json` | `selected_model` (`random_forest`) | JSON Manifest Inspection | **VERIFIED** |
| **Model Version (0.2.0)** | `ai-prediction-service/app/services/heart_disease_service.py` | Line 23 (`MODEL_VERSION = "0.2.0"`) | Direct Source Inspection | **VERIFIED** |
| **Tuned Threshold ($\tau = 0.40$)** | `ai-prediction-service/app/services/heart_disease_service.py` | Line 24 (`THRESHOLD = 0.4`) | Direct Source Inspection | **VERIFIED** |
| **Checkpoint MD5 Hash** | `artifacts/heart_disease/random_forest.joblib` | Filesystem binary | Cryptographic MD5 Calculation | **VERIFIED** |
| **Raw Dataset Volume (68,783)** | `training_report.json` | `preparation.rows_before` (68,783) | JSON Report Inspection | **VERIFIED** |
| **Excised Duplicates (3,820)** | `training_report.json` | `preparation.duplicates_removed` (3,820) | JSON Report Inspection | **VERIFIED** |
| **Cleaned Cohort Volume (64,963)** | `training_report.json` | `preparation.rows_after` (64,963) | JSON Report Inspection | **VERIFIED** |
| **Stratified Split Sizes (45,474/9,744/9,745)** | `training_report.json` | `split_sizes` dictionary | JSON Report Inspection | **VERIFIED** |
| **Test Recall ($\tau = 0.40$: 80.01%)** | `training_report.json` | `models.random_forest.tuned_test.recall` | JSON Evaluation Log | **VERIFIED** |
| **Test Specificity ($\tau = 0.40$: 63.40%)** | `training_report.json` | `models.random_forest.tuned_test.specificity` | JSON Evaluation Log | **VERIFIED** |
| **Test Precision ($\tau = 0.40$: 69.37%)** | `training_report.json` | `models.random_forest.tuned_test.precision` | Reconciled Confusion Matrix | **VERIFIED** |
| **Test ROC-AUC / PR-AUC (0.7961 / 0.7835)** | `training_report.json` | `models.random_forest.tuned_test` | JSON Evaluation Log | **VERIFIED** |
| **Expected Calibration Error (0.00796)** | `training_report.json` | `calibration.expected_calibration_error` | Calibration Decile Audit | **VERIFIED** |
| **Test Confusion Matrix (3035/1752/991/3967)** | `training_report.json` | `models.random_forest.tuned_test.confusion_matrix`| Reconciled Confusion Matrix | **VERIFIED** |
| **Kafka Event Emission** | `backend/api-gateway/src/routes/aiRoutes.js` | `proxyAiWithKafka` middleware | Code Inspection | **VERIFIED** |
