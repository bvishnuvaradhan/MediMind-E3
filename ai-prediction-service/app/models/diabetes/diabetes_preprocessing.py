"""Dataset inspection and preprocessing for the Pima Indians Diabetes dataset.

This module deliberately stops before model training and inference. It defines
the feature contract that the diabetes model must use.

Dataset:
    Pima Indians Diabetes Database (NIDDK / UCI / Kaggle).
    768 records, 8 numeric features, binary target (Outcome).

Biological-zero columns:
    Glucose, BloodPressure, SkinThickness, Insulin, and BMI cannot
    physiologically be zero. Zero values are treated as missing and must be
    imputed with training-set medians before model use.
"""

from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd


# ─────────────────────────────────────────────────────────────────────────────
# Feature contract — locked to the Pima Indians Diabetes dataset
# ─────────────────────────────────────────────────────────────────────────────

DIABETES_FEATURES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

TARGET_COLUMN = "Outcome"

DATASET_COLUMNS = DIABETES_FEATURES + [TARGET_COLUMN]

# Columns where a value of 0 is biologically impossible and must be treated as
# missing (imputed with median computed on non-zero training rows only).
BIOLOGICAL_ZERO_COLUMNS = [
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
]


# ─────────────────────────────────────────────────────────────────────────────
# Loading
# ─────────────────────────────────────────────────────────────────────────────

def load_diabetes_dataset(path: str | Path) -> pd.DataFrame:
    """Load the comma-delimited Pima Indians Diabetes dataset.

    Raises:
        ValueError: If the column schema does not match the expected contract.
    """
    dataset = pd.read_csv(path)
    if list(dataset.columns) != DATASET_COLUMNS:
        raise ValueError(
            f"Unexpected diabetes dataset columns: {list(dataset.columns)}\n"
            f"Expected: {DATASET_COLUMNS}"
        )
    return dataset


# ─────────────────────────────────────────────────────────────────────────────
# Inspection
# ─────────────────────────────────────────────────────────────────────────────

def inspect_diabetes_dataset(path: str | Path) -> Dict[str, Any]:
    """Return reproducible shape, missing-value, biological-zero, and class-balance metadata."""
    dataset = load_diabetes_dataset(path)
    biological_zeros = {
        column: int((dataset[column] == 0).sum())
        for column in BIOLOGICAL_ZERO_COLUMNS
    }
    return {
        "rows": int(len(dataset)),
        "columns": list(dataset.columns),
        "missing_values": {
            column: int(count)
            for column, count in dataset.isna().sum().items()
            if count
        },
        "biological_zeros": biological_zeros,
        "target_distribution": {
            str(label): int(count)
            for label, count in dataset[TARGET_COLUMN].value_counts(dropna=False).sort_index().items()
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Imputation
# ─────────────────────────────────────────────────────────────────────────────

def compute_imputation_medians(features: pd.DataFrame) -> Dict[str, float]:
    """Compute per-column medians on non-zero rows of the training set.

    Must be called on the training set only to avoid data leakage into
    validation or test partitions.
    """
    medians: Dict[str, float] = {}
    for column in BIOLOGICAL_ZERO_COLUMNS:
        if column in features.columns:
            non_zero = features[column][features[column] != 0]
            medians[column] = float(non_zero.median()) if len(non_zero) > 0 else 0.0
    return medians


def apply_biological_zero_imputation(
    features: pd.DataFrame,
    medians: Dict[str, float],
) -> pd.DataFrame:
    """Replace biological zeros with pre-computed training-set medians.

    Args:
        features: Feature DataFrame (may be train, validation, or test partition).
        medians:  Medians computed from the training partition only.

    Returns:
        Copy of features with biological zeros replaced.
    """
    features = features.copy()
    for column, median_value in medians.items():
        if column in features.columns:
            features.loc[features[column] == 0, column] = median_value
    return features


# ─────────────────────────────────────────────────────────────────────────────
# Combined prepare helper (used by tests and training pipeline)
# ─────────────────────────────────────────────────────────────────────────────

def prepare_diabetes_dataset(path: str | Path) -> tuple[pd.DataFrame, pd.Series]:
    """Load, coerce to numeric, drop invalid rows, and apply imputation.

    Note:
        This function applies imputation medians computed across the full
        dataset. It is intended for quick inspection and unit testing.
        For reproducible training, use ``prepare_training_data`` from
        ``diabetes_training.py`` which computes medians on the training
        partition only.

    Returns:
        (features, target) where biological zeros are imputed and all
        values are finite numeric.
    """
    dataset = load_diabetes_dataset(path).apply(pd.to_numeric, errors="coerce")
    dataset = dataset.dropna(subset=DATASET_COLUMNS)
    dataset = dataset[dataset[TARGET_COLUMN].isin([0, 1])]
    dataset = dataset.drop_duplicates().reset_index(drop=True)

    features = dataset[DIABETES_FEATURES].copy()
    medians = compute_imputation_medians(features)
    features = apply_biological_zero_imputation(features, medians)

    target = dataset[TARGET_COLUMN].astype("int64")
    return features, target
