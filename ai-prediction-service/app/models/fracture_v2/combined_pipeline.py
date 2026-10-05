"""
Combined (FracAtlas + GRAZPEDWRI-DX) Fracture Detection Training & Evaluation Pipeline
"""

import os
import json
import torch
import pandas as pd
from .combined_dataset_builder import prepare_combined_dataset
from .trainer import train_fracture_model
from .evaluator import (
    predict_dataset,
    optimize_threshold_on_val,
    compute_metrics_at_threshold,
    evaluate_subgroups,
)
from .gradcam import generate_gradcam_artifacts


def run_combined_pipeline(
    fracatlas_dir=r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\FracAtlas\FracAtlas",
    graz_dir=r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\GRAZPEDWRI-DX",
    artifacts_combined_dir=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined",
    stage1_epochs=3,
    stage2_epochs=6,
    batch_size=32,
    seed=42,
):
    print("=" * 60)
    print("STARTING EXPERIMENT 2: COMBINED DATASET PIPELINE")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Device] Running on: {device}")

    manifest_dir = os.path.join(artifacts_combined_dir, "manifests")
    os.makedirs(artifacts_combined_dir, exist_ok=True)
    os.makedirs(manifest_dir, exist_ok=True)

    # 1. Ingestion & Patient Split
    dataset_report, df_train, df_val, df_test = prepare_combined_dataset(
        fracatlas_dir, graz_dir, manifest_dir, seed=seed
    )

    # 2. Two-Stage Transfer Learning
    checkpoint_path = os.path.join(artifacts_combined_dir, "best_model.pt")
    if os.path.exists(checkpoint_path):
        print(f"\n[Phase 7-10] Found existing combined checkpoint at {checkpoint_path}. Loading weights...")
        from .model import FractureResNet18
        model = FractureResNet18(pretrained=False).to(device)
        model.load_state_dict(torch.load(checkpoint_path, map_location=device))
        model.eval()
        training_history = {"best_val_auc": 0.0, "note": "Loaded from checkpoint"}
        pos_weight_val = round((df_train['fractured'] == 0).sum() / max(1, df_train['fractured'].sum()), 4)
    else:
        print("\n[Phase 7-10] Training ResNet-18 on Combined Dataset...")
        model, training_history, pos_weight_val = train_fracture_model(
            df_train,
            df_val,
            artifacts_combined_dir,
            batch_size=batch_size,
            stage1_epochs=stage1_epochs,
            stage2_epochs=stage2_epochs,
            device=device,
            seed=seed,
        )

    # 3. Validation Threshold Optimization
    print("\n[Phase 11] Optimizing Threshold on Combined Validation Set...")
    val_probs, val_targets, val_meta = predict_dataset(model, df_val, device, batch_size=batch_size)
    optimal_threshold, val_threshold_records = optimize_threshold_on_val(val_probs, val_targets)
    val_metrics = compute_metrics_at_threshold(val_probs, val_targets, optimal_threshold)
    print(f"Optimal Combined Validation Threshold: {optimal_threshold}")
    print(f"Validation Metrics: Recall={val_metrics['metrics']['recall']}, Specificity={val_metrics['metrics']['specificity']}, F1={val_metrics['metrics']['f1_score']}, AUC={val_metrics['metrics']['roc_auc']}")

    # 4. Final Held-Out Combined Test Set Evaluation
    print("\n[Phase 12] Final Held-Out Combined Test Set Evaluation...")
    test_probs, test_targets, test_meta = predict_dataset(model, df_test, device, batch_size=batch_size)
    test_results = compute_metrics_at_threshold(test_probs, test_targets, optimal_threshold)

    # Evaluate Subsets & Subgroups
    # 4a. FracAtlas Test Subset
    fa_mask = (df_test["dataset"] == "FracAtlas").values
    if fa_mask.sum() > 0:
        fa_probs = test_probs[fa_mask]
        fa_targets = test_targets[fa_mask]
        fa_results = compute_metrics_at_threshold(fa_probs, fa_targets, optimal_threshold)
    else:
        fa_results = {}

    # 4b. GRAZ Test Subset
    graz_mask = (df_test["dataset"] == "GRAZPEDWRI-DX").values
    if graz_mask.sum() > 0:
        graz_probs = test_probs[graz_mask]
        graz_targets = test_targets[graz_mask]
        graz_results = compute_metrics_at_threshold(graz_probs, graz_targets, optimal_threshold)
    else:
        graz_results = {}

    # 4c. Anatomical and Hardware Subgroups
    subgroup_results = evaluate_subgroups(test_probs, test_targets, test_meta, optimal_threshold)
    subgroup_results["subset_fracatlas"] = fa_results.get("metrics", {})
    subgroup_results["subset_grazpedwri_dx"] = graz_results.get("metrics", {})
    test_results["subgroups"] = subgroup_results

    # 5. Grad-CAM & Detailed Error Analysis (Focusing on Subtle/Non-displaced Fractures)
    print("\n[Phase 14] Generating Grad-CAM Artifacts for Combined Model...")
    explainability_report = generate_gradcam_artifacts(
        model, df_test, test_probs, optimal_threshold, artifacts_combined_dir, device
    )

    # 6. Save Report
    final_report = {
        "model_name": "fracture_resnet18_combined",
        "experiment": "Combined FracAtlas + GRAZPEDWRI-DX",
        "model_version": "2.2.0",
        "architecture": "ImageNet-pretrained ResNet-18 (Combined Training)",
        "calibrated_threshold": optimal_threshold,
        "pos_weight": pos_weight_val,
        "dataset_statistics": dataset_report,
        "training_history": training_history,
        "validation_metrics": val_metrics["metrics"],
        "combined_test_metrics": test_results["metrics"],
        "fracatlas_test_subset_metrics": fa_results.get("metrics", {}),
        "graz_test_subset_metrics": graz_results.get("metrics", {}),
        "confusion_matrix": test_results["confusion_matrix"],
        "subgroups": subgroup_results,
        "gradcam_analysis": explainability_report,
    }

    report_path = os.path.join(artifacts_combined_dir, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(final_report, f, indent=2)

    print(f"\n[Done] Combined pipeline complete. Report saved to {report_path}")
    return final_report


if __name__ == "__main__":
    run_combined_pipeline()
