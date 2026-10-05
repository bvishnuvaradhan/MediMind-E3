"""
Two-Stage Transfer Learning Trainer for Fracture Detection (v2)
"""

import os
import copy
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import roc_auc_score, average_precision_score
from .model import FractureResNet18
from .transforms import FractureDataset, get_transforms


def calculate_class_weights(df_train):
    pos_count = int(df_train["fractured"].sum())
    neg_count = int((df_train["fractured"] == 0).sum())
    pos_weight = neg_count / max(pos_count, 1)
    return float(pos_weight), pos_count, neg_count


def evaluate_epoch(model, dataloader, criterion, device):
    model.eval()
    total_loss = 0.0
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for images, targets, _ in dataloader:
            images = images.to(device)
            targets = targets.to(device)

            logits = model(images)
            loss = criterion(logits, targets)
            probs = torch.sigmoid(logits)

            total_loss += loss.item() * len(targets)
            all_targets.extend(targets.cpu().numpy().tolist())
            all_probs.extend(probs.cpu().numpy().tolist())

    avg_loss = total_loss / len(dataloader.dataset)
    try:
        roc_auc = roc_auc_score(all_targets, all_probs)
    except Exception:
        roc_auc = 0.5
    try:
        pr_auc = average_precision_score(all_targets, all_probs)
    except Exception:
        pr_auc = 0.0

    return avg_loss, roc_auc, pr_auc, all_targets, all_probs


def train_fracture_model(
    df_train,
    df_val,
    output_dir,
    batch_size=32,
    stage1_epochs=3,
    stage2_epochs=7,
    device=None,
    seed=42,
):
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    os.makedirs(output_dir, exist_ok=True)
    train_transform, eval_transform = get_transforms()

    train_dataset = FractureDataset(df_train, transform=train_transform)
    val_dataset = FractureDataset(df_val, transform=eval_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Calculate class weights from actual training split
    pos_weight_val, pos_count, neg_count = calculate_class_weights(df_train)
    pos_weight_tensor = torch.tensor([pos_weight_val], dtype=torch.float32).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight_tensor)

    print(f"[Training Init] Train images: {len(df_train)} (Pos: {pos_count}, Neg: {neg_count})")
    print(f"[Training Init] Pos Weight: {pos_weight_val:.4f} | Validation images: {len(df_val)}")

    model = FractureResNet18(pretrained=True).to(device)
    training_history = []
    best_val_auc = 0.0
    best_model_weights = copy.deepcopy(model.state_dict())

    # ==========================================
    # STAGE 1: CLASSIFIER WARM-UP (Backbone Frozen)
    # ==========================================
    print("\n--- STAGE 1: Classifier Head Warm-Up (Backbone Frozen) ---")
    for param in model.parameters():
        param.requires_grad = False
    for param in model.fc.parameters():
        param.requires_grad = True

    optimizer_s1 = torch.optim.AdamW(model.fc.parameters(), lr=1e-3, weight_decay=1e-2)

    for epoch in range(1, stage1_epochs + 1):
        model.train()
        running_loss = 0.0

        for images, targets, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer_s1.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer_s1.step()

            running_loss += loss.item() * len(targets)

        train_loss = running_loss / len(train_dataset)
        val_loss, val_auc, val_prauc, _, _ = evaluate_epoch(model, val_loader, criterion, device)

        print(f"[Stage 1 - Epoch {epoch}/{stage1_epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val ROC-AUC: {val_auc:.4f} | Val PR-AUC: {val_prauc:.4f}")

        training_history.append({
            "stage": 1,
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_roc_auc": round(val_auc, 4),
            "val_pr_auc": round(val_prauc, 4),
        })

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_model_weights = copy.deepcopy(model.state_dict())

    # ==========================================
    # STAGE 2: CONTROLLED FINE-TUNING (Unfreeze Layer3 & Layer4)
    # ==========================================
    print("\n--- STAGE 2: Controlled Fine-Tuning (Unfreeze Layer 3 & Layer 4) ---")
    # Restore best from stage 1
    model.load_state_dict(best_model_weights)

    # Unfreeze layer3, layer4, and fc
    for param in model.parameters():
        param.requires_grad = False
    for param in model.layer3.parameters():
        param.requires_grad = True
    for param in model.layer4.parameters():
        param.requires_grad = True
    for param in model.fc.parameters():
        param.requires_grad = True

    # Differential Learning Rates
    optimizer_s2 = torch.optim.AdamW([
        {"params": model.layer3.parameters(), "lr": 1e-4, "weight_decay": 1e-3},
        {"params": model.layer4.parameters(), "lr": 1e-4, "weight_decay": 1e-3},
        {"params": model.fc.parameters(), "lr": 5e-4, "weight_decay": 1e-2},
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer_s2, T_max=stage2_epochs, eta_min=1e-6)

    early_stop_patience = 4
    patience_counter = 0

    for epoch in range(1, stage2_epochs + 1):
        model.train()
        running_loss = 0.0

        for images, targets, _ in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer_s2.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer_s2.step()

            running_loss += loss.item() * len(targets)

        scheduler.step()
        train_loss = running_loss / len(train_dataset)
        val_loss, val_auc, val_prauc, _, _ = evaluate_epoch(model, val_loader, criterion, device)

        print(f"[Stage 2 - Epoch {epoch}/{stage2_epochs}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val ROC-AUC: {val_auc:.4f} | Val PR-AUC: {val_prauc:.4f}")

        training_history.append({
            "stage": 2,
            "epoch": stage1_epochs + epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_roc_auc": round(val_auc, 4),
            "val_pr_auc": round(val_prauc, 4),
        })

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            best_model_weights = copy.deepcopy(model.state_dict())
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= early_stop_patience:
                print(f"[Early Stopping] Triggered after {epoch} epochs in Stage 2.")
                break

    # Save best model
    model.load_state_dict(best_model_weights)
    best_checkpoint_path = os.path.join(output_dir, "best_model.pt")
    torch.save(model.state_dict(), best_checkpoint_path)

    final_checkpoint_path = os.path.join(output_dir, "final_model.pt")
    torch.save(model.state_dict(), final_checkpoint_path)

    print(f"\n[Training Complete] Best Validation ROC-AUC: {best_val_auc:.4f}")
    print(f"Checkpoint saved to: {best_checkpoint_path}")

    return model, training_history, pos_weight_val
