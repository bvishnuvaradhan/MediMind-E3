# MediMind X-Ray Fracture Detection Optimization Report: ResNet-18 vs DenseNet-121

**Date:** 2026-10-19  
**Evaluation Scope:** Musculoskeletal Plain Radiograph Binary Fracture Classification  
**Experiment Directory:** `ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/`  
**Status:** Experimental Controlled Evaluation Completed (Production Preservation Intact)

---

## 1. Executive Summary & Final Recommendation

An experimental, controlled head-to-head comparison was executed between the frozen production baseline (**ResNet-18 v2**), an optimized variant of ResNet-18 (**Approach A**), and DenseNet-121 transfer learning (**Approach B**). Both architectures were evaluated under strictly isolated conditions on identical, patient-partitioned held-out test data from the FracAtlas musculoskeletal radiograph dataset.

### Key Head-to-Head Comparison Table (Held-Out Test Set, N=614)

| Metric | Frozen Production Baseline (ResNet-18 v2) | Approach A: Optimized ResNet-18 | Approach B: DenseNet-121 Transfer Learning | Best Performer |
| :--- | :---: | :---: | :---: | :---: |
| **Backbone Architecture** | ResNet-18 | ResNet-18 | DenseNet-121 | — |
| **Operating Threshold** | 0.260 | 0.170 | 0.210 | Clinical Safety Tuned |
| **ROC-AUC** | **0.8751** | 0.8696 | 0.8452 | **Baseline ResNet-18** |
| **PR-AUC** | 0.6891 | **0.7220** | 0.6524 | **Approach A** (+0.0329) |
| **Sensitivity (Recall)** | 0.8655 (103/119) | 0.8403 (100/119) | **0.8824** (105/119) | Approach B |
| **Specificity** | **0.7374** (365/495) | 0.7333 (363/495) | 0.5576 (276/495) | **Baseline ResNet-18** |
| **Precision (PPV)** | **0.4421** | 0.4310 | 0.3241 | **Baseline ResNet-18** |
| **Negative Predictive Value (NPV)** | **0.9580** | 0.9503 | 0.9517 | **Baseline ResNet-18** |
| **F1-Score** | **0.5852** | 0.5698 | 0.4740 | **Baseline ResNet-18** |
| **Brier Score (Calibration)** | 0.1117 | **0.1114** | 0.1353 | **Approach A** |
| **Expected Calibration Error (ECE)** | **0.0894** | 0.0927 | 0.1337 | **Baseline ResNet-18** |
| **Confusion Matrix (TP / FP / TN / FN)**| 103 / 130 / 365 / 16 | 100 / 132 / 363 / 19 | 105 / 219 / 276 / 14 | **Baseline ResNet-18** |
| **CPU Latency (mean / p50 / p95)** | 76.8ms / 73.7ms / 107.2ms | **66.8ms / 64.9ms / 80.1ms** | 226.3ms / 226.7ms / 263.9ms | **Approach A** (3.4x faster than B) |
| **Model Artifact Size** | 42.71 MB | 42.71 MB | **27.11 MB** | DenseNet-121 |
| **Training Duration (CPU)** | Historical | 1,865 s (~31 min) | 2,752 s (~46 min) | Approach A |

---

### Final Decision

**RECOMMENDATION: Retain Existing Frozen Production ResNet-18 (`fracture_v2`)**

