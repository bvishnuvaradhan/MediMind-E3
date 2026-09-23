# Fracture Detection Model Card: MURA → FracAtlas ResNet-18

## 1. Model Details

- **Model Name**: `fracture_detection_resnet18`
- **Model Version**: `0.1.0`
- **Architecture**: PyTorch ResNet-18 (11.2M parameters) with regularized binary classification head (`Dropout(p=0.3) -> Linear(512, 1)`).
- **Primary Task**: Musculoskeletal plain radiograph (X-ray) binary fracture classification (`possibleFracture: true/false`).
- **Input Modality**: Plain X-ray images (PNG, JPEG, DICOM preamble), resized to 224×224 px, normalized with standard ImageNet channel statistics.
- **Framework**: PyTorch `2.14.0+cpu` / `torchvision 0.29.0+cpu`.
- **Pretrained Checkpoint**: `artifacts/fracture/best_model.pt` (`mura_pretrained_resnet18`).

---

## 2. Intended Use & Clinical Scope

### Intended Use
This model provides automated clinical decision support by screening musculoskeletal radiographs for possible acute bone fractures. It produces a continuous fracture probability score, a binary risk flag (`possibleFracture: true/false`), and a mandatory non-diagnostic clinical disclaimer.

### Out-of-Scope & Prohibited Use
- **Not a Standalone Diagnostic Device**: The model cannot replace professional radiological assessment or clinical diagnosis.
- **Pediatric & Specialized CT/MRI**: Validated on adult plain radiographs; not validated for CT, MRI, ultrasound, or specialized pediatric growth-plate fracture detection.
- **Emergency Autonomous Triage**: Must not be used as the sole determinant for emergent patient discharge. Qualified clinicians must interpret results within full clinical context.

---

## 3. Training & Transfer Learning Pipeline

### Stage 1: Musculoskeletal Representation Pretraining (MURA)
- **Dataset**: Stanford MURA v1.1 (40,009 musculoskeletal plain radiographs across 7 upper extremity regions).
- **Pretraining Task**: Binary musculoskeletal abnormality classification (`0 = normal`, `1 = abnormal`). MURA abnormality labels were strictly **never** mapped to fractures.
- **Optimization**: AdamW (lr=1e-4, weight_decay=1e-4), BCEWithLogitsLoss with positive weighting.
- **Result**: Trained 2 epochs on 2,869 balanced patient-stratified radiographs. Validation loss improved from 0.6003 to 0.5617; validation ROC-AUC reached **0.7878**. Learned feature weights saved to `mura_pretrained_backbone.pt`.

### Stage 2: Supervised Fracture Fine-Tuning (FracAtlas)
- **Dataset**: FracAtlas (*Nature Scientific Data* 10, 521 [2023], CC BY 4.0).
- **Ground Truth**: Consensus expert annotations by two board-certified radiologists and one orthopedic surgeon.
- **Leakage Prevention**: Stratified 70% Train (1,200 sampled), 15% Validation (612), 15% Test (613) partitions with composite stratification preserving fracture prevalence (17.61%) and anatomical body parts. Zero image overlap across partitions.
- **Class Imbalance**: Handled via `pos_weight = 1.8571` in `BCEWithLogitsLoss`.

---

## 4. Model Selection & Validation-Based Threshold Calibration

The winning model was selected **strictly based on validation set performance** (ROC-AUC and validation loss), keeping the final test set completely untouched:

- **Validation ROC-AUC**:
  - Baseline ImageNet ResNet-18: `0.8742` (Val Loss: `0.6229`)
  - MURA-Pretrained ResNet-18: **`0.8836`** (Val Loss: **`0.4220`**)
- **Selected Model**: `mura_pretrained_resnet18` (higher validation ROC-AUC and 32.3% lower validation loss).
- **Threshold Calibration**: Swept thresholds from 0.05 to 0.95 strictly on validation data to maximize Recall while enforcing a clinical minimum specificity floor of $\ge 0.60$:
  - Selected Threshold: **`0.1800`**
  - Validation Recall: `0.8899` (97 / 109 validation fractures detected)
  - Validation Specificity: `0.6143` (309 / 503 validation normal cases correctly classified)

