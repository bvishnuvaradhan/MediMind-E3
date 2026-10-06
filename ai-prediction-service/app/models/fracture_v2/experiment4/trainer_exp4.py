"""
Experiment 4: Pediatric Specialist Controlled Fine-Tuning Trainer
"""

import os
import time
import json
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from PIL import Image
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import torchvision.transforms as transforms
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc, brier_score_loss
from app.models.fracture_v2.model import FractureResNet18


class PediatricXRayDataset(Dataset):
    def __init__(self, manifest_df, transform=None, hard_negatives=None, hard_neg_weight=1.5):
        self.df = manifest_df.reset_index(drop=True)
        self.transform = transform
        self.lbl_col = "fractured" if "fractured" in self.df.columns else "label"
        
        # Build image list and sample weights
        self.samples = []
        self.labels = []
        hard_neg_paths = set(h["file_path"] for h in hard_negatives) if hard_negatives else set()

        for idx, row in self.df.iterrows():
            fpath = row["file_path"]
            lbl = int(row[self.lbl_col])
            self.samples.append(fpath)
            self.labels.append(lbl)

        # Compute sample weights for balanced sampling
        labels_arr = np.array(self.labels)
        n_pos = np.sum(labels_arr == 1)
        n_neg = np.sum(labels_arr == 0)
        
        weight_pos = 1.0 / n_pos if n_pos > 0 else 1.0
        weight_neg = 1.0 / n_neg if n_neg > 0 else 1.0
        
        self.sample_weights = []
        for fpath, lbl in zip(self.samples, self.labels):
            if lbl == 1:
                self.sample_weights.append(weight_pos)
            else:
                base_w = weight_neg
                if fpath in hard_neg_paths:
                    base_w *= hard_neg_weight
                self.sample_weights.append(base_w)
        
        self.sample_weights = np.array(self.sample_weights, dtype=np.float32)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path = self.samples[idx]
        lbl = self.labels[idx]
        try:
            img = Image.open(path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), color=(0, 0, 0))
            
        if self.transform:
            img = self.transform(img)
            
        return img, torch.tensor(lbl, dtype=torch.float32)


def get_exp4_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return train_transform, val_transform


def compute_ece(probs, labels, n_bins=10):
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        in_bin = (probs > bin_boundaries[i]) & (probs <= bin_boundaries[i + 1])
        prop_in_bin = np.mean(in_bin)
        if prop_in_bin > 0:
            acc_in_bin = np.mean(labels[in_bin])
            conf_in_bin = np.mean(probs[in_bin])
            ece += np.abs(acc_in_bin - conf_in_bin) * prop_in_bin
    return float(ece)


