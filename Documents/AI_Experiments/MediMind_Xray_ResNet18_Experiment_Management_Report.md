# MediMind X-Ray ResNet-18 Experiment Management & Production Protection Report

**Date:** 2026-10-19  
**Branch:** `experiment8-multiview-localized-fusion`  
**Security Reference Checkpoint:** `80e0b97` (`fix(security): harden diabetes shadow evaluation and gateway CORS`)  
**Production Model Decision:** **RETAIN `fracture_v2` (`ai-prediction-service/artifacts/fracture_v2/best_model.pt`)**  

---

## 1. Executive Summary & Governance Decision

In accordance with MediMind clinical AI governance standards, this experiment-management review audited all artifacts, scripts, benchmark ledgers, and candidate checkpoints generated during the ResNet-18 optimization and refinement phases.

### Production Decision: RETAIN `fracture_v2`
* **Production Status:** The frozen `fracture_v2` model remains the active production artifact.
* **Clinical Justification:** 
  1. The new refined candidate (`candidate_refined_resnet18.pt`) achieved notable gains in probability calibration (ECE reduced from $0.0894$ to $0.0550$, Brier score reduced from $0.1117$ to $0.0988$) and improved PR-AUC over the frozen baseline ($0.7071$ vs $0.6891$). However, its test ROC-AUC ($0.8675$) and sensitivity ($84.87\%$, $101/119$ true positives) did not surpass the frozen production baseline ($0.8751$ ROC-AUC, $86.55\%$ sensitivity, $103/119$ true positives).
  2. The previous candidate (`candidate_a_optimized_resnet18.pt`) demonstrated higher PR-AUC ($0.7220$) and marginally lower CPU latency ($39.4\text{ ms}$ vs $42.6\text{ ms}$), but also trailed the production baseline in sensitivity ($84.03\%$) and overall ROC-AUC ($0.8696$).
  3. Neither experimental candidate provides sufficient clinical diagnostic margin over the production baseline to justify an operational migration. Automated promotion is denied.

---

## 2. Production Artifact Protection & Cryptographic Verification

The production fracture model at `ai-prediction-service/artifacts/fracture_v2/best_model.pt` was verified as frozen before and after all operations:

| Artifact Role | File Path | Verified SHA-256 Checksum | Size | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Active Production Model** | `ai-prediction-service/artifacts/fracture_v2/best_model.pt` | `ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60` | 42.71 MB | **Frozen (Unchanged)** |
| **Legacy Baseline Model** | `ai-prediction-service/artifacts/fracture/best_model.pt` | Verified historical artifact | 42.71 MB | **Preserved (Unchanged)** |

* **Zero Overwrite Guarantee:** No production weights, metadata, thresholds, or configuration files were overwritten, reserialized, or retrained.
* **Production Inference Service Isolation:** `FractureInferenceService` in `app/services/fracture_service.py` remains explicitly bound to `MODEL_PATH = Path(...) / "artifacts" / "fracture" / "best_model.pt"` and `fracture_v2`. No experimental paths or environment fallback switches can load experimental candidate checkpoints into clinical user workflows.

---

## 3. Retained Experimental Candidates & Artifact Inventory

All useful research candidates are preserved in isolated storage directories under `ai-prediction-service/artifacts/experiments/`:

### 1. ResNet-18 Refinement Candidates (`artifacts/experiments/resnet18_refinement_20261019/`)
* **`candidate_refined_resnet18.pt`** (42.71 MB)
  * **SHA-256:** `5e6e1cdd3f28080c8d2b3f6370379df9a67058e42f7fd62acb8d4848abb18b8e`
  * **Architecture:** `FractureResNet18` with dropout $p = 0.25$, ultra-conservative medical augmentation ($\le 5^\circ$ rotation, mild affine scale $0.96\text{--}1.04$, contrast $0.05$).
  * **Optimal Threshold:** $t = 0.060$ (validation-calibrated).
  * **Key Trait:** Lowest ECE ($0.0550$) and Brier score ($0.0988$).
