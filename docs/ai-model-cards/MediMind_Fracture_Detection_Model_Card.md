# MediMind AI Model Card — Fracture Detection CNN

**Document ID:** `MC-AI-FRAC-2026-V1`  
**Model Name:** `fracture_detection_resnet18` (Production Baseline) & `DualViewROIResNet18` (Research Candidate)  
**Evaluation Scope:** Binary Musculoskeletal Plain Radiograph Fracture Classification & Pediatric Triage  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Last Verified Date:** November 6, 2026  

---

## Section A — Model Identification

| Property | Production Baseline | Research Candidate (Experiment 8A) |
| :--- | :--- | :--- |
| **Model Name** | `fracture_detection_resnet18` | `DualViewROIResNet18` |
| **MediMind Module** | Musculoskeletal Trauma Screening | Acute Pediatric Fracture Triage Research |
| **Model Version** | `0.1.0` | `Experiment 8A (Frozen Research Best)` |
| **Primary Checkpoint File** | `artifacts/fracture/best_model.pt` | `artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt` |
| **Checkpoint File Size** | 44,788,427 bytes (42.71 MB) | 45,839,207 bytes (43.72 MB) |
| **Cryptographic Hash (MD5)** | `99f0f5bcea645f714fe4e8fefbb7e6cb` | `ac7ebe3c91deea13cedb5ca36a841829` |
| **Cryptographic Hash (SHA-256)**| `abe8bc708a44cbe924f448df3654f1f0bfd5964f81b979fae61b446e873583b9` | `eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d` |
| **Secondary Checkpoint** | N/A (Single deployment artifact) | `experiment8a_final_model.pt` (45,839,337 bytes, MD5 `aadf2b8fc1c00fa4750a8873b8042888`) |
| **Model Type** | Deep Convolutional Neural Network (Single-view) | Dual-Stream Localized Fusion Network (Multi-view + ROI) |
| **Primary Task** | Binary Fracture Classification (`possibleFracture`) | Dual-View Fracture Classification + Growth Plate Disambiguation |
| **Development Component** | `ai-prediction-service/app/models/fracture/` | `ai-prediction-service/app/models/fracture_v2/` |
| **Current Operational Status** | **Production Baseline (Active Serving)** | **Research Only (Formally Frozen)** |

---

## Section B — Intended Use

### 1. Primary Intended Purpose
The MediMind Fracture Detection module is designed as an automated **clinical decision-support and triage tool**. Its primary objective is to evaluate plain musculoskeletal radiographs (X-rays) at the point of clinical intake, producing an estimated fracture probability score, a categorical risk badge (`HIGH`, `MEDIUM`, `LOW`), and alerting clinicians to potential traumatic cortical disruptions.

### 2. Intended Users
- **Emergency Department Clinicians & Medical Officers:** Triage prioritization for suspected acute fractures awaiting formal radiological review.
- **Attending Orthopedic Surgeons & Radiologists:** Secondary verification and anatomical review queue screening.
- **Outpatient Triage Nurses:** Early categorization of emergency severity during initial patient intake.

### 3. Intended Input & Modality
- **Modality:** Digital musculoskeletal plain radiographs (X-rays) formatted as PNG, JPEG, or DICOM preambles.
- **Anatomical Scope (Production Baseline):** Adult peripheral extremity radiographs (Hand, Wrist, Arm, Leg, Ankle, Hip, Shoulder).
- **Anatomical Scope (Research Candidate Exp 8A):** Paired bilateral pediatric wrist radiographs (Anteroposterior [AP] and Lateral projections).

### 4. Expected Output & Contract
- **Continuous Probability:** Float in $[0.0, 1.0]$ representing predicted fracture probability.
- **Binary Decision Flag:** `possibleFracture: true/false` determined by comparing predicted probability against the calibrated operating threshold.
- **Risk Classification:** Discrete categorical urgency band (`HIGH`, `MEDIUM`, `LOW`).
- **Clinical Disclaimer:** Mandatory non-diagnostic legal warning accompanying every inference response:
  > *"AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional."*

