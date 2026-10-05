"""
Validation Threshold Sweep & Test Evaluation Module for Experiment 3
"""

import os
import json
import torch
import numpy as np
import pandas as pd
from PIL import Image, ImageFile
from torchvision import transforms
from sklearn.metrics import (
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
)

ImageFile.LOAD_TRUNCATED_IMAGES = True


def calculate_ece(probs, targets, n_bins=10):
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        mask = (probs > bin_lower) & (probs <= bin_upper)
        if i == 0:
            mask = (probs >= bin_lower) & (probs <= bin_upper)
        bin_size = np.sum(mask)
        if bin_size > 0:
            bin_acc = np.mean(targets[mask])
            bin_conf = np.mean(probs[mask])
            ece += (bin_size / len(probs)) * np.abs(bin_acc - bin_conf)
    return float(ece)


def compute_metrics(probs, targets, threshold):
    preds = (probs >= threshold).astype(int)
    cm = confusion_matrix(targets, preds, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()

    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    npv = float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    acc = float((tp + tn) / len(targets)) if len(targets) > 0 else 0.0

    return {
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
        "accuracy": round(acc, 4),
        "recall": round(recall, 4),
        "sensitivity": round(recall, 4),
        "specificity": round(specificity, 4),
        "precision": round(precision, 4),
        "ppv": round(precision, 4),
        "npv": round(npv, 4),
        "f1_score": round(f1, 4),
    }


def predict_dataset_exp3(model, df, device, batch_size=32):
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    model.eval()
    probs = []
    targets = []

    with torch.no_grad():
        for i in range(0, len(df), batch_size):
            batch_df = df.iloc[i:i+batch_size]
            tensors = []
            for _, row in batch_df.iterrows():
                img = Image.open(row["file_path"]).convert("RGB")
                tensors.append(eval_transform(img))
            batch_tensor = torch.stack(tensors).to(device)
            logits = model(batch_tensor).squeeze(-1)
            batch_probs = torch.sigmoid(logits).cpu().numpy()
            probs.extend(batch_probs.tolist() if isinstance(batch_probs, np.ndarray) and batch_probs.ndim > 0 else [float(batch_probs)])
            targets.extend(batch_df["fractured"].astype(int).tolist())

    return np.array(probs), np.array(targets)


def run_validation_threshold_optimization(model, df_val, device, output_dir):
    print("=" * 60)
    print("RUNNING VALIDATION THRESHOLD OPTIMIZATION (EXPERIMENT 3)")
    print("=" * 60)

    val_probs, val_targets = predict_dataset_exp3(model, df_val, device)
    fa_val_mask = (df_val["dataset"] == "FracAtlas").values
    graz_val_mask = (df_val["dataset"] == "GRAZPEDWRI-DX").values

    thresholds = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.37, 0.40, 0.45, 0.50]
    val_rows = []
    val_json_report = {}

    best_threshold = 0.25
    best_score = -1.0

    for t in thresholds:
        overall = compute_metrics(val_probs, val_targets, t)
        fa_sub = compute_metrics(val_probs[fa_val_mask], val_targets[fa_val_mask], t)
        graz_sub = compute_metrics(val_probs[graz_val_mask], val_targets[graz_val_mask], t)

        # Optimization objective: High overall recall (>94%), high adult recall (>80%), maximize pediatric specificity
        screening_score = (overall["recall"] * 0.4) + (fa_sub["recall"] * 0.35) + (graz_sub["specificity"] * 0.25)

        val_rows.append({
            "threshold": t,
            "overall_recall": overall["recall"],
            "overall_specificity": overall["specificity"],
            "overall_f1": overall["f1_score"],
            "adult_recall": fa_sub["recall"],
            "adult_specificity": fa_sub["specificity"],
            "adult_fn": fa_sub["fn"],
            "pediatric_recall": graz_sub["recall"],
            "pediatric_specificity": graz_sub["specificity"],
            "pediatric_fp": graz_sub["fp"],
            "screening_score": round(screening_score, 4),
        })

        val_json_report[f"threshold_{t:.2f}"] = {
            "threshold": t,
            "overall": overall,
            "fracatlas_adult": fa_sub,
            "graz_pediatric": graz_sub,
            "screening_score": round(screening_score, 4),
        }

        if screening_score > best_score:
            best_score = screening_score
            best_threshold = t

    df_val_comparison = pd.DataFrame(val_rows)
    csv_path = os.path.join(output_dir, "validation_threshold_analysis.csv")
    json_path = os.path.join(output_dir, "validation_threshold_analysis.json")
    df_val_comparison.to_csv(csv_path, index=False)
    with open(json_path, "w") as f:
        json.dump(val_json_report, f, indent=2)

    print(f"Optimal Validation-Selected Threshold: {best_threshold} (Screening Score: {best_score:.4f})")
    print(df_val_comparison.to_string(index=False))

    return best_threshold, df_val_comparison, val_json_report


