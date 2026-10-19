# MediMind — Diabetes Candidate Metric Provenance & Discrepancy Resolution

**Document Version:** 1.0.0  
**Audit Date:** October 19, 2026  
**Evaluation Scope:** Dual Candidates for Stage 2 Diabetes Shadow Evaluation  
**Target Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  

---

## 1. Discrepancy Statement & Investigation Purpose

In the Four-Approach AI Benchmark Report (`MediMind_Four_Approach_AI_Benchmark_Report.md`) and benchmark data summary (`benchmark_summary.json`), Candidate C (`appC_mlp_6layer_bottleneck_gelu`) was recorded as:
- **Sensitivity:** $87.80\%$
- **Test ROC-AUC:** $0.8387$
- **Expected Calibration Error (ECE):** $0.0291$
- **Threshold:** $0.4000$ (tuned on validation partition)

In contrast, the draft shadow readiness protocol (`MediMind_Diabetes_Shadow_Evaluation_Protocol.md`) listed:
- **Sensitivity:** $80.00\%$
- **Test ROC-AUC:** $0.8351$
- **Operating Threshold:** $0.4500$

This investigation conducted independent, reproducible code and artifact audits to trace the origin of every metric, verify artifact hashes, and determine whether the discrepancy was caused by an artifact replacement, split divergence, preprocessing shift, threshold change, or documentation transcription error.

---

## 2. Cryptographic Provenance & Artifact Identity

Every model file, preprocessing pipeline, and dataset partition was inspected directly on disk:

| Provenance Property | Candidate C (Deep Bottleneck MLP) | Candidate A (Extra-Trees Ensemble) | Preprocessing Imputation | Preprocessing Scaler |
| :--- | :--- | :--- | :--- | :--- |
| **Model ID** | `appC_mlp_6layer_bottleneck_gelu` | `appA_extratrees` | `training_medians` | `StandardScaler` |
| **Artifact Path** | `artifacts/experiments/benchmark_four_approaches_20261019/diabetes/appC_mlp_6layer_bottleneck_gelu.joblib` | `artifacts/experiments/benchmark_four_approaches_20261019/diabetes/appA_extratrees.joblib` | `artifacts/experiments/benchmark_four_approaches_20261019/diabetes/training_medians.joblib` | `artifacts/experiments/benchmark_four_approaches_20261019/diabetes/scaler.joblib` |
| **Verified SHA-256** | `a1f15032c7115f6c45766c85aeb8dcba49dc8e7a3d39d7673289d723f3475662` | `daf817642888e2e7daffe45c6372f9c25048b37d046597659524383f0418f245` | `9917bc4082b554609e7e4fc2e9dba0fe0bc1e6ab96ef7bee4614cf04ec330885` | `a64149644163bf5c89c323ebb868933c9a6bb29d9648cdeec3b5d5b296fc6f68` |
| **Artifact Size** | $11.58\text{ KB}$ ($11,859\text{ bytes}$) | $1.63\text{ MB}$ ($1,666,905\text{ bytes}$) | $119\text{ bytes}$ | $1,127\text{ bytes}$ |
| **Architecture** | PyTorch 6-Layer Bottleneck MLP `[8-32-16-8-4-2-2-1]`, GELU, Dropout 0.1, AdamW | `CalibratedClassifierCV(ExtraTreesClassifier(n_estimators=200))` | Median values for biological zero columns (Gluc=117, BP=72, Skin=29, Ins=126, BMI=32.4) | Scikit-learn `StandardScaler` fitted exclusively on training set |

---

## 3. Dataset & Partition Identity

- **Source Dataset:** `ai-prediction-service/test-dataset/Diabetes/diabetes.csv` ($N = 768$ observations, 8 clinical features, 1 binary outcome).
- **Deduplication:** Dropped exact duplicates resulting in $N = 768$ unique clean records.
- **Split Construction:** Stratified 70/15/15 split using Scikit-learn `train_test_split` with fixed random seed `RANDOM_STATE = 42`:
  - **Train Split:** $N = 537$ samples (187 positive, 350 negative).
  - **Validation Split:** $N = 115$ samples (40 positive, 75 negative).
  - **Test Split:** $N = 116$ samples (41 positive, 75 negative).

---

## 4. Empirical Metric Reproduction Across Operating Thresholds

Using the verified candidate weights, imputation medians, and scaler, inference was executed directly against the canonical held-out test split ($N = 116$):

### 4.1 Candidate C (`appC_mlp_6layer_bottleneck_gelu`)
- **Discriminative Power:** $\text{ROC-AUC} = 0.8387$, $\text{PR-AUC} = 0.7348$, $\text{Brier Score} = 0.1665$, $\text{ECE} = 0.0291$.

