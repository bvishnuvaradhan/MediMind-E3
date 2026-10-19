# MediMind — Stage 2 Diabetes Shadow Operations Runbook

**Document Version:** 1.0.0  
**Effective Date:** October 19, 2026  
**Operational Scope:** Site Reliability Engineering (SRE), MLOps & Clinical AI Operations  
**System Component:** `ai-prediction-service` / `shadow_diabetes_service.py`  
**Runbook ID:** MM-OPS-RB-2026-DIAB-SHADOW-02  

---

## 1. System Overview & Current Architecture

The MediMind Diabetes Shadow Evaluation system enables continuous prospective evaluation of two experimental candidate models without affecting production clinical workflows:
- **Baseline Serving Pipeline:** `app/services/diabetes_service.py` (serving `artifacts/diabetes/best_model.joblib`).
- **Shadow Pipeline:** `app/services/shadow_diabetes_service.py` (evaluating `appC_mlp_6layer_bottleneck_gelu` and `appA_extratrees`).
- **Environment Flags:**
  - `ENABLE_DIABETES_SHADOW_EVAL=false` (Default, dormant state).
  - `ENABLE_STAGING_DIABETES=false` (Default, isolated staging adapter dormant state).

---

## 2. Activation & Enablement Procedure

> [!WARNING]
> Do NOT activate shadow evaluation in production without written authorization from the Chief Medical Officer (CMO) and Lead Platform Architect as recorded in the Governance Checklist (`MediMind_Diabetes_Shadow_Governance_Checklist.md`).

### Step 2.1: Verify Candidate Model File Integrity
Ensure the SHA-256 hashes of the candidate model files match the registered baseline:
```powershell
python -c "
import hashlib
files = [
    'artifacts/experiments/benchmark_four_approaches_20261019/diabetes_appC_mlp_6layer_bottleneck_gelu.joblib',
    'artifacts/experiments/benchmark_four_approaches_20261019/diabetes_appA_extratrees.joblib',
    'artifacts/experiments/benchmark_four_approaches_20261019/training_medians.joblib'
]
for f in files:
    with open(f, 'rb') as fp:
        print(f'{f}: {hashlib.sha256(fp.read()).hexdigest()}')
"
```
*Expected Hashes:*
- `diabetes_appC_mlp_6layer_bottleneck_gelu.joblib`: `26b3a2ae31a19f4a0c84138e6dfd15ee6a17b2b6c7ce1a5401bb26400dbb6be0`
- `diabetes_appA_extratrees.joblib`: `c0fe202b2de047cb56247fb0dbe422c5e5aa495f2a1b948dc2a046ce59ec47b5`
- `training_medians.joblib`: `4a49646452288924b1ae1d62c1257410c55fbcbe4bcfa2763f91ba40a7cf3957`

### Step 2.2: Set Runtime Environment Flag
In the target environment configuration (`.env` or container environment):
```bash
ENABLE_DIABETES_SHADOW_EVAL=true
```

### Step 2.3: Graceful Service Reload
Restart the `ai-prediction-service` process:
```powershell
# In PowerShell:
Restart-Service -Name "MediMind-AIPredictionService"
# Or restart container:
docker restart medimind-ai-prediction-service
```

### Step 2.4: Immediate Health Verification
Verify that the service is running, production predictions return $200\text{ OK}$, and the shadow service initializes:
```powershell
curl -X POST http://localhost:8001/predict/diabetes `
  -H "Content-Type: application/json" `
  -d '{"pregnancies": 2, "glucose": 130, "blood_pressure": 70, "skin_thickness": 25, "insulin": 100, "bmi": 28.5, "diabetes_pedigree_function": 0.45, "age": 42}'
```
Check application log for:
`[SHADOW] Diabetes shadow evaluation service initialized in ACTIVE mode.`

---

## 3. Daily Operational Monitoring Checklist

Site Reliability Engineers and MLOps on-call must perform the following checks daily at 09:00 UTC:

| Check Item | Command / Location | Nominal Expected Range | Action if Breached |
| :--- | :--- | :--- | :--- |
| **Shadow Error Rate** | Check `shadow_accounting_ledger.json` (`failed_requests` / `eligible_requests`) | $0.0\%$ (Zero failures) | Inspect crash trace in log; if $>1\%$, trigger emergency rollback. |
| **Inference Latency** | High-resolution telemetry in `shadow_diabetes_service.py` | p95 $< 50\text{ ms}$ (C), $< 20\text{ ms}$ (A) | If p95 $> 100\text{ ms}$, initiate throttling or disable shadow. |
| **Memory Utilization** | `Get-Process python` or `docker stats` | Stable, $< 500\text{ MB}$ RSS | If memory grows monotonically, restart service and run leak profile. |
| **Eligibility Ratio** | `eligible_requests` / `total_requests` | $60\% - 90\%$ | If $< 20\%$, check upstream scope header forwarding. |
| **Ledger Integrity** | Check JSON syntax of `shadow_accounting_ledger.json` | Valid parse, updated timestamp | Restore ledger from daily backup if corrupted. |

---

## 4. Emergency Rollback & Circuit Breaker Protocol

If any of the following critical trigger conditions occur:
1. Candidate inference causes service memory to exceed $1.0\text{ GB}$.
2. Production request latency p99 increases by more than $50\text{ ms}$.
3. Unhandled exception in shadow boundary leaks into production thread.
4. Data privacy violation or un-pseudonymized identifier detected in shadow log.

### Immediate Rollback Procedure:
```powershell
# 1. Flip flag immediately in environment
$env:ENABLE_DIABETES_SHADOW_EVAL = "false"

# 2. Restart AI prediction service to drop background shadow evaluation
Restart-Service -Name "MediMind-AIPredictionService"

# 3. Verify production recovery
curl http://localhost:8001/health

# 4. Notify AI Governance Officer and SRE Lead immediately
```
Recovery time objective (RTO): $< 2\text{ minutes}$.

---

## 5. Outcome Adjudication & Reconciliation Workflow

At day 30 of the evaluation period, execute the clinical adjudication reconciliation:

1. **Export Adjudication Ground Truth:** Securely export adjudicated outcomes from the Electronic Health Record (EHR) registry containing `[correlation_id, true_outcome_binary, adjudication_date]`.
2. **Ingest Outcomes:**
```powershell
python -c "
from app.services.shadow_diabetes_service import ShadowDiabetesEvaluationService
import json

service = ShadowDiabetesEvaluationService()
with open('secure_adjudicated_outcomes.json') as f:
    records = json.load(f)

for r in records:
    service.record_adjudicated_outcome(r['correlation_id'], r['true_outcome'], r.get('notes', ''))

metrics = service.calculate_prospective_metrics()
print(json.dumps(metrics, indent=2))
"
```
3. **Compare Against Predeclared Gates:** Run `Documents/AI_Experiments/MediMind_Diabetes_Shadow_Status_Report.md` evaluation matrix.
