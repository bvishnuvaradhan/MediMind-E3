# MediMind — Clinical AI Model Governance, Lifecycle & Production Routing Framework

**Document ID:** `GOV-AI-MODELS-2026-V1`  
**Governance Scope:** Production vs. Research Model Separation, Lifecycle Classification, and Clinical Quality Assurance  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `feature/medimind-soa-demo`  
**Last Verified Date:** November 6, 2026  

---

## 1. Executive Governance Mandate

In healthcare artificial intelligence, maintaining strict governance boundaries between validated production serving endpoints and exploratory research experiments is an essential ethical, regulatory, and patient safety requirement. 

This document establishes the formal Model Governance and Lifecycle Framework for the MediMind Clinical AI Platform. It governs the four operational AI modules, documents the strict physical and logical isolation between production baselines and research prototypes, records cryptographic artifact provenance, and defines clinical safety guardrails.

> **CRITICAL GOVERNANCE DIRECTIVE:** This technical documentation pass is strictly descriptive and analytical. Under no circumstances does this documentation promote, approve, or re-route research candidates (such as Experiment 8A `DualViewROIResNet18`) into active clinical production.

---

## 2. Model Governance Classification Hierarchy

Every AI model, neural network checkpoint, and predictive algorithm in the MediMind repository is classified into one of four mutually exclusive governance tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIER 1: PRODUCTION VALIDATED / BASELINE                  │
│  Actively served by FastAPI (port 5008) via Node.js API Gateway (port 5000) │
│  • Fracture: ResNet-18 MURA (best_model.pt, tau=0.1800)                    │
│  • Heart Disease: Random Forest (random_forest.joblib, tau=0.4000)          │
│  • Diabetes: MLP Pipeline (best_model.joblib, tau=0.2500)                   │
│  • General Health: Deterministic NLP Triage Engine (v1.1.0)                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                    TIER 2: FORMALLY FROZEN RESEARCH BEST                    │
│  Validated research artifacts; 100% physically isolated from production     │
│  • Exp 8A DualViewROIResNet18 (experiment8a_best_model.pt, tau=0.0100)      │
│  • Exp 5 Spatial Bounding-Box Detector (YOLOv8n best_model.pt, tau=0.1700)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                    TIER 3: CANDIDATE & EXPLORATORY BASELINES                │
│  Trained and evaluated during Phase 6 comparisons; retained for audit trail │
│  • Heart Disease: Logistic Regression, MLPClassifier                        │
│  • Diabetes: Logistic Regression, Random Forest Classifier                  │
│  • Exp 7A: Global Multi-View ResNet-18 (Lacks spatial ROI localization)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                    TIER 4: DEPRECATED / CORRUPTED BASELINES                 │
│  Quarantined to prevent clinical data leakage and representational errors   │
│  • Un-Deduplicated Tabular Datasets (Quarantined to prevent leakage)        │
│  • Vanilla Whole-Image ResNet-18 (Collapsed to 0.0% specificity on physis)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Production vs. Research Separation: Detailed Module Audits

### 3.1 Fracture Detection: Production Baseline vs. Research Candidate Exp 8A
A central finding of the Phase 20 technical audit was that earlier draft documents occasionally conflated the existing production fracture model with offline research experiments. The governance boundaries are established as follows:

```
[Physical & Logical Routing Isolation for Fracture Detection]

CLIENT REQUEST ──► API Gateway (Port 5000) ──► POST /api/ai/fracture (Port 5008)
                                                        │
                                                        ▼
                                       ┌──────────────────────────────────┐
                                       │  fracture_service.py             │
                                       │  (FractureInferenceService)      │
                                       └────────────────┬─────────────────┘
                                                        │
                                                        ▼ LOADS EXCLUSIVELY
                                       ┌──────────────────────────────────┐
                                       │  artifacts/fracture/             │
                                       │  best_model.pt                   │
                                       │  (MD5: 99f0f5bcea645f714fe...)   │
                                       │  Threshold: 0.1800               │
                                       │  Adult Peripheral Plain X-Ray    │
                                       └──────────────────────────────────┘
                                                        X
                                            [PHYSICAL ISOLATION BARRIER]
                                                        X
                                       ┌──────────────────────────────────┐
                                       │  artifacts/fracture_v2/exp8/     │
                                       │  experiment8a_best_model.pt      │
                                       │  (MD5: ac7ebe3c91deea13cedb...)  │
                                       │  Threshold: 0.0100               │
                                       │  Pediatric Dual-View ROI Fusion  │
                                       │  STATUS: RESEARCH ONLY           │
                                       └──────────────────────────────────┘
```

1. **Active Production Baseline:**
   - **Service Implementation:** `ai-prediction-service/app/services/fracture_service.py`
   - **Loaded Checkpoint:** `artifacts/fracture/best_model.pt` (44.8 MB, MD5 `99f0f5bcea645f714fe4e8fefbb7e6cb`)
   - **Architecture:** PyTorch ResNet-18 (Stanford MURA pretrained $\to$ FracAtlas fine-tuned).
   - **Operating Threshold:** $\tau = 0.1800$.
   - **Routing:** Direct ingestion of single peripheral extremity radiographs. Zero connection to YOLOv8 proposals or dual-view fusion heads.
