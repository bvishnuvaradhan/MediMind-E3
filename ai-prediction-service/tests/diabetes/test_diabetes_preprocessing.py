"""
test_diabetes_preprocessing.py — Unit tests for the Diabetes preprocessing module.

Covers:
- Feature contract (DIABETES_FEATURES list structure and content)
- Dataset loading validation (column schema check)
- Biological-zero column enumeration
- Imputation median computation
- Imputation application
- Prepared dataset shape and value validity
- Threshold and calibration utility functions (data-only, no artifact required)

Dataset-dependent tests skip cleanly when the local CSV is not available.
"""

from pathlib import Path

import pandas as pd
import pytest

from app.models.diabetes.diabetes_preprocessing import (
    BIOLOGICAL_ZERO_COLUMNS,
    DIABETES_FEATURES,
    TARGET_COLUMN,
    apply_biological_zero_imputation,
    compute_imputation_medians,
    inspect_diabetes_dataset,
    prepare_diabetes_dataset,
)
from app.models.diabetes.diabetes_training import (
    calibration_summary,
    exploratory_profile,
    prepare_training_data,
    split_dataset,
    apply_imputation_to_partitions,
    tune_threshold,
    subgroup_metrics,
)


DATASET_PATH = (
    Path(__file__).parent.parent.parent
    / "test-dataset"
    / "Diabetes"
    / "diabetes.csv"
)


# ─────────────────────────────────────────────────────────────────────────────
# Feature contract — no dataset required
# ─────────────────────────────────────────────────────────────────────────────

def test_diabetes_features_is_a_non_empty_list_of_strings():
    assert isinstance(DIABETES_FEATURES, list)
    assert len(DIABETES_FEATURES) > 0
    assert all(isinstance(f, str) for f in DIABETES_FEATURES)


def test_diabetes_features_contains_expected_pima_columns():
    expected = {
        "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
        "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
    }
    assert expected.issubset(set(DIABETES_FEATURES))


def test_diabetes_features_has_no_duplicates():
    assert len(DIABETES_FEATURES) == len(set(DIABETES_FEATURES))


def test_target_column_is_outcome():
    assert TARGET_COLUMN == "Outcome"


def test_biological_zero_columns_are_subset_of_features():
    for col in BIOLOGICAL_ZERO_COLUMNS:
        assert col in DIABETES_FEATURES, f"{col!r} in BIOLOGICAL_ZERO_COLUMNS but not in DIABETES_FEATURES"


# ─────────────────────────────────────────────────────────────────────────────
# Imputation helpers — no dataset required
# ─────────────────────────────────────────────────────────────────────────────

def _make_test_frame() -> pd.DataFrame:
    """Small synthetic frame with deliberate biological zeros."""
    return pd.DataFrame({
        "Pregnancies":               [1, 0, 2],
        "Glucose":                   [120.0, 0.0, 85.0],   # 0 = missing
        "BloodPressure":             [70.0, 60.0, 0.0],    # 0 = missing
        "SkinThickness":             [20.0, 0.0, 15.0],    # 0 = missing
        "Insulin":                   [80.0, 0.0, 0.0],     # 0 = missing
        "BMI":                       [28.5, 0.0, 32.0],    # 0 = missing
        "DiabetesPedigreeFunction":  [0.5, 0.3, 0.8],
        "Age":                       [25, 34, 50],
    })


def test_compute_imputation_medians_ignores_zeros():
    frame = _make_test_frame()
    medians = compute_imputation_medians(frame)
    # Glucose non-zero values: 120, 85 → median = 102.5
    assert "Glucose" in medians
    assert medians["Glucose"] == pytest.approx(102.5, rel=1e-3)
    # BMI non-zero values: 28.5, 32.0 → median = 30.25
    assert "BMI" in medians
    assert medians["BMI"] == pytest.approx(30.25, rel=1e-3)


def test_apply_biological_zero_imputation_replaces_zeros():
    frame = _make_test_frame()
    medians = compute_imputation_medians(frame)
    imputed = apply_biological_zero_imputation(frame, medians)

    # No zeros should remain in biological-zero columns
    for col in BIOLOGICAL_ZERO_COLUMNS:
        if col in imputed.columns:
            assert (imputed[col] == 0).sum() == 0, (
                f"Column {col!r} still has zeros after imputation"
            )


