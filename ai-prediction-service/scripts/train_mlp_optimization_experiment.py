"""Advanced MLP Optimization, Regularization, and Clinical Validation Experiment.

Pipelines evaluated:
1. Heart Disease Risk Prediction (Cardiovascular dataset, 11 features)
2. Diabetes Risk Prediction (Pima Indians dataset, 8 features)

Controlled experiment matrix:
- Architectures:
    * baseline_2layer: [in, 32, 16, 1]
    * proposed_6layer_bottleneck: [in, 32, 16, 8, 4, 2, 2, 1]
    * wider_6layer: [in, 32, 16, 16, 8, 8, 4, 1]
    * deep_pyramid_4layer: [in, 64, 32, 16, 8, 1]
- Activations: ReLU, GELU, SiLU, LeakyReLU
- Regularization: AdamW weight decay (1e-4, 1e-2), Dropout (0.0, 0.1, 0.2), LayerNorm, L1 penalty
- Clinical validation: specificity >= 0.60 constraint, validation-only threshold tuning,
  untouched single-pass test evaluation, subgroup analysis, calibration (ECE & Brier),
  and latency profiling.

Artifacts saved to:
    ai-prediction-service/artifacts/experiments/mlp_optimization_20261019/
"""

import copy
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Ensure repository root is in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
AI_SERVICE_ROOT = REPO_ROOT / "ai-prediction-service"
sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.models.heart_disease.heart_disease_preprocessing import (
    CARDIOVASCULAR_FEATURES,
    TARGET_COLUMN as HEART_TARGET,
    load_cardiovascular_dataset,
)
from app.models.diabetes.diabetes_preprocessing import (
    BIOLOGICAL_ZERO_COLUMNS,
    DIABETES_FEATURES,
    TARGET_COLUMN as DIABETES_TARGET,
    apply_biological_zero_imputation,
    compute_imputation_medians,
    load_diabetes_dataset,
)

RANDOM_STATE = 42
OUTPUT_DIR = AI_SERVICE_ROOT / "artifacts" / "experiments" / "mlp_optimization_20261019"

# Set deterministic seeds
def seed_everything(seed: int = RANDOM_STATE):
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# ─────────────────────────────────────────────────────────────────────────────
# PyTorch MLP Model Definition
# ─────────────────────────────────────────────────────────────────────────────

def get_activation(name: str) -> nn.Module:
    name = name.lower()
    if name == "relu":
        return nn.ReLU()
    elif name == "gelu":
        return nn.GELU()
    elif name == "silu" or name == "swish":
        return nn.SiLU()
    elif name == "leaky_relu":
        return nn.LeakyReLU(negative_slope=0.01)
    else:
        raise ValueError(f"Unknown activation function: {name}")


class ModularMLP(nn.Module):
    def __init__(
        self,
        in_dim: int,
        layer_dims: List[int],
        activation: str = "relu",
        dropout_rate: float = 0.0,
        use_norm: bool = False,
    ):
        super().__init__()
        self.in_dim = in_dim
        self.layer_dims = layer_dims
        self.activation_name = activation
        self.dropout_rate = dropout_rate
        self.use_norm = use_norm

        layers = []
        prev_dim = in_dim
        for i, hidden_dim in enumerate(layer_dims):
            layers.append(nn.Linear(prev_dim, hidden_dim))
            if use_norm and hidden_dim > 2:
                # Use LayerNorm for stability across small/variable batch sizes
                layers.append(nn.LayerNorm(hidden_dim))
            layers.append(get_activation(activation))
            if dropout_rate > 0.0 and hidden_dim > 2:
                layers.append(nn.Dropout(dropout_rate))
            prev_dim = hidden_dim

        # Final linear output projection
        layers.append(nn.Linear(prev_dim, 1))
        self.network = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Returns raw logits
        return self.network(x).squeeze(-1)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            logits = self.forward(x)
            return torch.sigmoid(logits)


# ─────────────────────────────────────────────────────────────────────────────
# Evaluation and Calibration Utilities
# ─────────────────────────────────────────────────────────────────────────────

