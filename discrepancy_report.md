# Discrepancy & Verification Report: MediMind Academic Case Study

**Audit Date:** November 4, 2026  
**Target Repository:** `D:\projects\MediMind`  
**Active Git Branch:** `experiment8-multiview-localized-fusion`  
**Checkpoint:** `a83c9388c12b055fd75f719f4654bd8847c2ae4f` (Experiment 8A freeze commit: `ead0e88a6260d752f44ed727e176d7ba345ecebb`)  
**Source Documents Audited:**
- `MediMind_Data_Science_Case_Study_Updated.docx` (the document to revise)
- `AI_Age_Transformation_Case_Study_GUIDE.docx` (the structural template)
- Underlying code repositories, artifacts, manifests, checkpoints, and benchmark logs

---

## 1. Executive Summary

This discrepancy report records the formal item-by-item audit conducted across the MediMind repository to resolve all inconsistencies, unverified claims, and metric discrepancies found between the previous case study draft (`MediMind_Data_Science_Case_Study_Updated.docx`) and the primary ground-truth artifacts. In accordance with the governing rules of this audit:
1. **Zero Invented Data:** Every metric, parameter, dataset dimension, and checkpoint hash is verified from code, logs, and saved manifests.
2. **Repo Authority:** Where prior narrative text and repo artifacts disagree, the repository artifacts take precedence.
3. **Recomputation of Derived Metrics:** All rates, sensitivities, specificities, predictive values, and 95% Wilson confidence intervals have been independently recomputed directly from the confusion matrices.
4. **Transparent Data Gaps:** Any unrun experiment or unlogged benchmark is explicitly identified and marked as `[DATA NEEDED]`.

---

## 2. Itemized Verification Matrix (Step 1: Items a–p)