**Clinical & Empirical Justification:**
1. **Clinical Diagnostic Accuracy & Specificity:** DenseNet-121 suffered a severe collapse in specificity on plain radiographs down to **55.76%** (generating **219 false positives** compared to 130 for Baseline ResNet-18). For a clinical screening workflow, an excess of 89 false-positive fracture referrals imposes an intolerable burden on orthopedic radiology without delivering a statistically significant gain in true positive detection (105 vs 103).
2. **Generalization Gap:** DenseNet-121 exhibited lower ROC-AUC (0.8452 vs 0.8751) and poorer calibration (ECE of 0.1337 vs 0.0894). Its feature reuse mechanism via dense concatenation makes it prone to over-attending to soft-tissue borders and projection artifacts on small musculoskeletal sample cohorts.
3. **Approach A (Optimized ResNet-18) Trade-offs:** While Approach A achieved a higher PR-AUC (0.7220 vs 0.6891) and slightly lower inference latency (64.9ms vs 73.7ms), its overall F1-score (0.5698) and sensitivity (84.03%) did not decisively exceed the frozen production baseline (F1 0.5852, sensitivity 86.55%).
4. **Operational Latency:** DenseNet-121 inference latency on CPU (226.3 ms) is **3.4x slower** than ResNet-18 (66.8 ms), severely degrading throughput for multi-file radiographic consultations.
5. **Production Safety:** The frozen production model at `ai-prediction-service/artifacts/fracture_v2/best_model.pt` and production API service `FractureInferenceService` remain 100% untouched and fully functional. All candidate checkpoints are isolated under `artifacts/experiments/`.

---

## 2. Audit of Existing Implementation

Prior to training, a comprehensive code and artifact audit was conducted across the MediMind repository:

* **Model Class:** `FractureResNet18` in `ai-prediction-service/app/models/fracture_v2/model.py` and `FractureClassifier` in `app/models/fracture/fracture_training.py`.
* **Inference Service:** `app/services/fracture_service.py` provides lazy loading, DICOM preamble stripping, image validation (PNG/JPEG/DICOM), standardized 224x224 RGB tensor preprocessing, and MongoDB prediction persistence.
* **Architecture:**
  $$\text{X-ray Input (224}\times\text{224}\times\text{3)} \longrightarrow \text{ResNet-18 Backbone} \longrightarrow \text{Adaptive/Global Avg Pooling} \longrightarrow \text{Dropout (0.20)} \longrightarrow \text{Linear (512}\to\text{1)} \longrightarrow \text{Logit}$$
* **Loss Function:** `BCEWithLogitsLoss(pos_weight=4.7571)` to penalize false negatives in the presence of positive class imbalance (~17.5% fracture prevalence).
* **Existing Production Artifact:** `ai-prediction-service/artifacts/fracture_v2/best_model.pt` (SHA-256: `ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60`, Size: 42.71 MB).
* **Production Threshold:** Calibrated at $t = 0.260$ on validation data.

---

## 3. Dataset Inventory and Zero-Leakage Splitting

### Dataset Source: FracAtlas
* **Total Raw Radiographs:** 4,083
* **Corrupted / Unreadable Images:** 0
* **MD5 Duplicate Radiographs Excluded:** 15
* **Valid Radiographs:** 4,068
* **Unique Patients (Clustered):** 2,103
* **Class Balance:** 715 Fractured (17.58%), 3,353 Non-Fractured (82.42%)

### Patient-Level Partitioning
To guarantee zero data leakage between splits, patient IDs were established by sequence/study clustering (`PAT_FA_xxxxx`). Splitting was performed using patient-level stratification:

* **Training Partition:** 2,844 images (1,472 patients; 494 fractured [17.37%], 2,350 non-fractured)
* **Validation Partition:** 610 images (315 patients; 102 fractured [16.72%], 508 non-fractured)
* **Held-Out Test Partition:** 614 images (316 patients; 119 fractured [19.38%], 495 non-fractured)
* **Leakage Verification:**
  * Train $\cap$ Validation: **0 patients**
  * Train $\cap$ Test: **0 patients**
  * Validation $\cap$ Test: **0 patients**
  * Leakage detected: **False**

---

## 4. Experimental Setup & Candidate Architectures