### 5. Out-of-Scope & Prohibited Use Cases
- **Not a Standalone Diagnostic Device:** The model must never be used autonomously to discharge patients or establish a definitive orthopedic diagnosis without physician oversight.
- **Non-Plain Radiographic Modalities:** Not validated for Computed Tomography (CT), Magnetic Resonance Imaging (MRI), Bone Scintigraphy, or Ultrasound.
- **Specialized Axial Skeletal Trauma:** Not trained or validated on skull, facial bone, cervical/thoracic/lumbar spinal column, or complex pelvic ring disruptions.

---

## Section C — Dataset Documentation

```
[Dataset Provenance & Progression]
Pretraining: Stanford MURA v1.1 (2,869 Adult Upper Extremity Radiographs)
     │
     ▼
Production Baseline: FracAtlas (4,083 Mixed Musculoskeletal Radiographs)
     │
     ▼
Research Candidate: GRAZPEDWRI-DX (2,318 Paired Pediatric Wrist Studies)
     │
     ├── Stress Testing: Normal Controls Cohort (251 Open Growth Plate Radiographs)
     └── External Validation: Shenzhen Children's Hospital PediURF (1,053 Paired Studies)
```

### 1. Stanford MURA v1.1 (Representation Pretraining)
- **Source:** Stanford University Machine Learning Group musculoskeletal radiograph database (Bone Fracture / Upper Extremity).
- **Volume Utilized:** 2,869 radiographic studies selected for musculoskeletal abnormality pretraining.
- **Task:** Transfer learning backbone initialization to overcome ImageNet photographic domain bias.

### 2. FracAtlas (Production Baseline Training Cohort)
- **Source:** Multi-hospital academic radiograph repository released under CC BY 4.0.
- **Total Dataset Size:** 4,083 plain radiographic images.
- **Target Distribution:** Binary classification—Fractured vs. Non-Fractured bone structures.
- **Partitioning Strategy:**
  - **Train Fold ($N=1,200$):** Model parameter optimization with positive class weighting ($\text{pos\_weight} = 1.8571$).
  - **Validation Fold ($N=612$):** Hyperparameter tuning and decision threshold calibration.
  - **Held-Out Test Fold ($N=613$):** Isolated evaluation cohort (107 fracture-positive, 506 non-fracture controls).

### 3. GRAZPEDWRI-DX (Research Candidate Exp 8A Cohort)
- **Source:** Graz University Hospital Pediatric Radiographic Database.
- **Cohort Volume:** 2,318 paired bilateral wrist studies (totaling 4,636 individual AP and Lateral radiographs) from pediatric patients aged 0 to 18 years.
- **Partitioning Strategy:** Patient-level isolation strictly enforced to prevent multi-view cross-split contamination:
  - **Training Split:** 1,620 paired studies (1,122 fracture-positive, 498 normal controls).
  - **Validation Split:** 348 paired studies (242 fracture-positive, 106 normal controls).
  - **Held-Out Test Split:** 350 paired studies (249 fracture-positive, 101 normal controls).

### 4. Pediatric Normal Controls Stress Cohort
- **Cohort Size:** 251 uncorrupted pediatric wrist radiographs containing completely open, physiologically normal epiphyseal growth plates (physis cartilaginous bands).
- **Purpose:** Rigorous stress-testing of false-positive alarms to audit model resilience against developmental mimics.

### 5. Shenzhen Children's Hospital PediURF (External Multi-Center Benchmark)
- **Source:** Shenzhen Children's Hospital Pediatric Wrist Fracture Benchmark.
- **Cohort Volume:** 1,053 paired trauma studies (2,106 individual radiographs) independently acquired on different digital X-ray hardware.
- **Cohort Characteristic:** 100% fracture-positive trauma admissions across three anatomical subgroups:
  - Distal Radius/Ulna: 677 studies ($64.29\%$)
  - Midshaft Radius/Ulna: 265 studies ($25.17\%$)
  - Proximal Radius/Ulna: 111 studies ($10.54\%$)
  - Sum: $677 + 265 + 111 = 1,053$ studies.

---

## Section D — Data Preprocessing

### 1. Production Baseline Preprocessing Pipeline
Implemented in `ai-prediction-service/app/models/fracture/fracture_preprocessing.py`:
- **File Integrity Validation:** Magic byte inspection verifying PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), or DICOM standard preambles.
- **Resolution Standardization:** Bilinear spatial interpolation scaling the radiographic input to $224 \times 224$ pixels.
- **Color Channel Replication:** Single-channel grayscale radiographs converted to 3-channel RGB tensors via channel broadcasting.
- **Tensor Normalization:** Standard ImageNet channel-wise normalization:
  $$\mu = [0.485, 0.456, 0.406], \quad \sigma = [0.229, 0.224, 0.225]$$