| Item | Focus Area | Previous Draft Claim / Issue | Verified Ground-Truth in Repository | Source Artifact File Path | Exact Resolution & Correction Implemented |
|---|---|---|---|---|---|
| **a** | **Exp 8A Specificity Discrimination** | Specificity reported interchangeably as 75.25% and 87.25% across Sections 1.8, 5.4, 5.5, 6.4, 7.1, 7.4 and Insights. | **Two separate cohorts and units of analysis:**<br>1. **75.25% Specificity** (76 TN / 101 normal studies; 95% CI: [66.01%, 82.64%]) was achieved on the **GRAZPEDWRI-DX held-out paired-study test split ($N = 350$ studies / 700 images; 249 fracture, 101 normal)**.<br>2. **87.25% Specificity** (219 TN / 251 normal images; 95% CI: [82.56%, 90.82%]) was achieved on the **isolated uncorrupted normal pediatric controls stress test cohort ($N = 251$ individual radiographs)** from GRAZ test split where YOLOv8 produced zero false detections. | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_graz_test_results.json`<br>`ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_normal_control_results.json`<br>`normal_control_roi_manifest.csv` | Explicitly disambiguate both metrics in all text, tables, and insights. Present paired study metrics on GRAZ test ($N=350$) alongside the normal-control stress test ($N=251$), clearly stating the cohort, sample size, and unit of evaluation. |
| **b** | **Fracture Location Proportions** | Section 4.9 fracture-location percentages (Distal 64.29%, Midshaft 25.17%, Proximal 10.54%) were attributed to the GRAZPEDWRI-DX cohort. | These proportions correspond exactly to the **Shenzhen PediURF official held-out test cohort ($N = 1,053$ studies)**:<br>- Distal ulna/radius: 677 / 1,053 = 64.29%<br>- Midshaft ulna/radius: 265 / 1,053 = 25.17%<br>- Proximal ulna/radius: 111 / 1,053 = 10.54% | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_pediurf_results.json`<br>`pediurf_test_roi_manifest.csv` | Reattribute these percentages correctly to the Shenzhen PediURF cohort. Document the true anatomical distribution of PediURF in Phase 4 and Phase 7. |
| **c** | **PediURF Ground Truth Composition** | PediURF held-out test cohort was cited with specificity and false-positive generalizability claims (e.g. Insight 9). | The Shenzhen PediURF test cohort consists **exclusively of fracture-positive trauma studies** ($N = 1,053$ studies, 2,106 images; 996 TP, 57 FN). Ground-truth label is 1 for all 1,053 studies. There are zero normal controls in this cohort. | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/pediurf_test_roi_manifest.csv`<br>`ai-prediction-service/scripts/audit_pediurf_extracted.py` | PediURF evaluates **sensitivity / recall only** (94.59%; 95% CI: [93.05%, 95.80%]). All claims of specificity, false positive rate, NPV, and ROC-AUC on PediURF are removed. Insight 9 is rewritten to emphasize external sensitivity and cross-institutional transfer. |
| **d** | **Cardiovascular Data Lineage & Deduplication** | Old audit narrative claimed "70,000 raw records, 3,820 exact duplicates, and 1,217 physiological outliers removed to yield 64,963". Also claimed measured before/after model degradation. | The local source file `cardiovascular_diseases_dv3.csv` contains **68,783 records**. Exactly **3,820 duplicate rows** were excised via exact matching, yielding **64,963 clean records** ($68,783 - 3,820 = 64,963$). No rows were removed for physiological outliers (outliers were retained per IQR audit). **No training runs were executed on the un-deduplicated dataset in the repository.** | `ai-prediction-service/app/models/heart_disease/HEART_DISEASE_DATASET.md`<br>`ai-prediction-service/artifacts/heart_disease/training_report.json` | Correct data lineage: 68,783 raw -> 3,820 duplicates removed -> 64,963 clean records. Mark before/after-deduplication performance metrics as "not run" in the repo. Soften Insights 1 and 2 and RQ1 to theoretical methodological principles rather than measured empirical deltas. |
| **e** | **Validation vs Test Metrics at Chosen Threshold** | Stated that the 80% recall target was met on validation for all models. Threshold selection rules were not systematically documented. | **Cardiovascular RF:** Selection rule was max recall on validation subject to specificity $\ge 0.60$. At $\tau = 0.40$, validation recall reached **79.39%** (did not reach 80.0% on validation) and test recall reached **80.01%**.<br>**Diabetes MLP:** Selection rule was max recall on validation subject to specificity $\ge 0.60$. At $\tau = 0.25$, validation recall was **87.50%** (met target) and test recall was **80.49%**.<br>**Fracture Base ResNet-18:** Validation recall was **88.99%** at $\tau = 0.18$, test recall was **96.26%**.<br>**Fracture Exp 8A:** Validation sensitivity was **91.74%** at $\tau = 0.01$, test sensitivity was **95.18%**. | `ai-prediction-service/artifacts/heart_disease/training_report.json`<br>`ai-prediction-service/artifacts/diabetes/training_report.json`<br>`ai-prediction-service/artifacts/fracture/training_report.json`<br>`experiment8a_threshold_analysis.json` | Report validation and test metrics side-by-side for all models. Clarify that while Cardiovascular RF narrowly missed the 80% target on validation (79.39%), it achieved 80.01% on the held-out test partition. |
| **f** | **Model Comparison Table Operating Points** | Table 6.1 compared LR and MLP at default $\tau = 0.50$ but RF at tuned $\tau = 0.40$ (Cardio), and LR/RF at $\tau = 0.50$ but MLP at $\tau = 0.25$ (Diabetes) without explicit threshold columns. | In repo manifests, all baseline models (LR, RF, MLP) have evaluated metrics at default $\tau = 0.50$ on both validation and test sets. Tuned operating points ($\tau = 0.40$ for Cardio RF, $\tau = 0.25$ for Diabetes MLP) are stored as separate partitions. | `ai-prediction-service/artifacts/heart_disease/training_report.json`<br>`ai-prediction-service/artifacts/diabetes/training_report.json` | Present two explicit, well-labeled tables: (1) Baseline Model Comparison at uniform $\tau = 0.50$ across all candidate algorithms; (2) Production Operating Point Table documenting the clinically tuned threshold with an explicit threshold column on every row. |
| **g** | **Diabetes MLP Architecture, Framework & Imputation** | Prior text described Diabetes MLP with Dropout layers and PyTorch-style early stopping. Claimed fasting glucose. Listed insulin median as 125.0 and BMI as 32.3. | 1. Framework is **scikit-learn** (`sklearn.neural_network.MLPClassifier` inside a `Pipeline` with `StandardScaler`). scikit-learn MLP **does not support or use dropout**.<br>2. Hyperparameters: $(32, 16)$ hidden layers, ReLU, Adam solver, $\alpha = 0.001$ (L2 regularization), early stopping at **48 iterations** (`max_iter = 300`, `n_iter_no_change = 15`).<br>3. Glucose is **2-hour plasma glucose concentration during oral glucose tolerance test (OGTT)**, not fasting glucose.<br>4. Imputation medians (fit on train fold only): Glucose 117.0, BP 72.0, SkinThickness 29.0, **Insulin 126.0** (not 125.0), **BMI 32.4** (not 32.3). | `ai-prediction-service/artifacts/diabetes/best_model.joblib`<br>`ai-prediction-service/app/models/diabetes/diabetes_training.py`<br>`ai-prediction-service/app/models/diabetes/DIABETES_DATASET.md`<br>`ai-prediction-service/artifacts/diabetes/training_report.json` | Fully align the description with scikit-learn's `MLPClassifier`. Remove all mentions of dropout from the production model (clarify that dropout was investigated only in research experiment `mlp_optimization_20261019`). Correct glucose definition to 2-hour OGTT and update insulin and BMI medians to 126.0 and 32.4. |
| **h** | **Dataset Counts & Sampling Rationale** | Unclear why FracAtlas baseline used 2,425 samples out of 4,083, what MURA subset was used, and what GRAZPEDWRI-DX extraction status represents. | 1. **FracAtlas:** 4,083 raw images, 15 exact duplicates removed $\to$ 4,068 valid images (715 fractured = 17.58%, 3,353 non-fractured = 82.42%). Baseline model partitioned 2,425 images because `train_sample_budget = 1200` was enforced for CPU compute feasibility ($1,200\text{ train} + 612\text{ val} + 613\text{ test} = 2,425$).<br>2. **MURA:** 2,869 musculoskeletal images sampled from Stanford MURA v1.1 for representation pretraining.<br>3. **GRAZPEDWRI-DX:** Public release has 20,327 images (10,643 studies, 6,091 patients; Nagy et al., 2022). Due to local storage/compute budgets, a canonical subset of **5,031 images (1,499 unique patients)** was extracted (3,334 fractured = 66.27%, 1,697 non-fractured = 33.73%), yielding 251 normal images in test split. | `ai-prediction-service/artifacts/fracture_v2/manifests/dataset_cleaning_report.json`<br>`ai-prediction-service/artifacts/fracture_v2/graz_only/manifests/dataset_cleaning_report.json`<br>`ai-prediction-service/app/models/fracture/fracture_training.py` | State exact counts and sampling rationales clearly: explain the 1,200 train sample budget in FracAtlas baseline, document the 2,869 MURA pretraining count, and cite the 20,327 total vs 5,031 extracted GRAZPEDWRI-DX cohort dimensions. |
| **i** | **Unsupported Architectural Claims** | Insight 11 claimed that scaling depth from ResNet-18 to ResNet-50 failed to eliminate pediatric growth plate false positives. Insights 1 & 2 claimed measured duplicate impact. | There is **no ResNet-50 checkpoint or experiment** in the repository. The deep architecture comparison executed in the repo was **ResNet-18 vs. DenseNet-121** (`artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/`). DenseNet-121 also failed to resolve the growth plate confounding. Before/after duplicate model comparisons were not run. | `ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/experiment_benchmark_report.json` | Replace "ResNet-50" with DenseNet-121 in Insight 11, reflecting the true 121-layer dense network experiment in the repo. Soften Insights 1 and 2 to theoretical data science principles. |
| **j** | **Mathematical Framing of RQ5** | RQ5 asked: "How does threshold optimization for sensitivity affect posterior probability calibration and Brier score?" | **Mathematically ill-posed:** Brier score and Expected Calibration Error (ECE) are strictly functions of posterior probabilities $P(Y=1|X) \in [0, 1]$ and true binary labels $y \in \{0, 1\}$. They do not depend on the decision threshold $\tau$, which only affects binary classification outcomes ($\hat{y} \in \{0, 1\}$). | Mathematical definitions of Brier Score ($N^{-1}\sum (p_i - y_i)^2$) and ECE ($\sum |B_m|/N \cdot |\text{acc}(B_m) - \text{conf}(B_m)|$). | Rewrite RQ5: "RQ5 (Calibration Fidelity & Decision Threshold Decoupling): How does post-hoc calibration ensure reliability in posterior risk estimates (measured by Brier score and ECE), and how does validation threshold tuning decouple clinical sensitivity requirements from raw probability scale without altering calibration?" |
| **k** | **Tree Invariance & Cardiovascular Features** | Section 5.2 claimed Random Forest is invariant to derived features like pulse pressure and BMI. Also text was ambiguous on 11 features vs derived features. | 1. Decision trees use orthogonal, axis-aligned splits ($x_i \le c$). They **are not invariant** to linear combinations ($x_1 - x_2$) or non-linear ratios ($x_1 / x_2^2$), which require deep, inefficient staircase approximations.<br>2. The production model `best_model.joblib` was trained on the **11 raw numeric features** (`AGE`, `GENDER`, `HEIGHT`, `WEIGHT`, `AP_HIGH`, `AP_LOW`, `CHOLESTEROL`, `GLUCOSE`, `SMOKE`, `ALCOHOL`, `PHYSICAL_ACTIVITY`). Pulse pressure and BMI were evaluated during exploratory feature engineering. | `ai-prediction-service/app/models/heart_disease/HEART_DISEASE_DATASET.md`<br>`ai-prediction-service/artifacts/heart_disease/training_report.json` | Correct statistical explanation: clarify that tree ensembles benefit from explicit non-linear combinations like BMI and pulse pressure because they cannot represent diagonal boundaries with single splits. Reconcile feature counts: 11 core features constitute the production schema, while derived features were evaluated in EDA. |
| **l** | **Circularity in Table 7.3 Multi-View States** | Table 7.3 defined multi-view states by whether the model detected an ROI, yielding circular 100% sensitivity for States A, B, and C. | The underlying audit artifact `experiment8_graz_localization_audit.json` records **ground-truth annotation availability** independently of model detections: In the test split ($N = 249$ fractures), 230 studies had fractures annotated on both views, 18 had fractures visible **only on the lateral view** (AP occult), and 1 had a fracture visible only on AP. In model inference, YOLOv8 surfaced ROIs that enabled 24 lateral rescues. | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8_graz_localization_audit.json`<br>`experiment8a_multiview_analysis.json` | Reframe Table 7.3 to clearly separate ground-truth radiologist visibility (18 studies radiographically occult on AP) from model inference states (24 lateral rescues triggered by the localized detector), eliminating circular logic. |
| **m** | **Statistical Uncertainty & Confidence Intervals** | The previous case study presented point estimates for sensitivity and specificity without confidence intervals, obscuring sampling variance on small test cohorts. | Derived Wilson 95% confidence intervals from test confusion matrices:<br>- Cardio RF ($N=9745$): Rec 80.01% [78.88%, 81.10%], Spec 63.40% [62.03%, 64.75%]<br>- **Diabetes MLP ($N=116$, Small!):** Rec 80.49% **[65.99%, 89.77%]**, Spec 68.00% **[56.79%, 77.46%]**<br>- Fracture Base ($N=613$): Rec 96.26% [90.78%, 98.54%], Spec 63.64% [59.36%, 67.71%]<br>- Exp 8A GRAZ ($N=350$): Rec 95.18% [91.77%, 97.22%], Spec 75.25% [66.01%, 82.64%]<br>- Exp 8A Norm ($N=251$): Spec 87.25% [82.56%, 90.82%]<br>- Exp 8A PediURF ($N=1053$): Rec 94.59% [93.05%, 95.80%] | Recomputed from test confusion matrices in `training_report.json` across all modules. | Add Wilson 95% confidence intervals to all evaluation tables. Explicitly flag the Diabetes test cohort ($N=116$, $n=41$ positive) for wide confidence interval width (23.78 percentage points). |
| **n** | **Inference Latency Claims** | Old document claimed "sub-15 ms" for tabular models, "85–140 ms" for DualViewROIResNet18, and "sub-5 ms" for NLP triage without benchmark logs. | The repository contains an API endpoint latency benchmark (`scripts/benchmark_results.json`: warm median 31.0 ms, p95 41.36 ms for full backend payloads), but **no per-model micro-benchmarking logs** exist on standardized GPU/CPU hardware. | `scripts/benchmark_results.json`<br>`ai-prediction-service/artifacts/` | Mark per-model inference latency claims as `[DATA NEEDED: per-model inference latency benchmark logs on standardized hardware; searched in scripts/benchmark_results.json and ai-prediction-service/artifacts/]` and list in `open_items.md`. |
| **o** | **References & Cryptographic Hashes** | Missing formal literature citations for PediURF and Cardiovascular dataset. Checkpoint hashes were inconsistently reported as MD5 or truncated SHA-1. | Primary repository sources identified:<br>- PediURF: Shenzhen Children's Hospital, Figshare deposit, DOI: `10.6084/m9.figshare.29998954`<br>- Cardiovascular: Svetlana Ulianova / Medical examination registry, Kaggle DV3<br>- Computed full SHA-256 hashes for all checkpoints. | Checkpoint binaries in `ai-prediction-service/artifacts/`<br>`ai-prediction-service/scripts/acquire_pediurf_dataset.py` | Add formal academic references for PediURF and Cardiovascular datasets. Standardize all model checkpoint lineage tables to full SHA-256 hashes. |
| **p** | **Layout & Formatting Defects** | Heading 2 `7.9 Operational Verification & Clinical Demonstration Outcomes` appeared *after* its text paragraphs. Dangling sentence ending in colon. Inconsistent TOC tabs. | Python-docx indexing bug caused Heading 7.9 to insert below its body paragraphs. Dangling colon in Section 1.5. Inconsistent tab formatting in TOC. | `MediMind_Data_Science_Case_Study_Updated.docx` inspection via `python-docx`. | Fix heading order, repair dangling sentences, ensure flawless document typography, consistent heading levels, and complete TOC alignment. |

