# Multi-Phenotype Diabetes Dataset Discovery & Provenance Audit

**Module:** MediMind Multi-Phenotype Diabetes AI Research  
**Repository:** `D:\projects\MediMind`  
**Branch:** `research/multiphenotype-diabetes-framework`  
**Date:** November 2026  
**Auditor:** Senior Clinical AI Research Engineer & Data Scientist  

---

## 1. Multi-Phenotype Discovery Summary

Across our systematic discovery process spanning UCI Machine Learning Repository, CDC NCHS, GitHub, CRAN, Zenodo, and medical literature supplements, we discovered, verified, and acquired 12 independent datasets across all major diabetes phenotypes:

| Phenotype Research Track | Dataset Identifier | Institutional / Geographic Source | Format / Size | Target Definition | Suitability Classification |
|---|---|---|---|---|---|
| **Track 1: Type-1 vs Type-2** | `uci_130_us_hospitals` | University of Louisville / 130 US Hospitals (1999–2008) | CSV / 101,766 rows, 50 cols | ICD-9 5th digit: T1D (`250.x1/3`, N=6,205) vs T2D (`250.x0/2`, N=6,419) | **PRIMARY BENCHMARK** (High-Volume Clinical Subtype Classification) |
| **Track 1: Type-1 vs Type-2** | `shanghai_t1d_summary` & `t2d_summary` | Shanghai Jiao Tong Univ. / Nature Sci Data (2023) | Excel / 125 patients, 33 clinical cols + CGM | C-Peptide, Insulin, HbA1c, Glycated Albumin, CGM glycemic variability | **BIOMARKER BENCHMARK** (Endogenous Beta-Cell Function Analysis) |
| **Track 2: Type-2 Diabetes** | `pima_indians_diabetes` | NIDDK / Phoenix, Arizona Native American cohort | CSV / 768 rows, 9 cols | WHO 1980 2-h OGTT $\ge 200\text{ mg/dL}$ | **CORE BENCHMARK** (Physiological Lab Baseline) |
| **Track 2: Type-2 Diabetes** | `healthcare_100k_diabetes` | Kaggle / Clinical EHR Repository (Huq et al.) | CSV / 100,000 rows, 9 cols | EHR-documented diabetes diagnosis | **EXTERNAL VALIDATION** (High-Volume Clinical EHR) |
| **Track 2: Type-2 Diabetes** | `cdc_nhanes_examination_lab` | CDC National Center for Health Statistics (Continuous) | CSV / 5,359 rows with lab glucose (`LBXGLT`) | Doctor diagnosis + Lab Fasting Glucose $\ge 126$ / HbA1c $\ge 6.5\%$ | **EPIDEMIOLOGICAL TRANSFER** (Nationally Representative Multi-Ethnic) |
| **Track 2: Type-2 Diabetes** | `uci_early_stage_sylhet` | Sylhet Diabetes Hospital, Bangladesh (Islam et al.) | CSV / 520 rows, 17 cols | Symptom questionnaire diagnosis | **DOMAIN SHIFT** (Symptom-Driven Clinical Presentation) |
| **Track 2: Type-2 Diabetes** | `cdc_brfss_2015` | CDC Behavioral Risk Factor Surveillance System | CSV / 253,680 rows, 22 cols | Self-reported telephone survey response | **MACRO-EPIDEMIOLOGICAL** (Population Health Screening) |
| **Track 2: Type-2 Diabetes** | `frankfurt_hospital_audit` | Alleged Frankfurt Hospital, Germany | CSV / 2,000 rows, 9 cols | Outcome duplicate | **ADVERSARIAL AUDIT** (99.05% Pima duplicate unmasked) |
| **Track 3: Gestational Diabetes** | `gestational_diabetes_gdm` | South Asian Clinical Obstetric Research Repository | CSV / 3,525 rows, 17 cols | IADPSG GDM diagnosis (`Class Label`: 1,372 GDM vs 2,153 Non-GDM) | **PRIMARY GDM BENCHMARK** (Early Screening vs Diagnostic Testing) |
| **Track 4: Prediabetes Progression** | `prediabetes_longitudinal` | CRAN `MLDataR` / UK NHS Longitudinal Records | CSV / 3,059 rows, 10 cols | Continuous follow-up time (`Time_Pre_To_Diabetes` in years) | **LONGITUDINAL PROGRESSION** (Time-to-Event Survival Analysis) |
| **Track 4: Prediabetes Detection** | `cdc_brfss_012_prediabetes` | CDC BRFSS 2015 3-Class Indicator | CSV / 253,680 rows | Multi-class label: 0=Normo, 1=Prediabetes (N=4,631), 2=Diabetes | **POPULATION PREDIABETES** (Cross-Sectional Risk Screening) |
| **Track 5: Monogenic MODY** | `mody_clinical_genetic` | Clinical Genetics Repository / ifiguero (2024) | Excel / 511 rows, 12 sheets | Molecular genetic test: MODY2/GCK (N=222), MODY3/HNF1A (N=122), Controls (N=57) | **GENETIC PHENOTYPE DISCRIMINATION** (GCK vs HNF1A Clinical Differentiation) |
| **Track 6: Secondary Diabetes** | Clinical Literature Cohorts | PubMed / International Classification of Diseases | Narrative / ICD-9 249.xx | Pancreatogenic (Type 3c) / Drug-induced secondary diabetes | **FEASIBILITY ASSESSMENT** (Literature and Coding Audit) |

---

## 2. Dataset Checksums & Technical Provenance

All files are stored in `ai-prediction-service/test-dataset/Diabetes/` and verified with cryptographic SHA-256 digests:

```json
{
  "uci_130_us_hospitals.csv": "0689e7ec03125e98215682669e46a788cb9ca40994f285ca4e5088eb7c223c6b",
  "gestational_diabetes_gdm.csv": "f9f679e7f74bfd8c1c5a98bf684b64b18c5e6308ba67d983949df29dd831bb65",
  "prediabetes_longitudinal.csv": "19f179358244e83f2a893c5c9ba68685e171ff77f805a9609bc2c42c7526bf01",
  "mody_clinical_genetic.xlsx": "9341446e73e04746f2c39e25d29dffeb0b2f5d214be39433d9aaae4ba82c3f87",
  "shanghai_t1d_summary.xlsx": "4868948c45d9472bf6c3fb2b638aebe63ab7a1649ae8c148332152f20cb0ea7a",
  "shanghai_t2d_summary.xlsx": "b9feb1bb3ea11910a9c693ae26019a842b0c3f5ea7c26fbcc4141680d28741ce",
  "diabetes.csv": "123ce738f39446eb3032ae25ee6ec87f53a4ea1f4d9943ee8ad9d9eb3544dd58",
  "healthcare_100k_diabetes.csv": "f233fc470e9086fa1aa65fbe7aa0d6c9fa14c71e2ef64db136b85d3810167a68",
  "nhanes_diabetes.csv": "541376d1411b0e35dc8f55307b220bbbf4c2514bc5c47fa0a6042db621cfad25",
  "nhanes_lab_med.csv": "72e16040d7065963286f77c385ad2f71661d9601614f24c253bce7bece415d66",
  "uci_early_stage_diabetes.csv": "7889d9d0beb7c31d87f7e914df5a9dbce72a6b297a7e80063229b139369d7bdf",
  "cdc_brfss_diabetes.csv": "19f367e3e335275815cf1a9544955c4708e390cbe005b79fa69bf0564619a9d7",
  "frankfurt_hospital_audit.csv": "989bbe512732c49c0df1b87641d441e8c0e6fb1c498967905d4b83f433cb8e07"
}
```
