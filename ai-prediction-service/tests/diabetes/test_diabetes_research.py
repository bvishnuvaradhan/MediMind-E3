"""Comprehensive Test Suite for Multi-Cohort Calibrated Diabetes Risk Research System.

Validates:
1. Dataset ingestion, schemas, and checksum manifests
2. Harmonization across Pima, Healthcare 100k, and NHANES
3. Physiological range boundaries and imputation robustness
4. Calibration metrics (Brier, ECE, Platt scaling)
5. Decision Curve Analysis (DCA) and clinical Net Benefit
6. Subgroup fairness auditing (Wilson score CIs, disparity gaps)
7. Explainability attributions (Permutation importance and local drivers)
8. Adversarial audit of Frankfurt Hospital duplication
9. Backward compatibility with MediMind Prediction schemas
"""

from pathlib import Path
import json
import numpy as np
import pandas as pd
import pytest

from app.models.diabetes.calibration import (
    CalibratedModelWrapper,
    compute_expected_calibration_error,
)
from app.models.diabetes.clinical_utility import (
    calculate_decision_curve,
    find_optimal_clinical_threshold,
)
from app.models.diabetes.dataset_harmonization import (
    HARMONIZED_CORE_FEATURES,
    PHYSIOLOGICAL_BOUNDS,
    PIMA_COLUMNS,
    DiabetesPreprocessor,
    harmonize_healthcare100k_to_core,
    harmonize_nhanes_to_core,
    harmonize_pima_to_core,
)
from app.models.diabetes.explainability import (
    compute_permutation_importance,
    generate_local_explanation,
)
from app.models.diabetes.fairness import (
    evaluate_subgroup_fairness,
    wilson_score_interval,
)
from app.schemas.prediction_schemas import DiabetesRequest, PredictionType, InputType

DATA_DIR = Path(__file__).resolve().parents[2] / "test-dataset" / "Diabetes"
RESEARCH_ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "artifacts" / "diabetes_research"


# ─────────────────────────────────────────────────────────────────────────────
# 1. Dataset Manifest & Ingestion Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_dataset_manifest_exists_and_valid():
    manifest_path = DATA_DIR / "dataset_manifest.json"
    if not manifest_path.exists():
        pytest.skip("dataset_manifest.json not yet generated")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert "pima" in manifest
    assert "uci_early_stage" in manifest
    assert "nhanes" in manifest
    assert "healthcare_100k" in manifest
    assert manifest["pima"]["rows"] == 768
    assert manifest["healthcare_100k"]["rows"] == 100000


def test_frankfurt_duplicate_audit():
    """Verify that Frankfurt Hospital dataset is audited and flagged as contaminated."""
    pima_path = DATA_DIR / "diabetes.csv"
    frankfurt_path = DATA_DIR / "frankfurt_hospital_audit.csv"
    if not frankfurt_path.exists():
        pytest.skip("frankfurt_hospital_audit.csv not available")
    pima = pd.read_csv(pima_path)
    frankfurt = pd.read_csv(frankfurt_path)
    merged = pd.merge(pima, frankfurt, how="inner")
    duplication_rate = len(merged) / len(frankfurt)
    assert duplication_rate > 0.95, f"Expected >95% duplication, got {duplication_rate:.2%}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Harmonization & Range Validation Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_harmonized_core_features_consistency():
    sample_pima = pd.DataFrame([{
        "Pregnancies": 2, "Glucose": 120, "BloodPressure": 80, "SkinThickness": 20,
        "Insulin": 80, "BMI": 28.5, "DiabetesPedigreeFunction": 0.45, "Age": 35
    }])
    core_pima = harmonize_pima_to_core(sample_pima)
    assert list(core_pima.columns) == HARMONIZED_CORE_FEATURES
    assert core_pima["IsFemale"].iloc[0] == 1.0
    assert core_pima["Hypertension"].iloc[0] == 1.0

    sample_ehr = pd.DataFrame([{
        "gender": "Female", "age": 45.0, "hypertension": 0, "heart_disease": 0,
        "smoking_history": "never", "bmi": 26.2, "HbA1c_level": 5.5, "blood_glucose_level": 110
    }])
    core_ehr = harmonize_healthcare100k_to_core(sample_ehr)
    assert list(core_ehr.columns) == HARMONIZED_CORE_FEATURES
    assert core_ehr["IsFemale"].iloc[0] == 1.0
    assert core_ehr["Hypertension"].iloc[0] == 0.0


def test_preprocessor_clipping_and_imputation():
    df = pd.DataFrame({
        "Pregnancies": [1, 2],
        "Glucose": [0, 500],  # 0 is biological zero, 500 is extreme
        "BloodPressure": [70, 0],
        "SkinThickness": [0, 25],
        "Insulin": [0, 100],
        "BMI": [25.0, 0],
        "DiabetesPedigreeFunction": [0.3, 0.5],
        "Age": [25, 40],
    })
    prep = DiabetesPreprocessor(strategy="median", clip_ranges=True).fit_pima(df)
    transformed = prep.transform_pima(df)
    assert (transformed["Glucose"] > 0).all()
    assert transformed["Glucose"].max() <= PHYSIOLOGICAL_BOUNDS["Glucose"][1]


