# Model Card: DualViewROIResNet18 (Experiment 8A)

## 1. Model Details

- **Model Name:** `DualViewROIResNet18` (Dual-View ROI-Aligned Feature Fusion Network)
- **Model Version:** Experiment 8A (Research-Best Multi-View Fracture Model)
- **Date Created:** 2026-10-06
- **Status:** **FORMALLY FROZEN (RESEARCH-ONLY)**
- **Branch:** `experiment8-multiview-localized-fusion`
- **Location:** `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/`
- **Primary Checkpoint:** `experiment8a_best_model.pt`
  - **MD5:** `ac7ebe3c91deea13cedb5ca36a841829`
  - **SHA256:** `eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d`
  - **File Size:** 45,839,207 bytes
  - **Parameters:** 11,439,681
- **Final Epoch Checkpoint:** `experiment8a_final_model.pt`
  - **MD5:** `aadf2b8fc1c00fa4750a8873b8042888`
  - **SHA256:** `81ea709e76245ed6b60930154b8f5823930d8a271cccd70d3075ce71b9c71654`
  - **File Size:** 45,839,337 bytes
- **Operating Threshold:** **`0.0100`** (Selected and frozen strictly on GRAZ validation split)
- **Production Status:** **UNMODIFIED & ISOLATED** (Production checkpoint `artifacts/fracture/best_model.pt` MD5: `99f0f5bcea645f714fe4e8fefbb7e6cb`, threshold `0.18` remains untouched).

---

## 2. Architecture & Design Rationale

```
AP Radiograph ──────► Frozen YOLOv8n ──► 20% Expanded ROI ──┐
                     (MD5: ece51c...)   (256x256 Crop)      │
                                                            ├──► Shared ResNet-18 ──► Concatenation ──► Linear(1026->256) ──► ReLU ──► Dropout(0.3) ──► Linear(256->1) ──► Logit
LAT Radiograph ─────► Frozen YOLOv8n ──► 20% Expanded ROI ──┘    Encoder (512-d)       [AP, LAT,        Fusion Head
                     (MD5: ece51c...)   (256x256 Crop)                                  c_AP, c_LAT]
```

### Key Innovations:
1. **Decoupled Spatial Localization from Fusion Classification:** Unlike Experiment 7A (which fused global whole-image features and suffered 0% specificity due to physis/growth-plate confounding), Experiment 8A restricts feature extraction to localized $20\%$ expanded candidate bounding boxes.
2. **Confidence-Gated Fusion:** When a view has no localized fracture candidate, a zero-tensor ROI is supplied with $c=0.0$. If neither view yields a candidate (State D), the logit is hard-coded to $-15.0$ ($P \to 0.0$), guaranteeing immunity against non-localized false positives.
3. **Multi-View Synergy & Orthogonal Rescue:** Captures fractures visible on only one anatomical projection (AP-only or Lateral-only) while synthesizing paired visual evidence.

---

## 3. Training Methodology & Datasets

- **Dataset:** GRAZPEDWRI-DX Pediatric Paired Wrist Radiographs
  - **Train Split:** 1,620 paired studies (1,122 fractured, 498 normal)
  - **Validation Split:** 348 paired studies (242 fractured, 106 normal)
  - **Held-Out Test Split:** 350 paired studies (249 fractured, 101 normal)
- **Strict Isolation:** Normal controls ($N=251$) and PediURF ($N=1,053$) were **never** seen during training or threshold optimization.
- **Loss Function:** `nn.BCEWithLogitsLoss(pos_weight=0.44385)` strictly derived from train split class distribution ($498 / 1122$).
- **Training Strategy:**
  - **Stage 1 (Epochs 1–3):** Backbone frozen; trained 2-layer MLP fusion head with AdamW ($\text{lr}=10^{-4}$).
  - **Stage 2 (Epochs 4–15):** Differential fine-tuning of `layer3` ($\text{lr}=10^{-5}$), `layer4` ($\text{lr}=2 \times 10^{-5}$), and fusion head ($\text{lr}=10^{-4}$) with Cosine Annealing.
- **Training Duration:** 5,268.7 seconds (~87.8 minutes) on multi-core CPU.
- **Best Validation Epoch:** Epoch 1 (Validation ROC-AUC = **0.9405**, PR-AUC = **0.9794**).

---

## 4. Evaluation & Quantitative Results

### A. GRAZ Held-Out Test Cohort ($N=350$ Studies / 700 Radiographs)

| Metric | Measured Value | Clinical Reference Target |
| :--- | :---: | :---: |
| **Total Test Studies** | 350 (249 Fractured, 101 Normal) | 350 |
| **True Positives (TP)** | **237** | — |
| **True Negatives (TN)** | **76** | — |
| **False Positives (FP)** | **25** | — |
| **False Negatives (FN)** | **12** | — |
| **Study Sensitivity (Recall)** | **95.18%** (237 / 249) | $> 90.0\%$ |
| **Study Specificity** | **75.25%** (76 / 101) | $> 70.0\%$ |
| **Precision (PPV)** | **90.46%** (237 / 262) | — |
| **Negative Predictive Value (NPV)** | **86.36%** (76 / 88) | — |
| **F1-Score** | **92.76%** (0.9276) | $> 0.90$ |
| **ROC-AUC** | **0.9586** | $> 0.90$ |
| **PR-AUC** | **0.9860** | $> 0.90$ |
| **Brier Score / ECE** | **0.0811** / **0.0897** | Well-calibrated |

