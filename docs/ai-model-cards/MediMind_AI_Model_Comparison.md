# MediMind — Cross-Module AI Model Comparison & Architectural Analysis

**Document ID:** `COMP-AI-MODELS-2026-V1`  
**Evaluation Scope:** Unified Comparative Synthesis Across All Four MediMind Clinical AI Modules  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Last Verified Date:** November 6, 2026  

---

## 1. Unified Cross-Module Comparison Matrix

The table below provides an evidence-based comparison across the four clinical AI modules in MediMind. All cells are populated strictly from verified repository source artifacts, training logs, and executable inference services.

| Comparison Area | Fracture Detection (Production / Research Exp 8A) | Heart Disease Risk Prediction | Diabetes Risk Prediction | General Health Assessment / NLP Triage |
| :--- | :--- | :--- | :--- | :--- |
| **Model Type** | **Production:** Deep Convolutional Neural Network (Single-view ResNet-18)<br>**Research:** Dual-Stream ROI-Aligned Fusion Network (`DualViewROIResNet18`) | Bagged Decision Tree Ensemble (`RandomForestClassifier`, 200 trees) | Multi-Layer Perceptron Pipeline (`Pipeline[StandardScaler, MLPClassifier]`) | Deterministic Clinical Rule & Natural Language Triage Engine (`GeneralHealthNLPEngine`) |
| **Input Modality** | Digital Musculoskeletal Plain Radiographs (PNG/JPEG/DICOM, resized $224 \times 224$ or $256 \times 256$ ROI) | Structured Tabular Health Parameters (11 numerical/categorical features) | Structured Tabular Health Parameters (8 numerical/metabolic features) | Unstructured Free-Text Clinical Descriptions (English, Hinglish, Telugu code-mixing) |
| **Dataset & Scale** | **Production:** FracAtlas (4,083 radiographs; 1,200 train / 612 val / 613 test), pretrained on Stanford MURA v1.1 (2,869 radiographs)<br>**Research:** GRAZPEDWRI-DX (2,318 paired studies; 4,636 radiographs) + Normal Controls (251) + Shenzhen PediURF (1,053) | Kaggle Cardiovascular Disease Dataset (68,783 raw $\to$ 3,820 duplicates excised $\to$ 64,963 clean; 45,474 train / 9,744 val / 9,745 test) | UCI Pima Indians Diabetes Database (768 records; 537 train / 115 val / 116 test; Pima Indian females $\ge 21$ years) | Clinical Triage Test Collections (70 total test cases: Baseline 30, Advanced 40; 69 Pytest assertions across 4 test suites) |
| **Model Architecture** | **Production:** ResNet-18 backbone (11.2M params) + Linear Head (`Dropout(0.3) -> Linear(512->1)`)<br>**Research:** Frozen YOLOv8n detector + Twin ResNet-18 Encoders + Fusion Head (`Linear(1026->256) -> Dropout(0.3) -> Linear(256->1)`, 11.44M params) | 200 Trees, Max Depth 12, Min Samples Leaf 3, Gini Impurity split criterion, subsampling $\sqrt{11} \approx 3$ features per node | 2 Dense Hidden Layers $(32, 16)$, ReLU activation, $L_2$ regularizer $\alpha=0.001$, Adam optimizer, early stopping at iteration 48 | Two-Tier Hybrid Architecture: Tier 1 Deterministic Red-Flag Safety Override + Tier 2 Concept Extraction, 50-char Negation Parsing, Severity Amplification |
| **Target & Clinical Output** | **Production:** Binary Fracture Flag (`possibleFracture: true/false`), Probability Score $[0, 1]$, Risk Badge (`HIGH`/`LOW`)<br>**Research:** Dual-view cortical fracture status, orthogonal lateral rescue tracking | Cross-sectional presence of cardiovascular disease (`CARDIO_DISEASE` $\in \{0, 1\}$), Probability Score, Risk Badge (`HIGH`/`MED`/`LOW`) | Cross-sectional presence of diabetes mellitus (`Outcome` $\in \{0, 1\}$), Probability Score, Risk Badge (`HIGH`/`MED`/`LOW`) | Categorical Urgency (`EMERGENCY`, `MEDICAL_EVALUATION_RECOMMENDED`, `SELF_CARE`, `REVIEW_REQUIRED`), Risk Score $[0, 1]$, Guidance |
| **Preprocessing & Hygiene** | Magic byte validation, bilinear interpolation ($224 \times 224$), channel replication to 3-ch RGB, ImageNet normalization; ROI cropping in Exp 8A | Cryptographic duplicate excision (-3,820 rows), IQR outlier auditing (no clipping), zero-leakage stratified 70/15/15 partitioning | Invalidation of 5 biological zeros; **Train-only median imputation** (Glucose 117.0, BP 72.0, Skin 29.0, Insulin 126.0, BMI 32.4); StandardScaler | Lowercasing, typographical cleaning, 50-char contextual negation lookback/lookahead window, third-person familial filter, idiom mapping |
| **Evaluation Methodology** | Stratified hold-out test set ($N=613$ FracAtlas); Multi-view synergy state audit ($N=350$ GRAZ); Normal control stress-test ($N=251$); Multi-center external validation ($N=1,053$) | Stratified hold-out test set ($N=9,745$); Decile calibration binning; Demographic and hypertension subgroup sensitivity audits | Stratified hold-out test set ($N=116$); Decile calibration binning; Comparison against Logistic Regression and Random Forest candidates | Automated programmatic testing on 70 structured Excel clinical scenarios + 40+ linguistic edge-case tests in `test_robustness.py` |
| **Main Performance Metrics** | **Production ($\tau=0.18$):** Sensitivity 96.26% (103/107), Spec 63.64%, Prec 35.89%, NPV 98.77%, ROC-AUC 0.9244, PR-AUC 0.7843, Brier 0.0896, ECE 0.1021<br>**Research Exp 8A ($\tau=0.01$):** Sensitivity 95.18% (237/249), Spec 75.25%, ROC-AUC 0.9586, PR-AUC 0.9860, Brier 0.0811, ECE 0.0897; 24 Lateral Rescues; Normal Spec 87.25%; Shenzhen Sens 94.59% | **Tuned RF ($\tau=0.40$):** Sensitivity 80.01% (3,967/4,958), Specificity 63.40% (3,035/4,787), Precision 69.37%, F1 0.7431, ROC-AUC 0.7961, PR-AUC 0.7835, Brier 0.1829, **ECE 0.00796 (< 0.8% error)** | **Tuned MLP ($\tau=0.25$):** Sensitivity 80.49% (33/41), Specificity 68.00% (51/75), Precision 57.89%, F1 0.6735, ROC-AUC 0.8267, PR-AUC 0.7205, Brier 0.1647, ECE 0.1037 | **Empirical Test Suite:** 100.00% Accuracy on Baseline Dataset (29/29 valid passed); 100.00% Accuracy on Advanced Dataset (40/40 passed); 69/69 Pytest assertions passed |
| **Threshold Configuration** | **Production:** $\tau = 0.1800$ (FracAtlas validation sweep enforcing Recall $\ge 95\%$)<br>**Research:** $\tau = 0.0100$ (GRAZ validation sweep enforcing Recall $\ge 90\%$) | **$\tau = 0.4000$** (Validation sweep enforcing Recall $\ge 80.0\%$ with Specificity floor $\ge 60.0\%$) | **$\tau = 0.2500$** (Validation sweep enforcing Recall $\ge 80.0\%$ with Specificity floor $\ge 60.0\%$) | **Deterministic Tier Mapping:** Red Flag triggers `EMERGENCY` (Score 0.94, Conf 0.92); $\ge 2$ Moderate triggers `MEDICAL_EVALUATION`; Mild triggers `SELF_CARE` |
| **Safety Mechanisms** | High rule-out NPV (98.77%); mandatory non-diagnostic disclaimer; threshold shifted below 0.50 to minimize missed fractures; Exp 8A ROI gating | Asymmetric loss thresholding ($\tau = 0.40$); near-perfect probability calibration (ECE < 0.8%); discrete categorical risk badges; Pydantic vital sign ranges | Sensitivity safety floor ($\tau = 0.25$ achieves 80.49% test recall); mandatory clinical review disclaimer; early stopping preventing memorization | **Deterministic Red-Flag Override Layer:** Zero stochastic drift on emergency symptoms; suicide crisis intervention hotline escalation; pediatric fever rules |
| **Current Operational Status** | **Production Baseline (Active Serving)**<br>*(Exp 8A is Research-Only)* | **Production Validated / Production Baseline** | **Production Validated / Production Baseline** | **Production Validated / Production Baseline** |
| **Main Limitation** | **Production:** Whole-image representation lacks ROI gating; unvalidated for pediatric growth plates.<br>**Exp 8A:** Offline research artifact; no normal controls in Shenzhen external benchmark. | Cross-sectional presence only (NOT a longitudinal 10-year prospective MACE model); lacks troponin/ECG biomarkers; self-reported lifestyle features. | Small historical cohort ($N=768$ Pima Indian females $\ge 21$); 48.7% missingness in Insulin; ECE 0.1037 slightly exceeds 0.100 target. | Text-only self-reports; lacks physical vital signs; supported languages limited to English, Hinglish, and Telugu code-mixing. |

