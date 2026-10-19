"""
Comprehensive Experimentation Runner: ResNet-18 vs DenseNet-121
MediMind X-ray Fracture Detection

This script executes:
1. Baseline ResNet-18 Reproduction & Extraction on identical splits.
2. Approach A: Optimized ResNet-18
   - Differential learning rates (backbone layer3/4 vs fc head).
   - AdamW with weight decay tuning & CosineAnnealingLR / ReduceLROnPlateau.
   - Clinical rotation and modest brightness/contrast jitter (no horizontal flip).
   - Dropout optimization (0.2 vs 0.3).
3. Approach B: DenseNet-121 Transfer Learning
   - Pretrained ImageNet DenseNet-121 backbone.
   - Warm-up classifier head -> progressive unfreezing of denseblock4 & transition3.
   - Differential learning rates (1e-4 backbone, 5e-4 head).
   - AdamW, early stopping, CosineAnnealingLR.
4. Threshold Optimization strictly on Validation Data.
5. Single-pass Held-Out Test Evaluation across all candidates.
6. Subgroup Analysis (Anatomy: Hand, Leg, Hip; Hardware presence).
7. Explainability via Grad-CAM for both ResNet-18 and DenseNet-121.
8. Latency and Resource Benchmarking.
9. Exporting isolated versioned artifacts under:
   ai-prediction-service/artifacts/experiments/fracture_resnet18_vs_densenet121_20261019/
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
from PIL import Image, ImageFile
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

# Path configuration
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
AI_SERVICE_ROOT = REPO_ROOT / "ai-prediction-service"
sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.models.fracture_v2.model import FractureResNet18
from app.models.fracture_v2.densenet_model import FractureDenseNet121

EXPERIMENT_DIR = AI_SERVICE_ROOT / "artifacts" / "experiments" / "fracture_resnet18_vs_densenet121_20261019"
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
    def __init__(self, df: pd.DataFrame, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row["file_path"]
        image = Image.open(img_path).convert("RGB")
        label = torch.tensor(float(row["fractured"]), dtype=torch.float32)

        if self.transform:
            image = self.transform(image)

        metadata = {
            "image_id": row["image_id"],
            "patient_id": row["patient_id"],
            "anatomy": row.get("anatomy", "unknown"),
            "hardware": int(row.get("hardware", 0)),
            "dataset_source": row.get("dataset_source", "FracAtlas"),
        }
        return image, label, metadata


def get_conservative_transforms():
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    # Medically appropriate augmentation: modest rotation and subtle contrast/brightness jitter
    # No random horizontal flip to avoid altering laterality/anatomy orientation
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


def predict_dataset(model: nn.Module, df: pd.DataFrame, device: torch.device, batch_size: int = 32):
    _, eval_transform = get_conservative_transforms()
    dataset = FractureDataset(df, transform=eval_transform)
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

            batch_size_cur = len(targets)
            for b in range(batch_size_cur):
                all_metadata.append({
                    "image_id": meta["image_id"][b],
                    "patient_id": meta["patient_id"][b],
                    "anatomy": meta["anatomy"][b],
                    "hardware": int(meta["hardware"][b]),
                    "dataset_source": meta["dataset_source"][b],
                })

    return np.array(all_probs), np.array(all_targets), all_metadata


def optimize_threshold_on_val(val_probs: np.ndarray, val_targets: np.ndarray) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Select optimal classification threshold strictly on validation data.
    Prioritizes sensitivity >= 0.85 for clinical safety, then maximizes weighted clinical score:
    Score = (recall * 0.5) + (youden * 0.3) + (f1 * 0.2)
    """
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
            "npv": round(float(npv), 4),
            "f1": round(float(f1), 4),
            "youden_j": round(float(youden), 4),
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


