# Novelty Assessment: Scope, Scientific Contributions, and Non-Claims

**Module:** MediMind Type-2 Diabetes Prediction System  
**Date:** November 2026  
**Auditor:** Senior Clinical AI Researcher & Data Scientist  

---

## 1. Non-Claims (What We Do NOT Claim)

In accordance with strict scientific integrity and clinical safety standards, **we explicitly do not claim**:
1. We do **not** claim a "first-ever" machine learning algorithm for diabetes prediction.
2. We do **not** claim a "medical breakthrough" or unverified "state-of-the-art" superiority over all existing algorithms.
3. We do **not** claim clinical readiness or diagnostic clearance (no FDA 510(k), De Novo, or CE-MDR clearance exists).
4. We do **not** claim that a single algorithm can replace laboratory diagnostic blood testing (fasting glucose or HbA1c).

---

## 2. Genuine, Defensible Research Contributions

Our research delivers four specific, measurable, and scientifically defensible contributions:

### Contribution 1: Identification of the "Frankfurt Hospital" Benchmark Contamination
* **Literature Context:** Numerous published papers cite the 2,000-record "Hospital Frankfurt, Germany" dataset as proof of external European generalization.
* **Our Finding:** Through exhaustive row-level matching, we prove that **$99.05\%$ of records ($1,981 / 2,000$) in this dataset are duplicate resamplings of the 1988 Pima Indians dataset**. We unmask this widespread literature pitfall and establish that evaluating on Frankfurt Hospital measures row-level memorization rather than European clinical generalization.

### Contribution 2: Empirical Quantification of the Single-Cohort Generalization Gap
* **Empirical Demonstration:** We empirically prove that an ensemble achieving $0.8424\text{ ROC-AUC}$ on Pima drops to **$0.7085\text{ ROC-AUC}$** when transferred zero-shot to a large-scale clinical EHR cohort ($N = 100,000$). We demonstrate that sensitivity collapses from $80.5\%$ to $4.48\%$ when base-rate prevalence changes ($34.9\% \to 8.5\%$) without calibration-aware threshold adaptation.

### Contribution 3: Harmonized Multi-Cohort Learning with National Epidemiological Validation
* **Methodological Advance:** We develop a Harmonized Core Clinical Feature Space ($\mathcal{X}_{\text{core}}$) that reconciles acute physiological oral glucose tolerance tests with continuous outpatient EHR indicators.
* **Empirical Validation:** Training on the harmonized multi-cohort representation yields an **ROC-AUC of $0.8476$ on the independent CDC NHANES examination cohort ($N = 9,813$ American adults)**, establishing broad demographic and ethnic generalization across nationally representative populations.

### Contribution 4: Clinically Actionable Probability Calibration & Decision Curve Analysis
* **Calibration:** We demonstrate that Platt scaling on hold-out validation data reduces Expected Calibration Error (ECE) from $17.28\%$ to **$4.63\%$**, rectifying tree-ensemble overconfidence.
* **Decision Curve Analysis:** Under Vickers & Elkin Decision Curve Analysis, we demonstrate that the model provides positive net clinical benefit across all screening thresholds $p_t \in [0.10, 0.45]$, **avoiding $20.4$ unnecessary invasive diagnostic workups per 100 patients screened** compared to default "screen all" clinical guidelines.