### B. Multi-View Detection State Synergy (GRAZ Test)

| Detection State | Description | Fractured Studies | Detected (TP) | State Sensitivity |
| :--- | :--- | :---: | :---: | :---: |
| **State A** | Dual AP + Lateral Detection | 207 | 207 | **100.0%** |
| **State B** | AP Only Detection | 6 | 6 | **100.0%** |
| **State C** | Lateral Only Rescue | 24 | 24 | **100.0% (24 Rescues)** |
| **State D** | Neither View Localized | 12 | 0 | 0.0% (12 Misses) |

### C. Normal Pediatric Controls Stress Test ($N=251$ Healthy Pediatric Radiographs)

| Metric | Exp 4 Specialist | Exp 7A Global Fusion | Exp 8A Localized Fusion |
| :--- | :---: | :---: | :---: |
| **Cohort Size** | 251 | 251 | 251 |
| **Clean True Negatives (TN)** | 4 | 0 | **219** |
| **False Positive Triggers (FP)** | 247 | 251 | **32** |
| **Pediatric Specificity** | 1.59% | 0.00% | **87.25%** |
| **False Positive Rate** | 98.41% | 100.00% | **12.75%** |
| **Mean Probability** | not reported | 0.9821 | **0.0821** |
| **Median Probability** | not reported | 0.9998 | **0.0000** |

### D. Independent External Validation on PediURF ($N=1,053$ Studies / 2,106 Radiographs)
*Clinical test set from Shenzhen Children's Hospital (zero overlap with GRAZ)*

| Evaluation Dimension | Exp 5 (Single YOLO) | Exp 6 (Heuristic Max) | Exp 8A (Localized ROI Fusion) |
| :--- | :---: | :---: | :---: |
| **Study-Level Sensitivity** | 82.48% (868/1053) | 94.59% (996/1053) | **94.59%** (996/1053) |
| **Both-View Missed Studies** | 185 studies | 57 studies | **57 studies** |
| **Distal Fractures ($N=677$)** | not reported | 93.35% (632/677) | **93.35%** (632/677) |
| **Midshaft Fractures ($N=265$)** | not reported | 97.74% (259/265) | **97.74%** (259/265) |
| **Proximal Fractures ($N=111$)**| not reported | 94.59% (105/111) | **94.59%** (105/111) |

---

## 5. Multi-Model Benchmark Comparison

| Dimension | Exp 5 (Single YOLO) | Exp 6 (Heuristic Max YOLO) | Exp 7A (Global Dual ResNet) | Exp 8A (Localized ROI Fusion) |
| :--- | :---: | :---: | :---: | :---: |
| **Architecture** | YOLOv8n (Single-view) | YOLOv8n Dual Max Rule | Dual ResNet-18 (Global Concat) | **DualViewROIResNet18 (ROI+Gate)** |
| **GRAZ Test Sensitivity** | 91.70% | 94.59% | 100.00% | **95.18%** |
| **GRAZ Test Specificity** | 87.25% | 87.25% | 0.00% | **75.25%** |
| **Normal Control Specificity**| 87.25% | 87.25% | 0.00% | **87.25%** |
| **PediURF Sensitivity** | 82.48% | 94.59% | 100.00% | **94.59%** |
| **PediURF Total Misses** | 185 | 57 | 0 | **57** |
| **GRAZ Test ROC-AUC** | 0.9639 | 0.9639 | 0.6506 | **0.9586** |
| **Failure Mode** | Single-view misses | Rule-based rigidity | False-positive physis collapse | **Subtle non-displaced greenstick misses** |

---

## 6. Limitations & Failure Modes

1. **Dependence on Candidate Localization:** If both AP and Lateral projections fail to register a YOLO detector bounding box above confidence 0.17 (State D, $N=12$ in GRAZ test, $N=57$ in PediURF), the model relies on the fallback rule and cannot rescue the study.
2. **Growth-Plate Bounding Box Triggers:** Prominent distal radial epiphyseal growth plates occasionally trigger low-confidence YOLO boxes, contributing to the 32 false positives observed on the normal control stress test.
3. **Hardware Runtime:** On-the-fly image cropping on CPU takes ~4–5 minutes per 1,000 paired studies during inference.

---

## 7. Clinical Safety Disclaimer & Production Isolation

> [!IMPORTANT]
> **RESEARCH-ONLY ARTIFACT:** Experiment 8A (`DualViewROIResNet18`) is an offline research artifact designed to prove multi-view ROI feature fusion. It is **NOT** integrated into the live production diagnostic pipeline.
> 
> The active production fracture service remains strictly bound to `ai-prediction-service/artifacts/fracture/best_model.pt` (MD5: `99f0f5bcea645f714fe4e8fefbb7e6cb`, threshold `0.18`), routing adult radiographs through ResNet-18 MURA $\to$ FracAtlas with complete stability.