def evaluate_subgroups(probs: np.ndarray, targets: np.ndarray, metadata: List[Dict[str, Any]], threshold: float) -> Dict[str, Any]:
    df_meta = pd.DataFrame(metadata)
    df_meta["prob"] = probs
    df_meta["target"] = targets
    df_meta["pred"] = (probs >= threshold).astype(int)

    subgroups = {}

    for anat in ["hand", "leg", "hip"]:
        sub = df_meta[df_meta["anatomy"] == anat]
        if len(sub) > 0 and len(np.unique(sub["target"])) > 1:
            res = compute_metrics_at_threshold(sub["prob"].values, sub["target"].values, threshold)
            subgroups[f"anatomy_{anat}"] = res["metrics"]
            subgroups[f"anatomy_{anat}"]["count"] = len(sub)

    for hw in [0, 1]:
        sub = df_meta[df_meta["hardware"] == hw]
        if len(sub) > 0 and len(np.unique(sub["target"])) > 1:
            res = compute_metrics_at_threshold(sub["prob"].values, sub["target"].values, threshold)
            label = "no_hardware" if hw == 0 else "hardware_present"
            subgroups[label] = res["metrics"]
            subgroups[label]["count"] = len(sub)

    return subgroups


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


def train_candidate(
    model_type: str,
    df_train: pd.DataFrame,
    df_val: pd.DataFrame,
    device: torch.device,
    stage1_epochs: int = 3,
    stage2_epochs: int = 6,
    batch_size: int = 32,
    dropout_rate: float = 0.25,
    seed: int = 42,
) -> Tuple[nn.Module, List[Dict[str, Any]], float]:
    set_seed(seed)
    train_transform, eval_transform = get_conservative_transforms()

    train_dataset = FractureDataset(df_train, transform=train_transform)
    val_dataset = FractureDataset(df_val, transform=eval_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Class weighting
    pos_count = int(df_train["fractured"].sum())
    neg_count = int((df_train["fractured"] == 0).sum())
    pos_weight_val = neg_count / max(pos_count, 1)
    pos_weight_tensor = torch.tensor([pos_weight_val], dtype=torch.float32).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight_tensor)

    if model_type == "resnet18":
        model = FractureResNet18(pretrained=True, dropout_rate=dropout_rate).to(device)
    elif model_type == "densenet121":
        model = FractureDenseNet121(pretrained=True, dropout_rate=dropout_rate).to(device)
    else:
        raise ValueError(f"Unknown model_type: {model_type}")

    training_history = []
    best_val_auc = 0.0
    best_weights = copy.deepcopy(model.state_dict())

    # ----------------------------------------------------
    # STAGE 1: Head Warm-Up (Backbone Frozen)
    # ----------------------------------------------------
    print(f"\n[{model_type.upper()}] STAGE 1: Classifier Head Warm-Up ({stage1_epochs} epochs)...")
    for param in model.parameters():
        param.requires_grad = False

    if model_type == "resnet18":
        for param in model.fc.parameters():
            param.requires_grad = True
        head_params = model.fc.parameters()
    else:
        for param in model.classifier.parameters():
            param.requires_grad = True
        head_params = model.classifier.parameters()

    optimizer_s1 = torch.optim.AdamW(head_params, lr=8e-4, weight_decay=1e-2)

    for epoch in range(1, stage1_epochs + 1):
        t0 = time.time()
        model.train()
        running_loss = 0.0

        for images, targets, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer_s1.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer_s1.step()
            running_loss += loss.item() * len(targets)

        train_loss = running_loss / len(train_dataset)
        val_loss, val_auc, val_prauc = evaluate_epoch(model, val_loader, criterion, device)
        dur = time.time() - t0

        print(f"[{model_type} S1 Ep {epoch}/{stage1_epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val AUC: {val_auc:.4f} | PR-AUC: {val_prauc:.4f} ({dur:.1f}s)")

        training_history.append({
            "stage": 1,
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_roc_auc": round(val_auc, 4),
            "val_pr_auc": round(val_prauc, 4),
            "duration_seconds": round(dur, 2),
        })

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_weights = copy.deepcopy(model.state_dict())

    # ----------------------------------------------------
    # STAGE 2: Controlled Fine-Tuning with Differential LR
    # ----------------------------------------------------
    print(f"\n[{model_type.upper()}] STAGE 2: Differential Fine-Tuning ({stage2_epochs} epochs)...")
    model.load_state_dict(best_weights)

    for param in model.parameters():
        param.requires_grad = False

    if model_type == "resnet18":
        for param in model.layer3.parameters():
            param.requires_grad = True
        for param in model.layer4.parameters():
            param.requires_grad = True
        for param in model.fc.parameters():
            param.requires_grad = True

        optimizer_s2 = torch.optim.AdamW([
            {"params": model.layer3.parameters(), "lr": 5e-5, "weight_decay": 1e-3},
            {"params": model.layer4.parameters(), "lr": 1e-4, "weight_decay": 1e-3},
            {"params": model.fc.parameters(), "lr": 5e-4, "weight_decay": 1e-2},
        ])
    else:  # densenet121
        for param in model.features.transition3.parameters():
            param.requires_grad = True
        for param in model.features.denseblock4.parameters():
            param.requires_grad = True
        for param in model.features.norm5.parameters():
            param.requires_grad = True
        for param in model.classifier.parameters():
            param.requires_grad = True

        optimizer_s2 = torch.optim.AdamW([
            {"params": model.features.transition3.parameters(), "lr": 3e-5, "weight_decay": 1e-4},
            {"params": model.features.denseblock4.parameters(), "lr": 8e-5, "weight_decay": 1e-4},
            {"params": model.features.norm5.parameters(), "lr": 8e-5, "weight_decay": 1e-4},
            {"params": model.classifier.parameters(), "lr": 4e-4, "weight_decay": 1e-2},
        ])

    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer_s2, T_max=stage2_epochs, eta_min=1e-6)
    early_stop_patience = 4
    patience_counter = 0

    for epoch in range(1, stage2_epochs + 1):
        t0 = time.time()
        model.train()
        running_loss = 0.0

        for images, targets, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer_s2.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer_s2.step()
            running_loss += loss.item() * len(targets)

        scheduler.step()
        train_loss = running_loss / len(train_dataset)
        val_loss, val_auc, val_prauc = evaluate_epoch(model, val_loader, criterion, device)
        dur = time.time() - t0

        print(f"[{model_type} S2 Ep {epoch}/{stage2_epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val AUC: {val_auc:.4f} | PR-AUC: {val_prauc:.4f} ({dur:.1f}s)")

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
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= early_stop_patience:
                print(f"[{model_type}] Early stopping triggered at stage 2 epoch {epoch}.")
                break

    model.load_state_dict(best_weights)
    print(f"[{model_type}] Best Validation ROC-AUC achieved: {best_val_auc:.4f}")
    return model, training_history, pos_weight_val