2. **Research Candidate (Experiment 8A — `DualViewROIResNet18`):**
   - **Repository Location:** `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/`
   - **Freeze Manifest:** `EXPERIMENT_8A_FREEZE_MANIFEST.json` (Commit `ead0e88a`)
   - **Architecture:** Localized Dual-Stream ROI Fusion Network with frozen YOLOv8n detector (`tau_det = 0.1700`) and twin ResNet-18 encoders.
   - **Operating Threshold:** $\tau = 0.0100$ (selected on GRAZ validation partition to prioritize sensitivity).
   - **Governance Status:** **FORMALLY FROZEN (RESEARCH-ONLY)**. It is physically isolated in `artifacts/fracture_v2/` and is never imported, loaded, or invoked by any production API endpoint.

---

### 3.2 Heart Disease Risk: Selected Random Forest vs. Alternate Candidates
- **Active Production Baseline:**
  - **Service Implementation:** `ai-prediction-service/app/services/heart_disease_service.py`
  - **Loaded Checkpoint:** `artifacts/heart_disease/random_forest.joblib` (32.6 MB, MD5 `d6c0d6caf794a2825bf70d889c5a8e32`)
  - **Selected Model:** `RandomForestClassifier` (200 trees, max depth 12, min samples leaf 3).
  - **Operating Threshold:** $\tau = 0.4000$ (tuned on validation partition to achieve 80.01% test sensitivity).
- **Candidate Alternates (Tier 3):**
  - `artifacts/heart_disease/logistic_regression.joblib` (Test recall 68.80%, ROC-AUC 0.7866)
  - `artifacts/heart_disease/mlp.joblib` (Test recall 70.84%, ROC-AUC 0.7956)
  - Both candidates are preserved in `artifacts/heart_disease/` for benchmark verification and auditability, but are bypassed in production execution.

---

### 3.3 Diabetes Risk: Selected MLP Pipeline vs. Alternate Candidates
- **Active Production Baseline:**
  - **Service Implementation:** `ai-prediction-service/app/services/diabetes_service.py`
  - **Loaded Checkpoint:** `artifacts/diabetes/best_model.joblib` (29.5 KB, MD5 `7bf85e9a43d9a38e40c8f92e0d0ac4cd`)
  - **Selected Architecture:** `Pipeline[StandardScaler, MLPClassifier(hidden_layer_sizes=(32, 16), alpha=0.001, early_stopping=True)]`.
  - **Operating Threshold:** $\tau = 0.2500$ (tuned on validation partition to achieve 80.49% test sensitivity).
- **Candidate Alternates (Tier 3):**
  - `artifacts/diabetes/logistic_regression.joblib` (Test recall 51.22%, ROC-AUC 0.8624)
  - `artifacts/diabetes/random_forest.joblib` (Test recall 48.78%, ROC-AUC 0.8332)
- **Governance Audit Note:** Older preliminary documentation colloquially described this model as Random Forest. Direct binary introspection confirms `best_model.joblib` and `mlp.joblib` have identical MD5 hashes (`7bf85e9a43d9a38e40c8f92e0d0ac4cd`), conclusively proving that the deployed model is the **MLPClassifier Pipeline**.

---

### 3.4 General Health NLP: Deterministic Safety Layer vs. Probabilistic NLP
- **Active Production Engine:**
  - **Service Implementation:** `ai-prediction-service/app/services/general_health_service.py`
  - **Underlying Engine:** `ai-prediction-service/app/models/general_health/general_health_nlp.py` (`GeneralHealthNLPEngine`, Version `1.1.0`)
- **Deterministic Clinical Safety Hierarchy:**
  - In conventional healthcare AI, deploying purely probabilistic LLMs or sequence models introduces the unacceptable hazard of stochastic hallucinations and false-negative emergency omissions.
  - MediMind enforces a **fail-safe deterministic safety override layer**:
    1. Life-threatening red flags (acute retrosternal chest pain, acute dyspnea, focal neurological deficits, acute hemorrhage, neonatal respiratory distress, suicidal ideation) are mapped through hardcoded clinical rules with zero probabilistic drift.
    2. Any red-flag match immediately forces the output into `EMERGENCY` triage ($0.94$ risk score, $0.92$ confidence), completely overriding downstream classification.
    3. Unambiguous mild symptoms (minor tension headache, dry cough) with zero red flags are assigned `SELF_CARE`.
    4. Unintelligible or unparseable text safely defaults to `REVIEW_REQUIRED`.

---

## 4. Cryptographic Checkpoint Register & Artifact Provenance

Every model artifact deployed in production or preserved as a research freeze is cryptographically indexed to guarantee tamper detection:

