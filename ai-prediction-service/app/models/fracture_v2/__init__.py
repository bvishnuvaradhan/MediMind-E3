"""
MediMind Fracture Detection AI Module (v2)
"""

from .model import FractureResNet18, create_fracture_model
from .transforms import FractureDataset, get_transforms
from .dataset_builder import inspect_and_clean_fracatlas
from .trainer import train_fracture_model
from .evaluator import (
    predict_dataset,
    optimize_threshold_on_val,
    compute_metrics_at_threshold,
    evaluate_subgroups,
)
from .gradcam import GradCAM, generate_gradcam_artifacts

__all__ = [
    "FractureResNet18",
    "create_fracture_model",
    "FractureDataset",
    "get_transforms",
    "inspect_and_clean_fracatlas",
    "train_fracture_model",
    "predict_dataset",
    "optimize_threshold_on_val",
    "compute_metrics_at_threshold",
    "evaluate_subgroups",
    "GradCAM",
    "generate_gradcam_artifacts",
]
