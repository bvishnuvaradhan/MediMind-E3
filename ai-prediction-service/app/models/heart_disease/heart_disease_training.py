"""Reproducible training and evaluation pipeline for cardiovascular risk models."""

import json
from pathlib import Path
from typing import Any, Dict

import joblib
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

from app.models.heart_disease.heart_disease_preprocessing import (
    CARDIOVASCULAR_FEATURES,
    TARGET_COLUMN,
    load_cardiovascular_dataset,
)


RANDOM_STATE = 42
MODEL_NAME = "heart_disease_risk"
MODEL_VERSION = "0.1.0"


def prepare_training_data(path: str | Path) -> tuple[pd.DataFrame, pd.Series, Dict[str, int]]:
    """Load numeric data, reject invalid targets, and remove exact duplicate rows."""
    dataset = load_cardiovascular_dataset(path).apply(pd.to_numeric, errors="coerce")
    rows_before = len(dataset)
    dataset = dataset.dropna(subset=CARDIOVASCULAR_FEATURES + [TARGET_COLUMN])
    dataset = dataset[dataset[TARGET_COLUMN].isin([0, 1])]
    dataset = dataset.drop_duplicates().reset_index(drop=True)
    stats = {
        "rows_before": rows_before,
        "rows_after": len(dataset),
        "duplicates_removed": rows_before - len(dataset),
    }
    return dataset[CARDIOVASCULAR_FEATURES], dataset[TARGET_COLUMN].astype("int64"), stats


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


def exploratory_profile(features: pd.DataFrame, target: pd.Series) -> Dict[str, Any]:
    """Summarize distributions, IQR outliers, and feature/target relationships."""
    distribution = {}
    relationships = {}
    for column in CARDIOVASCULAR_FEATURES:
        series = features[column]
        first_quartile = float(series.quantile(0.25))
        third_quartile = float(series.quantile(0.75))
        iqr = third_quartile - first_quartile
        lower_bound = first_quartile - 1.5 * iqr
        upper_bound = third_quartile + 1.5 * iqr
        distribution[column] = {
            "min": float(series.min()),
            "max": float(series.max()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "q1": first_quartile,
            "q3": third_quartile,
            "iqr_outlier_count": int(((series < lower_bound) | (series > upper_bound)).sum()),
        }
        relationships[column] = {
            "mean_target_0": float(series[target == 0].mean()),
            "mean_target_1": float(series[target == 1].mean()),
        }
    return {"distributions": distribution, "feature_target_relationships": relationships}


def _classification_metrics(target: pd.Series, probabilities: Any) -> Dict[str, Any]:
    predictions = (probabilities >= 0.5).astype(int)
    true_negative, false_positive, false_negative, true_positive = confusion_matrix(
        target, predictions, labels=[0, 1]
    ).ravel()
    return {
        "recall": float(recall_score(target, predictions, zero_division=0)),
        "specificity": float(true_negative / (true_negative + false_positive)),
        "precision": float(precision_score(target, predictions, zero_division=0)),
        "f1": float(f1_score(target, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(target, probabilities)),
        "pr_auc": float(average_precision_score(target, probabilities)),
        "brier_score": float(brier_score_loss(target, probabilities)),
        "confusion_matrix": [[int(true_negative), int(false_positive)], [int(false_negative), int(true_positive)]],
    }


def train_and_evaluate(
    dataset_path: str | Path,
    artifact_dir: str | Path,
) -> Dict[str, Any]:
    """Train baselines and a regularized MLP, evaluate on validation/test data, and save artifacts."""
    features, target, preparation = prepare_training_data(dataset_path)
    partitions = split_dataset(features, target)
    artifact_path = Path(artifact_dir)
    artifact_path.mkdir(parents=True, exist_ok=True)

    models = {
        "logistic_regression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)),
        ]),
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
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
    for name, model in models.items():
        model.fit(partitions["x_train"], partitions["y_train"])
        validation_probabilities = model.predict_proba(partitions["x_validation"])[:, 1]
        test_probabilities = model.predict_proba(partitions["x_test"])[:, 1]
        evaluations[name] = {
            "validation": _classification_metrics(partitions["y_validation"], validation_probabilities),
            "test": _classification_metrics(partitions["y_test"], test_probabilities),
        }
        joblib.dump(model, artifact_path / f"{name}.joblib")

    best_model_name = max(
        evaluations,
        key=lambda name: evaluations[name]["validation"]["roc_auc"],
    )
    joblib.dump(models[best_model_name], artifact_path / "best_model.joblib")
    report = {
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "random_state": RANDOM_STATE,
        "feature_columns": CARDIOVASCULAR_FEATURES,
        "split_ratios": {"train": 0.70, "validation": 0.15, "test": 0.15},
        "split_sizes": {
            key: int(len(partitions[key]))
            for key in ("x_train", "x_validation", "x_test")
        },
        "class_balance": {
            key: {str(label): int(count) for label, count in partitions[f"y_{key}"].value_counts().sort_index().items()}
            for key in ("train", "validation", "test")
        },
        "preparation": preparation,
        "eda": exploratory_profile(features, target),
        "models": evaluations,
        "selected_model": best_model_name,
    }
    (artifact_path / "training_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report