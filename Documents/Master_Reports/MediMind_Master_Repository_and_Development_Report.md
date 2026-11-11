# MediMind — Master Repository Governance & Development Standards Report

**Document ID:** `MM-MASTER-009`  
**Document Class:** Repository Governance, Code Hygiene & Curation Standards  
**Publication Date:** November 4, 2026  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  
**Authors:** Lead Repository Maintainer & Principal Software Architect  

---

## 1. Executive Summary

A clean, predictable, and maintainable repository architecture is essential for team productivity, automated CI/CD pipelines, and long-term research reproducibility. This Master Repository Governance Report documents the standards, cleanup policies, directory taxonomy, and testing requirements governing the MediMind codebase.

It outlines the rationalization progression across Phase 1 and Phase 2, establishing the canonical organization of project documentation and defining the two-stage quarantine workflow.

---

## 2. Repository Directory Organization

The repository enforces a structured, domain-isolated directory layout:

```
D:\projects\MediMind\
├── .gitignore                                # Excludes env, node_modules, build caches, binary docs
├── README.md                                 # Authoritative project entry point & overview
├── MediMind_Data_Science_Case_Study_Updated.docx # Authoritative 28-page academic case study
├── MediMind_Data_Science_Case_Study_Updated.pdf  # Native Word high-fidelity PDF export
├── MediMind_Case_Study_Update_Audit.md       # Case study validation audit
│
├── Documents/                                # Central documentation root
│   ├── Master_Reports/                       # 9 Canonical Master Synthesis Reports (MM-MASTER-001 to 009)
│   ├── AI_Experiments/                       # Core model benchmark & experiment documentation
│   ├── Production_Readiness_Audit/           # Deployment gate audits & role test matrices
│   └── MediMind_Role_Credentials.xlsx        # Authoritative 9-sheet master credentials workbook
│
├── backend/                                  # Distributed Node.js / Express microservices
│   ├── api-gateway/                          # Reverse proxy & JWT validation (Port 5000)
│   ├── auth-service/                         # Authentication & user directory (Port 5001)
│   ├── family-service/                       # Family member governance (Port 5002)
│   ├── hospital-service/                     # Facility & department directory (Port 5003)
│   ├── doctor-service/                       # Doctor profiles & availability (Port 5004)
│   ├── appointment-service/                  # Booking & lifecycle state machine (Port 5005)
│   ├── medical-record-service/               # Consultations & e-prescriptions (Port 5006)
│   └── knowledge-service/                    # Medical articles & educational guides (Port 5008)
│
├── ai-prediction-service/                    # Python / FastAPI AI Microservice (Port 5007)
│   ├── app/                                  # API routes, middleware, and inference models
│   ├── artifacts/                            # Trained model weights, scalers, and manifests
│   │   ├── heart_disease/best_model.joblib   # Calibrated Random Forest (32.6 MB)
│   │   ├── diabetes/best_model.joblib        # Calibrated MLP (30 KB)
│   │   ├── fracture/best_model.pt            # Production ResNet-18 baseline
│   │   └── fracture_v2/                      # Research Experiments 1–8A artifacts
│   ├── test-dataset/                         # Original research datasets & gold-standard Excel
│   └── tests/                                # Automated PyTest suite (test_auth.py, etc.)
│
├── frontend/                                 # Modern React 18 / Vite / Tailwind Web Application
│   ├── src/components/                       # Role-isolated views (Chairman, HA, DH, Doctor, Family)
│   └── e2e/                                  # Playwright end-to-end integration test suites
│
└── soa-demo/                                 # Isolated demonstration environment (Kafka / Eureka demo)
```

---

## 3. Two-Stage Cleanup & Quarantine Protocol

To guarantee that no required code, dataset, or historical evidence is lost during repository maintenance:
1. **Stage 1 (Audit & Quarantine)**:
   - Identify candidate redundant or superseded files through recursive filesystem analysis.
   - Verify that all unique evidence and numerical findings are fully consolidated in the Master Reports.
   - Check all code, test, and documentation dependencies.
   - Move confirmed removable files into an isolated quarantine folder (`_quarantine_phase2/`), recording relative paths, file sizes, and cryptographic MD5 hashes in `quarantine_manifest.json`.
2. **Stage 2 (Verification & Final Deletion)**:
   - Execute regression test suites (`test_auth.py`, test dataset validations, e2e smoke tests).
   - Verify that Git status remains clean with zero broken working tree files.
   - Permanently remove quarantined files only after successful validation.
   - Retain the quarantine manifest and generate the final audit report.

---

## 4. Protected Asset Invariant Rules

The following repository assets are strictly protected under repository policy:
- **Never Delete or Alter**:
  1. Original research datasets (`ai-prediction-service/test-dataset/General Health/*.xlsx`, FracAtlas, MURA, GRAZ, PediURF).
  2. Model weight checkpoints (`best_model.joblib`, `best_model.pt`, `experiment8a_best_model.pt`).
  3. Authoritative credential workbooks (`Documents/MediMind_Role_Credentials.xlsx`).
  4. Environment files (`.env`, `.env.local`) and Git internals (`.git`).
  5. Uncommitted working tree modifications.
  6. Automated test suites and fixtures.

---

## 5. Consolidated Source Reports

This master report synthesizes and supersedes:
- `MediMind_Repository_Cleanup_Report.md`
- `Documents/MediMind_Excel_Workbook_Reconciliation_and_Cleanup_Audit.md`
- `Documents/Production_Readiness_Audit/MediMind_Cleanup_Manifest.md`
- `Documents/AI_Experiments/MediMind_Repository_Cleanup_and_PreRelease_Report.md`
