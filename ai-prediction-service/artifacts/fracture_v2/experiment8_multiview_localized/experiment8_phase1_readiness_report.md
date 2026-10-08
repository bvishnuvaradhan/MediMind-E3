# Experiment 8 — Phase 1: Multi-View Localized Fusion Architecture & ROI Feasibility Audit Report

**Date:** 2026-10-06 21:35:33  
**Branch:** experiment8-multiview-localized-fusion  
**Status:** COMPLETE (RESEARCH-ONLY DESIGN & AUDIT)  
**Proposed Architecture:** Experiment 8A — Dual-View ROI-Aligned Fusion (DualViewROIResNet18)  
**Foundation Detector:** Frozen Experiment 5 YOLOv8n (est_model.pt, MD5: ece51c07eaab354f25f53f99b104dc03)  

---

## 1. Executive Summary & Core Motivation

In Experiment 7A, whole-image dual-view ResNet-18 classification achieved 100% sensitivity but suffered from **complete specificity collapse (0.0% specificity on N=251 normal pediatric controls)** due to global pooling aggregating normal epiphyseal growth plate signals.

In Experiment 8 Phase 1, we completed the architecture design and comprehensive ROI feasibility audit for **Experiment 8A: Dual-View ROI-Aligned Multi-View Fusion**:
1. **Decoupled Architecture:** Utilizes the frozen Experiment 5 YOLOv8n detector to locate candidate fracture ROIs, crops the regions with a 20% margin, extracts localized feature representations via a shared ResNet-18 encoder, and fuses them through a confidence-gated MLP head.
2. **Growth Plate Rejection Preserved:** The localization stage correctly rejects **87.25% of uncorrupted normal pediatric controls (N=251)** before feature extraction, eliminating the false-positive collapse of Experiment 7A.
3. **High Orthogonal Feasibility:** On GRAZ test pairs, dual-view detection achieves **90.48% localization recall at IoU >= 0.50** with high vertical co-alignment (mean vertical offset < 0.08).
4. **Deterministic Fallback Policy:** Formulated a 4-state deterministic pathway handling dual detections, AP-only detections, Lateral-only rescues, and zero-detection clean normals (P = 0.0).
5. **Zero Leakage:** Validated 0.0% patient overlap and 0.0% image hash overlap across all splits.

---

## 2. GRAZ Ground-Truth & Localization Quality Audit

| Split | Total Paired Studies | Fractured Studies | AP Ground Truth Available | Lateral Ground Truth Available | Both Views Annotated | YOLO Detection Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Train** | 1,620 | 1,122 | 1,122 (100.0%) | 1,122 (100.0%) | 1,122 (100.0%) | 94.20% |
| **Validation** | 348 | 242 | 242 (100.0%) | 242 (100.0%) | 242 (100.0%) | 93.97% |
| **Test** | 350 | 249 | 249 (100.0%) | 249 (100.0%) | 249 (100.0%) | 94.86% |

### Bounding-Box IoU Quality Metrics (Fracture Cases):
- **Mean IoU:** **0.7218** | **Median IoU:** **0.7762**
- **Localization Recall at IoU >= 0.25:** **95.28%**
- **Localization Recall at IoU >= 0.50:** **90.48%**
- **Localization Recall at IoU >= 0.75:** **57.55%**

---

## 3. PediURF External Localization Feasibility (N=1,053 Studies / 2,106 Radiographs)

| Metric | Measured Value | Clinical Significance |
| :--- | :---: | :--- |
| **Total Studies** | 1,053 | Official PediURF held-out test split |
| **AP View Detection Rate** | **83.57%** (880/1053) | Consistent with single-view AP sensitivity |
| **Lateral View Detection Rate** | **81.39%** (857/1053) | Consistent with single-view Lat sensitivity |
| **Both Views Detected Rate** | **70.37%** (741/1053) | Robust cross-projection localization |
| **Neither View Detected (Zero Detection)** | **5.41%** (57/1053) | Occult miss candidate rate |
| **Mean ROI Area (% of Radiograph)** | **0.92%** | Localizes focal abnormality, suppresses 99%+ irrelevant background |

---

## 4. Normal-Control Specificity Stress Test Audit (N=251 Controls)

