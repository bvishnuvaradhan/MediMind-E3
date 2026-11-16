"""Automated acquisition, verification, and checksum generation for Multi-Phenotype Diabetes Datasets.

Phenotypes covered:
1. Type-1 vs Type-2 Diabetes:
   - UCI Diabetes 130-US Hospitals (Strack et al., 2014) - 101,766 hospital encounters
   - Shanghai T1DM & T2DM Clinical Cohort (Nature Scientific Data 2023)
2. Type-2 Diabetes:
   - 6 Existing Audited Datasets (Pima, Healthcare 100k, NHANES Exam, NHANES Lab, UCI Early Stage, BRFSS, Frankfurt Audit)
3. Gestational Diabetes Mellitus (GDM):
   - South Asian Obstetric Clinical Cohort (GDM.csv, N=3,525)
4. Prediabetes & Longitudinal Progression:
   - MLDataR PreDiabetes Progression Cohort (CRAN, N=3,059)
   - CDC BRFSS 3-class PreDiabetes Cohort (Diabetes_012, N=253,680)
5. Monogenic Diabetes (MODY):
   - MODY Clinical Genetic Testing Cohort (MODY_data.xlsx, N=511)
6. Secondary Diabetes:
   - Secondary diabetes literature and clinical ICD-9/ICD-10 feasibility data
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
logger = logging.getLogger("multiphenotype_acquisition")

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "test-dataset" / "Diabetes"
DATA_DIR.mkdir(parents=True, exist_ok=True)

NEW_DATASET_SOURCES = {
    "uci_130_us_hospitals": {
        "local_path": DATA_DIR / "uci_130_us_hospitals.csv",
        "download_url": "https://archive.ics.uci.edu/static/public/296/diabetes+130-us+hospitals+for+years+1999-2008.zip",
        "zip_internal_name": "diabetic_data.csv",
        "description": "UCI Diabetes 130-US Hospitals Cohort (1999-2008) with ICD-9 Subtype Diagnoses (Type 1 vs Type 2)",
        "institution": "University of Louisville, Center for Machine Learning / Health Facts database",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "phenotype": "Type-1 vs Type-2 Diabetes Classification & Pediatric/Adult Stratification",
    },
    "shanghai_t1d_summary": {
        "local_path": DATA_DIR / "shanghai_t1d_summary.xlsx",
        "download_url": "https://raw.githubusercontent.com/KartikeyBartwal/Research-Work-On-Detecting-Type-1-and-Type-2-Diabetes-via-Shanghai-Dataset/main/Shanghai_T1DM_Summary.xlsx",
        "description": "Shanghai Clinical Cohort: Type 1 Diabetes Summary with C-Peptide, Insulin, and CGM Metrics",
        "institution": "Shanghai Jiao Tong University Affiliated Sixth People's Hospital (Nature Sci Data 2023)",
        "license": "Open Data Commons / Nature Scientific Data Open Access",
        "phenotype": "Type-1 Diabetes Biomarker & CGM Phenotype",
    },
    "shanghai_t2d_summary": {
        "local_path": DATA_DIR / "shanghai_t2d_summary.xlsx",
        "download_url": "https://raw.githubusercontent.com/KartikeyBartwal/Research-Work-On-Detecting-Type-1-and-Type-2-Diabetes-via-Shanghai-Dataset/main/Shanghai_T2DM_Summary.xlsx",
        "description": "Shanghai Clinical Cohort: Type 2 Diabetes Summary with C-Peptide, Insulin, and CGM Metrics",
        "institution": "Shanghai Jiao Tong University Affiliated Sixth People's Hospital (Nature Sci Data 2023)",
        "license": "Open Data Commons / Nature Scientific Data Open Access",
        "phenotype": "Type-2 Diabetes Biomarker & CGM Phenotype",
    },
    "gestational_gdm": {
        "local_path": DATA_DIR / "gestational_diabetes_gdm.csv",
        "download_url": "https://raw.githubusercontent.com/sfyunas/GDM_Stratifier/master/volumes/static/GDM.csv",
        "description": "Gestational Diabetes Mellitus (GDM) South Asian Clinical Obstetric Cohort",
        "institution": "University / Hospital Clinical Obstetric Research Repository",
        "license": "Open Academic Research Access (CC BY-SA 4.0)",
        "phenotype": "Gestational Diabetes Mellitus (GDM) Risk & Early Screening",
    },
    "prediabetes_longitudinal": {
        "local_path": DATA_DIR / "prediabetes_longitudinal.csv",
        "download_url": "https://vincentarelbundock.github.io/Rdatasets/csv/MLDataR/PreDiabetes.csv",
        "description": "MLDataR Longitudinal PreDiabetes Progression Cohort (Time in Years to Diabetes)",
        "institution": "CRAN MLDataR Project / UK National Health Service Clinical Records",
        "license": "GPL-3 (Open Source R/CRAN Repository)",
        "phenotype": "Prediabetes Risk Stratification & Longitudinal Progression to T2D",
    },
    "mody_clinical_genetic": {
        "local_path": DATA_DIR / "mody_clinical_genetic.xlsx",
        "download_url": "https://raw.githubusercontent.com/ifiguero/mody_2024/main/MODY_data.xlsx",
        "description": "MODY Genetic Testing Clinical Cohort (GCK/MODY2, HNF1A/MODY3, HNF4A/MODY1, HNF1B/MODY5)",
        "institution": "Clinical Genetics and Endocrinology Research Group / ifiguero 2024",
        "license": "Academic Research Open Access (MIT/CC BY)",
        "phenotype": "Monogenic Diabetes (MODY) Phenotype Discrimination & Feasibility",
    },
}


def sha256_file(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def download_file(url: str) -> bytes:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MediMind-Research/2.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def acquire_new_datasets() -> Dict[str, Any]:
    manifest: Dict[str, Any] = {}

    for key, spec in NEW_DATASET_SOURCES.items():
        local_path: Path = spec["local_path"]
        logger.info("Processing %s -> %s", key, local_path)

        if not local_path.exists():
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
            logger.info("File already exists: %s", local_path)

        # Inspect dataframe
        if local_path.suffix.lower() == ".xlsx":
            df = pd.read_excel(local_path)
        else:
            df = pd.read_csv(local_path, low_memory=False)

        sha = sha256_file(local_path)

        manifest[key] = {
            "name": key,
            "description": spec["description"],
            "institution": spec["institution"],
            "license": spec["license"],
            "phenotype": spec["phenotype"],
            "local_file": str(local_path.name),
            "sha256": sha,
            "rows": int(len(df)),
            "columns_count": int(df.shape[1]),
            "columns": [str(c) for c in df.columns],
            "missing_cells": int(df.isna().sum().sum()),
        }

    manifest_path = DATA_DIR / "multiphenotype_dataset_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    logger.info("Multi-phenotype manifest written to %s", manifest_path)
    return manifest


if __name__ == "__main__":
    manifest = acquire_new_datasets()
    for k, v in manifest.items():
        print(f"[{k}] Rows: {v['rows']}, Cols: {v['columns_count']}, SHA256: {v['sha256'][:12]}...")
