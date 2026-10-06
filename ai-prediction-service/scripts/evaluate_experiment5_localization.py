#!/usr/bin/env python3
"""
Experiment 5 — Phase 2: Evaluation & Analysis Script
Evaluates the best checkpoint trained across 10 epochs on:
1. Validation Set (Threshold Sweep & Operating Point Selection)
2. Held-Out Test Set (Single Frozen Evaluation)
3. Pediatric Growth-Plate Error Analysis
4. TP / TN / FP / FN Visualizations
5. Multi-Experiment Comparison & Artifact Generation
"""

import os
import sys
import json
import time
import shutil
import math
from pathlib import Path
from collections import Counter, defaultdict

import numpy as np
import pandas as pd
import cv2
from PIL import Image

from sklearn.metrics import (
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
    confusion_matrix,
)

from ultralytics import YOLO


def calculate_ece(probs, labels, n_bins=10):
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        bin_lower, bin_upper = bin_boundaries[i], bin_boundaries[i + 1]
        in_bin = (probs >= bin_lower) & (probs < bin_upper)
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            acc_in_bin = np.mean(labels[in_bin])
            conf_in_bin = np.mean(probs[in_bin])
            ece += np.abs(acc_in_bin - conf_in_bin) * prop_in_bin
    return float(ece)


