"""
fracture_training.py — Reproducible PyTorch CNN training and evaluation pipeline for MediMind Fracture Detection.

Supports:
  1. Musculoskeletal representation pretraining on Stanford MURA (normal vs abnormal)
  2. Feature backbone extraction and transfer learning
  3. Fracture-specific fine-tuning on FracAtlas (fracture vs normal)
  4. Class-imbalance handling via BCEWithLogitsLoss pos_weight
  5. Decision threshold calibration isolated strictly to validation data
  6. Final held-out test evaluation comparing Baseline (ImageNet) vs MURA-Pretrained CNN
  7. Comprehensive clinical metrics: Recall, Specificity, Precision, NPV, F1, ROC-AUC, PR-AUC, Brier score, ECE
  8. Detailed anatomical and orthopedic hardware subgroup analysis
  9. Artifact generation (baseline_model.pt, mura_pretrained_model.pt, best_model.pt, training_report.json)
"""

import os
import json
import random
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

import numpy as np
import pandas as pd
from PIL import Image
from sklearn.metrics import (
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    recall_score,
    precision_score,
)
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models

from .fracture_preprocessing import (
    get_training_transforms,
    get_inference_transforms,
    DEFAULT_IMAGE_SIZE,
)
from .fracatlas_ingestion import (
    load_fracatlas_metadata,
    create_fracatlas_stratified_split,
)
from .mura_audit import parse_mura_path


# ─────────────────────────────────────────────────────────────────────────────
# REPRODUCIBILITY & SEEDING
# ─────────────────────────────────────────────────────────────────────────────