### 2. Research Candidate (Exp 8A) Localized ROI Preprocessing Pipeline
Implemented in `ai-prediction-service/app/models/fracture_v2/experiment8_multiview_localized/`:
- **Dual-Projection Ingestion:** Synchronous ingestion of orthogonal Anteroposterior (AP) and Lateral (LAT) wrist views for each clinical encounter.
- **Spatial Anatomical Localization:** Frozen YOLOv8n detector (`best_model.pt`, 24.4 MB, MD5 `ece51c07eaab354f25f53f99b104dc03`) processes the full radiograph at detection confidence $\tau_{\text{det}} = 0.1700$, generating candidate bounding box coordinates $[x, y, w, h]$.
- **Contextual ROI Cropping:** Cropping bounding boxes with an explicit **20% contextual expansion margin** to ensure complete inclusion of cortical margin disruptions.
- **Sub-Volume Resizing & Normalization:** Candidate sub-volume crops are standardized to $256 \times 256$ pixels and normalized to $[-1.0, 1.0]$.
- **Leakage Prevention:** Zero patient overlap between training, validation, test, and external validation partitions. Bounding box detectors were trained strictly on isolated partitions prior to fusion training.

---

## Section E — Model Architecture

### 1. Production Baseline Architecture (`fracture_detection_resnet18`)
- **Convolutional Backbone:** Deep Residual Network with 18 layers (ResNet-18), initialized with weights pretrained on Stanford MURA v1.1.
- **Parameter Count:** 11,176,513 parameters (~11.2 million parameters).
- **Receptive Field:** Whole-image global average pooling across $7 \times 7$ feature maps.
- **Classification Head:** Linear projection with dropout regularization:
  $$\text{Input: } 512\text{-dim feature vector} \longrightarrow \text{Dropout}(p=0.3) \longrightarrow \text{Linear}(512 \to 1) \longrightarrow \text{Logit}$$
  $$P(\text{Fracture} \mid X) = \sigma(z) = \frac{1}{1 + e^{-z}}$$

```
[Production Baseline Pipeline]
Raw X-Ray ──► Resize(224x224) ──► ResNet-18 (MURA Pretrained) ──► Global Pool ──► Dropout(0.3) ──► Linear(512->1) ──► Sigmoid ──► tau=0.1800
```

### 2. Research Candidate Architecture (`DualViewROIResNet18`)
- **Dual-Stream Localization-Gated Fusion Network:** Decouples spatial anatomical localization from diagnostic classification to eliminate epiphyseal growth plate confounding.
- **Total Parameters:** 11,439,681 parameters (~11.44 million parameters).
- **Component Breakdown:**
  1. *Spatial Detector:* Frozen YOLOv8n detector producing $[x_1, y_1, x_2, y_2]$ lesion proposals and confidence scalar $\tau_{\text{det}}$.
  2. *Twin Feature Encoders:* Shared-weight ResNet-18 backbone processing cropped $256 \times 256$ ROI volumes from the AP and Lateral views, producing two 512-dimensional latent representations ($f_{\text{AP}}, f_{\text{LAT}}$).
  3. *Late Feature Fusion Head:* Concatenates the twin latent vectors with normalized detector confidence scores:
     $$\mathbf{v}_{\text{fused}} = [f_{\text{AP}} \,\|\, f_{\text{LAT}} \,\|\, c_{\text{AP}} \,\|\, c_{\text{LAT}}] \in \mathbb{R}^{1026}$$
     $$\mathbf{h}_1 = \text{ReLU}(\mathbf{W}_1 \mathbf{v}_{\text{fused}} + \mathbf{b}_1), \quad \mathbf{W}_1 \in \mathbb{R}^{256 \times 1026}$$
     $$\mathbf{h}_2 = \text{Dropout}(\mathbf{h}_1, p=0.3)$$
     $$z = \mathbf{W}_2 \mathbf{h}_2 + b_2, \quad \mathbf{W}_2 \in \mathbb{R}^{1 \times 256}$$
     $$P(\text{Fracture} \mid X_{\text{AP}}, X_{\text{LAT}}) = \sigma(z)$$

