# MediMind — Master Data Science & Dataset Governance Report

**Document ID:** `MM-MASTER-004`  
**Document Class:** Data Science Lifecycle, Dataset Provenance & Curation Specification  
**Publication Date:** November 4, 2026  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  
**Authors:** Senior Healthcare Data Scientist & Clinical Data Architect  

---

## 1. Executive Summary

In clinical machine learning, algorithmic sophistication is fundamentally subordinate to data quality, representation fidelity, and leakage elimination. An uncalibrated deep neural network trained on leaked records or corrupted physiological variables presents an active clinical safety hazard.

This Master Data Science Report establishes the provenance, curation protocols, feature dictionaries, deduplication audits, and missing-value imputation standards across all multi-modal datasets utilized in MediMind. It formalizes the strict boundary separating research machine learning training cohorts from operational demonstration records.

---

## 2. Multi-Modal Clinical Dataset Inventory

| Dataset Name | Modality | Raw Cohort Dimensions | Cleaned / Retained Cohort | Primary Target Label | Provenance & Licensing |
|---|---|---|---|---|---|
| **Cardiovascular Disease Dataset** | Tabular Hemodynamics | 70,000 records | **64,963 clean records** | Binary CVD status (`cardio` 0/1) | Kaggle / Mendeley Clinical Data (Open Database License) |
| **Pima Indians Diabetes Dataset** | Tabular Endocrinology | 768 records | **768 records** (median imputed) | Binary 5-yr diabetes onset (`Outcome` 0/1) | National Institute of Diabetes and Digestive and Kidney Diseases (UCI ML Repository) |
| **FracAtlas Musculoskeletal** | Radiographic Imaging | 4,083 radiographs | **4,083 radiographs** | Bone fracture presence & bounding box | BRAC University / Bangladesh Clinical Cohort (CC BY 4.0) |
| **Stanford MURA** | Radiographic Imaging | 40,561 radiographs | **40,561 radiographs** | Musculoskeletal abnormality presence | Stanford Machine Learning Group / Upper Extremity Cohort (Research Use Agreement) |
| **GRAZPEDWRI-DX** | Radiographic Imaging | 20,327 radiographs | **20,327 radiographs** | Pediatric wrist fracture & lesion coordinates | Medical University of Graz, Austria (Scientific Data, CC BY 4.0) |
| **Shenzhen PediURF** | Paired Radiography | 2,106 radiographs | **1,053 paired studies** | Pediatric distal radius / ulna fracture | Shenzhen Children's Hospital External Validation Cohort |
| **MediMind Clinical NLP Triage** | Natural Language Text | 42 scenarios + 90 narratives | **132 clinical text cases** | Triage urgency tier (Emergency, Urgent, Moderate, Routine) | Curated Clinical Gold-Standard Benchmark Workbooks |

---

## 3. Data Cleansing, Deduplication & Physiological Bounds Filtering

### 3.1 Cryptographic Deduplication in Cardiovascular Cohort
- **Problem Formulation:** Repeated survey intakes and database joins frequently inject exact duplicate rows into observational clinical datasets. If split randomly, duplicate rows span train and test partitions, causing artificial performance inflation.
- **Deduplication Methodology:** MD5 hash digests were computed across all feature columns (excluding arbitrary patient identifiers).
- **Audit Findings:** Exactly **3,820 exact duplicate rows** were detected in the raw 70,000-row cardiovascular dataset. All duplicate instances were excised, retaining 66,180 unique patient observations.

### 3.2 Physiological Outlier Auditing (IQR & Domain Bounds)
Healthcare observational data contains typographical and sensor acquisition anomalies. A strict domain-specific physiological bounds filter was applied to the 66,180 unique cardiovascular records:
- Diastolic Blood Pressure (`ap_lo`): Retained within $[40, 140]\text{ mmHg}$ (excised 1,004 records with negative, zero, or $>140\text{ mmHg}$ readings).
- Systolic Blood Pressure (`ap_hi`): Retained within $[70, 240]\text{ mmHg}$ (excised 207 records with unphysiological values such as $14,000\text{ mmHg}$).
- Height: Retained within $[120, 220]\text{ cm}$.
- Weight: Retained within $[30, 200]\text{ kg}$.
- **Final Clean Cardiovascular Dimension:** **64,963 validated patient records**.

