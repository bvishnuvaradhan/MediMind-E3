# Reproducibility Guide: Exact Commands, Seeds, and Verification

**Module:** MediMind Type-2 Diabetes Prediction System  
**Date:** November 2026  
**Auditor:** Machine Learning Research Engineer & Git Maintainer  

---

## 1. Environment & Dependencies

* **Operating System:** Windows / Linux / macOS
* **Python Runtime:** Python 3.11 - 3.14
* **Core Libraries:**
  - `scikit-learn >= 1.4.0` (evaluated on 1.9.1)
  - `pandas >= 2.0.0` (evaluated on 3.0.6)
  - `numpy >= 1.24.0` (evaluated on 2.5.3)
  - `joblib >= 1.3.0`
  - `matplotlib >= 3.8.0`
  - `fastapi >= 0.100.0`
  - `pytest >= 8.0.0`

---

## 2. Step-by-Step Reproduction Pipeline

### Step 1: Automated Dataset Acquisition & Audit
Downloads verified cohorts, extracts zip files, computes SHA-256 hashes, and builds `dataset_manifest.json`:
```bash
cd ai-prediction-service
$env:PYTHONPATH = "."
python scripts/acquire_diabetes_datasets.py
```

### Step 2: Compatibility Matrix & Adversarial Duplication Audit
Executes cross-cohort alignment checks and the Frankfurt Hospital deduplication audit:
```bash
python scripts/audit_dataset_compatibility.py
```

### Step 3: Master Research Experiment Suite (10 Experiments)
Trains baseline, candidate architectures, and calibrated ensemble across 5 seeds ($\mathcal{S} = \{42, 123, 456, 789, 2026\}$), runs cross-cohort transfer (Pima, Healthcare 100k, CDC NHANES), computes Decision Curve Analysis (DCA), fairness audits, and outputs `artifacts/diabetes_research/master_research_report.json`:
```bash
python -m app.models.diabetes.multi_cohort_experiments
```

### Step 4: Summary Table Generation
Prints structured metric tables across all 10 experiments:
```bash
python scripts/summarize_results.py
```

### Step 5: Research Figure Rendering
Generates high-resolution PNG plots in `research/diabetes/figures/`:
```bash
python scripts/generate_research_plots.py
```

### Step 6: Automated Test Suite Execution
Executes 44+ automated tests covering preprocessing, inference contracts, regression safety, and research extensions:
```bash
python -m pytest tests/diabetes/test_diabetes_preprocessing.py tests/diabetes/test_diabetes_inference.py tests/diabetes/test_diabetes_research.py -v
```

---

## 3. Key Artifact Checksums & File Paths

* `artifacts/diabetes_research/master_research_report.json`: Complete quantitative ledger of all experimental metrics, confusion matrices, and subgroup statistics.
* `artifacts/diabetes_research/best_calibrated_model.joblib`: Production calibrated ensemble (Soft-voting HGB + MLP + RF with Platt scaling).
* `artifacts/diabetes_research/preprocessor.joblib`: Leakage-free preprocessor fitted on training partitions.
* `artifacts/diabetes/best_model.joblib`: Preserved legacy baseline MLP model artifact.
* `artifacts/diabetes_baseline_reproduction/training_report.json`: Exact independent reproduction of the legacy baseline report.