* **`refinement_benchmark_report.json`** (10.01 KB)
  * Machine-readable experiment ledger containing validation trajectories, calibration curves, and stress test records.

### 2. Multi-Candidate Benchmark Candidates (`artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/`)
* **`candidate_a_optimized_resnet18.pt`** (42.71 MB)
  * **SHA-256:** `079454ebe9b59d31e66c7f187e6913a2a0e6d6ee973bacac5ff46cae5f165dc4`
  * **Architecture:** `FractureResNet18` with differential learning rates and CosineAnnealingLR.
  * **Optimal Threshold:** $t = 0.170$.
* **`candidate_b_densenet121.pt`** (27.11 MB)
  * **SHA-256:** `b8c81a050670f1f6e1f45f677eca5acb3abfed326309e5acf4991ac9a07ed39c`
  * **Architecture:** `FractureDenseNet121` transfer learning model.
  * **Optimal Threshold:** $t = 0.210$.
* **`experiment_benchmark_report.json`** (19.15 KB) & Grad-CAM folders (`gradcam_baseline/`, `gradcam_opt_resnet/`, `gradcam_densenet121/`).

### Discarded / Removed Artifacts
* **Zero Artifacts Removed:** All generated model checkpoints and ledgers are actively documented in the research record and provide direct provenance for the comparative benchmark tables. No unreferenced temporary checkpoints were present.

---

## 4. Benchmark Verification & Reproducibility Audit

The reported test metrics were independently reproduced and verified against the common held-out test partition (`artifacts/fracture_v2/manifests/test.csv`, $N=614$, 316 patients, 0 patient overlap with train/val):

| Metric | Frozen `fracture_v2` | Previous `candidate_a` | Refined Candidate | Verification Status |
| :--- | :---: | :---: | :---: | :---: |
| **Test ROC-AUC** | 0.8751 | 0.8696 | 0.8675 | **Independently Verified** |
| **Test PR-AUC** | 0.6891 | 0.7220 | 0.7071 | **Independently Verified** |
| **Sensitivity (Recall)** | 86.55% (103/119) | 84.03% (100/119) | 84.87% (101/119) | **Independently Verified** |
| **Specificity** | 73.74% (365/495) | 73.33% (363/495) | 72.53% (359/495) | **Independently Verified** |
| **Precision (PPV)** | 44.21% (103/233) | 43.10% (100/232) | 42.62% (101/237) | **Independently Verified** |
| **Negative Predictive Value (NPV)** | 95.80% (365/381) | 95.03% (363/382) | 95.23% (359/377) | **Independently Verified** |
| **F1-Score** | 0.5852 | 0.5698 | 0.5674 | **Independently Verified** |
| **Brier Score** | 0.1117 | 0.1114 | 0.0988 | **Independently Verified** |
| **Expected Calibration Error (ECE)** | 0.0894 | 0.0927 | 0.0550 | **Independently Verified** |
| **Median CPU Latency** | 42.6 ms | 39.4 ms | 40.3 ms | **Independently Verified** |
| **Border Masking Stress Test ($\Delta$ AUC)** | — | — | -0.0011 | **Independently Verified** (No shortcut) |

---

## 5. Regression Testing & Production Safety

* **Test Suite:** Executed `python -m pytest tests/fracture -v`.
* **Results:** **54 of 54 test cases passed** (100% pass rate in 9.16s).
* **Isolation Verification:** Newly added [`test_experiment_isolation.py`](file:///d:/projects/MediMind/ai-prediction-service/tests/fracture/test_experiment_isolation.py) verified:
  1. `test_production_v2_model_hash_unchanged`: PASSED.
  2. `test_production_inference_service_path_isolation`: PASSED.
  3. `test_refined_candidate_is_isolated`: PASSED.
  4. `test_isolated_candidate_loading`: PASSED.
* **Unrelated Work Untouched:** All modified files in `backend/appointment-service/`, `backend/medical-record-service/`, `frontend/`, and `Documents/Production_Readiness_Audit/` remain completely preserved in the working tree.
