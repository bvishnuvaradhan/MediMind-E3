"""Generate publication-quality figures for the Multi-Phenotype Diabetes Research Framework.

Outputs:
1. multiphenotype_performance_overview.png
2. track1_type1_vs_type2_benchmark.png
3. track3_gdm_temporal_leakage_ablation.png
4. track4_prediabetes_progression_analysis.png
5. track5_mody_phenotype_discrimination.png
"""

import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

# Set publication style
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 11,
    "axes.titlesize": 12,
    "xtick.labelsize": 9,
    "ytick.labelsize": 9,
    "legend.fontsize": 9,
    "figure.titlesize": 13,
})

FIG_DIR = Path(__file__).resolve().parents[1] / "research" / "diabetes" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

REPORT_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "diabetes_research" / "MASTER_EXPERIMENT_REPORT.json"


def generate_all_plots():
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        rep = json.load(f)

    # ─────────────────────────────────────────────────────────────────────────
    # FIGURE 1: MULTI-PHENOTYPE PERFORMANCE OVERVIEW
    # ─────────────────────────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    phenotypes = [
        "Track 1: T1D vs T2D\n(UCI Hospitals)",
        "Track 2: T2D Held-Out\n(Multi-Cohort)",
        "Track 2: T2D NHANES\n(External Lab)",
        "Track 3: GDM Early\n(Obstetric Cohort)",
        "Track 4: Prediabetes\n(Rapid Progression)",
        "Track 5: MODY Subtypes\n(GCK vs HNF1A)",
    ]
    aucs = [0.7753, 0.8194, 0.7483, 0.8927, 0.7699, 0.7430]
    colors = ["#1f77b4", "#2ca02c", "#2ca02c", "#e377c2", "#ff7f0e", "#9467bd"]

    bars = ax.bar(phenotypes, aucs, color=colors, width=0.55, edgecolor="black", linewidth=0.8, alpha=0.85)
    ax.axhline(0.50, color="gray", linestyle="--", linewidth=1.0, label="Random Guess (0.50)")
    ax.axhline(0.80, color="darkgreen", linestyle=":", linewidth=1.0, label="Clinical Utility Threshold (0.80)")

    for bar, val in zip(bars, aucs):
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, yval + 0.015, f"{val:.4f}", ha="center", va="bottom", fontweight="bold", fontsize=9)

    ax.set_ylim(0.40, 1.0)
    ax.set_ylabel("Receiver Operating Characteristic AUC (ROC-AUC)")
    ax.set_title("Discrimination Performance Across MediMind Specialized Diabetes Phenotype Models", fontweight="bold")
    ax.legend(loc="lower right", frameon=True)
    plt.tight_layout()
    fig_path = FIG_DIR / "multiphenotype_performance_overview.png"
    plt.savefig(fig_path)
    plt.close()
    print("Saved:", fig_path)

    # ─────────────────────────────────────────────────────────────────────────
    # FIGURE 2: TRACK 1 - T1D VS T2D ARCHITECTURAL BENCHMARK & CALIBRATION
    # ─────────────────────────────────────────────────────────────────────────
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)
    t1_bench = rep["tracks"]["track_1_type1_vs_type2"]["results"]["benchmark"]
    models = list(t1_bench.keys())
    m_labels = ["Logistic Reg.", "Random Forest", "HistGradBoost", "Calibrated Ens."]
    rocs = [t1_bench[m]["roc_auc"] for m in models]
    pr_aucs = [t1_bench[m]["pr_auc"] for m in models]
    eces = [t1_bench[m]["ece"] for m in models]

    x = np.arange(len(m_labels))
    width = 0.35

    ax1.bar(x - width / 2, rocs, width, label="ROC-AUC", color="#3b528b", edgecolor="black")
    ax1.bar(x + width / 2, pr_aucs, width, label="PR-AUC", color="#5dc863", edgecolor="black")
    ax1.set_xticks(x)
    ax1.set_xticklabels(m_labels, rotation=15)
    ax1.set_ylim(0.5, 0.9)
    ax1.set_ylabel("Discrimination Metric")
    ax1.set_title("(A) T1D vs T2D Discrimination (N=12,624)", fontweight="bold")
    ax1.legend(loc="lower right")

    ax2.bar(m_labels, eces, color="#fde725", edgecolor="black", width=0.5)
    ax2.axhline(0.05, color="red", linestyle="--", linewidth=1.2, label="Clinical Reliability Target (ECE <= 0.05)")
    ax2.set_ylabel("Expected Calibration Error (ECE)")
    ax2.set_title("(B) T1D vs T2D Probability Calibration", fontweight="bold")
    ax2.set_xticklabels(m_labels, rotation=15)
    ax2.legend(loc="upper right")

    plt.tight_layout()
    fig_path = FIG_DIR / "track1_type1_vs_type2_benchmark.png"
    plt.savefig(fig_path)
    plt.close()
    print("Saved:", fig_path)

    # ─────────────────────────────────────────────────────────────────────────
    # FIGURE 3: TRACK 3 - GDM EARLY SCREENING & TEMPORAL LEAKAGE ABLATION
    # ─────────────────────────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    leak_data = rep["tracks"]["track_3_gestational_diabetes"]["results"]["temporal_leakage_ablation"]
    labels = ["Model 3A: Pre-Diagnostic Early Screening\n(Excluding 24-28 Wk Diagnostic OGTT)", "Model 3B: Post-Hoc Diagnostic Inclusion\n(Synthetic Temporal Leakage with OGTT)"]
    vals = [leak_data["model_3a_early_screening_roc_auc"], leak_data["model_3b_with_diagnostic_ogtt_roc_auc"]]
    bar_colors = ["#2b83ba", "#d7191c"]

    bars = ax.bar(labels, vals, color=bar_colors, width=0.45, edgecolor="black", linewidth=1.0)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2.0, v + 0.01, f"ROC-AUC: {v:.4f}", ha="center", va="bottom", fontweight="bold")

    ax.set_ylim(0.70, 1.0)
    ax.set_ylabel("Test ROC-AUC")
    ax.set_title("Gestational Diabetes Mellitus: Early Screening vs Diagnostic Temporal Leakage", fontweight="bold")
    plt.tight_layout()
    fig_path = FIG_DIR / "track3_gdm_temporal_leakage_ablation.png"
    plt.savefig(fig_path)
    plt.close()
    print("Saved:", fig_path)

    # ─────────────────────────────────────────────────────────────────────────
    # FIGURE 4: TRACK 4 - PREDIABETES PROGRESSION ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)
    t4_data = rep["tracks"]["track_4_prediabetes_progression"]["results"]
    features_t4 = [x["feature"] for x in t4_data["track_4a_longitudinal_progression"]["time_to_event_regression"]["feature_importances"]]
    importances_t4 = [x["importance"] for x in t4_data["track_4a_longitudinal_progression"]["time_to_event_regression"]["feature_importances"]]

    ax1.barh(features_t4[::-1], importances_t4[::-1], color="#fe9929", edgecolor="black")
    ax1.set_xlabel("Feature Importance (Gradient Boosting)")
    ax1.set_title("(A) Predictors of Time to Diabetes Progression", fontweight="bold")

    categories = ["Rapid Progressors\n(<= 1.5 Years)", "Cross-Sectional\nADA Lab Screening"]
    auc_prog = [t4_data["track_4a_longitudinal_progression"]["speed_classification"]["test_roc_auc"], t4_data["track_4b_cross_sectional_screening"]["benchmark"]["test_roc_auc"]]
    ax2.bar(categories, auc_prog, color=["#cc4c02", "#662506"], width=0.45, edgecolor="black")
    for idx, v in enumerate(auc_prog):
        ax2.text(idx, v + 0.02, f"ROC: {v:.4f}", ha="center", va="bottom", fontweight="bold")
    ax2.set_ylim(0.4, 0.9)
    ax2.set_ylabel("ROC-AUC")
    ax2.set_title("(B) Prediabetes Risk & Progression Discrimination", fontweight="bold")

    plt.tight_layout()
    fig_path = FIG_DIR / "track4_prediabetes_progression_analysis.png"
    plt.savefig(fig_path)
    plt.close()
    print("Saved:", fig_path)

    # ─────────────────────────────────────────────────────────────────────────
    # FIGURE 5: TRACK 5 - MONOGENIC MODY PHENOTYPE DISCRIMINATION
    # ─────────────────────────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    t5_bench = rep["tracks"]["track_5_mody_monogenic"]["results"]["gck_vs_hnf1a_discrimination"]
    mody_models = ["Logistic Regression", "Random Forest", "HistGradientBoosting"]
    mody_keys = ["logistic_regression", "random_forest", "hist_gradient_boosting"]
    cv_means = [t5_bench[k]["cv_roc_auc_mean"] for k in mody_keys]
    cv_stds = [t5_bench[k]["cv_roc_auc_std"] for k in mody_keys]

    ax.bar(mody_models, cv_means, yerr=cv_stds, capsize=5, color="#756bb1", edgecolor="black", width=0.45, alpha=0.85)
    for idx, (m, s) in enumerate(zip(cv_means, cv_stds)):
        ax.text(idx, m + s + 0.02, f"{m:.4f} ± {s:.4f}", ha="center", va="bottom", fontweight="bold")

    ax.set_ylim(0.5, 0.9)
    ax.set_ylabel("5-Fold Cross-Validated ROC-AUC")
    ax.set_title("Monogenic Diabetes: GCK-MODY vs HNF1A-MODY Phenotype Discrimination", fontweight="bold")
    plt.tight_layout()
    fig_path = FIG_DIR / "track5_mody_phenotype_discrimination.png"
    plt.savefig(fig_path)
    plt.close()
    print("Saved:", fig_path)


if __name__ == "__main__":
    generate_all_plots()
    print("All multi-phenotype publication figures successfully generated!")
