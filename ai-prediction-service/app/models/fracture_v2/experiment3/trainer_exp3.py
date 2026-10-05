"""
Targeted Fine-Tuning Module for Experiment 3
"""

import os
import copy
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import transforms
from sklearn.metrics import roc_auc_score, confusion_matrix
from .hard_negative_miner import FractureDataset
from app.models.fracture_v2.model import FractureResNet18


def get_conservative_transforms():
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=7),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    return train_transform, eval_transform


def evaluate_val_epoch(model, val_loader, device, threshold=0.35):
    model.eval()
    all_probs = []
    all_targets = []
    all_datasets = []

    with torch.no_grad():
        for images, targets, datasets, _, _ in val_loader:
            images = images.to(device)
            logits = model(images).squeeze(-1)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs)
            all_targets.extend(targets.numpy())
            all_datasets.extend(datasets)

    probs = np.array(all_probs)
    targets = np.array(all_targets)
    datasets = np.array(all_datasets)

    overall_auc = float(roc_auc_score(targets, probs))

    fa_mask = (datasets == "FracAtlas")
    graz_mask = (datasets == "GRAZPEDWRI-DX")

    # FracAtlas adult metrics at candidate threshold
    fa_targets = targets[fa_mask]
    fa_preds = (probs[fa_mask] >= threshold).astype(int)
    cm_fa = confusion_matrix(fa_targets, fa_preds, labels=[0, 1])
    tn_fa, fp_fa, fn_fa, tp_fa = cm_fa.ravel()
    adult_recall = float(tp_fa / (tp_fa + fn_fa)) if (tp_fa + fn_fa) > 0 else 0.0
    adult_spec = float(tn_fa / (tn_fa + fp_fa)) if (tn_fa + fp_fa) > 0 else 0.0

    # GRAZ pediatric metrics at candidate threshold
    gr_targets = targets[graz_mask]
    gr_preds = (probs[graz_mask] >= threshold).astype(int)
    cm_gr = confusion_matrix(gr_targets, gr_preds, labels=[0, 1])
    tn_gr, fp_gr, fn_gr, tp_gr = cm_gr.ravel()
    ped_recall = float(tp_gr / (tp_gr + fn_gr)) if (tp_gr + fn_gr) > 0 else 0.0
    ped_spec = float(tn_gr / (tn_gr + fp_gr)) if (tn_gr + fp_gr) > 0 else 0.0

    # Composite metric balancing adult sensitivity and pediatric specificity without sacrificing AUC
    composite_score = (overall_auc * 0.4) + (adult_recall * 0.35) + (ped_spec * 0.25)

    return {
        "overall_auc": round(overall_auc, 4),
        "adult_recall": round(adult_recall, 4),
        "adult_specificity": round(adult_spec, 4),
        "pediatric_recall": round(ped_recall, 4),
        "pediatric_specificity": round(ped_spec, 4),
        "composite_score": round(composite_score, 4),
        "probs": probs,
        "targets": targets,
        "datasets": datasets,
    }


import numpy as np


def train_targeted_model(
    base_checkpoint_path,
    df_train,
    sample_weights,
    df_val,
    output_dir,
    epochs=5,
    batch_size=32,
    device=None,
    seed=42,
):
    print("=" * 60)
    print("STARTING TARGETED FINE-TUNING (EXPERIMENT 3)")
    print("=" * 60)

    torch.manual_seed(seed)
    np.random.seed(seed)
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    os.makedirs(output_dir, exist_ok=True)
    train_transform, eval_transform = get_conservative_transforms()

    # Datasets and Loaders
    train_dataset = FractureDataset(df_train, transform=train_transform)
    val_dataset = FractureDataset(df_val, transform=eval_transform)

    sampler = WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=0,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )

    # Load Model from Experiment 2 Base Checkpoint
    model = FractureResNet18(pretrained=False).to(device)
    model.load_state_dict(torch.load(base_checkpoint_path, map_location=device))
    print(f"Loaded base model weights from {base_checkpoint_path}")

    # Freeze earlier layers (conv1, bn1, layer1, layer2) and fine-tune layer3, layer4, and fc
    for name, param in model.named_parameters():
        if "layer3" in name or "layer4" in name or "fc" in name:
            param.requires_grad = True
        else:
            param.requires_grad = False

    # Low differential learning rates
    optimizer = torch.optim.AdamW([
        {"params": model.layer3.parameters(), "lr": 1e-5, "weight_decay": 1e-3},
        {"params": model.layer4.parameters(), "lr": 2e-5, "weight_decay": 1e-3},
        {"params": model.fc.parameters(), "lr": 1e-4, "weight_decay": 1e-3},
    ])

    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    criterion = nn.BCEWithLogitsLoss()

    # Initial Zero-Shot / Epoch 0 Evaluation
    init_val = evaluate_val_epoch(model, val_loader, device)
    print(f"[Epoch 0 Baseline] Val AUC: {init_val['overall_auc']} | Adult Recall: {init_val['adult_recall']} | Ped Spec: {init_val['pediatric_specificity']} | Composite: {init_val['composite_score']}")

    best_composite = init_val["composite_score"]
    best_weights = copy.deepcopy(model.state_dict())
    history = []

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        for images, targets, _, _, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            logits = model(images).squeeze(-1)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * len(targets)

        scheduler.step()
        epoch_loss = running_loss / len(df_train)

        # Validation
        val_metrics = evaluate_val_epoch(model, val_loader, device)
        print(f"[Epoch {epoch}/{epochs}] Train Loss: {epoch_loss:.4f} | Val AUC: {val_metrics['overall_auc']} | Adult Rec: {val_metrics['adult_recall']} | Ped Spec: {val_metrics['pediatric_specificity']} | Composite: {val_metrics['composite_score']}", flush=True)

        history.append({
            "epoch": epoch,
            "train_loss": round(epoch_loss, 4),
            "val_auc": val_metrics["overall_auc"],
            "adult_recall": val_metrics["adult_recall"],
            "adult_specificity": val_metrics["adult_specificity"],
            "pediatric_recall": val_metrics["pediatric_recall"],
            "pediatric_specificity": val_metrics["pediatric_specificity"],
            "composite_score": val_metrics["composite_score"],
        })

        if val_metrics["composite_score"] > best_composite:
            best_composite = val_metrics["composite_score"]
            best_weights = copy.deepcopy(model.state_dict())
            print(f"  -> New best composite score ({best_composite:.4f})! Saving checkpoint...")

    # Load best weights
    model.load_state_dict(best_weights)
    best_path = os.path.join(output_dir, "best_model.pt")
    torch.save(best_weights, best_path)
    print(f"\n[Training Complete] Best model saved to {best_path}")

    return model, history, best_composite
