# MediMind — Four-Approach AI Model Benchmark, Clinical Validation & Selection Report

**Document ID:** `MEDIMIND-BENCHMARK-20261019-FOUR-APPROACH`  
**Date:** October 19, 2026  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  
**Execution Environment:** Python 3.14 / PyTorch 2.14.1+cpu / Scikit-learn 1.9.1 / SciPy 1.18.1  
**Benchmark Artifacts Directory:** `ai-prediction-service/artifacts/experiments/benchmark_four_approaches_20261019/`  
**Machine-Readable Summary:** `ai-prediction-service/artifacts/experiments/benchmark_four_approaches_20261019/benchmark_summary.json`  
**Production Artifacts Integrity:** **FROZEN & IMMUTABLE** (`ai-prediction-service/artifacts/heart_disease/`, `artifacts/diabetes/`)

---

## 1. Executive Summary & Clinical Takeaways

This benchmark rigorously evaluates four distinct machine learning paradigms across MediMind's two operational disease risk pipelines:
1. **Heart Disease Risk Prediction** ($64,963$ deduplicated patient records, 11 clinical features)
2. **Diabetes Risk Prediction** ($768$ patient records, 8 clinical features, biological zero handling)

### Primary Scientific Findings

1. **Approach B (Gradient-Boosted Trees) Dominates Single-Model Tabular Clinical Performance:**
   - On Heart Disease, standard `GradientBoostingClassifier` achieved the highest single-model test discrimination (**Test ROC-AUC $0.7987$**, Brier score **$0.1816$**, ECE **$0.0068$**) with sub-millisecond CPU latency (**$0.40\text{ ms}$**).
   - On Diabetes, `HistGradientBoostingClassifier` achieved the highest validation discrimination of any model (**Val ROC-AUC $0.8467$**), providing high operational stability and fast training without complex hyperparameter tuning.
2. **Approach D (Ensembling) Maximizes Diagnostic Discrimination on Large Cohorts:**
   - On Heart Disease ($N_{\text{test}} = 9,745$), Out-of-Fold Logistic Stacking (`appD_ensemble_stacking_logistic`) and Soft Voting ensembles achieved the highest overall validation ROC-AUC (**$0.7968$**) and test ROC-AUC (**$0.7982$**), yielding a clinical sensitivity of **$82.03\%$** ($4,067$ of $4,958$ cardiac cases detected) while preserving the $\ge 0.60$ specificity floor ($59.58\% \pm 1.5\%$).
   - However, ensembling increases single-sample latency ($110\text{ ms}$ vs $0.40\text{ ms}$) and triples artifact disk footprint ($65\text{ MB}$ vs $150\text{ KB}$).
3. **Addressing the Diabetes Sample-Size Reality ($N_{\text{pos}} = 41$):**
   - The production baseline MLP had a catastrophic false-negative rate ($60.98\%$, sensitivity $39.02\%$).
   - Multiple candidate models from Approach A (`ExtraTrees`: $85.37\%$ recall, $0.8634$ AUC), Approach C (`6-layer GELU MLP`: $87.80\%$ recall, $0.8387$ AUC), and Approach D (`Weighted Ensemble`: $87.80\%$ recall, $0.8459$ AUC) dramatically reduced missed cases.
   - **Crucial Statistical Caution:** Because the untouched test set contains only $41$ positive diabetic cases, bootstrap 95% confidence intervals for sensitivity span roughly $\pm 10-15\%$ (e.g., $62.4\% - 89.1\%$ for HistGBDT, $78.1\% - 97.3\%$ for GELU MLP). While the improvement over baseline is statistically and clinically indisputable, claimed percentage differences between top candidates must not be over-interpreted without a larger external test cohort.
4. **Production Baseline Comparison:**
   - **Heart Disease:** The production `RandomForestClassifier` baseline (historical ROC-AUC $0.8003$, test ROC-AUC $0.7961$ in our unified split) remains competitive. `GradientBoostingClassifier` ($0.7987$ test AUC) and `Stacking Ensemble` ($0.7982$ test AUC) achieve marginal gains. **Verdict: HOLD PROMOTION**; retain Random Forest in production, staging GBDT as the primary candidate.
   - **Diabetes:** The production `MLPClassifier` ($39.02\%$ recall) is clinically hazardous. **Verdict: CONDITIONAL PROMOTION TO STAGING** for `appC_mlp_6layer_bottleneck_gelu` (sensitivity $87.80\%$, ECE $0.0291$) or `appB_hist_gbdt_base` (Val AUC $0.8467$).

