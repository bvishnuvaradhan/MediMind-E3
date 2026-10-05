"""
GRAZPEDWRI-DX Dataset Ingestion, Cleaning & Patient-Level Splitting Module
"""

import os
import hashlib
import json
import pandas as pd
import numpy as np
from PIL import Image, ImageFile
from sklearn.model_selection import GroupShuffleSplit

ImageFile.LOAD_TRUNCATED_IMAGES = True


def get_image_md5(filepath):
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def inspect_and_clean_graz(
    graz_root=r"D:\projects\MediMind\ai-prediction-service\test-dataset\Bone Facture\GRAZPEDWRI-DX",
    manifest_dir=r"D:\projects\MediMind\ai-prediction-service\artifacts\fracture_v2\graz_only\manifests",
    seed=42,
):
    print("=" * 60)
    print("INSPECTING & CLEANING GRAZPEDWRI-DX DATASET")
    print("=" * 60)

    csv_path = os.path.join(graz_root, "dataset.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"GRAZPEDWRI-DX dataset.csv not found at {csv_path}")

    meta_df = pd.read_csv(csv_path)
    print(f"Loaded raw metadata rows: {len(meta_df)}")

    # Scan for actual image files in graz_root and subdirectories
    image_extensions = {".png", ".jpg", ".jpeg"}
    image_files_map = {}
    
    for root, _, files in os.walk(graz_root):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in image_extensions:
                stem = os.path.splitext(f)[0]
                image_files_map[stem] = os.path.join(root, f)

    print(f"Found on-disk images: {len(image_files_map)}")

    valid_records = []
    seen_hashes = {}
    duplicate_count = 0
    corrupted_count = 0
    missing_count = 0

    for _, row in meta_df.iterrows():
        filestem = str(row["filestem"])
        if filestem not in image_files_map:
            missing_count += 1
            continue

        img_path = image_files_map[filestem]

        # Verify image integrity and dimensions
        try:
            with Image.open(img_path) as img:
                img.verify()
            with Image.open(img_path) as img:
                width, height = img.size
                mode = img.mode
        except Exception as e:
            corrupted_count += 1
            continue

        # Check duplicate content hash
        file_hash = get_image_md5(img_path)
        if file_hash in seen_hashes:
            duplicate_count += 1
            continue
        seen_hashes[file_hash] = img_path

        # Parse fracture label (1.0 = fractured, NaN/0 = non-fractured)
        raw_frac = row.get("fracture_visible", 0)
        is_fractured = 1 if (pd.notna(raw_frac) and float(raw_frac) == 1.0) else 0

        # Hardware indicator
        raw_metal = row.get("metal", 0)
        has_metal = 1 if (pd.notna(raw_metal) and float(raw_metal) == 1.0) else 0

        # Cast indicator
        raw_cast = row.get("cast", 0)
        has_cast = 1 if (pd.notna(raw_cast) and float(raw_cast) == 1.0) else 0

        # Patient ID canonicalization
        raw_pid = str(row["patient_id"])
        patient_id = f"PAT_GRAZ_{raw_pid}"

        valid_records.append({
            "dataset": "GRAZPEDWRI-DX",
            "image_id": os.path.basename(img_path),
            "filestem": filestem,
            "patient_id": patient_id,
            "raw_patient_id": raw_pid,
            "file_path": img_path,
            "fractured": is_fractured,
            "hardware": has_metal,
            "cast": has_cast,
            "gender": str(row.get("gender", "unknown")),
            "age": float(row["age"]) if pd.notna(row.get("age")) else np.nan,
            "laterality": str(row.get("laterality", "unknown")),
            "projection": str(row.get("projection", "unknown")),
            "anatomy": "wrist",
            "width": width,
            "height": height,
            "mode": mode,
            "md5_hash": file_hash,
        })

    df = pd.DataFrame(valid_records)
    print(f"Verified valid images: {len(df)}")
    print(f"Unique patients: {df['patient_id'].nunique()}")
    print(f"Class distribution: {df['fractured'].value_counts().to_dict()} (Fracture %: {df['fractured'].mean()*100:.2f}%)")
    print(f"Excluded duplicates: {duplicate_count}, Corrupted: {corrupted_count}, Unextracted/Missing on disk: {missing_count}")

    # Patient-level split: 70% Train, 15% Val, 15% Test
    gss_test = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=seed)
    train_val_idx, test_idx = next(gss_test.split(df, groups=df["patient_id"]))

    df_train_val = df.iloc[train_val_idx].reset_index(drop=True)
    df_test = df.iloc[test_idx].reset_index(drop=True)

    # 15% of total is 15/85 of train_val
    val_ratio = 0.15 / 0.85
    gss_val = GroupShuffleSplit(n_splits=1, test_size=val_ratio, random_state=seed)
    train_idx, val_idx = next(gss_val.split(df_train_val, groups=df_train_val["patient_id"]))

    df_train = df_train_val.iloc[train_idx].reset_index(drop=True)
    df_val = df_train_val.iloc[val_idx].reset_index(drop=True)

    df_train["split"] = "train"
    df_val["split"] = "validation"
    df_test["split"] = "test"

    # Leakage verification
    train_patients = set(df_train["patient_id"])
    val_patients = set(df_val["patient_id"])
    test_patients = set(df_test["patient_id"])

    overlap_train_val = len(train_patients & val_patients)
    overlap_train_test = len(train_patients & test_patients)
    overlap_val_test = len(val_patients & test_patients)

    print(f"\n--- Patient Split Summary ---")
    print(f"Train: {len(df_train)} images, {len(train_patients)} patients (Fracture: {df_train['fractured'].sum()}/{len(df_train)} = {df_train['fractured'].mean()*100:.2f}%)")
    print(f"Validation: {len(df_val)} images, {len(val_patients)} patients (Fracture: {df_val['fractured'].sum()}/{len(df_val)} = {df_val['fractured'].mean()*100:.2f}%)")
    print(f"Test: {len(df_test)} images, {len(test_patients)} patients (Fracture: {df_test['fractured'].sum()}/{len(df_test)} = {df_test['fractured'].mean()*100:.2f}%)")
    print(f"Patient Overlap -> Train/Val: {overlap_train_val}, Train/Test: {overlap_train_test}, Val/Test: {overlap_val_test}")

    if overlap_train_val > 0 or overlap_train_test > 0 or overlap_val_test > 0:
        raise ValueError("CRITICAL ERROR: Patient leakage detected between splits!")

    os.makedirs(manifest_dir, exist_ok=True)
    df_train.to_csv(os.path.join(manifest_dir, "train.csv"), index=False)
    df_val.to_csv(os.path.join(manifest_dir, "validation.csv"), index=False)
    df_test.to_csv(os.path.join(manifest_dir, "test.csv"), index=False)
    df_combined = pd.concat([df_train, df_val, df_test], ignore_index=True)
    df_combined.to_csv(os.path.join(manifest_dir, "all_splits.csv"), index=False)

    report = {
        "dataset_name": "GRAZPEDWRI-DX",
        "source_root": graz_root,
        "total_raw_rows": len(meta_df),
        "total_valid_images": len(df),
        "total_unique_patients": int(df["patient_id"].nunique()),
        "excluded_duplicates": duplicate_count,
        "excluded_corrupted": corrupted_count,
        "excluded_unextracted": missing_count,
        "class_distribution_overall": {
            "fractured_count": int(df["fractured"].sum()),
            "non_fractured_count": int((df["fractured"] == 0).sum()),
            "fracture_percentage": float(df["fractured"].mean() * 100),
        },
        "splits": {
            "train": {
                "total_images": len(df_train),
                "unique_patients": len(train_patients),
                "fractured": int(df_train["fractured"].sum()),
                "non_fractured": int((df_train["fractured"] == 0).sum()),
                "fracture_percentage": float(df_train["fractured"].mean() * 100),
            },
            "validation": {
                "total_images": len(df_val),
                "unique_patients": len(val_patients),
                "fractured": int(df_val["fractured"].sum()),
                "non_fractured": int((df_val["fractured"] == 0).sum()),
                "fracture_percentage": float(df_val["fractured"].mean() * 100),
            },
            "test": {
                "total_images": len(df_test),
                "unique_patients": len(test_patients),
                "fractured": int(df_test["fractured"].sum()),
                "non_fractured": int((df_test["fractured"] == 0).sum()),
                "fracture_percentage": float(df_test["fractured"].mean() * 100),
            },
        },
        "patient_leakage_check": {
            "train_val_overlap": overlap_train_val,
            "train_test_overlap": overlap_train_test,
            "val_test_overlap": overlap_val_test,
            "leakage_detected": False,
        }
    }

    with open(os.path.join(manifest_dir, "dataset_cleaning_report.json"), "w") as f:
        json.dump(report, f, indent=2)

    return report, df_train, df_val, df_test
