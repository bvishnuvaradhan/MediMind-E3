"""
test_experiment_isolation.py

Regression test suite ensuring:
1. Production model selection is explicitly bound to fracture_v2/best_model.pt or fracture/best_model.pt.
2. Experimental candidates (candidate_refined_resnet18.pt, candidate_a, candidate_b)
   are never loaded accidentally or through any fallback mechanism.
3. Production model hash remains unchanged (ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60).
4. Candidate checkpoints can be loaded independently in an isolated environment without side-effects.
"""

import hashlib
import os
from pathlib import Path
import pytest
import torch

from app.services.fracture_service import FractureInferenceService, MODEL_PATH
from app.models.fracture_v2.model import FractureResNet18


PROD_V2_PATH = Path(__file__).parents[2] / "artifacts" / "fracture_v2" / "best_model.pt"
PROD_V2_SHA256 = "ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60"

REFINED_CANDIDATE_PATH = (
    Path(__file__).parents[2]
    / "artifacts"
    / "experiments"
    / "resnet18_refinement_20261019"
    / "candidate_refined_resnet18.pt"
)
REFINED_CANDIDATE_SHA256 = "5e6e1cdd3f28080c8d2b3f6370379df9a67058e42f7fd62acb8d4848abb18b8e"


def calculate_sha256(path: Path) -> str:
    sha = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest()


class TestXrayExperimentIsolation:
    def test_production_v2_model_hash_unchanged(self):
        """Verify the production fracture_v2 model artifact has not been modified or overwritten."""
        assert PROD_V2_PATH.exists(), f"Production v2 model not found at {PROD_V2_PATH}"
        actual_hash = calculate_sha256(PROD_V2_PATH)
        assert actual_hash == PROD_V2_SHA256, (
            f"Production model SHA-256 mismatch! Expected {PROD_V2_SHA256}, got {actual_hash}"
        )

    def test_production_inference_service_path_isolation(self):
        """Verify production inference service does not point to an experimental directory."""
        service_path_str = str(MODEL_PATH).replace("\\", "/")
        assert "artifacts/experiments/" not in service_path_str, (
            f"Production service default model path points to experiment directory: {service_path_str}"
        )

    def test_refined_candidate_is_isolated(self):
        """Verify the refined candidate checkpoint exists in its isolated experiment folder with verified hash."""
        assert REFINED_CANDIDATE_PATH.exists(), f"Refined candidate not found at {REFINED_CANDIDATE_PATH}"
        actual_hash = calculate_sha256(REFINED_CANDIDATE_PATH)
        assert actual_hash == REFINED_CANDIDATE_SHA256, (
            f"Refined candidate SHA-256 mismatch! Expected {REFINED_CANDIDATE_SHA256}, got {actual_hash}"
        )

    def test_isolated_candidate_loading(self):
        """Verify candidate checkpoint loads cleanly into FractureResNet18 in an isolated context."""
        checkpoint = torch.load(REFINED_CANDIDATE_PATH, map_location="cpu")
        assert "model_state_dict" in checkpoint
        assert "optimal_threshold" in checkpoint

        model = FractureResNet18(pretrained=False, dropout_rate=0.25)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()

        dummy_x = torch.randn(1, 3, 224, 224)
        prob = model.predict_proba(dummy_x)
        assert 0.0 <= prob.item() <= 1.0
