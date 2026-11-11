# MediMind Repository Cleanup Manifest (Phase 19.1)

**Execution Date:** 2026-11-04  
**Active Branch:** `feature/medimind-soa-demo` (Ancestral Branch: `experiment8-multiview-localized-fusion`)  
**Base Commit:** `ba11bd5` (Derivation: `a83c9388c12b055fd75f719f4654bd8847c2ae4f`)  
**Audit Policy:** Strict Reference Checking & Safety Quarantine Enforcement  

---

## 1. Candidate Review & Classification Policy

In accordance with Phase 19.1 Repository Hygiene guidelines, every file and directory candidate has been audited against source code imports, build scripts, test suites, deployment configuration, and data provenance requirements:

- **`SAFE_TO_REMOVE`**: Ephemeral bytecode, test cache, transient build output, and obsolete empty quarantine holding structures with zero active dependencies.
- **`PROTECTED`**: Production database backups, clinical datasets, deep learning model weights, canonical master reports, credentials, and formal verification deliverables.
- **`REQUIRES_CONFIRMATION` / `UNCERTAIN`**: Specialized historical diagnostic, patch, and audit inspection scripts retained for audit traceability and diagnostic reproduction.

---

## 2. Candidate Evaluation Matrix

| Path | Type | Reason | Reference Check | Proposed Action | Classification |
|---|---|---|---|---|---|
| `ai-prediction-service/.pytest_cache/` | Cache Directory | Ephemeral pytest execution cache and metadata | Ignored by `.gitignore`; not referenced by source code | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/api/v1/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/core/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/middleware/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/models/diabetes/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/models/fracture/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/models/fracture_v2/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/models/general_health/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/models/heart_disease/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/schemas/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/services/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/app/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/scripts/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/tests/diabetes/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/tests/fracture/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/tests/general_health/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/tests/heart_disease/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `ai-prediction-service/tests/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `scripts/__pycache__/` | Bytecode Directory | Python `.pyc` compiled bytecode | Ephemeral runtime artifact; auto-regenerated | Remove directory | `SAFE_TO_REMOVE` |
| `frontend/dist/` | Build Output | Transient Vite build artifacts | Ignored by `.gitignore`; regenerated on `npm run build` | Remove directory | `SAFE_TO_REMOVE` |
| `_quarantine_audit/` | Quarantine Folder | Obsolete Phase 1 quarantine container | Quarantined files purged in Phase 1; only old receipt remains | Remove directory | `SAFE_TO_REMOVE` |
| `_quarantine_phase2/` | Quarantine Folder | Obsolete Phase 2 quarantine container | Quarantined files purged in Phase 2; receipt audited in Phase 3 | Remove directory | `SAFE_TO_REMOVE` |
| `backend/scripts/backups/phase17_preflight_2026-10-29T07-08-31-222Z/` | Database Backup | Point-in-time snapshot of production appointments, consultations, rxs, predictions | Critical rollback recovery artifact; contains clinical data | Retain untouched | `PROTECTED` |
| `backend/scripts/backups/appointments_noshow_pre_backup_2026-10-27T15-24-59-420Z.json` | Database Backup | Pre-noshow modification backup snapshot | Production historical snapshot | Retain untouched | `PROTECTED` |
| `backend/scripts/backups/phase12_final_prepared_manifest_20261028.json` | Data Manifest | Phase 12 prepared reconciliation manifest | Historical audit evidence | Retain untouched | `PROTECTED` |
| `backend/scripts/backups/pre_modification_414_snapshot_2026-10-28T05-22-01-349Z.json` | Database Backup | Pre-modification snapshot of 414 unclosed appointments | Discrepancy evidence cited in Phase 3 audit | Retain untouched | `PROTECTED` |
| `backend/scripts/backups/unclosed_414_change_manifest_2026-10-28T05-22-01-349Z.json` | Data Manifest | Formal change manifest for 414 unclosed candidate pool | Traceability baseline for 414 vs 274 discrepancy | Retain untouched | `PROTECTED` |
| `Documents/Master_Reports/*` (9 files) | Master Documentation | 9 Canonical MediMind Master Reports established in Phase 2 | Referenced in root `README.md` and repository index | Retain untouched | `PROTECTED` |
| `Documents/MediMind_Role_Credentials.xlsx` | Credential File | Authorized demonstration role credentials | Required for cross-role user authentication | Retain untouched | `PROTECTED` |
| `Documents/MediMind_Phase2_Repository_Rationalization_Report.md` | Historical Audit | Original Phase 2 rationalization audit report | Preserved as historical evidence | Retain untouched | `PROTECTED` |
| `Documents/MediMind_Phase2_Repository_Rationalization_Report_Corrected.md` | Audit Deliverable | Reconciled Phase 2 audit report | Authoritative reconciled rationalization record | Retain untouched | `PROTECTED` |
| `Documents/MediMind_Phase3_Repository_and_Audit_Verification_Report.md` | Audit Deliverable | Formal Phase 3 audit and verification report | Complete discrepancy resolution & evidence | Retain untouched | `PROTECTED` |
| `Documents/MediMind_Phase3_Reconciliation.json` | Machine Manifest | Phase 3 machine-readable audit metrics & SHA-256 hashes | Evidentiary verification manifest | Retain untouched | `PROTECTED` |
| `Documents/MediMind_Repository_Inventory_Phase2.json` / `.csv` | Inventory Manifest | 50,097-item repository file inventory | Full baseline repository enumeration | Retain untouched | `PROTECTED` |
| `MediMind_Case_Study_Phase3_Correction_Audit.md` | Audit Deliverable | Itemized audit log of case study corrections | Academic audit tracking record | Retain untouched | `PROTECTED` |
| `MediMind_Data_Science_Case_Study_Final.docx` / `.pdf` | Deliverable | Definitive 28-page academic Data Science Case Study | Finalized executive project deliverable | Retain untouched | `PROTECTED` |
| `ai-prediction-service/models/checkpoints/*` | Model Checkpoints | Trained PyTorch weights (ResNet-18, Multiview Fusion) | Clinical inference weights; SHA-256 verified | Retain untouched | `PROTECTED` |
| `test-dataset/*` & `datasets/*` | Evaluation Datasets | Shenzhen PediURF (2,106 images), GRAZPEDWRI-DX, FracAtlas | Clinical machine learning validation baselines | Retain untouched | `PROTECTED` |
| `backend/scripts/inspect_*.mjs` (26 scripts) | Diagnostic Scripts | Inspection and audit diagnostic utilities | Used for read-only database and schema audits | Retain untouched | `REQUIRES_CONFIRMATION` |
| `backend/scripts/probe_*.mjs` (6 scripts) | Diagnostic Scripts | Telemetry, stats, and event probe scripts | Used for service diagnostics | Retain untouched | `REQUIRES_CONFIRMATION` |
| `backend/scripts/patch_*.mjs` (10 scripts) | Migration Scripts | Historical migration scripts from Phases 12–19 | Documents exact programmatic patch lineage | Retain untouched | `REQUIRES_CONFIRMATION` |
| `backend/scripts/test_phase*.mjs` (5 scripts) | Verification Tests | Automated audit test scripts for Phases 12, 19, 20, 21 | Regression and verification harness | Retain untouched | `REQUIRES_CONFIRMATION` |
| `backend/scripts/november_manifest_*.json` (2 files) | Cohort Manifest | Manifests of 330 Atlas and 513 local advance bookings | Evidence of November advance bookings | Retain untouched | `REQUIRES_CONFIRMATION` |

---

## 3. Approved Execution Actions

In strict compliance with safety rules:
1. Only the 22 items classified as `SAFE_TO_REMOVE` (19 Python cache/bytecode folders, 1 Vite build directory, and 2 obsolete quarantine holding directories) will be removed.
2. All 18 `PROTECTED` directories and documents (backups, checkpoints, master reports, case study deliverables, inventories) will remain untouched.
3. All 49 `REQUIRES_CONFIRMATION` diagnostic/migration scripts will be preserved to maintain engineering lineage and audit reproducibility.