---

## 3. Standardized Cryptographic Checkpoint Inventory (SHA-256)

All production and research model checkpoints have been independently verified and hashed:

| Target Domain | Checkpoint Path | File Size (Bytes) | SHA-256 Checksum | MD5 Checksum | Status |
|---|---|---|---|---|:---:|
| **Cardiovascular Risk** | `ai-prediction-service/artifacts/heart_disease/best_model.joblib` | 32,636,665 | `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` | `d6c0d6caf794a2825bf70d889c5a8e32` | **Production Baseline** |
| **Diabetes Risk** | `ai-prediction-service/artifacts/diabetes/best_model.joblib` | 30,193 | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` | `7bf85e9a43d9a38e40c8f92e0d0ac4cd` | **Production Baseline** |
| **Fracture Baseline** | `ai-prediction-service/artifacts/fracture/best_model.pt` | 44,788,427 | `abe8bc708a44cbe924f448df3654f1f0bfd5964f81b979fae61b446e873583b9` | `99f0f5bcea645f714fe4e8fefbb7e6cb` | **Production Baseline** |
| **Fracture Exp 8A** | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt` | 45,839,207 | `eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d` | `ac7ebe3c91deea13cedb5ca36a841829` | **Research Best (Frozen)** |
| **Fracture Exp 2B** | `ai-prediction-service/artifacts/fracture_v2/graz_only/best_model.pt` | 44,786,059 | `5005f3eacf1511064fa09d0adfe46bb8b390c4f098c68b2d35bbb8a5f58d208a` | `a40e92f36fbc53e099c9d83134019423` | **Research Benchmark** |

