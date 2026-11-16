import json
from pathlib import Path

report_path = Path(__file__).resolve().parents[1] / "artifacts" / "diabetes_research" / "MASTER_EXPERIMENT_REPORT.json"
with open(report_path) as f:
    r = json.load(f)

print("================================================================================")
print("MEDIMIND MULTI-PHENOTYPE DIABETES RESEARCH RESULTS SUMMARY")
print("================================================================================")

# Track 1
t1 = r['tracks']['track_1_type1_vs_type2']['results']
print(f"\n[TRACK 1: Type-1 vs Type-2 Clinical Differentiation] (Cohort: {t1['cohort']})")
print(f"Total encounters: {t1['cohort_breakdown']['total']} ({t1['cohort_breakdown']['type1']} T1D vs {t1['cohort_breakdown']['type2']} T2D)")
print("Model Benchmark on Patient-Quarantined Test Set:")
for m, v in t1['benchmark'].items():
    print(f"  {m:25s} | ROC: {v['roc_auc']:.4f} | PR: {v['pr_auc']:.4f} | Sens: {v['sensitivity']:.4f} | Spec: {v['specificity']:.4f} | ECE: {v['ece']:.4f}")

# Track 2
t2 = r['tracks']['track_2_type2_generalization']['results']
print(f"\n[TRACK 2: Type-2 Diabetes Multi-Cohort Generalization] ({t2['cohorts_evaluated']} Cohorts)")
t2_ens = t2['calibrated_ensemble_benchmark']['test']
print(f"  Pima Test Calibrated Ensemble   | ROC: {t2_ens['roc_auc']:.4f} | PR: {t2_ens['pr_auc']:.4f} | ECE: {t2_ens['expected_calibration_error']:.4f} | Brier: {t2_ens['brier_score']:.4f}")
t2_joint = t2['harmonized_joint_heldout_evaluation']
print(f"  Joint Held-Out Evaluation       | ROC: {t2_joint['joint_heldout_evaluation']['roc_auc']:.4f} | Sens: {t2_joint['joint_heldout_evaluation']['sensitivity']:.4f} | Spec: {t2_joint['joint_heldout_evaluation']['specificity']:.4f}")
print(f"  Held-Out Pure Pima (Leak-Free)  | ROC: {t2_joint['joint_model_on_pure_pima']['roc_auc']:.4f} (vs Baseline: {t2_joint['pima_only_baseline_on_pure_pima']['roc_auc']:.4f})")
print(f"  NHANES External Lab Validation  | ROC: {t2['nhanes_laboratory_external_validation']['roc_auc']:.4f}")

# Track 3
t3 = r['tracks']['track_3_gestational_diabetes']['results']
print(f"\n[TRACK 3: Gestational Diabetes Mellitus (GDM) Risk & Early Screening]")
print(f"Cohort: {t3['cohort']} ({t3['cohort_breakdown']['gdm_cases']} GDM vs {t3['cohort_breakdown']['non_gdm_controls']} Controls)")
print("Early-Pregnancy Screening Benchmark (Leak-Free, No OGTT):")
for m, v in t3['early_screening_benchmark'].items():
    print(f"  {m:25s} | ROC: {v['roc_auc']:.4f} | PR: {v['pr_auc']:.4f} | Sens: {v['sensitivity']:.4f} | Spec: {v['specificity']:.4f} | ECE: {v['ece']:.4f}")
t3_leak = t3['temporal_leakage_ablation']
print("Temporal Leakage Ablation:")
print(f"  Early-Pregnancy Screening ROC-AUC (Leak-Free): {t3_leak['model_3a_early_screening_roc_auc']:.4f}")
print(f"  With Diagnostic OGTT Glucose ROC-AUC:         {t3_leak['model_3b_with_diagnostic_ogtt_roc_auc']:.4f}")
print(f"  Synthetic Metric Inflation:                   +{t3_leak['metric_inflation_roc_auc']:.4f}")

# Track 4
t4 = r['tracks']['track_4_prediabetes_progression']['results']
print(f"\n[TRACK 4: Prediabetes Stratification & Progression]")
t4_long = t4['track_4a_longitudinal_progression']
print(f"Longitudinal Cohort: {t4_long['cohort']}")
prog_sp = t4_long['speed_classification']
print(f"  Rapid Progression (<= 1.5 yrs) | ROC: {prog_sp['test_roc_auc']:.4f} | PR: {prog_sp['test_pr_auc']:.4f} | F1: {prog_sp['f1']:.4f} | ECE: {prog_sp['ece']:.4f}")
prog_tm = t4_long['time_to_event_regression']
print(f"  Continuous Years to Progression | R2: {prog_tm['r2_score']:.4f} | MAE: {prog_tm['mae_years']:.4f} years | RMSE: {prog_tm['rmse_years']:.4f} years")
t4_cs = t4['track_4b_cross_sectional_screening']['benchmark']
print(f"Cross-Sectional NHANES ADA Lab Screening:")
print(f"  Non-Glycemic Prediabetes Screening | ROC: {t4_cs['test_roc_auc']:.4f} | PR: {t4_cs['test_pr_auc']:.4f} | Sens: {t4_cs['sensitivity']:.4f} | Spec: {t4_cs['specificity']:.4f}")

# Track 5
t5 = r['tracks']['track_5_mody_monogenic']['results']
print(f"\n[TRACK 5: Monogenic Diabetes (MODY) Phenotype Discrimination]")
print(f"Cohort: {t5['cohort']}")
print("GCK-MODY (MODY2) vs HNF1A-MODY (MODY3) 5-Fold Cross Validation:")
for m, v in t5['gck_vs_hnf1a_discrimination'].items():
    print(f"  {m:25s} | CV ROC-AUC: {v['cv_roc_auc_mean']:.4f} +/- {v['cv_roc_auc_std']:.4f} | F1: {v['cv_f1_mean']:.4f}")
print("Feasibility Audit for Rare Variants:")
print(f"  {t5['feasibility_and_rarity_audit']['scientific_verdict']}")

# Track 6
t6 = r['tracks']['track_6_secondary_diabetes']['results']
print(f"\n[TRACK 6: Secondary & Specific Diabetes Subtypes]")
print(f"Status: {r['tracks']['track_6_secondary_diabetes']['status']}")
print(f"Scientific Conclusion: {t6['scientific_conclusion']}")
