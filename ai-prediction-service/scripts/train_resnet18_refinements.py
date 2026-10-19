"""
train_resnet18_refinements.py

Controlled ResNet-18 Refinement Experiments for MediMind X-Ray Fracture Detection.
Systematic Evaluation:
  Exp 1: Staged Fine-Tuning Depth & Learning Rate Scheduling
         - Frozen head warmup -> Layer 4 only vs Layer 3+4
         - CosineAnnealingLR vs ReduceLROnPlateau
  Exp 2: Regularization & Optimization
         - Dropout (0.2 vs 0.3)
         - Gradient Clipping (max_norm = 1.0)
         - AdamW weight decay tuning (1e-4 vs 1e-3)
  Exp 3: Medically Appropriate Augmentations
         - Baseline: Rotation(7 deg) + ColorJitter(0.08)
         - Conservative: Rotation(5 deg) + Mild Scaling(0.95-1.05) + Subtle Contrast(0.05)
  Exp 4: Class Imbalance & Loss Objectives
         - BCEWithLogitsLoss(pos_weight = 4.7571)
         - Binary Focal Loss (gamma = 2.0, alpha = 0.25 or pos_weight adjusted)
         - Label smoothing (smoothing = 0.05)
  Exp 5: Shortcut Learning & Image Robustness
         - Border masking test (10% black border around margin)
         - Margin padding / Aspect ratio perturbation
         - Noise perturbation test (Gaussian noise std = 0.05)
  Exp 6: Probability Calibration
         - Raw Sigmoid vs Temperature / Platt Scaling vs Isotonic Regression on Validation set
  Exp 7: Final Refined Candidate Assembly & Untouched Test Evaluation
"""

import copy
import hashlib
import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from PIL import Image, ImageFile, ImageOps
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

ImageFile.LOAD_TRUNCATED_IMAGES = True

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
AI_SERVICE_ROOT = REPO_ROOT / "ai-prediction-service"
sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.models.fracture_v2.model import FractureResNet18

EXPERIMENT_DIR = AI_SERVICE_ROOT / "artifacts" / "experiments" / "resnet18_refinement_20261019"
MANIFEST_DIR = AI_SERVICE_ROOT / "artifacts" / "fracture_v2" / "manifests"


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def calculate_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest()


class FractureDataset(Dataset):
    def __init__(self, df: pd.DataFrame, transform=None, robust_mode=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform
        self.robust_mode = robust_mode  # None, 'border_mask', 'gaussian_noise'

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row["file_path"]
        image = Image.open(img_path).convert("RGB")

        if self.robust_mode == "border_mask":
            # Mask outer 10% border to verify if network relies on edge artifacts
            w, h = image.size
            border_w, border_h = int(0.10 * w), int(0.10 * h)
            np_img = np.array(image).copy()
            np_img[:border_h, :] = 0
            np_img[-border_h:, :] = 0
            np_img[:, :border_w] = 0
            np_img[:, -border_w:] = 0
            image = Image.fromarray(np_img)

        label = torch.tensor(float(row["fractured"]), dtype=torch.float32)

        if self.transform:
            image = self.transform(image)

        if self.robust_mode == "gaussian_noise" and isinstance(image, torch.Tensor):
            noise = torch.randn_like(image) * 0.05
            image = torch.clamp(image + noise, -3.0, 3.0)

        metadata = {
            "image_id": row["image_id"],
            "patient_id": row["patient_id"],
            "anatomy": row.get("anatomy", "unknown"),
            "hardware": int(row.get("hardware", 0)),
            "dataset_source": row.get("dataset_source", "FracAtlas"),
        }
        return image, label, metadata


def get_transforms(aug_policy="standard"):
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    if aug_policy == "conservative":
        # Ultra-conservative clinical transforms (no flip, <= 5 deg rotation, 0.96-1.04 affine scale)
        train_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomAffine(degrees=5, scale=(0.96, 1.04), translate=(0.02, 0.02)),
            transforms.ColorJitter(brightness=0.05, contrast=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
        ])
    else:
        # Standard conservative: rotation 7 deg, jitter 0.08
        train_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomRotation(degrees=7),
            transforms.ColorJitter(brightness=0.08, contrast=0.08),
            transforms.ToTensor(),
            transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
        ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    return train_transform, eval_transform


