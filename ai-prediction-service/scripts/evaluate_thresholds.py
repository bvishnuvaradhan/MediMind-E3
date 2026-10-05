"""
Threshold Calibration & Operating-Point Analysis for Combined Fracture CNN (Experiment 2)
"""

import os
import sys
import json
import torch
import numpy as np
import pandas as pd
from PIL import Image, ImageFile
from torchvision import transforms

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sklearn.metrics import (
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
)
from app.models.fracture_v2.model import FractureResNet18

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


def compute_metrics_for_subset(probs, targets, threshold):
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


def run_threshold_analysis():
    print("=" * 60)
    print("RUNNING THRESHOLD CALIBRATION ANALYSIS (COMBINED MODEL v2)")
    print("=" * 60)

    checkpoint_path = r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined\best_model.pt"
    test_manifest_path = r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined\manifests\test.csv"
    output_dir = r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined\threshold_analysis"
    os.makedirs(output_dir, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Device] Running on: {device}")

    # Load Model
    model = FractureResNet18(pretrained=False).to(device)
    model.load_state_dict(torch.load(checkpoint_path, map_location=device))
    model.eval()

    # Load Test Manifest
    df_test = pd.read_csv(test_manifest_path)
    print(f"Loaded test samples: {len(df_test)}")

    # Preprocessing
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    probs_list = []
    targets_list = []

    print("\n[Inference] Generating test probabilities...")
    with torch.no_grad():
        for idx, row in df_test.iterrows():
            img_path = row["file_path"]
            img = Image.open(img_path).convert("RGB")
            tensor = eval_transform(img).unsqueeze(0).to(device)
            logit = model(tensor)
            prob = torch.sigmoid(logit).item()
            probs_list.append(prob)
            targets_list.append(int(row["fractured"]))

    probs = np.array(probs_list)
    targets = np.array(targets_list)
    df_test["model_prob"] = probs

    # Fixed ROC-AUC & PR-AUC
    overall_roc_auc = round(float(roc_auc_score(targets, probs)), 4)
    p_prec, p_rec, _ = precision_recall_curve(targets, probs)
    overall_pr_auc = round(float(auc(p_rec, p_prec)), 4)
    overall_brier = round(float(brier_score_loss(targets, probs)), 4)
    overall_ece = round(calculate_ece(probs, targets), 4)

    fa_mask = (df_test["dataset"] == "FracAtlas").values
    graz_mask = (df_test["dataset"] == "GRAZPEDWRI-DX").values

    fa_targets = targets[fa_mask]
    fa_probs = probs[fa_mask]
    fa_roc_auc = round(float(roc_auc_score(fa_targets, fa_probs)), 4)
    p_fa_prec, p_fa_rec, _ = precision_recall_curve(fa_targets, fa_probs)
    fa_pr_auc = round(float(auc(p_fa_rec, p_fa_prec)), 4)

    graz_targets = targets[graz_mask]
    graz_probs = probs[graz_mask]
    graz_roc_auc = round(float(roc_auc_score(graz_targets, graz_probs)), 4)
    p_gr_prec, p_gr_rec, _ = precision_recall_curve(graz_targets, graz_probs)
    graz_pr_auc = round(float(auc(p_gr_rec, p_gr_prec)), 4)

    # Baseline false negatives at threshold 0.37
    baseline_threshold = 0.37
    baseline_fn_indices = set(np.where((targets == 1) & (probs < baseline_threshold))[0])
    print(f"\nBaseline False Negatives at threshold 0.37: {len(baseline_fn_indices)}")

    thresholds = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.37, 0.40, 0.45, 0.50]
    comparison_rows = []
    full_report = {
        "analysis_title": "Threshold Calibration & Operating-Point Analysis for Combined Fracture CNN (Experiment 2)",
        "model_checkpoint": checkpoint_path,
        "test_dataset_size": len(df_test),
        "total_fractures": int(np.sum(targets == 1)),
        "total_non_fractures": int(np.sum(targets == 0)),
        "fracatlas_test_count": int(np.sum(fa_mask)),
        "fracatlas_fractures": int(np.sum(fa_targets == 1)),
        "graz_test_count": int(np.sum(graz_mask)),
        "graz_fractures": int(np.sum(graz_targets == 1)),
        "threshold_independent_metrics": {
            "overall_roc_auc": overall_roc_auc,
            "overall_pr_auc": overall_pr_auc,
            "overall_brier_score": overall_brier,
            "overall_ece": overall_ece,
            "fracatlas_roc_auc": fa_roc_auc,
            "fracatlas_pr_auc": fa_pr_auc,
            "graz_roc_auc": graz_roc_auc,
            "graz_pr_auc": graz_pr_auc,
        },
        "threshold_evaluations": {}
    }

    for t in thresholds:
        overall_m = compute_metrics_for_subset(probs, targets, t)
        fa_m = compute_metrics_for_subset(fa_probs, fa_targets, t)
        graz_m = compute_metrics_for_subset(graz_probs, graz_targets, t)

        current_fn_indices = set(np.where((targets == 1) & (probs < t))[0])
        recovered_fn_count = len(baseline_fn_indices - current_fn_indices) if t < baseline_threshold else 0
        new_fn_count = len(current_fn_indices - baseline_fn_indices) if t > baseline_threshold else 0

        # Detailed breakdown of recovered false negatives
        recovered_details = []
        if recovered_fn_count > 0:
            for idx in (baseline_fn_indices - current_fn_indices):
                r = df_test.iloc[idx]
                recovered_details.append({
                    "image_id": r["image_id"],
                    "dataset": r["dataset"],
                    "anatomy": r.get("anatomy", "unknown"),
                    "model_probability": round(float(r["model_prob"]), 4),
                })

        thresh_key = f"threshold_{t:.2f}"
        full_report["threshold_evaluations"][thresh_key] = {
            "threshold": t,
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
            "grazpedwri_pediatric_subset": {
                **graz_m,
                "roc_auc": graz_roc_auc,
                "pr_auc": graz_pr_auc,
            },
            "clinical_tradeoffs": {
                "adult_false_negatives": fa_m["fn"],
                "pediatric_false_positives": graz_m["fp"],
                "baseline_fn_recovered": recovered_fn_count,
                "new_fn_introduced": new_fn_count,
            },
            "recovered_false_negatives_sample": recovered_details[:5]
        }

        comparison_rows.append({
            "threshold": t,
            "overall_recall": overall_m["recall"],
            "overall_specificity": overall_m["specificity"],
            "overall_precision": overall_m["precision"],
            "overall_npv": overall_m["npv"],
            "overall_f1": overall_m["f1_score"],
            "overall_tp": overall_m["tp"],
            "overall_fp": overall_m["fp"],
            "overall_tn": overall_m["tn"],
            "overall_fn": overall_m["fn"],
            "adult_recall": fa_m["recall"],
            "adult_specificity": fa_m["specificity"],
            "adult_precision": fa_m["precision"],
            "adult_npv": fa_m["npv"],
            "adult_f1": fa_m["f1_score"],
            "adult_fn": fa_m["fn"],
            "pediatric_recall": graz_m["recall"],
            "pediatric_specificity": graz_m["specificity"],
            "pediatric_precision": graz_m["precision"],
            "pediatric_npv": graz_m["npv"],
            "pediatric_f1": graz_m["f1_score"],
            "pediatric_fp": graz_m["fp"],
            "baseline_fn_recovered": recovered_fn_count,
        })

    df_comparison = pd.DataFrame(comparison_rows)
    csv_path = os.path.join(output_dir, "threshold_comparison_table.csv")
    df_comparison.to_csv(csv_path, index=False)

    json_path = os.path.join(output_dir, "threshold_analysis_report.json")
    with open(json_path, "w") as f:
        json.dump(full_report, f, indent=2)

    print(f"\n[Saved] CSV Comparison Table -> {csv_path}")
    print(f"[Saved] JSON Analysis Report -> {json_path}")

    # Print summary table
    print("\n" + "=" * 100)
    print("THRESHOLD CALIBRATION SUMMARY TABLE")
    print("=" * 100)
    print(df_comparison[["threshold", "overall_recall", "overall_specificity", "overall_f1", "adult_recall", "adult_specificity", "adult_fn", "pediatric_recall", "pediatric_specificity", "pediatric_fp", "baseline_fn_recovered"]].to_string(index=False))
    print("=" * 100)


if __name__ == "__main__":
    run_threshold_analysis()