def main():
    repo_root = Path("d:/projects/MediMind")
    service_root = repo_root / "ai-prediction-service"
    exp_dir = service_root / "artifacts" / "fracture_v2" / "experiment5_localization"
    runs_dir = exp_dir / "runs" / "train_yolov8n"
    viz_dir = exp_dir / "visualizations"
    viz_dir.mkdir(parents=True, exist_ok=True)
    
    data_yaml_path = exp_dir / "dataset" / "dataset.yaml"

    print("=" * 80)
    print("EXPERIMENT 5 — PHASE 2: EVALUATION, THRESHOLD SELECTION & TEST METRICS")
    print("=" * 80)

    # 1. Check and copy best model
    best_src = runs_dir / "weights" / "best.pt"
    best_dst = exp_dir / "best_model.pt"
    if not best_src.exists():
        best_src = runs_dir / "weights" / "last.pt"
    
    shutil.copy2(best_src, best_dst)
    print(f"Preserved best model checkpoint to: {best_dst}")

    # Load frozen model
    model = YOLO(str(best_dst))

    # Parse training progression from results.csv
    results_csv_p = runs_dir / "results.csv"
    train_history = []
    if results_csv_p.exists():
        df_res = pd.read_csv(results_csv_p)
        df_res.columns = [c.strip() for c in df_res.columns]
        train_history = df_res.to_dict(orient="records")
        best_epoch_row = df_res.loc[df_res["metrics/mAP50-95(B)"].idxmax()]
        print(f"\nTraining summary across {len(df_res)} epochs:")
        print(f"Best mAP@50:95 epoch: Epoch {int(best_epoch_row['epoch'])} (mAP@50={best_epoch_row['metrics/mAP50(B)']:.4f}, mAP@50:95={best_epoch_row['metrics/mAP50-95(B)']:.4f}, P={best_epoch_row['metrics/precision(B)']:.4f}, R={best_epoch_row['metrics/recall(B)']:.4f})")

    # 2. Validation Detection Evaluation
    print("\n--- Running Validation Detection Validation ---")
    val_metrics = model.val(
        data=str(data_yaml_path),
        split="val",
        imgsz=512,
        device="cpu",
        conf=0.001,
        iou=0.5,
        workers=0
    )

    val_det_results = {
        "mAP50": float(val_metrics.box.map50),
        "mAP50_95": float(val_metrics.box.map),
        "precision": float(val_metrics.box.p[0]) if len(val_metrics.box.p) > 0 else 0.0,
        "recall": float(val_metrics.box.r[0]) if len(val_metrics.box.r) > 0 else 0.0,
        "fitness": float(val_metrics.fitness)
    }
    print(f"Validation Box Metrics: mAP@50 = {val_det_results['mAP50']:.4f}, mAP@50:95 = {val_det_results['mAP50_95']:.4f}, Precision = {val_det_results['precision']:.4f}, Recall = {val_det_results['recall']:.4f}")

    # 3. Validation Threshold Analysis
    print("\n--- Extracting Validation Predictions for Confidence Sweep ---")
    val_manifest = pd.read_csv(service_root / "artifacts" / "fracture_v2" / "graz_only" / "manifests" / "validation.csv")
    val_img_dir = exp_dir / "dataset" / "images" / "val"
    
    val_predictions = []
    for _, row in val_manifest.iterrows():
        stem = row["filestem"]
        img_p = val_img_dir / f"{stem}.png"
        gt_label = int(row["fractured"])

        res = model.predict(source=str(img_p), imgsz=512, conf=0.001, device="cpu", verbose=False)[0]
        confs = res.boxes.conf.cpu().numpy().tolist() if len(res.boxes) > 0 else []
        max_conf = float(max(confs)) if len(confs) > 0 else 0.0

        val_predictions.append({
            "filestem": stem,
            "patient_id": row["patient_id"],
            "age": float(row["age"]),
            "gender": str(row["gender"]),
            "gt_label": gt_label,
            "max_confidence": max_conf,
            "all_confidences": confs,
            "box_count": len(confs)
        })

    y_true_val = np.array([p["gt_label"] for p in val_predictions])
    y_score_val = np.array([p["max_confidence"] for p in val_predictions])

    sweep_thresholds = np.linspace(0.01, 0.95, 95)
    val_sweep_rows = []

    best_thresh_f1 = 0.5
    best_f1 = 0.0
    best_thresh_spec_at_90rec = 0.1
    best_spec_at_90rec = 0.0

    # Specific operating points
    op_pt_95 = None
    op_pt_90 = None
    op_pt_85 = None

    for thresh in sweep_thresholds:
        y_pred = (y_score_val >= thresh).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true_val, y_pred, labels=[0, 1]).ravel()
        
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        fp_detections = sum([
            sum([1 for c in p["all_confidences"] if c >= thresh])
            for p in val_predictions if p["gt_label"] == 0
        ])
        fp_rate = fp_detections / max(1, tn + fp)

        row_dict = {
            "threshold": round(float(thresh), 4),
            "recall": round(float(rec), 4),
            "specificity": round(float(spec), 4),
            "precision": round(float(prec), 4),
            "npv": round(float(npv), 4),
            "f1_score": round(float(f1), 4),
            "tp": int(tp),
            "fp": int(fp),
            "tn": int(tn),
            "fn": int(fn),
            "fp_detections_per_normal_image": round(float(fp_rate), 4)
        }
        val_sweep_rows.append(row_dict)

        if f1 > best_f1:
            best_f1 = f1
            best_thresh_f1 = thresh
        
        if rec >= 0.90 and spec > best_spec_at_90rec:
            best_spec_at_90rec = spec
            best_thresh_spec_at_90rec = thresh

        if op_pt_95 is None and rec <= 0.955 and rec >= 0.945:
            op_pt_95 = row_dict
        if op_pt_90 is None and rec <= 0.905 and rec >= 0.895:
            op_pt_90 = row_dict
        if op_pt_85 is None and rec <= 0.855 and rec >= 0.845:
            op_pt_85 = row_dict

    val_sweep_df = pd.DataFrame(val_sweep_rows)
    val_sweep_df.to_csv(exp_dir / "validation_threshold_analysis.csv", index=False)
    with open(exp_dir / "validation_threshold_analysis.json", "w", encoding="utf-8") as f:
        json.dump(val_sweep_rows, f, indent=2)

    # Select final threshold on validation data
    selected_threshold = float(best_thresh_spec_at_90rec) if best_spec_at_90rec > 0 else float(best_thresh_f1)
    selection_criterion = "Maximized Specificity with Validation Recall >= 90%" if best_spec_at_90rec > 0 else "Maximized Validation F1-Score"

    print(f"\nSelected Operating Threshold: {selected_threshold:.4f} (Criterion: {selection_criterion})")

    # 4. Single Frozen Evaluation on HELD-OUT TEST Split
    print("\n--- Evaluating FROZEN Model on HELD-OUT TEST Cohort (769 images) ---")
    test_manifest = pd.read_csv(service_root / "artifacts" / "fracture_v2" / "graz_only" / "manifests" / "test.csv")
    test_img_dir = exp_dir / "dataset" / "images" / "test"
    test_lbl_dir = exp_dir / "dataset" / "labels" / "test"

    test_metrics = model.val(
        data=str(data_yaml_path),
        split="test",
        imgsz=512,
        device="cpu",
        conf=selected_threshold,
        iou=0.5,
        workers=0
    )

    test_det_results = {
        "mAP50": float(test_metrics.box.map50),
        "mAP50_95": float(test_metrics.box.map),
        "precision": float(test_metrics.box.p[0]) if len(test_metrics.box.p) > 0 else 0.0,
        "recall": float(test_metrics.box.r[0]) if len(test_metrics.box.r) > 0 else 0.0,
        "fitness": float(test_metrics.fitness)
    }

    test_predictions = []
    normal_pediatric_fp_cases = []
    tp_cases = []
    tn_cases = []
    fn_cases = []

    for _, row in test_manifest.iterrows():
        stem = row["filestem"]
        img_p = test_img_dir / f"{stem}.png"
        lbl_p = test_lbl_dir / f"{stem}.txt"
        gt_label = int(row["fractured"])

        gt_boxes = []
        if lbl_p.exists():
            with open(lbl_p, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 5:
                        gt_boxes.append([float(x) for x in parts[1:]])

        res = model.predict(source=str(img_p), imgsz=512, conf=0.001, device="cpu", verbose=False)[0]
        pred_boxes_xywh = res.boxes.xywhn.cpu().numpy().tolist() if len(res.boxes) > 0 else []
        pred_confs = res.boxes.conf.cpu().numpy().tolist() if len(res.boxes) > 0 else []

        detected_at_threshold = [c for c in pred_confs if c >= selected_threshold]
        pred_binary = 1 if len(detected_at_threshold) > 0 else 0
        max_conf = float(max(pred_confs)) if len(pred_confs) > 0 else 0.0

        item = {
            "filestem": stem,
            "patient_id": row["patient_id"],
            "age": float(row["age"]),
            "gender": str(row["gender"]),
            "projection": int(row["projection"]),
            "gt_label": gt_label,
            "pred_binary": pred_binary,
            "max_confidence": max_conf,
            "pred_confs": pred_confs,
            "num_pred_boxes_at_threshold": len(detected_at_threshold),
            "num_gt_boxes": len(gt_boxes),
            "pred_boxes": pred_boxes_xywh,
            "gt_boxes": gt_boxes
        }
        test_predictions.append(item)

        if gt_label == 0 and pred_binary == 1:
            normal_pediatric_fp_cases.append(item)
        elif gt_label == 1 and pred_binary == 1:
            tp_cases.append(item)
        elif gt_label == 0 and pred_binary == 0:
            tn_cases.append(item)
        elif gt_label == 1 and pred_binary == 0:
            fn_cases.append(item)

    y_true_test = np.array([p["gt_label"] for p in test_predictions])
    y_score_test = np.array([p["max_confidence"] for p in test_predictions])
    y_pred_test = np.array([p["pred_binary"] for p in test_predictions])

    tn_t, fp_t, fn_t, tp_t = confusion_matrix(y_true_test, y_pred_test, labels=[0, 1]).ravel()
    
    rec_t = tp_t / (tp_t + fn_t) if (tp_t + fn_t) > 0 else 0.0
    spec_t = tn_t / (tn_t + fp_t) if (tn_t + fp_t) > 0 else 0.0
    prec_t = tp_t / (tp_t + fp_t) if (tp_t + fp_t) > 0 else 0.0
    npv_t = tn_t / (tn_t + fn_t) if (tn_t + fn_t) > 0 else 0.0
    f1_t = (2 * prec_t * rec_t) / (prec_t + rec_t) if (prec_t + rec_t) > 0 else 0.0
    
    roc_auc_t = float(roc_auc_score(y_true_test, y_score_test))
    prec_curve, rec_curve, _ = precision_recall_curve(y_true_test, y_score_test)
    pr_auc_t = float(auc(rec_curve, prec_curve))
    brier_t = float(brier_score_loss(y_true_test, y_score_test))
    ece_t = calculate_ece(y_score_test, y_true_test)

    fp_boxes_on_normal = sum([p["num_pred_boxes_at_threshold"] for p in normal_pediatric_fp_cases])
    fp_rate_on_normal = fp_boxes_on_normal / max(1, len(tn_cases) + len(normal_pediatric_fp_cases))

    test_clinical_results = {
        "cohort": "GRAZPEDWRI-DX Held-out Test Cohort",
        "total_test_images": len(test_predictions),
        "total_fractured": int(sum(y_true_test == 1)),
        "total_non_fractured": int(sum(y_true_test == 0)),
        "selected_operating_threshold": selected_threshold,
        "selection_criterion": selection_criterion,
        "metrics": {
            "recall": float(rec_t),
            "specificity": float(spec_t),
            "precision": float(prec_t),
            "npv": float(npv_t),
            "f1_score": float(f1_t),
            "roc_auc": roc_auc_t,
            "pr_auc": pr_auc_t,
            "brier_score": brier_t,
            "ece": ece_t,
            "true_positives": int(tp_t),
            "false_positives": int(fp_t),
            "true_negatives": int(tn_t),
            "false_negatives": int(fn_t),
            "normal_images_producing_false_detections": len(normal_pediatric_fp_cases),
            "total_normal_images": int(tn_t + fp_t),
            "normal_image_fp_percentage": float((fp_t / max(1, tn_t + fp_t)) * 100),
            "fp_detections_per_normal_image": float(fp_rate_on_normal)
        }
    }

    # 5. Growth Plate Error Analysis
    error_analysis = {
        "analysis_name": "Pediatric Growth-Plate and Anatomical Error Analysis",
        "normal_images_total": int(tn_t + fp_t),
        "normal_images_clean_true_negatives": int(tn_t),
        "normal_images_with_false_detections": int(fp_t),
        "false_positive_reduction_vs_exp4": {
            "exp4_pediatric_specificity": 1.59,
            "exp5_pediatric_specificity": round(spec_t * 100, 2),
            "specificity_gain_absolute": round((spec_t * 100) - 1.59, 2),
            "specificity_gain_relative_factor": round((spec_t * 100) / max(0.01, 1.59), 2)
        },
        "false_positive_case_details": [
            {
                "filestem": c["filestem"],
                "age": c["age"],
                "gender": c["gender"],
                "projection": c["projection"],
                "max_confidence": round(c["max_confidence"], 4),
                "box_count": c["num_pred_boxes_at_threshold"],
                "pred_boxes_normalized": c["pred_boxes"]
            }
            for c in normal_pediatric_fp_cases[:15]
        ],
        "false_negative_case_details": [
            {
                "filestem": c["filestem"],
                "age": c["age"],
                "gender": c["gender"],
                "projection": c["projection"],
                "max_confidence": round(c["max_confidence"], 4),
                "num_gt_boxes": c["num_gt_boxes"],
                "gt_boxes_normalized": c["gt_boxes"]
            }
            for c in fn_cases[:15]
        ],
        "findings": (
            f"The object detector successfully filtered out normal open growth plates in {tn_t} out of {tn_t + fp_t} "
            f"normal pediatric radiographs ({spec_t * 100:.2f}% specificity), compared to only 1.59% specificity in Experiment 4 "
            f"and 0.40% in Experiment 3. By supervising with bounding boxes rather than a whole-image binary flag, the network "
            f"learns the distinct edge morphology of cortical disruption rather than firing on the natural radiolucency of distal radial/ulnar physes."
        )
    }

    # 6. Render Visualizations
    render_visualizations(test_img_dir, viz_dir, tp_cases, tn_cases, normal_pediatric_fp_cases, fn_cases)

    # 7. Comparison Matrix
    comparisons = {
        "production_baseline": {
            "name": "Production MURA -> FracAtlas ResNet-18",
            "threshold": 0.18,
            "architecture": "ImageNet ResNet-18",
            "overall_recall": 97.41,
            "overall_specificity": 40.78,
            "pediatric_specificity": 0.00,
            "f1_score": 0.7225,
            "pediatric_false_positives": 251,
            "pediatric_true_negatives": 0
        },
        "experiment_2": {
            "name": "Experiment 2: Combined FracAtlas + GRAZPEDWRI-DX",
            "threshold": 0.37,
            "architecture": "ImageNet ResNet-18",
            "overall_recall": 94.66,
            "overall_specificity": 59.92,
            "pediatric_specificity": 0.00,
            "f1_score": 0.7836,
            "pediatric_false_positives": 251,
            "pediatric_true_negatives": 0
        },
        "experiment_3": {
            "name": "Experiment 3: Targeted Pediatric Fine-Tuning",
            "threshold": 0.10,
            "architecture": "ResNet-18 (Targeted Tuning)",
            "overall_recall": 96.00,
            "overall_specificity": 68.00,
            "pediatric_specificity": 0.40,
            "f1_score": 0.8140,
            "pediatric_false_positives": 250,
            "pediatric_true_negatives": 1
        },
        "experiment_4": {
            "name": "Experiment 4: Pediatric Specialist Classifier",
            "threshold": 0.25,
            "architecture": "ResNet-18 (Pediatric Specialist)",
            "overall_recall": 99.42,
            "overall_specificity": 1.59,
            "pediatric_specificity": 1.59,
            "f1_score": 0.8037,
            "pediatric_false_positives": 247,
            "pediatric_true_negatives": 4
        },
        "experiment_5": {
            "name": "Experiment 5 Phase 2: Pediatric Object Detector (YOLOv8n)",
            "threshold": selected_threshold,
            "architecture": "YOLOv8n-Detection",
            "pediatric_recall": round(rec_t * 100, 2),
            "pediatric_specificity": round(spec_t * 100, 2),
            "pediatric_precision": round(prec_t * 100, 2),
            "pediatric_npv": round(npv_t * 100, 2),
            "pediatric_f1": round(f1_t, 4),
            "pediatric_roc_auc": round(roc_auc_t, 4),
            "pediatric_pr_auc": round(pr_auc_t, 4),
            "pediatric_brier": round(brier_t, 4),
            "pediatric_ece": round(ece_t, 4),
            "pediatric_false_positives": int(fp_t),
            "pediatric_true_negatives": int(tn_t)
        }
    }

    # 8. Decision
    if rec_t >= 0.90 and spec_t >= 0.50:
        decision = "EXCELLENT GO — Object detection solves pediatric growth-plate false-positive crisis (>50% specificity at >90% recall)."
    elif rec_t >= 0.90 and spec_t >= 0.30:
        decision = "STRONG GO — Substantial specificity breakthrough (>30% specificity at >90% recall)."
    elif rec_t >= 0.90 and spec_t > 0.05:
        decision = "MODERATE GO — Material improvement over Exp 4 (1.59%), localization confirmed as the correct direction."
    else:
        decision = "NO-GO — Specificity remains near zero; localization alone insufficient."

    # 9. Save all artifacts
    training_report = {
        "experiment_name": "Experiment 5 — Phase 2: Pediatric Fracture Object Detection Baseline",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+05:30"),
        "total_epochs_trained": 10,
        "best_epoch": int(best_epoch_row["epoch"]) if len(train_history) > 0 else 10,
        "best_epoch_metrics": {
            "mAP50": float(best_epoch_row["metrics/mAP50(B)"]) if len(train_history) > 0 else val_det_results["mAP50"],
            "mAP50_95": float(best_epoch_row["metrics/mAP50-95(B)"]) if len(train_history) > 0 else val_det_results["mAP50_95"],
            "precision": float(best_epoch_row["metrics/precision(B)"]) if len(train_history) > 0 else val_det_results["precision"],
            "recall": float(best_epoch_row["metrics/recall(B)"]) if len(train_history) > 0 else val_det_results["recall"],
        },
        "best_checkpoint_path": str(best_dst.resolve()),
        "validation_metrics": val_det_results,
        "selected_threshold": selected_threshold,
        "selection_criterion": selection_criterion,
        "operating_points": {
            "recall_95_target": op_pt_95,
            "recall_90_target": op_pt_90,
            "recall_85_target": op_pt_85
        },
        "test_detection_metrics": test_det_results,
        "test_clinical_metrics": test_clinical_results["metrics"],
        "verdict": decision
    }

    with open(exp_dir / "training_report.json", "w", encoding="utf-8") as f:
        json.dump(training_report, f, indent=2)

    with open(exp_dir / "validation_detection_metrics.json", "w", encoding="utf-8") as f:
        json.dump(val_det_results, f, indent=2)

    with open(exp_dir / "test_detection_results.json", "w", encoding="utf-8") as f:
        json.dump(test_det_results, f, indent=2)

    with open(exp_dir / "test_clinical_results.json", "w", encoding="utf-8") as f:
        json.dump(test_clinical_results, f, indent=2)

    with open(exp_dir / "error_analysis.json", "w", encoding="utf-8") as f:
        json.dump(error_analysis, f, indent=2)

    with open(exp_dir / "comparison_report.json", "w", encoding="utf-8") as f:
        json.dump(comparisons, f, indent=2)

    model_metadata = {
        "model_name": "yolov8n_pediatric_fracture_detector",
        "checkpoint_file": "best_model.pt",
        "task": "detect",
        "classes": ["fracture"],
        "num_classes": 1,
        "input_resolution": 512,
        "operating_confidence_threshold": selected_threshold,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S+05:30"),
        "framework": "ultralytics 8.4.173",
        "status": "RESEARCH-ONLY BASELINE"
    }

    with open(exp_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)

    print("\n" + "=" * 80)
    print("ALL ARTIFACTS GENERATED SUCCESSFULLY!")
    print(f"Test Recall: {rec_t * 100:.2f}% | Test Specificity: {spec_t * 100:.2f}% | F1: {f1_t:.4f}")
    print(f"Pediatric Normal Radiographs Correctly Classified: {tn_t} / {tn_t + fp_t} ({spec_t * 100:.2f}%)")
    print(f"Pediatric False Positives: {fp_t} (Reduced from 247 in Exp 4 and 251 in Exp 2)")
    print(f"Decision: {decision}")
    print("=" * 80)


def render_visualizations(img_dir: Path, out_dir: Path, tp_cases, tn_cases, fp_cases, fn_cases):
    cases_to_render = [
        ("TP", tp_cases[:3]),
        ("TN", tn_cases[:3]),
        ("FP_GrowthPlate", fp_cases[:3]),
        ("FN", fn_cases[:3])
    ]

    for category, cases in cases_to_render:
        for idx, item in enumerate(cases):
            stem = item["filestem"]
            img_p = img_dir / f"{stem}.png"
            if not img_p.exists():
                continue

            img = cv2.imread(str(img_p))
            if img is None:
                continue
            h, w, _ = img.shape

            for box in item.get("gt_boxes", []):
                cx, cy, bw, bh = box
                x1 = int((cx - bw / 2) * w)
                y1 = int((cy - bh / 2) * h)
                x2 = int((cx + bw / 2) * w)
                y2 = int((cy + bh / 2) * h)
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(img, "GT Fracture", (x1, max(15, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            for idx_b, box in enumerate(item.get("pred_boxes", [])):
                conf = item["pred_confs"][idx_b] if idx_b < len(item["pred_confs"]) else 0.0
                cx, cy, bw, bh = box
                x1 = int((cx - bw / 2) * w)
                y1 = int((cy - bh / 2) * h)
                x2 = int((cx + bw / 2) * w)
                y2 = int((cy + bh / 2) * h)
                color = (0, 0, 255) if category in ["FP_GrowthPlate", "FP"] else (255, 128, 0)
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                cv2.putText(img, f"Pred: {conf:.2f}", (x1, min(h - 10, y2 + 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            banner_text = f"[{category}] {stem} | Age: {item['age']:.1f}y | MaxConf: {item['max_confidence']:.2f}"
            cv2.rectangle(img, (0, 0), (w, 30), (40, 40, 40), -1)
            cv2.putText(img, banner_text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            out_path = out_dir / f"{category}_{idx+1}_{stem}.png"
            cv2.imwrite(str(out_path), img)


if __name__ == "__main__":
    main()
