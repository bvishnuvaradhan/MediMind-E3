# Open Items & Data Gaps: MediMind Case Study Revision

**Audit Date:** November 4, 2026  
**Target Repository:** `D:\projects\MediMind`  
**Governing Rule:** No invented numbers, counts, hashes, or benchmarks. Where an empirical value cannot be identified in repository manifests, checkpoints, or logs, it is formally recorded below and marked as `[DATA NEEDED: what is missing, where you looked]` within the manuscript.

---

## 1. Missing Empirical Data & Unrun Experiments

### Item 1: Empirical Training & Evaluation on Un-Deduplicated Cardiovascular Cohort
- **Missing Data:** Empirical cross-validation and test set performance metrics (ROC-AUC, PR-AUC, Recall, Specificity, Brier score) for Random Forest and Logistic Regression trained on the raw, un-deduplicated dataset ($N = 68,783$).
- **Where Looked:**
  - `ai-prediction-service/artifacts/heart_disease/training_report.json`
  - `ai-prediction-service/app/models/heart_disease/heart_disease_training.py`
  - `ai-prediction-service/artifacts/experiments/benchmark_four_approaches_20261019/`
  - `scripts/`
- **Finding:** The repository code explicitly deduplicates the dataset prior to stratified splitting. While duplicate counts are recorded (3,820 duplicate rows identified across 2,602 duplicate groups), no model was trained on the un-deduplicated partition. Consequently, previous claims of measured empirical performance degradation from duplicate leakage were theoretical extrapolations rather than measured repo facts.
- **Handling in Case Study:** Marked as `[DATA NEEDED: empirical model metrics on un-deduplicated cardiovascular cohort; searched in artifacts/heart_disease/ and artifacts/experiments/]`. Insights 1 and 2 and Research Question 1 are framed as theoretical data science principles and methodological hypotheses rather than measured empirical deltas.

---

### Item 2: Standardized Per-Model Inference Latency Benchmarks
- **Missing Data:** Per-sample micro-benchmarked inference latency (mean, median, p95, p99) in milliseconds across standardized CPU and GPU hardware for each individual machine learning model:
  1. Tabular Cardiovascular Random Forest (`best_model.joblib`)
  2. Tabular Diabetes MLP (`best_model.joblib`)
  3. Single-View ResNet-18 (`best_model.pt`)
  4. Dual-View Localized Fusion ResNet-18 (`experiment8a_best_model.pt`)
  5. Deterministic NLP Triage Engine
- **Where Looked:**
  - `scripts/benchmark_results.json`
  - `ai-prediction-service/artifacts/experiments/`
  - `ai-prediction-service/artifacts/heart_disease/training_report.json`
  - `ai-prediction-service/artifacts/diabetes/training_report.json`
  - `ai-prediction-service/artifacts/fracture/training_report.json`
  - `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/`
- **Finding:** The only latency benchmark present in the repository is `scripts/benchmark_results.json`, which measures full HTTP payload transfer times for backend endpoints (e.g. warm paginated latency 28.2 ms, p95 41.36 ms; full cold latency 5,490.66 ms). No standalone benchmark scripts measuring model `predict()` or PyTorch forward-pass timings were logged in the repository.
- **Handling in Case Study:** Previous narrative claims of "sub-15 ms", "85–140 ms", and "sub-5 ms" are marked as `[DATA NEEDED: per-model inference latency benchmark logs on standardized hardware; searched in scripts/benchmark_results.json and ai-prediction-service/artifacts/]`. The backend endpoint timings from `scripts/benchmark_results.json` are reported with their true network and serialization scope.

---

### Item 3: ResNet-50 Musculoskeletal Fracture Experiment Artifacts
- **Missing Data:** Checkpoint file, training history, loss curves, and evaluation metrics for a 50-layer Residual Network (ResNet-50) evaluated on pediatric wrist radiographs.
- **Where Looked:**
  - `ai-prediction-service/artifacts/experiments/`
  - `ai-prediction-service/artifacts/fracture_v2/`
  - `ai-prediction-service/scripts/`
- **Finding:** The repository contains an architectural scaling experiment comparing `baseline_resnet18`, `approach_a_optimized_resnet18`, and `approach_b_densenet121` (`artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/`). No ResNet-50 model was trained or evaluated in the repository. Previous narrative claims in Insight 11 that "scaling from ResNet-18 to ResNet-50 failed" conflated ResNet-50 with the DenseNet-121 experiment.
- **Handling in Case Study:** ResNet-50 claims are replaced with the verified DenseNet-121 experiment results (`approach_b_densenet121`), accurately reporting that scaling architectural capacity via dense feature concatenation failed to overcome growth plate confounding.

---

### Item 4: Unextracted Radiographs in GRAZPEDWRI-DX Archive
- **Missing Data:** Visual annotations and split manifests for the remaining 15,296 images of the full public GRAZPEDWRI-DX dataset.
- **Where Looked:**
  - `ai-prediction-service/artifacts/fracture_v2/graz_only/manifests/dataset_cleaning_report.json`
  - `ai-prediction-service/test-dataset/Bone Facture/GRAZPEDWRI-DX/`
- **Finding:** `dataset_cleaning_report.json` explicitly logs `total_raw_rows: 20327`, `total_valid_images: 5031`, and `excluded_unextracted: 15296`. A canonical subset of 5,031 radiographs (1,499 unique patients) was extracted to satisfy local workstation disk and CPU compute budgets.
- **Handling in Case Study:** Documented transparently in Phase 2 and Phase 3: the full dataset scale (20,327 images, 10,643 studies, 6,091 patients; Nagy et al., 2022) is cited alongside the computationally bounded 5,031-image extracted working subset.
