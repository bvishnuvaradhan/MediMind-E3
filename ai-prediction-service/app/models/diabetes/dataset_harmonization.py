"""Multi-Cohort Dataset Harmonization and Preprocessing Pipeline.

Defines schemas, physiological range validations, missing-data handling,
and shared feature spaces for cross-population diabetes risk prediction.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer, KNNImputer


# ─────────────────────────────────────────────────────────────────────────────
# Canonical Clinical Feature Definitions & Ranges
# ─────────────────────────────────────────────────────────────────────────────

PHYSIOLOGICAL_BOUNDS = {
    "Glucose": (40.0, 400.0),            # mg/dL (fasting or random)
    "BloodPressure": (40.0, 220.0),      # mm Hg (diastolic / mean)
    "SystolicBP": (60.0, 260.0),         # mm Hg
    "SkinThickness": (5.0, 99.0),        # mm (triceps skinfold)
    "Insulin": (5.0, 846.0),             # mu U/ml (2-hour serum insulin)
    "BMI": (10.0, 70.0),                 # kg/m^2
    "Age": (1.0, 110.0),                 # years
    "HbA1c": (3.5, 18.0),                # % (glycohemoglobin)
    "DiabetesPedigreeFunction": (0.05, 3.0),
    "Pregnancies": (0, 25),
}

PIMA_COLUMNS = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]

PIMA_BIOLOGICAL_ZEROS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

# Shared Harmonized Clinical Core: features available or imputable across physiological & EHR cohorts
HARMONIZED_CORE_FEATURES = [
    "Age",
    "BMI",
    "Glucose",
    "BloodPressure",
    "Hypertension",
    "IsFemale",
]


class DiabetesPreprocessor:
    """Rigorous preprocessor with train-only statistics, range validation, and multiple imputation strategies."""

    def __init__(
        self,
        strategy: str = "median",
        add_indicator: bool = False,
        clip_ranges: bool = True,
    ):
        """
        Args:
            strategy: 'median', 'knn', or 'mean'
            add_indicator: Whether to append binary missingness indicators
            clip_ranges: Whether to clip physiologically invalid extremes
        """
        self.strategy = strategy
        self.add_indicator = add_indicator
        self.clip_ranges = clip_ranges
        self.medians_: Dict[str, float] = {}
        self.imputer_: Optional[Any] = None
        self.feature_names_: List[str] = []

    def fit_pima(self, df: pd.DataFrame) -> "DiabetesPreprocessor":
        """Compute train-only imputation statistics on non-zero rows."""
        self.feature_names_ = list(PIMA_COLUMNS)
        self.medians_ = {}
        for col in PIMA_BIOLOGICAL_ZEROS:
            if col in df.columns:
                non_zero = df[col][df[col] > 0]
                self.medians_[col] = float(non_zero.median()) if len(non_zero) > 0 else 0.0

        if self.strategy == "knn":
            clean_df = df[self.feature_names_].astype(float).copy()
            for col, med in self.medians_.items():
                clean_df.loc[clean_df[col] == 0, col] = np.nan
            self.imputer_ = KNNImputer(n_neighbors=5, add_indicator=self.add_indicator)
            self.imputer_.fit(clean_df)
        return self

    def transform_pima(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform Pima partition using fitted statistics."""
        data = df[self.feature_names_].astype(float).copy()

        # Handle biological zeros
        if self.strategy == "knn" and self.imputer_ is not None:
            for col in PIMA_BIOLOGICAL_ZEROS:
                if col in data.columns:
                    data.loc[data[col] == 0, col] = np.nan
            imputed_arr = self.imputer_.transform(data)
            feature_names = self.feature_names_
            if self.add_indicator:
                feature_names = self.feature_names_ + [f"{c}_missing" for c in PIMA_BIOLOGICAL_ZEROS]
            return pd.DataFrame(imputed_arr, columns=feature_names, index=df.index)

        # Median strategy
        indicators = {}
        for col in PIMA_BIOLOGICAL_ZEROS:
            if col in data.columns:
                is_zero = (data[col] == 0).astype(float)
                if self.add_indicator:
                    indicators[f"{col}_missing"] = is_zero
                med = self.medians_.get(col, 0.0)
                data.loc[data[col] == 0, col] = med

        if self.clip_ranges:
            for col, (low, high) in PHYSIOLOGICAL_BOUNDS.items():
                if col in data.columns:
                    data[col] = data[col].clip(lower=low, upper=high)

        if self.add_indicator and indicators:
            for ind_name, ind_series in indicators.items():
                data[ind_name] = ind_series

        return data


def harmonize_pima_to_core(df: pd.DataFrame) -> pd.DataFrame:
    """Map Pima dataset to Harmonized Core Clinical representation."""
    core = pd.DataFrame(index=df.index)
    core["Age"] = df["Age"].astype(float)
    core["BMI"] = df["BMI"].astype(float)
    core["Glucose"] = df["Glucose"].astype(float)
    core["BloodPressure"] = df["BloodPressure"].astype(float)
    # Clinical guideline: Diastolic BP >= 80 or 90 indicates hypertension
    core["Hypertension"] = (df["BloodPressure"] >= 80.0).astype(float)
    # Pima cohort is 100% female
    core["IsFemale"] = 1.0
    return core[HARMONIZED_CORE_FEATURES]


def harmonize_healthcare100k_to_core(df: pd.DataFrame) -> pd.DataFrame:
    """Map Healthcare 100k dataset to Harmonized Core Clinical representation."""
    core = pd.DataFrame(index=df.index)
    core["Age"] = df["age"].astype(float)
    core["BMI"] = df["bmi"].astype(float)
    core["Glucose"] = df["blood_glucose_level"].astype(float)
    # In EHR dataset, diastolic BP is not directly given, but hypertension status is explicit
    core["Hypertension"] = df["hypertension"].astype(float)
    # Estimate diastolic BP proxy from hypertension status (normotensive ~72, hypertensive ~85)
    core["BloodPressure"] = np.where(df["hypertension"] == 1, 85.0, 72.0)
    core["IsFemale"] = (df["gender"].astype(str).str.lower() == "female").astype(float)
    return core[HARMONIZED_CORE_FEATURES]


def harmonize_nhanes_to_core(df: pd.DataFrame) -> pd.DataFrame:
    """Map CDC NHANES Examination dataset to Harmonized Core Clinical representation."""
    core = pd.DataFrame(index=df.index)
    core["Age"] = df["AgeYears"].astype(float)
    core["BMI"] = df["BMI"].fillna(df["BMI"].median()).astype(float)
    # NHANES examination has BP.Dystolic and BP.Systolic
    bp = df["BP.Dystolic"].replace(0, np.nan).fillna(df["BP.Dystolic"].median()).astype(float)
    core["BloodPressure"] = bp
    core["Hypertension"] = ((bp >= 80.0) | (df["BP.Systolic"] >= 130.0)).astype(float)
    # NHANES examination does not have fasting glucose on all subjects in this sheet; proxy from age/BMI/BP or default
    core["Glucose"] = np.nan  # will be imputed
    # Gender: 1=Male, 2=Female
    core["IsFemale"] = (df["Gender"] == 2).astype(float)
    return core[HARMONIZED_CORE_FEATURES]