### Common Preprocessing & Training Constraints
* **Input Resolution:** $224 \times 224 \times 3$, normalized with ImageNet mean $(0.485, 0.456, 0.406)$ and std $(0.229, 0.224, 0.225)$.
* **Data Augmentation (Train Only):** Medically conservative rotation (maximum 7 degrees) and subtle brightness/contrast adjustment (0.08). Random horizontal/vertical flipping was **strictly prohibited** to preserve anatomical orientation and laterality.
* **Validation/Test Transforms:** Deterministic resize to $224 \times 224$ and ImageNet normalization only.
* **Loss Function:** `nn.BCEWithLogitsLoss(pos_weight=4.7571)`.
* **Random Seed:** 42 across PyTorch, NumPy, and random.
* **Hardware:** Intel CPU (8 vCPUs), PyTorch 2.14.1+cpu.

### Approach A: Optimized ResNet-18
* **Architecture:** `FractureResNet18` with tuned dropout rate $p = 0.25$.
* **Optimization Regimen:**
  * **Stage 1 (Warm-Up, 2 epochs):** Feature backbone completely frozen; classification head trained with AdamW ($\text{lr} = 8\times 10^{-4}, \text{weight\_decay} = 10^{-2}$).
  * **Stage 2 (Fine-Tuning, 4 epochs):** Backbone layers 3 and 4 unfrozen with differential learning rates:
    * Layer 3: $\text{lr} = 5\times 10^{-5}, \text{weight\_decay} = 10^{-3}$
    * Layer 4: $\text{lr} = 1\times 10^{-4}, \text{weight\_decay} = 10^{-3}$
    * Classification Head: $\text{lr} = 5\times 10^{-4}, \text{weight\_decay} = 10^{-2}$
    * Scheduler: `CosineAnnealingLR` with $T_{\max} = 4, \eta_{\min} = 10^{-6}$.
* **Artifact:** `artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/candidate_a_optimized_resnet18.pt`

### Approach B: DenseNet-121 Transfer Learning
* **Architecture:** `FractureDenseNet121` (`app/models/fracture_v2/densenet_model.py`).
  $$\text{X-ray} \longrightarrow \text{DenseNet-121 Backbone} \longrightarrow \text{AdaptiveAvgPool2d (1024-dim)} \longrightarrow \text{Dropout (0.20)} \longrightarrow \text{Linear (1024}\to\text{1)}$$
* **Optimization Regimen:**
  * **Stage 1 (Warm-Up, 2 epochs):** Backbone frozen; Linear head trained with AdamW ($\text{lr} = 8\times 10^{-4}, \text{weight\_decay} = 10^{-2}$).
  * **Stage 2 (Fine-Tuning, 3 epochs):** Transition 3, DenseBlock 4, and Norm 5 unfrozen:
    * Transition 3: $\text{lr} = 3\times 10^{-5}, \text{weight\_decay} = 10^{-4}$
    * DenseBlock 4 & Norm 5: $\text{lr} = 8\times 10^{-5}, \text{weight\_decay} = 10^{-4}$
    * Classification Head: $\text{lr} = 4\times 10^{-4}, \text{weight\_decay} = 10^{-2}$
    * Scheduler: `CosineAnnealingLR` with $T_{\max} = 3, \eta_{\min} = 10^{-6}$.
* **Artifact:** `artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/candidate_b_densenet121.pt`

---

## 5. Training Convergence & Validation Optimization

### Training Trajectory