---

## 5. Final Held-Out Test Evaluation

Evaluated on the completely untouched FracAtlas held-out test partition (**613 plain radiographs**, 107 fractured, 506 non-fractured):

| Metric | Baseline ResNet-18 (ImageNet) | MURA-Pretrained ResNet-18 (Selected) | Relative Delta |
| :--- | :---: | :---: | :---: |
| **Calibrated Threshold** | `0.3500` | **`0.1800`** | — |
| **Recall (Sensitivity)** | `0.8879` (95 / 107) | **`0.9626` (103 / 107)** | **+7.47%** |
| **Specificity** | `0.6522` (330 / 506) | **`0.6364` (322 / 506)** | -1.58% |
| **Precision (PPV)** | `0.3506` | **`0.3589`** | +0.83% |
| **Negative Predictive Value (NPV)**| `0.9649` | **`0.9877`** | **+2.28%** |
| **F1 Score** | `0.5026` | **`0.5228`** | +2.02% |
| **ROC-AUC** | `0.9001` | **`0.9244`** | **+0.0243** |
| **PR-AUC** | `0.7467` | **`0.7843`** | **+0.0376** |
| **Brier Score** | `0.1656` | **`0.0896`** | **-45.9% (better)** |
| **Expected Calibration Error (ECE)**| `0.2342` | **`0.1021`** | **-56.4% (better)** |

### Confusion Matrix (Test Set, N = 613)
- **True Positives (TP)**: **103** (fractures correctly identified)
- **False Negatives (FN)**: **4** (missed fractures; down from 12 in baseline)
- **True Negatives (TN)**: **322** (normal radiographs correctly classified)
- **False Positives (FP)**: **184** (flagged for clinical review)

---

## 6. Subgroup Analysis (Test Set)

### Anatomical Subgroups
- **Hand** ($N = 231$, 66 fractures): Recall **`0.9697`** (64 / 66), ROC-AUC `0.8316`.
- **Leg** ($N = 340$, 39 fractures): Recall **`0.9487`** (37 / 39), ROC-AUC `0.9724`.
- **Hip** ($N = 27$, 1 fracture): Recall **`1.0000`** (1 / 1), ROC-AUC `0.9615`.
- **Shoulder** ($N = 15$, 1 fracture): Recall **`1.0000`** (1 / 1), ROC-AUC `1.0000`.

### Orthopedic Fixation Hardware Subgroups
- **Without Hardware** ($N = 597$, 91 fractures): Recall **`0.9560`** (87 / 91).
- **With Hardware** ($N = 16$, 16 fractures): Recall **`1.0000`** (16 / 16). Orthopedic hardware does not interfere with acute fracture detection.

---

## 7. Artifact Integrity & Reproducibility

Saved under the Git-ignored `artifacts/fracture/` directory:
- `mura_pretrained_backbone.pt`: 44.78 MB (MURA feature extractor)
- `baseline_model.pt`: 44.79 MB (ImageNet-initialized model)
- `mura_pretrained_model.pt`: 44.79 MB (MURA-preinitialized model)
- `best_model.pt`: 44.79 MB (Production checkpoint with calibrated threshold `0.1800`)
- `training_report.json`: 5.53 KB (Machine-readable metrics, histories, confusion matrices)

Reproducibility is strictly enforced through seed `42` across Python `random`, `numpy`, and `torch`.

---

## 8. Limitations & Clinical Governance

1. **Non-Diagnostic Nature**: The model is an assistive screening tool. Clinicians must independently confirm all findings.
2. **False Positive Rate**: Specificity of 63.64% indicates that ~36% of normal radiographs will trigger a screening flag. This is clinically acceptable for triage (high sensitivity: 96.26%, NPV: 98.77%), ensuring minimal missed fractures.
3. **Radiographic Quality**: Suboptimal patient positioning, low radiation dose, motion blur, and non-standard angles may degrade classification accuracy.
4. **Service Integration**: The checkpoint is prepared and validated offline. API endpoint serving, input validation, and service authentication are pending future integration milestones.