---

## 2. Cross-Module Architectural & Methodological Analysis

### 2.1 Multi-Modal Input Diversity
MediMind spans three distinct foundational input modalities:
1. **Medical Computer Vision (Spatial Tensors):** High-resolution plain radiograph processing requiring convolutional receptive field engineering and spatial bounding-box gating to decouple pathological lesions from developmental anatomical confounders.
2. **Clinical Tabular Data (Continuous & Categorical Vectors):** Structured physiological measurements requiring data hygiene, biological zero identification, and train-only median imputation to avoid feature leakage.
3. **Clinical Natural Language (Unstructured Text):** Free-text triage requiring deterministic linguistic safeguards, multi-token negation windowing, and cultural code-mixing comprehension.

```
[MediMind Multi-Modal AI Platform Architecture]
                             ┌────────────────────────────────────────────────────────┐
                             │               Node.js API Gateway (Port 5000)          │
                             └───────────────────────────┬────────────────────────────┘
                                                         │
                                  Kafka Events ──────────┼────────── Service Proxy
                                  ('medimind.predictions')│
                                                         ▼
                             ┌────────────────────────────────────────────────────────┐
                             │       FastAPI AI Prediction Service (Port 5008)         │
                             ├────────────────────────────────────────────────────────┤
                             │  • Fracture: ResNet-18 (tau = 0.1800)                  │
                             │  • Heart Disease: Random Forest (tau = 0.4000)         │
                             │  • Diabetes: MLP Pipeline (tau = 0.2500)               │
                             │  • General Health: Deterministic Rule Engine           │
                             └────────────────────────────────────────────────────────┘
```

