"""Reproducible training and evaluation pipeline for the Diabetes Risk model.

Dataset:
    Pima Indians Diabetes Database (NIDDK / UCI / Kaggle).
    768 records, 8 numeric features, binary target (Outcome).

Training:
    Stratified 70/15/15 split (random_state=42).
    Logistic Regression baseline, Random Forest, and MLP evaluated.
    Model selected by validation ROC-AUC.
    Threshold tuned on validation partition (specificity floor 0.60).
    Test partition used for evaluation only.

Artifacts saved to artifact_dir/:
    logistic_regression.joblib
    random_forest.joblib
    mlp.joblib
    best_model.joblib
    training_report.json
"""

import json
import time
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.models.diabetes.diabetes_preprocessing import (
    BIOLOGICAL_ZERO_COLUMNS,
    DIABETES_FEATURES,
    TARGET_COLUMN,
    apply_biological_zero_imputation,
    compute_imputation_medians,
    load_diabetes_dataset,
)


RANDOM_STATE = 42
MODEL_NAME = "diabetes_risk"
MODEL_VERSION = "0.1.0"


# ─────────────────────────────────────────────────────────────────────────────
# Data preparation
# ─────────────────────────────────────────────────────────────────────────────

def prepare_training_data(
    path: str | Path,
) -> tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
    """Load, coerce to numeric, reject invalid targets, remove duplicates.

    Biological zero imputation is NOT applied here — it is applied after
    splitting to avoid leakage.

    Returns:
        (features, target, preparation_stats)
    """
    dataset = load_diabetes_dataset(path).apply(pd.to_numeric, errors="coerce")
    rows_before = len(dataset)
    dataset = dataset.dropna(subset=DIABETES_FEATURES + [TARGET_COLUMN])
    dataset = dataset[dataset[TARGET_COLUMN].isin([0, 1])]
    rows_before_dedup = len(dataset)

    duplicate_rows = dataset[dataset.duplicated(keep="first")]
    dataset = dataset.drop_duplicates().reset_index(drop=True)

    biological_zero_counts = {
        column: int((dataset[column] == 0).sum())
        for column in BIOLOGICAL_ZERO_COLUMNS
    }

    stats = {
        "rows_before": rows_before,
        "rows_before_deduplication": rows_before_dedup,
        "rows_after": len(dataset),
        "duplicates_removed": len(duplicate_rows),
        "raw_class_balance": {
            str(label): int(count)
            for label, count in dataset[TARGET_COLUMN].value_counts().sort_index().items()
        },
        "biological_zeros_before_imputation": biological_zero_counts,
    }
    return dataset[DIABETES_FEATURES], dataset[TARGET_COLUMN].astype("int64"), stats


def split_dataset(
    features: pd.DataFrame,
    target: pd.Series,
) -> Dict[str, Any]:
    """Create stratified 70/15/15 train, validation, and test partitions."""
    x_train, x_holdout, y_train, y_holdout = train_test_split(
        features,
        target,
        test_size=0.30,
        stratify=target,
        random_state=RANDOM_STATE,
    )
    x_validation, x_test, y_validation, y_test = train_test_split(
        x_holdout,
        y_holdout,
        test_size=0.50,
        stratify=y_holdout,
        random_state=RANDOM_STATE,
    )
    return {
        "x_train": x_train,
        "x_validation": x_validation,
        "x_test": x_test,
        "y_train": y_train,
        "y_validation": y_validation,
        "y_test": y_test,
    }


def apply_imputation_to_partitions(
    partitions: Dict[str, Any],
) -> tuple[Dict[str, Any], Dict[str, float]]:
    """Compute medians on training set and apply to all partitions.

    The medians are computed on the training partition only, then applied to
    validation and test partitions to avoid data leakage.

    Returns:
        (updated_partitions, training_medians)
    """
    medians = compute_imputation_medians(partitions["x_train"])
    partitions = dict(partitions)  # shallow copy
    partitions["x_train"] = apply_biological_zero_imputation(partitions["x_train"], medians)
    partitions["x_validation"] = apply_biological_zero_imputation(partitions["x_validation"], medians)
    partitions["x_test"] = apply_biological_zero_imputation(partitions["x_test"], medians)
    return partitions, medians