# ─────────────────────────────────────────────────────────────────────────────
# 3. Probability Calibration Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_expected_calibration_error_calculation():
    y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    # Perfectly calibrated probabilities
    y_prob = np.array([0.1, 0.1, 0.1, 0.1, 0.9, 0.9, 0.9, 0.9])
    res = compute_expected_calibration_error(y_true, y_prob, n_bins=2)
    assert res["expected_calibration_error"] < 0.15
    assert 0.0 <= res["brier_score"] <= 1.0
    assert len(res["bins"]) == 2


def test_calibrated_model_wrapper():
    from sklearn.linear_model import LogisticRegression
    X = np.random.randn(80, 4)
    y = np.random.randint(0, 2, 80)
    base = LogisticRegression().fit(X[:50], y[:50])
    cal = CalibratedModelWrapper(base, method="sigmoid").fit_calibration(X[50:], y[50:])
    probs = cal.predict_proba(X[:10])
    assert probs.shape == (10, 2)
    assert np.allclose(probs.sum(axis=1), 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Decision Curve Analysis & Clinical Thresholds
# ─────────────────────────────────────────────────────────────────────────────

def test_decision_curve_analysis_calculation():
    y_true = np.array([0]*70 + [1]*30)
    y_prob = np.linspace(0.05, 0.95, 100)
    dca = calculate_decision_curve(y_true, y_prob)
    assert dca["sample_size"] == 100
    assert dca["prevalence"] == 0.30
    assert len(dca["decision_curves"]) > 10
    # Net benefit of model at pt=0.20 should be valid float
    pt20 = next(r for r in dca["decision_curves"] if abs(r["threshold"] - 0.20) < 0.02)
    assert -1.0 <= pt20["net_benefit_model"] <= 1.0


def test_clinical_threshold_optimization():
    y_true = np.array([0]*60 + [1]*40)
    y_prob = np.linspace(0.1, 0.9, 100)
    sens_first = find_optimal_clinical_threshold(y_true, y_prob, criterion="sensitivity_first", min_sensitivity=0.85)
    assert sens_first["sensitivity"] >= 0.85


# ─────────────────────────────────────────────────────────────────────────────
# 5. Fairness & Equity Audit Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_wilson_score_interval():
    ci = wilson_score_interval(80, 100)
    assert ci["estimate"] == 0.80
    assert 0.70 < ci["ci_lower"] < 0.80
    assert 0.80 < ci["ci_upper"] < 0.90


def test_subgroup_fairness_evaluation():
    features = pd.DataFrame({
        "Age": [25, 28, 40, 45, 60, 65, 30, 32],
        "BMI": [22, 24, 32, 35, 42, 44, 27, 29],
        "IsFemale": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    })
    y_true = np.array([0, 0, 1, 1, 1, 0, 0, 1])
    y_prob = np.array([0.1, 0.2, 0.7, 0.8, 0.6, 0.3, 0.2, 0.9])
    res = evaluate_subgroup_fairness(features, y_true, y_prob, threshold=0.40)
    assert "age_cohort" in res
    assert "bmi_tier" in res
    assert "young_adult (21-34)" in res["age_cohort"]


# ─────────────────────────────────────────────────────────────────────────────
# 6. Explainability & Local Attribution Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_local_risk_attribution():
    patient = {
        "Glucose": 180.0,
        "BMI": 36.0,
        "Age": 55.0,
        "BloodPressure": 85.0,
        "Pregnancies": 3,
        "Insulin": 120.0,
        "DiabetesPedigreeFunction": 0.5,
        "SkinThickness": 25.0,
    }
    medians = {"Glucose": 117.0, "BMI": 32.0, "Age": 30.0, "BloodPressure": 72.0}
    explanation = generate_local_explanation(
        None, patient, PIMA_COLUMNS, medians
    )
    assert len(explanation["primary_risk_drivers"]) > 0
    driver_names = [d["feature"] for d in explanation["primary_risk_drivers"]]
    assert "Glucose" in driver_names
    assert "explanation_summary" in explanation


# ─────────────────────────────────────────────────────────────────────────────
# 7. Backward Compatibility with MediMind Prediction Contracts
# ─────────────────────────────────────────────────────────────────────────────

def test_diabetes_request_validation():
    valid_payload = {
        "Pregnancies": 2,
        "Glucose": 130.0,
        "BloodPressure": 75.0,
        "SkinThickness": 22.0,
        "Insulin": 95.0,
        "BMI": 29.1,
        "DiabetesPedigreeFunction": 0.38,
        "Age": 42,
        "family_member_id": "fm-12345",
        "appointment_id": "appt-98765",
    }
    req = DiabetesRequest(**valid_payload)
    assert req.Glucose == 130.0
    assert req.family_member_id == "fm-12345"
    assert req.appointment_id == "appt-98765"