def classification_metrics(
    target: np.ndarray,
    probabilities: np.ndarray,
    threshold: float = 0.5,
) -> Dict[str, Any]:
    target = np.asarray(target).astype(int)
    probabilities = np.asarray(probabilities, dtype=float)
    predictions = (probabilities >= threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(target, predictions, labels=[0, 1]).ravel()
    rec = float(recall_score(target, predictions, zero_division=0))
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    prec = float(precision_score(target, predictions, zero_division=0))
    f1 = float(f1_score(target, predictions, zero_division=0))
    roc_auc = float(roc_auc_score(target, probabilities)) if len(np.unique(target)) > 1 else None
    pr_auc = float(average_precision_score(target, probabilities)) if len(np.unique(target)) > 1 else None
    brier = float(brier_score_loss(target, probabilities))

    return {
        "threshold": round(threshold, 4),
        "recall": round(rec, 4),
        "sensitivity": round(rec, 4),
        "specificity": round(spec, 4),
        "precision": round(prec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
        "brier_score": round(brier, 4),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        "true_negatives": int(tn),
        "false_positives": int(fp),
        "false_negatives": int(fn),
        "true_positives": int(tp),
    }


def compute_calibration_ece(target: np.ndarray, probabilities: np.ndarray, n_bins: int = 10) -> Dict[str, Any]:
    target = np.asarray(target).astype(int)
    probabilities = np.asarray(probabilities, dtype=float)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(probabilities, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    ece = 0.0
    bin_details = []
    n_samples = len(target)

    for i in range(n_bins):
        mask = bin_indices == i
        count = int(np.sum(mask))
        if count > 0:
            avg_prob = float(np.mean(probabilities[mask]))
            true_rate = float(np.mean(target[mask]))
            weight = count / n_samples
            error = abs(avg_prob - true_rate)
            ece += weight * error
            bin_details.append({
                "bin": i,
                "count": count,
                "confidence": round(avg_prob, 4),
                "accuracy": round(true_rate, 4),
                "diff": round(error, 4),
            })
        else:
            bin_details.append({
                "bin": i,
                "count": 0,
                "confidence": 0.0,
                "accuracy": 0.0,
                "diff": 0.0,
            })

    return {"expected_calibration_error": round(float(ece), 4), "bins": bin_details}


def tune_threshold_validation(
    target: np.ndarray,
    probabilities: np.ndarray,
    min_specificity: float = 0.60,
) -> Tuple[float, Dict[str, Any]]:
    best_thresh = 0.5
    best_metrics = None
    best_score = (-1.0, -1.0)  # (recall, f1)

    for step in range(5, 96, 1):
        t = step / 100.0
        m = classification_metrics(target, probabilities, threshold=t)
        if m["specificity"] >= min_specificity:
            score = (m["recall"], m["f1"])
            if score > best_score:
                best_score = score
                best_thresh = t
                best_metrics = m

    if best_metrics is None:
        best_thresh = 0.5
        best_metrics = classification_metrics(target, probabilities, threshold=0.5)

    return best_thresh, best_metrics


def error_analysis(target: np.ndarray, probabilities: np.ndarray, threshold: float) -> Dict[str, Any]:
    target = np.asarray(target).astype(int)
    probabilities = np.asarray(probabilities, dtype=float)
    predictions = (probabilities >= threshold).astype(int)

    fp_mask = (target == 0) & (predictions == 1)
    fn_mask = (target == 1) & (predictions == 0)

    # High-confidence errors: predicted prob is extreme opposite of target
    high_conf_fp = (target == 0) & (probabilities >= 0.70)
    high_conf_fn = (target == 1) & (probabilities <= 0.30)

    total_neg = int(np.sum(target == 0))
    total_pos = int(np.sum(target == 1))

    return {
        "false_positive_count": int(np.sum(fp_mask)),
        "false_negative_count": int(np.sum(fn_mask)),
        "false_positive_rate": round(float(np.sum(fp_mask) / total_neg) if total_neg > 0 else 0.0, 4),
        "false_negative_rate": round(float(np.sum(fn_mask) / total_pos) if total_pos > 0 else 0.0, 4),
        "high_confidence_fp_count": int(np.sum(high_conf_fp)),
        "high_confidence_fn_count": int(np.sum(high_conf_fn)),
        "mean_prob_true_positive": round(float(np.mean(probabilities[target == 1])) if total_pos > 0 else 0.0, 4),
        "mean_prob_true_negative": round(float(np.mean(probabilities[target == 0])) if total_neg > 0 else 0.0, 4),
    }


def measure_latency_benchmarks(model: nn.Module, sample_x: torch.Tensor, runs: int = 1000) -> Dict[str, float]:
    model.eval()
    latencies = []
    # Warmup
    with torch.no_grad():
        for _ in range(50):
            _ = model.predict_proba(sample_x[:1])

    with torch.no_grad():
        for _ in range(runs):
            t0 = time.perf_counter()
            _ = model.predict_proba(sample_x[:1])
            latencies.append((time.perf_counter() - t0) * 1000.0)  # ms

    latencies = np.asarray(latencies)
    return {
        "mean_latency_ms": round(float(np.mean(latencies)), 4),
        "median_latency_ms": round(float(np.median(latencies)), 4),
        "p95_latency_ms": round(float(np.percentile(latencies, 95)), 4),
        "p99_latency_ms": round(float(np.percentile(latencies, 99)), 4),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Training Harness
# ─────────────────────────────────────────────────────────────────────────────

def train_pytorch_mlp(
    model: nn.Module,
    x_train: np.ndarray,
    y_train: np.ndarray,
    x_val: np.ndarray,
    y_val: np.ndarray,
    optimizer_name: str = "adamw",
    lr: float = 1e-3,
    weight_decay: float = 1e-4,
    l1_lambda: float = 0.0,
    max_epochs: int = 200,
    batch_size: int = 256,
    patience: int = 15,
    grad_clip: float = 1.0,
    pos_weight: float = 1.0,
) -> Tuple[nn.Module, Dict[str, Any]]:
    device = torch.device("cpu")
    model.to(device)

    # Convert data to tensors
    xt_train = torch.tensor(x_train, dtype=torch.float32, device=device)
    yt_train = torch.tensor(y_train, dtype=torch.float32, device=device)
    xt_val = torch.tensor(x_val, dtype=torch.float32, device=device)
    yt_val = torch.tensor(y_val, dtype=torch.float32, device=device)

    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor(pos_weight, device=device))

    if optimizer_name.lower() == "adamw":
        optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    elif optimizer_name.lower() == "adam":
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
    elif optimizer_name.lower() == "sgd":
        optimizer = torch.optim.SGD(model.parameters(), lr=lr, momentum=0.9, weight_decay=weight_decay)
    else:
        raise ValueError(f"Unknown optimizer: {optimizer_name}")

    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="max", factor=0.5, patience=5
    )

    n_samples = len(x_train)
    indices = np.arange(n_samples)

    best_val_roc = -1.0
    best_weights = None
    epochs_no_improve = 0
    history = {"train_loss": [], "val_loss": [], "val_roc_auc": []}

    t0 = time.perf_counter()

    for epoch in range(1, max_epochs + 1):
        model.train()
        np.random.shuffle(indices)
        epoch_losses = []

        for start_idx in range(0, n_samples, batch_size):
            end_idx = min(start_idx + batch_size, n_samples)
            batch_idx = indices[start_idx:end_idx]

            xb = xt_train[batch_idx]
            yb = yt_train[batch_idx]

            optimizer.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)

            if l1_lambda > 0.0:
                l1_norm = sum(p.abs().sum() for p in model.parameters() if p.requires_grad)
                loss = loss + l1_lambda * l1_norm

            loss.backward()
            if grad_clip > 0.0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=grad_clip)

            optimizer.step()
            epoch_losses.append(loss.item())

        train_loss = float(np.mean(epoch_losses))

        # Validation phase
        model.eval()
        with torch.no_grad():
            val_logits = model(xt_val)
            val_loss = float(criterion(val_logits, yt_val).item())
            val_probs = torch.sigmoid(val_logits).cpu().numpy()
            val_roc = float(roc_auc_score(y_val, val_probs)) if len(np.unique(y_val)) > 1 else 0.5

        scheduler.step(val_roc)

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_roc_auc"].append(val_roc)

        if val_roc > best_val_roc:
            best_val_roc = val_roc
            best_weights = copy.deepcopy(model.state_dict())
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= patience:
                break

    duration = time.perf_counter() - t0
    if best_weights is not None:
        model.load_state_dict(best_weights)

    diagnostics = {
        "epochs_trained": epoch,
        "stopped_early": epochs_no_improve >= patience,
        "best_val_roc_auc": round(best_val_roc, 4),
        "final_train_loss": round(history["train_loss"][-1], 4),
        "final_val_loss": round(history["val_loss"][-1], 4),
        "training_time_seconds": round(duration, 3),
        "loss_history": history,
    }
    return model, diagnostics


