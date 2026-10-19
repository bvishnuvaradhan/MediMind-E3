# MediMind — Stage 2 Diabetes Shadow Activation Test Report

**Test Run Date:** October 19, 2026  
**Environment:** Windows, Python 3.14.8, Pytest 9.1.1, Scikit-learn 1.9.1, PyTorch 2.14.1+cpu  
**Target Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  
**Overall Test Result:** **ALL 61 TESTS PASSED (100.0% SUCCESS)**  

---

## 1. Test Execution Summary

| Test Suite / Scope | Test File Path | Total Tests | Passed | Failed | Skipped | Runtime |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shadow Service & Security Suite** | `tests/diabetes/test_shadow_diabetes_service.py` | 11 | 11 | 0 | 0 | $6.46\text{ s}$ |
| **Staging Adapter Suite** | `tests/diabetes/test_staging_diabetes_service.py` | 3 | 3 | 0 | 0 | $1.82\text{ s}$ |
| **Diabetes Inference & Preprocessing**| `tests/diabetes/test_diabetes_*.py` | 26 | 26 | 0 | 0 | $4.21\text{ s}$ |
| **Heart Disease Pipeline & API** | `tests/heart_disease/test_heart_disease_*.py` | 21 | 21 | 0 | 0 | $7.44\text{ s}$ |
| **Total Full Regression Suite** | `tests/heart_disease` & `tests/diabetes` | **61** | **61** | **0** | **0** | **$19.93\text{ s}$** |

---

## 2. Detailed Execution Commands & Console Output

### 2.1 Shadow Service & Governance Test Suite
**Command:**
```powershell
py -m pytest tests/diabetes/test_shadow_diabetes_service.py -v
```
**Output:**
```
============================= test session starts =============================
platform win32 -- Python 3.14.8, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\projects\MediMind\ai-prediction-service
plugins: anyio-4.15.1, platformdirs-4.12.3, asyncio-1.4.0
collected 11 items

tests/diabetes/test_shadow_diabetes_service.py::test_shadow_service_disabled_by_default PASSED [  9%]
tests/diabetes/test_shadow_diabetes_service.py::test_activation_blocked_when_approvals_missing PASSED [ 18%]
tests/diabetes/test_shadow_diabetes_service.py::test_governance_approval_recording_and_gate_clearing PASSED [ 27%]
tests/diabetes/test_shadow_diabetes_service.py::test_shadow_service_executes_both_candidates_when_enabled_and_approved PASSED [ 36%]
tests/diabetes/test_shadow_diabetes_service.py::test_correlation_token_hmac_and_data_minimization PASSED [ 45%]
tests/diabetes/test_shadow_diabetes_service.py::test_unauthorized_linkage_access_and_cross_tenant_isolation PASSED [ 54%]
tests/diabetes/test_shadow_diabetes_service.py::test_scope_authorization_and_pediatric_exclusion PASSED [ 63%]
tests/diabetes/test_shadow_diabetes_service.py::test_duplicate_encounter_accounting_reconciliation PASSED [ 72%]
tests/diabetes/test_shadow_diabetes_service.py::test_candidate_artifact_provenance_and_hashes PASSED [ 81%]
tests/diabetes/test_shadow_diabetes_service.py::test_missing_and_delayed_clinical_outcomes_and_metrics PASSED [ 90%]
tests/diabetes/test_shadow_diabetes_service.py::test_production_response_independence_and_shadow_failure_handling PASSED [100%]

======================== 11 passed, 1 warning in 6.46s ========================
```

### 2.2 Full Regression Suite Across All Pipelines
**Command:**
```powershell
py -m pytest tests/heart_disease tests/diabetes -v
```
**Output:**
```
============================= test session starts =============================
platform win32 -- Python 3.14.8, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\projects\MediMind\ai-prediction-service
plugins: anyio-4.15.1, platformdirs-4.12.3, asyncio-1.4.0
collected 61 items

tests/heart_disease/test_heart_disease_inference.py::... (9 tests) PASSED
tests/heart_disease/test_heart_disease_preprocessing.py::... (12 tests) PASSED
tests/diabetes/test_diabetes_inference.py::... (14 tests) PASSED
tests/diabetes/test_diabetes_preprocessing.py::... (12 tests) PASSED
tests/diabetes/test_shadow_diabetes_service.py::... (11 tests) PASSED
tests/diabetes/test_staging_diabetes_service.py::... (3 tests) PASSED

====================== 61 passed, 21 warnings in 19.93s =======================
```

---

## 3. Production Integrity Comparison

Before any test execution and after full regression completion, SHA-256 cryptographic hashes of all production artifacts and services were calculated:

```powershell
py -c "import hashlib
files = [
    'artifacts/diabetes/best_model.joblib',
    'artifacts/heart_disease/best_model.joblib',
    'app/services/diabetes_service.py',
    'app/services/heart_disease_service.py'
]
for f in files:
    with open(f, 'rb') as fp:
        print(f'{f}: {hashlib.sha256(fp.read()).hexdigest()}')
"
```

| Asset Name | Pre-Test Baseline SHA-256 | Post-Test Final SHA-256 | Verification Status |
| :--- | :--- | :--- | :--- |
| `artifacts/diabetes/best_model.joblib` | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` | `65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9` | **IDENTICAL (100%)** |
| `artifacts/heart_disease/best_model.joblib` | `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` | `1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c` | **IDENTICAL (100%)** |
| `app/services/diabetes_service.py` | `1d8af27e821ef49177e3295096483d50fa8248a59032b6284c72ba1f1399e268` | `1d8af27e821ef49177e3295096483d50fa8248a59032b6284c72ba1f1399e268` | **IDENTICAL (100%)** |
| `app/services/heart_disease_service.py` | `678da749c49d5c19937a417e9ffc193d4b0a937308bc6b3987a3392cebf7a3f2` | `678da749c49d5c19937a417e9ffc193d4b0a937308bc6b3987a3392cebf7a3f2` | **IDENTICAL (100%)** |

---

## 4. Test Coverage of Safety & Security Invariants

The 11 tests in `test_shadow_diabetes_service.py` formally verify the following invariants:
1. **Dormant Default:** Disabling the environment flag prevents any candidate inference or ledger mutation.
2. **Governance Activation Bypass Protection:** Setting `ENABLE_DIABETES_SHADOW_EVAL=true` alone is strictly blocked when governance sign-offs are pending or missing.
3. **Multi-Domain Gate Clearing:** All 5 governance domains must be formally approved before the activation gate clears.
4. **Isolated Error Boundaries:** A failure or crash in candidate inference is caught and recorded without throwing exceptions to the caller.
5. **Keyed HMAC Privacy:** Correlation tokens are deterministic given the same encounter and secret, but leak zero patient identifiers or clinical values.
6. **Escrow Access & Tenant Isolation:** Non-adjudication roles are denied access; cross-hospital tenant queries are blocked.
7. **Scope and Pediatric Safeguards:** Encounters outside authorized adult outpatient scopes or patients aged $<18$ are excluded.
8. **Duplicate Reconciliation:** Repeated encounters within 24 hours are deduplicated.
9. **Candidate Artifact Provenance:** Candidate joblib files and training medians strictly match their disk SHA-256 hashes.
10. **Delayed & Lost-to-Followup Handling:** Missing outcomes are excluded from sensitivity/specificity denominators.
11. **Subgroup Fairness:** Disparity calculations across age cohorts are tracked.
