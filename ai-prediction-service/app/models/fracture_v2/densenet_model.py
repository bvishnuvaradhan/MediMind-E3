"""
DenseNet-121 Architecture for Musculoskeletal Fracture Detection (Transfer Learning Candidate)

Architecture:
Input Radiograph (224x224x3)
    ↓
ImageNet-Pretrained DenseNet-121 Feature Extractor (denseblock1 to norm5)
    ↓
Global Adaptive Average Pooling (1024-dim)
    ↓
Dropout (p=dropout_rate)
    ↓
Linear Classification Head (1024 -> 1)
    ↓
Single Fracture Output Logit (for BCEWithLogitsLoss)
"""

import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import DenseNet121_Weights


class FractureDenseNet121(nn.Module):
    def __init__(self, pretrained=True, dropout_rate=0.2):
        super(FractureDenseNet121, self).__init__()
        weights = DenseNet121_Weights.IMAGENET1K_V1 if pretrained else None
        base_model = models.densenet121(weights=weights)

        # Retain standard DenseNet-121 feature extraction backbone
        self.features = base_model.features
        in_features = base_model.classifier.in_features  # 1024

        self.relu = nn.ReLU(inplace=True)
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=dropout_rate)
        self.classifier = nn.Linear(in_features, 1)

    def forward_features(self, x):
        features = self.features(x)
        out = self.relu(features)
        return out

    def forward(self, x):
        features = self.forward_features(x)
        out = self.avgpool(features)
        out = torch.flatten(out, 1)
        out = self.dropout(out)
        logit = self.classifier(out)
        return logit.squeeze(-1)

    def predict_proba(self, x):
        logit = self.forward(x)
        return torch.sigmoid(logit)


def create_densenet_model(pretrained=True, dropout_rate=0.2):
    return FractureDenseNet121(pretrained=pretrained, dropout_rate=dropout_rate)
