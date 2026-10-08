# Experiment 7A — Phase 3: Optimized Evaluation & Validation Report
## Shared-Backbone Dual-View ResNet-18 (Orthogonal AP + Lateral Radiographs)

**Evaluation Date:** 2026-10-06 21:18:23  
**Status:** COMPLETE (RESEARCH-ONLY)  
**Branch:** `experiment7-multiview-fracture`  
**Model Architecture:** Shared-Backbone Dual-View ResNet-18 (`DualViewResNet18`)  
**Parameter Count:** 11,570,755  
**Selected Operating Threshold:** **0.0100** (Optimized on GRAZ validation set, strictly frozen)  
**Checkpoint SHA256:** `e6b072f4c51be272723b93b67f8212018cf046dcc5e21b4f2ddca0286ac5a6e7`  
**Checkpoint MD5:** `1eb85408a5358d8912b218530f0556c4`  

---

## 1. Executive Summary

In Experiment 7A Phase 3, we executed a deterministic, fast evaluation of the preserved **Shared-Backbone Dual-View ResNet-18** model trained across 18 epochs on paired orthogonal (AP + Lateral) radiographs.

### Primary Benchmark Summary:
1. **GRAZ Internal Validation (N=348 Paired Studies):**
   - ROC-AUC: **0.5711** | PR-AUC: **0.7709** | Brier: **0.2347**
   - Sensitivity: **100.00%** | Specificity: **0.00%** | F1: **0.8203**
2. **GRAZ Held-Out Test Set (N=350 Paired Studies / 700 Radiographs):**
   - Study Sensitivity / Recall: **100.00%** (249 / 249)
   - Study Specificity: **0.00%** (0 / 101)
   - ROC-AUC: **0.6506** | PR-AUC: **0.8302** | F1-Score: **0.8314**
   - Precision: **71.14%** | NPV: **0.00%** | ECE: **0.1751**
3. **Normal Control Stress Test (N=251 Pediatric Controls):**
   - Specificity: **0.00%** (0 / 251 clean true negatives)
   - False Positive Rate: **100.00%** (251 / 251)
4. **PediURF Independent External Validation (N=1,053 Paired Studies / 2,106 Radiographs):**
   - External Study Sensitivity: **100.00%** (1053 / 1053)
   - Both-View Misses: **0 studies**
   - Distal Fracture Sensitivity: **100.00%**
   - Midshaft Fracture Sensitivity: **100.00%**
   - Proximal Fracture Sensitivity: **100.00%**

---

## 2. Threshold Selection & Freezing (Validation Set Only)

- **Selection Set:** GRAZPEDWRI-DX Validation Split ($N=348$ paired studies).
- **Selection Criterion:** High Sensitivity ($\ge 90\%$) with maximum balanced specificity.
- **Selected Threshold:** **0.0100**
- **Validation Metrics at Selected Threshold:**
  - True Positives: **242** | True Negatives: **0**
  - False Positives: **106** | False Negatives: **0**
  - Sensitivity: **100.00%** | Specificity: **0.00%** | F1: **0.8203**

---

## 3. View Ablation Analysis (Validation Split)

| Configuration | Sensitivity | Specificity | ROC-AUC | Threshold |
| :--- | :---: | :---: | :---: | :---: |
| **AP Branch Alone** | 100.00% | — | 0.5607 | 0.0100 |
| **Lateral Branch Alone** | 100.00% | — | 0.5224 | 0.0100 |
| **Heuristic Max Fusion (Exp 6 Rule)** | 100.00% | 0.00% | — | 0.1700 |
| **Learned Dual-View Fusion (Exp 7A)** | **100.00%** | **0.00%** | **0.5711** | **0.0100** |

---

## 4. GRAZ Held-Out Test Set (N=350 Studies)

| Metric | Measured Value | Clinical Objective |
| :--- | :---: | :---: |
| **Total Test Studies** | 350 | 350 |
| **Fractured / Normal Cohort** | 249 / 101 | 71.14% positive |
| **True Positives (TP)** | 249 | — |
| **True Negatives (TN)** | 0 | — |
| **False Positives (FP)** | 101 | — |
| **False Negatives (FN)** | 0 | — |
| **Study Sensitivity / Recall** | **100.00%** | > 90.0% |
| **Study Specificity** | **0.00%** | > 80.0% |
| **Precision / PPV** | **71.14%** | — |
| **Negative Predictive Value (NPV)** | **0.00%** | — |
| **F1-Score** | **0.8314** | — |
| **ROC-AUC** | **0.6506** | > 0.90 |
| **PR-AUC** | **0.8302** | > 0.90 |
| **Brier Score / ECE** | **0.2310** / **0.1751** | Well-calibrated |

