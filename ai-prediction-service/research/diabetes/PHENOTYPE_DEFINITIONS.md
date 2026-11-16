# Clinical Phenotype Definitions, Diagnostic Criteria & Target Protocols

**Module:** MediMind Multi-Phenotype Diabetes AI Research  
**Repository:** `D:\projects\MediMind`  
**Branch:** `research/multiphenotype-diabetes-framework`  
**Date:** November 2026  
**Auditor:** Senior Clinical AI Research Engineer & Endocrinological Data Scientist  

---

## 1. Clinical Target Taxonomy & Phenotypic Separation

A foundational principle of this research framework is that **different forms of diabetes are distinct clinical, pathophysiological, and epidemiological entities**. They must never be merged into a single generic binary classification target. 

This framework defines six distinct phenotype research tracks:

```
                                  ┌──────────────────────────────────────────────┐
                                  │   MediMind Multi-Phenotype AI Architecture   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
         ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┬───────────────────┐
         │                   │                   │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ Track 1  │        │ Track 2  │        │ Track 3  │        │ Track 4  │        │ Track 5  │        │ Track 6  │
    │  Type-1  │        │  Type-2  │        │ Gestat.  │        │ Prediab. │        │   MODY   │        │ Secondary│
    │ Diabetes │        │ Diabetes │        │ Diabetes │        │Progress. │        │Monogenic │        │ Diabetes │
    └──────────┘        └──────────┘        └──────────┘        └──────────┘        └──────────┘        └──────────┘
```

---

## 2. Phenotype Track 1: Type-1 Diabetes (T1D) vs Type-2 (T2D) Clinical Differentiation

### 2.1 Clinical Definition
Type-1 Diabetes Mellitus (T1DM) is an autoimmune-mediated destruction of pancreatic $\beta$-cells leading to absolute insulin deficiency. Type-2 Diabetes Mellitus (T2DM) is characterized by progressive insulin resistance combined with relative $\beta$-cell secretory defect. In clinical hospital encounters, distinguishing T1D from T2D is critical to prevent fatal diabetic ketoacidosis (DKA) from inappropriate oral hypoglycemic prescription.

### 2.2 Diagnostic Criteria & Coding Standards
* **ICD-9-CM Clinical Coding:**
  * `250.x1` or `250.x3`: Type 1 Diabetes Mellitus (juvenile type, not stated as uncontrolled or uncontrolled).
  * `250.x0` or `250.x2`: Type 2 Diabetes Mellitus (adult-onset type, not stated as uncontrolled or uncontrolled).
* **ADA / WHO Laboratory Biomarkers:**
  * Absolute endogenous insulin failure: Fasting C-peptide $< 0.2\text{ nmol/L}$ ($< 0.6\text{ ng/mL}$) or postprandial/stimulated C-peptide $< 0.6\text{ nmol/L}$.
  * Autoantibodies: GAD65, IA-2, ZnT8, ICA positivity.
  * Rapid onset of ketosis or ketoacidosis.

### 2.3 Prediction Task & Target Definition
* **Target Label:** $Y_{\text{T1D}} \in \{0, 1\}$ where $1 = \text{Type-1 Diabetes}$, $0 = \text{Type-2 Diabetes}$.
* **Inclusion Criteria:** Patients admitted to acute hospital care with confirmed physician-coded ICD-9 5th-digit diabetes subtype diagnosis.
* **Exclusion Criteria:** Unspecified diabetes (`250.x` without 5th digit subtype), secondary diabetes (`249.xx`), or gestational diabetes (`648.xx`).
* **Evaluation Integrity:** Patient-level split quarantine using unique identifier `patient_nbr`. Encounters from the same individual are strictly restricted to either training or test partitions.

---

## 3. Phenotype Track 2: Type-2 Diabetes Risk & Cross-Population Generalization

### 3.1 Clinical Definition
Type-2 Diabetes Mellitus is a heterogeneous metabolic disorder driven by peripheral insulin resistance and progressive pancreatic beta-cell dysfunction.

### 3.2 Diagnostic Criteria
* Fasting Plasma Glucose (FPG) $\ge 126\text{ mg/dL}$ ($7.0\text{ mmol/L}$) after an 8-hour fast.
* 2-hour post-load plasma glucose $\ge 200\text{ mg/dL}$ ($11.1\text{ mmol/L}$) during a standardized $75\text{g}$ Oral Glucose Tolerance Test (OGTT).
* Glycated Hemoglobin ($\text{HbA1c}$) $\ge 6.5\%$ ($48\text{ mmol/mol}$) using an NGSP-certified assay.

### 3.3 Target Label & Research Protocol
* **Target Label:** $Y_{\text{T2D}} \in \{0, 1\}$ (0 = Normoglycemic / Non-diabetic, 1 = Type-2 Diabetic).
* **Multi-Cohort Protocol:** Evaluated across 6 audited cohorts (Pima Indians, Healthcare 100k EHR, CDC NHANES with laboratory confirmation, UCI Early Stage, CDC BRFSS, Frankfurt duplicate audit).
* **Integrity Constraints:** Zero external-validation leakage. Preprocessing parameters and calibration curves fit strictly on training/validation partitions.

---

## 4. Phenotype Track 3: Gestational Diabetes Mellitus (GDM) Risk & Early Screening

### 4.1 Clinical Definition
Gestational Diabetes Mellitus is carbohydrate intolerance of variable severity with onset or first recognition during pregnancy, typically diagnosed at $24–28$ weeks of gestation.

