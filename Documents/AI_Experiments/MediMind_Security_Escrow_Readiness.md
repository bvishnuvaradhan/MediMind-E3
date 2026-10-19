# MediMind — Security & Escrow Readiness: SRE / Security Lead Configuration Contract

**Document Version:** 1.0.0  
**Target Reviewer:** Lead Security Engineer & Principal SRE Architect  
**Governance Scope:** Stage 2 Diabetes Shadow Evaluation — External KMS Key Management & Secure Escrow Storage  
**Current Domain Status:** **`BLOCKED (INFRASTRUCTURE UNPROVISIONED)`**  
**Review Target Date:** October 2026  
**Repository:** `D:\projects\MediMind`  

---

## 1. Executive Summary & Blocker Description

Domain 3 of the `GovernanceActivationGate` (`security_key_mgmt_and_linkage_escrow`) is currently **`BLOCKED`**.

The cryptographic correlation token generation and outcome-linkage escrow require an external, enterprise-grade Key Management Service (KMS) symmetric key. Production infrastructure provisioning has intentionally not occurred in local code to prevent credentials or secrets from being stored in source control.

> [!WARNING]
> Shadow evaluation cannot activate while this domain remains `BLOCKED`. The programmatic gate (`GovernanceActivationGate.is_activation_cleared()`) explicitly checks `SecureOutcomeEscrowInterface.is_escrow_ready()`, which fails closed if `MEDIMIND_ESCROW_HMAC_SECRET` is unset.

---

## 2. Infrastructure Configuration Contract

The Security and SRE teams must provision and inject the following configuration:

### 2.1 External KMS Secret Specification
- **Secret Name:** `medimind/prod/shadow-eval/escrow-hmac-key`
- **Key Type:** 256-bit symmetric HMAC key (AES/HMAC-SHA-256 compatible).
- **Entropy Requirement:** Minimum 32 cryptographically random bytes (Base64 or Hex encoded).
- **Runtime Environment Variable:** `MEDIMIND_ESCROW_HMAC_SECRET`
- **KMS Service Target:** AWS KMS, Azure Key Vault, or HashiCorp Vault.
- **Source Control Invariant:** The secret MUST NEVER be placed in Git, `.env` files committed to repository, or hardcoded in python source code.

### 2.2 Secure Escrow Storage Specification
- **Filesystem Target:** Dedicated encrypted block volume mounted at:  
  `artifacts/experiments/shadow_diabetes_eval/escrow_store/`
- **Operating System File Permissions:** `0700` (directory), `0600` (linkage mapping file `linkage_escrow_records.jsonl`).
- **Encryption at Rest:** AES-256 with KMS-managed encryption keys.

---

## 3. Operational Protocols for Security & SRE

### 3.1 Key Rotation Protocol (90-Day Lifecycle)
1. **Generation:** SRE provisions a new 256-bit key version in KMS (`version_N+1`).
2. **Dual-Key Verification Window:** The escrow interface accepts tokens signed with `version_N` for outcome adjudication while generating new tokens with `version_N+1`.
3. **Old Key Deprecation:** Following the 90-day post-encounter adjudication window, `version_N` is revoked and cryptographically retired.

### 3.2 Access Auditing & Monitoring
Every invocation of `SecureOutcomeEscrowInterface.retrieve_linkage()` or `record_linkage_mapping()` generates an immutable security audit event containing:
- `timestamp_utc`
- `caller_role` (Must be `ADJUDICATION_OFFICER` or `SYSTEM_ESCROW`)
- `correlation_id` queried
- `client_ip` / `host_id`
- `access_decision` (`GRANTED` or `DENIED`)

### 3.3 Backup, Retention & Incident Response
- **Cold Backups:** Daily encrypted snapshot of `escrow_store/` pushed to isolated disaster recovery bucket with a 180-day TTL lifecycle rule.
- **Emergency Revocation:** In the event of suspected key compromise, SRE updates `MEDIMIND_ESCROW_HMAC_SECRET` and triggers `GovernanceActivationGate.record_domain_approval(..., is_revoked=True)`, immediately shutting down shadow evaluation across all nodes in $< 1\text{ second}$.

---

## 4. Provisioning Verification Checklist

Before unblocking Domain 3, SRE must complete and verify:

- [ ] Provision 256-bit HMAC key in enterprise KMS.
- [ ] Configure secure runtime injection of `MEDIMIND_ESCROW_HMAC_SECRET`.
- [ ] Mount encrypted volume for `escrow_store/` with `0700/0600` permissions.
- [ ] Verify test linkage retrieval blocks unauthorized roles.
- [ ] Confirm audit logging destination is ingested by Security Information and Event Management (SIEM).

---

## 5. Formal Security & SRE Sign-Off

| Review Dimension | Decision | Comments / Notes | Sign-off Date |
| :--- | :--- | :--- | :--- |
| **KMS Secret Provisioning** | **`BLOCKED`** | *Awaiting external KMS secret setup* | Pending |
| **Encrypted Escrow Storage** | **`BLOCKED`** | *Awaiting encrypted volume mount* | Pending |
| **Key Rotation & Audit Protocol** | **`PENDING`** | *Awaiting SRE operational sign-off* | Pending |

**Designated Approver:** Lead Security Engineer & Lead SRE Architect  
**Signature:** `________________________________________`  
**Date:** `____ / ____ / 2026`
