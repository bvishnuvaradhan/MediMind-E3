"""
Experiment 4: Hard-Negative Mining on GRAZ Training Set Only
"""

import os
import json
import torch
import pandas as pd
from PIL import Image
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from app.models.fracture_v2.model import FractureResNet18


class HardNegativeMinerExp4:
    def __init__(self, exp2_checkpoint_path, device="cpu"):
        self.device = torch.device(device)
        self.model = FractureResNet18(pretrained=False)
        ckpt = torch.load(exp2_checkpoint_path, map_location=self.device, weights_only=False)
        state_dict = ckpt if "model_state_dict" not in ckpt else ckpt["model_state_dict"]
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def mine_training_hard_negatives(self, train_manifest_path, output_manifest_path, threshold=0.30):
        """
        Runs inference on GRAZ TRAINING set only.
        Mines non-fracture images (fractured == 0) with predicted probability >= threshold.
        """
        df = pd.read_csv(train_manifest_path)
        lbl_col = "fractured" if "fractured" in df.columns else "label"
        non_frac_df = df[df[lbl_col] == 0].copy()

        print(f"[Miner] Scanning {len(non_frac_df)} non-fracture training images (out of {len(df)} total train images)...")
        
        hard_negatives = []
        with torch.no_grad():
            for idx, row in non_frac_df.iterrows():
                img_path = row["file_path"]
                if not os.path.exists(img_path):
                    continue
                try:
                    img = Image.open(img_path).convert("RGB")
                    tensor = self.transform(img).unsqueeze(0).to(self.device)
                    prob = self.model.predict_proba(tensor).item()
                    
                    if prob >= threshold:
                        hard_negatives.append({
                            "image_id": str(row.get("image_id", os.path.basename(img_path))),
                            "patient_id": str(row.get("patient_id", "")),
                            "file_path": img_path,
                            "original_label": 0,
                            "model_probability": round(prob, 6),
                            "hard_negative_selection_criterion": f"prob_ge_{threshold:.2f}_normal_growth_plate_bias"
                        })
                except Exception as e:
                    pass

        # Sort descending by model probability
        hard_negatives.sort(key=lambda x: x["model_probability"], reverse=True)

        os.makedirs(os.path.dirname(output_manifest_path), exist_ok=True)
        with open(output_manifest_path, "w") as f:
            json.dump({
                "source_split": "GRAZPEDWRI-DX training cohort only",
                "total_training_non_fractures_scanned": len(non_frac_df),
                "mined_hard_negatives_count": len(hard_negatives),
                "mining_threshold": threshold,
                "hard_negatives": hard_negatives
            }, f, indent=2)

        print(f"[Miner] Successfully mined {len(hard_negatives)} hard-negative non-fracture training images. Manifest saved to {output_manifest_path}")
        return hard_negatives
