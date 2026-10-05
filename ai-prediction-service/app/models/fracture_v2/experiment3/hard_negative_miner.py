"""
Hard-Negative Mining Module for Pediatric Growth-Plate Bias Mitigation (Experiment 3)
"""

import os
import json
import torch
import numpy as np
import pandas as pd
from PIL import Image, ImageFile
from torchvision import transforms
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler

ImageFile.LOAD_TRUNCATED_IMAGES = True


class FractureDataset(Dataset):
    def __init__(self, df, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img = Image.open(row["file_path"]).convert("RGB")
        if self.transform:
            img = self.transform(img)
        target = torch.tensor(float(row["fractured"]), dtype=torch.float32)
        return img, target, row["dataset"], row["patient_id"], row["file_path"]


def mine_hard_negatives(
    model,
    df_train,
    device,
    output_dir,
    batch_size=32,
    hard_thresh=0.40,
):
    print("=" * 60)
    print("MINING HARD NEGATIVES FROM TRAINING SPLIT ONLY")
    print("=" * 60)

    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    loader = DataLoader(
        FractureDataset(df_train, transform=eval_transform),
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )

    model.eval()
    all_probs = []
    all_targets = []

    with torch.no_grad():
        for images, targets, _, _, _ in loader:
            images = images.to(device)
            logits = model(images).squeeze(-1)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs)
            all_targets.extend(targets.numpy())

    df_train = df_train.copy()
    df_train["base_prob"] = all_probs

    # Identify pediatric hard negatives: GRAZPEDWRI-DX, fractured == 0, base_prob >= hard_thresh
    pediatric_negatives = (df_train["dataset"] == "GRAZPEDWRI-DX") & (df_train["fractured"] == 0)
    hard_pediatric_negatives = pediatric_negatives & (df_train["base_prob"] >= hard_thresh)

    num_ped_neg = int(pediatric_negatives.sum())
    num_hard_ped_neg = int(hard_pediatric_negatives.sum())

    print(f"Total Training Images: {len(df_train)}")
    print(f"Total Pediatric Training Negatives: {num_ped_neg}")
    print(f"Identified Hard Pediatric Negatives (prob >= {hard_thresh}): {num_hard_ped_neg} ({num_hard_ped_neg/max(1, num_ped_neg)*100:.1f}%)")

    # Compute controlled sample weights for balanced training:
    # 1. Base weights: FracAtlas Pos = 2.0, FracAtlas Neg = 1.0
    # 2. GRAZ Pos = 1.0, GRAZ Neg (normal) = 2.0, GRAZ Neg (hard) = 4.0
    sample_weights = []
    for _, row in df_train.iterrows():
        is_fa = (row["dataset"] == "FracAtlas")
        is_frac = (row["fractured"] == 1)
        prob = row["base_prob"]

        if is_fa:
            if is_frac:
                w = 2.5 # Preserve adult fracture sensitivity
            else:
                w = 1.0
        else: # GRAZPEDWRI-DX
            if is_frac:
                w = 1.0
            else:
                if prob >= hard_thresh:
                    w = 4.0 # Prioritize hard pediatric growth plates
                else:
                    w = 2.0 # Normal pediatric negative

        sample_weights.append(w)

    df_train["sample_weight"] = sample_weights

    manifest = {
        "total_training_samples": len(df_train),
        "total_pediatric_negatives": num_ped_neg,
        "hard_pediatric_negatives": num_hard_ped_neg,
        "hard_negative_threshold": hard_thresh,
        "sample_weight_distribution": {
            "fracatlas_pos_weight": 2.5,
            "fracatlas_neg_weight": 1.0,
            "graz_pos_weight": 1.0,
            "graz_neg_easy_weight": 2.0,
            "graz_neg_hard_weight": 4.0,
        },
        "sample_hard_negatives": df_train[hard_pediatric_negatives][["image_id", "patient_id", "base_prob"]].head(10).to_dict(orient="records")
    }

    os.makedirs(output_dir, exist_ok=True)
    manifest_path = os.path.join(output_dir, "hard_negative_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"[Saved] Hard-negative manifest -> {manifest_path}")
    return df_train, sample_weights, manifest