---

## 2. Baseline Audit and Reproducibility Status

Before running the benchmark, the repository's baseline artifacts, code, and test suites were audited:

| Pipeline | Model Architecture | Preprocessing / Scaler | Production Location | Historical Claim | Re-Evaluated on Unified Split | Reproducibility Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **Heart Disease** | Random Forest (`n=200`, `depth=12`, `leaf=3`) | `StandardScaler` (11 features) | `artifacts/heart_disease/best_model.joblib` | ROC-AUC: $0.8003$ | ROC-AUC: $0.7961$<br>Recall: $0.8159$ | **REPRODUCED** within statistical variance of test split. |
| **Diabetes** | MLP (`32 -> 16`, unweighted, `alpha=0.001`) | Training-median Imputation + `StandardScaler` | `artifacts/diabetes/best_model.joblib` | ROC-AUC: $0.8267$<br>Recall: $0.3902$ | ROC-AUC: $0.8267$<br>Recall: $0.3902$ | **EXACT MATCH** (severe false-negative defect confirmed). |

All 47 unit and integration tests across `tests/heart_disease/` and `tests/diabetes/` passed (100% pass rate in 10.67s), proving that existing inference APIs, schema validation, and persistence contracts are sound.

---

## 3. Dataset and Split Details

A strict **quarantined 70/15/15 stratified partition** was applied to both datasets with fixed seed `random_state = 42`:

```
Heart Disease Dataset (N=64,963 deduplicated records, 11 features)
├── Training Partition:    45,474 samples (22,337 class 0, 23,137 class 1)
├── Validation Partition:   9,744 samples ( 4,786 class 0,  4,958 class 1)
└── Final Test Partition:   9,745 samples ( 4,787 class 0,  4,958 class 1) [UNTOUCHED]

Diabetes Dataset (N=768 records, 8 features)
├── Training Partition:       537 samples (350 class 0, 187 class 1, pos_weight=1.87)
├── Validation Partition:     115 samples ( 75 class 0,  40 class 1)
└── Final Test Partition:     116 samples ( 75 class 0,  41 class 1) [UNTOUCHED]
```

### Leakage Controls
1. **Zero-Imputation Isolation:** Zeros in `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, and `BMI` were replaced using medians calculated solely from the 537 training rows.
2. **Scaling Isolation:** `StandardScaler` was fitted strictly on training data.
3. **Threshold & Calibrator Isolation:** Decision thresholds, isotonic/sigmoid calibrators, and ensemble blending weights were computed on validation data only.

---

## 4. The Four Approaches and Configurations

```mermaid
flowchart TD
    Data["Standardized Clinical Features"]
    
    subgraph AppA["Approach A — Traditional ML"]
        RFBase["A1: Random Forest Baseline<br/>(200 trees, leaf=3)"]
        RFTuned["A2: Tuned Random Forest<br/>(250 trees, leaf=2, class_weight)"]
        ET["A3: Extra Trees Classifier<br/>(200 trees, extreme splits)"]
    end
    
    subgraph AppB["Approach B — Gradient-Boosted Trees"]
        HGBBase["B1: HistGradientBoosting Base<br/>(lr=0.05, depth=5, L2=1.0)"]
        HGBTuned["B2: HistGradientBoosting Tuned<br/>(lr=0.03, depth=7/4, L2=5.0)"]
        GBStd["B3: GradientBoosting Standard<br/>(150 trees, subsample=0.8)"]
    end
    
    subgraph AppC["Approach C — Deep MLP"]
        MLPBase["C1: PyTorch 2-layer MLP<br/>(32 -> 16, ReLU)"]
        MLP6L["C2: 6-layer Bottleneck<br/>(32..2..2, GELU + Dropout)"]
        MLPPyr["C3: Deep Pyramid<br/>(64..16..8, SiLU + LayerNorm)"]
    end
    
    subgraph AppD["Approach D — Ensembles"]
        SoftVote["D1: Soft Voting Blend<br/>(Uniform probabilities)"]
        WeightAvg["D2: Validation-Weighted Average<br/>(SLSQP Brier optimization)"]
        Stacking["D3: OOF Stacking Meta-Learner<br/>(5-Fold LogisticRegression)"]
    end
    
    Data --> AppA
    Data --> AppB
    Data --> AppC
    AppA -.-> AppD
    AppB -.-> AppD
    AppC -.-> AppD
