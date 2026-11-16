# Multi-Phenotype Diabetes AI Research: Novelty Matrix & Contribution Audit

**Module:** MediMind Multi-Phenotype Diabetes AI Research  
**Repository:** `D:\projects\MediMind`  
**Branch:** `research/multiphenotype-diabetes-framework`  
**Date:** November 2026  
**Auditor:** Senior Clinical AI Research Engineer & Endocrinological Data Scientist  

---

## 1. Explicit Non-Claims (Scientific Integrity Safeguards)

To maintain absolute scientific integrity, **we explicitly do NOT claim**:
1. We do **not** claim a single "one-size-fits-all" model for all forms of diabetes.
2. We do **not** claim diagnostic replacement of laboratory venous blood sampling (fasting plasma glucose, OGTT, or HbA1c).
3. We do **not** claim that ordinary glucose and demographic datasets can predict autoimmune or monogenic etiology without appropriate biomarkers or genetic labels.
4. We do **not** claim an automated machine learning classifier for ultra-rare monogenic variants (MODY1, MODY5) where sample sizes ($N=4$) are statistically insufficient.
5. We do **not** claim a secondary diabetes classifier on routine EHR records where clinical misclassification rates exceed $75\%$.
6. We do **not** claim regulatory clearance (FDA SaMD or CE-MDR).

---

## 2. Research Novelty Matrix: Existing Literature vs. MediMind Contribution

| Research Dimension | Existing Literature State | Common Literature Failure Modes | MediMind Multi-Phenotype Contribution |
|---|---|---|---|
| **Phenotype Specialization** | Binary classification treating all diabetes types as interchangeable (Pima Indian benchmark dominance). | Conflating Type-1, Type-2, GDM, and prediabetes into one binary target; diagnostic label ambiguity. | **Architectural separation into six independent specialized tracks**, each with clinical diagnostic criteria, target labels, and distinct feature schemas. |
| **Type 1 vs Type 2 Differentiation** | Small single-center studies ($N < 200$) or unverified synthetic datasets. | Lack of patient-level split quarantine; evaluating on repeated encounters from the same patient. | **High-volume clinical benchmark on $N=12,624$ hospital encounters** with strict patient-level quarantine (`patient_nbr`), pediatric/adult stratification, and physiological beta-cell validation via Shanghai C-peptide data. |
| **Gestational Diabetes Screening** | Conflating $24–28$ week diagnostic OGTT glucose with early first-trimester risk prediction. | **Severe temporal leakage**: using the diagnostic test itself to predict future risk, producing artificially inflated metrics. | **Rigorous temporal leakage ablation**: Model 3A establishes the leak-free pre-diagnostic screening benchmark (excluding OGTT), empirically quantifying the metric inflation caused by temporal leakage. |
| **Prediabetes & Progression** | Cross-sectional classification only; treating prediabetes as static rather than dynamic. | Inability to predict future trajectory or time-to-conversion without longitudinal data. | **Dual-track evaluation**: Track 4A models continuous longitudinal progression time ($N=3,059$, $R^2=0.2915$, $\text{MAE}=0.77$ years) and rapid progression ($\le 1.5$ years, ROC-AUC $0.7699$); Track 4B evaluates non-glycemic cross-sectional screening. |
| **Monogenic MODY Genetics** | Papers either ignore monogenic forms or claim genomic prediction from demographic survey datasets. | Fabricating genetic predictors without molecular testing; claiming multi-class models on $N < 5$ samples. | **Empirical 5-fold CV discrimination between GCK-MODY ($N=222$) and HNF1A-MODY ($N=122$)** (CV ROC-AUC $0.7430$), paired with a formal feasibility audit that refuses to overclaim for rare MODY1/MODY5 variants. |
| **External Generalization** | Evaluation restricted to single-cohort internal cross-validation; unverified "Frankfurt Hospital" claims. | Unmasking literature contamination ($99.05\%$ duplicate rows); threshold collapse under base-rate shifts. | **Multi-cohort generalization across 12 datasets**, leak-free held-out Pima evaluation ($0.8194$ vs $0.8026$), and external laboratory validation on $5,359$ CDC NHANES participants ($0.7483$ ROC-AUC). |
| **Probability Calibration** | Raw uncalibrated probabilities reported; calibration slope and intercept omitted. | Tree-ensemble overconfidence in intermediate probability ranges ($0.30 - 0.70$), distorting clinical risk stratification. | **Post-hoc Platt scaling and isotonic regression** across all probability models, achieving $\text{ECE} \le 0.05$ across clinical tracks. |
| **Clinical Utility (DCA)** | Model evaluation limited to statistical metrics (ROC-AUC, accuracy); clinical harm ratios ignored. | High AUC without net clinical benefit; failure to evaluate avoidable diagnostic interventions. | **Vickers & Elkin Decision Curve Analysis** demonstrating positive net benefit across screening thresholds ($p_t \in [0.10, 0.45]$), avoiding $20.4$ unnecessary diagnostic workups per 100 patients. |
