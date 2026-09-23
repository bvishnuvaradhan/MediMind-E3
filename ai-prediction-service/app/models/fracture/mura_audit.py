"""
mura_audit.py — Audit and ingestion utility for Stanford MURA (Musculoskeletal Radiographs) dataset.

Provides:
  - parse_mura_path: Extracts split, anatomical body part, patient ID, study ID, and abnormality label.
  - audit_mura_metadata_csv: Parses and validates MURA file index CSVs (e.g. mura_v1_1.csv).
  - audit_mura_extracted_directory: In-place filesystem audit of extracted MURA images without copying.
  - save_audit_report: Generates machine-readable JSON audit reports.

IMPORTANT LABEL NOTE:
  MURA classifies general radiographic abnormality ('positive' vs 'negative').
  This utility explicitly retains MURA's true 'abnormal' vs 'normal' semantics and
  DOES NOT convert MURA 'positive' into 'fracture' or MURA 'negative' into 'normal'.
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Set
import pandas as pd
from PIL import Image, UnidentifiedImageError


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

MURA_BODY_PARTS: Tuple[str, ...] = (
    "XR_ELBOW",
    "XR_FINGER",
    "XR_FOREARM",
    "XR_HAND",
    "XR_HUMERUS",
    "XR_SHOULDER",
    "XR_WRIST",
)

MURA_SPLITS: Tuple[str, ...] = ("train", "valid")

# Pattern: {split}/{body_part}/{patient_id}/{study_dir}/{image_name}
# e.g.: train/XR_ELBOW/patient00011/study1_negative/image1.png
MURA_PATH_REGEX = re.compile(
    r"^(?P<split>train|valid)/"
    r"(?P<body_part>XR_[A-Z]+)/"
    r"(?P<patient>patient\d+)/"
    r"(?P<study>study\d+)_(?P<abnormality>positive|negative)/"
    r"(?P<image>image\d+\.(?:png|jpg|jpeg))$",
    re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────────────────────
# PATH PARSING
# ─────────────────────────────────────────────────────────────────────────────

def parse_mura_path(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Parse an official MURA file path into structured radiographic metadata.

    Args:
        file_path: Relative path string, e.g.
            'train/XR_SHOULDER/patient11758/study1_negative/image3.png'

    Returns:
        Dict with keys:
          - split: 'train' or 'valid'
          - body_part: e.g. 'XR_SHOULDER'
          - patient_id: e.g. 'XR_SHOULDER_patient11758' (namespaced to body part)
          - raw_patient_id: e.g. 'patient11758'
          - study_id: e.g. 'XR_SHOULDER_patient11758_study1'
          - raw_study_dir: e.g. 'study1_negative'
          - abnormality_label: 'positive' or 'negative'
          - abnormality_numeric: 1 for positive, 0 for negative
          - image_name: e.g. 'image3.png'
          - path: original normalized path
        or None if path is not a valid MURA image path (e.g. metadata CSV).
    """
    normalized = file_path.replace("\\", "/").strip().lstrip("./")
    match = MURA_PATH_REGEX.match(normalized)
    if not match:
        return None

    split = match.group("split").lower()
    body_part = match.group("body_part").upper()
    patient = match.group("patient")
    study = match.group("study")
    abnormality = match.group("abnormality").lower()
    image = match.group("image")

    namespaced_patient = f"{body_part}_{patient}"
    study_id = f"{namespaced_patient}_{study}"

    return {
        "split": split,
        "body_part": body_part,
        "patient_id": namespaced_patient,
        "raw_patient_id": patient,
        "study_id": study_id,
        "raw_study_dir": f"{study}_{abnormality}",
        "abnormality_label": abnormality,
        "abnormality_numeric": 1 if abnormality == "positive" else 0,
        "image_name": image,
        "path": normalized,
    }


# ─────────────────────────────────────────────────────────────────────────────
# CSV METADATA AUDIT
# ─────────────────────────────────────────────────────────────────────────────