---

## 4. Recomputed Confusion Matrices & Metrics Summary

All metrics have been verified by computing from raw confusion matrix counts:

### A. Cardiovascular Disease Risk (Random Forest, Held-Out Test $N = 9,745$)
- **Threshold $\tau = 0.4000$:** $\text{TP} = 3,967$, $\text{FP} = 1,752$, $\text{TN} = 3,035$, $\text{FN} = 991$
- **Total Positive:** $3,967 + 991 = 4,958$; **Total Negative:** $3,035 + 1,752 = 4,787$
- **Recall / Sensitivity:** $3,967 / 4,958 = \mathbf{80.01\%}$ (95% Wilson CI: $[78.88\%, 81.10\%]$)
- **Specificity:** $3,035 / 4,787 = \mathbf{63.40\%}$ (95% Wilson CI: $[62.03\%, 64.75\%]$)
- **Precision (PPV):** $3,967 / (3,967 + 1,752) = \mathbf{69.37\%}$
- **NPV:** $3,035 / (3,035 + 991) = \mathbf{75.38\%}$
- **F1-Score:** $2 \times (0.69365 \times 0.80012) / (0.69365 + 0.80012) = \mathbf{0.7431}$
- **Discrimination:** $\text{ROC-AUC} = \mathbf{0.7961}$, $\text{PR-AUC} = \mathbf{0.7835}$
- **Calibration:** $\text{Brier Score} = \mathbf{0.1829}$, $\text{ECE} = \mathbf{0.0080}$