| Model Identity | Tier | File Path | File Size (Bytes) | MD5 Checksum | SHA-256 Checksum |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **Fracture Production Baseline** | Tier 1 | `artifacts/fracture/best_model.pt` | 44,788,427 | `99f0f5bcea645f714fe4e8fefbb7e6cb` | `abe8bc708a44cbe924f448df3654f1f0bfd5964f81b979fae61b446e873583b9` |
| **Heart Disease Random Forest** | Tier 1 | `artifacts/heart_disease/random_forest.joblib` | 32,636,665 | `d6c0d6caf794a2825bf70d889c5a8e32` | `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` |
| **Heart Disease Best Model (Copy)**| Tier 1 | `artifacts/heart_disease/best_model.joblib` | 32,636,665 | `d6c0d6caf794a2825bf70d889c5a8e32` | `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` |
| **Diabetes MLP Pipeline** | Tier 1 | `artifacts/diabetes/best_model.joblib` | 30,193 | `7bf85e9a43d9a38e40c8f92e0d0ac4cd` | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` |
| **Diabetes MLP (Copy)** | Tier 1 | `artifacts/diabetes/mlp.joblib` | 30,193 | `7bf85e9a43d9a38e40c8f92e0d0ac4cd` | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` |
| **Exp 8A Research Best Model** | Tier 2 | `artifacts/fracture_v2/exp8/experiment8a_best_model.pt` | 45,839,207 | `ac7ebe3c91deea13cedb5ca36a841829` | `eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d` |
| **Exp 8A Research Final Epoch** | Tier 2 | `artifacts/fracture_v2/exp8/experiment8a_final_model.pt` | 45,839,337 | `aadf2b8fc1c00fa4750a8873b8042888` | `81ea709e76245ed6b60930154b8f5823930d8a271cccd70d3075ce71b9c71654` |
| **Exp 5 YOLOv8n Bounding Box** | Tier 2 | `artifacts/fracture_v2/exp5/best_model.pt` | 24,436,327 | `ece51c07eaab354f25f53f99b104dc03` | `798743327dbee442cf52151237544e2b00b628daec9fc6b7b7e0e860ad6161ee` |

---

## 5. Model Promotion Governance Workflow

To promote any future research candidate (including Experiment 8A) into active clinical production, the following mandatory six-stage governance gate must be satisfied:

```
[Mandatory Six-Stage Model Promotion Gateway]
Stage 1: Offline Research Freeze & Checkpoint Hashing
     │
     ▼
Stage 2: Independent External Validation (Multi-Center & Normal Controls)
     │
     ▼
Stage 3: Clinical Safety & Calibration Review (ECE < 0.100, Brier < 0.150)
     │
     ▼
Stage 4: Shadow-Deployment Staging Integration (ShadowInferenceService)
     │
     ▼
Stage 5: Live API Contract Verification & Automated Regression Tests
     │
     ▼
Stage 6: Clinical Governance Board Sign-Off & Cutover (Zero Downtime)
```

1. **Stage 1 — Formal Freeze & Hashing:** Creation of a signed freeze manifest containing immutable Git commit hashes, dataset partition manifests, and cryptographic binary checksums (achieved for Exp 8A via `EXPERIMENT_8A_FREEZE_MANIFEST.json`).
2. **Stage 2 — External Multi-Center Validation:** Model must be evaluated on an independent external cohort collected from distinct healthcare facilities and imaging hardware (achieved for Exp 8A via Shenzhen Children's Hospital $N=1,053$, plus Normal Controls $N=251$).
3. **Stage 3 — Calibration & Bias Audit:** Brier score, Expected Calibration Error, and anatomical/demographic subgroup performance must be evaluated to ensure absence of algorithmic bias.
4. **Stage 4 — Shadow-Mode Execution:** The research candidate must run in "shadow mode" alongside the production baseline, processing live clinical encounters in parallel to verify system latency and pipeline resilience without surfacing outputs to patients.
5. **Stage 5 — Automated Regression Suite:** Model must pass 100% of integration checks in the automated test suite (`ai-prediction-service/tests/`, 69 tests).
6. **Stage 6 — Formal Board Approval:** Unanimous sign-off from the Medical Advisory Board, Chief Clinical Informatics Officer, and Lead Platform Engineer.

---

## 6. Real-Time Operational Auditing & Event Streaming

All inference requests across the four clinical modules are continuously monitored and logged:
- **Event Bus:** Every successful inference execution triggers an automated Kafka message published to topic `medimind.predictions`.
- **Payload Schema:** Emits patient reference ID, prediction UUID, module identifier, assigned risk badge, and originating gateway timestamp.
- **Database Persistence:** MongoDB collections `medimind_ai.predictions` records the complete inference payload, including raw inputs, model name, model version, execution latency, and mandatory disclaimer text.
- **Tenant Isolation:** Enforces multi-hospital tenant scoping across all clinical review dashboards, ensuring patient predictions remain strictly compartmentalized.
