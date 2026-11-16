# Multi-Cohort Dataset Compatibility Matrix & Harmonization Framework

**Module:** MediMind Type-2 Diabetes Prediction System  
**Audit Date:** November 2026  
**Auditor:** Machine Learning Research Engineer & Clinical AI Researcher  

---

## 1. Rationale: Why Blind Combination Fails Clinically

In naive machine learning workflows, disparate datasets are frequently combined by concatenating tables or renaming columns arbitrarily. In clinical AI, **blind combination causes catastrophic distribution distortion and false clinical claims** for the following fundamental reasons:

1. **Target Discrepancy (Physiological vs Self-Reported vs ICD-10):**  
   - Pima uses an oral glucose tolerance test (OGTT $\ge 200\text{ mg/dL}$), measuring physiological acute glucose clearance.
   - CDC BRFSS relies on a single telephone self-report ("Has a doctor ever told you that you have diabetes?").
   - Healthcare 100k combines laboratory HbA1c ($\ge 6.5\%$) and electronic billing codes.
   - Merging self-reported subjective indicators with acute laboratory tests without explicit domain adaptation yields an uninterpretable target.

2. **Feature Semantic Non-Equivalence:**  
   - `SkinThickness` in Pima is triceps skinfold in millimeters measured with calipers; this does not exist in typical EHRs or telephone surveys.
   - `DiabetesPedigreeFunction` is a mathematical genetic risk score specific to the Pima family tree and cannot be synthesized for unrelated cohorts without genetic lineage.

3. **Demographic and Sampling Differences:**  
   - Pima Indian women represent a unique Native American population with high genetic predisposition.
   - Sylhet Bangladesh represents South Asian early-onset symptom presentation.
   - CDC NHANES represents a multi-ethnic epidemiological sample of the United States.

---

## 2. Dataset Classification & Partitioning

To maintain scientific defensibility, we separate candidate datasets into four rigorous tiers:

| Cohort Name | Sample Size ($N$) | Data Modality | Research Role | Compatibility Decision |
|---|---|---|---|---|
| **Pima Indians (NIDDK)** | 768 | Physiological Testing (OGTT, Insulin) | Primary Physiological Benchmark & Legacy Baseline | **Core Compatible** (Physiological Tier) |
| **Healthcare 100k** | 100,000 | Clinical Laboratory & EHR | High-Volume EHR Training & External Generalization | **Core Compatible** (EHR Tier via Harmonization) |
| **CDC NHANES** | 9,813 | Epidemiological Examination | Cross-Population Generalization & Fairness Evaluation | **External Validation Tier** |
| **UCI Early Stage (Sylhet)** | 520 | Clinical Symptom Questionnaire | Domain-Shift Evaluation (Symptom-based Risk) | **Domain-Shift Evaluation** (Symptom Tier) |
| **CDC BRFSS 2015** | 253,680 | Public Health Survey | Macro-Epidemiological Screening Benchmark | **Domain-Shift Evaluation** (Survey Tier) |
| **Frankfurt Hospital** | 2,000 | Resampled Pima Duplicates | Adversarial Audit / Negative Control | **REJECTED (Contaminated Data)** |

---

## 3. Harmonized Core Clinical Feature Space

To evaluate cross-cohort generalization and joint multi-cohort learning without feature leakage or false equivalences, we define the **Harmonized Core Clinical Feature Space** ($d = 6$):

$$\mathcal{X}_{\text{core}} = \{\text{Age, BMI, Glucose, BloodPressure, Hypertension, IsFemale}\}$$

### Feature Mapping and Unit Standardization:

1. **Age (years):**  
   - Continuous numeric, range $[18, 100]$. Standardized across all cohorts.
2. **BMI ($\text{kg/m}^2$):**  
   - Standardized definition: $\text{weight (kg)} / \text{height (m)}^2$. Clipped to physiological boundaries $[10.0, 70.0]$.
3. **Glucose ($\text{mg/dL}$):**  
   - Pima: 2-hour plasma glucose during OGTT.
   - Healthcare 100k: Blood glucose level ($\text{mg/dL}$).
   - Units standardized to $\text{mg/dL}$ (conversion factor $1\text{ mmol/L} = 18.018\text{ mg/dL}$ applied where necessary).
4. **Blood Pressure ($\text{mm Hg}$):**  
   - Continuous diastolic blood pressure. Clipped to $[40.0, 220.0]$.
5. **Hypertension Status (Binary):**  
   - Clinical consensus definition: Diastolic $\text{BP} \ge 80\text{ mm Hg}$ or Systolic $\text{BP} \ge 130\text{ mm Hg}$ or documented physician diagnosis.
6. **Sex / IsFemale (Binary):**  
   - $1.0 = \text{Female}$, $0.0 = \text{Male}$. Pima is locked to $1.0$; multi-cohort data evaluates both sexes.

---

## 4. The Frankfurt Hospital Adversarial Audit

Our deduplication audit compared the 2,000 records of the Frankfurt Hospital dataset against the 768 records of Pima:

* Total records in Frankfurt dataset: **2,000**
* Unique records in Frankfurt dataset: **744**
* Exact row matches with Pima Indians dataset: **1,981 records (99.05%)**
* Disjoint unique German records: **0**

### Scientific Conclusion:
The dataset circulated in open-source repositories as "Hospital Frankfurt, Germany" is an oversampled artifact created by applying sampling with replacement directly to the Pima Indians dataset. Evaluating a model trained on Pima against this dataset is equivalent to evaluating on the training set, yielding false generalization claims ($0.9482\text{ ROC-AUC}$). We formally document this contamination to prevent methodological error in MediMind.