```
[Research Candidate Exp 8A Architecture]
AP View  ──► YOLOv8n (tau=0.17) ──► Crop ROI (256x256) ──► ResNet-18 Encoder ──► 512-dim ──┐
                                                                                            ├──► Concat(1026) ──► Linear(256) ──► Dropout(0.3) ──► Linear(1) ──► tau=0.0100
LAT View ──► YOLOv8n (tau=0.17) ──► Crop ROI (256x256) ──► ResNet-18 Encoder ──► 512-dim ──┘
```

---

## Section F — Training Methodology

### 1. Production Baseline Training Protocol
- **Framework:** PyTorch `2.14.0+cpu`, torchvision `0.29.0+cpu`.
- **Pretraining Phase:** Stanford MURA v1.1 (2,869 radiographs, 2 epochs, Adam optimizer, learning rate $1 \times 10^{-4}$, binary cross-entropy loss). Achieved validation ROC-AUC of 0.7878.
- **Fine-Tuning Phase:** FracAtlas training partition ($N=1,200$, 3 epochs).
- **Loss Function:** Asymmetric Binary Cross-Entropy with positive class weighting ($\text{pos\_weight} = 1.8571$) to counteract dataset imbalance.
- **Learning Rate & Optimizer:** Adam optimizer ($\text{lr} = 5 \times 10^{-5}$, weight decay $1 \times 10^{-4}$).
- **Random Seed:** 42 (strictly seeded across Python, NumPy, and PyTorch).

### 2. Research Candidate (Exp 8A) Training Protocol
- **Framework:** PyTorch `2.1.0+cu118`, Ultralytics YOLOv8 `8.0.196`.
- **Hardware:** Isolated training workstation with NVIDIA RTX A6000 GPU (48 GB VRAM).
- **Training Epochs:** 15 epochs with early stopping monitored on validation ROC-AUC.
- **Best Model Selection:** Epoch 1 selected (`experiment8a_best_model.pt`) based on maximum validation ROC-AUC of 0.9405.
- **Loss Function:** Binary Cross-Entropy with Logits loss ($\text{BCEWithLogitsLoss}$).
- **Optimizer:** AdamW ($\text{lr} = 1 \times 10^{-4}$, weight decay $1 \times 10^{-2}$, cosine annealing scheduler).

---

## Section G — Model Evaluation

### 1. Production Baseline Evaluation (Held-Out FracAtlas Test Split, $N=613$)
Verified against `artifacts/fracture/training_report.json`:

| Evaluation Metric | Baseline ImageNet ResNet-18 ($\tau=0.35$) | MURA-Pretrained ResNet-18 ($\tau=0.18$) | Relative Improvement / Significance |
| :--- | :---: | :---: | :---: |
| **Sensitivity (Recall)** | 88.79% (95 / 107) | **96.26% (103 / 107)** | **+7.47%** (Surpasses $\ge 90\%$ clinical floor) |
| **Specificity** | 65.22% (330 / 506) | **63.64% (322 / 506)** | Controlled trade-off ($\ge 60\%$ safety floor) |
| **Precision (PPV)** | 35.06% (95 / 271) | **35.89% (103 / 287)** | Reconciled against confusion matrix |
| **Negative Predictive Value (NPV)** | 96.49% (330 / 342) | **98.77% (322 / 326)** | High rule-out assurance in triage |
| **F1-Score** | 0.5026 | **0.5228** | Harmonic mean of precision & recall |
| **ROC-AUC** | 0.9001 | **0.9244** | Global discrimination capacity |
| **PR-AUC** | 0.7467 | **0.7843** | Precision-recall tradeoff under imbalance |
| **Brier Score** | 0.1656 | **0.0896** | **45.9% reduction** in probabilistic error |
| **Expected Calibration Error (ECE)**| 0.2342 | **0.1021** | Disclosed limitation (slightly exceeds 0.100) |

**Confusion Matrix (MURA-Pretrained Baseline, $\tau=0.18$):**
- True Positives ($\text{TP}$): 103
- False Positives ($\text{FP}$): 184
- True Negatives ($\text{TN}$): 322
- False Negatives ($\text{FN}$): 4

