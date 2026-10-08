"""
test_fracture_training.py — Unit tests for Fracture Detection PyTorch model architecture,
transfer learning, validation threshold calibration, and clinical evaluation metrics.
"""

import tempfile
from pathlib import Path
import numpy as np
import pandas as pd
import pytest
import torch
import torch.nn as nn

from app.models.fracture.fracture_training import (
    FractureClassifier,
    calibrate_threshold,
    calculate_ece,
    evaluate_model_performance,
    set_seed,
)


class TestFractureClassifierArchitecture:
    """Test PyTorch FractureClassifier ResNet-18 architecture and transfer learning."""

    def test_model_instantiation_and_forward_pass(self):
        model = FractureClassifier(pretrained=False)
        model.eval()

        dummy_batch = torch.randn(2, 3, 224, 224)
        with torch.no_grad():
            logits = model(dummy_batch)
            probs = model.predict_proba(dummy_batch)

        assert logits.shape == (2, 1)
        assert probs.shape == (2, 1)
        assert (probs >= 0.0).all() and (probs <= 1.0).all()

    def test_backbone_extraction_and_transfer_learning(self):
        model_source = FractureClassifier(pretrained=False)
        backbone_sd = model_source.extract_backbone_state_dict()

        assert len(backbone_sd) > 0
        # Verify no classification head keys in backbone dict
        assert not any(k.startswith("head.") for k in backbone_sd.keys())
        assert not any(k.startswith("dropout.") for k in backbone_sd.keys())

        with tempfile.TemporaryDirectory() as tmp_dir:
            ckpt_path = Path(tmp_dir) / "test_backbone.pt"
            torch.save({"backbone_state_dict": backbone_sd}, ckpt_path)

            model_target = FractureClassifier(pretrained=False, weights_path=str(ckpt_path))

            # Verify backbone weights match exactly
            for k, v in backbone_sd.items():
                target_v = model_target.backbone.state_dict()[k]
                assert torch.equal(v, target_v), f"Mismatch for layer {k}"

    def test_freeze_and_unfreeze_backbone(self):
        model = FractureClassifier(pretrained=False)

        model.freeze_backbone()
        for name, param in model.backbone.named_parameters():
            assert not param.requires_grad, f"Layer {name} should be frozen"
        for name, param in model.head.named_parameters():
            assert param.requires_grad, f"Head layer {name} should be trainable"

        model.unfreeze_backbone()
        for name, param in model.named_parameters():
            assert param.requires_grad, f"Layer {name} should be trainable after unfreeze"


class TestThresholdCalibrationAndMetrics:
    """Test decision threshold calibration and comprehensive clinical metrics."""

    def test_calibrate_threshold_respects_minimum_specificity(self):
        # Synthetic validation distribution: 80 negatives, 20 positives
        np.random.seed(42)
        neg_probs = np.random.uniform(0.05, 0.40, size=80)
        pos_probs = np.random.uniform(0.35, 0.90, size=20)

        val_probs = np.concatenate([neg_probs, pos_probs])
        val_labels = np.concatenate([np.zeros(80), np.ones(20)])

        threshold = calibrate_threshold(val_probs, val_labels, min_specificity=0.60)
        assert 0.05 <= threshold <= 0.95

        # Check that specificity at calibrated threshold >= 0.60
        preds = (val_probs >= threshold).astype(int)
        tn = ((val_labels == 0) & (preds == 0)).sum()
        spec = tn / 80.0
        assert spec >= 0.60

    def test_calculate_ece_metric(self):
        # Perfect calibration case
        y_true = np.array([0, 0, 1, 1])
        y_prob = np.array([0.05, 0.10, 0.90, 0.95])
        ece = calculate_ece(y_true, y_prob, n_bins=10)
        assert isinstance(ece, float)
        assert 0.0 <= ece <= 0.20  # Very low calibration error

    def test_evaluate_model_performance_metrics_and_subgroups(self):
        y_true = np.array([1, 1, 0, 0, 1, 0, 0, 0, 1, 0])
        y_prob = np.array([0.9, 0.8, 0.1, 0.2, 0.7, 0.3, 0.4, 0.15, 0.85, 0.25])
        threshold = 0.50

        meta_df = pd.DataFrame({
            "primary_body_part": ["hand", "hand", "hand", "leg", "leg", "leg", "hip", "hip", "shoulder", "shoulder"],
            "hardware": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        })

        results = evaluate_model_performance(y_true, y_prob, threshold=threshold, metadata_df=meta_df)

        assert results["threshold"] == 0.50
        assert results["total_samples"] == 10

        m = results["metrics"]
        assert m["recall"] == 1.0  # All 4 positives correctly predicted
        assert m["specificity"] == 1.0  # All 6 negatives correctly predicted
        assert m["precision"] == 1.0
        assert m["f1_score"] == 1.0
        assert m["roc_auc"] == 1.0
        assert m["brier_score"] < 0.10
        assert "expected_calibration_error" in m

        # Verify subgroup metrics
        subgroups = results.get("subgroups", {})
        assert "anatomy_hand" in subgroups
        assert "anatomy_leg" in subgroups
        assert "with_hardware" in subgroups
        assert "without_hardware" in subgroups
        assert subgroups["anatomy_hand"]["count"] == 3


class TestReproducibility:
    """Test deterministic seed initialization."""

    def test_set_seed_produces_identical_weights(self):
        set_seed(1234)
        m1 = FractureClassifier(pretrained=False)
        w1 = m1.head.weight.data.clone()

        set_seed(1234)
        m2 = FractureClassifier(pretrained=False)
        w2 = m2.head.weight.data.clone()

        assert torch.equal(w1, w2)
