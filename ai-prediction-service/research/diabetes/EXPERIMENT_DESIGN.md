# Experimental Design: Multi-Cohort Diabetes Risk Prediction

**Module:** MediMind Type-2 Diabetes Prediction System  
**Date:** November 2026  
**Auditor:** Senior ML Research Engineer & Data Scientist  

---

## 1. Experimental Protocol & Partitioning Integrity

To eliminate data leakage, all dataset partitions follow strict clinical evaluation rules:
1. **Partition Stratification:** Partitions are stratified by target class balance ($70\%$ training, $15\%$ validation, $15\%$ held-out test).
2. **Train-Only Preprocessing:** Imputation medians, standard scaling transforms, and calibration mappings are fit strictly on training and validation sets. Test partitions are transformed using pre-computed statistics.
3. **Multi-Seed Stability:** Baseline models and candidate architectures are evaluated across 5 random seeds: $\mathcal{S} = \{42, 123, 456, 789, 2026\}$.
4. **Independent Test Partition Quarantine:** The test partition is never accessed during model selection, hyperparameter tuning, or threshold selection.

---

## 2. Overview of 10 Executed Experiments

| Experiment ID | Title | Objective | Primary Cohort(s) | Evaluation Metric Focus |
|---|---|---|---|---|
| **Exp 1** | Baseline Reproduction & Seed Stability | Independently reproduce existing MLP baseline across 5 seeds | Pima Indians ($N=768$) | Mean & Std of ROC-AUC, Sensitivity, Specificity, Brier |
| **Exp 2** | Architectural Benchmark | Compare LR, RF, MLP, HistGradientBoosting, and Ensemble | Pima Indians ($N=768$) | ROC-AUC, PR-AUC, F1, ECE, Brier Score |
| **Exp 3** | Imputation & Missingness Sensitivity | Evaluate median vs. KNN imputation and missingness indicators | Pima Indians ($N=768$) | F1, ROC-AUC, Calibration Error |
| **Exp 4** | Probability Calibration Comparison | Compare Uncalibrated vs. Platt Sigmoid vs. Isotonic Regression | Pima Indians ($N=768$) | ECE, Maximum Calibration Error, Calibration Slope & Intercept |
| **Exp 5** | Cross-Cohort Generalization | Zero-shot cohort transfer between Pima and Healthcare 100k | Pima ($N=768$) $\leftrightarrow$ Healthcare 100k ($N=100,000$) | Generalization ROC-AUC, Sensitivity Collapse, Domain Shift |
| **Exp 6** | Multi-Cohort Harmonized Learning | Joint learning on harmonized physiological-clinical core ($\mathcal{X}_{\text{core}}$) | Pima + Healthcare 100k ($N=5,768$) | Joint Held-out ROC-AUC, Pure Pima Generalization |
| **Exp 7** | Epidemiological Population Transfer | Zero-shot validation on nationally representative multi-ethnic cohort | CDC NHANES ($N=9,813$) | Cross-population ROC-AUC, Balanced Accuracy, Specificity |
| **Exp 8** | Clinical Utility & DCA | Evaluate Net Clinical Benefit across decision thresholds ($p_t \in [0.05, 0.70]$) | Pima Test & Joint Multi-Cohort | Net Benefit Curve vs. Treat-All & Treat-None Policies |
| **Exp 9** | Subgroup Fairness & Algorithmic Equity | Audit performance across Age Cohorts and BMI Categories | Pima & Multi-Cohort Cohorts | Equal Opportunity Gap (TPR disparity), Predictive Equality |
| **Exp 10** | Adversarial Literature Audit | Unmask data contamination and duplication in Frankfurt Hospital dataset | Frankfurt Hospital ($N=2,000$) vs. Pima | Deduplication overlap %, Inflation of test performance |

---

## 3. Evaluation Metrics & Statistical Bounds

All experiments measure and record:
* **Discrimination:** Receiver Operating Characteristic Area Under Curve (ROC-AUC), Precision-Recall Area Under Curve (PR-AUC).
* **Clinical Diagnostic Metrics:** Sensitivity (Recall), Specificity, Positive Predictive Value (Precision), Balanced Accuracy, F1-Score.
* **Calibration & Reliability:** Brier Score, Expected Calibration Error (ECE, 10 bins), Maximum Calibration Error (MCE), Calibration Slope and Intercept.
* **Confidence Intervals:** 95% Wilson Score intervals for binomial proportions; bootstrap / asymptotic standard errors for continuous estimates.
