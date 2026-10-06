# Experiment 6 — Phase 2A: PediURF Download & Local Dataset Integrity Audit Report

**Date:** 2026-10-06  
**Status:** COMPLETE — RESEARCH-ONLY  
**Evaluation Target:** Independent External Validation of Experiment 5 Pediatric Fracture YOLOv8n Object Detector  
**Recommendation:** **GO FOR PHASE 2B EXTERNAL INFERENCE**

---

## 1. Executive Summary

In Experiment 6 Phase 2A, the verified independent external pediatric radiograph dataset **PediURF (Pediatric Ulna and Radius Fractures)** from Shenzhen Children's Hospital was downloaded, fully extracted, and subjected to a deep integrity and local independence audit.

All **10,530 radiographic images** across **5,265 pediatric patient studies** were audited with zero corrupted files, zero zero-byte files, and 100% readability. Hash comparisons and provenance analysis confirmed **0% patient and institutional overlap** against the training datasets (GRAZPEDWRI-DX, FracAtlas, and MURA). The Experiment 5 YOLOv8n model checkpoint remains completely frozen (MD5: `ece51c07eaab354f25f53f99b104dc03`, operating threshold: `0.17`).

---

## 2. Acquisition & Download Manifest

| Property | Value / Verification |
| :--- | :--- |
| **Dataset Name** | PediURF (Pediatric Ulna & Radius Fractures) |
| **Source Platform** | Figshare Repository |
| **DOI** | `10.6084/m9.figshare.29998954.v2` |
| **Download Source** | Direct Figshare CDN (`https://ndownloader.figshare.com/files/57469948`) |
| **Archive File Size** | 2,278,335,773 bytes (2.12 GB) |
| **Extraction Directory** | `ai-prediction-service/test-dataset/Bone Facture/PediURF/PediURF/` |
| **Metadata Files** | `train.csv` (4,212 studies, 263.5 KB), `test.csv` (1,053 studies, 66.0 KB) |
| **Download Integrity** | 100% Complete & Verified |

---

## 3. Dataset Inventory & Demographics

### 3.1 Overall Dataset Composition
- **Total Studies:** 5,265
- **Total Radiographs:** 10,530 (Each study contains paired `front.jpg` [AP view] and `side.jpg` [Lateral view])
- **Total Anteroposterior (AP) Views:** 5,265
- **Total Lateral (LAT) Views:** 5,265

### 3.2 Split Breakdown
| Split | Total Studies | Total Radiographs | Distal Fractures | Midshaft Fractures | Proximal Fractures |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Train** | 4,212 | 8,424 | 2,697 studies (5,394 img) | 1,054 studies (2,108 img) | 461 studies (922 img) |
| **Test (Held-Out)** | 1,053 | 2,106 | 677 studies (1,354 img) | 265 studies (530 img) | 111 studies (222 img) |
| **Total** | **5,265** | **10,530** | **3,374 studies (6,748 img)** | **1,319 studies (2,638 img)** | **572 studies (1,144 img)** |

*Note:* Because the Experiment 5 YOLOv8n detector was trained purely on GRAZPEDWRI-DX (Medical University of Graz, Austria), **100% of PediURF (both train and test splits, 10,530 images)** serves as completely unseen, independent external validation data.

