from pathlib import Path

import pytest

from app.models.heart_disease.heart_disease_preprocessing import (
    CARDIOVASCULAR_FEATURES,
    inspect_cardiovascular_dataset,
    prepare_cardiovascular_dataset,
)
from app.models.heart_disease.heart_disease_training import (
    calibration_summary,
    exploratory_profile,
    tune_threshold,
    prepare_training_data,
    split_dataset,
)


DATASET_PATH = (
    Path(__file__).parent.parent.parent
    / "test-dataset"
    / "Heart Disease"
    / "cardiovascular_diseases_dv3.csv"
)


def test_cardiovascular_dataset_inspection():
    if not DATASET_PATH.exists():
        pytest.skip("Local heart-disease dataset is not available")

    metadata = inspect_cardiovascular_dataset(DATASET_PATH)

    assert metadata["rows"] == 68783
    assert metadata["columns"] == CARDIOVASCULAR_FEATURES + ["CARDIO_DISEASE"]
    assert metadata["missing_values"] == {}
    assert metadata["target_distribution"] == {"0": 34742, "1": 34041}


def test_cardiovascular_dataset_preparation_is_binary_and_numeric():
    if not DATASET_PATH.exists():
        pytest.skip("Local heart-disease dataset is not available")

    features, target = prepare_cardiovascular_dataset(DATASET_PATH)

    assert list(features.columns) == CARDIOVASCULAR_FEATURES
    assert len(features) == len(target)
    assert all(dtype.kind in "fi" for dtype in features.dtypes)
    assert set(target.unique()).issubset({0, 1})


def test_training_preparation_removes_duplicates_and_splits_stratified():
    if not DATASET_PATH.exists():
        pytest.skip("Local heart-disease dataset is not available")

    features, target, stats = prepare_training_data(DATASET_PATH)
    partitions = split_dataset(features, target)
    profile = exploratory_profile(features, target)

    assert stats["duplicates_removed"] == 3820
    assert len(features) == 64963
    assert sum(len(partitions[key]) for key in ("x_train", "x_validation", "x_test")) == len(features)
    assert set(profile["distributions"]) == set(CARDIOVASCULAR_FEATURES)
    assert set(profile["feature_target_relationships"]) == set(CARDIOVASCULAR_FEATURES)


def test_threshold_and_calibration_reports_are_deterministic():
    target = __import__("pandas").Series([0, 0, 1, 1])
    probabilities = [0.10, 0.40, 0.55, 0.90]

    threshold_metrics = tune_threshold(target, probabilities, minimum_specificity=0.50)
    calibration = calibration_summary(target, probabilities, bins=2)

    assert 0.05 <= threshold_metrics["threshold"] <= 0.95
    assert threshold_metrics["specificity"] >= 0.50
    assert 0.0 <= calibration["expected_calibration_error"] <= 1.0