# ─────────────────────────────────────────────────────────────────────────────
# Subgroup Analyses
# ─────────────────────────────────────────────────────────────────────────────

def heart_disease_subgroups(features: pd.DataFrame, target: np.ndarray, probs: np.ndarray, thresh: float) -> Dict[str, Any]:
    groups = {
        "GENDER": {str(val): features["GENDER"] == val for val in sorted(features["GENDER"].unique())},
        "AGE_BAND": {
            "30-44": (features["AGE"] >= 30) & (features["AGE"] <= 44),
            "45-54": (features["AGE"] >= 45) & (features["AGE"] <= 54),
            "55-64": (features["AGE"] >= 55) & (features["AGE"] <= 64),
            "65+": features["AGE"] >= 65,
        },
        "CHOLESTEROL": {f"chol_{val}": features["CHOLESTEROL"] == val for val in sorted(features["CHOLESTEROL"].unique())},
        "GLUCOSE": {f"gluc_{val}": features["GLUCOSE"] == val for val in sorted(features["GLUCOSE"].unique())},
    }
    out = {}
    for dim, dim_dict in groups.items():
        out[dim] = {}
        for group_name, mask in dim_dict.items():
            m_arr = mask.to_numpy()
            sub_target = target[m_arr]
            sub_probs = probs[m_arr]
            if len(sub_target) == 0:
                continue
            m = classification_metrics(sub_target, sub_probs, thresh)
            m["count"] = int(len(sub_target))
            m["prevalence"] = round(float(np.mean(sub_target)), 4)
            ece_res = compute_calibration_ece(sub_target, sub_probs)
            m["ece"] = ece_res["expected_calibration_error"]
            out[dim][group_name] = m
    return out


