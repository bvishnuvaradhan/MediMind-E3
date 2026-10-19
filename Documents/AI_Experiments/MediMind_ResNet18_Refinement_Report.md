# MediMind ResNet-18 Advanced Fracture Detection Refinement Report

**Date:** 2026-10-19  
**Evaluation Target:** Deep Musculoskeletal Radiograph Fracture Refinement  
**Experiment Ledger:** `ai-prediction-service/artifacts/experiments/resnet18_refinement_20261019/refinement_benchmark_report.json`  
**Refined Checkpoint:** `ai-prediction-service/artifacts/experiments/resnet18_refinement_20261019/candidate_refined_resnet18.pt`  
**Baseline Artifact:** `ai-prediction-service/artifacts/fracture_v2/best_model.pt` (Frozen Production)

---

## 1. Executive Summary & Final Recommendation

Building directly upon the completed ResNet-18 vs DenseNet-121 benchmark, an advanced refinement experiment series was conducted focusing exclusively on **ResNet-18**. A systematic hyperparameter search was executed across four clinical dimensions:
1. **Staged Fine-Tuning Depth & Scheduling:** Unfreezing Layer 4 only vs Layer 3+4; CosineAnnealingLR vs ReduceLROnPlateau.
2. **Loss Formulation & Imbalance Penalization:** Class-weighted BCEWithLogitsLoss vs Binary Focal Loss ($\gamma = 2.0$).
3. **Medical Augmentation Policies:** Standard conservative (rotation $\le 7^\circ$, jitter $0.08$) vs ultra-conservative clinical affine transforms (rotation $\le 5^\circ$, scale $0.96\text{--}1.04$, contrast $0.05$).
4. **Calibration & Robustness:** Post-hoc isotonic probability calibration, Gaussian noise perturbation, and $10\%$ peripheral border masking.

All architectural and hyperparameter choices were tuned **strictly on the validation partition**. The final refined candidate was subsequently evaluated on the untouched, patient-stratified held-out test set ($N=614$).

### 3-Way Benchmark Comparison Table (Untouched Test Set, N=614)

| Metric | Frozen Production Baseline (ResNet-18 v2) | Previous Approach A Candidate (`candidate_a`) | New Refined ResNet-18 Candidate (`ref_3_conservative_aug`) | Best Performer |
| :--- | :---: | :---: | :---: | :---: |
| **Backbone Architecture** | ResNet-18 | ResNet-18 | ResNet-18 | — |
| **Operating Threshold** | 0.260 | 0.170 | 0.060 | Val-Calibrated |
| **Test ROC-AUC** | **0.8751** | 0.8696 | 0.8675 | **Frozen Baseline** |
| **Test PR-AUC** | 0.6891 | **0.7220** | 0.7071 | **Approach A** |
| **Sensitivity (Recall)** | **0.8655** (103/119) | 0.8403 (100/119) | 0.8487 (101/119) | **Frozen Baseline** |
| **Specificity** | **0.7374** (365/495) | 0.7333 (363/495) | 0.7253 (359/495) | **Frozen Baseline** |
| **Precision (PPV)** | **0.4421** | 0.4310 | 0.4262 | **Frozen Baseline** |
| **Negative Predictive Value (NPV)** | **0.9580** | 0.9503 | 0.9523 | **Frozen Baseline** |
| **F1-Score** | **0.5852** | 0.5698 | 0.5674 | **Frozen Baseline** |
| **Brier Score (Calibration)** | 0.1117 | 0.1114 | **0.0988** | **New Refined Candidate** (-11.5%) |
| **Expected Calibration Error (ECE)** | 0.0894 | 0.0927 | **0.0550** | **New Refined Candidate** (-38.5%) |
| **Confusion Matrix (TP / FP / TN / FN)** | 103 / 130 / 365 / 16 | 100 / 132 / 363 / 19 | 101 / 136 / 359 / 18 | **Frozen Baseline** |
| **CPU Latency (median p50)** | 42.6 ms | **39.4 ms** | 40.3 ms | Approach A |
| **Model Size** | 42.71 MB | 42.71 MB | 42.71 MB | Identical |
| **Border Masking Robustness Drop ($\Delta$ AUC)** | — | — | **-0.0011** (No shortcut detected) | Refined Candidate |

