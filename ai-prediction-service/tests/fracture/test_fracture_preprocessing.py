"""
test_fracture_preprocessing.py — Unit tests for Fracture Detection image validation,
preprocessing, transforms, and patient-level splitting using in-memory synthetic images.

No external dataset files or disk artifacts are used.
"""

import io
import pytest
from PIL import Image
import torch
import torchvision.transforms as transforms
import pandas as pd
import numpy as np

from app.models.fracture.fracture_preprocessing import (
    validate_image_bytes,
    preprocess_image_bytes,
    get_training_transforms,
    get_inference_transforms,
    create_patient_stratified_split,
    DEFAULT_IMAGE_SIZE,
    MIN_DIMENSION,
    MAX_DIMENSION,
    SUPPORTED_IMAGE_FORMATS,
)


# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES & IN-MEMORY IMAGE GENERATORS
# ─────────────────────────────────────────────────────────────────────────────

def _generate_test_image_bytes(
    width: int = 256,
    height: int = 256,
    mode: str = "RGB",
    img_format: str = "PNG",
) -> bytes:
    """Generate in-memory image bytes without saving to disk."""
    if mode == "RGB":
        color = (120, 140, 160)
    elif mode == "L":
        color = 128
    elif mode == "RGBA":
        color = (120, 140, 160, 255)
    else:
        color = 0

    img = Image.new(mode, (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=img_format)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestImageValidation:
    """Tests for validate_image_bytes."""

    def test_valid_rgb_png(self):
        data = _generate_test_image_bytes(256, 256, mode="RGB", img_format="PNG")
        meta = validate_image_bytes(data)
        assert meta["format"] == "PNG"
        assert meta["width"] == 256
        assert meta["height"] == 256
        assert meta["size_bytes"] == len(data)

    def test_valid_grayscale_jpeg(self):
        data = _generate_test_image_bytes(512, 512, mode="L", img_format="JPEG")
        meta = validate_image_bytes(data)
        assert meta["format"] == "JPEG"
        assert meta["width"] == 512
        assert meta["height"] == 512
        assert meta["mode"] == "L"

    def test_valid_rgba_png(self):
        data = _generate_test_image_bytes(300, 400, mode="RGBA", img_format="PNG")
        meta = validate_image_bytes(data)
        assert meta["format"] == "PNG"
        assert meta["width"] == 300
        assert meta["height"] == 400

    def test_rejects_empty_bytes(self):
        with pytest.raises(ValueError, match="Image payload is empty"):
            validate_image_bytes(b"")

    def test_rejects_corrupted_truncated_bytes(self):
        valid = _generate_test_image_bytes(256, 256, img_format="PNG")
        # Truncate halfway through
        corrupted = valid[: len(valid) // 3]
        with pytest.raises(ValueError, match="Corrupted or unrecognizable image"):
            validate_image_bytes(corrupted)

    def test_rejects_arbitrary_non_image_bytes(self):
        junk = b"NOT_AN_IMAGE_RANDOM_TEXT_BYTES_1234567890"
        with pytest.raises(ValueError, match="Corrupted or unrecognizable image"):
            validate_image_bytes(junk)

    def test_rejects_image_below_min_dimension(self):
        small = _generate_test_image_bytes(MIN_DIMENSION - 5, MIN_DIMENSION - 5, img_format="PNG")
        with pytest.raises(ValueError, match="below minimum required size"):
            validate_image_bytes(small)

    def test_rejects_image_exceeding_max_file_size(self):
        data = _generate_test_image_bytes(100, 100, img_format="PNG")
        with pytest.raises(ValueError, match="exceeds maximum permitted limit"):
            validate_image_bytes(data, max_size_bytes=100)  # Very low threshold for test

    def test_dicom_preamble_recognized(self):
        # 128 bytes preamble + b"DICM"
        dicom_dummy = b"\x00" * 128 + b"DICM" + b"\x00" * 20
        meta = validate_image_bytes(dicom_dummy)
        assert meta["format"] == "DICOM"


# ─────────────────────────────────────────────────────────────────────────────
# PREPROCESSING & TRANSFORMATION TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestImagePreprocessing:
    """Tests for preprocess_image_bytes and transform pipelines."""

    def test_preprocess_rgb_image_returns_normalized_tensor(self):
        data = _generate_test_image_bytes(300, 300, mode="RGB", img_format="PNG")
        tensor = preprocess_image_bytes(data)

        # Check shape [3, 224, 224]
        assert isinstance(tensor, torch.Tensor)
        assert tensor.shape == (3, DEFAULT_IMAGE_SIZE[0], DEFAULT_IMAGE_SIZE[1])
        assert tensor.dtype == torch.float32

        # Check that tensor has no NaN or Inf
        assert not torch.isnan(tensor).any()
        assert not torch.isinf(tensor).any()

    def test_preprocess_grayscale_image_standardized_to_3_channels(self):
        data = _generate_test_image_bytes(400, 400, mode="L", img_format="JPEG")
        tensor = preprocess_image_bytes(data)

        # Grayscale must be converted to 3 channels for CNN backbone compatibility
        assert tensor.shape == (3, DEFAULT_IMAGE_SIZE[0], DEFAULT_IMAGE_SIZE[1])
        # Each channel should be non-NaN, finite, and normalized according to its ImageNet mean/std
        assert not torch.isnan(tensor).any()
        assert not torch.isinf(tensor).any()
        # Verify that channels have the expected relative values based on ImageNet normalization
        # Mean: R=0.485, G=0.456, B=0.406 -> For a uniform grayscale image, G > R
        assert tensor[1].mean() > tensor[0].mean()

    def test_inference_transforms_are_deterministic(self):
        transforms_fn = get_inference_transforms(DEFAULT_IMAGE_SIZE)
        img = Image.new("RGB", (256, 256), color=(100, 150, 200))

        t1 = transforms_fn(img)
        t2 = transforms_fn(img)
        assert torch.equal(t1, t2), "Inference transforms must be fully deterministic"

    def test_training_transforms_contain_augmentations(self):
        train_transforms = get_training_transforms(DEFAULT_IMAGE_SIZE)
        transform_types = [type(t) for t in train_transforms.transforms]

        assert transforms.RandomHorizontalFlip in transform_types
        assert transforms.RandomRotation in transform_types
        assert transforms.Normalize in transform_types
        assert transforms.ToTensor in transform_types


# ─────────────────────────────────────────────────────────────────────────────
# LEAKAGE-FREE PATIENT SPLITTING TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestPatientStratifiedSplit:
    """Tests for create_patient_stratified_split."""

    def test_zero_patient_leakage_across_splits(self):
        # Generate synthetic metadata with multiple images per patient
        records = []
        for p_id in range(100):
            num_views = np.random.randint(1, 4)
            label = 1 if p_id % 3 == 0 else 0  # Imbalanced labels
            for v_id in range(num_views):
                records.append({
                    "patient_id": f"PAT_{p_id:04d}",
                    "image_id": f"IMG_{p_id:04d}_{v_id}",
                    "label": label,
                })

        df = pd.DataFrame(records)
        splits = create_patient_stratified_split(
            df,
            patient_col="patient_id",
            label_col="label",
            train_size=0.70,
            val_size=0.15,
            test_size=0.15,
            random_seed=42,
        )

        train_patients = set(splits["train"]["patient_id"])
        val_patients = set(splits["val"]["patient_id"])
        test_patients = set(splits["test"]["patient_id"])

        # Strict leakage verification
        assert len(train_patients.intersection(val_patients)) == 0
        assert len(train_patients.intersection(test_patients)) == 0
        assert len(val_patients.intersection(test_patients)) == 0

        # All original patients are accounted for
        assert len(train_patients | val_patients | test_patients) == 100

        # Class stratification: all splits contain both positive and negative classes
        assert (splits["train"]["label"] == 1).sum() > 0
        assert (splits["train"]["label"] == 0).sum() > 0
        assert (splits["val"]["label"] == 1).sum() > 0
        assert (splits["val"]["label"] == 0).sum() > 0
        assert (splits["test"]["label"] == 1).sum() > 0
        assert (splits["test"]["label"] == 0).sum() > 0
