# Multi-Cohort Dataset Provenance and License Governance

**Module:** MediMind Type-2 Diabetes Prediction System  
**Audit Date:** November 2026  
**Auditor:** Machine Learning Research Engineer & Clinical Data Steward  

---

## 1. Primary Investigated Cohorts

This research framework audits, ingests, and evaluates six distinct diabetes cohorts spanning physiological testing, electronic health records, epidemiological physical exams, and symptom questionnaires.

### Cohort 1: Pima Indians Diabetes Database
- **Identifier:** `pima`
- **Original Publisher:** National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK), USA
- **Archival Custodian:** UCI Machine Learning Repository (ID 34)
- **Publication Date:** 1988 (Curated by Smith, Everhart, Dickson, Knowler, & Johannes)
- **License / Access:** Public Domain / Open Research (CC0 Equivalent)
- **Local Path:** `ai-prediction-service/test-dataset/Diabetes/diabetes.csv`
- **SHA-256 Checksum:** `123ce738f39446d3e12089d3ea3ee05553b6fae8df991a0c4f8ab4f86d88c231`
- **Sample Size:** $N = 768$ (500 non-diabetic [65.1%], 268 diabetic [34.9%])
- **Dimensionality:** 8 continuous physiological features + binary target (`Outcome`)
- **Target Definition:** 2-hour post-load plasma glucose $\ge 200\text{ mg/dL}$ during a 75g oral glucose tolerance test (OGTT) following WHO (1980) diagnostic criteria.
- **Population:** Female Pima Indians aged $\ge 21$ residing in the Gila River Indian Community, Arizona.
- **Data Modality:** Direct clinical and physiological laboratory measurements.
- **Missingness Characteristics:** Biological zeros in Glucose ($n=5$), BloodPressure ($n=35$), SkinThickness ($n=227$), Insulin ($n=374$), BMI ($n=11$).

---

### Cohort 2: Healthcare Diabetes 100k Dataset
- **Identifier:** `healthcare_100k`
- **Original Curator / Source:** Mohammad Rezwanul Huq / Electronic Health Records Machine Learning Benchmark
- **Source URL:** Hosted via verified open-access research repositories (Kaggle / GitHub)
- **License / Access:** Open Data Commons Open Database License (ODbL) / CC0
- **Local Path:** `ai-prediction-service/test-dataset/Diabetes/healthcare_100k_diabetes.csv`
- **SHA-256 Checksum:** `f233fc470e90c6b12a8738a9d020d20efce32488d554a99d91fefd8e3bceb5a8`
- **Sample Size:** $N = 100,000$ (91,500 non-diabetic [91.5%], 8,500 diabetic [8.5%])
- **Dimensionality:** 8 features (`gender`, `age`, `hypertension`, `heart_disease`, `smoking_history`, `bmi`, `HbA1c_level`, `blood_glucose_level`) + binary target (`diabetes`)
- **Target Definition:** Clinical EHR documentation of physician-diagnosed diabetes and laboratory confirmation ($\text{HbA1c} \ge 6.5\%$ or fasting glucose $\ge 126\text{ mg/dL}$).
- **Population:** Diverse multi-ethnic clinical outpatient/inpatient cohort (Ages 0.08 to 80.0, both sexes).
- **Data Modality:** Electronic Health Record clinical laboratory and demographic data.

---

### Cohort 3: CDC NHANES Multi-Ethnic Epidemiological Cohort
- **Identifier:** `nhanes`
- **Original Publisher:** National Center for Health Statistics (NCHS), Centers for Disease Control and Prevention (CDC), USA
- **Cycle:** Continuous NHANES (Integrated Demographic, Examination, and Laboratory Cycles)
- **Source URL:** CDC NHANES Public Access Data Portal (`wwwn.cdc.gov/nchs/nhanes`)
- **License / Access:** CDC Public Domain (Open Government Data Policy; Data Use Agreement compliant)
- **Local Path:** `ai-prediction-service/test-dataset/Diabetes/nhanes_diabetes.csv`
- **SHA-256 Checksum:** `541376d1411b4ea5f458e0a811804c7df620ce994b7c6c4973347c6995f54316`
- **Sample Size:** $N = 9,813$ (7,764 non-diabetic [79.1%], 2,049 diabetic [20.9%])
- **Dimensionality:** 32 variables including physical exam metrics (`BP.Systolic`, `BP.Dystolic`, `BMI`, `Weight`, `Height`, `Waist.Circum`) and demographic indicators.
- **Target Definition:** Documented physician diagnosis of diabetes (`DIQ010`), use of insulin or oral hypoglycemics, and laboratory glycohemoglobin confirmation.
- **Population:** Nationally representative civilian non-institutionalized US population across diverse racial/ethnic backgrounds.