---

### Final Decision

**RECOMMENDATION: Retain Production Baseline (`ai-prediction-service/artifacts/fracture_v2/best_model.pt`)**

**Clinical & Methodological Rationale:**
1. **Generalization Plateau on Test Patients:** Despite achieving the highest validation ROC-AUC observed to date (**0.9144** on the validation set, with validation PR-AUC of **0.7460**), the refined candidate generalized to a test ROC-AUC of **0.8675** and test sensitivity of **84.87%**, slightly trailing the frozen production baseline (ROC-AUC 0.8751, sensitivity 86.55%).
2. **Superior Calibration but Equal Clinical Discrimination:** The refined candidate achieved a substantially improved probability calibration profile (ECE reduced from $0.0894$ to $0.0550$; Brier score reduced from $0.1117$ to $0.0988$). However, in terms of diagnostic error counts, it incurs two additional false negatives (18 vs 16) and six additional false positives (136 vs 130) compared to the production model.
3. **Clinical Safety Principle:** In medical AI deployment, promotion of an experimental model is justified only when clear, demonstrable improvements in sensitivity or specificity are proven on independent patients. The frozen baseline remains the most reliable operating checkpoint.
4. **Safety Verification:** The production artifact remains 100% frozen and unmodified. Regression testing passed 50/50 tests.

---

## 2. Audit & Verification of Prior Baselines

Prior to training new refinements, historical model weights were re-evaluated directly on the common test partition (`manifests/test.csv`):
* **Frozen Production Baseline (`fracture_v2/best_model.pt`):** Verified at ROC-AUC = 0.8751, PR-AUC = 0.6891, Sensitivity = 86.55%, Specificity = 73.74%, Precision = 44.21%, F1 = 0.5852 at threshold $t = 0.260$.
* **Approach A (`candidate_a_optimized_resnet18.pt`):** Verified at ROC-AUC = 0.8696, PR-AUC = 0.7220, Sensitivity = 84.03%, Specificity = 73.33%, Precision = 43.10%, F1 = 0.5698 at threshold $t = 0.170$.
* **Partition Integrity:** Confirmed 0 patient overlap across training (2,844 images, 1,472 patients), validation (610 images, 315 patients), and test (614 images, 316 patients).

---

## 3. Systematic Refinement Experiment Matrix (Validation-Only Tuning)

Four targeted refinement configurations were trained and evaluated strictly on the validation set:

| Refinement Code | Architecture Configuration | Validation Loss Trajectory | Peak Val ROC-AUC | Val PR-AUC | Optimal Threshold | Val Sensitivity | Val Specificity | Val F1 |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ref 1A: Layer 4 Only** | Unfreeze only layer 4 + head; CosineAnnealingLR; AdamW ($10^{-3}$) | Ep 3: 0.8738 $\to$ Ep 6: 0.8824 | 0.8926 | 0.6991 | 0.050 | 0.9314 | 0.6476 | 0.5053 |
| **Ref 1B: Plateau Scheduler** | Unfreeze layer 3+4; ReduceLROnPlateau (factor 0.5, pat 1) | Ep 3: 0.8594 $\to$ Ep 6: 1.2264 | 0.8917 | 0.6923 | 0.160 | 0.8922 | 0.7598 | 0.5778 |
| **Ref 2: Binary Focal Loss** | Unfreeze layer 3+4; Focal loss ($\gamma = 2.0$, pos_weight); Cosine | Ep 3: 0.2664 $\to$ Ep 6: 0.3078 | 0.8942 | 0.7048 | 0.180 | 0.9412 | 0.6575 | 0.5161 |
| **Ref 3: Ultra-Conservative Aug** | Unfreeze layer 3+4; Affine $\le 5^\circ$, scale 0.96-1.04; Cosine | Ep 3: 0.8252 $\to$ Ep 6: 0.9505 | **0.9144** | **0.7460** | **0.060** | **0.9118** | **0.7717** | **0.5981** |