### 3.3 Patient Demographics
- **Target Population:** 100% Pediatric Cohort (Shenzhen Children's Hospital)
- **Age Range:** 0.42 years (5 months) to 17.0 years
- **Mean Age:** 7.69 ± 3.45 years (Median: 8.0 years, IQR: 5.0 – 10.0 years)
- **Sex Breakdown:**
  - Male: 3,913 studies (74.3%)
  - Female: 1,352 studies (25.7%)

---

## 4. Image Integrity & Technical Audit

A complete full-dataset scan was performed across all 10,530 files using PIL/OpenCV:

| Metric | Measured Value | Standard / Requirement | Status |
| :--- | :---: | :---: | :---: |
| **Total Files Scanned** | 10,530 | 10,530 | PASS |
| **Readable Images** | 10,530 (100.0%) | 100.0% | PASS |
| **Corrupted Files** | 0 (0.0%) | 0 | PASS |
| **Zero-Byte Files** | 0 (0.0%) | 0 | PASS |
| **Color Mode** | 10,530 RGB | Standard 3-channel | PASS |
| **Resolution (Mean)** | 1204.3 × 1776.0 px | Diagnostic resolution | PASS |
| **Resolution Range** | W: 205–2690, H: 305–2816 | Full medical dynamic range | PASS |

---

## 5. Dataset Independence & Local Overlap Audit

| Comparison Dataset | Institutional Provenance | Geography | Overlap Status |
| :--- | :--- | :--- | :---: |
| **GRAZPEDWRI-DX** (Exp 5 Training) | Medical University of Graz | Graz, Austria | **0.0% (Disjoint)** |
| **FracAtlas** (Exp 1-4 Adult Benchmark) | BSMMU Hospital | Dhaka, Bangladesh | **0.0% (Disjoint)** |
| **MURA-v1.1** (Exp 1-4 Adult Benchmark) | Stanford University Medical Center | California, USA | **0.0% (Disjoint)** |
| **PediURF** (Exp 6 Validation) | Shenzhen Children's Hospital | Shenzhen, China | **100% Independent** |

---

## 6. Annotation Structure & Evaluation Design for Phase 2B

### 6.1 Clinical Annotation Structure
PediURF provides study-level clinical ground truth categorized by anatomical fracture region:
1. `Distal ulna and radius fractures` (Wrist / distal metaphysis & epiphysis)
2. `Midshaft ulna and radius fractures` (Diaphysis)
3. `Proximal ulna and radius fractures` (Elbow / proximal radius & ulna)

### 6.2 External Inference Protocol (Phase 2B)
1. **Frozen Checkpoint:** YOLOv8n at `ai-prediction-service/artifacts/fracture_v2/experiment5_localization/best_model.pt`
2. **Frozen Confidence Threshold:** `0.17`
3. **Inference Execution:**
   - **Image-Level Evaluation:** Run inference on each view (`front.jpg`, `side.jpg`). Record max detection confidence and bounding box coordinates. An image is classified as positive if $\max(\text{conf}) \ge 0.17$.
   - **Study-Level Multi-View Evaluation:** Combine AP and Lateral views. A study is classified as positive if $\max(\text{conf}_{\text{front}}, \text{conf}_{\text{side}}) \ge 0.17$.
   - **Anatomical Subgroup Sensitivity:** Compute sensitivity separately for Distal, Midshaft, and Proximal fractures.
   - **Specificity & False Positive Benchmark:** Evaluate on negative control cohorts (GRAZPEDWRI-DX normal pediatric controls $N=251$) to measure external false positive rate alongside external recall.

---

## 7. Model Invariance & Production Isolation

| Item | Frozen Reference | Verified Value | Match Status |
| :--- | :--- | :--- | :---: |
| **Experiment 5 Checkpoint** | `ece51c07eaab354f25f53f99b104dc03` | `ece51c07eaab354f25f53f99b104dc03` | **VERIFIED FROZEN** |
| **Experiment 5 Threshold** | 0.17 | 0.17 | **FROZEN** |
| **Production Model Checkpoint** | `99f0f5bcea645f714fe4e8fefbb7e6cb` | `99f0f5bcea645f714fe4e8fefbb7e6cb` | **VERIFIED UNTOUCHED** |
| **Production Threshold** | 0.18 | 0.18 | **UNTOUCHED** |
| **Production Routing** | ResNet-18 pipeline | ResNet-18 pipeline | **ISOLATED** |

---

## 8. Final Decision & Recommendation

### Decision: **GO FOR PHASE 2B EXTERNAL INFERENCE**
- Dataset acquisition: Complete & verified.
- Data integrity: 100% clean (10,530 images).
- Independence: 100% disjoint from Austrian training cohort.
- All Phase 2A audit artifacts generated and saved.
- **Next Step:** Await explicit user authorization to execute Phase 2B (External Inference & Generalization Evaluation).