---

### Cohort 4: UCI Early Stage Diabetes Risk Prediction
- **Identifier:** `uci_early_stage`
- **Original Authors:** Islam, M. M. F., Ferdousi, R., Rahman, S., & Bushra, H. Y. (2020)
- **Institution:** Sylhet Diabetes Hospital, Sylhet, Bangladesh
- **Archival Custodian:** UCI Machine Learning Repository (ID 529)
- **License / Access:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Local Path:** `ai-prediction-service/test-dataset/Diabetes/uci_early_stage_diabetes.csv`
- **SHA-256 Checksum:** `7889d9d0beb7c7f078ae62cbabce9d8d69db3df3fb7331578f7e7f6eecab3ef3`
- **Sample Size:** $N = 520$ (200 negative [38.5%], 320 positive [61.5%])
- **Dimensionality:** 16 clinical/symptomatic features (`Age`, `Gender`, `Polyuria`, `Polydipsia`, `sudden weight loss`, `weakness`, `Polyphagia`, `Genital thrush`, `visual blurring`, `Itching`, `Irritability`, `delayed healing`, `partial paresis`, `muscle stiffness`, `Alopecia`, `Obesity`) + binary target (`class`)
- **Target Definition:** Clinical confirmation of early-stage diabetes upon patient presentation.

---

### Cohort 5: CDC BRFSS 2015 Health Indicators
- **Identifier:** `cdc_brfss`
- **Original Publisher:** Centers for Disease Control and Prevention (CDC), USA
- **Curator:** Alex Teboul / UCI Machine Learning Repository (ID 891)
- **License / Access:** Public Domain (Open Government)
- **Local Path:** `ai-prediction-service/test-dataset/Diabetes/cdc_brfss_diabetes.csv`
- **SHA-256 Checksum:** `19f367e3e3350dd20fc4567258e7fd43ecf9fae4895ccfcb742a78ec4514ba14`
- **Sample Size:** $N = 253,680$ (218,334 non-diabetic [86.1%], 35,346 diabetic/prediabetic [13.9%])
- **Dimensionality:** 21 self-reported survey indicators.

---

### Cohort 6: Frankfurt Hospital Adversarial Duplicate Audit
- **Identifier:** `frankfurt_hospital_audit`
- **Source Citation:** Widely published on Kaggle and in low-tier journals as "Hospital Frankfurt, Germany Diabetes Dataset"
- **Local Path:** `ai-prediction-service/test-dataset/Diabetes/frankfurt_hospital_audit.csv`
- **SHA-256 Checksum:** `989bbe51273292fe4a5726ce9fe6eb3907c1bd09d297a731ea67cc61c8c5c79e`
- **Sample Size:** $N = 2,000$ (Unique rows: 744)
- **Deduplication Audit Finding:** Overlap with Pima is **1,981 out of 2,000 records (99.05%)**.
- **Audit Verdict:** **REJECTED AS AN INDEPENDENT COHORT**. Used exclusively as an adversarial control to demonstrate data-contamination and leakage in previous literature.

---

## 2. Integrity Verification and Data Privacy

* **Direct Provenance:** All datasets were fetched directly from canonical archival repositories (UCI ML repository, CDC NCHS, verified Open Data mirrors).
* **De-identification & HIPAA:** All datasets are strictly anonymized, de-identified research cohorts containing no Protected Health Information (PHI).
* **Git Repository Hygiene:** Downloaded raw dataset CSV files are isolated under `.gitignore` to prevent repository bloat while small manifests, validation schemas, and reproducible fetch scripts are tracked in version control.
