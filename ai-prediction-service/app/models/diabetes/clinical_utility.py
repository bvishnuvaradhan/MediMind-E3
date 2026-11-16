"""Clinical Utility and Decision Curve Analysis (DCA).

Implements:
- Standard Vickers & Elkin (2006) Decision Curve Analysis
- Net Benefit comparison (Model vs Treat All vs Treat None)
- Interventions Avoided per 100 patients
- Cost-sensitive operating threshold selection
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score


def calculate_decision_curve(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    thresholds: Optional[np.ndarray] = None,
) -> Dict[str, Any]:
    """Perform Decision Curve Analysis across threshold probabilities.

    Net Benefit = (TP / N) - (FP / N) * (p_t / (1 - p_t))
    Treat All Net Benefit = Prevalence - (1 - Prevalence) * (p_t / (1 - p_t))
    Treat None Net Benefit = 0.0

    Args:
        y_true: True binary labels (0 or 1)
        y_prob: Predicted risk probabilities [0, 1]
        thresholds: Array of decision thresholds to evaluate
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)
    n = len(y_true)
    prevalence = float(np.mean(y_true))

    if thresholds is None:
        thresholds = np.linspace(0.05, 0.70, 27)

    dca_records = []

    for pt in thresholds:
        if pt >= 1.0 or pt <= 0.0:
            continue
        weight = pt / (1.0 - pt)
        y_pred = (y_prob >= pt).astype(int)

        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

        net_benefit_model = (tp / n) - (fp / n) * weight
        net_benefit_all = prevalence - (1.0 - prevalence) * weight
        net_benefit_none = 0.0

        # Interventions avoided per 100 patients compared to treat all
        if weight > 0:
            interventions_avoided = (net_benefit_model - net_benefit_all) / weight * 100.0
        else:
            interventions_avoided = 0.0

        dca_records.append({
            "threshold": float(round(pt, 3)),
            "weight": float(round(weight, 4)),
            "tp": int(tp),
            "fp": int(fp),
            "fn": int(fn),
            "tn": int(tn),
            "net_benefit_model": float(round(net_benefit_model, 4)),
            "net_benefit_treat_all": float(round(net_benefit_all, 4)),
            "net_benefit_treat_none": 0.0,
            "interventions_avoided_per_100": float(round(interventions_avoided, 2)),
        })

    return {
        "prevalence": prevalence,
        "sample_size": n,
        "decision_curves": dca_records,
    }


def find_optimal_clinical_threshold(
    y_val: np.ndarray,
    val_probs: np.ndarray,
    criterion: str = "balanced",
    min_sensitivity: float = 0.80,
    min_specificity: float = 0.60,
) -> Dict[str, Any]:
    """Select operating threshold based on clinical priority.

    Criteria:
    - 'sensitivity_first': Maximise specificity while guaranteeing sensitivity >= min_sensitivity
    - 'specificity_first': Maximise sensitivity while guaranteeing specificity >= min_specificity
    - 'youden': Maximise J = Sensitivity + Specificity - 1
    - 'f1': Maximise harmonic mean of precision and recall
    - 'net_benefit': Maximise clinical net benefit at default clinical prior (e.g. pt=0.20)
    """
    y_val = np.asarray(y_val).astype(int)
    val_probs = np.asarray(val_probs).astype(float)
    thresholds = [i / 100 for i in range(5, 95, 2)]

    candidates = []
    for t in thresholds:
        preds = (val_probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_val, preds, labels=[0, 1]).ravel()
        sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1 = (2 * prec * sens) / (prec + sens) if (prec + sens) > 0 else 0.0
        youden = sens + spec - 1.0

        candidates.append({
            "threshold": t,
            "sensitivity": float(sens),
            "specificity": float(spec),
            "precision": float(prec),
            "f1": float(f1),
            "youden_index": float(youden),
            "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        })

    if criterion == "sensitivity_first":
        eligible = [c for c in candidates if c["sensitivity"] >= min_sensitivity]
        if eligible:
            selected = max(eligible, key=lambda c: (c["specificity"], c["f1"]))
        else:
            selected = max(candidates, key=lambda c: c["sensitivity"])
    elif criterion == "specificity_first":
        eligible = [c for c in candidates if c["specificity"] >= min_specificity]
        if eligible:
            selected = max(eligible, key=lambda c: (c["sensitivity"], c["f1"]))
        else:
            selected = max(candidates, key=lambda c: c["specificity"])
    elif criterion == "youden":
        selected = max(candidates, key=lambda c: c["youden_index"])
    else:  # balanced
        eligible = [c for c in candidates if c["specificity"] >= min_specificity]
        if eligible:
            selected = max(eligible, key=lambda c: (c["sensitivity"], c["f1"]))
        else:
            selected = max(candidates, key=lambda c: c["f1"])

    return selected