```
Approach A (Optimized ResNet-18):
Stage 1 (Warmup):
  Epoch 1: Train Loss = 1.1747 | Val Loss = 1.1059 | Val AUC = 0.6483 | PR-AUC = 0.2824 (249s)
  Epoch 2: Train Loss = 1.0645 | Val Loss = 1.0163 | Val AUC = 0.7348 | PR-AUC = 0.4006 (254s)
Stage 2 (Differential Fine-Tuning):
  Epoch 3: Train Loss = 0.8469 | Val Loss = 0.7795 | Val AUC = 0.8748 | PR-AUC = 0.6553 (339s)
  Epoch 4: Train Loss = 0.5793 | Val Loss = 0.7310 | Val AUC = 0.8949 | PR-AUC = 0.6997 (346s)
  Epoch 5: Train Loss = 0.4082 | Val Loss = 0.7389 | Val AUC = 0.8861 | PR-AUC = 0.7026 (344s)
  Epoch 6: Train Loss = 0.2973 | Val Loss = 0.7762 | Val AUC = 0.8956 | PR-AUC = 0.7142 (333s)
Peak Val AUC: 0.8956 | Selected Threshold: t = 0.170

Approach B (DenseNet-121):
Stage 1 (Warmup):
  Epoch 1: Train Loss = 1.1048 | Val Loss = 1.0139 | Val AUC = 0.7694 | PR-AUC = 0.4201 (525s)
  Epoch 2: Train Loss = 1.0165 | Val Loss = 0.9638 | Val AUC = 0.7805 | PR-AUC = 0.4391 (481s)
Stage 2 (Progressive Fine-Tuning):
  Epoch 3: Train Loss = 0.8901 | Val Loss = 0.8088 | Val AUC = 0.8439 | PR-AUC = 0.5992 (605s)
  Epoch 4: Train Loss = 0.7208 | Val Loss = 0.8184 | Val AUC = 0.8562 | PR-AUC = 0.6289 (596s)
  Epoch 5: Train Loss = 0.6486 | Val Loss = 0.7663 | Val AUC = 0.8652 | PR-AUC = 0.6332 (544s)
Peak Val AUC: 0.8652 | Selected Threshold: t = 0.210
```

### Validation Threshold Tuning (Strictly Isolated)
Clinical priority requires sensitivity $\ge 85\%$ for triage safety while maximizing Youden's $J$ and $F_1$.
* **Baseline ResNet-18:** $t = 0.260 \implies \text{Val Sensitivity} = 0.9314, \text{Val Specificity} = 0.7283, \text{Val AUC} = 0.9041$.
* **Optimized ResNet-18:** $t = 0.170 \implies \text{Val Sensitivity} = 0.8725, \text{Val Specificity} = 0.7579, \text{Val AUC} = 0.8956$.
* **DenseNet-121:** $t = 0.210 \implies \text{Val Sensitivity} = 0.9118, \text{Val Specificity} = 0.5886, \text{Val AUC} = 0.8652$.

---

## 6. Detailed Anatomical & Subgroup Analysis

Performance breakdown on the held-out test set ($N=614$) across anatomical regions and hardware:

### Anatomical Subgroups

#### Hand Radiographs ($N=252$; 73 Fractured, 179 Non-Fractured)
* **Baseline ResNet-18:** Sensitivity = 0.9452, Specificity = 0.5028, F1 = 0.5974, AUC = 0.8306, Brier = 0.1745
* **Optimized ResNet-18:** Sensitivity = 0.9041, Specificity = 0.4693, F1 = 0.5641, AUC = 0.8280, Brier = 0.1847
* **DenseNet-121:** Sensitivity = 0.9452, **Specificity = 0.2682**, F1 = 0.5055, AUC = 0.7906, Brier = 0.2083
*(DenseNet-121 produces excessive false alarms in hand radiographs due to complex carpals and phalangeal overlap).*

#### Leg Radiographs ($N=312$; 44 Fractured, 268 Non-Fractured)
* **Baseline ResNet-18:** Sensitivity = 0.7500, Specificity = 0.8545, F1 = 0.5690, AUC = 0.8735, Brier = 0.0741
* **Optimized ResNet-18:** Sensitivity = 0.7500, **Specificity = 0.8694**, F1 = 0.5893, AUC = 0.8504, Brier = 0.0665
* **DenseNet-121:** Sensitivity = 0.7727, Specificity = 0.7239, F1 = 0.4474, AUC = 0.8474, Brier = 0.0889

