"""Subgroup Fairness, Disparity Evaluation, and Algorithmic Equity.

Audits:
- Demographic Parity Difference
- Equal Opportunity Difference (True Positive Rate disparity)
- Predictive Parity (Precision disparity)
- 95% Wilson Score confidence intervals for subgroup sensitivity and specificity
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, roc_auc_score


def wilson_score_interval(count: int, total: int, confidence: float = 0.95) -> Dict[str, float]:
    """Calculate Wilson score confidence interval for a binomial proportion."""
    if total == 0:
        return {"estimate": 0.0, "ci_lower": 0.0, "ci_upper": 0.0}
    z = 1.95996  # 95% normal quantile
    p = count / total
    denom = 1 + z**2 / total
    centre = (p + z**2 / (2 * total)) / denom
    margin = (z * np.sqrt((p * (1 - p) + z**2 / (4 * total)) / total)) / denom
    return {
        "estimate": float(round(p, 4)),
        "ci_lower": float(round(max(0.0, centre - margin), 4)),
        "ci_upper": float(round(min(1.0, centre + margin), 4)),
    }


def evaluate_subgroup_fairness(
    features_df: pd.DataFrame,
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.30,
) -> Dict[str, Any]:
    """Evaluate performance disparities across age and BMI subgroups."""
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)
    y_pred = (y_prob >= threshold).astype(int)

    # Subgroups
    subgroups = {
        "age_cohort": {
            "young_adult (21-34)": (features_df["Age"] >= 21) & (features_df["Age"] <= 34),
            "middle_age (35-49)": (features_df["Age"] >= 35) & (features_df["Age"] <= 49),
            "older_adult (50+)": features_df["Age"] >= 50,
        },
        "bmi_tier": {
            "normal_overweight (<30)": features_df["BMI"] < 30.0,
            "obese_class_1_2 (30-40)": (features_df["BMI"] >= 30.0) & (features_df["BMI"] < 40.0),
            "severe_obese (40+)": features_df["BMI"] >= 40.0,
        },
    }

    if "IsFemale" in features_df.columns:
        subgroups["gender"] = {
            "male": features_df["IsFemale"] == 0.0,
            "female": features_df["IsFemale"] == 1.0,
        }

    results: Dict[str, Any] = {}
    for dimension, groups in subgroups.items():
        results[dimension] = {}
        tpr_list = []
        fpr_list = []
        selection_rates = []

        for group_name, mask in groups.items():
            mask_arr = mask.to_numpy()
            n_sub = int(np.sum(mask_arr))
            if n_sub == 0:
                continue

            sub_y = y_true[mask_arr]
            sub_pred = y_pred[mask_arr]
            sub_prob = y_prob[mask_arr]

            tn, fp, fn, tp = confusion_matrix(sub_y, sub_pred, labels=[0, 1]).ravel()
            pos = tp + fn
            neg = tn + fp

            sens_ci = wilson_score_interval(tp, pos)
            spec_ci = wilson_score_interval(tn, neg)
            selection_rate = float(np.mean(sub_pred))

            tpr = tp / pos if pos > 0 else 0.0
            fpr = fp / neg if neg > 0 else 0.0
            tpr_list.append(tpr)
            fpr_list.append(fpr)
            selection_rates.append(selection_rate)

            auc = None
            if len(np.unique(sub_y)) > 1:
                try:
                    auc = float(roc_auc_score(sub_y, sub_prob))
                except Exception:
                    pass

            results[dimension][group_name] = {
                "sample_size": n_sub,
                "prevalence": float(round(np.mean(sub_y), 4)),
                "selection_rate": float(round(selection_rate, 4)),
                "sensitivity": sens_ci,
                "specificity": spec_ci,
                "roc_auc": round(auc, 4) if auc is not None else None,
                "tp": int(tp),
                "fp": int(fp),
                "fn": int(fn),
                "tn": int(tn),
            }

        # Disparity metrics
        if tpr_list:
            results[dimension]["disparity_summary"] = {
                "max_tpr_gap (Equal Opportunity)": float(round(max(tpr_list) - min(tpr_list), 4)),
                "max_fpr_gap (Predictive Equality)": float(round(max(fpr_list) - min(fpr_list), 4)),
                "demographic_parity_gap": float(round(max(selection_rates) - min(selection_rates), 4)),
            }

    return results