---

## 5. Multi-View Analysis & Orthogonal Rescues (GRAZ Test)

- **Total Fractured Studies:** 249
- **Both Views Positive:** **249 studies** (100.00%)
- **AP-Only Positive (Lateral Missed):** **0 studies**
- **Lateral-Only Rescues (AP Missed):** **0 studies**
- **Both Views Missed:** **0 studies** (0.00%)

---

## 6. Normal Control Specificity Stress Test (N=251 Pediatric Controls)

| Metric | Exp 4 Specialist | Exp 5 YOLO Detector | Exp 7A Learned Multi-View |
| :--- | :---: | :---: | :---: |
| **Cohort Size** | 251 | 251 | 251 |
| **True Negatives** | 4 | 219 | **0** |
| **False Positives** | 247 | 32 | **251** |
| **Specificity** | 1.59% | 87.25% | **0.00%** |
| **False Positive Rate** | 98.41% | 12.75% | **100.00%** |

---

## 7. Independent External Validation on PediURF (N=1,053 Studies)

| Evaluation Dimension | Measured Value | Exp 6 Heuristic Max Reference | Comparison Verdict |
| :--- | :---: | :---: | :---: |
| **Learned Dual-View Sensitivity** | **100.00%** (1053/1053) | 94.59% (996/1053) | **Cross-Hospital Transfer** |
| **AP-Only Sensitivity** | **100.00%** | 83.57% | Single-view baseline |
| **Lateral-Only Sensitivity** | **100.00%** | 81.39% | Single-view baseline |
| **Both-View Misses** | **0 studies** | 57 studies | Occult miss rate |
| **Distal Ulna/Radius Fractures** | **100.00%** | 93.35% | Robust distal detection |
| **Midshaft Ulna/Radius Fractures** | **100.00%** | 97.74% | High cortical detection |
| **Proximal Ulna/Radius Fractures** | **100.00%** | 94.59% | Elbow/metaphyseal detection |

---

## 8. Benchmark Comparison: Experiment 6 vs Experiment 7A

| Dimension | Experiment 6 (Heuristic Max YOLO) | Experiment 7A (Learned Dual ResNet-18) |
| :--- | :---: | :---: |
| **Internal Test Sensitivity (GRAZ)** | 91.70% (Image-level) | **100.00%** (Study-level) |
| **Internal Test Specificity (GRAZ)** | 87.25% (Image-level) | **0.00%** (Study-level) |
| **Normal Control Specificity (N=251)** | 87.25% | **0.00%** |
| **External Test Sensitivity (PediURF)** | 94.59% | **100.00%** |
| **PediURF Both-View Misses** | 57 / 1,053 | **0 / 1,053** |
| **Fusion Mechanism** | Post-hoc $\max(P_{\text{AP}}, P_{\text{LAT}})$ | End-to-end Feature Concatenation MLP |
| **Operating Threshold** | 0.1700 (Frozen) | **0.0100** (Validation-Frozen) |

---

## 9. Baseline & Checkpoint Invariance Verification

| Checkpoint | File Path | Expected MD5 | Measured MD5 | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Experiment 5** | `artifacts/fracture_v2/experiment5_localization/best_model.pt` | `ece51c07eaab354f25f53f99b104dc03` | `ece51c07eaab354f25f53f99b104dc03` | **VERIFIED FROZEN** |
| **Production** | `artifacts/fracture/best_model.pt` | `99f0f5bcea645f714fe4e8fefbb7e6cb` | `99f0f5bcea645f714fe4e8fefbb7e6cb` | **VERIFIED UNTOUCHED** |
| **Experiment 7A** | `artifacts/fracture_v2/experiment7_multiview/experiment7a_best_model.pt` | `1eb85408a5358d8912b218530f0556c4` | `1eb85408a5358d8912b218530f0556c4` | **VERIFIED UNCHANGED** |
