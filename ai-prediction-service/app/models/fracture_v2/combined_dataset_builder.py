"""
Combined FracAtlas + GRAZPEDWRI-DX Dataset Ingestion & Splitting Module
"""

import os
import json
import pandas as pd
import numpy as np
from .dataset_builder import inspect_and_clean_fracatlas
from .graz_dataset_builder import inspect_and_clean_graz


def prepare_combined_dataset(
    fracatlas_dir=r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\FracAtlas\FracAtlas",
    graz_dir=r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\GRAZPEDWRI-DX",
    combined_manifest_dir=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\combined\manifests",
    seed=42,
):
    print("=" * 60)
    print("BUILDING COMBINED DATASET (FracAtlas + GRAZPEDWRI-DX)")
    print("=" * 60)

    # 1. Clean FracAtlas (70/15/15 patient split)
    fa_manifest_dir = os.path.join(combined_manifest_dir, "fracatlas_raw")
    fa_report, fa_train, fa_val, fa_test = inspect_and_clean_fracatlas(
        fracatlas_dir, fa_manifest_dir
    )
    fa_train["dataset"] = "FracAtlas"
    fa_val["dataset"] = "FracAtlas"
    fa_test["dataset"] = "FracAtlas"

    # 2. Clean GRAZPEDWRI-DX (70/15/15 patient split)
    graz_manifest_dir = os.path.join(combined_manifest_dir, "graz_raw")
    graz_report, graz_train, graz_val, graz_test = inspect_and_clean_graz(
        graz_dir, graz_manifest_dir, seed=seed
    )
    graz_train["dataset"] = "GRAZPEDWRI-DX"
    graz_val["dataset"] = "GRAZPEDWRI-DX"
    graz_test["dataset"] = "GRAZPEDWRI-DX"

    # Common standardized columns
    common_cols = [
        "dataset", "image_id", "patient_id", "file_path", "fractured",
        "anatomy", "hardware", "width", "height", "md5_hash"
    ]
    for c in ["gender", "age", "laterality", "projection", "cast"]:
        for df_split in [fa_train, fa_val, fa_test]:
            if c not in df_split.columns:
                df_split[c] = np.nan
        for df_split in [graz_train, graz_val, graz_test]:
            if c not in df_split.columns:
                df_split[c] = np.nan
        common_cols.append(c)

    # 3. Stratified Cohort Merging (Preserving exact patient splits per dataset)
    df_train = pd.concat([fa_train[common_cols], graz_train[common_cols]], ignore_index=True)
    df_val = pd.concat([fa_val[common_cols], graz_val[common_cols]], ignore_index=True)
    df_test = pd.concat([fa_test[common_cols], graz_test[common_cols]], ignore_index=True)

    # Shuffle training set so mini-batches naturally mix adult and pediatric radiographs
    df_train = df_train.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    df_val = df_val.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    df_test = df_test.sample(frac=1.0, random_state=seed).reset_index(drop=True)

    df_train["split"] = "train"
    df_val["split"] = "validation"
    df_test["split"] = "test"

    # Patient leakage check
    train_patients = set(df_train["patient_id"])
    val_patients = set(df_val["patient_id"])
    test_patients = set(df_test["patient_id"])

    overlap_train_val = len(train_patients & val_patients)
    overlap_train_test = len(train_patients & test_patients)
    overlap_val_test = len(val_patients & test_patients)

    print(f"\n--- Combined Patient Split Summary ---")
    print(f"Train: {len(df_train)} images, {len(train_patients)} patients (Fractured: {df_train['fractured'].sum()} / {len(df_train)} = {df_train['fractured'].mean()*100:.2f}%)")
    print(f"  -> FracAtlas Train: {(df_train['dataset'] == 'FracAtlas').sum()}, GRAZ Train: {(df_train['dataset'] == 'GRAZPEDWRI-DX').sum()}")
    print(f"Val: {len(df_val)} images, {len(val_patients)} patients (Fractured: {df_val['fractured'].sum()} / {len(df_val)} = {df_val['fractured'].mean()*100:.2f}%)")
    print(f"  -> FracAtlas Val: {(df_val['dataset'] == 'FracAtlas').sum()}, GRAZ Val: {(df_val['dataset'] == 'GRAZPEDWRI-DX').sum()}")
    print(f"Test: {len(df_test)} images, {len(test_patients)} patients (Fractured: {df_test['fractured'].sum()} / {len(df_test)} = {df_test['fractured'].mean()*100:.2f}%)")
    print(f"  -> FracAtlas Test: {(df_test['dataset'] == 'FracAtlas').sum()}, GRAZ Test: {(df_test['dataset'] == 'GRAZPEDWRI-DX').sum()}")
    print(f"Patient Overlap -> Train/Val: {overlap_train_val}, Train/Test: {overlap_train_test}, Val/Test: {overlap_val_test}")

    if overlap_train_val > 0 or overlap_train_test > 0 or overlap_val_test > 0:
        raise ValueError("CRITICAL ERROR: Patient leakage detected in combined dataset split!")

    os.makedirs(combined_manifest_dir, exist_ok=True)
    df_train.to_csv(os.path.join(combined_manifest_dir, "train.csv"), index=False)
    df_val.to_csv(os.path.join(combined_manifest_dir, "validation.csv"), index=False)
    df_test.to_csv(os.path.join(combined_manifest_dir, "test.csv"), index=False)
    df_combined_all = pd.concat([df_train, df_val, df_test], ignore_index=True)
    df_combined_all.to_csv(os.path.join(combined_manifest_dir, "all_splits.csv"), index=False)

    report = {
        "dataset_name": "Combined (FracAtlas + GRAZPEDWRI-DX)",
        "fracatlas_images": len(fa_train) + len(fa_val) + len(fa_test),
        "graz_images": len(graz_train) + len(graz_val) + len(graz_test),
        "total_images": len(df_combined_all),
        "total_unique_patients": int(df_combined_all["patient_id"].nunique()),
        "class_distribution": {
            "fractured_count": int(df_combined_all["fractured"].sum()),
            "non_fractured_count": int((df_combined_all["fractured"] == 0).sum()),
            "fracture_percentage": float(df_combined_all["fractured"].mean() * 100),
        },
        "splits": {
            "train": {
                "total_images": len(df_train),
                "unique_patients": len(train_patients),
                "fractured": int(df_train["fractured"].sum()),
                "non_fractured": int((df_train["fractured"] == 0).sum()),
                "fracture_percentage": float(df_train["fractured"].mean() * 100),
                "fracatlas_count": int((df_train["dataset"] == "FracAtlas").sum()),
                "graz_count": int((df_train["dataset"] == "GRAZPEDWRI-DX").sum()),
            },
            "validation": {
                "total_images": len(df_val),
                "unique_patients": len(val_patients),
                "fractured": int(df_val["fractured"].sum()),
                "non_fractured": int((df_val["fractured"] == 0).sum()),
                "fracture_percentage": float(df_val["fractured"].mean() * 100),
                "fracatlas_count": int((df_val["dataset"] == "FracAtlas").sum()),
                "graz_count": int((df_val["dataset"] == "GRAZPEDWRI-DX").sum()),
            },
            "test": {
                "total_images": len(df_test),
                "unique_patients": len(test_patients),
                "fractured": int(df_test["fractured"].sum()),
                "non_fractured": int((df_test["fractured"] == 0).sum()),
                "fracture_percentage": float(df_test["fractured"].mean() * 100),
                "fracatlas_count": int((df_test["dataset"] == "FracAtlas").sum()),
                "graz_count": int((df_test["dataset"] == "GRAZPEDWRI-DX").sum()),
            },
        },
        "patient_leakage_check": {
            "train_val_overlap": overlap_train_val,
            "train_test_overlap": overlap_train_test,
            "val_test_overlap": overlap_val_test,
            "leakage_detected": False,
        }
    }

    with open(os.path.join(combined_manifest_dir, "dataset_report.json"), "w") as f:
        json.dump(report, f, indent=2)

    return report, df_train, df_val, df_test