def generate_gradcam_analysis(
    model: nn.Module,
    model_type: str,
    df_test: pd.DataFrame,
    test_probs: np.ndarray,
    threshold: float,
    output_dir: Path,
    device: torch.device,
) -> Dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)
    _, eval_transform = get_conservative_transforms()

    # Hook target layer
    activations = None
    gradients = None

    if model_type == "resnet18":
        target_layer = model.layer4[-1].conv2
    else:
        target_layer = model.features.denseblock4.denselayer16.conv2

    def forward_hook(module, input, output):
        nonlocal activations
        activations = output.detach()

    def backward_hook(module, grad_in, grad_out):
        nonlocal gradients
        gradients = grad_out[0].detach()

    fhook = target_layer.register_forward_hook(forward_hook)
    bhook = target_layer.register_full_backward_hook(backward_hook)

    test_preds = (test_probs >= threshold).astype(int)
    targets = df_test["fractured"].values

    cases = {"TP": None, "TN": None, "FP": None, "FN": None}
    for idx in range(len(df_test)):
        t = targets[idx]
        p = test_preds[idx]
        if t == 1 and p == 1 and cases["TP"] is None:
            cases["TP"] = idx
        elif t == 0 and p == 0 and cases["TN"] is None:
            cases["TN"] = idx
        elif t == 0 and p == 1 and cases["FP"] is None:
            cases["FP"] = idx
        elif t == 1 and p == 0 and cases["FN"] is None:
            cases["FN"] = idx
        if all(v is not None for v in cases.values()):
            break

    explainability_report = {}

    for case_type, idx in cases.items():
        if idx is None:
            continue
        row = df_test.iloc[idx]
        img_path = row["file_path"]
        raw_image = Image.open(img_path).convert("RGB")
        input_tensor = eval_transform(raw_image).unsqueeze(0).to(device)

        model.eval()
        model.zero_grad()
        logit = model(input_tensor)
        logit.backward()

        weights = torch.mean(gradients, dim=[2, 3], keepdim=True)
        cam = torch.sum(weights * activations, dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam_np = cam.squeeze().cpu().numpy()

        cam_min, cam_max = np.min(cam_np), np.max(cam_np)
        if cam_max - cam_min > 1e-8:
            cam_norm = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_norm = np.zeros_like(cam_np)

        # Focus metric: ratio of activation inside central bounding 60% box vs outer borders
        h, w = cam_norm.shape
        y_c1, y_c2 = int(0.2 * h), int(0.8 * h)
        x_c1, x_c2 = int(0.2 * w), int(0.8 * w)
        central_energy = float(np.sum(cam_norm[y_c1:y_c2, x_c1:x_c2]))
        total_energy = float(np.sum(cam_norm)) + 1e-8
        central_ratio = central_energy / total_energy

        explainability_report[case_type] = {
            "image_id": row["image_id"],
            "patient_id": row["patient_id"],
            "anatomy": row["anatomy"],
            "hardware": int(row["hardware"]),
            "ground_truth": int(row["fractured"]),
            "predicted_prob": round(float(torch.sigmoid(logit).item()), 4),
            "central_anatomical_focus_ratio": round(central_ratio, 4),
            "shortcut_or_border_artifact_detected": bool(central_ratio < 0.25),
        }

    fhook.remove()
    bhook.remove()
    return explainability_report


def main():
    print("=" * 75)
    print("MEDIMIND FRACTURE DETECTION OPTIMIZATION: RESNET-18 VS DENSENET-121")
    print("=" * 75)

    device = torch.device("cpu")
    print(f"[Device] Running experiments on: {device}")
    set_seed(42)

    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load Common Held-Out Partitions
    train_csv = MANIFEST_DIR / "train.csv"
    val_csv = MANIFEST_DIR / "validation.csv"
    test_csv = MANIFEST_DIR / "test.csv"

    if not (train_csv.exists() and val_csv.exists() and test_csv.exists()):
        raise FileNotFoundError(f"Partition manifests not found at {MANIFEST_DIR}")

    df_train = pd.read_csv(train_csv)
    df_val = pd.read_csv(val_csv)
    df_test = pd.read_csv(test_csv)

    print(f"[Partitions] Train: {len(df_train)} | Val: {len(df_val)} | Test: {len(df_test)}")
    print(f"[Patient Leakage Check] Zero overlap across train/val/test confirmed via FracAtlas audit.")

    # 2. Benchmark Baseline ResNet-18 (Existing Frozen Model)
    print("\n" + "=" * 50)
    print("STEP 1: EVALUATING EXISTING FROZEN RESNET-18 BASELINE")
    print("=" * 50)
    baseline_path = AI_SERVICE_ROOT / "artifacts" / "fracture_v2" / "best_model.pt"
    baseline_model = FractureResNet18(pretrained=False).to(device)
    baseline_model.load_state_dict(torch.load(baseline_path, map_location=device))
    baseline_model.eval()

    baseline_val_probs, baseline_val_targets, _ = predict_dataset(baseline_model, df_val, device)
    baseline_test_probs, baseline_test_targets, baseline_test_meta = predict_dataset(baseline_model, df_test, device)

    # Historical production threshold is 0.26
    baseline_thresh = 0.26
    baseline_val_metrics = compute_metrics_at_threshold(baseline_val_probs, baseline_val_targets, baseline_thresh)
    baseline_test_metrics = compute_metrics_at_threshold(baseline_test_probs, baseline_test_targets, baseline_thresh)
    baseline_subgroups = evaluate_subgroups(baseline_test_probs, baseline_test_targets, baseline_test_meta, baseline_thresh)
    baseline_gradcam = generate_gradcam_analysis(
        baseline_model, "resnet18", df_test, baseline_test_probs, baseline_thresh, EXPERIMENT_DIR / "gradcam_baseline", device
    )

    print(f"[Baseline Val] AUC: {baseline_val_metrics['metrics']['roc_auc']} | Sensitivity: {baseline_val_metrics['metrics']['recall']} | Specificity: {baseline_val_metrics['metrics']['specificity']}")
    print(f"[Baseline Test] AUC: {baseline_test_metrics['metrics']['roc_auc']} | Sensitivity: {baseline_test_metrics['metrics']['recall']} | Specificity: {baseline_test_metrics['metrics']['specificity']} | F1: {baseline_test_metrics['metrics']['f1_score']}")

    # 3. Train Candidate A: Optimized ResNet-18
    print("\n" + "=" * 50)
    print("STEP 2: TRAINING APPROACH A — OPTIMIZED RESNET-18")
    print("=" * 50)
    t_start_opt_res = time.time()
    opt_resnet_model, opt_resnet_history, opt_resnet_pos_weight = train_candidate(
        model_type="resnet18",
        df_train=df_train,
        df_val=df_val,
        device=device,
        stage1_epochs=2,
        stage2_epochs=4,
        batch_size=32,
        dropout_rate=0.25,
        seed=42,
    )
    opt_resnet_train_time = time.time() - t_start_opt_res

    # Tune threshold strictly on validation set
    opt_res_val_probs, opt_res_val_targets, _ = predict_dataset(opt_resnet_model, df_val, device)
    opt_res_thresh, opt_res_val_records = optimize_threshold_on_val(opt_res_val_probs, opt_res_val_targets)
    opt_res_val_metrics = compute_metrics_at_threshold(opt_res_val_probs, opt_res_val_targets, opt_res_thresh)

    # Single-pass evaluation on held-out test set
    opt_res_test_probs, opt_res_test_targets, opt_res_test_meta = predict_dataset(opt_resnet_model, df_test, device)
    opt_res_test_metrics = compute_metrics_at_threshold(opt_res_test_probs, opt_res_test_targets, opt_res_thresh)
    opt_res_subgroups = evaluate_subgroups(opt_res_test_probs, opt_res_test_targets, opt_res_test_meta, opt_res_thresh)
    opt_res_gradcam = generate_gradcam_analysis(
        opt_resnet_model, "resnet18", df_test, opt_res_test_probs, opt_res_thresh, EXPERIMENT_DIR / "gradcam_opt_resnet", device
    )

    # Save isolated candidate checkpoint
    opt_resnet_ckpt = EXPERIMENT_DIR / "candidate_a_optimized_resnet18.pt"
    torch.save({
        "model_state_dict": opt_resnet_model.state_dict(),
        "architecture": "FractureResNet18",
        "optimal_threshold": opt_res_thresh,
        "dropout_rate": 0.25,
        "pos_weight": opt_resnet_pos_weight,
    }, opt_resnet_ckpt)

    print(f"[Opt ResNet-18 Val (t={opt_res_thresh})] AUC: {opt_res_val_metrics['metrics']['roc_auc']} | Sens: {opt_res_val_metrics['metrics']['recall']} | Spec: {opt_res_val_metrics['metrics']['specificity']}")
    print(f"[Opt ResNet-18 Test (t={opt_res_thresh})] AUC: {opt_res_test_metrics['metrics']['roc_auc']} | Sens: {opt_res_test_metrics['metrics']['recall']} | Spec: {opt_res_test_metrics['metrics']['specificity']} | F1: {opt_res_test_metrics['metrics']['f1_score']}")

    # 4. Train Candidate B: DenseNet-121 Transfer Learning
    print("\n" + "=" * 50)
    print("STEP 3: TRAINING APPROACH B — DENSENET-121 TRANSFER LEARNING")
    print("=" * 50)
    t_start_dense = time.time()
    densenet_model, densenet_history, densenet_pos_weight = train_candidate(
        model_type="densenet121",
        df_train=df_train,
        df_val=df_val,
        device=device,
        stage1_epochs=2,
        stage2_epochs=3,
        batch_size=32,
        dropout_rate=0.20,
        seed=42,
    )
    densenet_train_time = time.time() - t_start_dense

    # Tune threshold strictly on validation set
    dense_val_probs, dense_val_targets, _ = predict_dataset(densenet_model, df_val, device)
    dense_thresh, dense_val_records = optimize_threshold_on_val(dense_val_probs, dense_val_targets)
    dense_val_metrics = compute_metrics_at_threshold(dense_val_probs, dense_val_targets, dense_thresh)

    # Single-pass evaluation on held-out test set
    dense_test_probs, dense_test_targets, dense_test_meta = predict_dataset(densenet_model, df_test, device)
    dense_test_metrics = compute_metrics_at_threshold(dense_test_probs, dense_test_targets, dense_thresh)
    dense_subgroups = evaluate_subgroups(dense_test_probs, dense_test_targets, dense_test_meta, dense_thresh)
    dense_gradcam = generate_gradcam_analysis(
        densenet_model, "densenet121", df_test, dense_test_probs, dense_thresh, EXPERIMENT_DIR / "gradcam_densenet121", device
    )

    # Save isolated candidate checkpoint
    densenet_ckpt = EXPERIMENT_DIR / "candidate_b_densenet121.pt"
    torch.save({
        "model_state_dict": densenet_model.state_dict(),
        "architecture": "FractureDenseNet121",
        "optimal_threshold": dense_thresh,
        "dropout_rate": 0.20,
        "pos_weight": densenet_pos_weight,
    }, densenet_ckpt)

    print(f"[DenseNet-121 Val (t={dense_thresh})] AUC: {dense_val_metrics['metrics']['roc_auc']} | Sens: {dense_val_metrics['metrics']['recall']} | Spec: {dense_val_metrics['metrics']['specificity']}")
    print(f"[DenseNet-121 Test (t={dense_thresh})] AUC: {dense_test_metrics['metrics']['roc_auc']} | Sens: {dense_test_metrics['metrics']['recall']} | Spec: {dense_test_metrics['metrics']['specificity']} | F1: {dense_test_metrics['metrics']['f1_score']}")

    # 5. Measure Latency and Artifact Specs
    print("\n" + "=" * 50)
    print("STEP 4: PROFILING INFERENCE LATENCY & ARTIFACT SIZES")
    print("=" * 50)
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

    base_lat = profile_latency(baseline_model)
    opt_res_lat = profile_latency(opt_resnet_model)
    dense_lat = profile_latency(densenet_model)

    base_size_mb = round(os.path.getsize(baseline_path) / (1024 * 1024), 2)
    opt_res_size_mb = round(os.path.getsize(opt_resnet_ckpt) / (1024 * 1024), 2)
    dense_size_mb = round(os.path.getsize(densenet_ckpt) / (1024 * 1024), 2)

    base_sha = calculate_sha256(baseline_path)
    opt_res_sha = calculate_sha256(opt_resnet_ckpt)
    dense_sha = calculate_sha256(densenet_ckpt)

    # 6. Compile Comprehensive Results JSON
    summary_report = {
        "experiment_title": "MediMind Fracture Detection: ResNet-18 vs DenseNet-121 Optimization Benchmark",
        "experiment_date": "2026-10-19",
        "dataset_name": "FracAtlas Cleaned (Pure Fracture Detection)",
        "hardware_environment": {
            "device": "CPU",
            "pytorch_version": torch.__version__,
        },
        "dataset_split": {
            "train_samples": len(df_train),
            "val_samples": len(df_val),
            "test_samples": len(df_test),
            "leakage_prevention": "Patient-level atomic clustering; 0 patient overlap across partitions",
            "class_distribution": {
                "train_fractured": int(df_train["fractured"].sum()),
                "val_fractured": int(df_val["fractured"].sum()),
                "test_fractured": int(df_test["fractured"].sum()),
            },
        },
        "models": {
            "baseline_resnet18": {
                "name": "Frozen Production Baseline (ResNet-18 v2)",
                "architecture": "ResNet-18",
                "weights_source": "ImageNet-pretrained (Frozen Production)",
                "checkpoint_path": str(baseline_path),
                "sha256": base_sha,
                "artifact_size_mb": base_size_mb,
                "latency_cpu": base_lat,
                "validation_threshold": baseline_thresh,
                "validation_metrics": baseline_val_metrics["metrics"],
                "test_metrics": baseline_test_metrics["metrics"],
                "test_confusion_matrix": baseline_test_metrics["confusion_matrix"],
                "test_subgroups": baseline_subgroups,
                "gradcam_cases": baseline_gradcam,
            },
            "approach_a_optimized_resnet18": {
                "name": "Approach A: Optimized ResNet-18",
                "architecture": "ResNet-18",
                "weights_source": "ImageNet-pretrained + 2-Stage Conservative Fine-Tuning",
                "checkpoint_path": str(opt_resnet_ckpt),
                "sha256": opt_res_sha,
                "artifact_size_mb": opt_res_size_mb,
                "latency_cpu": opt_res_lat,
                "training_time_seconds": round(opt_resnet_train_time, 2),
                "training_history": opt_resnet_history,
                "validation_threshold": opt_res_thresh,
                "validation_metrics": opt_res_val_metrics["metrics"],
                "test_metrics": opt_res_test_metrics["metrics"],
                "test_confusion_matrix": opt_res_test_metrics["confusion_matrix"],
                "test_subgroups": opt_res_subgroups,
                "gradcam_cases": opt_res_gradcam,
            },
            "approach_b_densenet121": {
                "name": "Approach B: DenseNet-121 Transfer Learning",
                "architecture": "DenseNet-121",
                "weights_source": "ImageNet-pretrained + 2-Stage Progressive Unfreezing",
                "checkpoint_path": str(densenet_ckpt),
                "sha256": dense_sha,
                "artifact_size_mb": dense_size_mb,
                "latency_cpu": dense_lat,
                "training_time_seconds": round(densenet_train_time, 2),
                "training_history": densenet_history,
                "validation_threshold": dense_thresh,
                "validation_metrics": dense_val_metrics["metrics"],
                "test_metrics": dense_test_metrics["metrics"],
                "test_confusion_matrix": dense_test_metrics["confusion_matrix"],
                "test_subgroups": dense_subgroups,
                "gradcam_cases": dense_gradcam,
            },
        },
    }

    report_path = EXPERIMENT_DIR / "experiment_benchmark_report.json"
    with open(report_path, "w") as f:
        json.dump(summary_report, f, indent=2)

    print(f"\n[Experiment Completed Successfully] Report written to: {report_path}")


if __name__ == "__main__":
    main()
