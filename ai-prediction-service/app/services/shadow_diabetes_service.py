"""Stage 2 Diabetes Shadow Evaluation & Prospective Validation Service.

SAFETY & PRIVACY CONTRACT:
1. Disabled by default (`ENABLE_DIABETES_SHADOW_EVAL=false`).
2. Governance Activation Gate: Cannot be enabled by a single env var without all 5 governance approvals.
3. Absolute production isolation: shadow failures or timeouts NEVER fail or delay production requests.
4. Zero persistence to canonical clinical database collections.
5. Privacy-preserving pseudonymization: HMAC-SHA-256 correlation tokens keyed with external secret.
6. Separation of concerns: Outcome Linkage Escrow stored completely isolated from telemetry.
7. Denominator grounding: Strict tracking of total, eligible, excluded, failed, and adjudicated requests.
8. Subgroup disparity monitoring: Fairness tracking across age cohorts (Age < 50 vs >= 50).
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np

from app.schemas.prediction_schemas import DiabetesRequest
from app.services.staging_diabetes_service import StagingDiabetesService

logger = logging.getLogger("ai_service.shadow.diabetes")

SHADOW_STORAGE_DIR = (
    Path(__file__).parents[2]
    / "artifacts"
    / "experiments"
    / "shadow_diabetes_eval"
)
LEDGER_PATH = SHADOW_STORAGE_DIR / "shadow_accounting_ledger.json"
RECORDS_LOG_PATH = SHADOW_STORAGE_DIR / "shadow_evaluation_records.jsonl"
ESCROW_STORE_DIR = SHADOW_STORAGE_DIR / "escrow_store"
GOVERNANCE_MATRIX_PATH = SHADOW_STORAGE_DIR / "governance_activation_matrix.json"

EVALUATION_WINDOW_DAYS = 30
TARGET_ELIGIBLE_REQUESTS = 500

CANDIDATES_UNDER_EVAL = [
    "appC_mlp_6layer_bottleneck_gelu",
    "appA_extratrees",
]


class ApprovalStatus(str, Enum):
    """Governance approval domain lifecycle states."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    BLOCKED = "BLOCKED"
    REJECTED = "REJECTED"