### 2.2 Decision Threshold Philosophy: Asymmetric Clinical Loss
A foundational principle across all MediMind predictive modules is the **mathematical rejection of default uncalibrated 0.50 decision thresholds**:
- Under classical 0.50 thresholding, all three supervised models suffered from severe false-negative collapse:
  - Fracture Baseline test recall at $\tau=0.50$: only $74.2\%$ (missing 1 in 4 fractures).
  - Heart Disease test recall at $\tau=0.50$: only $69.50\%$ (missing 3 in 10 cardiovascular cases).
  - Diabetes test recall at $\tau=0.50$: catastrophic collapse to $39.02\%$ (missing 6 out of 10 diabetic patients).
- Under the asymmetric loss formulation $L(f) = C_{\text{FN}} \cdot \text{FN} + C_{\text{FP}} \cdot \text{FP}$ where $C_{\text{FN}} \gg C_{\text{FP}}$, the optimal Bayes decision boundary shifts below 0.50:
  $$\tau^* = \frac{C_{\text{FP}}}{C_{\text{FN}} + C_{\text{FP}}}$$
- Operating thresholds were systematically tuned on **isolated validation partitions**:
  - Fracture tuned to $\tau = 0.1800$ (achieving 96.26% test sensitivity).
  - Heart Disease tuned to $\tau = 0.4000$ (achieving 80.01% test sensitivity).
  - Diabetes tuned to $\tau = 0.2500$ (achieving 80.49% test sensitivity).
  - General Health utilizes deterministic override thresholds assigning $0.94$ risk score and $0.92$ confidence to emergency presentations.