def test_apply_biological_zero_imputation_does_not_mutate_input():
    frame = _make_test_frame()
    medians = compute_imputation_medians(frame)
    original_glucose = frame["Glucose"].tolist()
    apply_biological_zero_imputation(frame, medians)
    assert frame["Glucose"].tolist() == original_glucose, (
        "apply_biological_zero_imputation must not mutate the input DataFrame"
    )


def test_compute_imputation_medians_all_zero_returns_zero():
    frame = pd.DataFrame({col: [0.0, 0.0] for col in BIOLOGICAL_ZERO_COLUMNS})
    medians = compute_imputation_medians(frame)
    for col in BIOLOGICAL_ZERO_COLUMNS:
        assert medians[col] == 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Threshold and calibration utilities — synthetic data only
# ─────────────────────────────────────────────────────────────────────────────

def test_tune_threshold_returns_valid_metrics():
    target = pd.Series([0, 0, 1, 1, 0, 1])
    probs  = [0.10, 0.35, 0.55, 0.85, 0.40, 0.70]
    result = tune_threshold(target, probs, minimum_specificity=0.50)
    assert 0.05 <= result["threshold"] <= 0.95
    assert result["specificity"] >= 0.50
    assert 0.0 <= result["recall"] <= 1.0
    assert 0.0 <= result["f1"] <= 1.0


def test_calibration_summary_returns_valid_ece():
    target = pd.Series([0, 0, 1, 1])
    probs  = [0.10, 0.40, 0.55, 0.90]
    result = calibration_summary(target, probs, bins=2)
    assert "expected_calibration_error" in result
    assert 0.0 <= result["expected_calibration_error"] <= 1.0
    assert isinstance(result["bins"], list)


# ─────────────────────────────────────────────────────────────────────────────
# Dataset-dependent tests — skip if local CSV is absent
# ─────────────────────────────────────────────────────────────────────────────

def test_diabetes_dataset_inspection():
    if not DATASET_PATH.exists():
        pytest.skip("Local diabetes dataset is not available")

    metadata = inspect_diabetes_dataset(DATASET_PATH)

    assert metadata["rows"] == 768
    assert metadata["columns"] == DIABETES_FEATURES + [TARGET_COLUMN]
    assert metadata["target_distribution"] == {"0": 500, "1": 268}
    # Glucose should have biological zeros
    assert metadata["biological_zeros"]["Glucose"] > 0


def test_diabetes_dataset_preparation_is_binary_and_numeric():
    if not DATASET_PATH.exists():
        pytest.skip("Local diabetes dataset is not available")

    features, target = prepare_diabetes_dataset(DATASET_PATH)

    assert list(features.columns) == DIABETES_FEATURES
    assert len(features) == len(target)
    assert all(dtype.kind in "fi" for dtype in features.dtypes)
    assert set(target.unique()).issubset({0, 1})
    # After imputation no biological zeros should remain
    for col in BIOLOGICAL_ZERO_COLUMNS:
        assert (features[col] == 0).sum() == 0, (
            f"Biological zeros remain in {col!r} after prepare_diabetes_dataset"
        )


def test_training_preparation_removes_duplicates_and_splits_stratified():
    if not DATASET_PATH.exists():
        pytest.skip("Local diabetes dataset is not available")

    features, target, stats = prepare_training_data(DATASET_PATH)
    partitions = split_dataset(features, target)
    partitions, medians = apply_imputation_to_partitions(partitions)
    profile = exploratory_profile(partitions["x_train"], partitions["y_train"])

    assert stats["rows_after"] <= stats["rows_before"]
    total = sum(len(partitions[k]) for k in ("x_train", "x_validation", "x_test"))
    assert total == stats["rows_after"]
    assert set(profile["distributions"]) == set(DIABETES_FEATURES)
    assert set(profile["feature_target_relationships"]) == set(DIABETES_FEATURES)
    # All imputation medians should be present
    for col in BIOLOGICAL_ZERO_COLUMNS:
        assert col in medians


def test_subgroup_metrics_are_reportable():
    if not DATASET_PATH.exists():
        pytest.skip("Local diabetes dataset is not available")

    features, target, _ = prepare_training_data(DATASET_PATH)
    partitions = split_dataset(features, target)
    partitions, _ = apply_imputation_to_partitions(partitions)

    probs = partitions["y_test"].to_numpy() * 0.7 + 0.15
    report = subgroup_metrics(partitions["x_test"], partitions["y_test"], probs, 0.5)

    assert "AGE_BAND" in report
    assert "BMI_CATEGORY" in report
    for group_data in report["AGE_BAND"].values():
        assert group_data["count"] >= 0
