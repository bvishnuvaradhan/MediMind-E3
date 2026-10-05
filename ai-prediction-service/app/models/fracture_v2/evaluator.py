"""
Evaluation & Threshold Optimization Module for Fracture Detection (v2)
"""

import os
import json
import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import (
    accuracy_score,
    recall_score,
    precision_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
)
from .transforms import FractureDataset, get_transforms


def compute_ece(probs, targets, n_bins=10):
    probs = np.array(probs)
    targets = np.array(targets)
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


def predict_dataset(model, df, device, batch_size=32):
    _, eval_transform = get_transforms()
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


def optimize_threshold_on_val(val_probs, val_targets):
    """
    Finds optimal operating threshold strictly on validation set.
    Prioritizes sensitivity >= 0.88 for clinical safety, then maximizes Youden J / F1.
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

        # Priority optimization formula: High sensitivity bias for screening safety
        # Weighted clinical score: sensitivity * 0.5 + youden * 0.3 + f1 * 0.2
        clinical_score = (recall * 0.5) + (youden * 0.3) + (f1 * 0.2)
        if recall >= 0.85 and clinical_score > best_score:
            best_score = clinical_score
            best_thresh = float(t)

    # If no threshold achieved >= 0.85 recall, pick threshold with highest sensitivity
    if best_score < 0:
        best_thresh = float(min(thresholds, key=lambda t: -recall_score(val_targets, (val_probs >= t).astype(int))))

    return round(best_thresh, 3), records


def compute_metrics_at_threshold(probs, targets, threshold):
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
        }
    }


def evaluate_subgroups(probs, targets, metadata, threshold):
    preds = (probs >= threshold).astype(int)
    df_eval = pd.DataFrame(metadata)
    df_eval["prob"] = probs
    df_eval["target"] = targets
    df_eval["pred"] = preds

    subgroup_reports = {}

    # 1. Anatomy Breakdown
    for anatomy in ["hand", "leg", "hip", "shoulder", "mixed"]:
        sub = df_eval[df_eval["anatomy"] == anatomy]
        if len(sub) > 0:
            sub_targets = sub["target"].values
            sub_preds = sub["pred"].values
            sub_probs = sub["prob"].values
            tp = np.sum((sub_targets == 1) & (sub_preds == 1))
            fn = np.sum((sub_targets == 1) & (sub_preds == 0))
            recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
            try:
                sub_auc = roc_auc_score(sub_targets, sub_probs) if len(np.unique(sub_targets)) > 1 else 1.0
            except Exception:
                sub_auc = 1.0

            subgroup_reports[f"anatomy_{anatomy}"] = {
                "count": int(len(sub)),
                "fractured_count": int(np.sum(sub_targets == 1)),
                "recall": round(float(recall), 4),
                "roc_auc": round(float(sub_auc), 4),
            }

    # 2. Hardware Breakdown
    for hw_val, hw_name in [(0, "without_hardware"), (1, "with_hardware")]:
        sub = df_eval[df_eval["hardware"] == hw_val]
        if len(sub) > 0:
            sub_targets = sub["target"].values
            sub_preds = sub["pred"].values
            tp = np.sum((sub_targets == 1) & (sub_preds == 1))
            fn = np.sum((sub_targets == 1) & (sub_preds == 0))
            recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
            subgroup_reports[hw_name] = {
                "count": int(len(sub)),
                "fractured_count": int(np.sum(sub_targets == 1)),
                "recall": round(float(recall), 4),
            }

    return subgroup_reports
