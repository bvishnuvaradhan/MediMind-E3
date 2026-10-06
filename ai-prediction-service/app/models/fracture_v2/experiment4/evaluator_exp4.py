"""
Experiment 4: Validation Threshold Optimizer and Untouched Test Evaluator
"""

import os
import json
import torch
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc, brier_score_loss, confusion_matrix
from app.models.fracture_v2.experiment4.trainer_exp4 import compute_ece


class PediatricEvaluatorExp4:
    def __init__(self, model, device="cpu"):
        self.device = torch.device(device)
        self.model = model.to(self.device)
        self.model.eval()

    def get_predictions(self, data_loader):
        all_probs = []
        all_labels = []
        all_paths = []

        with torch.no_grad():
            for batch in data_loader:
                imgs, lbls = batch[0].to(self.device), batch[1].to(self.device)
                logits = self.model(imgs)
                probs = torch.sigmoid(logits).cpu().numpy()
                all_probs.extend(probs)
                all_labels.extend(lbls.cpu().numpy())

        return np.array(all_probs), np.array(all_labels)

    def optimize_validation_threshold(self, val_loader, output_dir):
        os.makedirs(output_dir, exist_ok=True)
        probs, labels = self.get_predictions(val_loader)
        
        thresholds = [round(t, 2) for t in np.arange(0.05, 0.95, 0.05)]
        analysis_records = []

        best_spec_at_95_rec = (-1.0, None)
        best_spec_at_90_rec = (-1.0, None)
        best_spec_at_85_rec = (-1.0, None)
        best_f1_record = (-1.0, None)

        for t in thresholds:
            preds = (probs >= t).astype(int)
            tp = int(np.sum((preds == 1) & (labels == 1)))
            fp = int(np.sum((preds == 1) & (labels == 0)))
            tn = int(np.sum((preds == 0) & (labels == 0)))
            fn = int(np.sum((preds == 0) & (labels == 1)))

            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
            f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0

            rec_pct = round(rec * 100, 2)
            spec_pct = round(spec * 100, 2)
            prec_pct = round(prec * 100, 2)
            npv_pct = round(npv * 100, 2)
            f1_val = round(f1, 4)

            rec_entry = {
                "threshold": t,
                "recall": rec_pct,
                "specificity": spec_pct,
                "precision": prec_pct,
                "npv": npv_pct,
                "f1": f1_val,
                "tp": tp,
                "fp": fp,
                "tn": tn,
                "fn": fn
            }
            analysis_records.append(rec_entry)

            # Sensitivity constraint tracking
            if rec_pct >= 95.0 and spec_pct > best_spec_at_95_rec[0]:
                best_spec_at_95_rec = (spec_pct, rec_entry)
            if rec_pct >= 90.0 and spec_pct > best_spec_at_90_rec[0]:
                best_spec_at_90_rec = (spec_pct, rec_entry)
            if rec_pct >= 85.0 and spec_pct > best_spec_at_85_rec[0]:
                best_spec_at_85_rec = (spec_pct, rec_entry)
            if f1_val > best_f1_record[0]:
                best_f1_record = (f1_val, rec_entry)

        # Primary selection: Maximize specificity while maintaining Recall >= 90%
        if best_spec_at_90_rec[1] is not None:
            selected_operating_point = best_spec_at_90_rec[1]
            selection_rationale = "Maximized validation specificity subject to clinical constraint: Recall >= 90%"
        elif best_spec_at_85_rec[1] is not None:
            selected_operating_point = best_spec_at_85_rec[1]
            selection_rationale = "Maximized validation specificity subject to clinical constraint: Recall >= 85%"
        else:
            selected_operating_point = best_f1_record[1]
            selection_rationale = "Maximized validation F1 score"

        selected_threshold = selected_operating_point["threshold"]

        # Save CSV and JSON
        df_analysis = pd.DataFrame(analysis_records)
        csv_path = os.path.join(output_dir, "validation_threshold_analysis.csv")
        df_analysis.to_csv(csv_path, index=False)

        json_path = os.path.join(output_dir, "validation_threshold_analysis.json")
        summary_data = {
            "validation_cohort_size": len(labels),
            "validation_fractures": int(np.sum(labels == 1)),
            "validation_non_fractures": int(np.sum(labels == 0)),
            "selected_threshold": selected_threshold,
            "selection_rationale": selection_rationale,
            "selected_operating_metrics": selected_operating_point,
            "best_at_recall_ge_95": best_spec_at_95_rec[1],
            "best_at_recall_ge_90": best_spec_at_90_rec[1],
            "best_at_recall_ge_85": best_spec_at_85_rec[1],
            "best_f1_operating_point": best_f1_record[1],
            "full_threshold_analysis": analysis_records
        }
        with open(json_path, "w") as f:
            json.dump(summary_data, f, indent=2)

        print("\n" + "=" * 70)
        print("VALIDATION THRESHOLD OPTIMIZATION RESULTS")
        print("=" * 70)
        print(f"Selected Threshold: {selected_threshold}")
        print(f"Rationale: {selection_rationale}")
        print(f"Validation Metrics at {selected_threshold}: Recall={selected_operating_point['recall']}%, "
              f"Specificity={selected_operating_point['specificity']}%, Precision={selected_operating_point['precision']}%, "
              f"NPV={selected_operating_point['npv']}%, F1={selected_operating_point['f1']}")
        
        return selected_threshold, summary_data

    def evaluate_test_set(self, test_loader, threshold, output_dir):
        os.makedirs(output_dir, exist_ok=True)
        probs, labels = self.get_predictions(test_loader)

        auc_roc = float(roc_auc_score(labels, probs))
        precision_arr, recall_arr, _ = precision_recall_curve(labels, probs)
        pr_auc = float(auc(recall_arr, precision_arr))

        preds = (probs >= threshold).astype(int)
        tp = int(np.sum((preds == 1) & (labels == 1)))
        fp = int(np.sum((preds == 1) & (labels == 0)))
        tn = int(np.sum((preds == 0) & (labels == 0)))
        fn = int(np.sum((preds == 0) & (labels == 1)))

        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        f1 = 2 * prec * recall / (prec + recall) if (prec + recall) > 0 else 0.0
        brier = float(brier_score_loss(labels, probs))
        ece = compute_ece(probs, labels)

        cm = confusion_matrix(labels, preds).tolist()

        test_results = {
            "evaluation_cohort": "Untouched GRAZPEDWRI-DX Pediatric Test Cohort",
            "total_test_samples": len(labels),
            "test_fractures": int(np.sum(labels == 1)),
            "test_non_fractures": int(np.sum(labels == 0)),
            "frozen_operating_threshold": threshold,
            "metrics": {
                "recall": round(recall * 100, 2),
                "specificity": round(spec * 100, 2),
                "precision": round(prec * 100, 2),
                "npv": round(npv * 100, 2),
                "f1": round(f1, 4),
                "roc_auc": round(auc_roc, 4),
                "pr_auc": round(pr_auc, 4),
                "brier_score": round(brier, 4),
                "ece": round(ece * 100, 2),
            },
            "confusion_matrix": {
                "tp": tp,
                "fp": fp,
                "tn": tn,
                "fn": fn,
                "raw_matrix": cm
            }
        }

        json_path = os.path.join(output_dir, "test_results.json")
        with open(json_path, "w") as f:
            json.dump(test_results, f, indent=2)

        print("\n" + "=" * 70)
        print("UNTOUCHED PEDIATRIC TEST EVALUATION RESULTS")
        print("=" * 70)
        print(f"Cohort: {len(labels)} test radiographs ({int(np.sum(labels==1))} Fractured, {int(np.sum(labels==0))} Non-fractured)")
        print(f"Operating Threshold: {threshold}")
        print(f"Test Recall / Sensitivity: {test_results['metrics']['recall']}%")
        print(f"Test Specificity:          {test_results['metrics']['specificity']}%")
        print(f"Test Precision / PPV:      {test_results['metrics']['precision']}%")
        print(f"Test NPV:                  {test_results['metrics']['npv']}%")
        print(f"Test F1 Score:             {test_results['metrics']['f1']}")
        print(f"Test ROC-AUC:              {test_results['metrics']['roc_auc']}")
        print(f"Test PR-AUC:               {test_results['metrics']['pr_auc']}")
        print(f"Test Brier Score:          {test_results['metrics']['brier_score']}")
        print(f"Test ECE:                  {test_results['metrics']['ece']}%")
        print(f"Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")

        return test_results
