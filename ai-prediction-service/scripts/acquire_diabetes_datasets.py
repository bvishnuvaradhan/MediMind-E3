"""Automated acquisition, verification, and audit of multi-cohort diabetes datasets.

Acquires:
1. Pima Indians Diabetes Database (NIDDK / UCI)
2. UCI Early Stage Diabetes Risk Prediction (Sylhet Diabetes Hospital, Bangladesh)
3. CDC BRFSS 2015 Diabetes Health Indicators (CDC / Teboul)
4. CDC NHANES Examination & Demographic Cohort (CDC Continuous NHANES)
5. Healthcare Diabetes 100k Cohort (Clinical EHR / Laboratory)
6. Frankfurt Hospital Diabetes Dataset (Adversarial Audit Cohort)

Computes SHA-256 checksums, shapes, column schemas, and saves a manifest.
"""

import hashlib
import io
import json
import logging
import os
import urllib.request
import zipfile
from pathlib import Path
from typing import Any, Dict

import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("diabetes_acquisition")

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "test-dataset" / "Diabetes"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATASET_SOURCES = {
    "pima": {
        "local_path": DATA_DIR / "diabetes.csv",
        "description": "Pima Indians Diabetes Database (NIDDK / UCI)",
        "provenance_url": "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv",
        "institution": "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)",
        "license": "Public Domain / CC0 (Academic Research)",
        "type": "clinical_physiological",
    },
    "uci_early_stage": {
        "local_path": DATA_DIR / "uci_early_stage_diabetes.csv",
        "download_url": "https://archive.ics.uci.edu/static/public/529/early+stage+diabetes+risk+prediction+dataset.zip",
        "zip_internal_name": "diabetes_data_upload.csv",
        "description": "UCI Early Stage Diabetes Risk Prediction Dataset (Sylhet Diabetes Hospital, Bangladesh)",
        "institution": "Sylhet Diabetes Hospital & University of Information Technology and Sciences, Bangladesh",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "type": "symptom_questionnaire",
    },
    "nhanes": {
        "local_path": DATA_DIR / "nhanes_diabetes.csv",
        "download_url": "https://raw.githubusercontent.com/ChintanaL/Diabetes-Prediction-using-NHANES-dataset/master/CleantFiles/finalexamDemoDiet.csv",
        "description": "CDC National Health and Nutrition Examination Survey (NHANES) Multi-Ethnic Cohort",
        "institution": "National Center for Health Statistics (NCHS), CDC, USA",
        "license": "CDC Public Domain (Data Access & Use Agreement)",
        "type": "epidemiological_physical_exam",
    },
    "healthcare_100k": {
        "local_path": DATA_DIR / "healthcare_100k_diabetes.csv",
        "download_url": "https://raw.githubusercontent.com/NANITH777/Diabetes-Prediction-ID3_Alg-ML-Models/main/diabetes_prediction_dataset.csv",
        "description": "Healthcare Diabetes 100k EHR Laboratory Cohort",
        "institution": "Kaggle Healthcare Machine Learning Repository / M. R. Huq",
        "license": "Open Data Commons Open Database License (ODbL) / CC0",
        "type": "clinical_ehr_laboratory",
    },
    "cdc_brfss": {
        "local_path": DATA_DIR / "cdc_brfss_diabetes.csv",
        "download_url": "https://raw.githubusercontent.com/Helmy2/Diabetes-Health-Indicators/main/diabetes_binary_health_indicators_BRFSS2015.csv",
        "description": "CDC BRFSS 2015 Behavioral Risk Factor Surveillance System Health Indicators",
        "institution": "Centers for Disease Control and Prevention (CDC), USA",
        "license": "CDC Public Data (Open Government)",
        "type": "population_survey",
    },
    "frankfurt_hospital_audit": {
        "local_path": DATA_DIR / "frankfurt_hospital_audit.csv",
        "download_url": "https://raw.githubusercontent.com/ibrahimuhammad/diabetes_prediction/main/diabetes.csv",
        "description": "Frankfurt Hospital Dataset (Audited Contaminated Cohort - 99% Duplicate of Pima)",
        "institution": "Alleged Hospital Frankfurt, Germany (Audited Re-sampling Artifact)",
        "license": "Educational Open Access",
        "type": "adversarial_audit_duplicate",
    },
}


def sha256_file(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def download_file(url: str) -> bytes:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MediMind-Research/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def acquire_all() -> Dict[str, Any]:
    manifest: Dict[str, Any] = {}

    for key, spec in DATASET_SOURCES.items():
        local_path: Path = spec["local_path"]
        logger.info("Processing %s -> %s", key, local_path)

        if not local_path.exists():
            if "download_url" in spec:
                logger.info("Downloading %s from %s...", key, spec["download_url"])
                raw_bytes = download_file(spec["download_url"])

                if spec.get("zip_internal_name"):
                    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
                        extracted = zf.read(spec["zip_internal_name"])
                        local_path.write_bytes(extracted)
                else:
                    local_path.write_bytes(raw_bytes)
                logger.info("Saved %s (%d bytes)", local_path.name, len(local_path.read_bytes()))
            else:
                raise FileNotFoundError(f"Local file {local_path} does not exist and no download_url specified.")
        else:
            logger.info("File already exists: %s", local_path)

        # Inspect dataframe
        df = pd.read_csv(local_path)
        sha = sha256_file(local_path)

        manifest[key] = {
            "name": key,
            "description": spec["description"],
            "institution": spec["institution"],
            "license": spec["license"],
            "cohort_type": spec["type"],
            "local_file": str(local_path.name),
            "sha256": sha,
            "rows": int(len(df)),
            "columns_count": int(df.shape[1]),
            "columns": list(df.columns),
            "missing_cells": int(df.isna().sum().sum()),
        }

    manifest_path = DATA_DIR / "dataset_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    logger.info("Manifest written to %s", manifest_path)
    return manifest


if __name__ == "__main__":
    manifest = acquire_all()
    for k, v in manifest.items():
        print(f"[{k}] Rows: {v['rows']}, Cols: {v['columns_count']}, SHA256: {v['sha256'][:12]}...")