**Anatomical Subgroup Sensitivity:**
- Hand ($N=231$, 66 fx): 96.97% recall, ROC-AUC 0.8316
- Leg ($N=340$, 39 fx): 94.87% recall, ROC-AUC 0.9724
- Hip ($N=27$, 1 fx): 100.0% recall, ROC-AUC 0.9615
- Shoulder ($N=15$, 1 fx): 100.0% recall, ROC-AUC 1.0000
- Hardware Implants ($N=16$, 16 fx): 100.0% recall (zero interference from orthopedic screws/plates)

---

### 2. Research Candidate Exp 8A Evaluation (`DualViewROIResNet18`)
Verified against `EXPERIMENT_8A_FREEZE_MANIFEST.json` and test JSON logs:

#### A. Held-Out GRAZPEDWRI-DX Test Cohort ($N=350$ Paired Studies)
- **Total Evaluated Studies:** 350 paired studies (249 fracture-positive, 101 normal controls).
- **Operating Threshold:** $\tau = 0.0100$ (frozen from validation sweep).
- **Sensitivity:** **95.18% (237 / 249)**
- **Specificity:** **75.25% (76 / 101)**
- **Precision (PPV):** **90.46% (237 / 262)**
- **Negative Predictive Value (NPV):** **86.36% (76 / 88)**
- **F1-Score:** **0.9276**
- **ROC-AUC:** **0.9586**
- **PR-AUC:** **0.9860**
- **Brier Score:** **0.0811**
- **Expected Calibration Error (ECE):** **0.0897** (Satisfies clinical target $\text{ECE} < 0.100$)

#### B. Multi-View State Synergy Distribution (GRAZ Test Cohort)
- **State A (Dual Detected):** 207 studies detected on both AP and Lateral projections ($100.0\%$ sensitivity).
- **State B (AP Only Detected):** 6 studies detected on AP view alone ($100.0\%$ sensitivity).
- **State C (Lateral Only Rescue):** **24 studies detected exclusively on Lateral view** ($100.0\%$ rescue sensitivity). In conventional single-view AP workflows, all 24 fractures would be completely missed.
- **State D (Zero Detected / Miss):** 12 subtle fractures undetected on both projections. *Empirically demonstrates that the model does not guarantee fracture capture.*

#### C. Pediatric Normal Controls Stress Cohort ($N=251$)
- **Evaluated Studies:** 251 uncorrupted pediatric radiographs with open epiphyseal growth plates.
- **Whole-Image CNN Baselines:** Collapsed to **0.00% specificity** (flagged all 251 healthy children as fractured due to growth plate confounding).
- **Experiment 8A Performance:** **87.25% specificity (219 / 251 correct normal rejections)**; 32 false positives (12.75% FPR).
- **Mean Probability:** 0.0821; **Median Probability:** 0.0000.
- *Clinical Interpretation:* Provides empirical evidence of substantially improved discrimination on the evaluated cohort, though not establishing universal clinical safety across all developmental variations.

#### D. Multi-Center External Validation (Shenzhen Children's Hospital, $N=1,053$)
- **Total Quarantined Trauma Studies:** 1,053 paired studies (2,106 radiographs).
- **Overall Study Sensitivity:** **94.59% (996 / 1,053 true positives)**; 57 false negatives.
- **Anatomical Subgroup Recall:**
  - Distal Radius/Ulna ($N=677$): **93.35% (632 / 677)**
  - Midshaft Radius/Ulna ($N=265$): **97.74% (259 / 265)**
  - Proximal Radius/Ulna ($N=111$): **94.59% (105 / 111)**

---

## Section H — Threshold and Prediction Interpretation

### 1. Operating Thresholds
- **Production Baseline (`fracture_service.py`):**
  $$\tau_{\text{prod}} = 0.1800$$
  Derived strictly on the FracAtlas validation fold to satisfy the clinical trauma screening mandate ($\text{Recall} \ge 95\%$, achieving 96.26%) while maintaining an acceptable review burden ($\text{Specificity} \ge 60\%$, achieving 63.64%).
- **Research Candidate (`DualViewROIResNet18`):**
  $$\tau_{\text{exp8a}} = 0.0100$$
  Derived strictly on the GRAZ validation fold ($N=348$ paired studies) under an asymmetric clinical loss framework ($C_{\text{FN}} \gg C_{\text{FP}}$) to enforce pediatric trauma sensitivity floor $\ge 90\%$ (achieving 91.74% validation sensitivity and 95.18% test sensitivity).

