# Experiment 7: Shared-Backbone Dual-View ResNet-18 Architecture Specification

## 1. Overview
The Experiment 7 architecture is a **dual-branch convolutional neural network with shared backbone weights** designed to jointly extract, fuse, and classify paired orthogonal radiographs (Anteroposterior [AP] and Lateral [LAT]) of the pediatric wrist and forearm.

```
       [AP Radiograph (512x512x3)]             [Lateral Radiograph (512x512x3)]
                   │                                         │
                   ▼                                         ▼
   ┌────────────────────────────────┐       ┌────────────────────────────────┐
   │    Pretrained ResNet-18       │       │    Pretrained ResNet-18       │
   │    (Shared Weights θ_shared)   │       │    (Shared Weights θ_shared)   │
   └────────────────────────────────┘       └────────────────────────────────┘
                   │                                         │
                   ▼                                         ▼
          [GAP Feature: 512-d]                      [GAP Feature: 512-d]
                   │                                         │
                   └───────────────────┬─────────────────────┘
                                       │
                                       ▼
                       [Feature Concatenation: 1024-d]
                                       │
                                       ▼
                         [Linear Layer: 1024 → 256]
                                       │
                                       ▼
                              [ReLU Activation]
                                       │
                                       ▼
                            [Dropout (rate = 0.3)]
                                       │
                                       ▼
                          [Linear Layer: 256 → 1]
                                       │
                                       ▼
                               [Sigmoid Output]
                                       │
                                       ▼
                       Fracture Probability P(Fracture)
```

---

## 2. Technical Specifications

| Parameter | Specification | Design Rationale |
| :--- | :--- | :--- |
| **Backbone Architecture** | ResNet-18 (ImageNet-pretrained) | Proven gradient flow, prevents overfitting on moderate sample size |
| **Weight Sharing Policy** | **Shared ($\theta_{\text{shared}}$)** across AP and Lateral branches | Enforces a common cortical bone feature representation |
| **Feature Extraction** | Global Average Pooling (GAP) $\to 512$-dim vector per branch | Compresses spatial feature map into robust representation |
| **Fusion Layer** | Channel-wise Vector Concatenation ($512 + 512 = 1024$-dim) | Preserves independent view signals prior to non-linear interaction |
| **Classification Head** | $\text{FC}(1024 \to 256) \to \text{ReLU} \to \text{Dropout}(0.3) \to \text{FC}(256 \to 1)$ | Two-stage fusion allows learning cross-view cortical correlations |
| **Output Activation** | $\text{Sigmoid} \to P(\text{Fracture} \in [0, 1])$ | Calibrated study-level probability |
| **Loss Function** | Binary Cross-Entropy with Logits Loss ($\text{BCEWithLogitsLoss}$) | Smooth gradient dynamics |

---

## 3. Training & Optimization Protocol (For Phase 2)

- **Input Resolution:** $512 \times 512$ pixels (Letterboxed, Aspect Ratio Preserved)
- **Batch Size:** 16 paired studies (32 radiographs per forward pass)
- **Optimizer:** AdamW (Weight Decay: $1 \times 10^{-2}$)
- **Learning Rate:** $1 \times 10^{-4}$ for fusion head, $1 \times 10^{-5}$ for backbone fine-tuning
- **LR Schedule:** Cosine Annealing with Warmup
- **Early Stopping:** Patience = 7 epochs based on Validation ROC-AUC / F1-Score