def run_final_test_evaluation(model, df_test, threshold, device, output_dir):
    print("=" * 60)
    print(f"RUNNING FINAL TEST EVALUATION AT FROZEN THRESHOLD ({threshold})")
    print("=" * 60)

    test_probs, test_targets = predict_dataset_exp3(model, df_test, device)
    fa_test_mask = (df_test["dataset"] == "FracAtlas").values
    graz_test_mask = (df_test["dataset"] == "GRAZPEDWRI-DX").values

    # Fixed ROC-AUC and PR-AUC
    overall_roc_auc = round(float(roc_auc_score(test_targets, test_probs)), 4)
    p_prec, p_rec, _ = precision_recall_curve(test_targets, test_probs)
    overall_pr_auc = round(float(auc(p_rec, p_prec)), 4)
    overall_brier = round(float(brier_score_loss(test_targets, test_probs)), 4)
    overall_ece = round(calculate_ece(test_probs, test_targets), 4)

    fa_targets = test_targets[fa_test_mask]
    fa_probs = test_probs[fa_test_mask]
    fa_roc_auc = round(float(roc_auc_score(fa_targets, fa_probs)), 4)
    p_fa_prec, p_fa_rec, _ = precision_recall_curve(fa_targets, fa_probs)
    fa_pr_auc = round(float(auc(p_fa_rec, p_fa_prec)), 4)

    graz_targets = test_targets[graz_test_mask]
    graz_probs = test_probs[graz_test_mask]
    graz_roc_auc = round(float(roc_auc_score(graz_targets, graz_probs)), 4)
    p_gr_prec, p_gr_rec, _ = precision_recall_curve(graz_targets, graz_probs)
    graz_pr_auc = round(float(auc(p_gr_rec, p_gr_prec)), 4)

    overall_m = compute_metrics(test_probs, test_targets, threshold)
    fa_m = compute_metrics(fa_probs, fa_targets, threshold)
    graz_m = compute_metrics(graz_probs, graz_targets, threshold)

    test_results = {
        "experiment": "Experiment 3: Targeted Pediatric-Bias Fine-Tuning",
        "frozen_threshold": threshold,
        "test_dataset_size": len(df_test),
        "overall": {
            **overall_m,
            "roc_auc": overall_roc_auc,
            "pr_auc": overall_pr_auc,
            "brier_score": overall_brier,
            "expected_calibration_error": overall_ece,
        },
        "fracatlas_adult_subset": {
            **fa_m,
            "roc_auc": fa_roc_auc,
            "pr_auc": fa_pr_auc,
        },
        "graz_pediatric_subset": {
            **graz_m,
            "roc_auc": graz_roc_auc,
            "pr_auc": graz_pr_auc,
        },
        "confusion_matrix": {
            "overall": overall_m,
            "adult": fa_m,
            "pediatric": graz_m,
        }
    }

    out_path = os.path.join(output_dir, "test_results.json")
    with open(out_path, "w") as f:
        json.dump(test_results, f, indent=2)

    print(f"\n[Saved] Final Test Results -> {out_path}")
    print(json.dumps(test_results, indent=2))
    return test_results, test_probs