def diabetes_subgroups(features: pd.DataFrame, target: np.ndarray, probs: np.ndarray, thresh: float) -> Dict[str, Any]:
    groups = {
        "AGE_BAND": {
            "21-30": (features["Age"] >= 21) & (features["Age"] <= 30),
            "31-45": (features["Age"] >= 31) & (features["Age"] <= 45),
            "46-60": (features["Age"] >= 46) & (features["Age"] <= 60),
            "61+": features["Age"] >= 61,
        },
        "BMI_CATEGORY": {
            "normal_underweight": features["BMI"] < 25.0,
            "overweight": (features["BMI"] >= 25.0) & (features["BMI"] < 30.0),
            "obese": features["BMI"] >= 30.0,
        },
    }
    out = {}
    for dim, dim_dict in groups.items():
        out[dim] = {}
        for group_name, mask in dim_dict.items():
            m_arr = mask.to_numpy()
            sub_target = target[m_arr]
            sub_probs = probs[m_arr]
            if len(sub_target) == 0:
                continue
            m = classification_metrics(sub_target, sub_probs, thresh)
            m["count"] = int(len(sub_target))
            m["prevalence"] = round(float(np.mean(sub_target)), 4)
            ece_res = compute_calibration_ece(sub_target, sub_probs)
            m["ece"] = ece_res["expected_calibration_error"]
            out[dim][group_name] = m
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Experiment Configuration Matrix
# ─────────────────────────────────────────────────────────────────────────────

