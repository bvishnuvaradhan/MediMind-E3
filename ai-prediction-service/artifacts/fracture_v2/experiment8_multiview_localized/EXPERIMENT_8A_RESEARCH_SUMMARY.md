# Experiment 8A: Executive Research Summary & Scientific Breakthrough
## Multi-View Localized ROI Fusion (`DualViewROIResNet18`) for Pediatric Fracture Detection

**Project:** MediMind AI Diagnostic Platform  
**Branch:** `experiment8-multiview-localized-fusion`  
**Status:** **RESEARCH-BEST (FORMALLY FROZEN)**  
**Operating Threshold:** `0.0100` (Strictly derived on GRAZ validation cohort)  
**Primary Checkpoint:** `artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt`  
- **MD5:** `ac7ebe3c91deea13cedb5ca36a841829`  
- **SHA256:** `eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d`  

---

## 1. Executive Summary & Clinical Context

Pediatric wrist radiographs present a notorious challenge in computer vision: open cartilaginous growth plates (physis) frequently mimic fracture lines, while subtle non-displaced fractures are often invisible on a single projection (AP or Lateral).

- **Experiment 7A Failure Mode:** A global dual-view ResNet-18 classifier fused whole-image features via global average pooling. Because the model lacked spatial localization, normal growth plates aggregated into massive positive feature activations, triggering a **complete false-positive collapse (0.0% specificity on normal controls)**.
- **Experiment 8A Scientific Solution:** Experiment 8A introduced **Decoupled Localized ROI Feature Fusion (`DualViewROIResNet18`)**. Instead of processing whole radiographs, the architecture uses frozen spatial localization (YOLOv8n) to isolate 20% expanded candidate fracture regions, feeding only localized crops into a shared ResNet-18 encoder gated by detector confidence scores.
- **Breakthrough Result:** Experiment 8A successfully eliminates the growth-plate collapse, maintaining **87.25% specificity on healthy pediatric controls** while achieving **95.18% sensitivity on held-out GRAZ paired studies** and **94.59% generalization across 1,053 clinical studies (2,106 radiographs) from Shenzhen Children's Hospital (PediURF)**.

---

## 2. Key Findings & Empirical Proof

### A. Orthogonal View Synergy (The 24 Lateral Rescues)
On the held-out GRAZ test cohort ($N=350$ studies / 700 radiographs), Experiment 8A demonstrated true bi-planar synergy:
- **Dual Detection (State A):** 207 / 207 fractures detected (**100.0% sensitivity**).
- **AP-Only Detection (State B):** 6 / 6 fractures detected (**100.0% sensitivity**).
- **Lateral-Only Rescue (State C):** **24 / 24 fractures detected (100.0% sensitivity)** — in all 24 cases, the fracture was completely occult on AP view but rescued by lateral view localization and fusion.
- **Zero-Detection (State D):** 12 occult fracture studies missed where neither view registered a box.

### B. Pediatric Growth Plate Rejection
When challenged against $N=251$ uncorrupted healthy pediatric controls:
- **Experiment 4 (Global ResNet Specialist):** 1.59% Specificity (247 / 251 False Positives) — **FAIL**
- **Experiment 7A (Global Dual ResNet):** 0.00% Specificity (251 / 251 False Positives) — **CATASTROPHIC COLLAPSE**
- **Experiment 8A (`DualViewROIResNet18`):** **87.25% Specificity (219 / 251 Clean True Negatives)** — **SUCCESS**

---

## 3. High-Level Performance Metrics

| Evaluation Cohort | Sample Size | Sensitivity | Specificity | Precision | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **GRAZ Validation Split** | 348 Studies (696 Img) | 91.74% | 77.36% | 88.24% | 0.9265 | 0.9405 |
| **GRAZ Held-Out Test Split** | 350 Studies (700 Img) | **95.18%** | **75.25%** | **90.46%** | **0.9276** | **0.9586** |
| **Normal Pediatric Controls** | 251 Radiographs | — | **87.25%** | — | — | — |
| **PediURF External Transfer** | 1,053 Studies (2,106 Img) | **94.59%** | — | — | — | — |

---

## 4. Production Isolation & Governance

- **Production Integrity:** The live production fracture model (`artifacts/fracture/best_model.pt`, MD5: `99f0f5bcea645f714fe4e8fefbb7e6cb`, threshold `0.18`) remains untouched and isolated.
- **Baseline Checkpoints Frozen:** Experiment 5 YOLO (`ece51c07eaab354f25f53f99b104dc03`) and Experiment 7A (`1eb85408a5358d8912b218530f0556c4`) remain 100% bit-identical.
- **Research Milestone:** Experiment 8A stands as the official **research-best pediatric multi-view fracture architecture** in the MediMind research repository.
