"""
Master Pipeline for Experiment 3: Targeted Pediatric-Bias Fine-Tuning
"""

import os
import json
import torch
import pandas as pd
from .hard_negative_miner import mine_hard_negatives
from .trainer_exp3 import train_targeted_model
from .evaluator_exp3 import run_validation_threshold_optimization, run_final_test_evaluation
from .gradcam_exp3 import generate_exp3_gradcam
from app.models.fracture_v2.model import FractureResNet18


def run_experiment3(
    base_checkpoint=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined\best_model.pt",
    manifest_dir=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined\manifests",
    output_dir=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\experiment3_pediatric_tuning",
    epochs=4,
    batch_size=32,
    seed=42,
):
    print("=" * 70)
    print("STARTING EXPERIMENT 3: TARGETED PEDIATRIC-BIAS FINE-TUNING PIPELINE")
    print("=" * 70)

    if not os.path.exists(base_checkpoint):
        raise FileNotFoundError(f"Base checkpoint not found at {base_checkpoint}")

    os.makedirs(output_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Device] Running on: {device}")

    # 1. Load Manifests
    df_train = pd.read_csv(os.path.join(manifest_dir, "train.csv"))
    df_val = pd.read_csv(os.path.join(manifest_dir, "validation.csv"))
    df_test = pd.read_csv(os.path.join(manifest_dir, "test.csv"))
    print(f"Manifests Loaded -> Train: {len(df_train)}, Val: {len(df_val)}, Test: {len(df_test)}")

    # 2. Mine Hard Negatives on Training Split Only
    base_model = FractureResNet18(pretrained=False).to(device)
    base_model.load_state_dict(torch.load(base_checkpoint, map_location=device))
    base_model.eval()

    df_train_mined, sample_weights, hard_neg_manifest = mine_hard_negatives(
        base_model, df_train, device, output_dir, batch_size=batch_size
    )

    # 3. Fine-Tune Targeted Model
    tuned_model, history, best_comp = train_targeted_model(
        base_checkpoint,
        df_train_mined,
        sample_weights,
        df_val,
        output_dir,
        epochs=epochs,
        batch_size=batch_size,
        device=device,
        seed=seed,
    )

    # 4. Validation Threshold Optimization (Strictly on Validation Set)
    optimal_threshold, df_val_comp, val_json = run_validation_threshold_optimization(
        tuned_model, df_val, device, output_dir
    )

    # 5. Untouched Test Set Evaluation
    test_results, test_probs = run_final_test_evaluation(
        tuned_model, df_test, optimal_threshold, device, output_dir
    )

    # 6. Grad-CAM Spatial Activation Analysis
    gradcam_report = generate_exp3_gradcam(
        base_model, tuned_model, df_test, test_probs, optimal_threshold, output_dir, device
    )

    # 7. Compile Comprehensive Master Reports
    training_report = {
        "experiment_name": "Experiment 3: Targeted Pediatric-Bias Fine-Tuning",
        "model_version": "2.3.0",
        "base_checkpoint": base_checkpoint,
        "selected_validation_threshold": optimal_threshold,
        "training_history": history,
        "hard_negative_summary": {
            "total_pediatric_negatives": hard_neg_manifest["total_pediatric_negatives"],
            "hard_pediatric_negatives": hard_neg_manifest["hard_pediatric_negatives"],
        },
        "validation_optimization": val_json,
        "final_held_out_test_results": test_results,
        "gradcam_analysis": gradcam_report,
    }

    report_path = os.path.join(output_dir, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(training_report, f, indent=2)

    # Comparison with All Prior Models
    comparison_summary = {
        "models_benchmarked": {
            "1_old_mura_production": {"recall": 0.9626, "specificity": 0.6364, "precision": 0.3589, "npv": 0.9877, "f1": 0.5228, "roc_auc": 0.9244, "threshold": 0.18},
            "2_exp2_fracatlas_only": {"recall": 0.8655, "specificity": 0.7374, "precision": 0.4421, "npv": 0.9580, "f1": 0.5852, "roc_auc": 0.8751, "threshold": 0.26},
            "3_exp2_graz_only": {"recall": 0.9942, "specificity": 0.0080, "precision": 0.6741, "npv": 0.4000, "f1": 0.8034, "roc_auc": 0.6152, "threshold": 0.51},
            "4_exp2_combined_base": {"recall": 0.9466, "specificity": 0.5992, "precision": 0.6685, "npv": 0.9293, "f1": 0.7836, "roc_auc": 0.8396, "threshold": 0.37},
            "5_exp3_targeted_tuned": {
                "recall": test_results["overall"]["recall"],
                "specificity": test_results["overall"]["specificity"],
                "precision": test_results["overall"]["precision"],
                "npv": test_results["overall"]["npv"],
                "f1": test_results["overall"]["f1_score"],
                "roc_auc": test_results["overall"]["roc_auc"],
                "pr_auc": test_results["overall"]["pr_auc"],
                "brier_score": test_results["overall"]["brier_score"],
                "expected_calibration_error": test_results["overall"]["expected_calibration_error"],
                "threshold": optimal_threshold,
                "adult_recall": test_results["fracatlas_adult_subset"]["recall"],
                "adult_specificity": test_results["fracatlas_adult_subset"]["specificity"],
                "pediatric_recall": test_results["graz_pediatric_subset"]["recall"],
                "pediatric_specificity": test_results["graz_pediatric_subset"]["specificity"],
            }
        }
    }

    comp_path = os.path.join(output_dir, "final_comparison_report.json")
    with open(comp_path, "w") as f:
        json.dump(comparison_summary, f, indent=2)

    print("\n" + "=" * 70)
    print("EXPERIMENT 3 COMPLETE!")
    print(f"Artifacts saved to: {output_dir}")
    print("=" * 70)
    return training_report


if __name__ == "__main__":
    run_experiment3()
