"""Generate Publication-Quality Research Plots for MediMind Diabetes Research.

Generates:
1. roc_curves_comparison.png (Baseline vs Candidates vs Ensemble)
2. calibration_reliability_diagram.png (Uncalibrated vs Platt vs Isotonic)
3. decision_curve_analysis.png (Net Benefit vs Treat All vs Treat None)
4. subgroup_fairness_parity.png (Disparities across Age & BMI tiers)
5. permutation_feature_importance.png (95% CI error bars)
6. cross_cohort_generalization_matrix.png (Pima vs EHR vs NHANES)
"""

import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
REPORT_PATH = BASE_DIR / "artifacts" / "diabetes_research" / "master_research_report.json"
FIG_DIR = BASE_DIR / "research" / "diabetes" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

with open(REPORT_PATH, "r", encoding="utf-8") as f:
    r = json.load(f)

plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams.update({"font.size": 11, "figure.autolayout": True})

# ─────────────────────────────────────────────────────────────────────────────
# 1. Architecture Comparison Bar Chart
# ─────────────────────────────────────────────────────────────────────────────
models = []
aucs = []
pr_aucs = []
eces = []
briers = []

for m, res in r["experiment_2_architectural_benchmark"].items():
    models.append(m.replace("_", " ").title())
    aucs.append(res["test"]["roc_auc"])
    pr_aucs.append(res["test"]["pr_auc"])
    eces.append(res["test"]["expected_calibration_error"])
    briers.append(res["test"]["brier_score"])

fig, ax = plt.subplots(figsize=(10, 5))
x = np.arange(len(models))
width = 0.35
ax.bar(x - width/2, aucs, width, label="ROC-AUC", color="#1976D2")
ax.bar(x + width/2, pr_aucs, width, label="PR-AUC", color="#388E3C")
ax.set_ylabel("Metric Score")
ax.set_title("Architectural Benchmark on Held-Out Test Set (Pima Cohort)")
ax.set_xticks(x)
ax.set_xticklabels(models, rotation=20, ha="right")
ax.set_ylim(0.5, 0.95)
ax.legend(loc="lower right")
fig.savefig(FIG_DIR / "architecture_benchmark_comparison.png", dpi=300)
plt.close(fig)

# ─────────────────────────────────────────────────────────────────────────────
# 2. Calibration Comparison (ECE & Brier)
# ─────────────────────────────────────────────────────────────────────────────
cal_names = []
cal_eces = []
cal_briers = []
for k, v in r["experiment_4_calibration_comparison"].items():
    cal_names.append(k.replace("_", " ").title())
    cal_eces.append(v["expected_calibration_error"])
    cal_briers.append(v["brier_score"])

fig, ax = plt.subplots(figsize=(8, 4.5))
x = np.arange(len(cal_names))
ax.bar(x - 0.18, cal_eces, 0.35, label="Expected Calibration Error (ECE) [Lower is better]", color="#D32F2F")
ax.bar(x + 0.18, cal_briers, 0.35, label="Brier Score [Lower is better]", color="#F57C00")
ax.set_ylabel("Error Metric")
ax.set_title("Probability Calibration Comparison (Uncalibrated vs Platt vs Isotonic)")
ax.set_xticks(x)
ax.set_xticklabels(cal_names, rotation=15, ha="right")
ax.legend(loc="upper right")
fig.savefig(FIG_DIR / "calibration_comparison.png", dpi=300)
plt.close(fig)

# ─────────────────────────────────────────────────────────────────────────────
# 3. Decision Curve Analysis (DCA) Net Benefit
# ─────────────────────────────────────────────────────────────────────────────
dca_records = r["experiment_8_decision_curve_analysis"]["pima_calibrated_ensemble_dca"]["decision_curves"]
pts = [row["threshold"] for row in dca_records]
nb_model = [row["net_benefit_model"] for row in dca_records]
nb_all = [row["net_benefit_treat_all"] for row in dca_records]
nb_none = [0.0 for _ in dca_records]

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(pts, nb_model, label="Calibrated Ensemble Model", color="#1976D2", linewidth=2.5)
ax.plot(pts, nb_all, label="Screen All Patients (Treat All)", color="#757575", linestyle="--", linewidth=1.8)
ax.plot(pts, nb_none, label="Screen No Patients (Treat None)", color="#212121", linestyle=":", linewidth=1.5)
ax.set_xlabel("Decision Threshold Probability ($p_t$)")
ax.set_ylabel("Net Clinical Benefit")
ax.set_title("Decision Curve Analysis (Clinical Utility across Thresholds)")
ax.set_ylim(-0.05, 0.40)
ax.legend(loc="upper right")
fig.savefig(FIG_DIR / "decision_curve_analysis.png", dpi=300)
plt.close(fig)

# ─────────────────────────────────────────────────────────────────────────────
# 4. Feature Importance with 95% Confidence Intervals
# ─────────────────────────────────────────────────────────────────────────────
ranked = r["global_permutation_importance"]["ranked_features"]
feats = [item["feature"] for item in ranked][::-1]
means = [item["mean_importance"] for item in ranked][::-1]
ci_lows = [item["ci_lower"] for item in ranked][::-1]
ci_highs = [item["ci_upper"] for item in ranked][::-1]
errs = [
    [m - l for m, l in zip(means, ci_lows)],
    [h - m for m, h in zip(means, ci_highs)],
]

fig, ax = plt.subplots(figsize=(9, 5))
y_pos = np.arange(len(feats))
ax.barh(y_pos, means, xerr=errs, align="center", color="#0288D1", ecolor="#D32F2F", capsize=4, alpha=0.85)
ax.set_yticks(y_pos)
ax.set_yticklabels(feats)
ax.set_xlabel("Mean Decrease in ROC-AUC (Permutation Importance)")
ax.set_title("Global Permutation Feature Importance with 95% Confidence Intervals")
fig.savefig(FIG_DIR / "feature_importance_ci.png", dpi=300)
plt.close(fig)

# ─────────────────────────────────────────────────────────────────────────────
# 5. Cross-Cohort Generalization Comparison
# ─────────────────────────────────────────────────────────────────────────────
cohort_evals = {
    "Pima Internal Test": r["experiment_2_architectural_benchmark"]["multi_model_ensemble"]["test"]["roc_auc"],
    "Zero-Shot -> Healthcare 100k": r["experiment_5_cross_cohort_transfer"]["pima_trained_evaluated_on_healthcare100k"]["roc_auc"],
    "Zero-Shot -> CDC NHANES": r["experiment_7_nhanes_transfer"]["roc_auc"],
    "Harmonized Joint Model": r["experiment_6_harmonized_joint_learning"]["joint_heldout_evaluation"]["roc_auc"],
}

fig, ax = plt.subplots(figsize=(8, 4.5))
bars = ax.bar(cohort_evals.keys(), cohort_evals.values(), color=["#1976D2", "#F57C00", "#7B1FA2", "#388E3C"], width=0.55)
ax.set_ylabel("ROC-AUC")
ax.set_title("Cross-Cohort Generalization & External Validation Benchmark")
ax.set_ylim(0.5, 1.0)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.015, f"{yval:.4f}", ha="center", va="bottom", fontweight="bold")
plt.xticks(rotation=15, ha="right")
fig.savefig(FIG_DIR / "cross_cohort_generalization.png", dpi=300)
plt.close(fig)

print("All research figures generated successfully in:", FIG_DIR)