### B. Diabetes Mellitus Risk (MLP Classifier, Held-Out Test $N = 116$ — Small Cohort Flagged)
- **Threshold $\tau = 0.2500$:** $\text{TP} = 33$, $\text{FP} = 24$, $\text{TN} = 51$, $\text{FN} = 8$
- **Total Positive:** $33 + 8 = 41$; **Total Negative:** $51 + 24 = 75$
- **Recall / Sensitivity:** $33 / 41 = \mathbf{80.49\%}$ (95% Wilson CI: $[65.99\%, 89.77\%]$) — *Wide CI (23.78 pp) due to $n=41$*
- **Specificity:** $51 / 75 = \mathbf{68.00\%}$ (95% Wilson CI: $[56.79\%, 77.46\%]$)
- **Precision (PPV):** $33 / (33 + 24) = \mathbf{57.89\%}$
- **NPV:** $51 / (51 + 8) = \mathbf{86.44\%}$
- **F1-Score:** $2 \times (0.57895 \times 0.80488) / (0.57895 + 0.80488) = \mathbf{0.6735}$
- **Discrimination:** $\text{ROC-AUC} = \mathbf{0.8267}$, $\text{PR-AUC} = \mathbf{0.7205}$
- **Calibration:** $\text{Brier Score} = \mathbf{0.1647}$, $\text{ECE} = \mathbf{0.1037}$

