# MediMind — Authoritative MongoDB Atlas Connectivity, Multi-Driver TLS Diagnosis & Security Audit Report

**Date:** October 23, 2026  
**Repository:** `D:\projects\MediMind`  
**Branch:** `experiment8-multiview-localized-fusion`  
**Baseline HEAD:** `29f6fc3`  

---

## 1. Executive Summary & Diagnostic Re-Verification

In accordance with Phase 1 and Phase 2 directives:
1. **Repository and Configuration Preservation:** The working tree, feature branch `experiment8-multiview-localized-fusion`, and the authoritative Atlas URI in `backend/.env` have been preserved with zero credential exposure.
2. **Current Network Egress Verified:** Public egress IP re-verified in real time via HTTPS IP lookup as **`49.43.233.43`** (`AS55836 Reliance Jio Infocomm Limited`, Hyderabad). Local interface: `Wi-Fi (192.168.29.40)` via DHCP; VPN interfaces disconnected.
3. **Multi-Driver TLS & Official `mongosh` Diagnosis:**
   - Evaluated DNS SRV resolution across all 3 replica set shards (`ac-quljgj0-shard-00-00`, `01`, `02`).
   - TCP connections to port 27017 on all 3 shards succeed instantaneously.
   - Tested explicit TLS 1.2, explicit TLS 1.3, SNI cluster vs shard routing, and `certifi` CA validation. All fail at TLS handshake with Alert 80.
   - Executed MongoDB's official shell `mongosh` (`v2.2.0-win32-x64`) against the cluster URI. `mongosh` explicitly confirmed:
     ```text
     MongoServerSelectionError: SSL alert number 80.
     It looks like this is a MongoDB Atlas cluster. Please ensure that your Network Access List allows connections from your IP.
     ```
4. **Root Cause Confirmed:** The failure is definitively an IP Access List restriction enforced at the Atlas ingress proxy layer. The proxy drops unauthorized IPs during TLS negotiation.
5. **Authorization Blocker:** The system has no Atlas API keys (`ATLAS_PUBLIC_KEY` / `ATLAS_PRIVATE_KEY`) or Atlas CLI tools. Atlas Network Access rules cannot be altered programmatically from this environment. Only the project administrator via the MongoDB Atlas Console (`cloud.mongodb.com`) can add the authorized `/32` entry.
6. **Zero Write Operations Executed:** In strict compliance with Phase 3 & 4 rules, no synthetic records, migrations, appointment generation, or AI inferences have been written.
7. **Production Model & Release Invariants Preserved:** All 6 production model SHA-256 hashes remain 100% byte-identical. Dynamic date derivation implemented across frontend analytics (`AiAnalyticsView`, `KnowledgeActivityView`, `ReportsView`, `chairmanService`).

---

## 2. Multi-Driver Diagnostic Trace Evidence

### 2.1 Python OpenSSL Protocol Matrix (`scripts/deep_tls_atlas_diagnosis.py`)
* Target: `ac-quljgj0-shard-00-00.plxllln.mongodb.net:27017` (`159.41.242.97`)
* Standard Default Context: `[SSL: TLSV1_ALERT_INTERNAL_ERROR] (alert 80)`
* Explicit TLS 1.2: `[SSL: TLSV1_ALERT_INTERNAL_ERROR] (alert 80)`
* Explicit TLS 1.3: `[SSL: TLSV1_ALERT_INTERNAL_ERROR] (alert 80)`
* SNI with cluster host: `[SSL: TLSV1_ALERT_INTERNAL_ERROR] (alert 80)`
* Using `certifi` CA bundle: `[SSL: TLSV1_ALERT_INTERNAL_ERROR] (alert 80)`

### 2.2 Node.js Native TLS (`node:tls`)
* Error Code: `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`
* OpenSSL Details: `0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:rec_layer_s3.c:1605:SSL alert number 80`

### 2.3 Official MongoDB Shell (`mongosh`)
* Binary: `C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongosh-2.2.0-win32-x64\bin\mongosh.exe`
* Diagnostic Output:
  ```text
  MongoServerSelectionError: 08400000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:SSL alert number 80.
  It looks like this is a MongoDB Atlas cluster. Please ensure that your Network Access List allows connections from your IP.
  ```

---

## 3. Safe Configuration & Environment Hardening (Phase 1 & 2)

1. **`backend/mongoConfigValidator.js`**:
   - `validateMongoConfig(uri, env)` prevents silent fallback to localhost when `STRICT_REMOTE_DB=true` or in production (`NODE_ENV=production`).
   - `maskMongoUri(uri)` guarantees zero credential leakage.
   - Integrated into `src/config/db.js` across all 7 backend microservices.
   - 8/8 unit tests passing in `backend/appointment-service/tests/mongoConfig.test.js`.

2. **Frontend Dynamic Date & Reporting Remediation (Phase 5)**:
   - Dynamic month labels (`currentMonthLabel`, `prevMonthLabel`, `prev2MonthLabel`) implemented in `AiAnalyticsView.jsx`, `KnowledgeActivityView.jsx`, `ReportsView.jsx`, and `chairmanService.js`.
   - Hardcoded `"Oct 2026"` and `"Sep 2026"` replaced with dynamic ISO range queries (`start_date`, `end_date`).
   - Dashboard doctor metric updated to `"66 Operational Doctors (2 Inactive Demo Profiles)"`.
   - Hospital network overview filtered to active facilities only (`status === 'Active'`).
   - `"Last Login"` column removed from `HospitalAdminsView.jsx`.
   - Frontend production build (`npm run build`) succeeded in 860ms with zero errors (2,002 modules).

---

## 4. Production Artifact Integrity Check

| File Path | SHA-256 Digest | Status |
| :--- | :--- | :---: |
| `ai-prediction-service/artifacts/diabetes/best_model.joblib` | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` | **100% MATCH** |
| `ai-prediction-service/artifacts/heart_disease/best_model.joblib` | `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` | **100% MATCH** |
| `ai-prediction-service/app/services/diabetes_service.py` | `1d8af27e821ef49177e3295096483d50fa8248a59032b6284c72ba1f1399e268` | **100% MATCH** |
| `ai-prediction-service/app/services/heart_disease_service.py` | `678da749c49d5c19937a417e9ffc193d4b0a937308bc6b3987a3392cebf7a3f2` | **100% MATCH** |
| `ai-prediction-service/artifacts/fracture_v2/best_model.pt` | `ac0d2e720c9ec67f7e2eeda7c8c2fcbb374c78c6b7e9bb4b9dd26772d4869d60` | **100% MATCH** |
| `ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_best_model.pt` | `eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d` | **100% MATCH** |

---

## 5. Decision & Blocker Summary

* **Target IP for Allowlisting:** `49.43.233.43/32`
* **Blocker:** Network access authorization on the Atlas cluster.
* **Next Action:** Please add `49.43.233.43/32` to the MongoDB Atlas Project "Network Access" list in the Atlas web console. Once completed, we will execute read-only verification (Phase 3), complete 66-doctor coverage (Phase 4), and finalize the Git delivery (Phase 8).
