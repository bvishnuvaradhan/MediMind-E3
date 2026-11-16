# Limitations and Clinical Deployment Boundaries

**Module:** MediMind Type-2 Diabetes Prediction System  
**Date:** November 2026  
**Auditor:** Senior Clinical AI Researcher & Data Scientist  

---

## 1. Methodological & Data Limitations

1. **Retrospective Observational Study Design:**  
   All evaluated cohorts (Pima, Healthcare 100k, CDC NHANES, Sylhet Bangladesh) are retrospective observational datasets. No prospective randomized controlled trial (RCT) has yet evaluated patient outcomes under MediMind AI guidance. Prospective validation in live clinical workflows is mandatory before regulatory clearance (FDA SaMD / CE-MDR).

2. **Feature Coverage & Proxy Definitions:**  
   In cross-cohort harmonization, certain physiological measurements do not exist uniformly across datasets:
   - Acute 2-hour post-challenge serum insulin is present in Pima but absent from typical outpatient EHR records.
   - Diastolic blood pressure was mapped to a clinical hypertension proxy in Healthcare 100k.
   - Genetic pedigree functions are unique to family-tracked cohorts and cannot be inferred for unlinked populations without genomic sequencing.

3. **Demographic Subgroup Disparities:**  
   Our algorithmic fairness evaluation revealed an **Equal Opportunity difference of $0.1875$ across age cohorts** (higher sensitivity in older adults aged 50+ compared to young adults aged 21-34). This disparity reflects underlying physiological epidemiology (older patients exhibit higher glycemic elevation and longer disease duration), but clinicians must be aware that younger patients with early-stage disease may present with more subtle glycemic deviations.

4. **Self-Reported vs. Laboratory Targets:**  
   While Pima and Healthcare 100k use laboratory criteria (OGTT, fasting plasma glucose, HbA1c), public health datasets like BRFSS rely on telephone survey self-reports, introducing recall bias and misclassification error into macro-epidemiological models.

---

## 2. Mandatory Clinical Governance Constraints

To protect patient safety, MediMind enforces the following clinical boundaries:

* **Non-Diagnostic Tool:** Model output is an **estimated risk probability** and **risk stratum**, never a medical diagnosis.
* **Preservation of Clinical Autonomy:** Risk scores must not trigger automated clinical actions (e.g., initiating insulin or metformin therapy) without independent clinical evaluation, history taking, and confirmatory laboratory testing (fasting glucose or HbA1c).
* **Pediatric Exclusion:** The model is evaluated on adult cohorts ($\ge 18$ years of age). Predictions for pediatric patients (< 18 years) are outside the validated scope and are rejected by API validation gates.
* **Mandatory Safety Disclaimer:** Every API response and user interface surface displays the canonical disclaimer:  
  > *"This is an AI-assisted diabetes risk estimate, not a medical diagnosis. Consult a qualified healthcare professional."*