### C. Fracture Detection Baseline (MURA-Pretrained ResNet-18, FracAtlas Held-Out Test $N = 613$)
- **Threshold $\tau = 0.1800$:** $\text{TP} = 103$, $\text{FP} = 184$, $\text{TN} = 322$, $\text{FN} = 4$
- **Total Positive:** $103 + 4 = 107$; **Total Negative:** $322 + 184 = 506$
- **Recall / Sensitivity:** $103 / 107 = \mathbf{96.26\%}$ (95% Wilson CI: $[90.78\%, 98.54\%]$)
- **Specificity:** $322 / 506 = \mathbf{63.64\%}$ (95% Wilson CI: $[59.36\%, 67.71\%]$)
- **Precision (PPV):** $103 / 287 = \mathbf{35.89\%}$
- **NPV:** $322 / 326 = \mathbf{98.77\%}$
- **F1-Score:** $\mathbf{0.5228}$
- **Discrimination:** $\text{ROC-AUC} = \mathbf{0.9244}$, $\text{PR-AUC} = \mathbf{0.7843}$
- **Calibration:** $\text{Brier Score} = \mathbf{0.0896}$, $\text{ECE} = \mathbf{0.1021}$

### D. Fracture Research Candidate (Experiment 8A `DualViewROIResNet18`, GRAZ Held-Out Test $N = 350$ Paired Studies)
- **Threshold $\tau = 0.0100$:** $\text{TP} = 237$, $\text{FP} = 25$, $\text{TN} = 76$, $\text{FN} = 12$
- **Total Positive:** $237 + 12 = 249$; **Total Negative:** $76 + 25 = 101$
- **Recall / Sensitivity:** $237 / 249 = \mathbf{95.18\%}$ (95% Wilson CI: $[91.77\%, 97.22\%]$)
- **Specificity:** $76 / 101 = \mathbf{75.25\%}$ (95% Wilson CI: $[66.01\%, 82.64\%]$)
- **Precision (PPV):** $237 / 262 = \mathbf{90.46\%}$
- **NPV:** $76 / 88 = \mathbf{86.36\%}$
- **F1-Score:** $\mathbf{0.9276}$
- **Discrimination:** $\text{ROC-AUC} = \mathbf{0.9586}$, $\text{PR-AUC} = \mathbf{0.9860}$
- **Calibration:** $\text{Brier Score} = \mathbf{0.0811}$, $\text{ECE} = \mathbf{0.0897}$

