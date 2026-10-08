import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import ResNet18_Weights


class DualViewROIResNet18(nn.Module):
    """
    Experiment 8A: Dual-View ROI-Aligned Multi-View Fusion Architecture
    Decoupled Spatial Localization + Localized Dual-Branch Feature Fusion + Confidence Gating.
    
    Structure:
    - Shared Backbone: ResNet-18 (ImageNet pretrained), extracting 512-d embeddings from 256x256 ROI crops.
    - Inputs: AP ROI (B, 3, 256, 256), Lateral ROI (B, 3, 256, 256), AP Confidence (B, 1), Lat Confidence (B, 1).
    - Joint Representation: Concat(AP 512-d, Lat 512-d, AP_conf 1-d, Lat_conf 1-d) -> 1026-d vector.
    - Fusion Head: Linear(1026 -> 256) -> ReLU -> Dropout(0.30) -> Linear(256 -> 1) -> Logit.
    """
    def __init__(self, pretrained=True, dropout_rate=0.30):
        super(DualViewROIResNet18, self).__init__()
        
        # Shared ResNet-18 Backbone
        if pretrained:
            weights = ResNet18_Weights.IMAGENET1K_V1
            base_model = models.resnet18(weights=weights)
        else:
            base_model = models.resnet18(weights=None)
            
        self.conv1 = base_model.conv1
        self.bn1 = base_model.bn1
        self.relu = base_model.relu
        self.maxpool = base_model.maxpool
        
        self.layer1 = base_model.layer1
        self.layer2 = base_model.layer2
        self.layer3 = base_model.layer3
        self.layer4 = base_model.layer4
        self.avgpool = base_model.avgpool  # Output: (B, 512, 1, 1)
        
        # Multi-View Fusion MLP Head (1024-d features + 2-d detector confidences = 1026-d)
        self.fusion_head = nn.Sequential(
            nn.Linear(1026, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate),
            nn.Linear(256, 1)
        )
        
    def extract_roi_features(self, x):
        """Pass single 256x256 ROI crop through shared backbone to extract 512-d feature."""
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        feat = torch.flatten(x, 1)  # (B, 512)
        return feat

    def forward(self, ap_roi, lat_roi, ap_conf, lat_conf, ap_mask, lat_mask):
        """
        Forward pass with deterministic no-detection masking and confidence gating.
        
        Args:
            ap_roi: (B, 3, 256, 256) tensor
            lat_roi: (B, 3, 256, 256) tensor
            ap_conf: (B, 1) tensor of YOLO detector confidence [0.0, 1.0]
            lat_conf: (B, 1) tensor of YOLO detector confidence [0.0, 1.0]
            ap_mask: (B, 1) binary indicator (1.0 if box detected, 0.0 if zero detection)
            lat_mask: (B, 1) binary indicator (1.0 if box detected, 0.0 if zero detection)
        
        Returns:
            logit: (B, 1) study-level fracture logit
        """
        feat_ap = self.extract_roi_features(ap_roi) * ap_mask      # (B, 512) - Zeroed if no AP detection
        feat_lat = self.extract_roi_features(lat_roi) * lat_mask  # (B, 512) - Zeroed if no Lat detection
        
        gated_ap_conf = ap_conf * ap_mask
        gated_lat_conf = lat_conf * lat_mask
        
        # Concatenate into 1026-dimensional representation
        feat_fused = torch.cat([feat_ap, feat_lat, gated_ap_conf, gated_lat_conf], dim=1)  # (B, 1026)
        logit = self.fusion_head(feat_fused)  # (B, 1)
        
        # If neither view detected (State D: ap_mask=0 and lat_mask=0), force large negative logit (prob -> 0.0)
        both_zero_mask = (ap_mask == 0.0) & (lat_mask == 0.0)
        logit = torch.where(both_zero_mask, torch.full_like(logit, -15.0), logit)
        
        return logit

    def freeze_backbone(self):
        """Stage 1: Freeze all convolutional backbone parameters."""
        for param in self.parameters():
            param.requires_grad = False
        for param in self.fusion_head.parameters():
            param.requires_grad = True

    def unfreeze_stage2(self):
        """Stage 2: Unfreeze layer3, layer4, and fusion head."""
        for param in self.parameters():
            param.requires_grad = False
        for param in self.layer3.parameters():
            param.requires_grad = True
        for param in self.layer4.parameters():
            param.requires_grad = True
        for param in self.fusion_head.parameters():
            param.requires_grad = True