#### Hip Radiographs ($N=30$; 2 Fractured, 28 Non-Fractured)
* **Baseline ResNet-18:** Sensitivity = 1.000, Specificity = 0.9310, F1 = 0.5000, AUC = 1.0000
* **Optimized ResNet-18:** Sensitivity = 1.000, Specificity = 0.9310, F1 = 0.5000, AUC = 1.0000
* **DenseNet-121:** Sensitivity = 1.000, Specificity = 0.6897, F1 = 0.1818, AUC = 1.0000

### Orthopedic Hardware Presence
* **No Hardware ($N=589$):**
  * Baseline ResNet-18: Sensitivity = 0.8316, Specificity = 0.7368, F1 = 0.5197, AUC = 0.8551
  * Approach A: Sensitivity = 0.8105, Specificity = 0.7348, F1 = 0.5083, AUC = 0.8502
  * DenseNet-121: Sensitivity = 0.8737, Specificity = 0.5587, F1 = 0.4192, AUC = 0.8333
* **Hardware Present ($N=25$, plates/screws):**
  * Baseline ResNet-18: Sensitivity = 1.000, Specificity = 1.000, F1 = 1.000, AUC = 1.0000
  * Approach A: Sensitivity = 0.9583, Specificity = 0.000 (1 FP), F1 = 0.9583, AUC = 0.9167
  * DenseNet-121: Sensitivity = 0.9167, Specificity = 0.000, F1 = 0.9362, AUC = 0.7500

---

## 7. Explainability & Grad-CAM Analysis

Grad-CAM heatmaps were generated from the final convolutional block (`layer4[-1].conv2` for ResNet-18, `denseblock4.denselayer16.conv2` for DenseNet-121) across representative clinical outcomes:

* **True Positive Case (`IMG0000025.jpg`, Hand Fracture):**
  * Baseline ResNet-18: Predicted probability $p = 0.8697$, Central Focus Ratio = **44.92%**
  * Approach A ResNet-18: Predicted probability $p = 0.9650$, Central Focus Ratio = **54.91%**
  * Approach B DenseNet-121: Predicted probability $p = 0.7946$, Central Focus Ratio = **44.63%**
  * *Finding:* Both architectures correctly focused on cortical disruption at the fracture site in true positives.
* **False Positive Analysis:**
  * Baseline ResNet-18: Hand radiograph (`IMG0000016.jpg`) had a border artifact ratio of 17.6%.
  * DenseNet-121: Leg radiograph (`IMG0000008.jpg`) produced false alarms caused by diffuse attention across soft-tissue contrast rather than focal cortical step-offs.

---

## 8. Artifact Inventory & Cryptographic Checksums

All experimental models and reports are preserved in an isolated experimental directory:

| Artifact File | Architecture | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| `ai-prediction-service/artifacts/fracture_v2/best_model.pt` | ResNet-18 (Frozen Production) | 42.71 MB | `ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60` |
| `ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/candidate_a_optimized_resnet18.pt` | ResNet-18 (Approach A) | 42.71 MB | `079454ebe9b59d31e66c7f187e6913a2a0e6d6ee973bacac5ff46cae5f165dc4` |
| `ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/candidate_b_densenet121.pt` | DenseNet-121 (Approach B) | 27.11 MB | `b8c81a050670f1f6e1f45f677eca5acb3abfed326309e5acf4991ac9a07ed39c` |
| `ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/experiment_benchmark_report.json` | Benchmark JSON | 19.15 KB | — |

---

## 9. Regression Testing & Production Verification

* **Unit & Integration Tests:** 50/50 test cases passed in `tests/fracture/`:
  * `test_fracatlas_ingestion.py` (4 passed)
  * `test_fracture_inference.py` (16 passed)
  * `test_fracture_preprocessing.py` (14 passed)
  * `test_fracture_training.py` (7 passed)
  * `test_mura_audit.py` (9 passed)
* **Production Integrity:**
  * Zero modifications to production artifacts in `artifacts/fracture/` or `artifacts/fracture_v2/`.
  * Zero modifications to clinical databases, appointment workflows, or cardiovascular/diabetes pipelines.
  * Standalone candidate models verified via independent deserialization and forward-pass inference.