### E. Normal Pediatric Controls Stress Test (Exp 8A, $N = 251$ Normal Radiographs)
- **Threshold $\tau = 0.0100$:** $\text{TN} = 219$, $\text{FP} = 32$
- **Specificity:** $219 / 251 = \mathbf{87.25\%}$ (95% Wilson CI: $[82.56\%, 90.82\%]$)
- **False Positive Rate:** $32 / 251 = \mathbf{12.75\%}$

### F. Multi-Center External Validation (Exp 8A, Shenzhen PediURF $N = 1,053$ Paired Studies)
- **Cohort Composition:** 100% Fracture-Positive ($N = 1,053$ positive studies, 0 normal controls)
- **Detected True Positives:** $\text{TP} = 996$; **Missed False Negatives:** $\text{FN} = 57$
- **External Sensitivity / Recall:** $996 / 1,053 = \mathbf{94.59\%}$ (95% Wilson CI: $[93.05\%, 95.80\%]$)
- **Subgroup Sensitivities:**
  - Distal Radius / Ulna ($N=677$): $\text{TP} = 632$, $\text{FN} = 45 \implies \mathbf{93.35\%}$
  - Midshaft Radius / Ulna ($N=265$): $\text{TP} = 259$, $\text{FN} = 6 \implies \mathbf{97.74\%}$
  - Proximal Radius / Ulna ($N=111$): $\text{TP} = 105$, $\text{FN} = 6 \implies \mathbf{94.59\%}$
- *Specificity, PPV, NPV, and ROC-AUC cannot be mathematically computed due to absence of negative controls.*
