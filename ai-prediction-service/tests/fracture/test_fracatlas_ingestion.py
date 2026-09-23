"""
test_fracatlas_ingestion.py — Unit tests for FracAtlas dataset loading, audit, and stratification.
Uses synthetic temporary files and in-memory test fixtures only (no large datasets committed).
"""

import os
import tempfile
import pytest
import pandas as pd
from PIL import Image

from app.models.fracture.fracatlas_ingestion import (
    load_fracatlas_metadata,
    audit_fracatlas_dataset,
    create_fracatlas_stratified_split,
)


@pytest.fixture
def synthetic_fracatlas_dir():
    """Create a temporary synthetic FracAtlas structure with valid mock images."""
    with tempfile.TemporaryDirectory() as tmpdir:
        frac_dir = os.path.join(tmpdir, "images", "Fractured")
        non_frac_dir = os.path.join(tmpdir, "images", "Non_fractured")
        os.makedirs(frac_dir, exist_ok=True)
        os.makedirs(non_frac_dir, exist_ok=True)

        # Create 10 synthetic images: 3 fractured, 7 non-fractured
        records = []
        for i in range(10):
            img_name = f"IMG{i:07d}.jpg"
            is_frac = 1 if i < 3 else 0
            subfolder = frac_dir if is_frac else non_frac_dir
            img_path = os.path.join(subfolder, img_name)

            img = Image.new("RGB", (64, 64), color=(100 + i * 10, 100, 100))
            img.save(img_path)

            records.append({
                "image_id": img_name,
                "hand": 1 if i % 2 == 0 else 0,
                "leg": 1 if i % 2 == 1 else 0,
                "hip": 0,
                "shoulder": 0,
                "mixed": 0,
                "hardware": 1 if i == 0 else 0,
                "multiscan": 0,
                "fractured": is_frac,
                "fracture_count": 1 if is_frac else 0,
                "frontal": 1,
                "lateral": 0,
                "oblique": 0,
            })

        # Add duplicate edge-case: fractured image also copied in non_fractured folder
        dup_img = "IMG0000001.jpg"
        dup_path = os.path.join(non_frac_dir, dup_img)
        img = Image.new("RGB", (64, 64), color=(110, 100, 100))
        img.save(dup_path)

        df = pd.DataFrame(records)
        df.to_csv(os.path.join(tmpdir, "dataset.csv"), index=False)

        yield tmpdir


class TestFracAtlasIngestion:
    """Tests for FracAtlas ingestion and metadata resolution."""

    def test_load_metadata_and_resolve_paths(self, synthetic_fracatlas_dir):
        df = load_fracatlas_metadata(synthetic_fracatlas_dir)
        assert len(df) == 10
        assert "subfolder" in df.columns
        assert "full_path" in df.columns
        assert "primary_body_part" in df.columns

        # Verify all resolved paths exist on disk
        for p in df["full_path"]:
            assert os.path.exists(p)

    def test_duplicate_resolves_to_fractured_folder(self, synthetic_fracatlas_dir):
        df = load_fracatlas_metadata(synthetic_fracatlas_dir)
        dup_row = df[df["image_id"] == "IMG0000001.jpg"].iloc[0]
        # Must resolve to Fractured folder because fractured == 1
        assert dup_row["subfolder"] == "Fractured"
        assert "Fractured" in dup_row["full_path"]

    def test_audit_dataset_metrics(self, synthetic_fracatlas_dir):
        report = audit_fracatlas_dataset(synthetic_fracatlas_dir, validate_images=True)
        assert report["dataset_name"] == "FracAtlas"
        assert report["total_images"] == 10
        assert report["missing_files_count"] == 0
        assert report["unreadable_corrupt_count"] == 0
        assert report["class_distribution"]["fractured_positive"] == 3
        assert report["class_distribution"]["non_fractured_negative"] == 7
        assert report["hardware_distribution"]["images_with_hardware"] == 1
        assert report["label_semantics_audit"]["satisfies_locked_medimind_specification"] is True

    def test_create_stratified_split_zero_leakage(self, synthetic_fracatlas_dir):
        df = load_fracatlas_metadata(synthetic_fracatlas_dir)
        # Duplicate dataframe to test split with larger sample size
        larger_df = pd.concat([df] * 6, ignore_index=True)
        larger_df["image_id"] = [f"IMG{i:07d}.jpg" for i in range(len(larger_df))]

        splits = create_fracatlas_stratified_split(
            larger_df,
            train_size=0.70,
            val_size=0.15,
            test_size=0.15,
            random_seed=42,
        )

        train_ids = set(splits["train"]["image_id"])
        val_ids = set(splits["val"]["image_id"])
        test_ids = set(splits["test"]["image_id"])

        assert len(train_ids.intersection(val_ids)) == 0
        assert len(train_ids.intersection(test_ids)) == 0
        assert len(val_ids.intersection(test_ids)) == 0

        # Class preservation
        assert (splits["train"]["fractured"] == 1).sum() > 0
        assert (splits["train"]["fractured"] == 0).sum() > 0
        assert (splits["val"]["fractured"] == 1).sum() > 0
        assert (splits["test"]["fractured"] == 1).sum() > 0