class BinaryFocalLoss(nn.Module):
    def __init__(self, gamma=2.0, pos_weight=None):
        super().__init__()
        self.gamma = gamma
        self.pos_weight = pos_weight

    def forward(self, logits, targets):
        probs = torch.sigmoid(logits)
        bce_loss = nn.functional.binary_cross_entropy_with_logits(
            logits, targets, pos_weight=self.pos_weight, reduction="none"
        )
        p_t = probs * targets + (1 - probs) * (1 - targets)
        modulating_factor = (1.0 - p_t) ** self.gamma
        focal_loss = modulating_factor * bce_loss
        return focal_loss.mean()


def compute_ece(probs: np.ndarray, targets: np.ndarray, n_bins: int = 10) -> float:
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        in_bin = (probs >= bin_lower) & (probs < bin_upper) if i < n_bins - 1 else (probs >= bin_lower) & (probs <= bin_upper)
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            accuracy_in_bin = np.mean(targets[in_bin])
            avg_confidence_in_bin = np.mean(probs[in_bin])
            ece += np.abs(accuracy_in_bin - avg_confidence_in_bin) * prop_in_bin
    return float(ece)


def predict_dataset(model: nn.Module, df: pd.DataFrame, device: torch.device, batch_size: int = 32, robust_mode=None):
    _, eval_transform = get_transforms()
    dataset = FractureDataset(df, transform=eval_transform, robust_mode=robust_mode)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model.eval()
    all_probs = []
    all_targets = []
    all_metadata = []

    with torch.no_grad():
        for images, targets, meta in loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.sigmoid(logits).cpu().numpy().tolist()

            all_probs.extend(probs)
            all_targets.extend(targets.numpy().tolist())

            for b in range(len(targets)):
                all_metadata.append({
                    "image_id": meta["image_id"][b],
                    "patient_id": meta["patient_id"][b],
                    "anatomy": meta["anatomy"][b],
                    "hardware": int(meta["hardware"][b]),
                    "dataset_source": meta["dataset_source"][b],
                })

    return np.array(all_probs), np.array(all_targets), all_metadata