| Metric | Exp 4 ResNet Specialist | Exp 7A Global Multi-View | Exp 8 Proposed Localized Stage |
| :--- | :---: | :---: | :---: |
| **Cohort Size** | 251 | 251 | 251 |
| **True Negatives (Clean Rejection)** | 4 | 0 | **219** |
| **False Positives (False Triggers)** | 247 | 251 | **32** |
| **Pediatric Specificity** | 1.59% | 0.00% | **87.25%** |
| **Mean FP Area (% of Image)** | 100.0% (Whole image) | 100.0% (Whole image) | **9.14%** (Focal physis edge) |

---

## 5. AP / Lateral ROI Alignment Audit

- **Anatomically Aligned Pairs:** **88.89%** of dual-detected studies align within 15% vertical forearm axis.
- **Mean Vertical Offset:** **0.0738** normalized units.
- **Conclusion:** Orthogonal bounding boxes accurately capture corresponding longitudinal bone levels (e.g. distal radial metaphysis), making shared-backbone feature concatenation highly synergistic.

---

## 6. ROI Strategy Comparison Matrix

| Strategy | Description | Growth Plate FP Risk | Information Retained | Verdict |
| :--- | :--- | :---: | :---: | :---: |
| **Strategy 1: Full Image** | 512x512 uncropped image | Critical (0% Specificity) | Full context | **REJECTED (Exp 7A failure mode)** |
| **Strategy 2: Tight Box** | Exact YOLO bounding box | Very Low | Fracture line only | Suboptimal for subtle torus fractures |
| **Strategy 3: 10% Expansion** | Box expanded by 10% | Low | Periosteal margin | Feasible |
| **Strategy 4: 20% Expansion** | Box expanded by 20% + Zero Fallback | **Low (87.25% Specificity)** | **Fracture + Step-off Cortex** | **SELECTED PRIMARY STRATEGY** |
| **Strategy 5: 30% Expansion** | Box expanded by 30% | Moderate | Broad bone segment | Secondary Candidate |
| **Strategy 6: Top-K Multi-Box** | Top-K candidate boxes | Moderate | Multi-fragmentary | Complex (Future work) |

---

## 7. Computational Training Cost Estimate (Phase 2)

- **Pre-Cropped ROI Resolution:**  \times 256$ (vs  \times 512$ in Exp 7A) $\implies$ **4x reduction in spatial tensor area**.
- **Inference Speed:** ~45–55 ms per study pair on CPU.
- **Expected Epoch Duration:** **~20–25 seconds per epoch** (vs ~110 seconds in Exp 7A).
- **Total Estimated 15-Epoch Training Duration:** **~5 to 7 minutes total CPU wall time**.

---

## 8. Safety & Baseline Checkpoint Invariance

| Checkpoint | File Path | Expected MD5 | Measured MD5 | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Experiment 5** | rtifacts/fracture_v2/experiment5_localization/best_model.pt | ece51c07eaab354f25f53f99b104dc03 | ece51c07eaab354f25f53f99b104dc03 | **VERIFIED FROZEN** |
| **Production** | rtifacts/fracture/best_model.pt | 99f0f5bcea645f714fe4e8fefbb7e6cb | 99f0f5bcea645f714fe4e8fefbb7e6cb | **VERIFIED UNTOUCHED** |
| **Experiment 7A** | rtifacts/fracture_v2/experiment7_multiview/experiment7a_best_model.pt | 1eb85408a5358d8912b218530f0556c4 | 1eb85408a5358d8912b218530f0556c4 | **VERIFIED UNCHANGED** |
| **Production Threshold** | — | 0.18 | 0.18 | **UNTOUCHED** |
| **Experiment 5 Threshold**| — | 0.17 | 0.17 | **UNTOUCHED** |
| **Production Routing** | ResNet-18 MURA $\to$ FracAtlas | ResNet-18 MURA $\to$ FracAtlas | ResNet-18 MURA $\to$ FracAtlas | **ISOLATED** |

---

## 9. Phase 1 Readiness Verdict: **GO FOR PHASE 2 TRAINING AUTHORIZATION**

All 16 required artifacts, dataset manifests, spatial alignment audits, and architectural specifications are finalized. The pipeline is ready for authorized training in Phase 2.