### 2.3 Probabilistic Calibration Comparison
- **Heart Disease Random Forest:** Exemplary calibration ($\text{ECE} = 0.00796$, Brier Score $0.1829$). Less than $0.8\%$ average deviation between predicted probabilities and observed empirical disease rates across all ten deciles.
- **Fracture Detection Baseline:** Acceptable calibration ($\text{ECE} = 0.1021$, Brier Score $0.0896$), slightly exceeding the 0.100 target due to low-probability overestimation.
- **Diabetes MLP Classifier:** Moderate calibration deviation ($\text{ECE} = 0.1037$, Brier Score $0.1647$), driven by underestimation in the $0.20 - 0.45$ probability interval, fully justifying discrete risk badge mapping.
- **General Health NLP:** Operates deterministically with fixed ordinal risk scalars ($0.94, 0.65, 0.25, 0.50$).

### 2.4 Data Hygiene & Leakage Elimination Standards
Every module adheres to strict data science hygiene:
1. **Cryptographic Deduplication:** 3,820 duplicate records excised from cardiovascular data prior to splitting.
2. **Train-Only Imputation:** Diabetes biological zeros imputed strictly using the 537-record training fold medians (Insulin 126.0 $\mu\text{U/mL}$, BMI 32.4 $\text{kg/m}^2$), correcting older contaminated full-cohort medians (125.0 / 32.3).
3. **Patient-Level Radiographic Isolation:** In GRAZ and FracAtlas, all radiographs from a single patient or examination were confined to a single partition, eliminating view-leakage.
4. **Physical Quarantine:** External validation benchmarks (Shenzhen PediURF $N=1,053$) were quarantined under read-only permissions during all training and hyperparameter exploration.

---

## 3. Unified Cross-Module Verification Summary

| Verification Dimension | Fracture Detection | Heart Disease Risk | Diabetes Risk | General Health NLP |
| :--- | :---: | :---: | :---: | :---: |
| **Model Checkpoint Exists** | Yes (`best_model.pt`) | Yes (`random_forest.joblib`) | Yes (`best_model.joblib`) | Yes (`general_health_nlp.py`) |
| **MD5 Hash Verified** | `99f0f5bcea645f714fe4e8fefbb7e6cb` | `d6c0d6caf794a2825bf70d889c5a8e32` | `7bf85e9a43d9a38e40c8f92e0d0ac4cd` | N/A (Python source code) |
| **Inference Service Binding** | `fracture_service.py` | `heart_disease_service.py` | `diabetes_service.py` | `general_health_service.py` |
| **Tuned Threshold Match** | Stored 0.1800 matches service | Stored 0.40 matches service | Stored 0.25 matches service | Deterministic rules match |
| **Kafka Event Integration** | Emits to `medimind.predictions` | Emits to `medimind.predictions` | Emits to `medimind.predictions` | Emits to `medimind.predictions` |
| **Common Contract Compliance** | Returns `CommonPredictionResponse` | Returns `CommonPredictionResponse` | Returns `CommonPredictionResponse` | Returns `CommonPredictionResponse` |
| **Mandatory Disclaimer Present** | Enforced on all responses | Enforced on all responses | Enforced on all responses | Enforced on all responses |
| **Overall Governance Status** | **Production Baseline** | **Production Validated** | **Production Validated** | **Production Validated** |
