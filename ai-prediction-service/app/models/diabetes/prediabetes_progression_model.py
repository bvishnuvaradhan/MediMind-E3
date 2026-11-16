"""Specialized Model Track 4: Prediabetes Risk Stratification & Longitudinal Progression Model.

Two Independent Clinical Tracks:
1. Track 4A: Longitudinal Progression to Type-2 Diabetes (Time-to-Event Modeling)
   - Dataset: MLDataR Longitudinal PreDiabetes Cohort (N=3,059 patients)
   - Predicts: Time elapsed in years from prediabetes diagnosis to T2D progression.
   - Clinical Stratification: Rapid Progressors (<= 1.5 years) vs Slow/Resistant Progressors (> 3.0 years).
   - Progression Speed Classification & Time-to-Event Regression.
2. Track 4B: Population-Level Cross-Sectional Prediabetes Screening
   - Dataset: CDC NHANES Laboratory Cohort (N=5,359, confirmed ADA criteria)
   - Target: Identifying adults with undiagnosed Prediabetes using non-glycemic clinical features.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    r2_score,
    recall_score,
    roc_auc_score,
    root_mean_squared_error,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from app.models.diabetes.calibration import CalibratedModelWrapper, compute_expected_calibration_error

logger = logging.getLogger("prediabetes_progression_model")

DATA_DIR = Path(__file__).resolve().parents[3] / "test-dataset" / "Diabetes"


def load_longitudinal_prediabetes_cohort() -> pd.DataFrame:
    """Load the MLDataR Longitudinal PreDiabetes Progression Cohort."""
    file_path = DATA_DIR / "prediabetes_longitudinal.csv"
    if not file_path.exists():
        raise FileNotFoundError(f"Prediabetes longitudinal dataset not found at {file_path}")

    df = pd.read_csv(file_path)
    if "rownames" in df.columns:
        df = df.drop(columns=["rownames"])

    # Clean Sex encoding (1=Female, 2=Male or similar string)
    if df["Sex"].dtype == object:
        df["is_female"] = (df["Sex"].astype(str).str.lower().isin(["f", "female", "1"])).astype(float)
    else:
        df["is_female"] = (df["Sex"] == 1).astype(float)

    # Progression Speed Category:
    # Rapid progressor: <= 1.5 years (548 days)
    # Slow progressor: > 3.0 years
    df["rapid_progressor"] = (df["Time_Pre_To_Diabetes"] <= 1.5).astype(int)
    return df


def load_nhanes_cross_sectional_prediabetes() -> pd.DataFrame:
    """Load CDC NHANES examination matched with laboratory data for ADA prediabetes classification."""
    exam_path = DATA_DIR / "nhanes_diabetes.csv"
    lab_path = DATA_DIR / "nhanes_lab_med.csv"

    if not exam_path.exists() or not lab_path.exists():
        raise FileNotFoundError("NHANES examination or laboratory data not found")

    exam_df = pd.read_csv(exam_path)
    lab_df = pd.read_csv(lab_path)

    merged = pd.merge(exam_df, lab_df[["SEQN", "LBXGLT", "LBXGH"]], on="SEQN", how="inner")

    # ADA Criteria:
    # Diabetes: is_diabetic == 1 or LBXGLT >= 126 or LBXGH >= 6.5
    # Prediabetes: not diabetes AND (100 <= LBXGLT <= 125 or 5.7 <= LBXGH <= 6.4)
    # Normoglycemia: not diabetes AND not prediabetes
    is_diab = (merged["is_diabetic"] == 1) | (merged["LBXGLT"] >= 126.0) | (merged["LBXGH"] >= 6.5)
    is_prediab = (~is_diab) & (
        ((merged["LBXGLT"] >= 100.0) & (merged["LBXGLT"] <= 125.0)) | ((merged["LBXGH"] >= 5.7) & (merged["LBXGH"] <= 6.4))
    )

    # Subset to non-diabetic cohort to evaluate Prediabetes vs Normoglycemia discrimination
    non_diab = merged[~is_diab].copy().reset_index(drop=True)
    non_diab["target_prediabetes"] = is_prediab[~is_diab].astype(int).to_numpy()

    # Clinical features
    non_diab["age"] = non_diab["AgeYears"].astype(float)
    non_diab["bmi"] = non_diab["BMI"].fillna(non_diab["BMI"].median()).astype(float)
    bp = non_diab["BP.Dystolic"].replace(0, np.nan).fillna(non_diab["BP.Dystolic"].median()).astype(float)
    non_diab["dia_bp"] = bp
    sys_bp = non_diab["BP.Systolic"].replace(0, np.nan).fillna(120.0).astype(float)
    non_diab["sys_bp"] = sys_bp
    non_diab["hypertension"] = ((bp >= 80.0) | (sys_bp >= 130.0)).astype(float)
    non_diab["is_female"] = (non_diab["Gender"].astype(str).str.lower() == "female").astype(float)

    return non_diab


def run_prediabetes_experiments() -> Dict[str, Any]:
    """Execute complete benchmarking for both longitudinal progression and cross-sectional prediabetes."""
    logger.info("Executing Model Track 4: Prediabetes Risk Stratification & Longitudinal Progression...")

    # ─────────────────────────────────────────────────────────────────────────
    # TRACK 4A: LONGITUDINAL PROGRESSION TO TYPE-2 DIABETES (TIME-TO-EVENT)
    # ─────────────────────────────────────────────────────────────────────────
    long_df = load_longitudinal_prediabetes_cohort()
    n_long = len(long_df)
    n_rapid = int((long_df["rapid_progressor"] == 1).sum())
    logger.info("Longitudinal Cohort Loaded: %d patients (%d rapid progressors <= 1.5 yrs, %.2f%%)",
                n_long, n_rapid, (n_rapid / n_long) * 100)

    # Features at Prediabetes Diagnosis
    long_features = [
        "Age_PreDiabetes",
        "BMI",
        "HbA1C",
        "IMD_Decile",
        "is_female",
        "PreDiabetes_Checks_Before_Diabetes",
    ]

    X_l = long_df[long_features]
    y_rapid = long_df["rapid_progressor"].to_numpy()
    y_time = long_df["Time_Pre_To_Diabetes"].to_numpy()

    # Split for progression speed classification
    Xtr_l, Xte_l, ytr_r, yte_r, ytr_t, yte_t = train_test_split(
        X_l, y_rapid, y_time, test_size=0.20, stratify=y_rapid, random_state=42
    )

    scaler_l = StandardScaler().fit(Xtr_l)
    Xtr_l_s = scaler_l.transform(Xtr_l)
    Xte_l_s = scaler_l.transform(Xte_l)

    # 1. Progression Speed Classifier (Rapid Progressor <= 1.5 years)
    clf_prog = HistGradientBoostingClassifier(max_iter=150, min_samples_leaf=20, random_state=42).fit(Xtr_l_s, ytr_r)
    te_r_probs = clf_prog.predict_proba(Xte_l_s)[:, 1]
    te_r_preds = (te_r_probs >= 0.50).astype(int)

    tn_r, fp_r, fn_r, tp_r = confusion_matrix(yte_r, te_r_preds).ravel()
    ece_r = compute_expected_calibration_error(yte_r, te_r_probs, n_bins=10)

    progression_speed_benchmark = {
        "task": "Rapid Progression (<= 1.5 Years) vs Slower Progression",
        "test_roc_auc": round(float(roc_auc_score(yte_r, te_r_probs)), 4),
        "test_pr_auc": round(float(average_precision_score(yte_r, te_r_probs)), 4),
        "sensitivity": round(float(recall_score(yte_r, te_r_preds)), 4),
        "specificity": round(float(tn_r / (tn_r + fp_r)), 4),
        "f1": round(float(f1_score(yte_r, te_r_preds)), 4),
        "brier_score": round(float(brier_score_loss(yte_r, te_r_probs)), 4),
        "ece": round(float(ece_r["expected_calibration_error"]), 4),
    }

    # 2. Continuous Progression Time Regression (Years to T2D)
    reg_prog = GradientBoostingRegressor(n_estimators=150, max_depth=4, random_state=42).fit(Xtr_l_s, ytr_t)
    pred_time = reg_prog.predict(Xte_l_s)

    progression_time_regression = {
        "task": "Continuous Years from Prediabetes Diagnosis to T2D",
        "r2_score": round(float(r2_score(yte_t, pred_time)), 4),
        "mae_years": round(float(mean_absolute_error(yte_t, pred_time)), 4),
        "rmse_years": round(float(root_mean_squared_error(yte_t, pred_time)), 4),
        "mean_actual_years": round(float(np.mean(yte_t)), 4),
        "feature_importances": [
            {"feature": f, "importance": round(float(imp), 4)}
            for f, imp in zip(long_features, reg_prog.feature_importances_)
        ],
    }

    # ─────────────────────────────────────────────────────────────────────────
    # TRACK 4B: CROSS-SECTIONAL PREDIABETES POPULATION SCREENING (NHANES)
    # ─────────────────────────────────────────────────────────────────────────
    nhanes_non_diab = load_nhanes_cross_sectional_prediabetes()
    n_nhanes = len(nhanes_non_diab)
    n_pred = int((nhanes_non_diab["target_prediabetes"] == 1).sum())
    n_normo = int((nhanes_non_diab["target_prediabetes"] == 0).sum())
    logger.info("NHANES Prediabetes Cohort: %d non-diabetic adults (%d prediabetic, %d normoglycemic)",
                n_nhanes, n_pred, n_normo)

    cs_features = ["age", "bmi", "dia_bp", "sys_bp", "hypertension", "is_female"]
    X_cs = nhanes_non_diab[cs_features]
    y_cs = nhanes_non_diab["target_prediabetes"].to_numpy()

    Xtr_c, Xte_c, ytr_c, yte_c = train_test_split(X_cs, y_cs, test_size=0.20, stratify=y_cs, random_state=42)
    scaler_c = StandardScaler().fit(Xtr_c)
    Xtr_c_s = scaler_c.transform(Xtr_c)
    Xte_c_s = scaler_c.transform(Xte_c)

    clf_cs = HistGradientBoostingClassifier(max_iter=150, min_samples_leaf=20, random_state=42).fit(Xtr_c_s, ytr_c)
    cs_probs = clf_cs.predict_proba(Xte_c_s)[:, 1]
    cs_preds = (cs_probs >= 0.50).astype(int)

    tn_c, fp_c, fn_c, tp_c = confusion_matrix(yte_c, cs_preds).ravel()
    ece_c = compute_expected_calibration_error(yte_c, cs_probs, n_bins=10)

    cross_sectional_screening_benchmark = {
        "task": "Cross-Sectional Non-Glycemic Screening for Undiagnosed Prediabetes (ADA Lab Confirmed)",
        "cohort_size": n_nhanes,
        "prediabetes_prevalence": round(float(n_pred / n_nhanes), 4),
        "test_roc_auc": round(float(roc_auc_score(yte_c, cs_probs)), 4),
        "test_pr_auc": round(float(average_precision_score(yte_c, cs_probs)), 4),
        "sensitivity": round(float(recall_score(yte_c, cs_preds)), 4),
        "specificity": round(float(tn_c / (tn_c + fp_c)), 4),
        "f1": round(float(f1_score(yte_c, cs_preds)), 4),
        "ece": round(float(ece_c["expected_calibration_error"]), 4),
    }

    results = {
        "phenotype": "Prediabetes Risk Stratification & Longitudinal Progression",
        "track_4a_longitudinal_progression": {
            "cohort": "MLDataR Longitudinal PreDiabetes Cohort (N=3,059)",
            "speed_classification": progression_speed_benchmark,
            "time_to_event_regression": progression_time_regression,
        },
        "track_4b_cross_sectional_screening": {
            "cohort": "CDC NHANES ADA Laboratory-Confirmed Cohort (N=1,741 Non-Diabetic Adults)",
            "benchmark": cross_sectional_screening_benchmark,
        },
    }

    return results


if __name__ == "__main__":
    res = run_prediabetes_experiments()
    print("Prediabetes Experiments Complete:")
    print(json.dumps(res, indent=2))