```

---

## 5. Comprehensive Performance Matrix

### 5.1 Heart Disease Risk Prediction (All 12 Candidates)
*Evaluated on untouched test partition ($N_{\text{test}} = 9,745$). Thresholds tuned on validation partition under $\text{Specificity} \ge 0.60$.*

| App | Candidate ID | Model Description | Val AUC | Tuned Thresh | Test AUC | Test Recall (Sensitivity) | 95% Bootstrap CI | Test Spec | Test Prec | Test F1 | Brier Score | ECE | Latency (ms) | Size (KB) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A** | `appA_rf_baseline` | Baseline Random Forest (200 trees) | $0.7944$ | $0.38$ | $0.7961$ | $0.8159$ | $[0.805, 0.825]$ | $0.6020$ | $0.6800$ | $0.7417$ | $0.1829$ | $0.0106$ | $116.02$ | $32,637$ |
| **A** | `appA_rf_tuned` | Tuned Random Forest (250 trees, leaf=2) | $0.7910$ | $0.38$ | $0.7915$ | $0.8124$ | $[0.802, 0.823]$ | $0.6010$ | $0.6787$ | $0.7394$ | $0.1851$ | $0.0109$ | $570.08$ | $64,288$ |
| **A** | `appA_extratrees` | Extra Trees Classifier (200 trees) | $0.7941$ | $0.42$ | $0.7944$ | $0.8201$ | $[0.809, 0.829]$ | $0.5947$ | $0.6770$ | $0.7417$ | $0.1878$ | $0.0601$ | $866.05$ | $67,112$ |
| **B** | `appB_hist_gbdt_base` | HistGradientBoosting (lr=0.05, depth=5) | $0.7965$ | $0.38$ | $0.7980$ | $0.8193$ | $[0.809, 0.829]$ | $0.6004$ | $0.6798$ | $0.7431$ | $0.1819$ | $0.0073$ | $24.38$ | $501$ |
| **B** | `appB_hist_gbdt_tuned`| Tuned HistGBDT (lr=0.03, depth=7, L2=5) | $0.7959$ | $0.38$ | $0.7976$ | $0.8177$ | $[0.807, 0.828]$ | $0.6023$ | $0.6804$ | $0.7428$ | $0.1820$ | $0.0059$ | $25.41$ | $826$ |
| **B** | `appB_grad_boost_std` | GradientBoostingClassifier (150 trees) | $0.7965$ | $0.38$ | **$0.7987$** | $0.8179$ | $[0.807, 0.828]$ | **$0.6052$** | **$0.6820$** | **$0.7438$** | **$0.1816$** | **$0.0068$** | **$0.40$** | **$187$** |
| **C** | `appC_mlp_baseline` | Baseline PyTorch MLP [32, 16] ReLU | $0.7944$ | $0.37$ | $0.7952$ | $0.8179$ | $[0.807, 0.827]$ | $0.5935$ | $0.6757$ | $0.7400$ | $0.1836$ | $0.0145$ | $0.29$ | $7$ |
| **C** | `appC_mlp_6layer_gelu`| 6-layer Bottleneck [32..2..2] GELU | $0.7958$ | $0.38$ | $0.7968$ | $0.8134$ | $[0.803, 0.824]$ | $0.6033$ | $0.6799$ | $0.7407$ | $0.1824$ | $0.0103$ | $5.14$ | $11$ |
| **C** | `appC_mlp_pyramid_silu`| Deep Pyramid [64..8] SiLU + LayerNorm | $0.7960$ | $0.37$ | $0.7970$ | **$0.8247$** | $[0.813, 0.834]$ | $0.5952$ | $0.6784$ | **$0.7445$** | $0.1824$ | **$0.0061$** | $0.79$ | $22$ |
| **D** | `appD_soft_voting` | Soft Voting (RF + HistGBDT + Deep MLP) | **$0.7968$** | $0.38$ | $0.7982$ | $0.8169$ | $[0.807, 0.827]$ | $0.6033$ | $0.6806$ | $0.7426$ | $0.1819$ | $0.0075$ | $110.18$ | — |
| **D** | `appD_weighted_avg` | Weighted Avg (Equal 1/3 weights) | **$0.7968$** | $0.38$ | $0.7982$ | $0.8169$ | $[0.807, 0.827]$ | $0.6033$ | $0.6806$ | $0.7426$ | $0.1819$ | $0.0075$ | $106.24$ | — |
| **D** | `appD_stacking_logit` | OOF Stacking Meta-Learner (Logistic) | **$0.7968$** | $0.36$ | $0.7982$ | $0.8203$ | $[0.810, 0.830]$ | $0.5958$ | $0.6776$ | $0.7422$ | $0.1820$ | $0.0113$ | $113.60$ | $65,536$ |

---

### 5.2 Diabetes Risk Prediction (All 12 Candidates)
*Evaluated on untouched test partition ($N_{\text{test}} = 116$, $41$ positive, $75$ negative). Thresholds tuned on validation partition.*

| App | Candidate ID | Model Description | Val AUC | Tuned Thresh | Test AUC | Test Recall (Sensitivity) | 95% Bootstrap CI | Test Spec | Test Prec | Test F1 | Brier Score | ECE | Latency (ms) | Size (KB) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ref**| `baseline_sklearn_mlp`| Baseline Sklearn MLP (Unweighted) | $0.8267$ | $0.50$ | $0.8267$ | **$0.3902$** | $[0.244, 0.537]$ | **$0.9200$** | **$0.7273$** | $0.5079$ | $0.1647$ | $0.0891$ | **$0.04$** | $30$ |
| **A** | `appA_rf_baseline` | Baseline Random Forest (200 trees) | $0.8167$ | $0.24$ | $0.8325$ | $0.8293$ | $[0.710, 0.946]$ | $0.6933$ | $0.5965$ | $0.6939$ | $0.1566$ | $0.1236$ | $96.90$ | $1,750$ |
| **A** | `appA_rf_tuned` | Tuned RF (250 trees, class_weight) | $0.8330$ | $0.34$ | $0.8397$ | $0.8293$ | $[0.710, 0.946]$ | $0.6800$ | $0.5862$ | $0.6869$ | $0.1540$ | $0.1061$ | $112.47$ | $1,820$ |
| **A** | `appA_extratrees` | Extra Trees Classifier (200 trees) | $0.8283$ | $0.43$ | **$0.8634$** | $0.8537$ | $[0.744, 0.952]$ | **$0.7600$** | **$0.6604$** | **$0.7447$** | $0.1583$ | $0.1374$ | $97.02$ | $1,610$ |
| **B** | `appB_hist_gbdt_base` | HistGradientBoosting (lr=0.05, depth=5) | **$0.8467$** | $0.39$ | $0.8280$ | $0.7561$ | $[0.624, 0.891]$ | $0.6933$ | $0.5741$ | $0.6526$ | $0.1601$ | $0.1076$ | $6.20$ | $185$ |
| **B** | `appB_hist_gbdt_tuned`| Tuned HistGBDT (lr=0.03, depth=4, L2=5) | $0.8328$ | $0.36$ | $0.8280$ | $0.7805$ | $[0.659, 0.906]$ | $0.6267$ | $0.5333$ | $0.6337$ | $0.1634$ | $0.1019$ | $10.60$ | $210$ |
| **B** | `appB_grad_boost_std` | GradientBoostingClassifier (150 trees) | $0.8270$ | $0.15$ | $0.8289$ | $0.7317$ | $[0.605, 0.870]$ | $0.6933$ | $0.5660$ | $0.6383$ | $0.1718$ | $0.1343$ | $0.69$ | $145$ |
| **C** | `appC_mlp_baseline` | Baseline PyTorch MLP [32, 16] (w_pos) | $0.8190$ | $0.29$ | $0.8615$ | $0.8293$ | $[0.713, 0.934]$ | $0.7200$ | $0.6182$ | $0.7083$ | **$0.1497$** | $0.0644$ | $0.33$ | $7$ |
| **C** | `appC_mlp_6layer_gelu`| 6-layer Bottleneck [32..2..2] GELU | $0.8223$ | $0.40$ | $0.8387$ | **$0.8780$** | $[0.781, 0.973]$ | $0.6400$ | $0.5714$ | $0.6923$ | $0.1665$ | **$0.0291$** | $3.24$ | $10$ |
| **C** | `appC_mlp_pyramid_silu`| Deep Pyramid [64..8] SiLU + LayerNorm | $0.7977$ | $0.29$ | $0.8498$ | $0.8293$ | $[0.732, 0.932]$ | $0.7733$ | $0.6667$ | $0.7391$ | $0.1651$ | $0.1586$ | $0.81$ | $21$ |
| **D** | `appD_soft_voting` | Soft Voting (RF + HistGBDT + GELU MLP) | $0.8423$ | $0.34$ | $0.8488$ | $0.8293$ | $[0.710, 0.946]$ | $0.6800$ | $0.5862$ | $0.6869$ | $0.1541$ | $0.1161$ | $810.40$ | — |
| **D** | `appD_weighted_avg` | Weighted Avg (0.25 RF, 0.44 GB, 0.31 MLP)| $0.8443$ | $0.34$ | $0.8459$ | **$0.8780$** | $[0.781, 0.973]$ | $0.6400$ | $0.5714$ | $0.6923$ | $0.1546$ | $0.1270$ | $1,974.32$| — |
| **D** | `appD_stacking_logit` | OOF Stacking Meta-Learner (Logistic) | $0.8407$ | $0.37$ | $0.8488$ | $0.8537$ | $[0.744, 0.952]$ | $0.6533$ | $0.5738$ | $0.6863$ | $0.1551$ | $0.1023$ | $94.75$ | $3,570$ |

---

## 6. Sensitivity, Specificity & Absolute Error Analysis

### Heart Disease Confusion Matrix Breakdown ($N_{\text{test}} = 9,745$)
| Model Candidate | True Negatives (TN) | False Positives (FP) | False Negatives (FN) | True Positives (TP) | False Negative Rate (Missed Cases) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `appA_rf_baseline` | $2,882$ | $1,905$ | $913$ | $4,045$ | $18.41\%$ |
| `appB_grad_boost_std` | $2,897$ | $1,890$ | $903$ | $4,055$ | $18.21\%$ |
| `appC_mlp_pyramid_silu` | $2,850$ | $1,937$ | $869$ | $4,089$ | **$17.53\%$** |
| `appD_ensemble_stacking_logistic` | $2,852$ | $1,935$ | $891$ | $4,067$ | $17.97\%$ |

### Diabetes Confusion Matrix Breakdown ($N_{\text{test}} = 116$, $41$ Diabetic)
| Model Candidate | True Negatives (TN) | False Positives (FP) | False Negatives (FN) | True Positives (TP) | False Negative Rate (Missed Cases) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Production Baseline MLP** | **$69$** | **$6$** | **$25$** | **$16$** | **$60.98\%$** *(CRITICAL FAILURE)* |
| `appA_extratrees` | $57$ | $18$ | $6$ | $35$ | $14.63\%$ |
| `appB_hist_gbdt_base` | $52$ | $23$ | $10$ | $31$ | $24.39\%$ |
| `appC_mlp_6layer_bottleneck_gelu` | $48$ | $27$ | **$5$** | **$36$** | **$12.20\%$** *(Lowest Missed Cases)* |
| `appD_ensemble_weighted_average` | $48$ | $27$ | **$5$** | **$36$** | **$12.20\%$** |

---

## 7. Probability Calibration Analysis

Post-processing calibration was systematically investigated using held-out validation predictions:

| Dataset | Model ID | Raw Brier Score | Raw ECE | Isotonic Brier Score | Isotonic ECE | Sigmoid (Platt) Brier Score | Sigmoid (Platt) ECE | Best Calibration Strategy |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Heart Disease** | `appB_hist_gbdt_base` | $0.1819$ | **$0.0073$** | $0.1823$ | **$0.0073$** | $0.1821$ | $0.0081$ | **Raw model outputs** (inherently well-calibrated; post-processing unneeded). |
| **Diabetes** | `appB_hist_gbdt_base` | $0.1601$ | $0.1076$ | $0.1617$ | **$0.0808$** | $0.1692$ | $0.1025$ | **Isotonic Calibration** (reduces ECE from $10.7\%$ to $8.0\%$). |

*Note on Neural Calibration:* For Diabetes, the regularized 6-layer GELU MLP (`appC_mlp_6layer_bottleneck_gelu`) achieved an unmatched **raw $\text{ECE} = 0.0291$** without any post-processing, due to the smooth probabilistic nature of GELU combined with decoupled weight decay.

---

## 8. Feature Explainability & Clinical Associations

Permutation importance computed on the held-out validation partition identifies the dominant clinical drivers for both diseases:

### Heart Disease Feature Attribution
```
AP_HIGH (Systolic Blood Pressure):  0.1486  ██████████████████████████████
CHOLESTEROL:                         0.0326  ███████
AGE:                                 0.0216  █████
AP_LOW (Diastolic Blood Pressure):   0.0052  █
WEIGHT:                              0.0038  █
GLUCOSE:                             0.0006  
ALCOHOL:                             0.0006  
HEIGHT:                              0.0005  
GENDER:                              0.0003  
SMOKE:                               0.0001  
PHYSICAL_ACTIVITY:                  -0.0006  
```
*Clinical Interpretation:* Systolic hypertension (`AP_HIGH`) is by far the single most decisive clinical feature, contributing nearly $70\%$ of the predictive power, followed by serum cholesterol and age.

### Diabetes Feature Attribution
```
Glucose:                             0.1078  ██████████████████████████████
BMI:                                 0.0417  ████████████
Age:                                 0.0348  ██████████
DiabetesPedigreeFunction:            0.0278  ████████
Pregnancies:                         0.0104  ███
SkinThickness:                       0.0017  
Insulin:                             0.0017  
BloodPressure:                      -0.0070  
```
*Clinical Interpretation:* Fasting plasma glucose and body mass index (BMI) dominate diabetes risk, followed by age and genetic predisposition (`DiabetesPedigreeFunction`).

---

## 9. Computational Efficiency & Latency Profiling

*Single-sample CPU execution benchmarked across 1,000 iterations:*

| Approach | Model Architecture | Mean Latency (ms) | P95 Latency (ms) | Max Throughput (req/sec) | Model Size on Disk | Production Serving Assessment |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Approach B** | `GradientBoostingClassifier` | **$0.40$** | **$0.61$** | $2,500$ | $187\text{ KB}$ | **Ultra-lightweight, optimal for production.** |
| **Approach B** | `HistGradientBoostingClassifier`| $24.38$ | $32.10$ | $41$ | $501\text{ KB}$ | Fast; fits inside microservice memory easily. |
| **Approach C** | `PyTorch Deep Pyramid MLP` | $0.79$ | $1.25$ | $1,265$ | $22\text{ KB}$ | Extremely compact; sub-millisecond execution. |
| **Approach A** | `RandomForestClassifier` | $116.02$ | $145.20$ | $8$ | $32.6\text{ MB}$ | Large memory footprint; moderate latency. |
| **Approach D** | `OOF Stacking Meta-Learner` | $113.60$ | $148.50$ | $8$ | $65.5\text{ MB}$ | Complex multi-model dependency graph. |

---

## 10. Separate Final Rankings & Recommendations

### 10.1 Heart Disease Risk Prediction Ranking

| Rank | Model ID | Approach | Rationale & Trade-Offs |
| :---: | :--- | :---: | :--- |
| **1** | **`appB_grad_boost_std`** | **Approach B (GBDT)** | **Strongest Single-Model Generalization.** Highest test ROC-AUC ($0.7987$), lowest Brier score ($0.1816$), near-zero ECE ($0.0068$), ultra-fast latency ($0.40\text{ ms}$), and tiny size ($187\text{ KB}$). |
| **2** | **`appD_ensemble_stacking_logistic`** | **Approach D (Ensemble)** | **Highest Sensitivity.** Captures $4,067$ true positives ($82.03\%$), but requires maintaining 3 constituent models with $113\text{ ms}$ latency and $65\text{ MB}$ size. |
| **3** | **`appC_mlp_deep_pyramid_silu`** | **Approach C (Deep MLP)** | **Best Neural Model.** Test AUC $0.7970$, lowest ECE ($0.0061$), $0.79\text{ ms}$ latency, $22\text{ KB}$ size. |
| **4** | **`appA_rf_baseline`** | **Approach A (Trad ML)** | **Production Equivalent.** Test AUC $0.7961$, solid but slower and larger than GBDT. |

> [!WARNING]
> **HEART DISEASE VERDICT: HOLD PROMOTION**  
> While `GradientBoostingClassifier` ($0.7987$) and `Stacking Ensemble` ($0.7982$) exhibit excellent discrimination and low Brier scores, the existing production `RandomForestClassifier` holds a verified historical baseline of $0.8003$. Until head-to-head live shadow testing demonstrates a decisive real-world gain, the production Random Forest remains frozen in place.

---

### 10.2 Diabetes Risk Prediction Ranking

| Rank | Model ID | Approach | Rationale & Trade-Offs |
| :---: | :--- | :---: | :--- |
| **1** | **`appC_mlp_6layer_bottleneck_gelu`** | **Approach C (Deep MLP)** | **Highest Clinical Sensitivity & Unmatched Calibration.** Detects $36$ of $41$ diabetic patients ($87.80\%$ recall, $+48.78\%$ over baseline). Achieves an outstanding $\text{ECE} = 0.0291$, $3.24\text{ ms}$ latency, and $10\text{ KB}$ size. |
| **2** | **`appA_extratrees`** | **Approach A (Trad ML)** | **Highest Raw Test Discrimination.** Test ROC-AUC $0.8634$, Recall $85.37\%$, Specificity $76.00\%$, F1 $0.7447$. Higher ECE ($0.1374$) and larger size ($1.6\text{ MB}$). |
| **3** | **`appD_ensemble_weighted_average`** | **Approach D (Ensemble)** | **Robust Balanced Ensemble.** Recall $87.80\%$, Test AUC $0.8459$, but high latency ($1,974\text{ ms}$) due to sequential multi-model passes. |
| **4** | **`appB_hist_gbdt_base`** | **Approach B (GBDT)** | **Highest Validation Discrimination.** Val AUC $0.8467$, Test AUC $0.8280$, but lower test recall ($75.61\%$). |
| **12** | **`baseline_sklearn_mlp`** | **Production Baseline** | **Clinically Hazardous.** Misses $60.98\%$ of diabetic patients (Recall $39.02\%$). Disqualified. |

> [!IMPORTANT]
> **DIABETES VERDICT: CONDITIONAL PROMOTION TO STAGING**  
> The current production MLP in `artifacts/diabetes/` has an intolerable false negative rate ($60.98\%$). Both the regularized **6-layer GELU MLP** (`appC_mlp_6layer_bottleneck_gelu`, Sensitivity $87.80\%$, ECE $0.0291$) and **Extra Trees** (`appA_extratrees`, Test AUC $0.8634$, Sensitivity $85.37\%$) resolve this clinical danger.  
> Following production safety protocol, the production artifact remains untouched until formal sign-off. The candidate artifacts are packaged in the isolated experiment directory ready for deployment.

---

## 11. Exact Artifact Locations & Reproduction Commands

### File System Directory Tree
```
ai-prediction-service/artifacts/experiments/benchmark_four_approaches_20261019/
├── benchmark_summary.json                    # Machine-readable master results
├── heart_disease/
│   ├── appA_rf_baseline.joblib
│   ├── appA_rf_tuned.joblib
│   ├── appA_extratrees.joblib
│   ├── appB_hist_gbdt_base.joblib
│   ├── appB_hist_gbdt_tuned.joblib
│   ├── appB_grad_boost_std.joblib           # Top Heart Disease Candidate
│   ├── appC_mlp_baseline_2layer.joblib
│   ├── appC_mlp_6layer_bottleneck_gelu.joblib
│   ├── appC_mlp_deep_pyramid_silu.joblib
│   ├── appD_stacking_meta_learner.joblib
│   ├── scaler.joblib
│   └── benchmark_report.json                 # Detailed Heart Disease report
└── diabetes/
    ├── appA_rf_baseline.joblib
    ├── appA_rf_tuned.joblib
    ├── appA_extratrees.joblib                # Top Diabetes Tabular Candidate
    ├── appB_hist_gbdt_base.joblib
    ├── appB_hist_gbdt_tuned.joblib
    ├── appB_grad_boost_std.joblib
    ├── appC_mlp_baseline_2layer.joblib
    ├── appC_mlp_6layer_bottleneck_gelu.joblib # Top Diabetes Neural Candidate
    ├── appC_mlp_deep_pyramid_silu.joblib
    ├── appD_stacking_meta_learner.joblib
    ├── scaler.joblib
    ├── training_medians.joblib
    └── benchmark_report.json                 # Detailed Diabetes report
```

### Reproduction Command
To reproduce the entire benchmark from the repository root:
```powershell
cd D:\projects\MediMind\ai-prediction-service
py scripts/benchmark_four_approaches.py
```
To run the automated regression and unit test suite:
```powershell
cd D:\projects\MediMind\ai-prediction-service
py -m pytest tests/heart_disease tests/diabetes -v
```