# ─────────────────────────────────────────────────────────────────────────────
# EDA
# ─────────────────────────────────────────────────────────────────────────────

def exploratory_profile(
    features: pd.DataFrame,
    target: pd.Series,
) -> Dict[str, Any]:
    """Summarize distributions, IQR outliers, and feature-target relationships."""
    distribution: Dict[str, Any] = {}
    relationships: Dict[str, Any] = {}
    for column in DIABETES_FEATURES:
        series = features[column]
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        distribution[column] = {
            "min": float(series.min()),
            "max": float(series.max()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "q1": q1,
            "q3": q3,
            "iqr_outlier_count": int(((series < lower) | (series > upper)).sum()),
        }
        relationships[column] = {
            "mean_target_0": float(series[target == 0].mean()),
            "mean_target_1": float(series[target == 1].mean()),
        }
    return {"distributions": distribution, "feature_target_relationships": relationships}


# ─────────────────────────────────────────────────────────────────────────────
# Metrics
# ─────────────────────────────────────────────────────────────────────────────

def _classification_metrics(
    target: pd.Series,
    probabilities: Any,
    threshold: float = 0.5,
) -> Dict[str, Any]:
    probabilities = np.asarray(probabilities)
    predictions = (probabilities >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(target, predictions, labels=[0, 1]).ravel()
    return {
        "threshold": threshold,
        "recall": float(recall_score(target, predictions, zero_division=0)),
        "specificity": float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0,
        "precision": float(precision_score(target, predictions, zero_division=0)),
        "f1": float(f1_score(target, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(target, probabilities)),
        "pr_auc": float(average_precision_score(target, probabilities)),
        "brier_score": float(brier_score_loss(target, probabilities)),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
    }


def tune_threshold(
    target: pd.Series,
    probabilities: Any,
    minimum_specificity: float = 0.60,
) -> Dict[str, Any]:
    """Select a validation threshold that maximises recall under a specificity floor."""
    candidates = []
    for t in [i / 100 for i in range(5, 100, 5)]:
        metrics = _classification_metrics(target, probabilities, t)
        if metrics["specificity"] >= minimum_specificity:
            candidates.append(metrics)
    if not candidates:
        return _classification_metrics(target, probabilities, 0.5)
    return max(candidates, key=lambda m: (m["recall"], m["f1"]))


def calibration_summary(
    target: pd.Series,
    probabilities: Any,
    bins: int = 10,
) -> Dict[str, Any]:
    """Return reliability-bin statistics and expected calibration error."""
    probabilities = np.asarray(probabilities)
    frame = pd.DataFrame({"target": np.asarray(target), "probability": probabilities})
    frame["bin"] = pd.cut(frame["probability"], bins=bins, labels=False, include_lowest=True)
    grouped = frame.groupby("bin", observed=True)
    rows = []
    weighted_error = 0.0
    for _, group in grouped:
        mean_prob = float(group["probability"].mean())
        obs_rate = float(group["target"].mean())
        weight = len(group) / len(frame)
        weighted_error += weight * abs(mean_prob - obs_rate)
        rows.append({
            "count": int(len(group)),
            "mean_probability": mean_prob,
            "observed_rate": obs_rate,
        })
    return {"expected_calibration_error": float(weighted_error), "bins": rows}


def error_analysis(
    target: pd.Series,
    probabilities: Any,
    threshold: float,
) -> Dict[str, Any]:
    """Summarize false positives and false negatives for clinical review."""
    predictions = (np.asarray(probabilities) >= threshold).astype(int)
    target_arr = np.asarray(target)
    fp = int(((target_arr == 0) & (predictions == 1)).sum())
    fn = int(((target_arr == 1) & (predictions == 0)).sum())
    neg_total = int((target_arr == 0).sum())
    pos_total = int((target_arr == 1).sum())
    return {
        "threshold": threshold,
        "false_positive_count": fp,
        "false_negative_count": fn,
        "error_count": fp + fn,
        "false_positive_rate": float(fp / neg_total) if neg_total > 0 else 0.0,
        "false_negative_rate": float(fn / pos_total) if pos_total > 0 else 0.0,
    }


def subgroup_metrics(
    features: pd.DataFrame,
    target: pd.Series,
    probabilities: Any,
    threshold: float,
) -> Dict[str, Any]:
    """Evaluate model behaviour across age bands and other clinical subgroups."""
    probabilities = np.asarray(probabilities)
    groups = {
        "AGE_BAND": {
            "21-30": (features["Age"] >= 21) & (features["Age"] <= 30),
            "31-45": (features["Age"] >= 31) & (features["Age"] <= 45),
            "46-60": (features["Age"] >= 46) & (features["Age"] <= 60),
            "61+": features["Age"] >= 61,
        },
        "BMI_CATEGORY": {
            "underweight_normal": features["BMI"] < 25.0,
            "overweight": (features["BMI"] >= 25.0) & (features["BMI"] < 30.0),
            "obese": features["BMI"] >= 30.0,
        },
    }
    report: Dict[str, Any] = {}
    for dimension, dim_groups in groups.items():
        report[dimension] = {}
        for group_name, mask in dim_groups.items():
            mask_arr = mask.to_numpy()
            g_target = target.to_numpy()[mask_arr]
            g_probs = probabilities[mask_arr]
            if len(g_target) == 0:
                continue
            metrics = _classification_metrics(g_target, g_probs, threshold)
            if len(np.unique(g_target)) < 2:
                metrics["roc_auc"] = None
            metrics["count"] = int(len(g_target))
            metrics["prevalence"] = float(g_target.mean())
            report[dimension][group_name] = metrics
    return report


# ─────────────────────────────────────────────────────────────────────────────
# Main training entry point
# ─────────────────────────────────────────────────────────────────────────────

def train_and_evaluate(
    dataset_path: str | Path,
    artifact_dir: str | Path,
) -> Dict[str, Any]:
    """Train baselines and an MLP, evaluate on validation/test data, save artifacts.

    Usage from ai-prediction-service/:
        py -c "from app.models.diabetes.diabetes_training import train_and_evaluate; \
               train_and_evaluate('test-dataset/Diabetes/diabetes.csv', 'artifacts/diabetes')"

    Args:
        dataset_path: Path to the Pima Indians Diabetes CSV file.
        artifact_dir:  Directory where model artifacts will be saved.

    Returns:
        Training report dictionary (also saved as training_report.json).
    """
    features, target, preparation = prepare_training_data(dataset_path)
    partitions = split_dataset(features, target)
    partitions, training_medians = apply_imputation_to_partitions(partitions)

    artifact_path = Path(artifact_dir)
    artifact_path.mkdir(parents=True, exist_ok=True)

    models = {
        "logistic_regression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)),
        ]),
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=3,
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
        "mlp": Pipeline([
            ("scaler", StandardScaler()),
            ("model", MLPClassifier(
                hidden_layer_sizes=(32, 16),
                alpha=0.001,
                early_stopping=True,
                validation_fraction=0.15,
                n_iter_no_change=15,
                max_iter=300,
                random_state=RANDOM_STATE,
            )),
        ]),
    }

    evaluations: Dict[str, Any] = {}
    training_diagnostics: Dict[str, Any] = {}

    for name, model in models.items():
        print(f"[diabetes] training {name} on {len(partitions['x_train'])} rows...", flush=True)
        started_at = time.perf_counter()
        model.fit(partitions["x_train"], partitions["y_train"])
        duration = time.perf_counter() - started_at

        diagnostics: Dict[str, Any] = {
            "status": "completed",
            "duration_seconds": round(duration, 3),
        }
        if name == "mlp":
            mlp_model = model.named_steps["model"]
            diagnostics.update({
                "iterations_completed": int(mlp_model.n_iter_),
                "maximum_iterations": int(mlp_model.max_iter),
                "stopped_early": bool(mlp_model.n_iter_ < mlp_model.max_iter),
                "early_stopping_enabled": bool(mlp_model.early_stopping),
                "final_loss": float(mlp_model.loss_),
            })
        elif name == "random_forest":
            diagnostics["estimators_trained"] = int(model.n_estimators)
            diagnostics["maximum_depth"] = model.max_depth

        training_diagnostics[name] = diagnostics
        print(f"[diabetes] completed {name} in {duration:.2f}s", flush=True)

        val_probs = model.predict_proba(partitions["x_validation"])[:, 1]
        test_probs = model.predict_proba(partitions["x_test"])[:, 1]
        evaluations[name] = {
            "validation": _classification_metrics(partitions["y_validation"], val_probs),
            "test": _classification_metrics(partitions["y_test"], test_probs),
        }
        joblib.dump(model, artifact_path / f"{name}.joblib")

    best_model_name = max(
        evaluations,
        key=lambda n: evaluations[n]["validation"]["roc_auc"],
    )
    best_model = models[best_model_name]
    best_val_probs = best_model.predict_proba(partitions["x_validation"])[:, 1]
    tuned_val_metrics = tune_threshold(
        partitions["y_validation"],
        best_val_probs,
        minimum_specificity=0.60,
    )
    best_test_probs = best_model.predict_proba(partitions["x_test"])[:, 1]
    tuned_threshold = tuned_val_metrics["threshold"]

    evaluations[best_model_name]["tuned_validation"] = tuned_val_metrics
    evaluations[best_model_name]["tuned_test"] = _classification_metrics(
        partitions["y_test"], best_test_probs, tuned_threshold
    )

    calibration = calibration_summary(partitions["y_test"], best_test_probs)
    errors = error_analysis(partitions["y_test"], best_test_probs, tuned_threshold)
    subgroups = subgroup_metrics(
        partitions["x_test"],
        partitions["y_test"],
        best_test_probs,
        tuned_threshold,
    )

    joblib.dump(best_model, artifact_path / "best_model.joblib")

    report = {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "random_state": RANDOM_STATE,
        "feature_columns": DIABETES_FEATURES,
        "biological_zero_columns": BIOLOGICAL_ZERO_COLUMNS,
        "training_imputation_medians": training_medians,
        "split_ratios": {"train": 0.70, "validation": 0.15, "test": 0.15},
        "split_sizes": {
            key: int(len(partitions[key]))
            for key in ("x_train", "x_validation", "x_test")
        },
        "class_balance": {
            key: {
                str(label): int(count)
                for label, count in partitions[f"y_{key}"].value_counts().sort_index().items()
            }
            for key in ("train", "validation", "test")
        },
        "preparation": preparation,
        "eda": exploratory_profile(partitions["x_train"], partitions["y_train"]),
        "models": evaluations,
        "training_diagnostics": training_diagnostics,
        "selected_model": best_model_name,
        "selected_threshold": tuned_threshold,
        "calibration": calibration,
        "error_analysis": errors,
        "subgroups": subgroups,
        "threshold_provenance": {
            "source_partition": "validation",
            "selection_metric": "recall",
            "tie_breaker": "f1",
            "minimum_specificity": 0.60,
            "candidate_thresholds": "0.05 to 0.95 in 0.05 steps",
            "test_partition_usage": "evaluation only; never used to select the threshold",
        },
        "model_card": {
            "output_interpretation": "Estimated diabetes risk probability and risk category.",
            "not_a_diagnosis": "This model does not diagnose diabetes.",
            "clinical_use": "Results require qualified clinician review and must not replace clinical judgment.",
        },
    }

    (artifact_path / "training_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(
        f"[diabetes] training complete. Best model: {best_model_name} "
        f"(val ROC-AUC={evaluations[best_model_name]['validation']['roc_auc']:.4f}). "
        f"Threshold: {tuned_threshold}. Artifacts saved to: {artifact_path}",
        flush=True,
    )
    return report
