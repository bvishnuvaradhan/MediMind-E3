# MediMind — AI Benchmark Corrections & Audit Reconciliations

**Document ID:** `MEDIMIND-CORRECTIONS-20261019`  
**Date:** October 19, 2026  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  
**Auditor:** Antigravity Advanced Agentic Coding System  
**Scope:** Reconciled Discrepancies and Clarifications for the Four-Approach AI Benchmark  
**Status:** **RECONCILED & DOCUMENTED**

---

## 1. Overview of Audit Reconciliations

During the independent verification of the Four-Approach AI Benchmark (`Documents/AI_Experiments/MediMind_Four_Approach_AI_Benchmark_Report.md`), several methodological nuances, reporting simplifications, and statistical caveats were identified. 

This document details every confirmed discrepancy, providing the original reported claim, the audited empirical reality, the underlying cause, and the formal correction.

---

## 2. Itemized Discrepancy Log

### Discrepancy 1: Labeling of Specificity-Floor Compliance on the Test Partition

| Attribute | Details |
| :--- | :--- |
| **Component** | Heart Disease Risk Prediction Benchmark |
| **Affected Candidates** | `appA_extratrees` ($0.5947$), `appC_mlp_pyramid_silu` ($0.5952$), `appD_stacking_logit` ($0.5958$) |
| **Original Stated Claim** | "All valid evaluated candidates strictly comply with the clinical specificity floor of $\ge 0.60$." |
| **Audited Empirical Reality** | Specificity $\ge 0.6000$ was strictly enforced **on the validation partition** during threshold selection. When evaluated on the unseen test set ($N=9,745$), test specificity realized at $0.5947 - 0.5958$ (approximately $0.005$ below the floor). |
| **Root Cause** | Finite-sample generalization variance. On the validation set, `appA_extratrees` achieved specificity of $0.6013$ ($2,878$ TN, $1,908$ FP). On the test set ($4,787$ negatives), it registered $1,940$ FP—an increase of only $26$ false positives out of $4,787$ negative cases ($+0.54\%$ false positive shift). |
| **Correction & Clinical Ruling** | The algorithm correctly adhered to test-set isolation by never tuning against test data. However, reporting text must be corrected to state: *"Thresholds met the $\ge 0.60$ specificity floor on validation data, but exhibited minor finite-sample generalization drift on the test partition ($0.595$)."* For future clinical deployment, a validation safety buffer ($\text{Specificity}_{\text{val}} \ge 0.6200$) must be applied. |

---

### Discrepancy 2: Historical Production Random Forest vs. Unified-Split Test ROC-AUC

| Attribute | Details |
| :--- | :--- |
| **Component** | Heart Disease Baseline Comparison |
| **Affected Model** | `artifacts/heart_disease/best_model.joblib` |
| **Original Stated Claim** | "Production Random Forest achieves test ROC-AUC of $0.8003$." |
| **Audited Empirical Reality** | When the exact frozen production `best_model.joblib` artifact is loaded and evaluated on the newly quarantined unified 70/15/15 test partition ($N_{\text{test}} = 9,745$), its measured test ROC-AUC is **$0.7961$** (matching `appA_rf_baseline`). |
| **Root Cause** | The $0.8003$ figure represents the historical evaluation recorded in `artifacts/heart_disease/training_report.json` on an earlier split. When evaluated on the standardized unified benchmark split, test discrimination is $0.7961$. |
| **Correction & Clinical Ruling** | The report must clearly separate historical claims from unified-split measurements. The production model remains very competitive ($0.7961$ vs $0.7987$ for the best GBDT), supporting the decision to retain the production model until live shadow validation demonstrates decisive superiority. |

---

### Discrepancy 3: Statistical Significance Context for Diabetes Benchmark Gains

| Attribute | Details |
| :--- | :--- |
| **Component** | Diabetes Risk Prediction Candidate Selection |
| **Affected Candidates** | `appC_mlp_6layer_bottleneck_gelu` ($87.80\%$) vs `appA_extratrees` ($85.37\%$) |
| **Original Stated Claim** | "The regularized 6-layer GELU MLP outperforms Extra Trees and achieves the highest clinical sensitivity." |
| **Audited Empirical Reality** | The test set contains only **$41$ positive diabetic cases**. Every single patient represents $\frac{1}{41} \approx 2.439\%$ of the sensitivity metric. Extra Trees detected $35$ cases ($85.37\%$), while GELU MLP detected $36$ cases ($87.80\%$)—a difference of **exactly ONE patient**. |
| **Root Cause** | Small-sample test cohort ($N_{\text{test}} = 116$, $41$ positive). Bootstrap 95% confidence intervals overlap substantially ($[0.7439, 0.9524]$ for Extra Trees vs $[0.7805, 0.9726]$ for GELU MLP). |
| **Correction & Clinical Ruling** | While the improvement over the baseline ($39.02\%$, $16/41$ cases) is statistically decisive ($p < 0.001$), claims of clinical superiority between Extra Trees and GELU MLP are statistically unproven on this dataset. Both models must be carried forward into shadow staging. |

---

### Discrepancy 4: Production Pipeline Biological Zero Handling Gap

| Attribute | Details |
| :--- | :--- |
| **Component** | Production Diabetes Serving Pipeline |
| **Affected File** | `ai-prediction-service/app/services/diabetes_service.py` |
| **Original Assumption** | "Production model automatically handles missing and biological zero values." |
| **Audited Empirical Reality** | `artifacts/diabetes/best_model.joblib` is a Scikit-learn Pipeline containing only `StandardScaler` and `MLPClassifier`. Biological zero imputation was performed in the training script, but was **NOT encapsulated in the serialized pipeline**. At inference time, `diabetes_service.py` passes raw values directly to `model.predict_proba()`. |
| **Root Cause** | Preprocessing logic gap between training script and deployed inference service. When a patient submits `Insulin: 0`, the production pipeline scales `0` directly as a valid measurement rather than imputing the training median ($126.0$). |
| **Correction & Clinical Ruling** | The newly created `staging_diabetes_service.py` explicitly closes this gap by loading `training_medians.joblib` and applying `apply_biological_zero_imputation()` prior to scaling. This fix must be ported to the production service upon model promotion. |

---

## 3. Unresolved Discrepancies & Audit Scope Boundaries

1. **In-Memory Ensemble Checkpoints:**
   In `benchmark_four_approaches.py`, the soft voting and weighted average ensemble predictions were generated on-the-fly from the constituent models rather than serialized as standalone `.joblib` files. While their constituent models were verified and their predictions recomputed, the standalone composite objects were not stored on disk. Stacking meta-learner weights were independently verified via `appD_stacking_meta_learner.joblib`.
2. **External Population Generalizability:**
   Because all models were evaluated on the retrospective Pima dataset, external validity across diverse platform demographics remains unverified. This can only be resolved via prospective shadow data collection.