### 2. Clinical Risk Categorization
In the production API gateway response, continuous probabilities are mapped to discrete risk categories:
- **High Risk ($P \ge 0.50$):** High probability of acute cortical disruption; flagged for expedited surgical review.
- **Moderate Risk ($0.1800 \le P < 0.50$):** Operating screening band; triggers clinical alert for secondary radiographic review.
- **Low Risk ($P < 0.1800$):** Below clinical action threshold; standard clinical pathway.

---

## Section I — Safety and Risk Analysis

1. **False-Negative Risk (Severe Clinical Impact):** Undiagnosed fractures can lead to malunion, avascular necrosis, permanent functional limitation, or chronic pain. The production threshold was tuned to 0.1800 specifically to minimize false negatives (only 4 misses out of 107 test cases, NPV 98.77%).
2. **False-Positive Risk (Operational Impact):** Over-calling benign anatomy leads to unnecessary splinting, patient anxiety, and increased orthopedic consult load. The specificity floor of 63.64% prevents emergency department workflow saturation.
3. **Pediatric Growth Plate Mimics:** In children under 16, open physis lines resemble non-displaced fractures. The production baseline lacks bounding-box gating and must not be used on pediatric wrist trauma without acknowledging growth-plate vulnerability.
4. **Hardware Implant Resilience:** Verified 100% recall on radiographs with fixation plates and orthopedic screws, confirming that metallic artifacts do not suppress fracture alerts.

---

## Section J — Limitations

1. **Adult Focus of Production Baseline:** The deployed ResNet-18 model was fine-tuned on FracAtlas, which predominantly contains adult skeletal trauma. Its performance on subtle pediatric buckle or greenstick fractures has not been established in production.
2. **Research Isolation of DualViewROIResNet18:** Experiment 8A decisivly demonstrates how to resolve growth plate confounding (87.25% specificity) and capture occult lateral fractures (24 rescues), but it is **not deployed in production**. It remains a frozen research artifact pending clinical software integration.
3. **Absence of External Negative Controls in Shenzhen Benchmark:** The Shenzhen PediURF cohort contains exclusively fracture-positive trauma studies ($N=1,053$). Consequently, specificity, false-alarm rate, and ROC-AUC cannot be calculated on this external benchmark.
4. **Calibration at Low Probability Range:** Production baseline ECE (0.1021) slightly exceeds the 0.100 target, requiring clinicians to interpret the continuous score as an ordinal triage ranking rather than a calibrated posterior probability.

---

## Section K — Deployment and Operational Status

- **Operational Status:** **Production Baseline (Active Serving)**
- **Inference Service Binding:** `ai-prediction-service/app/services/fracture_service.py` lazily loads `artifacts/fracture/best_model.pt`.
- **API Endpoint:** `POST /api/ai/fracture` (proxied via Node.js API Gateway on port 5000 to FastAPI on port 5008).
- **Inference Latency:** Integrated end-to-end warm response median of 28.2 ms (p95 = 41.36 ms) through API Gateway.
- **Audit Certification:** Research Experiment 8A is 100% physically isolated from production routing. Live inference strictly executes the MURA-pretrained ResNet-18 baseline.

---

## Section L — Reproducibility & Artifact Inventory

