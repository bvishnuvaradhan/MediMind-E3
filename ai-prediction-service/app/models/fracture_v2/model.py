"""
CNN Architecture for Fracture Detection (v2)

Architecture:
Input Radiograph (224x224x3)
    ↓
ImageNet-Pretrained ResNet-18 Backbone
    ↓
Global Average Pooling (512-dim)
    ↓
Dropout (p=0.2)
    ↓
Linear Classification Layer (512 -> 1)
    ↓
Single Fracture Output Logit (for BCEWithLogitsLoss)
"""

import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import ResNet18_Weights


class FractureResNet18(nn.Module):
    def __init__(self, pretrained=True, dropout_rate=0.2):
        super(FractureResNet18, self).__init__()
        weights = ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        base_model = models.resnet18(weights=weights)

        # Retain standard ResNet-18 feature extraction backbone
        self.conv1 = base_model.conv1
        self.bn1 = base_model.bn1
        self.relu = base_model.relu
        self.maxpool = base_model.maxpool
        self.layer1 = base_model.layer1
        self.layer2 = base_model.layer2
        self.layer3 = base_model.layer3
        self.layer4 = base_model.layer4
        self.avgpool = base_model.avgpool

        # Single binary classification logit
        in_features = base_model.fc.in_features  # 512
        self.dropout = nn.Dropout(p=dropout_rate)
        self.fc = nn.Linear(in_features, 1)

    def forward_features(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        return x

    def forward(self, x):
        feat = self.forward_features(x)
        pooled = self.avgpool(feat)
        flattened = torch.flatten(pooled, 1)
        dropped = self.dropout(flattened)
        logit = self.fc(dropped)
        return logit.squeeze(-1)

    def predict_proba(self, x):
        logit = self.forward(x)
        return torch.sigmoid(logit)


def create_fracture_model(pretrained=True):
    return FractureResNet18(pretrained=pretrained)
