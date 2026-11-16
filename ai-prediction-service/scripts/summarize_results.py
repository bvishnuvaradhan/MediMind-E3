import json
from pathlib import Path

report_path = Path(__file__).resolve().parents[1] / "artifacts" / "diabetes_research" / "master_research_report.json"
with open(report_path) as f:
    r = json.load(f)

print("=== EXP 1: Baseline Seed Summary ===")
for k, v in r['experiment_1_baseline_reproduction']['summary'].items():
    print(f"  {k}: {v:.4f}")

print("\n=== EXP 2: Architecture Benchmark (Test) ===")
for m, res in r['experiment_2_architectural_benchmark'].items():
    t = res['test']
    print(f"  {m:25s} | ROC: {t['roc_auc']:.4f} | PR: {t['pr_auc']:.4f} | F1: {t['f1']:.4f} | ECE: {t['expected_calibration_error']:.4f} | Brier: {t['brier_score']:.4f}")

print("\n=== EXP 3: Imputation & Missingness Sensitivity ===")
for cfg, t in r['experiment_3_imputation_ablation'].items():
    print(f"  {cfg:25s} | ROC: {t['roc_auc']:.4f} | F1: {t['f1']:.4f} | ECE: {t['expected_calibration_error']:.4f}")

print("\n=== EXP 4: Calibration Comparison ===")
for m, t in r['experiment_4_calibration_comparison'].items():
    print(f"  {m:25s} | ECE: {t['expected_calibration_error']:.4f} | Brier: {t['brier_score']:.4f} | Slope: {t['calibration_slope']:.4f} | Intercept: {t['calibration_intercept']:.4f}")

print("\n=== EXP 5: Cross-Cohort Generalization ===")
for name, t in r['experiment_5_cross_cohort_transfer'].items():
    print(f"  {name:40s} | ROC: {t['roc_auc']:.4f} | PR: {t['pr_auc']:.4f} | Sens: {t['sensitivity']:.4f} | Spec: {t['specificity']:.4f}")

print("\n=== EXP 6: Harmonized Joint Learning ===")
for name, t in r['experiment_6_harmonized_joint_learning'].items():
    if isinstance(t, dict) and 'roc_auc' in t:
        print(f"  {name:30s} | ROC: {t['roc_auc']:.4f} | Sens: {t['sensitivity']:.4f} | Spec: {t['specificity']:.4f}")
    elif isinstance(t, str):
        print(f"  {name:30s} | {t}")

print("\n=== EXP 7: NHANES Transfer ===")
t7 = r['experiment_7_nhanes_transfer']
print(f"  ROC: {t7['roc_auc']:.4f} | Sens: {t7['sensitivity']:.4f} | Spec: {t7['specificity']:.4f} | BalAcc: {t7['balanced_accuracy']:.4f}")

print("\n=== EXP 10: Frankfurt Hospital Adversarial Audit ===")
print("  Total rows:", r['experiment_10_adversarial_frankfurt_audit']['total_rows_frankfurt'])
print("  Duplicates with Pima:", r['experiment_10_adversarial_frankfurt_audit']['duplicate_rows_count'])
print("  Duplication rate:", r['experiment_10_adversarial_frankfurt_audit']['duplication_rate_pct'], "%")
print("  Reported ROC-AUC:", r['experiment_10_adversarial_frankfurt_audit']['metrics_on_frankfurt']['roc_auc'])

print("\n=== Top Feature Permutation Importance ===")
for item in r['global_permutation_importance']['ranked_features'][:5]:
    print(f"  {item['feature']:25s} | Mean: {item['mean_importance']:.5f} | 95% CI: [{item['ci_lower']:.5f}, {item['ci_upper']:.5f}]")