### 4.2 Diagnostic Criteria (IADPSG / WHO 2013 Criteria)
Following a $75\text{g}$ 2-hour OGTT performed at $24–28$ weeks:
* Fasting plasma glucose: $\ge 92\text{ mg/dL}$ ($5.1\text{ mmol/L}$)
* 1-hour plasma glucose: $\ge 180\text{ mg/dL}$ ($10.0\text{ mmol/L}$)
* 2-hour plasma glucose: $\ge 153\text{ mg/dL}$ ($8.5\text{ mmol/L}$)
One or more abnormal values establishes GDM diagnosis.

### 4.3 Temporal Leakage Prevention (Mandatory Research Requirement)
* **Pre-Diagnostic Early Screening Horizon:**
  * To be clinically actionable as an early-pregnancy screening tool (first trimester / early second trimester before 24 weeks), the model **must strictly exclude the 24–28 week diagnostic OGTT glucose measurements** from the predictor space!
  * Allowed early predictors: Maternal age, pre-pregnancy BMI, parity/gravidity, prior history of GDM or macrosomia, unexplained prenatal loss, family history of diabetes, polycystic ovary syndrome (PCOS), baseline systolic/diastolic blood pressure, baseline hemoglobin, sedentary lifestyle.
* **Temporal Leakage Quantification:** We explicitly ablate early screening features vs. inclusion of post-hoc diagnostic OGTT values to document the magnitude of synthetic metric inflation.

---

## 5. Phenotype Track 4: Prediabetes Risk Stratification & Longitudinal Progression

### 5.1 Clinical Definition
Prediabetes (Impaired Fasting Glucose / Impaired Glucose Tolerance) is an intermediate state of hyperglycemia with glycemic parameters above normal but below diabetic thresholds.

### 5.2 ADA Diagnostic Thresholds
* Impaired Fasting Glucose (IFG): FPG $100–125\text{ mg/dL}$ ($5.6–6.9\text{ mmol/L}$).
* Impaired Glucose Tolerance (IGT): 2-hour OGTT glucose $140–199\text{ mg/dL}$ ($7.8–11.0\text{ mmol/L}$).
* Glycated Hemoglobin: $\text{HbA1c } 5.7–6.4\%$ ($39–47\text{ mmol/mol}$).

### 5.3 Research Sub-Tracks:
1. **Track 4A: Longitudinal Progression to T2D (Time-to-Event Modeling):**
   * Target: Time elapsed (in years) from prediabetes diagnosis to progression to Type-2 Diabetes.
   * Dataset: `MLDataR PreDiabetes` ($N=3,059$ patients with exact continuous progression time `Time_Pre_To_Diabetes` in years, HbA1c, BMI, age at diagnosis, and socioeconomic IMD decile).
   * Predictive Task: Identification of rapid progressors ($\le 1.5\text{ years}$) vs. slow progressors ($> 3.0\text{ years}$), and survival/hazard modeling.
2. **Track 4B: Cross-Sectional Prediabetes Detection:**
   * Target: Discriminating Prediabetic individuals from Normoglycemic controls using non-glycemic clinical and demographic risk factors in CDC NHANES ($N=5,359$, ADA lab confirmed) and CDC BRFSS (`Diabetes_012`, $N=253,680$).

---

## 6. Phenotype Track 5: Monogenic Diabetes / Maturity-Onset Diabetes of the Young (MODY)

### 6.1 Clinical Definition
Maturity-Onset Diabetes of the Young (MODY) comprises a group of monogenic forms of diabetes inherited in an autosomal dominant pattern, characterized by non-ketotic diabetes, early onset (typically $< 25$ years), preservation of endogenous insulin secretion, and absence of pancreatic autoantibodies.

### 6.2 Major Genetic Subtypes
* **GCK-MODY (MODY2):** Heterozygous glucokinase mutations; stable, asymptomatic mild fasting hyperglycemia ($99–144\text{ mg/dL}$), rarely requires pharmacotherapy.
* **HNF1A-MODY (MODY3):** Heterozygous hepatocyte nuclear factor-1A mutations; progressive $\beta$-cell failure, marked postprandial hyperglycemia, marked hypersensitivity to sulfonylureas.
* **HNF4A-MODY (MODY1):** Heterozygous HNF4A mutations; similar to MODY3, macrosomia at birth.
* **HNF1B-MODY (MODY5):** Renal cysts and diabetes syndrome (RCAD).

### 6.3 Phenotype Modeling Protocol & Scope
* Target: Differentiating confirmed GCK-MODY (MODY2) vs HNF1A-MODY (MODY3) vs Common non-monogenic diabetes using age at diagnosis, BMI, family history, fasting glucose, and 2-hour glucose from confirmed genetic testing records (`mody_clinical_genetic.xlsx`, $N=511$).
* Rigorous Scoping: Sample sizes for MODY1 and MODY5 ($N=4$) are audited as statistically insufficient for independent machine learning modeling; documented under feasibility boundaries.

---

## 7. Phenotype Track 6: Secondary & Other Specific Diabetes Subtypes

### 7.1 Clinical Scope & Boundaries
Secondary diabetes encompasses hyperglycemia resulting from:
* Diseases of the exocrine pancreas (Type 3c pancreatogenic diabetes: pancreatitis, pancreatectomy, cystic fibrosis, hemochromatosis).
* Endocrinopathies (Cushing's syndrome, acromegaly, pheochromocytoma, glucagonoma).
* Drug- or chemical-induced diabetes (glucocorticoids, calcineurin inhibitors, mTOR inhibitors, immune checkpoint inhibitors, atypical antipsychotics).

### 7.2 Research Assessment
Due to extreme rarity and inconsistent diagnostic coding across public EHR records, secondary diabetes is formally audited via a clinical literature and coding feasibility review rather than claiming an unvalidated classifier.