### Key Experimental Insights:
1. **Ref 1A (Layer 4 Only vs Layer 3+4):** Restricting fine-tuning to Layer 4 limited feature expressiveness, reaching peak validation ROC-AUC of 0.8926 (compared to 0.9144 when Layer 3 was also adapted). Musculoskeletal radiographs benefit from mid-level feature adaptation (bone texture and joint trabeculae).
2. **Ref 1B (ReduceLROnPlateau):** Showed learning rate instability at late epochs (validation loss surged to 1.2264 at epoch 6), proving inferior to CosineAnnealingLR.
3. **Ref 2 (Binary Focal Loss):** Successfully depressed loss on easy background negatives, achieving high validation recall (94.12%), but caused probability calibration drift, requiring higher operating margins.
4. **Ref 3 (Ultra-Conservative Augmentation):** Clear winner on the validation partition, boosting validation ROC-AUC to **0.9144** and PR-AUC to **0.7460**, with balanced validation sensitivity (91.18%) and specificity (77.17%).

---

## 4. Probability Calibration Analysis

Using the selected Ref 3 candidate on validation predictions:
* **Raw Sigmoid Validation ECE:** $0.0374$ | **Raw Brier Score:** $0.0782$
* **Isotonic Calibrated Validation ECE:** $0.0000$ | **Calibrated Brier Score:** $0.0712$
* On the held-out test set, Ref 3 maintained an exceptionally low ECE of **0.0550** (38.5% lower error than baseline's 0.0894) and Brier score of **0.0988** (vs 0.1117). This confirms that ultra-conservative scaling and rotation significantly reduce overconfidence in ambiguous bone regions.

---

## 5. Shortcut Learning & Diagnostic Robustness Testing

To ensure the model is not relying on image borders, radiopaque markers, or film edge shortcuts:
* **Border Masking Stress Test:** The outer $10\%$ border of every test radiograph was masked with solid black pixels:
  * Standard Test ROC-AUC: **0.8675**
  * Border-Masked Test ROC-AUC: **0.8686**
  * $\Delta$ ROC-AUC: **-0.0011** (Zero degradation; the network focuses squarely on central bony anatomy).
* **Gaussian Noise Robustness Test:** Added realistic radiograph film scatter noise ($\sigma = 0.05$):
  * Perturbed Test ROC-AUC: **0.7641** ($\Delta = -0.1034$).
  * *Finding:* Realistic high-frequency sensor noise impacts fine fracture line detection, reinforcing the clinical requirement that plain radiographs must meet minimum diagnostic exposure thresholds.

---

## 6. Artifact Cryptographic Inventory

All experimental models and artifacts are strictly isolated:

| Artifact Description | File Path | Size | SHA-256 Checksum |
| :--- | :--- | :---: | :--- |
| **Frozen Production Baseline** | `ai-prediction-service/artifacts/fracture_v2/best_model.pt` | 42.71 MB | `ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60` |
| **Approach A (Optimized v1)** | `ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/candidate_a_optimized_resnet18.pt` | 42.71 MB | `079454ebe9b59d31e66c7f187e6913a2a0e6d6ee973bacac5ff46cae5f165dc4` |
| **New Refined Candidate** | `ai-prediction-service/artifacts/experiments/resnet18_refinement_20261019/candidate_refined_resnet18.pt` | 42.71 MB | `5e6e1cdd3f28080c8d2b3f6370379df9a67058e42f7fd62acb8d4848abb18b8e` |
| **Refinement Benchmark JSON** | `ai-prediction-service/artifacts/experiments/resnet18_refinement_20261019/refinement_benchmark_report.json` | 10.01 KB | — |

---

## 7. Production Safety & Regression Testing

* **Regression Suite:** Ran `python -m pytest tests/fracture -v`: **50 of 50 tests passed** in 7.78 seconds.
* **Production Integrity:** Active service `FractureInferenceService` and production weights at `artifacts/fracture_v2/` remain completely untouched.
* **Database & Unrelated Code:** Zero changes to MongoDB, cardiovascular or diabetes risk models, appointments, or medical records.