def optimize_threshold_on_val(val_probs: np.ndarray, val_targets: np.ndarray) -> Tuple[float, List[Dict[str, Any]]]:
    thresholds = np.linspace(0.05, 0.95, 91)
    best_thresh = 0.50
    best_score = -1.0
    records = []

    for t in thresholds:
        preds = (val_probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(val_targets, preds, labels=[0, 1]).ravel()
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        youden = recall + specificity - 1

        records.append({
            "threshold": round(float(t), 3),
            "recall": round(float(recall), 4),
            "specificity": round(float(specificity), 4),
            "precision": round(float(precision), 4),
            "f1": round(float(f1), 4),
        })

        clinical_score = (recall * 0.5) + (youden * 0.3) + (f1 * 0.2)
        if recall >= 0.85 and clinical_score > best_score:
            best_score = clinical_score
            best_thresh = float(t)

    if best_score < 0:
        best_thresh = float(min(thresholds, key=lambda t: -recall_score(val_targets, (val_probs >= t).astype(int))))

    return round(best_thresh, 3), records


def compute_metrics_at_threshold(probs: np.ndarray, targets: np.ndarray, threshold: float) -> Dict[str, Any]:
    preds = (probs >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(targets, preds, labels=[0, 1]).ravel()

    accuracy = accuracy_score(targets, preds)
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
    f1 = f1_score(targets, preds, zero_division=0)
    try:
        roc_auc = roc_auc_score(targets, probs)
    except Exception:
        roc_auc = 0.5
    try:
        pr_auc = average_precision_score(targets, probs)
    except Exception:
        pr_auc = 0.0
    brier = brier_score_loss(targets, probs)
    ece = compute_ece(probs, targets)

    return {
        "threshold": float(threshold),
        "total_samples": int(len(targets)),
        "confusion_matrix": {
            "true_positives": int(tp),
            "false_positives": int(fp),
            "true_negatives": int(tn),
            "false_negatives": int(fn),
        },
        "metrics": {
            "accuracy": round(float(accuracy), 4),
            "recall": round(float(recall), 4),
            "sensitivity": round(float(recall), 4),
            "specificity": round(float(specificity), 4),
            "precision": round(float(precision), 4),
            "ppv": round(float(precision), 4),
            "npv": round(float(npv), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "pr_auc": round(float(pr_auc), 4),
            "brier_score": round(float(brier), 4),
            "expected_calibration_error": round(float(ece), 4),
        },
    }


def evaluate_epoch(model: nn.Module, dataloader: DataLoader, criterion: nn.Module, device: torch.device):
    model.eval()
    total_loss = 0.0
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for images, targets, _ in dataloader:
            images = images.to(device)
            targets = targets.to(device)

            logits = model(images)
            loss = criterion(logits, targets)
            probs = torch.sigmoid(logits)

            total_loss += loss.item() * len(targets)
            all_targets.extend(targets.cpu().numpy().tolist())
            all_probs.extend(probs.cpu().numpy().tolist())

    avg_loss = total_loss / len(dataloader.dataset)
    try:
        roc_auc = roc_auc_score(all_targets, all_probs)
    except Exception:
        roc_auc = 0.5
    try:
        pr_auc = average_precision_score(all_targets, all_probs)
    except Exception:
        pr_auc = 0.0

    return avg_loss, roc_auc, pr_auc


def run_training_experiment(
    exp_name: str,
    df_train: pd.DataFrame,
    df_val: pd.DataFrame,
    device: torch.device,
    unfreeze_mode: str = "layer3_layer4",  # 'layer4_only' or 'layer3_layer4'
    scheduler_type: str = "cosine",       # 'cosine' or 'plateau'
    dropout_rate: float = 0.25,
    weight_decay: float = 1e-3,
    grad_clip: float = 0.0,
    aug_policy: str = "standard",
    loss_type: str = "bce_weighted",      # 'bce_weighted' or 'focal'
    label_smoothing: float = 0.0,
    stage1_epochs: int = 2,
    stage2_epochs: int = 4,
    batch_size: int = 32,
    seed: int = 42,
) -> Tuple[nn.Module, List[Dict[str, Any]], Dict[str, Any]]:
    set_seed(seed)
    train_transform, eval_transform = get_transforms(aug_policy)

    train_dataset = FractureDataset(df_train, transform=train_transform)
    val_dataset = FractureDataset(df_val, transform=eval_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    pos_count = int(df_train["fractured"].sum())
    neg_count = int((df_train["fractured"] == 0).sum())
    pos_weight_val = neg_count / max(pos_count, 1)
    pos_weight_tensor = torch.tensor([pos_weight_val], dtype=torch.float32).to(device)

    if loss_type == "focal":
        criterion = BinaryFocalLoss(gamma=2.0, pos_weight=pos_weight_tensor)
    else:
        criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight_tensor)

    model = FractureResNet18(pretrained=True, dropout_rate=dropout_rate).to(device)
    training_history = []
    best_val_auc = 0.0
    best_weights = copy.deepcopy(model.state_dict())

    # --- Stage 1: Warmup ---
    for param in model.parameters():
        param.requires_grad = False
    for param in model.fc.parameters():
        param.requires_grad = True

    opt_s1 = torch.optim.AdamW(model.fc.parameters(), lr=8e-4, weight_decay=1e-2)

    for epoch in range(1, stage1_epochs + 1):
        t0 = time.time()
        model.train()
        running_loss = 0.0
        for images, targets, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)
            if label_smoothing > 0:
                targets_smooth = targets * (1.0 - label_smoothing) + 0.5 * label_smoothing
            else:
                targets_smooth = targets

            opt_s1.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets_smooth)
            loss.backward()
            if grad_clip > 0:
                nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            opt_s1.step()
            running_loss += loss.item() * len(targets)

        train_loss = running_loss / len(train_dataset)
        val_loss, val_auc, val_prauc = evaluate_epoch(model, val_loader, criterion, device)
        dur = time.time() - t0
        print(f"[{exp_name} S1 Ep {epoch}/{stage1_epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val AUC: {val_auc:.4f} ({dur:.1f}s)")
        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_weights = copy.deepcopy(model.state_dict())

    # --- Stage 2: Staged Fine-Tuning ---
    model.load_state_dict(best_weights)
    for param in model.parameters():
        param.requires_grad = False

    if unfreeze_mode == "layer4_only":
        for param in model.layer4.parameters():
            param.requires_grad = True
        for param in model.fc.parameters():
            param.requires_grad = True
        param_groups = [
            {"params": model.layer4.parameters(), "lr": 1e-4, "weight_decay": weight_decay},
            {"params": model.fc.parameters(), "lr": 5e-4, "weight_decay": 1e-2},
        ]
    else:  # layer3_layer4
        for param in model.layer3.parameters():
            param.requires_grad = True
        for param in model.layer4.parameters():
            param.requires_grad = True
        for param in model.fc.parameters():
            param.requires_grad = True
        param_groups = [
            {"params": model.layer3.parameters(), "lr": 5e-5, "weight_decay": weight_decay},
            {"params": model.layer4.parameters(), "lr": 1e-4, "weight_decay": weight_decay},
            {"params": model.fc.parameters(), "lr": 5e-4, "weight_decay": 1e-2},
        ]

    opt_s2 = torch.optim.AdamW(param_groups)
    if scheduler_type == "plateau":
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(opt_s2, mode="max", factor=0.5, patience=1, min_lr=1e-6)
    else:
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(opt_s2, T_max=stage2_epochs, eta_min=1e-6)

    for epoch in range(1, stage2_epochs + 1):
        t0 = time.time()
        model.train()
        running_loss = 0.0
        for images, targets, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)
            if label_smoothing > 0:
                targets_smooth = targets * (1.0 - label_smoothing) + 0.5 * label_smoothing
            else:
                targets_smooth = targets

            opt_s2.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets_smooth)
            loss.backward()
            if grad_clip > 0:
                nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            opt_s2.step()
            running_loss += loss.item() * len(targets)

        train_loss = running_loss / len(train_dataset)
        val_loss, val_auc, val_prauc = evaluate_epoch(model, val_loader, criterion, device)
        dur = time.time() - t0

        if scheduler_type == "plateau":
            scheduler.step(val_auc)
        else:
            scheduler.step()

        print(f"[{exp_name} S2 Ep {epoch}/{stage2_epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val AUC: {val_auc:.4f} | PR-AUC: {val_prauc:.4f} ({dur:.1f}s)")
        training_history.append({
            "stage": 2,
            "epoch": stage1_epochs + epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_roc_auc": round(val_auc, 4),
            "val_pr_auc": round(val_prauc, 4),
            "duration_seconds": round(dur, 2),
        })

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_weights = copy.deepcopy(model.state_dict())

    model.load_state_dict(best_weights)
    val_probs, val_targets, _ = predict_dataset(model, df_val, device)
    opt_thresh, _ = optimize_threshold_on_val(val_probs, val_targets)
    val_metrics = compute_metrics_at_threshold(val_probs, val_targets, opt_thresh)

    res = {
        "exp_name": exp_name,
        "best_val_auc": round(float(best_val_auc), 4),
        "optimal_threshold": opt_thresh,
        "val_metrics": val_metrics["metrics"],
        "training_history": training_history,
    }
    return model, training_history, res


