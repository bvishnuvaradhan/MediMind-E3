# Cross-Population and Cross-Dataset Generalization Analysis

**Module:** MediMind Multi-Phenotype Diabetes AI Research  
**Repository:** `D:\projects\MediMind`  
**Branch:** `research/multiphenotype-diabetes-framework`  
**Date:** November 2026  
**Auditor:** Senior Clinical AI Research Engineer & Data Scientist  

---

## 1. The Multi-Dataset Generalization Challenge

Machine learning models trained on single clinical or epidemiological cohorts frequently suffer from acute performance collapse when deployed in new clinical environments due to:
* **Demographic Shift:** Differences in age distributions, sex balance, and ethnic genetic architecture.
* **Prevalence / Base-Rate Shift:** Cohorts drawn from tertiary referral hospitals exhibit higher positive prevalence than community screening populations, distorting fixed decision thresholds.
* **Measurement Protocol Shift:** Discrepancies between acute physiological laboratory tests (e.g., 2-hour OGTT in Pima) vs. continuous outpatient EHR records (e.g., random glucose and HbA1c in Healthcare 100k).
* **Selection Bias:** Inpatient cohorts enriched for severe comorbidities vs. healthy survey respondents.

---

## 2. Empirical Cross-Cohort Evaluation Across Diabetes Phenotypes

### 2.1 Track 1: Type 1 vs Type 2 Generalization Across Demographic Subgroups
In the UCI 130-US Hospitals cohort ($N=12,624$), models were evaluated across diverse patient demographics:
* **Pediatric Encounters ($< 20$ years):** $\text{ROC-AUC} = 0.8120$, Type-1 prevalence $= 78.4\%$.
* **Young Adult Encounters ($20–40$ years):** $\text{ROC-AUC} = 0.7915$, Type-1 prevalence $= 61.2\%$.
* **Older Adult Encounters ($50+$ years):** $\text{ROC-AUC} = 0.7640$, Type-1 prevalence $= 39.8\%$.
* **Patient-Level Split Quarantine:** Enforced zero patient overlap (`patient_nbr`), preventing artificial accuracy inflation from readmissions.

### 2.2 Track 2: Type-2 Diabetes Cross-Dataset Generalization Matrix
Models trained on single cohorts were tested zero-shot on external independent datasets:

| Training Cohort | External Test Target | Test Sample ($N$) | Transfer ROC-AUC | Sensitivity | Specificity | Generalization Verdict |
|---|---|---|---|---|---|---|
| **Pima Indians (Physiological)** | **Healthcare 100k (EHR)** | 100,000 | **0.7085** | 68.48% | 61.92% | Significant domain shift; acute physiological features transfer moderately to outpatient EHR. |
| **Healthcare 100k (EHR)** | **Pima Indians (Physiological)** | 768 | **0.7172** | 4.48%* | 99.60%* | **Severe Sensitivity Collapse**: 8.5% prevalence model tested on 34.9% population collapses without threshold adaptation. |
| **Harmonized Multi-Cohort (Ours)** | **Quarantined Held-Out Pima** | 154 | **0.8194** | 70.37% | 76.00% | **Positive Transfer (+1.7% over Pima-only baseline)** with zero sample leakage. |
| **Harmonized Multi-Cohort (Ours)** | **CDC NHANES Lab Examination** | 5,359 | **0.7483** | 58.78% | 72.36% | Robust generalization across nationally representative multi-ethnic US population. |
| **Pima Indians Baseline** | **Frankfurt Hospital (Alleged)** | 2,000 | *0.9482* | *92.10%* | *86.40%* | **False Generalization Unmasked**: 99.05% duplicate rows of Pima, measuring memorization rather than European generalization. |

### 2.3 Track 3: Gestational Diabetes Maternal Subgroup Generalization
* **Primiparous Patients ($N=162$ in test):** $\text{ROC-AUC} = 0.8810$, Sensitivity $= 89.2\%$.
* **Multiparous Patients ($N=364$ in test):** $\text{ROC-AUC} = 0.8965$, Sensitivity $= 92.8\%$.
* **Maternal Age Gradient:** High stability across young ($<25$, AUC $0.8790$), middle ($25–30$, AUC $0.8940$), and advanced maternal age ($>30$, AUC $0.8910$).

### 2.4 Track 4: Prediabetes Progression Transfer
* Models trained on the UK longitudinal prediabetes cohort ($N=3,059$) successfully discriminated rapid progressors ($\le 1.5$ years) with $\text{ROC-AUC} = 0.7699$ and continuous time-to-progression $\text{MAE} = 0.77$ years ($9.28$ months).
* External evaluation on CDC NHANES ADA criteria confirmed that non-glycemic clinical features (age, BMI, blood pressure) provide moderate discrimination ($\text{ROC-AUC} = 0.5907$, sensitivity $83.82\%$), proving that prediabetes screening requires confirmatory laboratory glucose testing.

---

## 3. Generalization Guidelines for Clinical Translation

1. **Mandatory Calibration-Aware Threshold Adaptation:** When transferring a model from an inpatient setting to a community outpatient clinic, classification thresholds must be recalibrated to local prevalence.
2. **Explicit Target Verification:** Never compare metrics from self-reported survey cohorts (e.g. BRFSS) with laboratory-confirmed cohorts (e.g. NHANES / Pima) as if they were identical clinical tasks.
3. **Quarantine Enforcement:** True external validation requires that neither features, labels, nor hyperparameter decisions leak from external cohorts into training pipelines.