| Operating Threshold ($t$) | Sensitivity (Recall) | Specificity | Precision | F1 Score | Confusion Matrix $[[TN, FP], [FN, TP]]$ | Source of Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$t = 0.4000$ (Benchmark Tuned)** | **$87.80\%$** ($36 / 41$) | **$64.00\%$** ($48 / 75$) | $57.14\%$ ($36 / 63$) | $0.6923$ | `[[48, 27], [5, 36]]` | Optimized on validation set for $\text{Sens} \ge 0.85$ |
| **$t = 0.4500$ (Shadow Proposal)**| **$85.37\%$** ($35 / 41$) | **$65.33\%$** ($49 / 75$) | $57.38\%$ ($35 / 61$) | $0.6863$ | `[[49, 26], [6, 35]]` | Proposed conservative clinical trade-off |
| **$t = 0.5000$ (Default Baseline)**| **$80.49\%$** ($33 / 41$) | **$69.33\%$** ($52 / 75$) | $58.93\%$ ($33 / 56$) | $0.6804$ | `[[52, 23], [8, 33]]` | Standard uncalibrated classification threshold |

### 4.2 Candidate A (`appA_extratrees`)
- **Discriminative Power:** $\text{ROC-AUC} = 0.8634$, $\text{PR-AUC} = 0.7883$, $\text{Brier Score} = 0.1583$, $\text{ECE} = 0.1374$.

| Operating Threshold ($t$) | Sensitivity (Recall) | Specificity | Precision | F1 Score | Confusion Matrix $[[TN, FP], [FN, TP]]$ | Source of Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$t = 0.4300$ (Benchmark Tuned)** | **$85.37\%$** ($35 / 41$) | **$76.00\%$** ($57 / 75$) | $66.04\%$ ($35 / 53$) | $0.7447$ | `[[57, 18], [6, 35]]` | Optimized on validation set for $\text{Sens} \ge 0.85$ |
| **$t = 0.4500$ (Comparative)** | **$80.49\%$** ($33 / 41$) | **$78.67\%$** ($59 / 75$) | $67.35\%$ ($33 / 49$) | $0.7333$ | `[[59, 16], [8, 33]]` | Standard intermediate threshold |
| **$t = 0.5000$ (Default Baseline)**| **$68.29\%$** ($28 / 41$) | **$81.33\%$** ($61 / 75$) | $66.67\%$ ($28 / 42$) | $0.6747$ | `[[61, 14], [13, 28]]` | Standard probability threshold |

---

## 5. Root-Cause Analysis of Discrepancies

### 5.1 Sensitivity Discrepancy ($87.80\%$ vs $80.00\%$)
- **Root Cause:** Operating threshold alignment and informal rounding.
- At the validation-tuned threshold ($t = 0.4000$), Candidate C detects $36$ of $41$ diabetic cases, producing an exact test sensitivity of **$87.80\%$** ($36/41 = 0.878048$).
- At the standard threshold ($t = 0.5000$), Candidate C detects $33$ of $41$ cases, yielding an exact test sensitivity of **$80.49\%$** ($33/41 = 0.804878$).
- During the drafting of the shadow protocol, the author informally rounded the default-threshold sensitivity ($80.49\% \to 80.00\%$) while simultaneously discussing a proposed conservative threshold of $t = 0.4500$ (where actual sensitivity is $85.37\%$).

### 5.2 ROC-AUC Discrepancy ($0.8387$ vs $0.8351$)
- **Root Cause:** Documentation transcription typo.
- The exact test ROC-AUC on the held-out partition is $0.838699$ ($0.8387$). The validation ROC-AUC is $0.8223$.
- The number $0.8351$ does not exist in any machine-learning artifact or training log within `ai-prediction-service`; it was an erroneous manual transcription.

### 5.3 Candidate File SHA-256 Discrepancy
- The hashes originally written in the Stage 2 draft (`26b3a2ae...` and `c0fe202b...`) were placeholder hashes.
- The actual disk SHA-256 hashes generated on October 19, 2026 at 17:46/17:47 are:
  - `appC_mlp_6layer_bottleneck_gelu.joblib`: `a1f15032c7115f6c45766c85aeb8dcba49dc8e7a3d39d7673289d723f3475662`
  - `appA_extratrees.joblib`: `daf817642888e2e7daffe45c6372f9c25048b37d046597659524383f0418f245`
  - `training_medians.joblib`: `9917bc4082b554609e7e4fc2e9dba0fe0bc1e6ab96ef7bee4614cf04ec330885`

---

## 6. Official Canonical Baseline Table

For all prospective shadow evaluation accounting and status reporting going forward, the authoritative metrics are established as follows:

| Metric | Candidate C (Deep Bottleneck MLP) | Candidate A (Calibrated Extra-Trees) |
| :--- | :--- | :--- |
| **Operating Threshold** | **$0.4000$** (Predeclared Validation-Tuned) | **$0.4300$** (Predeclared Validation-Tuned) |
| **Test Sensitivity (Recall)** | **$87.80\%$** ($36 / 41$) | **$85.37\%$** ($35 / 41$) |
| **Test Specificity** | **$64.00\%$** ($48 / 75$) | **$76.00\%$** ($57 / 75$) |
| **Test ROC-AUC** | **$0.8387$** | **$0.8634$** |
| **Test PR-AUC** | **$0.7348$** | **$0.7883$** |
| **Expected Calibration Error (ECE)** | **$0.0291$** | **$0.1374$** |
| **Brier Score** | **$0.1665$** | **$0.1583$** |
| **P95 Latency** | **$9.09\text{ ms}$** | **$140.14\text{ ms}$** (Single-sample target: $\le 20\text{ ms}$) |
| **Test Confusion Matrix** | `[[48, 27], [5, 36]]` | `[[57, 18], [6, 35]]` |