---

## 4. Missing Data Mechanisms & Biological Zero Imputation

In the UCI Pima Indians Diabetes Dataset ($N = 768$), physiological variables contain zero values that represent missing data rather than true zero measurements:

| Biomarker Feature | Zero Count | Zero Percentage | Physiological Assessment & Biological Reality | Imputation Strategy |
|---|---|---|---|---|
| **Fasting Blood Glucose** | 5 | 0.65% | Incompatible with human life (severe fatal hypoglycemia). | Train-split median ($117.0\text{ mg/dL}$) |
| **Diastolic Blood Pressure** | 35 | 4.56% | Circulatory collapse / cardiac arrest. | Train-split median ($72.0\text{ mmHg}$) |
| **Triceps SkinFold Thickness** | 227 | 29.56% | Anatomical impossibility (absence of subcutaneous adipose tissue). | Train-split median ($29.0\text{ mm}$) |
| **2-Hour Serum Insulin** | 374 | **48.70%** | Structural missingness; test omitted during standard outpatient screening. | Train-split median ($125.0\ \mu\text{U/mL}$) |
| **Body Mass Index (BMI)** | 11 | 1.43% | Physical impossibility for living adult. | Train-split median ($32.3\text{ kg/m}^2$) |

### Strict Leakage Elimination Protocol
To prevent data snooping and target leakage:
1. Imputation medians were calculated **exclusively on the 85% training partition** ($N = 652$).
2. The exact learned training medians were then frozen and applied unconditionally to the 15% held-out test partition ($N = 116$).
3. Zero test set labels or distributions influenced training preprocessing.

---

## 5. Radiographic Data Leakage Prevention: Patient-Level Grouping

A critical error in medical computer vision is random image-level partitioning. Patients undergoing orthopedic evaluation often have 2 to 6 radiographs taken during a single clinical encounter.
- **Image-Level Partitioning Hazard**: If images from Patient $X$ appear in both training and test sets, the neural network learns patient-specific anatomical morphology (bone density, trabecular geometry, hardware artifacts) rather than pathology, resulting in artificially high test scores that collapse in external clinical deployment.
- **MediMind Patient-Level Partitioning Invariant**: In all vision datasets (FracAtlas, MURA, GRAZPEDWRI-DX, and PediURF), splitting was executed strictly at the **patient identifier / study encounter level**. All radiographs corresponding to a given individual were constrained entirely within either the training, validation, or test split.

---

## 6. Demographic Constraints & Explicit Limitations

Rigorous clinical data science mandates transparent acknowledgment of cohort boundaries:
1. **Pima Diabetes Demographic Scope**: The Pima dataset consists exclusively of female patients aged 21 and older of Pima Indian heritage. Generalization to male populations or disparate ancestral lineages must be clinically validated prior to autonomous deployment.
2. **Cardiovascular Outpatient Cohort**: The tabular cardiovascular dataset captures cross-sectional outpatient vitals and lacks continuous telemetry, troponin biomarkers, or ECG waveforms.
3. **Adult vs Pediatric Imaging Populations**: FracAtlas represents adult skeletal radiography from South Asia (Bangladesh); GRAZPEDWRI-DX represents pediatric trauma from Central Europe (Austria); Shenzhen PediURF captures pediatric wrist trauma from East Asia (China). Cross-cohort differences in bone mineralization, epiphyseal growth plate closure, and imaging equipment were explicitly modeled via localized ROI fusion (Experiment 8A).

---

## 7. Consolidated Source Reports

This master report synthesizes:
- `Documents/Production_Readiness_Audit/MediMind_Data_Reconciliation_Report.md`
- `Documents/Production_Readiness_Audit/MediMind_Excel_Reconciliation_Report.md`
- `Documents/MediMind_Excel_Workbook_Reconciliation_and_Cleanup_Audit.md`
- `ai-prediction-service/app/models/diabetes/DIABETES_DATASET.md`
- `ai-prediction-service/app/models/heart_disease/HEART_DISEASE_DATASET.md`
- `ai-prediction-service/app/models/fracture/FRACTURE_DATASET.md`
