"""
test_mura_audit.py — Unit tests for MURA dataset path parsing, CSV metadata audit,
and filesystem audit tooling.
"""

import os
import tempfile
import pytest
import pandas as pd
from PIL import Image

from app.models.fracture.mura_audit import (
    parse_mura_path,
    audit_mura_metadata_csv,
    audit_mura_extracted_directory,
    save_audit_report,
    MURA_BODY_PARTS,
    MURA_SPLITS,
)


class TestMuraPathParsing:
    """Tests for parse_mura_path."""

    def test_parse_valid_negative_train_path(self):
        path = "train/XR_SHOULDER/patient11758/study1_negative/image3.png"
        parsed = parse_mura_path(path)
        assert parsed is not None
        assert parsed["split"] == "train"
        assert parsed["body_part"] == "XR_SHOULDER"
        assert parsed["patient_id"] == "XR_SHOULDER_patient11758"
        assert parsed["raw_patient_id"] == "patient11758"
        assert parsed["study_id"] == "XR_SHOULDER_patient11758_study1"
        assert parsed["abnormality_label"] == "negative"
        assert parsed["abnormality_numeric"] == 0
        assert parsed["image_name"] == "image3.png"

    def test_parse_valid_positive_valid_path(self):
        path = "valid/XR_WRIST/patient11205/study2_positive/image1.png"
        parsed = parse_mura_path(path)
        assert parsed is not None
        assert parsed["split"] == "valid"
        assert parsed["body_part"] == "XR_WRIST"
        assert parsed["patient_id"] == "XR_WRIST_patient11205"
        assert parsed["study_id"] == "XR_WRIST_patient11205_study2"
        assert parsed["abnormality_label"] == "positive"
        assert parsed["abnormality_numeric"] == 1
        assert parsed["image_name"] == "image1.png"

    def test_parse_handles_windows_backslashes(self):
        path = "train\\XR_HAND\\patient00123\\study1_positive\\image2.png"
        parsed = parse_mura_path(path)
        assert parsed is not None
        assert parsed["split"] == "train"
        assert parsed["body_part"] == "XR_HAND"
        assert parsed["abnormality_label"] == "positive"

    def test_rejects_non_image_csv_files(self):
        assert parse_mura_path("train_image_paths.csv") is None
        assert parse_mura_path("valid_labeled_studies.csv") is None

    def test_rejects_malformed_paths(self):
        assert parse_mura_path("random/path/image1.png") is None
        assert parse_mura_path("") is None
        assert parse_mura_path("train/XR_WRIST/patient001/image1.png") is None


class TestMuraCsvAudit:
    """Tests for audit_mura_metadata_csv."""

    def test_audit_synthetic_csv(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
            csv_path = f.name
            df = pd.DataFrame({
                "file_name": [
                    "train/XR_ELBOW/patient00001/study1_negative/image1.png",
                    "train/XR_ELBOW/patient00001/study1_negative/image2.png",
                    "train/XR_WRIST/patient00002/study1_positive/image1.png",
                    "valid/XR_WRIST/patient00003/study1_positive/image1.png",
                    "valid/XR_WRIST/patient00004/study1_negative/image1.png",
                    "train_image_paths.csv",  # Non-image metadata row
                ]
            })
            df.to_csv(csv_path, index=False)

        try:
            report = audit_mura_metadata_csv(csv_path)
            assert report["total_csv_records"] == 6
            assert report["total_radiograph_images"] == 5
            assert len(report["unparsed_non_image_files"]) == 1
            assert report["splits"]["image_counts"]["train"] == 3
            assert report["splits"]["image_counts"]["valid"] == 2
            assert report["abnormality_labels"]["total_abnormal_positive_images"] == 2
            assert report["abnormality_labels"]["total_normal_negative_images"] == 3
            assert report["patient_statistics"]["total_unique_patients"] == 4
            assert report["patient_statistics"]["cross_split_patient_leakage_detected"] is False

            # Semantic guard: must NOT represent fracture
            assert "General Musculoskeletal Abnormality" in report["label_semantics_audit"]["labels_represent"]
            assert report["label_semantics_audit"]["fracture_ground_truth_available"] is False
        finally:
            if os.path.exists(csv_path):
                os.remove(csv_path)

    def test_audit_detects_patient_leakage_if_present(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
            csv_path = f.name
            # Same patient in train and valid
            df = pd.DataFrame({
                "file_name": [
                    "train/XR_WRIST/patient00099/study1_negative/image1.png",
                    "valid/XR_WRIST/patient00099/study2_positive/image1.png",
                ]
            })
            df.to_csv(csv_path, index=False)

        try:
            report = audit_mura_metadata_csv(csv_path)
            assert report["patient_statistics"]["cross_split_patient_leakage_detected"] is True
            assert report["patient_statistics"]["overlapping_patient_count"] == 1
        finally:
            if os.path.exists(csv_path):
                os.remove(csv_path)


class TestMuraDirectoryAudit:
    """Tests for audit_mura_extracted_directory."""

    def test_nonexistent_directory(self):
        report = audit_mura_extracted_directory("non/existent/path")
        assert report["exists"] is False
        assert report["images_found"] == 0

    def test_synthetic_directory_audit(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create valid image file in MURA directory structure
            img_dir = os.path.join(tmpdir, "train", "XR_WRIST", "patient001", "study1_negative")
            os.makedirs(img_dir, exist_ok=True)
            img_path = os.path.join(img_dir, "image1.png")
            img = Image.new("RGB", (64, 64), color=(100, 100, 100))
            img.save(img_path)

            report = audit_mura_extracted_directory(tmpdir, validate_images=True)
            assert report["exists"] is True
            assert report["images_found"] == 1
            assert report["parsed_mura_images"] == 1
            assert report["corrupted_images_detected"] == 0
            assert report["label_semantics_audit"]["fracture_ground_truth_available"] is False
