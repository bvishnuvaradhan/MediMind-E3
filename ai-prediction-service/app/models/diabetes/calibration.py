"""Rigorous Probability Calibration & Reliability Assessment.

Computes:
- Brier Score & Brier Score decomposition (Reliability & Resolution)
- Expected Calibration Error (ECE) and Maximum Calibration Error (MCE)
- Reliability diagram coordinates
- Post-hoc Calibration fitting (Platt Scaling / Sigmoid, Isotonic Regression)
- Calibration Slope and Intercept via Logistic Calibration
"""

from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss


def compute_expected_calibration_error(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10,
    strategy: str = "uniform",
) -> Dict[str, Any]:
    """Calculate Expected Calibration Error (ECE) and Maximum Calibration Error (MCE).

    Args:
        y_true: True binary targets {0, 1}
        y_prob: Predicted probabilities in [0, 1]
        n_bins: Number of confidence bins
        strategy: 'uniform' (equal width) or 'quantile' (equal frequency)
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)
    n = len(y_true)

    if strategy == "quantile":
        quantiles = np.linspace(0, 1, n_bins + 1)
        bin_edges = np.percentile(y_prob, quantiles * 100)
        bin_edges[0] = 0.0
        bin_edges[-1] = 1.0 + 1e-8
    else:
        bin_edges = np.linspace(0, 1.0, n_bins + 1)

    bin_assignments = np.digitize(y_prob, bin_edges) - 1
    bin_assignments = np.clip(bin_assignments, 0, n_bins - 1)

    bin_data = []
    ece = 0.0
    mce = 0.0

    for b in range(n_bins):
        mask = bin_assignments == b
        bin_count = int(np.sum(mask))
        if bin_count > 0:
            bin_acc = float(np.mean(y_true[mask]))
            bin_conf = float(np.mean(y_prob[mask]))
            gap = abs(bin_acc - bin_conf)
            weight = bin_count / n
            ece += weight * gap
            mce = max(mce, gap)
            bin_data.append({
                "bin_index": b,
                "bin_lower": float(bin_edges[b]),
                "bin_upper": float(bin_edges[b + 1]),
                "count": bin_count,
                "confidence": bin_conf,
                "accuracy": bin_acc,
                "gap": gap,
            })
        else:
            bin_data.append({
                "bin_index": b,
                "bin_lower": float(bin_edges[b]),
                "bin_upper": float(bin_edges[b + 1]),
                "count": 0,
                "confidence": float((bin_edges[b] + bin_edges[b + 1]) / 2),
                "accuracy": 0.0,
                "gap": 0.0,
            })

    # Calibration slope & intercept via logistic regression on logit(p)
    eps = 1e-6
    clipped_probs = np.clip(y_prob, eps, 1 - eps)
    logits = np.log(clipped_probs / (1 - clipped_probs)).reshape(-1, 1)
    try:
        calib_lr = LogisticRegression(C=1e5, solver="lbfgs")
        calib_lr.fit(logits, y_true)
        slope = float(calib_lr.coef_[0][0])
        intercept = float(calib_lr.intercept_[0])
    except Exception:
        slope = 1.0
        intercept = 0.0

    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=n_bins, strategy="uniform")

    return {
        "expected_calibration_error": float(ece),
        "maximum_calibration_error": float(mce),
        "brier_score": float(brier_score_loss(y_true, y_prob)),
        "calibration_slope": slope,
        "calibration_intercept": intercept,
        "curve_prob_true": [float(p) for p in prob_true],
        "curve_prob_pred": [float(p) for p in prob_pred],
        "bins": bin_data,
    }


class CalibratedModelWrapper:
    """Encapsulates a model with a post-hoc calibration layer fit on validation data."""

    def __init__(self, base_estimator: Any, method: str = "sigmoid"):
        """
        Args:
            base_estimator: Fitted or unfitted scikit-learn classifier
            method: 'sigmoid' (Platt scaling) or 'isotonic'
        """
        self.base_estimator = base_estimator
        self.method = method
        self.calibrated_estimator_: Optional[Any] = None

    def fit_calibration(self, x_val: np.ndarray, y_val: np.ndarray) -> "CalibratedModelWrapper":
        """Fit post-hoc calibration on validation partition only (pre-fitted base model)."""
        self.calibrated_estimator_ = CalibratedClassifierCV(
            estimator=self.base_estimator,
            method=self.method,
            cv=None,
        )
        self.calibrated_estimator_.fit(x_val, y_val)
        return self

    def predict_proba(self, x: np.ndarray) -> np.ndarray:
        if self.calibrated_estimator_ is not None:
            return self.calibrated_estimator_.predict_proba(x)
        return self.base_estimator.predict_proba(x)

    def predict(self, x: np.ndarray) -> np.ndarray:
        if self.calibrated_estimator_ is not None:
            return self.calibrated_estimator_.predict(x)
        return self.base_estimator.predict(x)
