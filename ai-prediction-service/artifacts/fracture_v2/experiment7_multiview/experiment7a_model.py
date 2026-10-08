import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import ResNet18_Weights


class DualViewResNet18(nn.Module):
    """
    Experiment 7A: Shared-Backbone Dual-View ResNet-18 Architecture
    Jointly processes paired Anteroposterior (AP) and Lateral (LAT) pediatric radiographs.
    
    Structure:
    - Backbone: ImageNet-pretrained ResNet-18 (shared weights between AP and LAT branches)
    - Feature Extraction: Global Average Pooling (GAP) -> 512-dimensional vector per projection
    - Feature Fusion: Concatenation (512 + 512 = 1024 dimensions)
    - Fusion Head: Linear(1024 -> 256) -> ReLU -> Dropout(0.30) -> Linear(256 -> 1) -> Logit
    """
    def __init__(self, pretrained=True, dropout_rate=0.30):
        super(DualViewResNet18, self).__init__()
        
        # Load backbone
        if pretrained:
            weights = ResNet18_Weights.IMAGENET1K_V1
            base_model = models.resnet18(weights=weights)
        else:
            base_model = models.resnet18(weights=None)
            
        # Extract layers up to global average pooling
        self.conv1 = base_model.conv1
        self.bn1 = base_model.bn1
        self.relu = base_model.relu
        self.maxpool = base_model.maxpool
        
        self.layer1 = base_model.layer1
        self.layer2 = base_model.layer2
        self.layer3 = base_model.layer3
        self.layer4 = base_model.layer4
        self.avgpool = base_model.avgpool  # Output: (B, 512, 1, 1)
        
        # Dual-View Fusion MLP Head
        self.fusion_head = nn.Sequential(
            nn.Linear(1024, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate),
            nn.Linear(256, 1)
        )
        
        # Auxiliary single-view classification heads (for independent ablation analysis)
        self.ap_single_head = nn.Sequential(
            nn.Linear(512, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate),
            nn.Linear(128, 1)
        )
        self.lat_single_head = nn.Sequential(
            nn.Linear(512, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate),
            nn.Linear(128, 1)
        )
        
    def extract_features(self, x):
        """Pass single projection through shared backbone to extract 512-d feature."""
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

    def forward(self, ap_img, lat_img):
        """
        Joint forward pass of paired orthogonal projections.
        Returns dual-view fused logit.
        """
        feat_ap = self.extract_features(ap_img)    # (B, 512)
        feat_lat = self.extract_features(lat_img)  # (B, 512)
        
        # Concatenate features along feature dimension
        feat_fused = torch.cat([feat_ap, feat_lat], dim=1)  # (B, 1024)
        
        # Pass through fusion classification head
        logit = self.fusion_head(feat_fused)  # (B, 1)
        return logit

    def forward_ap_only(self, ap_img):
        """Inference using AP projection only."""
        feat_ap = self.extract_features(ap_img)
        return self.ap_single_head(feat_ap)

    def forward_lat_only(self, lat_img):
        """Inference using Lateral projection only."""
        feat_lat = self.extract_features(lat_img)
        return self.lat_single_head(feat_lat)

    def freeze_backbone(self):
        """Freeze all backbone parameters for Stage 1 training."""
        for param in self.parameters():
            param.requires_grad = False
        for param in self.fusion_head.parameters():
            param.requires_grad = True
        for param in self.ap_single_head.parameters():
            param.requires_grad = True
        for param in self.lat_single_head.parameters():
            param.requires_grad = True

    def unfreeze_stage2(self):
        """Unfreeze layer3, layer4 and fusion head for Stage 2 fine-tuning."""
        for param in self.layer3.parameters():
            param.requires_grad = True
        for param in self.layer4.parameters():
            param.requires_grad = True
        for param in self.fusion_head.parameters():
            param.requires_grad = True
        for param in self.ap_single_head.parameters():
            param.requires_grad = True
        for param in self.lat_single_head.parameters():
            param.requires_grad = True
