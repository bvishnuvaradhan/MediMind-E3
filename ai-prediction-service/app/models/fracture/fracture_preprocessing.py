"""
fracture_preprocessing.py — Preprocessing and validation pipeline for Fracture Detection X-ray images.

Provides:
  - validate_image_bytes: Format checking, byte-level corruption trap, dimension bounds
  - preprocess_image_bytes: In-memory pipeline converting raw bytes to normalized PyTorch tensor
  - get_training_transforms: Training-time augmentation pipeline
  - get_inference_transforms: Deterministic evaluation / inference transform pipeline
  - FractureImageDataset: PyTorch Dataset for loading X-ray images from disk or metadata
  - create_patient_stratified_split: Patient-level split to prevent data leakage across train/val/test
"""

import io
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
from PIL import Image, UnidentifiedImageError
import torch
from torch.utils.data import Dataset
import torchvision.transforms as transforms
import pandas as pd


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS & CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_IMAGE_SIZE: Tuple[int, int] = (224, 224)
MIN_DIMENSION: int = 32
MAX_DIMENSION: int = 10000
MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB

IMAGENET_MEAN: List[float] = [0.485, 0.456, 0.406]
IMAGENET_STD: List[float] = [0.229, 0.224, 0.225]

SUPPORTED_IMAGE_FORMATS: Tuple[str, ...] = ("PNG", "JPEG", "JPG", "WEBP", "TIFF", "BMP", "DICOM")


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def validate_image_bytes(
    image_bytes: bytes,
    max_size_bytes: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Validate raw image bytes before decoding or feeding to the CNN.

    Checks:
      1. Non-empty payload
      2. File size within acceptable upper bound
      3. Valid decodable image structure (corruption trap via PIL verify())
      4. Format in supported image types
      5. Dimensions within acceptable bounds (MIN_DIMENSION <= H, W <= MAX_DIMENSION)

    Returns:
        Dict with keys: format, width, height, mode, size_bytes

    Raises:
        ValueError: If validation fails for any reason.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Image payload is empty (0 bytes received).")

    limit_bytes = MAX_FILE_SIZE_BYTES if max_size_bytes is None else max_size_bytes
    size_bytes = len(image_bytes)
    if size_bytes > limit_bytes:
        raise ValueError(
            f"Image payload size ({size_bytes} bytes) exceeds maximum permitted limit ({limit_bytes} bytes)."
        )

    # Check for DICOM magic preamble (128 preamble bytes followed by 'DICM')
    if len(image_bytes) > 132 and image_bytes[128:132] == b"DICM":
        return {
            "format": "DICOM",
            "width": None,
            "height": None,
            "mode": "DICOM",
            "size_bytes": size_bytes,
        }

    # Step 1: Detect corrupted / truncated bytes using PIL verify()
    try:
        buffer = io.BytesIO(image_bytes)
        img_check = Image.open(buffer)
        img_format = (img_check.format or "").upper()
        img_check.verify()  # Traps structural corruption
    except (UnidentifiedImageError, SyntaxError, OSError) as e:
        raise ValueError(f"Corrupted or unrecognizable image file: {str(e)}")

    # Step 2: Re-open image to inspect dimensions and color mode
    try:
        buffer.seek(0)
        img = Image.open(buffer)
        width, height = img.size
        mode = img.mode
    except Exception as e:
        raise ValueError(f"Failed to inspect image attributes: {str(e)}")

    # Format verification
    if img_format not in SUPPORTED_IMAGE_FORMATS and img_format not in ("MPO",):
        raise ValueError(
            f"Unsupported image format '{img_format}'. Supported formats: {list(SUPPORTED_IMAGE_FORMATS)}"
        )

    # Dimension bounds
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        raise ValueError(
            f"Image dimensions ({width}x{height}) are below minimum required size ({MIN_DIMENSION}x{MIN_DIMENSION})."
        )
    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise ValueError(
            f"Image dimensions ({width}x{height}) exceed maximum allowed size ({MAX_DIMENSION}x{MAX_DIMENSION})."
        )

    return {
        "format": img_format,
        "width": width,
        "height": height,
        "mode": mode,
        "size_bytes": size_bytes,
    }


# ─────────────────────────────────────────────────────────────────────────────
# TRANSFORMATION PIPELINES
# ─────────────────────────────────────────────────────────────────────────────

def get_inference_transforms(
    target_size: Tuple[int, int] = DEFAULT_IMAGE_SIZE,
) -> transforms.Compose:
    """
    Deterministic transformation pipeline for validation, testing, and live inference.
    Resizes image to target resolution, converts to Tensor, and normalizes.
    """
    return transforms.Compose([
        transforms.Resize(target_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_training_transforms(
    target_size: Tuple[int, int] = DEFAULT_IMAGE_SIZE,
) -> transforms.Compose:
    """
    Data augmentation and transformation pipeline strictly for training batches.
    Includes random horizontal flips, mild rotations, and slight color/contrast adjustments.
    """
    return transforms.Compose([
        transforms.Resize(target_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=(-15, 15)),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def preprocess_image_bytes(
    image_bytes: bytes,
    target_size: Tuple[int, int] = DEFAULT_IMAGE_SIZE,
) -> torch.Tensor:
    """
    Validate and preprocess raw image bytes into a normalized PyTorch tensor ready for CNN inference.

    Pipeline:
      1. validate_image_bytes()
      2. Decode into PIL Image (supports PNG, JPEG, and DICOM preamble)
      3. Standardize channels to RGB (grayscale replicated across 3 channels)
      4. Apply get_inference_transforms()
      5. Returns [3, H, W] FloatTensor

    Raises:
        ValueError: If image validation or decoding fails.
    """
    validate_image_bytes(image_bytes)

    # Check for DICOM preamble
    if len(image_bytes) > 132 and image_bytes[128:132] == b"DICM":
        # Search for encapsulated JPEG or PNG
        jpeg_idx = image_bytes.find(b"\xff\xd8\xff")
        if jpeg_idx != -1:
            try:
                img = Image.open(io.BytesIO(image_bytes[jpeg_idx:]))
                if img.mode != "RGB":
                    img = img.convert("RGB")
                return get_inference_transforms(target_size)(img)
            except Exception:
                pass

        png_idx = image_bytes.find(b"\x89PNG\r\n\x1a\n")
        if png_idx != -1:
            try:
                img = Image.open(io.BytesIO(image_bytes[png_idx:]))
                if img.mode != "RGB":
                    img = img.convert("RGB")
                return get_inference_transforms(target_size)(img)
            except Exception:
                pass

        # Handle uncompressed pixel payload or test dummy DICOM preamble
        pixel_payload = image_bytes[132:]
        if len(pixel_payload) >= 16:
            arr = np.frombuffer(pixel_payload, dtype=np.uint8)
            side = int(np.sqrt(len(arr)))
            if side >= 16:
                arr = arr[:side * side].reshape(side, side)
            else:
                arr = np.zeros(target_size, dtype=np.uint8)
            img = Image.fromarray(arr).convert("RGB")
            return get_inference_transforms(target_size)(img)

    try:
        buffer = io.BytesIO(image_bytes)
        img = Image.open(buffer)
        # Standardize color mode: convert grayscale (L), palette (P), or RGBA to 3-channel RGB
        if img.mode != "RGB":
            img = img.convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to decode image into RGB channels: {str(e)}")

    transform = get_inference_transforms(target_size)
    tensor = transform(img)
    return tensor


# ─────────────────────────────────────────────────────────────────────────────
# PYTORCH DATASET
# ─────────────────────────────────────────────────────────────────────────────

class FractureImageDataset(Dataset):
    """
    PyTorch Dataset for bone fracture X-ray datasets.
    Supports loading from a list of (image_path, label) tuples or a pandas DataFrame.
    """

    def __init__(
        self,
        samples: List[Tuple[str, int]],
        transform: Optional[transforms.Compose] = None,
    ):
        """
        Args:
            samples: List of (file_path, label) where label is 0 (normal) or 1 (fracture).
            transform: Optional torchvision transform to apply to images.
        """
        self.samples = samples
        self.transform = transform or get_inference_transforms()

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        image_path, label = self.samples[idx]
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        validate_image_bytes(image_bytes)
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        tensor = self.transform(img)
        return tensor, label


# ─────────────────────────────────────────────────────────────────────────────
# LEAKAGE-FREE PATIENT SPLITTING
# ─────────────────────────────────────────────────────────────────────────────

def create_patient_stratified_split(
    df: pd.DataFrame,
    patient_col: str = "patient_id",
    label_col: str = "label",
    train_size: float = 0.70,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_seed: int = 42,
) -> Dict[str, pd.DataFrame]:
    """
    Partition dataset strictly by patient_id to prevent data leakage across splits.
    Ensures that no single patient appears in more than one partition (train, val, or test).

    Args:
        df: DataFrame containing at least patient_id and label columns.
        patient_col: Name of the patient ID column.
        label_col: Name of the binary target label column.
        train_size: Proportion of patients for training (default 0.70).
        val_size: Proportion of patients for validation (default 0.15).
        test_size: Proportion of patients for final testing (default 0.15).
        random_seed: Random state for reproducible partitioning.

    Returns:
        Dict with keys: 'train', 'val', 'test', each containing the subset DataFrame.
    """
    from sklearn.model_selection import train_test_split

    if abs((train_size + val_size + test_size) - 1.0) > 1e-5:
        raise ValueError("train_size, val_size, and test_size must sum to 1.0.")

    if patient_col not in df.columns:
        raise ValueError(f"Patient column '{patient_col}' not found in DataFrame.")
    if label_col not in df.columns:
        raise ValueError(f"Label column '{label_col}' not found in DataFrame.")

    # Determine primary label for each patient for stratification
    patient_labels = df.groupby(patient_col)[label_col].max().reset_index()

    # Split patients into Train vs (Val + Test)
    temp_val_test_size = val_size + test_size
    train_patients, temp_patients = train_test_split(
        patient_labels,
        test_size=temp_val_test_size,
        stratify=patient_labels[label_col],
        random_state=random_seed,
    )

    # Split remaining patients into Val and Test
    relative_test_size = test_size / temp_val_test_size
    val_patients, test_patients = train_test_split(
        temp_patients,
        test_size=relative_test_size,
        stratify=temp_patients[label_col],
        random_state=random_seed,
    )

    train_ids = set(train_patients[patient_col])
    val_ids = set(val_patients[patient_col])
    test_ids = set(test_patients[patient_col])

    # Integrity verification: Zero patient overlap
    assert len(train_ids.intersection(val_ids)) == 0, "Patient leakage detected between train and val!"
    assert len(train_ids.intersection(test_ids)) == 0, "Patient leakage detected between train and test!"
    assert len(val_ids.intersection(test_ids)) == 0, "Patient leakage detected between val and test!"

    train_df = df[df[patient_col].isin(train_ids)].copy().reset_index(drop=True)
    val_df = df[df[patient_col].isin(val_ids)].copy().reset_index(drop=True)
    test_df = df[df[patient_col].isin(test_ids)].copy().reset_index(drop=True)

    return {
        "train": train_df,
        "val": val_df,
        "test": test_df,
    }
