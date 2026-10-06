"""
Experiment 4: Age-Aware Dual-Model System and Cross-Experiment Comparison
"""

import os
import json
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc, brier_score_loss, confusion_matrix
import torchvision.transforms as transforms
from torchvision import models
from app.models.fracture_v2.model import FractureResNet18
from app.models.fracture_v2.experiment4.trainer_exp4 import compute_ece


class ProductionFractureModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.resnet18(weights=None)
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()
        self.head = nn.Linear(in_features, 1)

    def forward(self, x):
        feat = self.backbone(x)
        return self.head(feat).squeeze(-1)


class AgeAwareDualModelEvaluator:
    def __init__(self, prod_model_path, ped_model_path, ped_threshold, device="cpu"):
        self.device = torch.device(device)
        self.prod_threshold = 0.18
        self.ped_threshold = ped_threshold

        # Load production model
        self.prod_model = ProductionFractureModel()
        prod_ckpt = torch.load(prod_model_path, map_location=self.device, weights_only=False)
        self.prod_model.load_state_dict(prod_ckpt["model_state_dict"])
        self.prod_model.to(self.device)
        self.prod_model.eval()

        # Load pediatric specialist model
        self.ped_model = FractureResNet18(pretrained=False)
        ped_ckpt = torch.load(ped_model_path, map_location=self.device, weights_only=False)
        ped_state = ped_ckpt if "model_state_dict" not in ped_ckpt else ped_ckpt["model_state_dict"]
        self.ped_model.load_state_dict(ped_state)
        self.ped_model.to(self.device)
        self.ped_model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def evaluate_cohort(self, model, manifest_path, threshold):
        df = pd.read_csv(manifest_path)
        lbl_col = "fractured" if "fractured" in df.columns else "label"
        
        probs = []
        labels = []
        
        with torch.no_grad():
            for idx, row in df.iterrows():
                fpath = row["file_path"]
                lbl = int(row[lbl_col])
                if not os.path.exists(fpath):
                    continue
                try:
                    img = Image.open(fpath).convert("RGB")
                    tensor = self.transform(img).unsqueeze(0).to(self.device)
                    logit = model(tensor).item()
                    prob = torch.sigmoid(torch.tensor(logit)).item()
                    probs.append(prob)
                    labels.append(lbl)
                except Exception:
                    pass

        probs = np.array(probs)
        labels = np.array(labels)
        
        auc_roc = float(roc_auc_score(labels, probs))
        precision_arr, recall_arr, _ = precision_recall_curve(labels, probs)
        pr_auc = float(auc(recall_arr, precision_arr))

        preds = (probs >= threshold).astype(int)
        tp = int(np.sum((preds == 1) & (labels == 1)))
        fp = int(np.sum((preds == 1) & (labels == 0)))
        tn = int(np.sum((preds == 0) & (labels == 0)))
        fn = int(np.sum((preds == 0) & (labels == 1)))

        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        brier = float(brier_score_loss(labels, probs))
        ece = compute_ece(probs, labels)

        return {
            "total_samples": len(labels),
            "fractures": int(np.sum(labels == 1)),
            "non_fractures": int(np.sum(labels == 0)),
            "threshold": threshold,
            "metrics": {
                "recall": round(rec * 100, 2),
                "specificity": round(spec * 100, 2),
                "precision": round(prec * 100, 2),
                "npv": round(npv * 100, 2),
                "f1": round(f1, 4),
                "roc_auc": round(auc_roc, 4),
                "pr_auc": round(pr_auc, 4),
                "brier_score": round(brier, 4),
                "ece": round(ece * 100, 2)
            },
            "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
            "probs": probs,
            "labels": labels,
            "preds": preds
        }

    def run_system_evaluation(self, adult_manifest, ped_manifest, output_dir):
        os.makedirs(output_dir, exist_ok=True)
        print("\n" + "=" * 70)
        print("EVALUATING AGE-AWARE DUAL-MODEL SYSTEM")
        print("=" * 70)

        # 1. Adult branch evaluation
        print("\n[Adult Branch] Evaluating Production Model on FracAtlas Test Cohort...")
        adult_res = self.evaluate_cohort(self.prod_model, adult_manifest, self.prod_threshold)

        # 2. Pediatric branch evaluation
        print(f"\n[Pediatric Branch] Evaluating Pediatric Specialist on GRAZ Test Cohort (Threshold: {self.ped_threshold})...")
        ped_res = self.evaluate_cohort(self.ped_model, ped_manifest, self.ped_threshold)

        # 3. Combined age-aware system
        comb_labels = np.concatenate([adult_res["labels"], ped_res["labels"]])
        comb_preds = np.concatenate([adult_res["preds"], ped_res["preds"]])
        comb_probs = np.concatenate([adult_res["probs"], ped_res["probs"]])

        tp = int(np.sum((comb_preds == 1) & (comb_labels == 1)))
        fp = int(np.sum((comb_preds == 1) & (comb_labels == 0)))
        tn = int(np.sum((comb_preds == 0) & (comb_labels == 0)))
        fn = int(np.sum((comb_preds == 0) & (comb_labels == 1)))

        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0

        auc_roc = float(roc_auc_score(comb_labels, comb_probs))
        precision_arr, recall_arr, _ = precision_recall_curve(comb_labels, comb_probs)
        pr_auc = float(auc(recall_arr, precision_arr))
        brier = float(brier_score_loss(comb_labels, comb_probs))
        ece = compute_ece(comb_probs, comb_labels)

        combined_res = {
            "total_samples": len(comb_labels),
            "fractures": int(np.sum(comb_labels == 1)),
            "non_fractures": int(np.sum(comb_labels == 0)),
            "routing_strategy": "Adult -> Prod Model (0.18) | Pediatric -> Exp4 Specialist (Validation Threshold)",
            "metrics": {
                "recall": round(rec * 100, 2),
                "specificity": round(spec * 100, 2),
                "precision": round(prec * 100, 2),
                "npv": round(npv * 100, 2),
                "f1": round(f1, 4),
                "roc_auc": round(auc_roc, 4),
                "pr_auc": round(pr_auc, 4),
                "brier_score": round(brier, 4),
                "ece": round(ece * 100, 2)
            },
            "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn}
        }

        # Build clean JSON outputs (without raw numpy arrays)
        clean_adult = {k: v for k, v in adult_res.items() if k not in ["probs", "labels", "preds"]}
        clean_ped = {k: v for k, v in ped_res.items() if k not in ["probs", "labels", "preds"]}

        dual_system_report = {
            "experiment": "Experiment 4: Age-Aware Dual-Model Fracture Detection",
            "adult_branch": clean_adult,
            "pediatric_branch": clean_ped,
            "combined_dual_model_system": combined_res
        }

        with open(os.path.join(output_dir, "dual_model_comparison.json"), "w") as f:
            json.dump(dual_system_report, f, indent=2)

        # 4. Final Comparison Report against all baseline models
        comparison_table = {
            "1_Production_MURA_FracAtlas": {
                "description": "Production ResNet-18 (MURA -> FracAtlas fine-tuned, threshold 0.18)",
                "adult_recall": 96.26, "adult_spec": 63.64, "adult_prec": 35.89, "adult_f1": 0.5228,
                "overall_recall": 96.26, "overall_spec": 63.64, "overall_prec": 35.89, "overall_f1": 0.5228, "overall_roc_auc": 0.9244
            },
            "2_Experiment2_Combined": {
                "description": "Experiment 2 ResNet-18 (FracAtlas + GRAZ combined training, threshold 0.37)",
                "overall_recall": 94.66, "overall_spec": 59.92, "overall_prec": 66.85, "overall_f1": 0.7836, "overall_roc_auc": 0.8396,
                "pediatric_recall": 99.42, "pediatric_spec": 0.80, "pediatric_prec": 67.41, "pediatric_f1": 0.8034, "pediatric_roc_auc": 0.6152
            },
            "3_Experiment3_Pediatric_Tuned": {
                "description": "Experiment 3 ResNet-18 (Targeted pediatric-bias tuning, threshold 0.10)",
                "overall_recall": 97.33, "overall_spec": 50.67, "overall_prec": 62.75, "overall_f1": 0.7631, "overall_roc_auc": 0.8111,
                "adult_recall": 85.71, "adult_spec": 76.16, "adult_prec": 46.36, "adult_roc_auc": 0.8901,
                "pediatric_recall": 100.0, "pediatric_spec": 0.40, "pediatric_prec": 67.45, "pediatric_roc_auc": 0.6285
            },
            "4_Experiment4_Pediatric_Specialist": {
                "description": "Experiment 4 ResNet-18 (Dedicated pediatric specialist model)",
                "pediatric_recall": clean_ped["metrics"]["recall"],
                "pediatric_spec": clean_ped["metrics"]["specificity"],
                "pediatric_prec": clean_ped["metrics"]["precision"],
                "pediatric_npv": clean_ped["metrics"]["npv"],
                "pediatric_f1": clean_ped["metrics"]["f1"],
                "pediatric_roc_auc": clean_ped["metrics"]["roc_auc"],
                "pediatric_pr_auc": clean_ped["metrics"]["pr_auc"],
                "pediatric_brier": clean_ped["metrics"]["brier_score"],
                "pediatric_ece": clean_ped["metrics"]["ece"],
                "confusion_matrix": clean_ped["confusion_matrix"]
            },
            "5_Experiment4_Age_Aware_Dual_System": {
                "description": "Experiment 4 Dual-Model Architecture (Adult -> Prod | Pediatric -> Exp4 Specialist)",
                "overall_recall": combined_res["metrics"]["recall"],
                "overall_spec": combined_res["metrics"]["specificity"],
                "overall_prec": combined_res["metrics"]["precision"],
                "overall_npv": combined_res["metrics"]["npv"],
                "overall_f1": combined_res["metrics"]["f1"],
                "overall_roc_auc": combined_res["metrics"]["roc_auc"],
                "overall_pr_auc": combined_res["metrics"]["pr_auc"],
                "overall_brier": combined_res["metrics"]["brier_score"],
                "overall_ece": combined_res["metrics"]["ece"],
                "confusion_matrix": combined_res["confusion_matrix"]
            }
        }

        with open(os.path.join(output_dir, "final_comparison_report.json"), "w") as f:
            json.dump(comparison_table, f, indent=2)

        return dual_system_report, comparison_table