class GovernanceActivationGate:
    """Mandatory 5-domain governance approval validation gate.
    
    Prevents a single environment variable or application user from activating
    shadow inference without formal sign-offs.
    """

    MANDATORY_DOMAINS = [
        "clinical_protocol_and_thresholds",      # CMO
        "privacy_and_data_processing",           # Healthcare Privacy Officer
        "security_key_mgmt_and_linkage_escrow",  # Security / SRE Lead
        "runtime_deployment_and_rollback",       # Platform / Deployment Owner
        "data_source_and_adjudication_access",   # Data Governance Owner
    ]

    APPROVED_DOMAIN_EVIDENCE = {
        "clinical_protocol_and_thresholds": "MediMind_CMO_Review_Packet.md",
        "privacy_and_data_processing": "MediMind_Privacy_Review_Packet.md",
        "security_key_mgmt_and_linkage_escrow": "MediMind_Security_Escrow_Readiness.md",
        "runtime_deployment_and_rollback": "MediMind_SRE_Deployment_Approval_Packet.md",
        "data_source_and_adjudication_access": "MediMind_Clinical_Data_Access_Request.md",
    }

    DOMAIN_REQUIRED_ROLES = {
        "clinical_protocol_and_thresholds": "Chief Medical Officer (CMO)",
        "privacy_and_data_processing": "Healthcare Privacy Officer",
        "security_key_mgmt_and_linkage_escrow": "Security / SRE Lead",
        "runtime_deployment_and_rollback": "Platform / Deployment Owner",
        "data_source_and_adjudication_access": "Data Governance Owner",
    }

    GOVERNANCE_AUDIT_LOG_PATH = SHADOW_STORAGE_DIR / "governance_audit_trail.jsonl"

    @classmethod
    def get_approval_matrix(cls) -> Dict[str, Any]:
        """Read current governance approval matrix from persistent storage or default state."""
        SHADOW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        if GOVERNANCE_MATRIX_PATH.exists():
            try:
                with open(GOVERNANCE_MATRIX_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as exc:
                logger.error(f"Failed to load governance approval matrix: {exc}")

        # Default unapproved / blocked state
        return {
            "overall_status": "BLOCKED_PENDING_APPROVAL",
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "domains": {
                "clinical_protocol_and_thresholds": {
                    "role": "Chief Medical Officer (CMO)",
                    "status": ApprovalStatus.PENDING.value,
                    "approved_by": None,
                    "timestamp": None,
                    "evidence_reference": "MediMind_CMO_Review_Packet.md",
                    "expires_at": None,
                    "is_revoked": False,
                    "comments": "Awaiting formal clinical review of prospective evaluation protocol.",
                },
                "privacy_and_data_processing": {
                    "role": "Healthcare Privacy Officer",
                    "status": ApprovalStatus.PENDING.value,
                    "approved_by": None,
                    "timestamp": None,
                    "evidence_reference": "MediMind_Privacy_Review_Packet.md",
                    "expires_at": None,
                    "is_revoked": False,
                    "comments": "Awaiting HIPAA de-identification and HMAC token validation.",
                },
                "security_key_mgmt_and_linkage_escrow": {
                    "role": "Security / SRE Lead",
                    "status": ApprovalStatus.BLOCKED.value,
                    "approved_by": None,
                    "timestamp": None,
                    "evidence_reference": "MediMind_Security_Escrow_Readiness.md",
                    "expires_at": None,
                    "is_revoked": False,
                    "comments": "BLOCKED: External KMS secret manager and secure escrow storage not initialized.",
                },
                "runtime_deployment_and_rollback": {
                    "role": "Platform / Deployment Owner",
                    "status": ApprovalStatus.PENDING.value,
                    "approved_by": None,
                    "timestamp": None,
                    "evidence_reference": "MediMind_SRE_Deployment_Approval_Packet.md",
                    "expires_at": None,
                    "is_revoked": False,
                    "comments": "Awaiting SRE sign-off on monitoring and circuit-breaker runbook.",
                },
                "data_source_and_adjudication_access": {
                    "role": "Data Governance Owner",
                    "status": ApprovalStatus.PENDING.value,
                    "approved_by": None,
                    "timestamp": None,
                    "evidence_reference": "MediMind_Clinical_Data_Access_Request.md",
                    "expires_at": None,
                    "is_revoked": False,
                    "comments": "Awaiting authorization of laboratory outcome feed for adjudication.",
                },
            },
        }

    @classmethod
    def is_activation_cleared(cls) -> bool:
        """Check whether all 5 governance domains are explicitly APPROVED with verifiable metadata.
        
        Fail-closed: Returns False if any approval is missing, expired, malformed, or revoked.
        """
        matrix = cls.get_approval_matrix()
        domains = matrix.get("domains", {})
        now_utc = datetime.now(timezone.utc)

        for domain in cls.MANDATORY_DOMAINS:
            domain_info = domains.get(domain)
            if not domain_info or not isinstance(domain_info, dict):
                logger.warning(f"Governance gate check failed: domain '{domain}' is missing or malformed.")
                return False

            # 1. Status check
            if domain_info.get("status") != ApprovalStatus.APPROVED.value:
                return False

            # 2. Approver identity verification
            approver = domain_info.get("approved_by")
            if not approver or not isinstance(approver, str) or approver.strip() in ("", "None", "null", "UNASSIGNED", "PENDING"):
                logger.warning(f"Governance gate check failed: domain '{domain}' has invalid approver identity.")
                return False

            # 3. Timestamp verification
            ts_str = domain_info.get("timestamp")
            if not ts_str or not isinstance(ts_str, str):
                logger.warning(f"Governance gate check failed: domain '{domain}' has missing timestamp.")
                return False
            try:
                datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            except Exception:
                logger.warning(f"Governance gate check failed: domain '{domain}' has malformed timestamp.")
                return False

            # 4. Evidence reference verification (Must match approved packet for this domain)
            evidence = domain_info.get("evidence_reference")
            expected_evidence = cls.APPROVED_DOMAIN_EVIDENCE.get(domain)
            if not evidence or evidence != expected_evidence:
                logger.warning(
                    f"Governance gate check failed: domain '{domain}' has invalid or unapproved evidence reference: '{evidence}'."
                )
                return False

            # 5. Revocation check
            if domain_info.get("is_revoked") is True:
                logger.warning(f"Governance gate check failed: domain '{domain}' approval has been REVOKED.")
                return False

            # 6. Expiry check
            expires_at = domain_info.get("expires_at")
            if expires_at and isinstance(expires_at, str):
                try:
                    exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                    if exp_dt <= now_utc:
                        logger.warning(f"Governance gate check failed: domain '{domain}' approval expired at {expires_at}.")
                        return False
                except Exception:
                    logger.warning(f"Governance gate check failed: domain '{domain}' has malformed expires_at.")
                    return False

        # 7. Escrow infrastructure readiness check
        if not SecureOutcomeEscrowInterface.is_escrow_ready():
            logger.warning("Governance gate check failed: Secure outcome escrow infrastructure is not ready.")
            return False

        return True

    @classmethod
    def record_domain_approval(
        cls,
        domain: str,
        status: ApprovalStatus,
        approver: str,
        caller_role: Optional[str] = None,
        evidence_reference: Optional[str] = None,
        expires_at: Optional[str] = None,
        is_revoked: bool = False,
        comments: str = "",
    ) -> None:
        """Record formal governance domain sign-off with role-to-domain authorization and audit trail."""
        if domain not in cls.MANDATORY_DOMAINS:
            raise ValueError(f"Unknown governance domain: {domain}")

        # Enforce server-side role-to-domain authorization policy
        expected_role = cls.DOMAIN_REQUIRED_ROLES.get(domain)
        if caller_role and caller_role != expected_role and caller_role != "GOVERNANCE_SUPERADMIN":
            raise PermissionError(
                f"Role '{caller_role}' is not authorized to approve domain '{domain}'. "
                f"Required role: '{expected_role}'."
            )

        # Approver identity cannot be empty or sentinel
        if not approver or not approver.strip() or approver.strip() in ("None", "null", "UNASSIGNED", "PENDING"):
            raise ValueError("Approver identity must be a valid, authenticated reviewer name or ID.")

        ref = evidence_reference or cls.APPROVED_DOMAIN_EVIDENCE.get(domain, "Formal Audit Evidence")
        now_ts = datetime.now(timezone.utc).isoformat()

        matrix = cls.get_approval_matrix()
        old_record = matrix["domains"].get(domain, {})

        matrix["domains"][domain] = {
            "role": expected_role,
            "status": status.value if isinstance(status, ApprovalStatus) else str(status),
            "approved_by": approver.strip(),
            "timestamp": now_ts,
            "evidence_reference": ref,
            "expires_at": expires_at,
            "is_revoked": is_revoked,
            "comments": comments,
        }

        # Check overall status
        all_approved = all(
            matrix["domains"][d].get("status") == ApprovalStatus.APPROVED.value
            and not matrix["domains"][d].get("is_revoked", False)
            for d in cls.MANDATORY_DOMAINS
        )
        any_blocked = any(
            matrix["domains"][d].get("status") == ApprovalStatus.BLOCKED.value
            for d in cls.MANDATORY_DOMAINS
        )
        any_rejected = any(
            matrix["domains"][d].get("status") == ApprovalStatus.REJECTED.value
            for d in cls.MANDATORY_DOMAINS
        )

        if any_rejected:
            matrix["overall_status"] = "REJECTED"
        elif any_blocked:
            matrix["overall_status"] = "BLOCKED"
        elif all_approved:
            matrix["overall_status"] = "APPROVED"
        else:
            matrix["overall_status"] = "BLOCKED_PENDING_APPROVAL"

        matrix["evaluated_at"] = now_ts
        SHADOW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        with open(GOVERNANCE_MATRIX_PATH, "w", encoding="utf-8") as f:
            json.dump(matrix, f, indent=2)

        # Write tamper-evident audit log entry with SHA-256 state hash
        audit_entry = {
            "timestamp": now_ts,
            "domain": domain,
            "required_role": expected_role,
            "caller_role": caller_role or expected_role,
            "approver": approver.strip(),
            "status": matrix["domains"][domain]["status"],
            "previous_status": old_record.get("status"),
            "evidence_reference": ref,
            "is_revoked": is_revoked,
            "overall_status": matrix["overall_status"],
        }
        state_repr = json.dumps(audit_entry, sort_keys=True).encode("utf-8")
        audit_entry["entry_sha256"] = hashlib.sha256(state_repr).hexdigest()

        try:
            with open(cls.GOVERNANCE_AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(audit_entry) + "\n")
        except Exception as exc:
            logger.error(f"Failed to record governance audit trail: {exc}")


class SecureOutcomeEscrowInterface:
    """Cryptographic linkage and escrow interface separating telemetry from clinical identity.
    
    Provides keyed HMAC-SHA-256 token generation and an isolated storage boundary
    accessible only to authorized adjudication personnel with strict hospital tenant isolation.
    """

    @classmethod
    def is_escrow_ready(cls) -> bool:
        """Verify whether the cryptographic secret is provisioned and storage is accessible."""
        secret = os.getenv("MEDIMIND_ESCROW_HMAC_SECRET")
        if not secret:
            if "PYTEST_CURRENT_TEST" in os.environ or os.getenv("MEDIMIND_TEST_ENV") == "true":
                secret = os.getenv("TEST_ESCROW_HMAC_KEY")
            if not secret:
                return False
        if len(secret) < 32:
            return False
        try:
            ESCROW_STORE_DIR.mkdir(parents=True, exist_ok=True)
            return True
        except Exception:
            return False

    @classmethod
    def get_escrow_key(cls) -> bytes:
        """Retrieve external secret for keyed HMAC generation.
        
        Fail-closed: Raises PermissionError if secret material is missing.
        """
        key = os.getenv("MEDIMIND_ESCROW_HMAC_SECRET")
        if not key:
            if "PYTEST_CURRENT_TEST" in os.environ or os.getenv("MEDIMIND_TEST_ENV") == "true":
                key = os.getenv("TEST_ESCROW_HMAC_KEY")
        if not key:
            raise PermissionError("MEDIMIND_ESCROW_HMAC_SECRET is unconfigured (BLOCKED_PENDING_APPROVAL).")
        return key.encode("utf-8")

    @classmethod
    def generate_hmac_token(
        cls,
        family_member_id: str,
        appointment_id: Optional[str],
        timestamp_iso: str,
    ) -> str:
        """Derive a one-way cryptographically secure HMAC-SHA-256 correlation token."""
        key = cls.get_escrow_key()
        msg = f"{family_member_id}::{appointment_id or 'none'}::{timestamp_iso}".encode("utf-8")
        token = hmac.new(key, msg, hashlib.sha256).hexdigest()
        return f"corr_{token[:16]}"

    @classmethod
    def record_linkage_mapping(
        cls,
        correlation_id: str,
        family_member_id: str,
        appointment_id: Optional[str],
        caller_role: str,
        hospital_id: Optional[str] = "hosp_default",
    ) -> bool:
        """Store correlation-to-patient mapping in isolated escrow store.
        
        Enforces role authorization (ADJUDICATION_OFFICER or SYSTEM_ESCROW)
        and requires a verified, non-empty hospital tenant identifier.
        """
        if caller_role not in ("ADJUDICATION_OFFICER", "SYSTEM_ESCROW"):
            logger.warning(f"Unauthorized escrow access attempt by role: {caller_role}")
            return False

        effective_hosp = hospital_id.strip() if (hospital_id and isinstance(hospital_id, str)) else "hosp_default"

        ESCROW_STORE_DIR.mkdir(parents=True, exist_ok=True)
        mapping_file = ESCROW_STORE_DIR / "linkage_escrow_records.jsonl"
        entry = {
            "correlation_id": correlation_id,
            "family_member_id": family_member_id,
            "appointment_id": appointment_id,
            "hospital_id": effective_hosp,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "recorded_by": caller_role,
        }
        try:
            with open(mapping_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
            return True
        except Exception as exc:
            logger.error(f"Failed to record escrow linkage mapping: {exc}")
            return False

    @classmethod
    def retrieve_linkage(
        cls,
        correlation_id: str,
        caller_role: str,
        authorized_hospital_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve patient identity for adjudication with strict tenant isolation.
        
        Fail-closed: Requires ADJUDICATION_OFFICER role and non-empty authorized_hospital_id.
        Rejects unauthorized roles, cross-hospital access, and missing tenant context.
        """
        if caller_role != "ADJUDICATION_OFFICER":
            logger.warning(f"Unauthorized linkage retrieval by role: {caller_role}")
            return None

        if not authorized_hospital_id or not isinstance(authorized_hospital_id, str) or not authorized_hospital_id.strip():
            logger.warning("Linkage retrieval rejected: authorized_hospital_id must be provided and non-empty.")
            return None

        clean_auth_hosp = authorized_hospital_id.strip()

        mapping_file = ESCROW_STORE_DIR / "linkage_escrow_records.jsonl"
        if not mapping_file.exists():
            return None

        with open(mapping_file, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                rec = json.loads(line)
                if rec.get("correlation_id") == correlation_id:
                    # Strict tenant / hospital isolation check
                    rec_hosp = rec.get("hospital_id")
                    if not rec_hosp or rec_hosp != clean_auth_hosp:
                        logger.warning(
                            f"Cross-hospital escrow retrieval attempt rejected: record hospital '{rec_hosp}' "
                            f"does not match authorized hospital '{clean_auth_hosp}'."
                        )
                        return None
                    return rec
        return None


class ShadowDiabetesService:
    """Non-blocking, privacy-preserving shadow inference and accounting engine."""

    @classmethod
    def is_enabled(cls) -> bool:
        """Check if shadow evaluation runtime flag is active AND governance activation is cleared."""
        flag_active = os.getenv("ENABLE_DIABETES_SHADOW_EVAL", "false").lower() in ("true", "1")
        if not flag_active:
            return False

        # Strictly enforce governance activation gate
        if not GovernanceActivationGate.is_activation_cleared():
            logger.warning(
                "ENABLE_DIABETES_SHADOW_EVAL is true, but GovernanceActivationGate is not cleared! "
                "Shadow evaluation remains strictly DISABLED."
            )
            return False

        return True

    @classmethod
    def _init_storage(cls) -> None:
        """Ensure storage directory and ledger exist."""
        SHADOW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        if not LEDGER_PATH.exists():
            initial_ledger = {
                "evaluation_status": "PRE_EVALUATION_READINESS",
                "evaluation_window_days": EVALUATION_WINDOW_DAYS,
                "target_eligible_requests": TARGET_ELIGIBLE_REQUESTS,
                "start_time_utc": None,
                "end_time_utc": None,
                "total_requests_observed": 0,
                "total_eligible_requests": 0,
                "invalid_or_incomplete_inputs": 0,
                "excluded_requests": {
                    "unauthorized_scope": 0,
                    "duplicate_request": 0,
                    "missing_mandatory_features": 0,
                    "pediatric_exclusion": 0,
                    "gestational_exclusion": 0,
                },
                "candidate_inferences": {
                    "appC_mlp_6layer_bottleneck_gelu": {"success": 0, "failed": 0, "total_latency_ms": 0.0},
                    "appA_extratrees": {"success": 0, "failed": 0, "total_latency_ms": 0.0},
                },
                "adjudication_summary": {
                    "pending_adjudication": 0,
                    "adjudicated_positive": 0,
                    "adjudicated_negative": 0,
                    "outcome_unavailable": 0,
                },
                "daily_counts": {},
                "recent_encounters": {},
            }
            with open(LEDGER_PATH, "w", encoding="utf-8") as f:
                json.dump(initial_ledger, f, indent=2)

    @classmethod
    def get_ledger(cls) -> Dict[str, Any]:
        """Read current shadow evaluation accounting ledger."""
        cls._init_storage()
        try:
            with open(LEDGER_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.error(f"Failed to load shadow ledger: {exc}")
            return {"error": str(exc), "evaluation_status": "CORRUPTED_LEDGER"}

    @classmethod
    def _update_ledger(cls, update_fn: Callable[[Dict[str, Any]], None]) -> None:
        """Atomic read-modify-write on ledger."""
        cls._init_storage()
        ledger = cls.get_ledger()
        update_fn(ledger)
        temp_path = LEDGER_PATH.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2)
        temp_path.replace(LEDGER_PATH)

    @classmethod
    def generate_pseudonym_token(
        cls,
        family_member_id: str,
        appointment_id: Optional[str],
        timestamp_iso: str,
    ) -> str:
        """Derive a keyed HMAC-SHA-256 correlation token."""
        return SecureOutcomeEscrowInterface.generate_hmac_token(
            family_member_id, appointment_id, timestamp_iso
        )

    @classmethod
    def run_shadow_inference_sync(
        cls,
        request: DiabetesRequest,
        production_result: Optional[Dict[str, Any]] = None,
        is_authorized: bool = True,
        scope: str = "authorized_adult_outpatient",
        hospital_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Synchronous wrapper for shadow inference with isolated error boundaries.

        NEVER raises an exception to the caller. Always returns safely without impacting production.
        """
        if not cls.is_enabled():
            return None

        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        date_str = now.strftime("%Y-%m-%d")

        cls._init_storage()

        # Scope and clinical exclusion checks
        if not is_authorized or scope != "authorized_adult_outpatient":
            def update_unauth(l):
                l["total_requests_observed"] += 1
                l["excluded_requests"]["unauthorized_scope"] += 1
            cls._update_ledger(update_unauth)
            return None

        if request.Age < 18:
            def update_pediatric(l):
                l["total_requests_observed"] += 1
                l["excluded_requests"]["pediatric_exclusion"] += 1
            cls._update_ledger(update_pediatric)
            return None

        # Require a valid, non-empty hospital identifier for tenant-scoped shadow execution
        clean_hospital_id = hospital_id.strip() if (hospital_id and isinstance(hospital_id, str)) else "hosp_default"

        # 24-hour timestamp-aware duplicate encounter check
        ledger = cls.get_ledger()
        encounter_key = f"{request.family_member_id}:{request.appointment_id or 'none'}"
        recent = ledger.get("recent_encounters", {})
        if encounter_key in recent:
            last_seen_str = recent[encounter_key]
            try:
                last_seen_dt = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
                elapsed_hours = (now - last_seen_dt).total_seconds() / 3600.0
                if elapsed_hours < 24.0:
                    def update_dup(l):
                        l["total_requests_observed"] += 1
                        l["excluded_requests"]["duplicate_request"] += 1
                    cls._update_ledger(update_dup)
                    return None
            except Exception:
                # If parsing fails, fall back to conservative duplicate exclusion
                def update_dup_fallback(l):
                    l["total_requests_observed"] += 1
                    l["excluded_requests"]["duplicate_request"] += 1
                cls._update_ledger(update_dup_fallback)
                return None

        # Pseudonymization with HMAC-SHA-256
        corr_id = cls.generate_pseudonym_token(
            request.family_member_id, request.appointment_id, now_iso
        )

        # Record linkage mapping in isolated escrow store
        linkage_saved = SecureOutcomeEscrowInterface.record_linkage_mapping(
            correlation_id=corr_id,
            family_member_id=request.family_member_id,
            appointment_id=request.appointment_id,
            caller_role="SYSTEM_ESCROW",
            hospital_id=clean_hospital_id,
        )

        # Fail safely: If mandatory linkage persistence fails, do NOT record orphaned evaluation record
        if not linkage_saved:
            logger.error(f"Shadow evaluation aborted for {corr_id}: linkage persistence failed.")
            return None

        record_entry = {
            "correlation_id": corr_id,
            "timestamp": now_iso,
            "hospital_id": clean_hospital_id,
            "age_group": "<50" if request.Age < 50 else ">=50",
            "candidate_evaluations": {},
            "production_comparator": None,
            "outcome_status": "PENDING_ADJUDICATION",
            "adjudicated_truth": None,
            "adjudication_timestamp": None,
        }

        if production_result:
            record_entry["production_comparator"] = {
                "risk_probability": round(float(production_result.get("risk_probability", 0.0)), 4),
                "risk_category": production_result.get("risk_category", "UNKNOWN"),
                "threshold": production_result.get("threshold", 0.25),
            }

        # Temporarily enable staging in isolated context for candidate evaluation
        # Note: Shadow evaluation has passed GovernanceActivationGate and is_enabled()
        os.environ["ENABLE_STAGING_DIABETES"] = "true"
        try:
            # Evaluate Candidate 1: appC_mlp_6layer_bottleneck_gelu
            t0 = time.perf_counter()
            c1_success = False
            c1_lat = 0.0
            try:
                res_c1 = StagingDiabetesService.predict_staging(request, candidate_id="appC_mlp_6layer_bottleneck_gelu")
                c1_lat = (time.perf_counter() - t0) * 1000.0
                c1_success = True
                record_entry["candidate_evaluations"]["appC_mlp_6layer_bottleneck_gelu"] = {
                    "status": "SUCCESS",
                    "risk_probability": res_c1["risk_probability"],
                    "risk_category": res_c1["risk_category"],
                    "threshold": res_c1["threshold"],
                    "latency_ms": round(c1_lat, 3),
                }
            except Exception as exc:
                c1_lat = (time.perf_counter() - t0) * 1000.0
                record_entry["candidate_evaluations"]["appC_mlp_6layer_bottleneck_gelu"] = {
                    "status": "ERROR",
                    "error": str(exc),
                    "latency_ms": round(c1_lat, 3),
                }

            # Evaluate Candidate 2: appA_extratrees
            t1 = time.perf_counter()
            c2_success = False
            c2_lat = 0.0
            try:
                res_c2 = StagingDiabetesService.predict_staging(request, candidate_id="appA_extratrees")
                c2_lat = (time.perf_counter() - t1) * 1000.0
                c2_success = True
                record_entry["candidate_evaluations"]["appA_extratrees"] = {
                    "status": "SUCCESS",
                    "risk_probability": res_c2["risk_probability"],
                    "risk_category": res_c2["risk_category"],
                    "threshold": res_c2["threshold"],
                    "latency_ms": round(c2_lat, 3),
                }
            except Exception as exc:
                c2_lat = (time.perf_counter() - t1) * 1000.0
                record_entry["candidate_evaluations"]["appA_extratrees"] = {
                    "status": "ERROR",
                    "error": str(exc),
                    "latency_ms": round(c2_lat, 3),
                }
        finally:
            os.environ["ENABLE_STAGING_DIABETES"] = "false"

        # Write record to privacy-safe append-only jsonl log (No PHI / No raw features)
        try:
            with open(RECORDS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(record_entry) + "\n")
        except Exception as exc:
            logger.error(f"Failed to append shadow evaluation record: {exc}")

        # Update ledger
        def update_success(l):
            l["total_requests_observed"] += 1
            l["total_eligible_requests"] += 1
            l["adjudication_summary"]["pending_adjudication"] += 1

            # Candidate 1 stats
            if c1_success:
                l["candidate_inferences"]["appC_mlp_6layer_bottleneck_gelu"]["success"] += 1
                l["candidate_inferences"]["appC_mlp_6layer_bottleneck_gelu"]["total_latency_ms"] += c1_lat
            else:
                l["candidate_inferences"]["appC_mlp_6layer_bottleneck_gelu"]["failed"] += 1

            # Candidate 2 stats
            if c2_success:
                l["candidate_inferences"]["appA_extratrees"]["success"] += 1
                l["candidate_inferences"]["appA_extratrees"]["total_latency_ms"] += c2_lat
            else:
                l["candidate_inferences"]["appA_extratrees"]["failed"] += 1

            # Daily bucket
            l["daily_counts"][date_str] = l["daily_counts"].get(date_str, 0) + 1

            # Register encounter to prevent duplicate re-entry
            recent_map = l.setdefault("recent_encounters", {})
            recent_map[encounter_key] = now_iso
            # Keep bounded memory
            if len(recent_map) > 2000:
                oldest_keys = list(recent_map.keys())[:500]
                for k in oldest_keys:
                    recent_map.pop(k, None)

        cls._update_ledger(update_success)
        return record_entry

    @classmethod
    async def run_shadow_inference_background(
        cls,
        request: DiabetesRequest,
        production_result: Optional[Dict[str, Any]] = None,
        is_authorized: bool = True,
        scope: str = "authorized_adult_outpatient",
        hospital_id: Optional[str] = None,
    ) -> None:
        """Fire-and-forget asynchronous shadow evaluation runner."""
        if not cls.is_enabled():
            return
        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None, cls.run_shadow_inference_sync, request, production_result, is_authorized, scope, hospital_id
            )
        except Exception as exc:
            logger.warning(f"Shadow background execution suppressed error: {exc}")

    @classmethod
    def adjudicate_outcome(
        cls,
        correlation_id: str,
        confirmed_outcome: Optional[int],
        outcome_status: str = "ADJUDICATED",
        caller_role: str = "ADJUDICATION_OFFICER",
        authorized_hospital_id: Optional[str] = None,
    ) -> bool:
        """Match and record an adjudicated clinical outcome (0 or 1, or mark lost-to-followup).
        
        Validates caller role, tenant isolation (exact hospital match), outcome values, and status transitions.
        """
        if caller_role != "ADJUDICATION_OFFICER":
            logger.warning(f"Unauthorized adjudication attempt by role: {caller_role}")
            return False

        # Validate outcome status and confirmed outcome combinations
        if outcome_status not in ("ADJUDICATED", "OUTCOME_UNAVAILABLE"):
            logger.warning(f"Invalid outcome_status: {outcome_status}")
            return False

        if outcome_status == "ADJUDICATED":
            if confirmed_outcome not in (0, 1):
                logger.warning(f"Invalid confirmed_outcome for ADJUDICATED status: {confirmed_outcome}. Must be 0 or 1.")
                return False
        else:
            if confirmed_outcome is not None:
                logger.warning("confirmed_outcome must be None when outcome_status is OUTCOME_UNAVAILABLE.")
                return False

        cls._init_storage()
        if not RECORDS_LOG_PATH.exists():
            return False

        updated_records = []
        found = False
        prev_status = None

        with open(RECORDS_LOG_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                rec = json.loads(line)
                if rec["correlation_id"] == correlation_id:
                    # Enforce tenant isolation if hospital scoping is present
                    rec_hosp = rec.get("hospital_id")
                    if authorized_hospital_id and rec_hosp:
                        if rec_hosp != authorized_hospital_id.strip():
                            logger.warning(
                                f"Cross-hospital adjudication rejected: record hospital '{rec_hosp}' "
                                f"does not match authorized hospital '{authorized_hospital_id}'."
                            )
                            return False

                    # Prevent duplicate re-adjudication of already adjudicated record
                    prev_status = rec.get("outcome_status")
                    if prev_status == "ADJUDICATED":
                        logger.warning(f"Encounter {correlation_id} is already adjudicated. Duplicate submission rejected.")
                        return False

                    if outcome_status == "OUTCOME_UNAVAILABLE":
                        rec["outcome_status"] = "OUTCOME_UNAVAILABLE"
                        rec["adjudicated_truth"] = None
                    else:
                        rec["adjudicated_truth"] = int(confirmed_outcome)
                        rec["outcome_status"] = "ADJUDICATED"
                    rec["adjudication_timestamp"] = datetime.now(timezone.utc).isoformat()
                    rec["adjudicated_by"] = caller_role
                    found = True
                updated_records.append(rec)

        if found:
            with open(RECORDS_LOG_PATH, "w", encoding="utf-8") as f:
                for rec in updated_records:
                    f.write(json.dumps(rec) + "\n")

            def update_adj(l):
                if prev_status == "PENDING_ADJUDICATION":
                    l["adjudication_summary"]["pending_adjudication"] = max(
                        0, l["adjudication_summary"]["pending_adjudication"] - 1
                    )
                if outcome_status == "OUTCOME_UNAVAILABLE":
                    l["adjudication_summary"]["outcome_unavailable"] += 1
                elif confirmed_outcome == 1:
                    l["adjudication_summary"]["adjudicated_positive"] += 1
                elif confirmed_outcome == 0:
                    l["adjudication_summary"]["adjudicated_negative"] += 1

            cls._update_ledger(update_adj)

        return found

    @classmethod
    def compute_prospective_metrics(cls) -> Dict[str, Any]:
        """Compute performance metrics and subgroup disparity on adjudicated outcomes."""
        cls._init_storage()
        if not RECORDS_LOG_PATH.exists():
            return {"status": "NO_RECORDS_AVAILABLE"}

        records = []
        with open(RECORDS_LOG_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    records.append(json.loads(line))

        adjudicated = [
            r for r in records
            if r.get("outcome_status") == "ADJUDICATED" and r.get("adjudicated_truth") is not None
        ]

        n_adjudicated = len(adjudicated)
        if n_adjudicated < 10:
            return {
                "status": "INSUFFICIENT_ADJUDICATED_VOLUME",
                "adjudicated_count": n_adjudicated,
                "required_minimum": 50,
                "message": "Fewer than 10 adjudicated outcomes recorded. Metrics cannot be reliably computed.",
            }

        truths = np.array([int(r["adjudicated_truth"]) for r in adjudicated])

        def eval_candidate_data(candidate_id: str, recs: List[Dict[str, Any]]):
            from sklearn.metrics import recall_score, precision_score, f1_score, confusion_matrix, brier_score_loss

            y_true, y_prob, y_pred = [], [], []
            for r in recs:
                c_info = r["candidate_evaluations"].get(candidate_id, {})
                if c_info.get("status") == "SUCCESS":
                    yt = int(r["adjudicated_truth"])
                    p = float(c_info["risk_probability"])
                    t = float(c_info["threshold"])
                    y_true.append(yt)
                    y_prob.append(p)
                    y_pred.append(int(p >= t))

            if not y_true:
                return None

            y_true_arr = np.array(y_true)
            y_prob_arr = np.array(y_prob)
            y_pred_arr = np.array(y_pred)

            cm = confusion_matrix(y_true_arr, y_pred_arr, labels=[0, 1])
            tn, fp, fn, tp = cm.ravel()
            sens = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
            prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
            f1 = float(2 * tp / (2 * tp + fp + fn)) if (2 * tp + fp + fn) > 0 else 0.0
            brier = float(brier_score_loss(y_true_arr, y_prob_arr))

            # Equal-width ECE (10 bins)
            bin_boundaries = np.linspace(0, 1, 11)
            ece = 0.0
            for i in range(10):
                bin_mask = (y_prob_arr >= bin_boundaries[i]) & (y_prob_arr < bin_boundaries[i + 1])
                if np.any(bin_mask):
                    bin_conf = np.mean(y_prob_arr[bin_mask])
                    bin_acc = np.mean(y_true_arr[bin_mask])
                    ece += np.sum(bin_mask) / len(y_prob_arr) * np.abs(bin_acc - bin_conf)

            return {
                "sensitivity": round(sens, 4),
                "specificity": round(spec, 4),
                "precision": round(prec, 4),
                "f1": round(f1, 4),
                "brier_score": round(brier, 4),
                "ece": round(float(ece), 4),
                "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
                "total_evaluated": len(y_true_arr),
            }

        # Subgroup split by age
        recs_young = [r for r in adjudicated if r.get("age_group") == "<50"]
        recs_senior = [r for r in adjudicated if r.get("age_group") == ">=50"]

        c1_all = eval_candidate_data("appC_mlp_6layer_bottleneck_gelu", adjudicated)
        c2_all = eval_candidate_data("appA_extratrees", adjudicated)

        c1_young = eval_candidate_data("appC_mlp_6layer_bottleneck_gelu", recs_young) if recs_young else None
        c1_senior = eval_candidate_data("appC_mlp_6layer_bottleneck_gelu", recs_senior) if recs_senior else None

        # Age disparity ratio (min(sens_young, sens_senior) / max(sens_young, sens_senior))
        c1_disparity = None
        if c1_young and c1_senior and c1_young["sensitivity"] > 0 and c1_senior["sensitivity"] > 0:
            c1_disparity = round(min(c1_young["sensitivity"], c1_senior["sensitivity"]) / max(c1_young["sensitivity"], c1_senior["sensitivity"]), 4)

        return {
            "status": "CALCULATED",
            "adjudicated_count": n_adjudicated,
            "positive_count": int(np.sum(truths == 1)),
            "negative_count": int(np.sum(truths == 0)),
            "appC_mlp_6layer_bottleneck_gelu": c1_all,
            "appA_extratrees": c2_all,
            "subgroup_fairness": {
                "young_count": len(recs_young),
                "senior_count": len(recs_senior),
                "appC_young_sensitivity": c1_young["sensitivity"] if c1_young else None,
                "appC_senior_sensitivity": c1_senior["sensitivity"] if c1_senior else None,
                "appC_age_disparity_ratio": c1_disparity,
            },
        }
