"""
GRAZPEDWRI-DX Only Fracture Detection Training, Optimization & Evaluation Pipeline
"""

import os
import json
import torch
import pandas as pd
from .graz_dataset_builder import inspect_and_clean_graz
from .trainer import train_fracture_model
from .evaluator import (
    predict_dataset,
    optimize_threshold_on_val,
    compute_metrics_at_threshold,
    evaluate_subgroups,
)
from .gradcam import generate_gradcam_artifacts


def run_graz_pipeline(
    graz_dir=r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\GRAZPEDWRI-DX",
    artifacts_graz_dir=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\graz_only",
    stage1_epochs=3,
    stage2_epochs=6,
    batch_size=32,
    seed=42,
):
    print("=" * 60)
    print("STARTING EXPERIMENT 1: GRAZPEDWRI-DX ONLY PIPELINE")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Device] Running on: {device}")

    manifest_dir = os.path.join(artifacts_graz_dir, "manifests")
    os.makedirs(artifacts_graz_dir, exist_ok=True)
    os.makedirs(manifest_dir, exist_ok=True)

    # 1. Dataset Ingestion & Patient Split
    dataset_report, df_train, df_val, df_test = inspect_and_clean_graz(
        graz_dir, manifest_dir, seed=seed
    )

    # 2. Two-Stage Transfer Learning
    checkpoint_path = os.path.join(artifacts_graz_dir, "best_model.pt")
    if os.path.exists(checkpoint_path):
        print(f"\n[Phase 7-10] Found existing checkpoint at {checkpoint_path}. Loading weights...")
        from .model import FractureResNet18
        model = FractureResNet18(pretrained=False).to(device)
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        model.eval()
        training_history = {"best_val_auc": 0.0, "note": "Loaded from checkpoint"}
        pos_weight_val = round((df_train['fractured'] == 0).sum() / max(1, df_train['fractured'].sum()), 4)
    else:
        print("\n[Phase 7-10] Training ResNet-18 on GRAZPEDWRI-DX...")
        model, training_history, pos_weight_val = train_fracture_model(
            df_train,
            df_val,
            artifacts_graz_dir,
            batch_size=batch_size,
            stage1_epochs=stage1_epochs,
            stage2_epochs=stage2_epochs,
            device=device,
            seed=seed,
        )

    # 3. Validation Threshold Optimization
    print("\n[Phase 11] Optimizing Threshold on GRAZ Validation Set...")
    val_probs, val_targets, val_meta = predict_dataset(model, df_val, device, batch_size=batch_size)
    optimal_threshold, val_threshold_records = optimize_threshold_on_val(val_probs, val_targets)
    val_metrics = compute_metrics_at_threshold(val_probs, val_targets, optimal_threshold)
    print(f"Optimal GRAZ Validation Threshold: {optimal_threshold}")
    print(f"Validation Metrics: Recall={val_metrics['metrics']['recall']}, Specificity={val_metrics['metrics']['specificity']}, F1={val_metrics['metrics']['f1_score']}, AUC={val_metrics['metrics']['roc_auc']}")

    # 4. Final Held-Out Test Evaluation
    print("\n[Phase 12] Final Held-Out GRAZ Test Set Evaluation...")
    test_probs, test_targets, test_meta = predict_dataset(model, df_test, device, batch_size=batch_size)
    test_results = compute_metrics_at_threshold(test_probs, test_targets, optimal_threshold)
    subgroup_results = evaluate_subgroups(test_probs, test_targets, test_meta, optimal_threshold)
    test_results["subgroups"] = subgroup_results

    # 5. Grad-CAM & Error Analysis
    print("\n[Phase 14] Generating Grad-CAM Artifacts...")
    explainability_report = generate_gradcam_artifacts(
        model, df_test, test_probs, optimal_threshold, artifacts_graz_dir, device
    )

    # 6. Save Report
    final_report = {
        "model_name": "fracture_resnet18_graz_only",
        "experiment": "GRAZPEDWRI-DX Only",
        "model_version": "2.1.0",
        "architecture": "ImageNet-pretrained ResNet-18 (GRAZPEDWRI-DX Only)",
        "calibrated_threshold": optimal_threshold,
        "pos_weight": pos_weight_val,
        "dataset_statistics": dataset_report,
        "training_history": training_history,
        "validation_metrics": val_metrics["metrics"],
        "test_metrics": test_results["metrics"],
        "confusion_matrix": test_results["confusion_matrix"],
        "subgroups": subgroup_results,
        "gradcam_analysis": explainability_report,
    }

    report_path = os.path.join(artifacts_graz_dir, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2)

    print(f"\n[Done] GRAZ-only pipeline complete. Report saved to {report_path}")
    return final_report


if __name__ == "__main__":
    run_graz_pipeline()
