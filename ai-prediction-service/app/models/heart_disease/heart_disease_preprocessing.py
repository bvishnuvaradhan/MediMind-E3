"""Dataset inspection and preprocessing for the cardiovascular dataset.

This module deliberately stops before model training and inference. It defines the
feature contract that a future heart-disease model must use.
"""

from pathlib import Path
from typing import Any, Dict

import pandas as pd


CARDIOVASCULAR_FEATURES = [
    "AGE",
    "GENDER",
    "HEIGHT",
    "WEIGHT",
    "AP_HIGH",
    "AP_LOW",
    "CHOLESTEROL",
    "GLUCOSE",
    "SMOKE",
    "ALCOHOL",
    "PHYSICAL_ACTIVITY",
]
TARGET_COLUMN = "CARDIO_DISEASE"
DATASET_COLUMNS = CARDIOVASCULAR_FEATURES + [TARGET_COLUMN]


def load_cardiovascular_dataset(path: str | Path) -> pd.DataFrame:
    """Load the semicolon-delimited cardiovascular dataset."""
    dataset = pd.read_csv(path)
    if list(dataset.columns) != DATASET_COLUMNS:
        raise ValueError(f"Unexpected cardiovascular dataset columns: {list(dataset.columns)}")
    return dataset


def inspect_cardiovascular_dataset(path: str | Path) -> Dict[str, Any]:
    """Return reproducible shape, missing-value, class-balance, and schema metadata."""
    dataset = load_cardiovascular_dataset(path)
    return {
        "rows": int(len(dataset)),
        "columns": list(dataset.columns),
        "missing_values": {
            column: int(count)
            for column, count in dataset.isna().sum().items()
            if count
        },
        "target_distribution": {
            str(label): int(count)
            for label, count in dataset[TARGET_COLUMN].value_counts(dropna=False).sort_index().items()
        },
    }


def prepare_cardiovascular_dataset(path: str | Path) -> tuple[pd.DataFrame, pd.Series]:
    """Clean numeric rows and return the binary cardiovascular target."""
    dataset = load_cardiovascular_dataset(path).apply(pd.to_numeric, errors="coerce")
    dataset = dataset.dropna(subset=DATASET_COLUMNS).copy()
    dataset = dataset.drop_duplicates().reset_index(drop=True)
    features = dataset[CARDIOVASCULAR_FEATURES]
    target = dataset[TARGET_COLUMN].astype("int64")
    return features, target