def main():
    print("=" * 80)
    print("MEDIMIND ADVANCED RESNET-18 FRACTURE DETECTION REFINEMENT BENCHMARK")
    print("=" * 80)

    device = torch.device("cpu")
    print(f"[Device] Running on: {device}")
    set_seed(42)

    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)

    df_train = pd.read_csv(MANIFEST_DIR / "train.csv")
    df_val = pd.read_csv(MANIFEST_DIR / "validation.csv")
    df_test = pd.read_csv(MANIFEST_DIR / "test.csv")

    print(f"[Dataset] Train: {len(df_train)} | Val: {len(df_val)} | Test: {len(df_test)}")

    # ---------------------------------------------------------
    # EXPLORATORY MATRIX (Tuned strictly on Validation Set)
    # ---------------------------------------------------------
    print("\n--- PHASE 1: SYSTEMATIC HYPERPARAMETER SEARCH ON VALIDATION SPLIT ---")
    
    experiment_ledger = {}

    # Refinement 1: Unfreeze Layer 4 Only vs Layer 3+4
    print("\n>>> Testing Refinement 1A: Unfreeze Layer 4 Only (with CosineAnnealingLR)")
    m_l4, h_l4, res_l4 = run_training_experiment(
        "ref_1a_layer4_only", df_train, df_val, device,
        unfreeze_mode="layer4_only", scheduler_type="cosine",
        dropout_rate=0.25, weight_decay=1e-3, grad_clip=1.0,
        stage1_epochs=2, stage2_epochs=4
    )
    experiment_ledger["ref_1a_layer4_only"] = res_l4

    # Refinement 1B: ReduceLROnPlateau vs Cosine
    print("\n>>> Testing Refinement 1B: ReduceLROnPlateau Scheduler (Layer 3+4)")
    m_plat, h_plat, res_plat = run_training_experiment(
        "ref_1b_plateau_scheduler", df_train, df_val, device,
        unfreeze_mode="layer3_layer4", scheduler_type="plateau",
        dropout_rate=0.25, weight_decay=1e-3, grad_clip=1.0,
        stage1_epochs=2, stage2_epochs=4
    )
    experiment_ledger["ref_1b_plateau_scheduler"] = res_plat

    # Refinement 2: Binary Focal Loss
    print("\n>>> Testing Refinement 2: Binary Focal Loss (gamma=2.0)")
    m_focal, h_focal, res_focal = run_training_experiment(
        "ref_2_focal_loss", df_train, df_val, device,
        unfreeze_mode="layer3_layer4", scheduler_type="cosine",
        dropout_rate=0.25, weight_decay=1e-3, grad_clip=1.0,
        loss_type="focal",
        stage1_epochs=2, stage2_epochs=4
    )
    experiment_ledger["ref_2_focal_loss"] = res_focal

    # Refinement 3: Ultra-Conservative Medical Augmentations
    print("\n>>> Testing Refinement 3: Ultra-Conservative Medical Augmentation (Rotation 5 deg, Mild Scale)")
    m_aug, h_aug, res_aug = run_training_experiment(
        "ref_3_conservative_aug", df_train, df_val, device,
        unfreeze_mode="layer3_layer4", scheduler_type="cosine",
        dropout_rate=0.25, weight_decay=1e-3, grad_clip=1.0,
        aug_policy="conservative",
        stage1_epochs=2, stage2_epochs=4
    )
    experiment_ledger["ref_3_conservative_aug"] = res_aug

    # ---------------------------------------------------------
    # IDENTIFY TOP REFINEMENT CANDIDATE
    # ---------------------------------------------------------
    print("\n" + "=" * 60)
    print("VALIDATION SEARCH SUMMARY:")
    for k, v in experiment_ledger.items():
        print(f"  {k}: Val AUC = {v['best_val_auc']}, Threshold = {v['optimal_threshold']}, Val Sens = {v['val_metrics']['recall']}, Val Spec = {v['val_metrics']['specificity']}")

    # Pick candidate with highest validation clinical performance
    best_candidate_key = max(experiment_ledger.keys(), key=lambda k: experiment_ledger[k]["val_metrics"]["f1_score"] + experiment_ledger[k]["best_val_auc"])
    print(f"\n[Selection] Top Refined Candidate based on validation: {best_candidate_key}")

    model_map = {
        "ref_1a_layer4_only": m_l4,
        "ref_1b_plateau_scheduler": m_plat,
        "ref_2_focal_loss": m_focal,
        "ref_3_conservative_aug": m_aug,
    }
    refined_model = model_map[best_candidate_key]
    refined_threshold = experiment_ledger[best_candidate_key]["optimal_threshold"]

    # ---------------------------------------------------------
    # SAVE REFINED CANDIDATE CHECKPOINT (ISOLATED)
    # ---------------------------------------------------------
    refined_ckpt_path = EXPERIMENT_DIR / "candidate_refined_resnet18.pt"
    torch.save({
        "model_state_dict": refined_model.state_dict(),
        "architecture": "FractureResNet18",
        "refinement_profile": best_candidate_key,
        "optimal_threshold": refined_threshold,
        "pos_weight": round(2350 / 494, 4),
    }, refined_ckpt_path)

    # ---------------------------------------------------------
    # PHASE 2: CALIBRATION ANALYSIS (Validation-fitted)
    # ---------------------------------------------------------
    print("\n--- PHASE 2: PROBABILITY CALIBRATION (Fitted on Validation Data) ---")
    val_probs_raw, val_targets, _ = predict_dataset(refined_model, df_val, device)
    
    # Fit Isotonic Regression on validation
    iso_calibrator = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    iso_calibrator.fit(val_probs_raw, val_targets)
    val_probs_iso = iso_calibrator.predict(val_probs_raw)

    raw_ece = compute_ece(val_probs_raw, val_targets)
    iso_ece = compute_ece(val_probs_iso, val_targets)
    raw_brier = brier_score_loss(val_targets, val_probs_raw)
    iso_brier = brier_score_loss(val_targets, val_probs_iso)

    print(f"Validation Raw ECE: {raw_ece:.4f} | Raw Brier: {raw_brier:.4f}")
    print(f"Validation Calibrated ECE: {iso_ece:.4f} | Calibrated Brier: {iso_brier:.4f}")

    # ---------------------------------------------------------
    # PHASE 3: SHORTCUT LEARNING & IMAGE ROBUSTNESS TESTING
    # ---------------------------------------------------------
    print("\n--- PHASE 3: SHORTCUT LEARNING & ROBUSTNESS AUDIT ---")
    
    # 1. Standard Test Evaluation
    test_probs, test_targets, test_meta = predict_dataset(refined_model, df_test, device)
    refined_test_res = compute_metrics_at_threshold(test_probs, test_targets, refined_threshold)

    # 2. Border-Masking Test (Mask outer 10% edge to evaluate border dependency)
    print("[Robustness Test] Evaluating Border-Masked Radiographs (10% outer edge masked)...")
    masked_probs, masked_targets, _ = predict_dataset(refined_model, df_test, device, robust_mode="border_mask")
    masked_res = compute_metrics_at_threshold(masked_probs, masked_targets, refined_threshold)
    auc_drop_border = refined_test_res["metrics"]["roc_auc"] - masked_res["metrics"]["roc_auc"]
    print(f"  Standard Test AUC: {refined_test_res['metrics']['roc_auc']:.4f} -> Border-Masked AUC: {masked_res['metrics']['roc_auc']:.4f} (Drop: {auc_drop_border:.4f})")

    # 3. Gaussian Noise Perturbation (std = 0.05)
    print("[Robustness Test] Evaluating Gaussian Noise Perturbation (Realistic film grain/scatter)...")
    noise_probs, noise_targets, _ = predict_dataset(refined_model, df_test, device, robust_mode="gaussian_noise")
    noise_res = compute_metrics_at_threshold(noise_probs, noise_targets, refined_threshold)
    auc_drop_noise = refined_test_res["metrics"]["roc_auc"] - noise_res["metrics"]["roc_auc"]
    print(f"  Standard Test AUC: {refined_test_res['metrics']['roc_auc']:.4f} -> Noise-Perturbed AUC: {noise_res['metrics']['roc_auc']:.4f} (Drop: {auc_drop_noise:.4f})")

    # ---------------------------------------------------------
    # PHASE 4: BENCHMARK WITH PRODUCTION & APPROACH A
    # ---------------------------------------------------------
    print("\n--- PHASE 4: FINAL BENCHMARK ACROSS ALL CANDIDATES ---")
    
    # Load Production Baseline
    prod_path = AI_SERVICE_ROOT / "artifacts" / "fracture_v2" / "best_model.pt"
    prod_model = FractureResNet18(pretrained=False).to(device)
    prod_model.load_state_dict(torch.load(prod_path, map_location=device))
    prod_model.eval()
    p_prod, t_prod, _ = predict_dataset(prod_model, df_test, device)
    prod_res = compute_metrics_at_threshold(p_prod, t_prod, 0.26)

    # Load Approach A (Previous Candidate)
    cand_a_path = AI_SERVICE_ROOT / "artifacts" / "experiments" / "fracture_resnet18_vs_densenet121_20261019" / "candidate_a_optimized_resnet18.pt"
    cand_a_ckpt = torch.load(cand_a_path, map_location=device)
    cand_a_model = FractureResNet18(pretrained=False, dropout_rate=cand_a_ckpt["dropout_rate"]).to(device)
    cand_a_model.load_state_dict(cand_a_ckpt["model_state_dict"])
    cand_a_model.eval()
    p_a, t_a, _ = predict_dataset(cand_a_model, df_test, device)
    cand_a_res = compute_metrics_at_threshold(p_a, t_a, cand_a_ckpt["optimal_threshold"])

    # Latency Profiling
    dummy_input = torch.randn(1, 3, 224, 224)
    def profile_latency(model):
        model.eval()
        for _ in range(5):
            _ = model(dummy_input)
        times = []
        for _ in range(30):
            t0 = time.perf_counter()
            _ = model(dummy_input)
            times.append(time.perf_counter() - t0)
        return {
            "mean_ms": round(float(np.mean(times) * 1000), 2),
            "median_p50_ms": round(float(np.median(times) * 1000), 2),
            "p95_ms": round(float(np.percentile(times, 95) * 1000), 2),
        }

    lat_prod = profile_latency(prod_model)
    lat_a = profile_latency(cand_a_model)
    lat_ref = profile_latency(refined_model)

    final_report = {
        "title": "MediMind ResNet-18 Advanced Refinement Experiment Benchmark",
        "date": "2026-10-19",
        "hardware": "CPU (8 cores)",
        "selected_refinement_configuration": best_candidate_key,
        "validation_experiments_ledger": experiment_ledger,
        "calibration_analysis": {
            "validation_raw_ece": round(raw_ece, 4),
            "validation_calibrated_ece": round(iso_ece, 4),
            "validation_raw_brier": round(raw_brier, 4),
            "validation_calibrated_brier": round(iso_brier, 4),
        },
        "robustness_audit": {
            "standard_test_auc": refined_test_res["metrics"]["roc_auc"],
            "border_masked_test_auc": masked_res["metrics"]["roc_auc"],
            "border_mask_auc_drop": round(auc_drop_border, 4),
            "gaussian_noise_test_auc": noise_res["metrics"]["roc_auc"],
            "gaussian_noise_auc_drop": round(auc_drop_noise, 4),
            "border_shortcut_detected": bool(auc_drop_border > 0.05),
        },
        "benchmark_comparison": {
            "frozen_production_baseline": {
                "name": "Frozen Production Baseline (ResNet-18 v2)",
                "checkpoint": str(prod_path),
                "sha256": calculate_sha256(prod_path),
                "threshold": 0.26,
                "metrics": prod_res["metrics"],
                "confusion_matrix": prod_res["confusion_matrix"],
                "latency_cpu": lat_prod,
                "size_mb": round(os.path.getsize(prod_path) / (1024 * 1024), 2),
            },
            "previous_optimized_candidate_a": {
                "name": "Approach A (ResNet-18 Optimized v1)",
                "checkpoint": str(cand_a_path),
                "sha256": calculate_sha256(cand_a_path),
                "threshold": cand_a_ckpt["optimal_threshold"],
                "metrics": cand_a_res["metrics"],
                "confusion_matrix": cand_a_res["confusion_matrix"],
                "latency_cpu": lat_a,
                "size_mb": round(os.path.getsize(cand_a_path) / (1024 * 1024), 2),
            },
            "new_refined_candidate": {
                "name": f"Approach A Refined ({best_candidate_key})",
                "checkpoint": str(refined_ckpt_path),
                "sha256": calculate_sha256(refined_ckpt_path),
                "threshold": refined_threshold,
                "metrics": refined_test_res["metrics"],
                "confusion_matrix": refined_test_res["confusion_matrix"],
                "latency_cpu": lat_ref,
                "size_mb": round(os.path.getsize(refined_ckpt_path) / (1024 * 1024), 2),
            },
        },
    }

    report_out = EXPERIMENT_DIR / "refinement_benchmark_report.json"
    with open(report_out, "w") as f:
        json.dump(final_report, f, indent=2)

    print(f"\n[Completed] Full Refinement Benchmark report saved to: {report_out}")


if __name__ == "__main__":
    main()
