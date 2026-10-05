"""
Preprocessing and Data Pipeline for Fracture Detection (v2)
"""

import os
import torch
from torch.utils.data import Dataset
from PIL import Image, ImageFile
from torchvision import transforms

ImageFile.LOAD_TRUNCATED_IMAGES = True


class FractureDataset(Dataset):
    def __init__(self, df, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row["file_path"]
        
        # Load image safely and convert to 3-channel RGB
        image = Image.open(img_path).convert("RGB")
        label = torch.tensor(float(row["fractured"]), dtype=torch.float32)

        if self.transform:
            image = self.transform(image)

        metadata = {
            "image_id": row["image_id"],
            "patient_id": row["patient_id"],
            "anatomy": row.get("anatomy", "unknown"),
            "hardware": int(row.get("hardware", 0)),
            "dataset_source": row.get("dataset_source", "FracAtlas"),
        }

        return image, label, metadata


def get_transforms():
    # Pretrained ResNet-18 ImageNet normalization
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    # Conservative Training Augmentation (no heavy warping that alters bone morphology)
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    # Validation & Test: Deterministic resizing and normalization ONLY
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
    ])

    return train_transform, eval_transform
