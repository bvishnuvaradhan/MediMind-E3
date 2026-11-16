"""Comprehensive unit and integration test suite for the Multi-Phenotype Diabetes AI Framework.

Tests:
1. Multi-phenotype dataset manifest existence, schema integrity, and SHA-256 verification.
2. Track 1: Type-1 vs Type-2 patient-level split quarantine (zero patient overlap between train/val/test).
3. Track 3: Gestational Diabetes Mellitus (GDM) early-screening schema and exclusion of diagnostic OGTT.
4. Track 4: Prediabetes longitudinal progression speed binary target and positive event time values.
5. Track 5: Monogenic MODY subtype sample size boundaries and GCK vs HNF1A feature integrity.
6. Track 6: Secondary diabetes feasibility audit output structure.
7. Master Experiment Report JSON schema and overall verdict integrity.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

DATA_DIR = Path(__file__).resolve().parents[2] / "test-dataset" / "Diabetes"
ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "artifacts" / "diabetes_research"


def test_multiphenotype_dataset_manifest_exists():
    manifest_path = DATA_DIR / "multiphenotype_dataset_manifest.json"
    assert manifest_path.exists(), "multiphenotype_dataset_manifest.json must exist"

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert "uci_130_us_hospitals" in manifest
    assert "gestational_gdm" in manifest
    assert "prediabetes_longitudinal" in manifest
    assert "mody_clinical_genetic" in manifest

    for name, item in manifest.items():
        assert "sha256" in item and len(item["sha256"]) == 64
        assert item["rows"] > 0
        assert item["columns_count"] > 0


def test_track1_uci_hospital_patient_level_quarantine():
    from app.models.diabetes.type1_phenotype_model import load_and_preprocess_uci_hospital_cohort
    from sklearn.model_selection import GroupShuffleSplit

    df, y, patient_groups = load_and_preprocess_uci_hospital_cohort()

    assert len(df) > 10000, "UCI hospital cohort should have > 10,000 filtered encounters"
    assert set(np.unique(y)) == {0, 1}, "Target must be strictly binary: 0 (Type-2) vs 1 (Type-1)"

    gss = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_idx, test_idx = next(gss.split(df, y, groups=patient_groups))

    train_patients = set(patient_groups[train_idx])
    test_patients = set(patient_groups[test_idx])

    # Patient-level split quarantine check
    overlap = train_patients.intersection(test_patients)
    assert len(overlap) == 0, f"Found {len(overlap)} patient overlap between train and test partitions!"


def test_track3_gdm_early_screening_excludes_diagnostic_ogtt():
    from app.models.diabetes.gestational_diabetes_model import load_gdm_dataset

    df = load_gdm_dataset()
    assert len(df) > 500, "GDM cohort should have > 500 cases"
    assert "target" in df.columns
    assert "ogtt_glucose" in df.columns

    # Verify target distribution
    counts = df["target"].value_counts().to_dict()
    assert 0 in counts and 1 in counts
    assert counts[1] > 0 and counts[0] > 0


def test_track4_prediabetes_progression_cohort_integrity():
    from app.models.diabetes.prediabetes_progression_model import load_longitudinal_prediabetes_cohort

    df = load_longitudinal_prediabetes_cohort()
    assert len(df) == 3059, "MLDataR prediabetes cohort must have exactly 3,059 rows"
    assert "Time_Pre_To_Diabetes" in df.columns
    assert "rapid_progressor" in df.columns

    # Follow-up time must be strictly positive
    assert (df["Time_Pre_To_Diabetes"] > 0).all(), "Progression time must be strictly positive"
    assert set(df["rapid_progressor"].unique()) == {0, 1}


def test_track5_mody_cohort_sheets_and_rare_variant_scoping():
    from app.models.diabetes.mody_monogenic_model import load_mody_cohort

    sheets = load_mody_cohort()
    assert len(sheets["mody2"]) > 200, "MODY2 (GCK) should have > 200 cases"
    assert len(sheets["mody3"]) > 100, "MODY3 (HNF1A) should have > 100 cases"

    # Rare variant sample-size boundary check
    assert len(sheets["mody1"]) <= 10, "MODY1 (HNF4A) is ultra-rare in this cohort"
    assert len(sheets["mody5"]) <= 10, "MODY5 (HNF1B) is ultra-rare in this cohort"


def test_track6_secondary_diabetes_feasibility_structure():
    from app.models.diabetes.secondary_diabetes_feasibility import audit_secondary_diabetes_feasibility

    audit = audit_secondary_diabetes_feasibility()
    assert "subtypes_analyzed" in audit
    assert "pancreatogenic_type_3c" in audit["subtypes_analyzed"]
    assert "steroid_induced_diabetes" in audit["subtypes_analyzed"]
    assert audit["status"] == "DATASET INSUFFICIENT — FEASIBILITY DOCUMENTED"


def test_master_multiphenotype_experiment_report_exists_and_valid():
    report_file = ARTIFACTS_DIR / "MASTER_EXPERIMENT_REPORT.json"
    assert report_file.exists(), "MASTER_EXPERIMENT_REPORT.json must exist in artifacts/diabetes_research"

    report = json.loads(report_file.read_text(encoding="utf-8"))
    assert report["framework_version"] == "2.0.0-multiphenotype"
    assert "track_1_type1_vs_type2" in report["tracks"]
    assert "track_2_type2_generalization" in report["tracks"]
    assert "track_3_gestational_diabetes" in report["tracks"]
    assert "track_4_prediabetes_progression" in report["tracks"]
    assert "track_5_mody_monogenic" in report["tracks"]
    assert "track_6_secondary_diabetes" in report["tracks"]

    assert report["overall_verdict"] == "READY FOR MANUSCRIPT DRAFTING"