| Component | Repository Path | Size / Commit |
| :--- | :--- | :--- |
| **Production Model Weights** | `ai-prediction-service/artifacts/fracture/best_model.pt` | 44,788,427 bytes (MD5 `99f0f5bcea645f714fe4e8fefbb7e6cb`) |
| **Production Inference Service** | `ai-prediction-service/app/services/fracture_service.py` | Line 27: `THRESHOLD = 0.1800` |
| **Production Preprocessing** | `ai-prediction-service/app/models/fracture/fracture_preprocessing.py` | Validates magic bytes, resizes $224 \times 224$ |
| **Production Training Script** | `ai-prediction-service/app/models/fracture/fracture_training.py` | Full MURA pretraining & FracAtlas fine-tuning |
| **Production Training Report** | `ai-prediction-service/artifacts/fracture/training_report.json` | Complete evaluation logs, confusion matrices |
| **Research Exp 8A Weights** | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt` | 45,839,207 bytes (MD5 `ac7ebe3c91deea13cedb5ca36a841829`) |
| **Research Freeze Manifest** | `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/EXPERIMENT_8A_FREEZE_MANIFEST.json` | Complete audit trail, freeze commit `ead0e88a` |
| **Localization Model (YOLOv8)** | `ai-prediction-service/artifacts/fracture_v2/experiment5_localization/best_model.pt` | 24,436,327 bytes (MD5 `ece51c07eaab354f25f53f99b104dc03`) |

---

## Section M — Model Card Evidence Register

| Claim / Metric | Supporting Repository Source File | Evidence Location in File | Verification Method | Verification Status |
| :--- | :--- | :--- | :--- | :---: |
| **Production Model Name & Version** | `ai-prediction-service/app/services/fracture_service.py` | Lines 25–26 (`MODEL_NAME`, `MODEL_VERSION`) | Direct Source Inspection | **VERIFIED** |
| **Production Threshold ($\tau = 0.1800$)**| `ai-prediction-service/app/services/fracture_service.py` | Line 27 (`THRESHOLD = 0.1800`) | Direct Source Inspection | **VERIFIED** |
| **Production Checkpoint MD5 Hash** | `ai-prediction-service/artifacts/fracture/best_model.pt` | Filesystem binary | Cryptographic MD5 Calculation | **VERIFIED** |
| **MURA Pretraining Samples (2,869)** | `ai-prediction-service/artifacts/fracture/training_report.json` | `pretraining.samples_used` | JSON Manifest Inspection | **VERIFIED** |
| **FracAtlas Split Sizes (1200/612/613)**| `ai-prediction-service/artifacts/fracture/training_report.json` | `fine_tuning.train_samples`, `test_samples` | JSON Manifest Inspection | **VERIFIED** |
| **Production Sensitivity (96.26%)** | `ai-prediction-service/artifacts/fracture/training_report.json` | `final_held_out_test_comparison.mura_pretrained_resnet18.metrics.recall` | JSON Evaluation Log | **VERIFIED** |
| **Production Specificity (63.64%)** | `ai-prediction-service/artifacts/fracture/training_report.json` | `final_held_out_test_comparison.mura_pretrained_resnet18.metrics.specificity` | JSON Evaluation Log | **VERIFIED** |
| **Production Precision / NPV (35.89% / 98.77%)**| `ai-prediction-service/artifacts/fracture/training_report.json` | `confusion_matrix` (TP=103, FP=184, TN=322, FN=4) | Reconciled Confusion Matrix | **VERIFIED** |
| **Exp 8A Research Status (Frozen)** | `EXPERIMENT_8A_FREEZE_MANIFEST.json` | `research_status` (`FORMALLY_FROZEN_RESEARCH_BEST`)| JSON Manifest Inspection | **VERIFIED** |
| **Exp 8A Checkpoint MD5 Hash** | `experiment8a_best_model.pt` | Filesystem binary | Cryptographic MD5 Calculation | **VERIFIED** |
| **Exp 8A Threshold ($\tau = 0.0100$)** | `EXPERIMENT_8A_FREEZE_MANIFEST.json` | `operating_threshold.frozen_threshold` | JSON Manifest Inspection | **VERIFIED** |
| **Exp 8A Test Sensitivity (95.18%)** | `experiment8a_graz_test_results.json` | `metrics.sensitivity_percent` | JSON Evaluation Log | **VERIFIED** |
| **Exp 8A Test Specificity (75.25%)** | `experiment8a_graz_test_results.json` | `metrics.specificity_percent` | JSON Evaluation Log | **VERIFIED** |
| **Exp 8A Lateral Rescues (24 Cases)**| `EXPERIMENT_8A_FREEZE_MANIFEST.json` | `key_results.multi_view_state_synergy.state_c_lat_only_rescue` | Synergy State Analysis | **VERIFIED** |
| **Normal Control Specificity (87.25%)**| `experiment8a_normal_control_results.json` | `specificity` (219 TN / 32 FP) | Stress Test Report | **VERIFIED** |
| **Shenzhen External Sensitivity (94.59%)**| `experiment8a_pediurf_results.json` | `study_sensitivity` (996 / 1,053 TP) | External Benchmark Report | **VERIFIED** |
| **Shenzhen Subgroups (677/265/111)** | `experiment8a_pediurf_results.json` | `subgroup_performance` | Subgroup Denominator Audit | **VERIFIED** |
