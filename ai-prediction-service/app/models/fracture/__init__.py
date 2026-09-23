"""
Fracture Detection Model Package.
Provides dataset specification, image validation, preprocessing, model pipelines,
MURA dataset audit utilities, and FracAtlas ingestion tooling.
"""

from .fracture_preprocessing import (
    validate_image_bytes,
    preprocess_image_bytes,
    get_training_transforms,
    get_inference_transforms,
    FractureImageDataset,
    SUPPORTED_IMAGE_FORMATS,
    DEFAULT_IMAGE_SIZE,
)
from .mura_audit import (
    parse_mura_path,
    audit_mura_metadata_csv,
    audit_mura_extracted_directory,
    save_audit_report,
    MURA_BODY_PARTS,
    MURA_SPLITS,
)
from .fracatlas_ingestion import (
    load_fracatlas_metadata,
    audit_fracatlas_dataset,
    create_fracatlas_stratified_split,
    FRACATLAS_ANATOMICAL_PARTS,
)

__all__ = [
    "validate_image_bytes",
    "preprocess_image_bytes",
    "get_training_transforms",
    "get_inference_transforms",
    "FractureImageDataset",
    "SUPPORTED_IMAGE_FORMATS",
    "DEFAULT_IMAGE_SIZE",
    "parse_mura_path",
    "audit_mura_metadata_csv",
    "audit_mura_extracted_directory",
    "save_audit_report",
    "MURA_BODY_PARTS",
    "MURA_SPLITS",
    "load_fracatlas_metadata",
    "audit_fracatlas_dataset",
    "create_fracatlas_stratified_split",
    "FRACATLAS_ANATOMICAL_PARTS",
]
