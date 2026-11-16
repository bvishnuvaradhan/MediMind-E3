# Research Objective: Multi-Cohort Calibrated & Explainable Diabetes Risk Prediction

**Project:** MediMind Clinical AI Research Upgrade  
**Module:** Type-2 Diabetes Risk Assessment Engine  
**Author:** MediMind Senior Machine Learning & Clinical AI Research Team  
**Date:** November 2026  
**Status:** Defensible Research Contribution & Multi-Cohort Evaluation  

---

## 1. Executive Summary & Clinical Problem Statement

Type-2 Diabetes Mellitus (T2DM) affects over 537 million adults globally, with projections exceeding 783 million by 2045 (IDF Diabetes Atlas, 10th Ed.). Early identification of individuals at high risk for diabetes enables targeted lifestyle interventions and pharmacotherapy that can prevent or delay progression to overt microvascular and macrovascular complications.

However, existing machine learning diabetes prediction implementations in academic literature and clinical prototypes suffer from four major methodological deficiencies:

1. **Severe Cohort Over-Reliance & Demographic Restriction:**  
   The vast majority of published studies rely exclusively on the 1988 Pima Indians Diabetes Database ($N = 768$). This cohort consists solely of Pima Indian women aged $\ge 21$ years living in the Gila River Indian Community. Models trained on this dataset lack external validation and fail to generalize across diverse clinical, ethnic, and demographic cohorts.

2. **The "Frankfurt Hospital" Contamination Trap:**  
   Numerous contemporary papers claim multi-cohort validation on a "Hospital Frankfurt, Germany" dataset ($N = 2,000$). Through an exhaustive provenance and deduplication audit, our research reveals that **99.05% of records in the Frankfurt dataset are duplicate resamplings of the Pima Indians dataset**. Treating Frankfurt as an external European cohort constitutes an undetected methodological flaw and data-leakage trap in the literature.

3. **Poor Probability Calibration & Arbitrary Decision Thresholds:**  
   Standard classification metrics (accuracy, ROC-AUC) hide extreme miscalibration. Uncalibrated neural networks and tree ensembles frequently produce overconfident probability estimates that misrepresent clinical risk. Furthermore, most systems evaluate models at an arbitrary classification threshold of $p = 0.50$, ignoring the clinical reality that false negatives (missed early diabetic patients) incur far higher morbidity costs than false positives.

4. **Lack of Decision Curve Analysis (DCA) and Clinical Utility:**  
   Few studies assess whether deploying an AI risk score provides net clinical benefit over standard clinical decision policies (e.g., screening all patients or screening none).

---

## 2. Formal Research Questions

This research investigation addresses five core empirical questions:

* **RQ1 (Generalization):** Does an ensemble trained on a demographically restricted physiological cohort (Pima) maintain predictive discrimination when transferred zero-shot to large-scale clinical Electronic Health Records ($N = 100,000$) or nationally representative epidemiological populations (CDC NHANES, $N = 9,813$)?
* **RQ2 (Multi-Cohort Harmonization):** Can a shared core clinical feature space (Age, BMI, Glucose, Blood Pressure, Hypertension, Sex) reconcile physiological oral glucose tolerance data with clinical EHR records to improve cross-population discrimination?
* **RQ3 (Calibration & Reliability):** Does post-hoc Platt scaling or isotonic regression reduce Expected Calibration Error (ECE) below 5% without sacrificing discrimination (ROC-AUC and PR-AUC)?
* **RQ4 (Clinical Net Benefit):** Across decision thresholds relevant to population screening ($p_t \in [0.10, 0.40]$), does the calibrated multi-cohort model deliver positive net benefit exceeding default "treat-all" and "treat-none" strategies under Vickers & Elkin Decision Curve Analysis?
* **RQ5 (Algorithmic Equity):** Does the model exhibit significant True Positive Rate (Equal Opportunity) or False Positive Rate disparities across age cohorts and BMI categories?

---

## 3. Scope and Architectural Boundaries

* **System Scope:** This research upgrade exclusively targets the Type-2 Diabetes Risk prediction module within `ai-prediction-service`.
* **System Invariance:** All other MediMind services—including pediatric fracture detection (Dual ResNet18/DenseNet121 localized fusion), cardiovascular risk prediction, and general health NLP triage—are strictly preserved without regression.
* **Clinical Boundary:** Model predictions are explicitly formalized as **experimental clinical decision-support risk estimates**, not definitive medical diagnoses. All outputs mandate strict non-diagnostic disclaimers and require review by a licensed healthcare professional.
