# Experiment 7 — Phase 1: Multi-View Pediatric Fracture Architecture & Dataset Preparation Report

**Date:** 2026-10-06  
**Status:** COMPLETE — READY FOR PHASE 2 TRAINING (Awaiting Authorization)  
**Branch:** `experiment7-multiview-fracture`  
**Primary Dataset:** GRAZPEDWRI-DX (Paired Patient Cohort)  
**External Benchmark:** PediURF (Shenzhen Children's Hospital)  
**Primary Architecture:** Shared-Backbone Dual-Branch ResNet-18 with Feature Concatenation Head

---

## 1. Executive Summary

Phase 1 of Experiment 7 successfully establishes the end-to-end dataset infrastructure, pairing manifests, leak-free split validation, and architectural specification for **Experiment 7A: Shared-Backbone Dual-View ResNet-18**.

Following the clinical findings of Experiment 6 (where paired orthogonal views provided an **+11.02 percentage point sensitivity gain** over AP alone and rescued **116 AP-occult fractures**), this phase creates a clean, rigorously audited framework to transition from heuristic non-learned max-pooling to **learned cross-view representation modeling**.

---

## 2. Checkpoint & Invariance Audit

| Checkpoint | File Path | Expected MD5 | Measured MD5 | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Experiment 5 Checkpoint** | `artifacts/fracture_v2/experiment5_localization/best_model.pt` | `ece51c07eaab354f25f53f99b104dc03` | `ece51c07eaab354f25f53f99b104dc03` | **VERIFIED FROZEN** |
| **Production Checkpoint** | `artifacts/fracture/best_model.pt` | `99f0f5bcea645f714fe4e8fefbb7e6cb` | `99f0f5bcea645f714fe4e8fefbb7e6cb` | **VERIFIED UNTOUCHED** |
| **Production Threshold** | — | 0.18 | 0.18 | **UNTOUCHED** |
| **Experiment 5 Threshold** | — | 0.17 | 0.17 | **FROZEN** |

---

## 3. Dataset Pairing & Patient Leakage Audit

### 3.1 GRAZPEDWRI-DX Multi-View Cohort
- **Train Set:** 1620 paired studies (985 unique patients)
- **Validation Set:** 348 paired studies (215 unique patients)
- **Test Set:** 350 paired studies (206 unique patients)
- **Patient Leakage:** **0.0% (Zero patient overlap across all 3 splits)**
- **Image Filestem Duplicates:** **0.0% (Zero image overlap across splits)**

### 3.2 External PediURF Cohort
- **Official Held-Out Test Set:** 1053 paired studies (2,106 radiographs)
- **Full External Benchmark:** 5265 paired studies (10,530 radiographs)
- **Pairing Completeness:** 100.0% paired AP (`front.jpg`) + Lateral (`side.jpg`)

---

## 4. Multi-View Information Value Analysis & Hypothesis

### Empirical Motivation from Experiment 6:
- AP View Alone Sensitivity: **83.57%**
- Lateral View Alone Sensitivity: **81.39%**
- Heuristic Max Fusion: **94.59%**
- Lateral-Only Rescue Cases: **116 studies (11.02% of cohort)**
- Dual-View Bilateral Concordance: **70.37%**

### Scientific Hypothesis for Experiment 7:
> *"A shared-backbone dual-branch neural network trained jointly on orthogonal AP and Lateral radiographs will learn complementary spatial and cortical edge correlations, outperforming independent single-view classifiers and heuristic max fusion while maintaining high pediatric specificity."*

---

## 5. Three Model Baselines for Benchmarking

1. **Baseline A (AP Only):** Evaluates fracture probability strictly from the coronal AP radiograph.
2. **Baseline B (Lateral Only):** Evaluates fracture probability strictly from the sagittal Lateral radiograph.
3. **Baseline C (Heuristic Max Fusion — Exp 6 Reference):** Computes $P(\text{Study}) = \max(P(\text{AP}), P(\text{LAT}))$ with frozen threshold $0.17$.

---

## 6. Preprocessing & Augmentation Protocol

1. **Spatial Normalization:** Resizing to $512 \times 512$ with letterboxed zero-padding to strictly preserve radiographic aspect ratio and cortical morphology.
2. **Intensity Scaling:** Standard ImageNet channel normalization.
3. **Clinical Augmentation Constraints:** Synchronous gentle horizontal flips ($p=0.5$), subtle rotations ($\pm 10^\circ$), translation ($\pm 5\%$), and contrast scaling ($\pm 10\%$). Aggressive vertical flips, warping, and heavy blurs are strictly banned.

---

## 7. Artifact Manifest

All 13 required Phase 1 artifacts are saved under:
[`ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/`](file:///d:/projects/MediMind/ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/)

1. `experiment7_dataset_manifest.md`
2. `experiment7_train_pairs.csv`
3. `experiment7_val_pairs.csv`
4. `experiment7_test_pairs.csv`
5. `pediurf_test_pairs.csv`
6. `pediurf_full_pairs.csv`
7. `experiment7_dataset_statistics.json`
8. `experiment7_leakage_audit.json`
9. `experiment7_external_overlap_audit.json`
10. `experiment7_view_analysis.json`
11. `experiment7_architecture_spec.md`
12. `experiment7_success_criteria.json`
13. `phase1_pretraining_readiness_report.md`

---

## 8. Readiness Verdict

**PHASE 1 STATUS: 100% COMPLETE & VERIFIED**  
**RECOMMENDATION: GO FOR PHASE 2 (MULTI-VIEW MODEL TRAINING)**  
*Execution stopped for user authorization before initiating model training.*