CANDIDATE_CONFIGS = [
    # 1. Baseline 2-layer reference in PyTorch
    {
        "id": "exp_baseline_2layer_relu",
        "description": "Baseline 2-layer [32, 16] ReLU + AdamW",
        "layers": [32, 16],
        "activation": "relu",
        "dropout": 0.0,
        "use_norm": False,
        "optimizer": "adamw",
        "weight_decay": 1e-4,
        "l1_lambda": 0.0,
    },
    # 2. Proposed 6-layer bottleneck with ReLU
    {
        "id": "exp_proposed_6layer_bottleneck_relu",
        "description": "Proposed 6-layer [32, 16, 8, 4, 2, 2] ReLU + AdamW (1e-4)",
        "layers": [32, 16, 8, 4, 2, 2],
        "activation": "relu",
        "dropout": 0.0,
        "use_norm": False,
        "optimizer": "adamw",
        "weight_decay": 1e-4,
        "l1_lambda": 0.0,
    },
    # 3. Proposed 6-layer bottleneck with GELU
    {
        "id": "exp_proposed_6layer_bottleneck_gelu",
        "description": "Proposed 6-layer [32, 16, 8, 4, 2, 2] GELU + AdamW (1e-4)",
        "layers": [32, 16, 8, 4, 2, 2],
        "activation": "gelu",
        "dropout": 0.0,
        "use_norm": False,
        "optimizer": "adamw",
        "weight_decay": 1e-4,
        "l1_lambda": 0.0,
    },
    # 4. Proposed 6-layer bottleneck with SiLU (Swish)
    {
        "id": "exp_proposed_6layer_bottleneck_silu",
        "description": "Proposed 6-layer [32, 16, 8, 4, 2, 2] SiLU + AdamW (1e-4)",
        "layers": [32, 16, 8, 4, 2, 2],
        "activation": "silu",
        "dropout": 0.0,
        "use_norm": False,
        "optimizer": "adamw",
        "weight_decay": 1e-4,
        "l1_lambda": 0.0,
    },
    # 5. Proposed 6-layer bottleneck with LeakyReLU
    {
        "id": "exp_proposed_6layer_bottleneck_leakyrelu",
        "description": "Proposed 6-layer [32, 16, 8, 4, 2, 2] LeakyReLU + AdamW (1e-4)",
        "layers": [32, 16, 8, 4, 2, 2],
        "activation": "leaky_relu",
        "dropout": 0.0,
        "use_norm": False,
        "optimizer": "adamw",
        "weight_decay": 1e-4,
        "l1_lambda": 0.0,
    },
    # 6. Proposed 6-layer bottleneck with GELU + Dropout 0.10 + Higher Weight Decay
    {
        "id": "exp_proposed_6layer_bottleneck_gelu_reg",
        "description": "Proposed 6-layer [32, 16, 8, 4, 2, 2] GELU + Dropout(0.1) + AdamW(1e-2) + L1(1e-5)",
        "layers": [32, 16, 8, 4, 2, 2],
        "activation": "gelu",
        "dropout": 0.10,
        "use_norm": False,
        "optimizer": "adamw",
        "weight_decay": 1e-2,
        "l1_lambda": 1e-5,
    },
    # 7. Justified Wider 6-layer architecture [32, 16, 16, 8, 8, 4] with GELU
    {
        "id": "exp_wider_6layer_gelu",
        "description": "Justified Wider 6-layer [32, 16, 16, 8, 8, 4] GELU + AdamW (1e-4)",
        "layers": [32, 16, 16, 8, 8, 4],
        "activation": "gelu",
        "dropout": 0.10,
        "use_norm": True,
        "optimizer": "adamw",
        "weight_decay": 1e-4,
        "l1_lambda": 0.0,
    },
    # 8. Deep Pyramid 4-layer architecture [64, 32, 16, 8] with GELU
    {
        "id": "exp_deep_pyramid_4layer_gelu",
        "description": "Deep Pyramid 4-layer [64, 32, 16, 8] GELU + LayerNorm + Dropout(0.10) + AdamW (1e-3)",
        "layers": [64, 32, 16, 8],
        "activation": "gelu",
        "dropout": 0.10,
        "use_norm": True,
        "optimizer": "adamw",
        "weight_decay": 1e-3,
        "l1_lambda": 0.0,
    },
    # 9. Deep Pyramid 4-layer architecture with SiLU
    {
        "id": "exp_deep_pyramid_4layer_silu",
        "description": "Deep Pyramid 4-layer [64, 32, 16, 8] SiLU + LayerNorm + Dropout(0.10) + AdamW (1e-3)",
        "layers": [64, 32, 16, 8],
        "activation": "silu",
        "dropout": 0.10,
        "use_norm": True,
        "optimizer": "adamw",
        "weight_decay": 1e-3,
        "l1_lambda": 0.0,
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline Execution Functions
# ─────────────────────────────────────────────────────────────────────────────

def run_heart_disease_experiment(output_dir: Path) -> Dict[str, Any]:
    print("\n" + "="*80)
    print("STARTING HEART DISEASE MLP OPTIMIZATION EXPERIMENT")
    print("="*80)

    dataset_path = AI_SERVICE_ROOT / "test-dataset" / "Heart Disease" / "cardiovascular_diseases_dv3.csv"
    if not dataset_path.exists():
        raise FileNotFoundError(f"Heart disease dataset not found at {dataset_path}")

    # Load and deduplicate
    df = load_cardiovascular_dataset(dataset_path).apply(pd.to_numeric, errors="coerce")
    df = df.dropna(subset=CARDIOVASCULAR_FEATURES + [HEART_TARGET])
    df = df[df[HEART_TARGET].isin([0, 1])]
    df = df.drop_duplicates().reset_index(drop=True)

    features = df[CARDIOVASCULAR_FEATURES]
    target = df[HEART_TARGET].astype("int64")

    # Split: 70/15/15 stratified
    x_tr, x_h, y_tr, y_h = train_test_split(
        features, target, test_size=0.30, stratify=target, random_state=RANDOM_STATE
    )
    x_va, x_te, y_va, y_te = train_test_split(
        x_h, y_h, test_size=0.50, stratify=y_h, random_state=RANDOM_STATE
    )

    print(f"Data split: Train={len(x_tr)}, Val={len(x_va)}, Test={len(x_te)}")
    print(f"Class balance: Train={y_tr.value_counts().to_dict()}, Test={y_te.value_counts().to_dict()}")

    # Fit scaler on train only
    scaler = StandardScaler()
    x_tr_scaled = scaler.fit_transform(x_tr)
    x_va_scaled = scaler.transform(x_va)
    x_te_scaled = scaler.transform(x_te)

    y_tr_arr = y_tr.to_numpy()
    y_va_arr = y_va.to_numpy()
    y_te_arr = y_te.to_numpy()

    exp_dir = output_dir / "heart_disease"
    exp_dir.mkdir(parents=True, exist_ok=True)

    results = []
    trained_models = {}

    for config in CANDIDATE_CONFIGS:
        cid = config["id"]
        print(f"\n--> Training Heart Disease Candidate [{cid}]: {config['description']}")
        seed_everything(RANDOM_STATE)

        model = ModularMLP(
            in_dim=len(CARDIOVASCULAR_FEATURES),
            layer_dims=config["layers"],
            activation=config["activation"],
            dropout_rate=config["dropout"],
            use_norm=config["use_norm"],
        )

        model, diag = train_pytorch_mlp(
            model,
            x_tr_scaled,
            y_tr_arr,
            x_va_scaled,
            y_va_arr,
            optimizer_name=config["optimizer"],
            lr=1e-3,
            weight_decay=config["weight_decay"],
            l1_lambda=config["l1_lambda"],
            max_epochs=150,
            batch_size=512,
            patience=15,
            grad_clip=1.0,
            pos_weight=1.0,  # balanced dataset
        )

        # Inference on validation set
        xt_va = torch.tensor(x_va_scaled, dtype=torch.float32)
        val_probs = model.predict_proba(xt_va).numpy()

        # Tune threshold on validation set (floor >= 0.60 specificity)
        tuned_thresh, val_metrics = tune_threshold_validation(y_va_arr, val_probs, min_specificity=0.60)
        val_default_metrics = classification_metrics(y_va_arr, val_probs, threshold=0.50)

        # Inference on untouched test set
        xt_te = torch.tensor(x_te_scaled, dtype=torch.float32)
        test_probs = model.predict_proba(xt_te).numpy()
        test_metrics_default = classification_metrics(y_te_arr, test_probs, threshold=0.50)
        test_metrics_tuned = classification_metrics(y_te_arr, test_probs, threshold=tuned_thresh)

        # Calibration
        val_ece = compute_calibration_ece(y_va_arr, val_probs)
        test_ece = compute_calibration_ece(y_te_arr, test_probs)

        # Error analysis
        err_analysis = error_analysis(y_te_arr, test_probs, threshold=tuned_thresh)

        # Latency profiling
        latencies = measure_latency_benchmarks(model, xt_te)

        candidate_summary = {
            "candidate_id": cid,
            "description": config["description"],
            "architecture": config["layers"],
            "activation": config["activation"],
            "dropout": config["dropout"],
            "use_norm": config["use_norm"],
            "optimizer": config["optimizer"],
            "weight_decay": config["weight_decay"],
            "l1_lambda": config["l1_lambda"],
            "diagnostics": {
                "epochs_trained": diag["epochs_trained"],
                "stopped_early": diag["stopped_early"],
                "training_time_seconds": diag["training_time_seconds"],
                "final_train_loss": diag["final_train_loss"],
                "final_val_loss": diag["final_val_loss"],
            },
            "validation_metrics_default_0_5": val_default_metrics,
            "validation_metrics_tuned": val_metrics,
            "tuned_threshold": tuned_thresh,
            "test_metrics_default_0_5": test_metrics_default,
            "test_metrics_tuned": test_metrics_tuned,
            "calibration": {
                "validation_ece": val_ece["expected_calibration_error"],
                "test_ece": test_ece["expected_calibration_error"],
                "test_brier_score": test_metrics_tuned["brier_score"],
            },
            "error_analysis": err_analysis,
            "latency_benchmarks": latencies,
        }

        print(f"    Val ROC-AUC: {val_default_metrics['roc_auc']:.4f} | Val Tuned Recall (Thresh={tuned_thresh:.2f}): {val_metrics['recall']:.4f} | Spec: {val_metrics['specificity']:.4f}")
        print(f"    Test ROC-AUC: {test_metrics_default['roc_auc']:.4f} | Test Tuned Recall: {test_metrics_tuned['recall']:.4f} | Spec: {test_metrics_tuned['specificity']:.4f} | F1: {test_metrics_tuned['f1']:.4f} | ECE: {test_ece['expected_calibration_error']:.4f}")

        results.append(candidate_summary)
        trained_models[cid] = (model, config, tuned_thresh, test_probs, diag["loss_history"])

        # Save individual candidate model state
        torch.save(model.state_dict(), exp_dir / f"{cid}.pt")

    # Select best candidate by validation ROC-AUC
    best_candidate_rec = max(results, key=lambda x: (x["validation_metrics_tuned"]["roc_auc"], x["validation_metrics_tuned"]["f1"]))
    best_cid = best_candidate_rec["candidate_id"]
    print(f"\n[Heart Disease] Selected Best Candidate: {best_cid} ({best_candidate_rec['description']})")

    best_model, best_cfg, best_thresh, best_test_probs, best_history = trained_models[best_cid]

    # Save best model and scaler
    torch.save(best_model.state_dict(), exp_dir / "best_model.pt")
    import joblib
    joblib.dump(scaler, exp_dir / "scaler.joblib")

    # Run subgroup analysis on best candidate
    subgroup_res = heart_disease_subgroups(x_te, y_te_arr, best_test_probs, best_thresh)

    final_payload = {
        "pipeline": "heart_disease_risk",
        "dataset_path": str(dataset_path),
        "split": {"train": len(x_tr), "validation": len(x_va), "test": len(x_te)},
        "candidates": results,
        "best_candidate_id": best_cid,
        "best_candidate": best_candidate_rec,
        "best_candidate_subgroups": subgroup_res,
        "best_loss_history": best_history,
    }

    with open(exp_dir / "experiment_report.json", "w") as f:
        json.dump(final_payload, f, indent=2)

    return final_payload


def run_diabetes_experiment(output_dir: Path) -> Dict[str, Any]:
    print("\n" + "="*80)
    print("STARTING DIABETES MLP OPTIMIZATION EXPERIMENT")
    print("="*80)

    dataset_path = AI_SERVICE_ROOT / "test-dataset" / "Diabetes" / "diabetes.csv"
    if not dataset_path.exists():
        raise FileNotFoundError(f"Diabetes dataset not found at {dataset_path}")

    df = load_diabetes_dataset(dataset_path).apply(pd.to_numeric, errors="coerce")
    df = df.dropna(subset=DIABETES_FEATURES + [DIABETES_TARGET])
    df = df[df[DIABETES_TARGET].isin([0, 1])]
    df = df.drop_duplicates().reset_index(drop=True)

    features = df[DIABETES_FEATURES]
    target = df[DIABETES_TARGET].astype("int64")

    # Split: 70/15/15 stratified
    x_tr, x_h, y_tr, y_h = train_test_split(
        features, target, test_size=0.30, stratify=target, random_state=RANDOM_STATE
    )
    x_va, x_te, y_va, y_te = train_test_split(
        x_h, y_h, test_size=0.50, stratify=y_h, random_state=RANDOM_STATE
    )

    print(f"Data split: Train={len(x_tr)}, Val={len(x_va)}, Test={len(x_te)}")
    print(f"Class balance: Train={y_tr.value_counts().to_dict()}, Test={y_te.value_counts().to_dict()}")

    # Biological zero imputation fitted on train only
    train_medians = compute_imputation_medians(x_tr)
    x_tr_imp = apply_biological_zero_imputation(x_tr, train_medians)
    x_va_imp = apply_biological_zero_imputation(x_va, train_medians)
    x_te_imp = apply_biological_zero_imputation(x_te, train_medians)

    # Standard scaling fitted on train only
    scaler = StandardScaler()
    x_tr_scaled = scaler.fit_transform(x_tr_imp)
    x_va_scaled = scaler.transform(x_va_imp)
    x_te_scaled = scaler.transform(x_te_imp)

    y_tr_arr = y_tr.to_numpy()
    y_va_arr = y_va.to_numpy()
    y_te_arr = y_te.to_numpy()

    # Calculate positive weight for class imbalance: count(0) / count(1) in training
    neg_count = float(np.sum(y_tr_arr == 0))
    pos_count = float(np.sum(y_tr_arr == 1))
    pos_weight = neg_count / pos_count if pos_count > 0 else 1.0
    print(f"Class imbalance pos_weight = {pos_weight:.2f}")

    exp_dir = output_dir / "diabetes"
    exp_dir.mkdir(parents=True, exist_ok=True)

    results = []
    trained_models = {}

    for config in CANDIDATE_CONFIGS:
        cid = config["id"]
        print(f"\n--> Training Diabetes Candidate [{cid}]: {config['description']}")
        seed_everything(RANDOM_STATE)

        model = ModularMLP(
            in_dim=len(DIABETES_FEATURES),
            layer_dims=config["layers"],
            activation=config["activation"],
            dropout_rate=config["dropout"],
            use_norm=config["use_norm"],
        )

        model, diag = train_pytorch_mlp(
            model,
            x_tr_scaled,
            y_tr_arr,
            x_va_scaled,
            y_va_arr,
            optimizer_name=config["optimizer"],
            lr=1e-3,
            weight_decay=config["weight_decay"],
            l1_lambda=config["l1_lambda"],
            max_epochs=200,
            batch_size=32,  # small dataset: batch size 32
            patience=25,
            grad_clip=1.0,
            pos_weight=pos_weight,
        )

        # Inference on validation set
        xt_va = torch.tensor(x_va_scaled, dtype=torch.float32)
        val_probs = model.predict_proba(xt_va).numpy()

        # Tune threshold on validation set (floor >= 0.60 specificity)
        tuned_thresh, val_metrics = tune_threshold_validation(y_va_arr, val_probs, min_specificity=0.60)
        val_default_metrics = classification_metrics(y_va_arr, val_probs, threshold=0.50)

        # Inference on untouched test set
        xt_te = torch.tensor(x_te_scaled, dtype=torch.float32)
        test_probs = model.predict_proba(xt_te).numpy()
        test_metrics_default = classification_metrics(y_te_arr, test_probs, threshold=0.50)
        test_metrics_tuned = classification_metrics(y_te_arr, test_probs, threshold=tuned_thresh)

        # Calibration
        val_ece = compute_calibration_ece(y_va_arr, val_probs)
        test_ece = compute_calibration_ece(y_te_arr, test_probs)

        # Error analysis
        err_analysis = error_analysis(y_te_arr, test_probs, threshold=tuned_thresh)

        # Latency profiling
        latencies = measure_latency_benchmarks(model, xt_te)

        candidate_summary = {
            "candidate_id": cid,
            "description": config["description"],
            "architecture": config["layers"],
            "activation": config["activation"],
            "dropout": config["dropout"],
            "use_norm": config["use_norm"],
            "optimizer": config["optimizer"],
            "weight_decay": config["weight_decay"],
            "l1_lambda": config["l1_lambda"],
            "diagnostics": {
                "epochs_trained": diag["epochs_trained"],
                "stopped_early": diag["stopped_early"],
                "training_time_seconds": diag["training_time_seconds"],
                "final_train_loss": diag["final_train_loss"],
                "final_val_loss": diag["final_val_loss"],
            },
            "validation_metrics_default_0_5": val_default_metrics,
            "validation_metrics_tuned": val_metrics,
            "tuned_threshold": tuned_thresh,
            "test_metrics_default_0_5": test_metrics_default,
            "test_metrics_tuned": test_metrics_tuned,
            "calibration": {
                "validation_ece": val_ece["expected_calibration_error"],
                "test_ece": test_ece["expected_calibration_error"],
                "test_brier_score": test_metrics_tuned["brier_score"],
            },
            "error_analysis": err_analysis,
            "latency_benchmarks": latencies,
        }

        print(f"    Val ROC-AUC: {val_default_metrics['roc_auc']:.4f} | Val Tuned Recall (Thresh={tuned_thresh:.2f}): {val_metrics['recall']:.4f} | Spec: {val_metrics['specificity']:.4f}")
        print(f"    Test ROC-AUC: {test_metrics_default['roc_auc']:.4f} | Test Tuned Recall: {test_metrics_tuned['recall']:.4f} | Spec: {test_metrics_tuned['specificity']:.4f} | F1: {test_metrics_tuned['f1']:.4f} | ECE: {test_ece['expected_calibration_error']:.4f}")

        results.append(candidate_summary)
        trained_models[cid] = (model, config, tuned_thresh, test_probs, diag["loss_history"])

        # Save individual candidate model state
        torch.save(model.state_dict(), exp_dir / f"{cid}.pt")

    # Select best candidate by validation ROC-AUC
    best_candidate_rec = max(results, key=lambda x: (x["validation_metrics_tuned"]["roc_auc"], x["validation_metrics_tuned"]["f1"]))
    best_cid = best_candidate_rec["candidate_id"]
    print(f"\n[Diabetes] Selected Best Candidate: {best_cid} ({best_candidate_rec['description']})")

    best_model, best_cfg, best_thresh, best_test_probs, best_history = trained_models[best_cid]

    # Save best model and scaler
    torch.save(best_model.state_dict(), exp_dir / "best_model.pt")
    import joblib
    joblib.dump(scaler, exp_dir / "scaler.joblib")
    joblib.dump(train_medians, exp_dir / "training_medians.joblib")

    # Run subgroup analysis on best candidate
    subgroup_res = diabetes_subgroups(x_te_imp, y_te_arr, best_test_probs, best_thresh)

    final_payload = {
        "pipeline": "diabetes_risk",
        "dataset_path": str(dataset_path),
        "split": {"train": len(x_tr), "validation": len(x_va), "test": len(x_te)},
        "imputation_medians": train_medians,
        "candidates": results,
        "best_candidate_id": best_cid,
        "best_candidate": best_candidate_rec,
        "best_candidate_subgroups": subgroup_res,
        "best_loss_history": best_history,
    }

    with open(exp_dir / "experiment_report.json", "w") as f:
        json.dump(final_payload, f, indent=2)

    return final_payload


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory initialized: {OUTPUT_DIR}")

    heart_results = run_heart_disease_experiment(OUTPUT_DIR)
    diabetes_results = run_diabetes_experiment(OUTPUT_DIR)

    # Save master experiment summary
    master_summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "random_state": RANDOM_STATE,
        "heart_disease": {
            "best_candidate_id": heart_results["best_candidate_id"],
            "best_candidate_desc": heart_results["best_candidate"]["description"],
            "best_test_roc_auc": heart_results["best_candidate"]["test_metrics_default_0_5"]["roc_auc"],
            "best_test_tuned_metrics": heart_results["best_candidate"]["test_metrics_tuned"],
        },
        "diabetes": {
            "best_candidate_id": diabetes_results["best_candidate_id"],
            "best_candidate_desc": diabetes_results["best_candidate"]["description"],
            "best_test_roc_auc": diabetes_results["best_candidate"]["test_metrics_default_0_5"]["roc_auc"],
            "best_test_tuned_metrics": diabetes_results["best_candidate"]["test_metrics_tuned"],
        },
    }
    with open(OUTPUT_DIR / "master_experiment_summary.json", "w") as f:
        json.dump(master_summary, f, indent=2)

    print("\n" + "="*80)
    print("ALL MLP OPTIMIZATION EXPERIMENTS COMPLETED SUCCESSFULLY!")
    print(f"Artifacts and reports saved under: {OUTPUT_DIR}")
    print("="*80)


if __name__ == "__main__":
    main()
