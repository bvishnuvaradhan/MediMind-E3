# Fracture Detection Dataset Specification

## 1. Module Overview & Purpose

The Fracture Detection module is an AI-assisted medical imaging tool within the MediMind AI Prediction Service. Its purpose is to analyze musculoskeletal plain radiographs (X-rays) to detect patterns suggestive of acute bone fractures using a PyTorch Convolutional Neural Network (CNN).

- **Prediction Type**: `FRACTURE_DETECTION`
- **Input Modality**: `IMAGE` (Musculoskeletal Plain Radiography / X-ray)
- **Model Name**: `fracture_cnn`
- **Model Version**: `0.1.0` (baseline pre-release)
- **Target Task**: Binary classification (`fracture` vs `normal`)
- **Current Status**: **BLOCKED ON DATASET INTAKE** — Preparation and preprocessing code is ready; training is held until the real labeled X-ray benchmark dataset is supplied.

---

## 2. Expected Dataset Structure & File Destination

The dataset must be placed under the Git-ignored directory:
`ai-prediction-service/test-dataset/Fracture/`

Supported on-disk structures:

### Option A: Standard Folder Structure (Recommended)
```
ai-prediction-service/test-dataset/Fracture/
├── train/
│   ├── fracture/          # Positive class images
│   └── normal/            # Negative class images
├── val/
│   ├── fracture/
│   └── normal/
└── test/
    ├── fracture/
    └── normal/
```

### Option B: Unified Image Pool with Metadata Index
```
ai-prediction-service/test-dataset/Fracture/
├── images/
│   ├── IMG_000001.png
│   ├── IMG_000002.png
│   └── ...
└── metadata.csv
```

When using `metadata.csv`, the following columns are required:
- `patient_id` (string/int): Unique identifier of the patient (critical for leakage prevention).
- `study_id` (string/int): Identifier of the radiographic study / exam.
- `image_path` (string): Relative path to the image file under `images/`.
- `label` (int or string): `1` or `"fracture"` for positive, `0` or `"normal"` for negative.
- `body_part` (optional string): Anatomical region (e.g., `wrist`, `hand`, `elbow`, `shoulder`, `ankle`, `hip`).
- `split` (optional string): `"train"`, `"val"`, or `"test"`.

---

## 3. Source, Citation & License Fields

Before training, the dataset provenance must be verified and documented:
- **Dataset Name**: Verified fracture dataset (e.g., FracNet, Kaggle Bone Fracture Dataset, or an explicitly fracture-annotated radiograph cohort).
- **Source / Repository**: Official URL / DOI of the dataset provider.
- **License / Terms of Use**: Confirmed open clinical research license (e.g., CC BY 4.0, PhysioNet Credentialed Health Data License).
- **Patient Privacy / HIPAA Compliance**: Verification that all images are fully anonymized and free of protected health information (PHI) in pixel data and headers.

---

## 4. Class Labels & Target Contract

| Class Name | Target Value | Description |
|:---|:---:|:---|
| `normal` | `0` | Negative: No radiographic evidence of acute bone fracture. |
| `fracture` | `1` | Positive: Radiographic evidence of acute cortical disruption, fissure, or displaced bone fracture. |

> [!IMPORTANT]
> **Ground Truth Label Integrity**: General musculoskeletal abnormality datasets (such as MURA) classify broad radiographic abnormalities (which include orthopedic hardware, degenerative joint disease, arthritis, and structural lesions) rather than acute fractures. MURA's binary abnormality labels (`positive` / `negative`) must **never** be assumed or conflated to mean `fracture` / `normal`. Any ingested dataset must have verified, explicit labels confirming acute bone fracture status.

---

## 5. Splitting Strategy & Leakage Prevention

- **Patient-Level Partitioning**: All radiographic views or repeated studies for a given patient must belong exclusively to a single partition (`train`, `val`, or `test`). Splitting randomly across individual images when multiple views exist for the same patient causes severe data leakage and artificially inflated metrics.
- **Split Proportions**:
  - **Train**: 70% of patient studies
  - **Validation**: 15% of patient studies (used for checkpoint selection and threshold tuning)
  - **Test**: 15% of patient studies (held out strictly for final evaluation; never used during training or threshold tuning)
- **Stratification**: The split must maintain identical class proportions (`fracture` vs `normal`) across train, validation, and test subsets.
- **Augmentation Isolation**: Data augmentation (e.g., random flips, rotations) must only execute during training batches; validation and test sets must undergo deterministic evaluation transforms only.

---

## 6. Image Format & Quality Standards

- **Supported Formats**: PNG, JPEG, and uncompressed DICOM (`.dcm`).
- **Standardized Resolution**: Preprocessing standardizes all inputs to 224×224 pixels.
- **Channels**: Standardized to 3-channel RGB (grayscale radiographs replicated across 3 channels) to allow compatibility with pre-trained vision backbones (e.g., ResNet18).
- **Pixel Range**: Scaled to float32 `[0.0, 1.0]`, normalized using ImageNet channel statistics:
  - Mean: `[0.485, 0.456, 0.406]`
  - Standard Deviation: `[0.229, 0.224, 0.225]`
- **Corruption Traps**: Images with corrupt bytes, zero-length files, non-radiographic content, or dimensions below 32×32 must be rejected with HTTP 422 before reaching the CNN.

---

## 7. Known Clinical & Technical Limitations