def audit_mura_metadata_csv(csv_path: str) -> Dict[str, Any]:
    """
    Audit MURA file index CSV (e.g. mura_v1_1.csv or Redivis index).

    Analyzes:
      - Total records and file breakdown (images vs CSV metadata files)
      - Split distribution (train vs valid)
      - Anatomical body part breakdown
      - Abnormality label counts (study-level and image-level)
      - Patient and study counts
      - Cross-split patient leakage risk (train vs valid patient overlap)

    Returns:
        Structured audit report dictionary.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"MURA metadata CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)

    # Determine file path column
    path_col = None
    for candidate in ("file_name", "Name", "path", "filename"):
        if candidate in df.columns:
            path_col = candidate
            break

    if path_col is None:
        raise ValueError(
            f"Could not identify file path column in CSV. Found columns: {list(df.columns)}"
        )

    all_paths = df[path_col].dropna().astype(str).tolist()
    total_records = len(all_paths)

    parsed_records = []
    unparsed_files = []

    for p in all_paths:
        parsed = parse_mura_path(p)
        if parsed:
            parsed_records.append(parsed)
        else:
            unparsed_files.append(p)

    parsed_df = pd.DataFrame(parsed_records)

    # If no images could be parsed
    if parsed_df.empty:
        return {
            "csv_path": csv_path,
            "total_records": total_records,
            "parsed_images": 0,
            "unparsed_files": unparsed_files,
            "error": "No valid MURA image paths recognized in CSV.",
        }

    # Split breakdown
    split_counts = parsed_df["split"].value_counts().to_dict()

    # Body part breakdown
    body_part_counts = parsed_df["body_part"].value_counts().to_dict()

    # Image-level abnormality counts
    image_label_counts = parsed_df["abnormality_label"].value_counts().to_dict()

    # Study-level analysis (drop duplicate study IDs)
    study_df = parsed_df.drop_duplicates(subset=["study_id"]).copy()
    study_counts_by_split = (
        study_df.groupby(["split", "abnormality_label"])["study_id"].count().to_dict()
    )
    study_counts_by_body_part = (
        study_df.groupby(["body_part", "abnormality_label"])["study_id"].count().to_dict()
    )

    # Patient-level analysis
    train_patients = set(parsed_df[parsed_df["split"] == "train"]["patient_id"])
    valid_patients = set(parsed_df[parsed_df["split"] == "valid"]["patient_id"])
    patient_overlap = train_patients.intersection(valid_patients)

    # Format study split counts for JSON serialization
    formatted_study_split = {
        f"{split}_{label}": count
        for (split, label), count in study_counts_by_split.items()
    }
    formatted_study_body_part = {
        f"{bp}_{label}": count
        for (bp, label), count in study_counts_by_body_part.items()
    }

    report = {
        "dataset_name": "MURA-v1.1",
        "csv_path": csv_path,
        "total_csv_records": total_records,
        "total_radiograph_images": len(parsed_records),
        "unparsed_non_image_files": unparsed_files,
        "splits": {
            "image_counts": split_counts,
            "study_counts": formatted_study_split,
        },
        "anatomical_distribution": {
            "image_counts": body_part_counts,
            "study_counts": formatted_study_body_part,
        },
        "abnormality_labels": {
            "image_level": image_label_counts,
            "total_abnormal_positive_images": image_label_counts.get("positive", 0),
            "total_normal_negative_images": image_label_counts.get("negative", 0),
        },
        "patient_statistics": {
            "total_unique_patients": len(train_patients | valid_patients),
            "train_patients": len(train_patients),
            "valid_patients": len(valid_patients),
            "cross_split_patient_leakage_detected": len(patient_overlap) > 0,
            "overlapping_patient_count": len(patient_overlap),
        },
        "study_statistics": {
            "total_unique_studies": len(study_df),
        },
        "label_semantics_audit": {
            "labels_represent": "General Musculoskeletal Abnormality (NOT specific bone fractures)",
            "fracture_ground_truth_available": False,
            "recommendation": "MURA labels cannot be treated as fracture vs normal without dedicated clinical fracture annotation.",
        },
    }

    return report


# ─────────────────────────────────────────────────────────────────────────────
# DIRECTORY AUDIT (IN-PLACE SCANNING)
# ─────────────────────────────────────────────────────────────────────────────

def audit_mura_extracted_directory(
    root_dir: str,
    validate_images: bool = False,
    max_images_to_validate: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Scan an extracted MURA directory without copying or moving any files.

    Args:
        root_dir: Root directory containing 'train/' and/or 'valid/' subfolders.
        validate_images: If True, opens images with PIL to verify integrity.
        max_images_to_validate: Optional cap on images to open for performance.

    Returns:
        Structured audit dictionary with disk file status.
    """
    root_path = Path(root_dir).resolve()
    if not root_path.exists() or not root_path.is_dir():
        return {
            "root_dir": root_dir,
            "exists": False,
            "status": "Directory does not exist",
            "images_found": 0,
        }

    # Find all PNG/JPG files recursively (deduplicated for case-insensitive filesystems)
    found_set: Set[Path] = set()
    for ext in ("*.png", "*.jpg", "*.jpeg", "*.PNG", "*.JPG", "*.JPEG"):
        for p in root_path.rglob(ext):
            found_set.add(p.resolve())

    image_paths = sorted(list(found_set), key=lambda x: str(x))
    total_images_found = len(image_paths)

    parsed_images = []
    corrupted_images = []
    images_validated_count = 0

    for p in image_paths:
        rel_path = os.path.relpath(p, root_path).replace("\\", "/")
        parsed = parse_mura_path(rel_path)
        if parsed:
            parsed_images.append(parsed)

        if validate_images:
            if max_images_to_validate and images_validated_count >= max_images_to_validate:
                continue
            images_validated_count += 1
            try:
                with Image.open(p) as img:
                    img.verify()
            except (UnidentifiedImageError, OSError, SyntaxError) as e:
                corrupted_images.append({
                    "path": str(p),
                    "error": str(e),
                })

    parsed_df = pd.DataFrame(parsed_images) if parsed_images else pd.DataFrame()

    patient_leakage = False
    if not parsed_df.empty and "split" in parsed_df.columns:
        train_p = set(parsed_df[parsed_df["split"] == "train"]["patient_id"])
        valid_p = set(parsed_df[parsed_df["split"] == "valid"]["patient_id"])
        patient_leakage = len(train_p.intersection(valid_p)) > 0

    return {
        "root_dir": str(root_path),
        "exists": True,
        "images_found": total_images_found,
        "parsed_mura_images": len(parsed_images),
        "images_validated_count": images_validated_count,
        "corrupted_images_detected": len(corrupted_images),
        "corrupted_files": corrupted_images,
        "patient_leakage_detected": patient_leakage,
        "label_semantics_audit": {
            "labels_represent": "General Musculoskeletal Abnormality (NOT specific bone fractures)",
            "fracture_ground_truth_available": False,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# REPORT SERIALIZATION
# ─────────────────────────────────────────────────────────────────────────────

def save_audit_report(audit_data: Dict[str, Any], output_path: str) -> None:
    """Save audit report to formatted JSON file."""
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(audit_data, f, indent=2)
