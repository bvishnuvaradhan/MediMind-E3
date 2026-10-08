# Experiment 8A: Dual-View ROI-Aligned Multi-View Fusion Architecture

## 1. Architectural Philosophy

Experiment 7A demonstrated that global whole-image pooling aggregates normal pediatric growth plate signals, leading to high sensitivity but complete specificity collapse on normal pediatric controls.

Experiment 8A solves this by decoupling **Spatial Localization** from **Multi-View Decision Fusion**:

```
[AP Radiograph]               [Lateral Radiograph]
       │                                │
       ▼                                ▼
[Frozen YOLOv8n]                [Frozen YOLOv8n]
       │                                │
       ▼                                ▼
[Candidate AP ROI Box]          [Candidate Lat ROI Box]
(Expanded by 20%)               (Expanded by 20%)
       │                                │
       ▼                                ▼
[AP ROI Crop (256x256)]         [Lat ROI Crop (256x256)]
       │                                │
       ▼                                ▼
┌──────────────────────────────────────────────┐
│  Shared ResNet-18 ROI Feature Encoder (GAP)  │
└──────────────────────────────────────────────┘
       │                                │
       ▼                                ▼
[512-d AP ROI Embedding]        [512-d Lat ROI Embedding]
                 \                     /
                  \                   /
                   ▼                 ▼
          ┌───────────────────────────────────┐
          │ Concatenation Layer (1024-d)      │
          │ + Detector Confidence Gate (2-d)  │
          └───────────────────────────────────┘
                           │
                           ▼
          ┌───────────────────────────────────┐
          │ Multi-View Fusion MLP             │
          │ Linear(1026 -> 256) -> ReLU       │
          │ Dropout(0.30)                     │
          │ Linear(256 -> 1) -> Sigmoid       │
          └───────────────────────────────────┘
                           │
                           ▼
          [Study-Level Fracture Probability]
```

## 2. Key Architecture Components

1. **Frozen Spatial Localizer:** Experiment 5 YOLOv8n detector (`best_model.pt`, MD5: `ece51c07eaab354f25f53f99b104dc03`).
2. **ROI Cropping Engine:** Crops the highest-confidence candidate box expanded by 20% in width and height, letterboxed to $256 	imes 256$.
3. **Shared ROI Encoder:** ResNet-18 backbone (ImageNet-pretrained) with weights shared across AP and Lateral branches.
4. **Detector Confidence Gate:** In addition to the 1024-d concatenated ROI embeddings, the raw detector confidences $[c_{\text{AP}}, c_{\text{LAT}}]$ are concatenated into a 1026-d joint representation, allowing the MLP to learn when a view had high localization certainty vs zero detection.
5. **Multi-View Decision Head:** 2-layer MLP with Dropout(0.30) mapping the 1026-d vector to study-level logit.
