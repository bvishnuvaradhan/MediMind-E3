"""
Master Execution Pipeline for Experiment 4: Age-Aware Dual-Model Fracture Detection
"""

import os
import sys
import time
import json
import torch
import pandas as pd
from torch.utils.data import DataLoader

# Ensure ai-prediction-service is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
ai_service_root = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".."))
if ai_service_root not in sys.path:
    sys.path.insert(0, ai_service_root)

from app.models.fracture_v2.model import FractureResNet18
from app.models.fracture_v2.experiment4.hard_negative_miner_exp4 import HardNegativeMinerExp4
from app.models.fracture_v2.experiment4.trainer_exp4 import PediatricSpecialistTrainer, PediatricXRayDataset, get_exp4_transforms
from app.models.fracture_v2.experiment4.evaluator_exp4 import PediatricEvaluatorExp4
from app.models.fracture_v2.experiment4.dual_model_system import AgeAwareDualModelEvaluator
from app.models.fracture_v2.experiment4.gradcam_exp4 import run_gradcam_analysis_exp4


def run_experiment4_pipeline():
    total_start = time.time()
    base_dir = r"D:\projects\MediMind\ai-prediction-service"
    output_dir = os.path.join(base_dir, "artifacts", "fracture_v2", "experiment4_age_aware")
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 80)
    print("MEDIMIND EXPERIMENT 4: AGE-AWARE DUAL-MODEL FRACTURE DETECTION")
    print("=" * 80)

    # Manifests
    graz_manifest_dir = os.path.join(base_dir, "artifacts", "fracture_v2", "graz_only", "manifests")
    train_manifest = os.path.join(graz_manifest_dir, "train.csv")
    val_manifest = os.path.join(graz_manifest_dir, "validation.csv")
    test_manifest = os.path.join(graz_manifest_dir, "test.csv")
    adult_test_manifest = os.path.join(base_dir, "artifacts", "fracture_v2", "combined", "manifests", "fracatlas_raw", "test.csv")

    # Initial checkpoints
    exp2_checkpoint = os.path.join(base_dir, "artifacts", "fracture_v2", "combined", "best_model.pt")
    prod_checkpoint = os.path.join(base_dir, "artifacts", "fracture", "best_model.pt")

    print(f"Output Directory:     {output_dir}")
    print(f"Exp 2 Checkpoint:     {exp2_checkpoint} (Exists: {os.path.exists(exp2_checkpoint)})")
    print(f"Production Checkpoint:{prod_checkpoint} (Exists: {os.path.exists(prod_checkpoint)})")

    # Step 1: Hard-Negative Mining on GRAZ Training Set Only
    print("\n" + "=" * 70)
    print("PHASE 1: HARD-NEGATIVE MINING (GRAZ TRAINING SET ONLY)")
    print("=" * 70)
    hard_neg_manifest_path = os.path.join(output_dir, "hard_negative_manifest.json")
    miner = HardNegativeMinerExp4(exp2_checkpoint, device="cpu")
    hard_negatives = miner.mine_training_hard_negatives(train_manifest, hard_neg_manifest_path, threshold=0.30)

    # Step 2: Controlled Fine-Tuning of Pediatric Specialist (Max 8 epochs)
    print("\n" + "=" * 70)
    print("PHASE 2: CONTROLLED PEDIATRIC FINE-TUNING")
    print("=" * 70)
    trainer = PediatricSpecialistTrainer(exp2_checkpoint, device="cpu")
    history, best_epoch, best_model_path = trainer.train(
        train_manifest=train_manifest,
        val_manifest=val_manifest,
        hard_negatives=hard_negatives,
        output_dir=output_dir,
        max_epochs=8,
        batch_size=32
    )

    # Save training report
    training_report = {
        "experiment_name": "Experiment 4: Age-Aware Dual-Model Pediatric Specialist",
        "initialization_checkpoint": exp2_checkpoint,
        "device": "cpu",
        "dataset": "GRAZPEDWRI-DX Pediatric Wrist Radiographs",
        "total_epochs": len(history),
        "best_epoch": best_epoch,
        "loss_function": "BCEWithLogitsLoss with Weighted Balanced Minibatches",
        "freezing_strategy": "layer1/layer2 frozen; layer3 (lr=1e-5), layer4 (lr=2e-5), fc (lr=1e-4) trainable",
        "hard_negatives_used": len(hard_negatives),
        "training_history": history
    }
    with open(os.path.join(output_dir, "training_report.json"), "w") as f:
        json.dump(training_report, f, indent=2)

    # Step 3: Validation Threshold Optimization
    print("\n" + "=" * 70)
    print("PHASE 3: VALIDATION THRESHOLD OPTIMIZATION")
    print("=" * 70)
    best_model = FractureResNet18(pretrained=False)
    state = torch.load(best_model_path, map_location="cpu", weights_only=False)
    state_dict = state if "model_state_dict" not in state else state["model_state_dict"]
    best_model.load_state_dict(state_dict)

    _, val_tf = get_exp4_transforms()
    val_df = pd.read_csv(val_manifest)
    val_ds = PediatricXRayDataset(val_df, transform=val_tf)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=0)

    evaluator = PediatricEvaluatorExp4(best_model, device="cpu")
    selected_threshold, val_summary = evaluator.optimize_validation_threshold(val_loader, output_dir)

    # Step 4: Untouched Pediatric Test Evaluation
    print("\n" + "=" * 70)
    print("PHASE 4: UNTOUCHED PEDIATRIC TEST EVALUATION")
    print("=" * 70)
    test_df = pd.read_csv(test_manifest)
    test_ds = PediatricXRayDataset(test_df, transform=val_tf)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)

    test_results = evaluator.evaluate_test_set(test_loader, selected_threshold, output_dir)

    # Step 5: Grad-CAM Interpretability Analysis
    print("\n" + "=" * 70)
    print("PHASE 5: GRAD-CAM INTERPRETABILITY ANALYSIS")
    print("=" * 70)
    gradcam_res = run_gradcam_analysis_exp4(best_model_path, test_manifest, selected_threshold, output_dir, device="cpu")

    # Step 6: Age-Aware Dual-Model System Evaluation & Comparison
    print("\n" + "=" * 70)
    print("PHASE 6: DUAL-MODEL SYSTEM EVALUATION & CROSS-EXPERIMENT COMPARISON")
    print("=" * 70)
    dual_evaluator = AgeAwareDualModelEvaluator(
        prod_model_path=prod_checkpoint,
        ped_model_path=best_model_path,
        ped_threshold=selected_threshold,
        device="cpu"
    )
    dual_results, comparison_report = dual_evaluator.run_system_evaluation(
        adult_manifest=adult_test_manifest,
        ped_manifest=test_manifest,
        output_dir=output_dir
    )

    total_time = time.time() - total_start
    print("\n" + "=" * 80)
    print(f"EXPERIMENT 4 COMPLETE IN {total_time/60:.2f} MINUTES")
    print("=" * 80)

    return {
        "training_report": training_report,
        "val_summary": val_summary,
        "test_results": test_results,
        "dual_results": dual_results,
        "comparison_report": comparison_report,
        "total_duration_minutes": round(total_time / 60, 2)
    }


if __name__ == "__main__":
    run_experiment4_pipeline()