def set_seed(seed: int = 42):
    """Set random seeds across random, numpy, and torch for deterministic execution."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


# ─────────────────────────────────────────────────────────────────────────────
# PYTORCH MODEL ARCHITECTURE
# ─────────────────────────────────────────────────────────────────────────────

class FractureClassifier(nn.Module):
    """
    ResNet-18 Convolutional Neural Network for musculoskeletal radiograph binary classification.
    Used for both MURA representation pretraining and FracAtlas fracture detection.
    """

    def __init__(
        self,
        pretrained: bool = True,
        weights_path: Optional[str] = None,
        dropout_p: float = 0.3,
    ):
        super().__init__()
        if pretrained and weights_path is None:
            weights = models.ResNet18_Weights.DEFAULT
            self.backbone = models.resnet18(weights=weights)
        else:
            self.backbone = models.resnet18(weights=None)

        in_features = self.backbone.fc.in_features  # 512
        self.dropout = nn.Dropout(p=dropout_p)
        self.head = nn.Linear(in_features, 1)
        self.backbone.fc = nn.Identity()

        if weights_path is not None:
            self.load_backbone_weights(weights_path)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass returning raw unscaled logits of shape (B, 1)."""
        features = self.backbone(x)
        dropped = self.dropout(features)
        logits = self.head(dropped)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass returning sigmoid probabilities of shape (B, 1)."""
        logits = self.forward(x)
        return torch.sigmoid(logits)

    def extract_backbone_state_dict(self) -> Dict[str, torch.Tensor]:
        """Extract state dict of the feature backbone, omitting the classification head."""
        sd = self.backbone.state_dict()
        return {k: v.cpu().clone() for k, v in sd.items()}

    def load_backbone_weights(self, weights_path: str):
        """Load pretrained feature backbone weights from a saved checkpoint."""
        state = torch.load(weights_path, map_location="cpu")
        if isinstance(state, dict) and "backbone_state_dict" in state:
            backbone_sd = state["backbone_state_dict"]
        elif isinstance(state, dict):
            backbone_sd = {k.replace("backbone.", ""): v for k, v in state.items() if not k.startswith("head.") and not k.startswith("dropout.")}
        else:
            raise ValueError("Unrecognized checkpoint format.")

        missing, unexpected = self.backbone.load_state_dict(backbone_sd, strict=False)
        if len(unexpected) > 0:
            raise RuntimeError(f"Unexpected keys while loading backbone: {unexpected}")

    def freeze_backbone(self):
        """Freeze feature extraction layers for head-only fine-tuning."""
        for param in self.backbone.parameters():
            param.requires_grad = False

    def unfreeze_backbone(self):
        """Unfreeze all layers for end-to-end gradient updates."""
        for param in self.parameters():
            param.requires_grad = True


# ─────────────────────────────────────────────────────────────────────────────
# DATASET WRAPPERS
# ─────────────────────────────────────────────────────────────────────────────

class RadiographImageDataset(Dataset):
    """
    Generic PyTorch Dataset for loading X-ray images from disk with error-handling and RGB conversion.
    """

    def __init__(
        self,
        file_paths: List[str],
        labels: List[int],
        transform=None,
    ):
        assert len(file_paths) == len(labels), "Length mismatch between file paths and labels."
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform or get_inference_transforms()

    def __len__(self) -> int:
        return len(self.file_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        path = self.file_paths[idx]
        label = self.labels[idx]

        try:
            with Image.open(path) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                tensor = self.transform(img)
        except Exception as e:
            # Fallback for transient read error: black tensor
            tensor = torch.zeros((3, DEFAULT_IMAGE_SIZE[0], DEFAULT_IMAGE_SIZE[1]), dtype=torch.float32)

        return tensor, torch.tensor(label, dtype=torch.float32)


# ─────────────────────────────────────────────────────────────────────────────
# MURA PRETRAINING DATA PREPARATION
# ─────────────────────────────────────────────────────────────────────────────

def load_mura_pretraining_data(
    mura_base_dir: str,
    sample_budget: Optional[int] = None,
    val_ratio: float = 0.15,
    random_seed: int = 42,
) -> Tuple[List[Tuple[str, int]], List[Tuple[str, int]], Dict[str, Any]]:
    """
    Ingest Stanford MURA dataset strictly for musculoskeletal representation pretraining.
    Labels represent general abnormality (0 = normal, 1 = abnormal); never mapped to fracture.

    Ensures zero patient leakage between MURA pretraining train and validation sets.
    """
    base_path = Path(mura_base_dir).resolve()
    train_csv = base_path / "train_image_paths.csv"

    if not train_csv.exists():
        raise FileNotFoundError(f"MURA train_image_paths.csv not found at {train_csv}")

    records = []
    with open(train_csv, "r", encoding="utf-8") as f:
        for line in f:
            rel = line.strip()
            if not rel:
                continue
            cleaned = rel.replace("MURA-v1.1/", "")
            parsed = parse_mura_path(cleaned)
            if parsed is None:
                continue

            full_path = base_path / cleaned
            if full_path.exists():
                records.append({
                    "full_path": str(full_path),
                    "label": parsed["abnormality_numeric"],
                    "patient_id": parsed["patient_id"],
                    "body_part": parsed["body_part"],
                })

    mura_df = pd.DataFrame(records)
    total_found = len(mura_df)

    # Optional patient-stratified budget sampling for CPU training
    if sample_budget is not None and sample_budget < total_found:
        rng = np.random.RandomState(random_seed)
        patients = mura_df.groupby("patient_id")["label"].max().reset_index()
        pos_patients = patients[patients["label"] == 1]["patient_id"].values
        neg_patients = patients[patients["label"] == 0]["patient_id"].values

        half_budget = sample_budget // 2
        sampled_pos = rng.choice(pos_patients, size=min(half_budget, len(pos_patients)), replace=False)
        sampled_neg = rng.choice(neg_patients, size=min(half_budget, len(neg_patients)), replace=False)
        sampled_patient_ids = set(sampled_pos).union(set(sampled_neg))

        mura_df = mura_df[mura_df["patient_id"].isin(sampled_patient_ids)].copy().reset_index(drop=True)

    # Patient-level train / val split
    patient_df = mura_df.groupby("patient_id")["label"].max().reset_index()
    val_count = max(1, int(len(patient_df) * val_ratio))
    val_patients = set(patient_df.sample(n=val_count, random_state=random_seed)["patient_id"])
    train_patients = set(patient_df["patient_id"]) - val_patients

    # Verify zero leakage
    assert len(train_patients.intersection(val_patients)) == 0, "Patient leakage in MURA split!"

    train_subset = mura_df[mura_df["patient_id"].isin(train_patients)]
    val_subset = mura_df[mura_df["patient_id"].isin(val_patients)]

    train_samples = list(zip(train_subset["full_path"], train_subset["label"]))
    val_samples = list(zip(val_subset["full_path"], val_subset["label"]))

    stats = {
        "total_available_images": total_found,
        "sampled_images": len(mura_df),
        "train_images": len(train_samples),
        "val_images": len(val_samples),
        "train_patients": len(train_patients),
        "val_patients": len(val_patients),
        "train_positives": int((train_subset["label"] == 1).sum()),
        "train_negatives": int((train_subset["label"] == 0).sum()),
    }

    return train_samples, val_samples, stats


# ─────────────────────────────────────────────────────────────────────────────
# FRACATLAS FINE-TUNING DATA PREPARATION
# ─────────────────────────────────────────────────────────────────────────────

def load_fracatlas_training_data(
    fracatlas_base_dir: str,
    train_sample_budget: Optional[int] = None,
    random_seed: int = 42,
) -> Tuple[Dict[str, pd.DataFrame], Dict[str, Any]]:
    """
    Ingest FracAtlas dataset and generate leakage-safe 70/15/15 train/val/test partitions.
    """
    df = load_fracatlas_metadata(fracatlas_base_dir)
    splits = create_fracatlas_stratified_split(df, random_seed=random_seed)

    # Optional training sample budget for fast CPU convergence
    if train_sample_budget is not None and train_sample_budget < len(splits["train"]):
        train_df = splits["train"]
        pos_df = train_df[train_df["fractured"] == 1]
        neg_df = train_df[train_df["fractured"] == 0]

        target_pos = int(train_sample_budget * 0.35)
        target_neg = train_sample_budget - min(target_pos, len(pos_df))

        sampled_pos = pos_df.sample(n=min(target_pos, len(pos_df)), random_state=random_seed)
        sampled_neg = neg_df.sample(n=min(target_neg, len(neg_df)), random_state=random_seed)

        splits["train"] = pd.concat([sampled_pos, sampled_neg]).sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

    stats = {
        "train_count": len(splits["train"]),
        "val_count": len(splits["val"]),
        "test_count": len(splits["test"]),
        "train_fractured": int((splits["train"]["fractured"] == 1).sum()),
        "train_non_fractured": int((splits["train"]["fractured"] == 0).sum()),
        "val_fractured": int((splits["val"]["fractured"] == 1).sum()),
        "val_non_fractured": int((splits["val"]["fractured"] == 0).sum()),
        "test_fractured": int((splits["test"]["fractured"] == 1).sum()),
        "test_non_fractured": int((splits["test"]["fractured"] == 0).sum()),
    }

    return splits, stats


# ─────────────────────────────────────────────────────────────────────────────
# TRAINING & EVALUATION LOOPS
# ─────────────────────────────────────────────────────────────────────────────

def train_epoch(
    model: nn.Module,
    loader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
) -> float:
    """Train model for one epoch and return average training loss."""
    model.train()
    total_loss = 0.0
    count = 0

    for inputs, labels in loader:
        inputs = inputs.to(device)
        labels = labels.to(device).unsqueeze(1)

        optimizer.zero_grad()
        logits = model(inputs)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * len(labels)
        count += len(labels)

    return total_loss / max(1, count)


def evaluate_loss_and_probs(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, np.ndarray, np.ndarray]:
    """Evaluate model on a dataloader, returning loss, probabilities, and ground truth labels."""
    model.eval()
    total_loss = 0.0
    count = 0
    all_probs = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in loader:
            inputs = inputs.to(device)
            labels_tensor = labels.to(device).unsqueeze(1)

            logits = model(inputs)
            loss = criterion(logits, labels_tensor)
            probs = torch.sigmoid(logits)

            total_loss += loss.item() * len(labels)
            count += len(labels)

            all_probs.extend(probs.cpu().squeeze(1).numpy().tolist())
            all_labels.extend(labels.numpy().tolist())

    avg_loss = total_loss / max(1, count)
    return avg_loss, np.array(all_probs), np.array(all_labels)


# ─────────────────────────────────────────────────────────────────────────────
# CALIBRATION & METRICS
# ─────────────────────────────────────────────────────────────────────────────

def calculate_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """
    Calculate Expected Calibration Error (ECE) with equal-width probability bins.
    """
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(y_true)

    for i in range(n_bins):
        bin_lower, bin_upper = bin_boundaries[i], bin_boundaries[i + 1]
        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper if i < n_bins - 1 else y_prob <= bin_upper)
        prop_in_bin = np.mean(in_bin)

        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(y_true[in_bin])
            avg_confidence_in_bin = np.mean(y_prob[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin

    return float(ece)


def calibrate_threshold(
    val_probs: np.ndarray,
    val_labels: np.ndarray,
    min_specificity: float = 0.60,
    search_steps: int = 91,
) -> float:
    """
    Calibrate classification decision threshold strictly on validation data.
    Finds threshold that maximizes Recall subject to minimum specificity >= min_specificity.
    Falls back to maximum F1 threshold if min_specificity cannot be satisfied.
    """
    thresholds = np.linspace(0.05, 0.95, search_steps)
    best_threshold = 0.50
    best_recall = -1.0
    best_f1 = -1.0

    valid_candidates = []

    for t in thresholds:
        preds = (val_probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(val_labels, preds, labels=[0, 1]).ravel()
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * tp) / (2 * tp + fp + fn) if (2 * tp + fp + fn) > 0 else 0.0

        if spec >= min_specificity:
            valid_candidates.append((rec, f1, t))

        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t

    if valid_candidates:
        # Sort by recall descending, then F1 descending
        valid_candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
        return float(valid_candidates[0][2])

    return float(best_threshold)


def evaluate_model_performance(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.50,
    metadata_df: Optional[pd.DataFrame] = None,
) -> Dict[str, Any]:
    """
    Calculate full clinical validation metrics for fracture classification.
    """
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    npv = float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except Exception:
        pr_auc = 0.0

    brier = float(brier_score_loss(y_true, y_prob))
    ece = calculate_ece(y_true, y_prob, n_bins=10)

    results: Dict[str, Any] = {
        "threshold": round(threshold, 4),
        "total_samples": int(len(y_true)),
        "confusion_matrix": {
            "true_positives": int(tp),
            "false_positives": int(fp),
            "true_negatives": int(tn),
            "false_negatives": int(fn),
        },
        "metrics": {
            "recall": round(recall, 4),
            "specificity": round(specificity, 4),
            "precision": round(precision, 4),
            "npv": round(npv, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "brier_score": round(brier, 4),
            "expected_calibration_error": round(ece, 4),
        },
    }

    # Subgroup breakdown
    if metadata_df is not None and len(metadata_df) == len(y_true):
        subgroups: Dict[str, Any] = {}

        # By anatomical part
        if "primary_body_part" in metadata_df.columns:
            for part in metadata_df["primary_body_part"].unique():
                mask = (metadata_df["primary_body_part"] == part).values
                if mask.sum() > 0:
                    part_true = y_true[mask]
                    part_pred = y_pred[mask]
                    part_prob = y_prob[mask]
                    part_tp = int(((part_true == 1) & (part_pred == 1)).sum())
                    part_total_pos = int((part_true == 1).sum())
                    part_rec = round(part_tp / part_total_pos, 4) if part_total_pos > 0 else 0.0

                    try:
                        part_auc = round(float(roc_auc_score(part_true, part_prob)), 4) if len(np.unique(part_true)) > 1 else None
                    except Exception:
                        part_auc = None

                    subgroups[f"anatomy_{part}"] = {
                        "count": int(mask.sum()),
                        "fractured_count": part_total_pos,
                        "recall": part_rec,
                        "roc_auc": part_auc,
                    }

        # By orthopedic hardware presence
        if "hardware" in metadata_df.columns:
            for hw in (0, 1):
                mask = (metadata_df["hardware"] == hw).values
                if mask.sum() > 0:
                    hw_true = y_true[mask]
                    hw_pred = y_pred[mask]
                    hw_tp = int(((hw_true == 1) & (hw_pred == 1)).sum())
                    hw_total_pos = int((hw_true == 1).sum())
                    hw_rec = round(hw_tp / hw_total_pos, 4) if hw_total_pos > 0 else 0.0
                    name = "with_hardware" if hw == 1 else "without_hardware"
                    subgroups[name] = {
                        "count": int(mask.sum()),
                        "fractured_count": hw_total_pos,
                        "recall": hw_rec,
                    }

        results["subgroups"] = subgroups

    return results


# ─────────────────────────────────────────────────────────────────────────────
# HIGH-LEVEL EXPERIMENT RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def run_fracture_experiment(
    mura_dir: str,
    fracatlas_dir: str,
    output_dir: str,
    mura_samples: Optional[int] = 1000,
    fracatlas_train_samples: Optional[int] = 1200,
    mura_epochs: int = 2,
    fine_tune_epochs: int = 3,
    batch_size: int = 32,
    learning_rate: float = 1e-4,
    random_seed: int = 42,
) -> Dict[str, Any]:
    """
    Run complete comparative experiment:
      1. Musculoskeletal feature pretraining on Stanford MURA
      2. Fine-tuning Baseline (ImageNet) vs MURA-Pretrained on FracAtlas
      3. Validation-based threshold calibration
      4. Held-out test evaluation and comparison
      5. Saving artifacts and training_report.json
    """
    set_seed(random_seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    out_path = Path(output_dir).resolve()
    out_path.mkdir(parents=True, exist_ok=True)

    print(f"=== MediMind Fracture Experiment ===")
    print(f"Device: {device} | Random Seed: {random_seed}")
    print(f"MURA Samples: {mura_samples} | FracAtlas Train Samples: {fracatlas_train_samples}")

    # Step 1: Ingest datasets
    print("\n[1/5] Ingesting MURA pretraining dataset...")
    mura_train, mura_val, mura_stats = load_mura_pretraining_data(
        mura_dir,
        sample_budget=mura_samples,
        random_seed=random_seed,
    )
    print(f"MURA Train: {len(mura_train)} images | Val: {len(mura_val)} images")

    print("\n[2/5] Ingesting FracAtlas dataset...")
    fracatlas_splits, fracatlas_stats = load_fracatlas_training_data(
        fracatlas_dir,
        train_sample_budget=fracatlas_train_samples,
        random_seed=random_seed,
    )
    print(f"FracAtlas Train: {len(fracatlas_splits['train'])} | Val: {len(fracatlas_splits['val'])} | Test: {len(fracatlas_splits['test'])}")

    # FracAtlas positive weight for class imbalance
    train_n_pos = (fracatlas_splits["train"]["fractured"] == 1).sum()
    train_n_neg = (fracatlas_splits["train"]["fractured"] == 0).sum()
    fracatlas_pos_weight = float(train_n_neg / max(1, train_n_pos))
    print(f"FracAtlas Pos Weight: {fracatlas_pos_weight:.2f}")

    # Transforms
    train_transform = get_training_transforms()
    eval_transform = get_inference_transforms()

    # Dataloaders for FracAtlas
    frac_train_ds = RadiographImageDataset(
        fracatlas_splits["train"]["full_path"].tolist(),
        fracatlas_splits["train"]["fractured"].tolist(),
        transform=train_transform,
    )
    frac_val_ds = RadiographImageDataset(
        fracatlas_splits["val"]["full_path"].tolist(),
        fracatlas_splits["val"]["fractured"].tolist(),
        transform=eval_transform,
    )
    frac_test_ds = RadiographImageDataset(
        fracatlas_splits["test"]["full_path"].tolist(),
        fracatlas_splits["test"]["fractured"].tolist(),
        transform=eval_transform,
    )

    frac_train_loader = DataLoader(frac_train_ds, batch_size=batch_size, shuffle=True)
    frac_val_loader = DataLoader(frac_val_ds, batch_size=batch_size, shuffle=False)
    frac_test_loader = DataLoader(frac_test_ds, batch_size=batch_size, shuffle=False)

    # Step 2: MURA Pretraining
    print(f"\n[3/5] Pretraining MURA Musculoskeletal Backbone ({mura_epochs} epochs)...")
    mura_train_ds = RadiographImageDataset(
        [p for p, _ in mura_train],
        [l for _, l in mura_train],
        transform=train_transform,
    )
    mura_val_ds = RadiographImageDataset(
        [p for p, _ in mura_val],
        [l for _, l in mura_val],
        transform=eval_transform,
    )
    mura_train_loader = DataLoader(mura_train_ds, batch_size=batch_size, shuffle=True)
    mura_val_loader = DataLoader(mura_val_ds, batch_size=batch_size, shuffle=False)

    mura_model = FractureClassifier(pretrained=True).to(device)
    mura_pos_weight = float(mura_stats["train_negatives"] / max(1, mura_stats["train_positives"]))
    mura_criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([mura_pos_weight], device=device))
    mura_optimizer = optim.AdamW(mura_model.parameters(), lr=learning_rate, weight_decay=1e-4)

    mura_history = []
    for epoch in range(1, mura_epochs + 1):
        tr_loss = train_epoch(mura_model, mura_train_loader, mura_optimizer, mura_criterion, device)
        v_loss, v_probs, v_labels = evaluate_loss_and_probs(mura_model, mura_val_loader, mura_criterion, device)
        v_auc = roc_auc_score(v_labels, v_probs) if len(np.unique(v_labels)) > 1 else 0.5
        mura_history.append({"epoch": epoch, "train_loss": round(tr_loss, 4), "val_loss": round(v_loss, 4), "val_auc": round(float(v_auc), 4)})
        print(f"  MURA Epoch {epoch}/{mura_epochs} | Train Loss: {tr_loss:.4f} | Val Loss: {v_loss:.4f} | Val AUC: {v_auc:.4f}")

    # Save MURA backbone
    mura_backbone_path = out_path / "mura_pretrained_backbone.pt"
    torch.save({"backbone_state_dict": mura_model.extract_backbone_state_dict()}, mura_backbone_path)
    print(f"  Saved MURA pretrained backbone to {mura_backbone_path.name}")

    # Step 3: Model A — Baseline (ImageNet -> FracAtlas)
    print(f"\n[4/5] Training Model A: Baseline Pretrained ResNet-18 -> FracAtlas ({fine_tune_epochs} epochs)...")
    baseline_model = FractureClassifier(pretrained=True).to(device)
    frac_criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([fracatlas_pos_weight], device=device))
    baseline_opt = optim.AdamW(baseline_model.parameters(), lr=learning_rate, weight_decay=1e-4)

    baseline_history = []
    for epoch in range(1, fine_tune_epochs + 1):
        tr_loss = train_epoch(baseline_model, frac_train_loader, baseline_opt, frac_criterion, device)
        v_loss, v_probs, v_labels = evaluate_loss_and_probs(baseline_model, frac_val_loader, frac_criterion, device)
        v_auc = roc_auc_score(v_labels, v_probs) if len(np.unique(v_labels)) > 1 else 0.5
        baseline_history.append({"epoch": epoch, "train_loss": round(tr_loss, 4), "val_loss": round(v_loss, 4), "val_auc": round(float(v_auc), 4)})
        print(f"  Baseline Epoch {epoch}/{fine_tune_epochs} | Train Loss: {tr_loss:.4f} | Val Loss: {v_loss:.4f} | Val AUC: {v_auc:.4f}")

    # Baseline threshold calibration on validation data
    _, base_val_probs, base_val_labels = evaluate_loss_and_probs(baseline_model, frac_val_loader, frac_criterion, device)
    baseline_threshold = calibrate_threshold(base_val_probs, base_val_labels, min_specificity=0.60)
    baseline_val_eval = evaluate_model_performance(base_val_labels, base_val_probs, threshold=baseline_threshold, metadata_df=fracatlas_splits["val"])
    print(f"  Baseline Calibrated Threshold: {baseline_threshold:.4f} (Val Recall: {baseline_val_eval['metrics']['recall']}, Val Spec: {baseline_val_eval['metrics']['specificity']})")

    # Step 4: Model B — MURA Pretrained -> FracAtlas
    print(f"\n[5/5] Training Model B: MURA-Pretrained ResNet-18 -> FracAtlas ({fine_tune_epochs} epochs)...")
    mura_tuned_model = FractureClassifier(pretrained=False, weights_path=str(mura_backbone_path)).to(device)
    mura_tuned_opt = optim.AdamW(mura_tuned_model.parameters(), lr=learning_rate, weight_decay=1e-4)

    mura_tuned_history = []
    for epoch in range(1, fine_tune_epochs + 1):
        tr_loss = train_epoch(mura_tuned_model, frac_train_loader, mura_tuned_opt, frac_criterion, device)
        v_loss, v_probs, v_labels = evaluate_loss_and_probs(mura_tuned_model, frac_val_loader, frac_criterion, device)
        v_auc = roc_auc_score(v_labels, v_probs) if len(np.unique(v_labels)) > 1 else 0.5
        mura_tuned_history.append({"epoch": epoch, "train_loss": round(tr_loss, 4), "val_loss": round(v_loss, 4), "val_auc": round(float(v_auc), 4)})
        print(f"  MURA-Tuned Epoch {epoch}/{fine_tune_epochs} | Train Loss: {tr_loss:.4f} | Val Loss: {v_loss:.4f} | Val AUC: {v_auc:.4f}")

    # MURA-tuned threshold calibration on validation data
    _, mura_val_probs, mura_val_labels = evaluate_loss_and_probs(mura_tuned_model, frac_val_loader, frac_criterion, device)
    mura_tuned_threshold = calibrate_threshold(mura_val_probs, mura_val_labels, min_specificity=0.60)
    mura_tuned_val_eval = evaluate_model_performance(mura_val_labels, mura_val_probs, threshold=mura_tuned_threshold, metadata_df=fracatlas_splits["val"])
    print(f"  MURA-Tuned Calibrated Threshold: {mura_tuned_threshold:.4f} (Val Recall: {mura_tuned_val_eval['metrics']['recall']}, Val Spec: {mura_tuned_val_eval['metrics']['specificity']})")

    # Step 5: Final Held-Out Test Evaluation (Untouched until now!)
    print("\n=== Final Held-Out Test Evaluation ===")
    _, base_test_probs, base_test_labels = evaluate_loss_and_probs(baseline_model, frac_test_loader, frac_criterion, device)
    base_test_results = evaluate_model_performance(base_test_labels, base_test_probs, threshold=baseline_threshold, metadata_df=fracatlas_splits["test"])

    _, mura_test_probs, mura_test_labels = evaluate_loss_and_probs(mura_tuned_model, frac_test_loader, frac_criterion, device)
    mura_test_results = evaluate_model_performance(mura_test_labels, mura_test_probs, threshold=mura_tuned_threshold, metadata_df=fracatlas_splits["test"])

    # Model selection strictly based on validation performance (ROC-AUC / loss)
    val_auc_baseline = baseline_val_eval["metrics"]["roc_auc"]
    val_auc_mura = mura_tuned_val_eval["metrics"]["roc_auc"]
    val_loss_baseline = baseline_history[-1]["val_loss"]
    val_loss_mura = mura_tuned_history[-1]["val_loss"]

    if (val_auc_mura > val_auc_baseline) or (val_auc_mura == val_auc_baseline and val_loss_mura < val_loss_baseline):
        selected_model_name = "mura_pretrained_resnet18"
        winning_model = mura_tuned_model
        winning_threshold = mura_tuned_threshold
        winning_val_metrics = mura_tuned_val_eval["metrics"]
        winning_test_metrics = mura_test_results["metrics"]
    else:
        selected_model_name = "baseline_imagenet_resnet18"
        winning_model = baseline_model
        winning_threshold = baseline_threshold
        winning_val_metrics = baseline_val_eval["metrics"]
        winning_test_metrics = base_test_results["metrics"]

    print(f"Selected Model based on Validation: {selected_model_name}")

    # Save artifacts
    torch.save(baseline_model.state_dict(), out_path / "baseline_model.pt")
    torch.save(mura_tuned_model.state_dict(), out_path / "mura_pretrained_model.pt")
    torch.save({
        "model_state_dict": winning_model.state_dict(),
        "selected_architecture": selected_model_name,
        "calibrated_threshold": winning_threshold,
        "validation_metrics": winning_val_metrics,
        "test_metrics": winning_test_metrics,
        "model_version": "0.1.0",
    }, out_path / "best_model.pt")

    # Generate comprehensive training report
    report: Dict[str, Any] = {
        "model_name": "fracture_detection_resnet18",
        "model_version": "0.1.0",
        "device": str(device),
        "random_seed": random_seed,
        "selected_model": selected_model_name,
        "calibrated_threshold": round(winning_threshold, 4),
        "pretraining": {
            "dataset": "Stanford MURA v1.1",
            "task": "Musculoskeletal Radiographic Abnormality Representation Learning",
            "samples_used": mura_stats["sampled_images"],
            "epochs": mura_epochs,
            "training_history": mura_history,
        },
        "fine_tuning": {
            "dataset": "FracAtlas (CC BY 4.0)",
            "task": "Binary Bone Fracture Classification",
            "train_samples": fracatlas_stats["train_count"],
            "val_samples": fracatlas_stats["val_count"],
            "test_samples": fracatlas_stats["test_count"],
            "pos_weight": round(fracatlas_pos_weight, 4),
            "epochs": fine_tune_epochs,
            "baseline_history": baseline_history,
            "mura_tuned_history": mura_tuned_history,
        },
        "validation_comparison": {
            "baseline_imagenet_resnet18": {
                "calibrated_threshold": round(baseline_threshold, 4),
                "metrics": baseline_val_eval["metrics"],
            },
            "mura_pretrained_resnet18": {
                "calibrated_threshold": round(mura_tuned_threshold, 4),
                "metrics": mura_tuned_val_eval["metrics"],
            },
        },
        "final_held_out_test_comparison": {
            "baseline_imagenet_resnet18": base_test_results,
            "mura_pretrained_resnet18": mura_test_results,
        },
    }

    report_path = out_path / "training_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\nArtifacts saved successfully in {out_path}:")
    print(f"  - baseline_model.pt")
    print(f"  - mura_pretrained_model.pt")
    print(f"  - best_model.pt")
    print(f"  - training_report.json")

    return report


# ─────────────────────────────────────────────────────────────────────────────
# CLI ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="MediMind Fracture Detection Training Pipeline")
    parser.add_argument("--mura-dir", type=str, default="test-dataset/Bone Facture/MURA-v1.1_files")
    parser.add_argument("--fracatlas-dir", type=str, default="test-dataset/Bone Facture/FracAtlas")
    parser.add_argument("--output-dir", type=str, default="artifacts/fracture")
    parser.add_argument("--mura-samples", type=int, default=1000)
    parser.add_argument("--fracatlas-train-samples", type=int, default=1200)
    parser.add_argument("--mura-epochs", type=int, default=2)
    parser.add_argument("--fine-tune-epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--seed", type=int, default=42)

    args = parser.parse_args()

    run_fracture_experiment(
        mura_dir=args.mura_dir,
        fracatlas_dir=args.fracatlas_dir,
        output_dir=args.output_dir,
        mura_samples=args.mura_samples,
        fracatlas_train_samples=args.fracatlas_train_samples,
        mura_epochs=args.mura_epochs,
        fine_tune_epochs=args.fine_tune_epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        random_seed=args.seed,
    )


if __name__ == "__main__":
    main()