class PediatricSpecialistTrainer:
    def __init__(self, init_checkpoint_path, device="cpu"):
        self.device = torch.device(device)
        self.model = FractureResNet18(pretrained=False)
        ckpt = torch.load(init_checkpoint_path, map_location=self.device, weights_only=False)
        state_dict = ckpt if "model_state_dict" not in ckpt else ckpt["model_state_dict"]
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)

        # Freezing strategy: layer1 & layer2 frozen; layer3, layer4, fc trainable
        for name, param in self.model.named_parameters():
            if "conv1" in name or "bn1" in name or "layer1" in name or "layer2" in name:
                param.requires_grad = False
            else:
                param.requires_grad = True

        # Differential parameter groups
        params = [
            {"params": [p for n, p in self.model.named_parameters() if "layer3" in n and p.requires_grad], "lr": 1e-5},
            {"params": [p for n, p in self.model.named_parameters() if "layer4" in n and p.requires_grad], "lr": 2e-5},
            {"params": [p for n, p in self.model.named_parameters() if "fc" in n and p.requires_grad], "lr": 1e-4},
        ]

        self.optimizer = torch.optim.AdamW(params, weight_decay=1e-4)
        self.criterion = nn.BCEWithLogitsLoss()

    def train(self, train_manifest, val_manifest, hard_negatives, output_dir, max_epochs=8, batch_size=32):
        os.makedirs(output_dir, exist_ok=True)
        train_tf, val_tf = get_exp4_transforms()

        train_df = pd.read_csv(train_manifest)
        val_df = pd.read_csv(val_manifest)

        train_ds = PediatricXRayDataset(train_df, transform=train_tf, hard_negatives=hard_negatives)
        val_ds = PediatricXRayDataset(val_df, transform=val_tf)

        sampler = WeightedRandomSampler(
            weights=train_ds.sample_weights,
            num_samples=len(train_ds),
            replacement=True
        )

        train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler, num_workers=0)
        val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(self.optimizer, T_max=max_epochs, eta_min=1e-6)

        history = []
        best_val_loss = float("inf")
        best_epoch = 0
        best_model_path = os.path.join(output_dir, "best_model.pt")

        print("\n" + "=" * 70)
        print("PEDIATRIC SPECIALIST CONTROLLED FINE-TUNING (MAX 8 EPOCHS)")
        print("=" * 70)

        for epoch in range(1, max_epochs + 1):
            epoch_start = time.time()
            self.model.train()
            train_losses = []

            for imgs, lbls in train_loader:
                imgs, lbls = imgs.to(self.device), lbls.to(self.device)
                self.optimizer.zero_grad()
                logits = self.model(imgs)
                loss = self.criterion(logits, lbls)
                loss.backward()
                self.optimizer.step()
                train_losses.append(loss.item())

            scheduler.step()
            train_loss = float(np.mean(train_losses))

            # Validation
            self.model.eval()
            val_losses = []
            all_probs = []
            all_labels = []

            with torch.no_grad():
                for imgs, lbls in val_loader:
                    imgs, lbls = imgs.to(self.device), lbls.to(self.device)
                    logits = self.model(imgs)
                    loss = self.criterion(logits, lbls)
                    val_losses.append(loss.item())
                    probs = torch.sigmoid(logits).cpu().numpy()
                    all_probs.extend(probs)
                    all_labels.extend(lbls.cpu().numpy())

            val_loss = float(np.mean(val_losses))
            all_probs = np.array(all_probs)
            all_labels = np.array(all_labels)

            val_auc = float(roc_auc_score(all_labels, all_probs))
            precision_arr, recall_arr, _ = precision_recall_curve(all_labels, all_probs)
            val_pr_auc = float(auc(recall_arr, precision_arr))

            # Metrics at default 0.50
            preds_50 = (all_probs >= 0.50).astype(int)
            tp = int(np.sum((preds_50 == 1) & (all_labels == 1)))
            fp = int(np.sum((preds_50 == 1) & (all_labels == 0)))
            tn = int(np.sum((preds_50 == 0) & (all_labels == 0)))
            fn = int(np.sum((preds_50 == 0) & (all_labels == 1)))

            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            f1 = 2 * prec * recall / (prec + recall) if (prec + recall) > 0 else 0.0
            brier = float(brier_score_loss(all_labels, all_probs))
            ece = compute_ece(all_probs, all_labels)

            epoch_dur = time.time() - epoch_start
            epoch_record = {
                "epoch": epoch,
                "train_loss": round(train_loss, 4),
                "val_loss": round(val_loss, 4),
                "val_auc": round(val_auc, 4),
                "val_pr_auc": round(val_pr_auc, 4),
                "val_recall": round(recall * 100, 2),
                "val_specificity": round(spec * 100, 2),
                "val_precision": round(prec * 100, 2),
                "val_f1": round(f1, 4),
                "val_brier": round(brier, 4),
                "val_ece": round(ece * 100, 2),
                "duration_seconds": round(epoch_dur, 1)
            }
            history.append(epoch_record)

            print(f"Epoch {epoch:02d}/{max_epochs:02d} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
                  f"Val AUC: {val_auc:.4f} | Val PR-AUC: {val_pr_auc:.4f} | Rec: {recall*100:.1f}% | Spec: {spec*100:.1f}% | "
                  f"F1: {f1:.4f} | Time: {epoch_dur:.1f}s")

            # Checkpoint best model by val loss / val auc
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_epoch = epoch
                torch.save(self.model.state_dict(), best_model_path)
                print(f"  --> Saved new best checkpoint at Epoch {epoch} (Val Loss: {val_loss:.4f})")

        print(f"\n[Trainer] Training completed. Best Epoch: {best_epoch} with Val Loss: {best_val_loss:.4f}")
        return history, best_epoch, best_model_path