1. **Non-Diagnostic Nature**: The model is an assistive triage tool. It does not replace a board-certified radiologist's evaluation.
2. **Subtle & Stress Fractures**: Hairline fractures, non-displaced scaphoid fractures, or stress reactions may not present obvious cortical disruption on plain X-rays and may be missed.
3. **Artifact Sensitivity**: Plaster splints, surgical fixation hardware (screws, plates), external jewelry, motion blur, and underexposure/overexposure can degrade model confidence.
4. **Anatomical Specificity**: Performance may vary across skeletal sites (e.g., appendicular skeleton vs. axial skeleton). Evaluation must report anatomical subgroup metrics when metadata is available.
5. **False Negative Minimization**: Because missed fractures can lead to malunion or permanent disability, threshold calibration should prioritize high sensitivity/recall (e.g., $\ge 0.85$) while preserving specificity.

---

## 8. MURA-v1.1 Dataset Audit & Label Feasibility Assessment

An audit of the downloaded Stanford MURA-v1.1 file index (`mura_v1_1.csv` / `Redivis-files-2026-09-23.csv`) was conducted using `app/models/fracture/mura_audit.py`:

- **Dataset Source**: Stanford ML Group MURA v1.1 via Redivis.
- **Total Records in Index**: 40,013 entries (4 reference CSVs + 40,009 plain musculoskeletal radiographs).
- **Split Breakdown**:
  - `train`: 36,812 images across 12,934 unique patients and 13,457 studies.
  - `valid`: 3,197 images across 1,118 unique patients and 1,200 studies.
  - **Patient Leakage**: Audited across splits. Overlap between train and valid patients is **0** (clean study/patient isolation).
- **Anatomical Distribution (Image Counts)**:
  - `XR_WRIST`: 10,415
  - `XR_SHOULDER`: 8,942
  - `XR_HAND`: 6,003
  - `XR_FINGER`: 5,567
  - `XR_ELBOW`: 5,396
  - `XR_FOREARM`: 2,126
  - `XR_HUMERUS`: 1,560
- **Official MURA Abnormality Labels**:
  - `negative` (unremarkable/normal study): 23,606 images (8,941 studies: 8,280 train / 661 valid).
  - `positive` (abnormal radiograph): 16,403 images (5,715 studies: 5,177 train / 538 valid).

### Critical Finding: Can MURA Satisfy the Locked Fracture Detection Model?
**NO, not without additional fracture annotations.**
1. **Label Semantic Mismatch**: MURA classifies **general radiographic abnormality**, NOT specific bone fractures. In the official MURA study, a radiograph is labeled `positive` if any abnormality is detected by radiologists, including hardware (plates, screws, pins), degenerative joint disease, arthritis, bone tumors/lesions, and congenital deformities, in addition to acute fractures.
2. **Clinical Risk of Label Conflation**: Converting MURA `positive` into `fracture` would train the model to classify arthritis or post-surgical orthopedic hardware as an acute fracture, causing high false positive rates and severe clinical error.
3. **Recommendation**:
   - MURA can serve as a robust pre-training backbone or abnormality baseline.
   - For the locked MediMind Fracture Detection model (`POST /api/ai/fracture`, binary `possibleFracture: true/false`), a dedicated fracture benchmark with verified fracture ground truth (e.g., FracAtlas, GRAZPEDWRI-DX) or an explicitly fracture-annotated subset of MURA must be utilized.

---

## 9. Verified Fracture-Specific Dataset Candidate: FracAtlas

Following the label audit of MURA, a dedicated fracture benchmark was identified and verified to fulfill the locked binary fracture detection requirement (`possibleFracture: true/false`):

- **Dataset Name**: **FracAtlas: A Dataset for Bone Fracture Classification, Localization and Segmentation**
- **Publication & Peer Review**: Published in *Nature Scientific Data* 10, 521 (2023). DOI: `10.1038/s41597-023-02432-4` (Iftekhar et al.).
- **Primary Source / Repository**: Figshare (`https://doi.org/10.6084/m9.figshare.22363012.v2`) and PhysioNet.
- **License / Terms of Use**: **Creative Commons Attribution 4.0 International (CC BY 4.0)** — Fully permissive open academic and clinical research license allowing reproduction and modification with attribution.
- **Total Radiograph Images**: **4,083 plain X-ray images** (standard format).
- **Explicit Ground-Truth Class Distribution**:
  - `fractured`: **717 images** (positive class, annotated with 922 individual fracture instances).
  - `non-fractured`: **3,366 images** (negative / normal class).
- **Expert Clinician Annotation**:
  - All annotations were independently performed and mutually verified by two board-certified radiologists and an orthopedic surgeon.
  - Unlike MURA, orthopedic hardware (plates, screws, pins) is tagged with a distinct secondary attribute (`hardware`) and is NOT conflated with acute fractures.
- **Anatomical Regions**:
  - Hand, Shoulder, Hip, and Leg plain radiographs.
- **Metadata Structure**:
  - Accompanied by structured metadata containing image identifiers, `fracture_label` (1 = fracture, 0 = non-fracture), anatomical labels, hardware tags, multiscan tags, and localization coordinates.
- **Patient & Partition Strategy**:
  - Partitionable into a leakage-safe 70% Train (~2,858 images), 15% Validation (~612 images), and 15% Test (~613 images) split using our existing `create_patient_stratified_split` logic.
  - Stratification preserves the ~17.5% positive fracture prevalence across all subsets.
- **Suitability for MediMind Fracture Detection**:
  - **YES, FULLY SUITABLE**:
    1. Direct semantic alignment with `PredictionType.FRACTURE_DETECTION` and `possibleFracture: true/false`.
    2. Clean binary target where `1` exclusively denotes a verified acute bone fracture.
    3. Permissive, verified CC BY 4.0 academic license.
    4. Practical size (~1.5–2 GB) well-suited for PyTorch CNN fine-tuning (e.g., ResNet18 backbone) without memory or storage bottlenecks.
