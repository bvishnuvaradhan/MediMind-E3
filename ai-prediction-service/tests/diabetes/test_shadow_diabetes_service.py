"""Comprehensive Unit, Security & Governance Tests for ShadowDiabetesService."""

import hashlib
import json
from pathlib import Path
import pytest

from app.schemas.prediction_schemas import DiabetesRequest
from app.services.shadow_diabetes_service import (
    ApprovalStatus,
    GovernanceActivationGate,
    SecureOutcomeEscrowInterface,
    ShadowDiabetesService,
)


@pytest.fixture
def valid_diabetes_request():
    return DiabetesRequest(
        family_member_id="mem_shadow_test_001",
        appointment_id="apt_shadow_test_001",
        Pregnancies=2,
        Glucose=135.0,
        BloodPressure=78.0,
        SkinThickness=28.0,
        Insulin=115.0,
        BMI=30.5,
        DiabetesPedigreeFunction=0.42,
        Age=42,
    )


@pytest.fixture(autouse=True)
def clean_shadow_test_dir(tmp_path, monkeypatch):
    """Isolate shadow test files to a temporary directory."""
    test_dir = tmp_path / "shadow_test"
    test_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr("app.services.shadow_diabetes_service.SHADOW_STORAGE_DIR", test_dir)
    monkeypatch.setattr("app.services.shadow_diabetes_service.LEDGER_PATH", test_dir / "shadow_accounting_ledger.json")
    monkeypatch.setattr("app.services.shadow_diabetes_service.RECORDS_LOG_PATH", test_dir / "shadow_evaluation_records.jsonl")
    monkeypatch.setattr("app.services.shadow_diabetes_service.ESCROW_STORE_DIR", test_dir / "escrow_store")
    monkeypatch.setattr("app.services.shadow_diabetes_service.GOVERNANCE_MATRIX_PATH", test_dir / "governance_activation_matrix.json")
    monkeypatch.setenv("TEST_ESCROW_HMAC_KEY", "test_ephemeral_hmac_secret_32bytes_key!!")


@pytest.fixture
def mock_all_governance_approved(monkeypatch):
    """Helper fixture to grant all 5 governance approvals for tests that evaluate active runtime."""
    monkeypatch.setattr("app.services.shadow_diabetes_service.GovernanceActivationGate.is_activation_cleared", lambda: True)


def test_shadow_service_disabled_by_default(valid_diabetes_request, monkeypatch):
    """Verify shadow evaluation is off by default when no environment flag is set."""
    monkeypatch.delenv("ENABLE_DIABETES_SHADOW_EVAL", raising=False)
    assert not ShadowDiabetesService.is_enabled()
    res = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request)
    assert res is None


def test_activation_blocked_when_approvals_missing(valid_diabetes_request, monkeypatch):
    """Verify that setting ENABLE_DIABETES_SHADOW_EVAL=true alone is BLOCKED if approvals are missing."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")
    # By default, GovernanceActivationGate.is_activation_cleared() is False because approvals are PENDING/BLOCKED
    assert not GovernanceActivationGate.is_activation_cleared()
    assert not ShadowDiabetesService.is_enabled()

    res = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request)
    assert res is None


def test_governance_approval_recording_and_gate_clearing(monkeypatch):
    """Verify that all 5 domains must be APPROVED to clear the activation gate."""
    assert not GovernanceActivationGate.is_activation_cleared()

    # Approve 4 out of 5 domains
    domains = GovernanceActivationGate.MANDATORY_DOMAINS
    for d in domains[:-1]:
        GovernanceActivationGate.record_domain_approval(d, ApprovalStatus.APPROVED, approver="Test Approver")
        assert not GovernanceActivationGate.is_activation_cleared()

    # Approve 5th domain
    GovernanceActivationGate.record_domain_approval(domains[-1], ApprovalStatus.APPROVED, approver="Final Approver")
    assert GovernanceActivationGate.is_activation_cleared()

    matrix = GovernanceActivationGate.get_approval_matrix()
    assert matrix["overall_status"] == "APPROVED"


def test_shadow_service_executes_both_candidates_when_enabled_and_approved(
    valid_diabetes_request, mock_all_governance_approved, monkeypatch
):
    """Verify execution of both candidates when flag is true and governance is approved."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")
    assert ShadowDiabetesService.is_enabled()

    prod_mock = {"risk_probability": 0.45, "risk_category": "HIGH", "threshold": 0.25}
    res = ShadowDiabetesService.run_shadow_inference_sync(
        valid_diabetes_request, production_result=prod_mock, is_authorized=True, hospital_id="hosp_central_01"
    )

    assert res is not None
    assert "correlation_id" in res
    assert res["correlation_id"].startswith("corr_")

    evals = res["candidate_evaluations"]
    assert "appC_mlp_6layer_bottleneck_gelu" in evals
    assert "appA_extratrees" in evals

    c1 = evals["appC_mlp_6layer_bottleneck_gelu"]
    assert c1["status"] == "SUCCESS"
    assert 0.0 <= c1["risk_probability"] <= 1.0
    assert c1["threshold"] == 0.40

    c2 = evals["appA_extratrees"]
    assert c2["status"] == "SUCCESS"
    assert 0.0 <= c2["risk_probability"] <= 1.0
    assert c2["threshold"] == 0.43

    # Verify ledger updated
    ledger = ShadowDiabetesService.get_ledger()
    assert ledger["total_requests_observed"] == 1
    assert ledger["total_eligible_requests"] == 1
    assert ledger["candidate_inferences"]["appC_mlp_6layer_bottleneck_gelu"]["success"] == 1
    assert ledger["candidate_inferences"]["appA_extratrees"]["success"] == 1


def test_correlation_token_hmac_and_data_minimization(valid_diabetes_request, monkeypatch):
    """Verify HMAC token uses keyed construction and does not leak raw clinical inputs or IDs."""
    key = b"super_secret_external_kms_key_12345!"
    monkeypatch.setenv("MEDIMIND_ESCROW_HMAC_SECRET", key.decode())

    token1 = ShadowDiabetesService.generate_pseudonym_token("pat_001", "apt_001", "2026-10-19T10:00:00Z")
    token2 = ShadowDiabetesService.generate_pseudonym_token("pat_001", "apt_001", "2026-10-19T10:00:00Z")
    token_diff = ShadowDiabetesService.generate_pseudonym_token("pat_002", "apt_001", "2026-10-19T10:00:00Z")

    assert token1.startswith("corr_")
    assert token1 == token2
    assert token1 != token_diff
    # Ensure patient identifier is completely absent from correlation token
    assert "pat_001" not in token1
    assert "apt_001" not in token1


def test_unauthorized_linkage_access_and_cross_tenant_isolation(monkeypatch):
    """Verify escrow linkage restricts unauthorized roles and cross-hospital access."""
    corr_id = "corr_abc1234567890123"
    saved = SecureOutcomeEscrowInterface.record_linkage_mapping(
        correlation_id=corr_id,
        family_member_id="mem_hospA_001",
        appointment_id="apt_001",
        caller_role="SYSTEM_ESCROW",
        hospital_id="hosp_A",
    )
    assert saved is True

    # Unauthorized role rejected
    assert SecureOutcomeEscrowInterface.retrieve_linkage(corr_id, caller_role="DOCTOR") is None
    assert SecureOutcomeEscrowInterface.retrieve_linkage(corr_id, caller_role="PATIENT") is None

    # Cross-hospital unauthorized retrieval rejected
    rec_cross = SecureOutcomeEscrowInterface.retrieve_linkage(
        corr_id, caller_role="ADJUDICATION_OFFICER", authorized_hospital_id="hosp_B"
    )
    assert rec_cross is None

    # Authorized retrieval within same hospital tenant
    rec_valid = SecureOutcomeEscrowInterface.retrieve_linkage(
        corr_id, caller_role="ADJUDICATION_OFFICER", authorized_hospital_id="hosp_A"
    )
    assert rec_valid is not None
    assert rec_valid["family_member_id"] == "mem_hospA_001"


def test_scope_authorization_and_pediatric_exclusion(
    valid_diabetes_request, mock_all_governance_approved, monkeypatch
):
    """Verify unauthorized scopes and pediatric requests (<18) are excluded."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")

    # Unauthorized scope
    res_scope = ShadowDiabetesService.run_shadow_inference_sync(
        valid_diabetes_request, is_authorized=False, scope="research_export"
    )
    assert res_scope is None

    # Pediatric exclusion (Age = 16)
    pediatric_req = valid_diabetes_request.model_copy(update={"Age": 16})
    res_ped = ShadowDiabetesService.run_shadow_inference_sync(pediatric_req, is_authorized=True)
    assert res_ped is None

    ledger = ShadowDiabetesService.get_ledger()
    assert ledger["excluded_requests"]["unauthorized_scope"] == 1
    assert ledger["excluded_requests"]["pediatric_exclusion"] == 1


def test_duplicate_encounter_accounting_reconciliation(
    valid_diabetes_request, mock_all_governance_approved, monkeypatch
):
    """Verify repeated requests for the same patient and appointment within 24h are deduplicated."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")

    res1 = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request, is_authorized=True)
    assert res1 is not None

    # Repeated request
    res2 = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request, is_authorized=True)
    assert res2 is None

    ledger = ShadowDiabetesService.get_ledger()
    assert ledger["total_requests_observed"] == 2
    assert ledger["total_eligible_requests"] == 1
    assert ledger["excluded_requests"]["duplicate_request"] == 1


def test_candidate_artifact_provenance_and_hashes():
    """Verify candidate model artifacts and training medians match cryptographic hashes."""
    base_dir = Path(__file__).parents[2] / "artifacts" / "experiments" / "benchmark_four_approaches_20261019" / "diabetes"
    c1_path = base_dir / "appC_mlp_6layer_bottleneck_gelu.joblib"
    c2_path = base_dir / "appA_extratrees.joblib"
    med_path = base_dir / "training_medians.joblib"

    assert c1_path.exists()
    assert c2_path.exists()
    assert med_path.exists()

    h_c1 = hashlib.sha256(c1_path.read_bytes()).hexdigest()
    h_c2 = hashlib.sha256(c2_path.read_bytes()).hexdigest()
    h_med = hashlib.sha256(med_path.read_bytes()).hexdigest()

    assert h_c1 == "a1f15032c7115f6c45766c85aeb8dcba49dc8e7a3d39d7673289d723f3475662"
    assert h_c2 == "daf817642888e2e7daffe45c6372f9c25048b37d046597659524383f0418f245"
    assert h_med == "9917bc4082b554609e7e4fc2e9dba0fe0bc1e6ab96ef7bee4614cf04ec330885"


def test_missing_and_delayed_clinical_outcomes_and_metrics(mock_all_governance_approved, monkeypatch):
    """Verify handling of delayed outcomes, lost-to-followup, and metric calculation."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")

    corr_ids = []
    for i in range(14):
        req = DiabetesRequest(
            family_member_id=f"mem_test_{i}",
            appointment_id=f"apt_test_{i}",
            Pregnancies=i % 4,
            Glucose=110.0 + i * 5,
            BloodPressure=72.0,
            SkinThickness=28.0,
            Insulin=100.0,
            BMI=27.0 + (i % 5),
            DiabetesPedigreeFunction=0.40,
            Age=35 if i < 7 else 55,  # 7 young, 7 senior
        )
        res = ShadowDiabetesService.run_shadow_inference_sync(req, is_authorized=True)
        corr_ids.append(res["correlation_id"])

    # Adjudicate: 6 positive, 6 negative, 2 lost to followup / unavailable
    for i, cid in enumerate(corr_ids[:6]):
        ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=1, caller_role="ADJUDICATION_OFFICER")
    for i, cid in enumerate(corr_ids[6:12]):
        ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=0, caller_role="ADJUDICATION_OFFICER")
    for i, cid in enumerate(corr_ids[12:]):
        ShadowDiabetesService.adjudicate_outcome(
            cid, confirmed_outcome=None, outcome_status="OUTCOME_UNAVAILABLE", caller_role="ADJUDICATION_OFFICER"
        )

    ledger = ShadowDiabetesService.get_ledger()
    assert ledger["adjudication_summary"]["pending_adjudication"] == 0
    assert ledger["adjudication_summary"]["adjudicated_positive"] == 6
    assert ledger["adjudication_summary"]["adjudicated_negative"] == 6
    assert ledger["adjudication_summary"]["outcome_unavailable"] == 2

    metrics = ShadowDiabetesService.compute_prospective_metrics()
    assert metrics["status"] == "PROVISIONAL_VOLUME_BELOW_GATE"
    assert metrics["volume_gate_cleared"] is False
    assert metrics["required_minimum"] == 50
    assert metrics["adjudicated_count"] == 12  # Excludes lost to followup from denominator
    assert metrics["positive_count"] == 6
    assert metrics["negative_count"] == 6

    m_c1 = metrics["appC_mlp_6layer_bottleneck_gelu"]
    assert "sensitivity" in m_c1
    assert "specificity" in m_c1
    assert "ece" in m_c1
    assert "subgroup_fairness" in metrics


def test_prospective_metrics_formal_gate_at_50_outcomes(
    valid_diabetes_request, mock_all_governance_approved, monkeypatch
):
    """Verify that compute_prospective_metrics returns FORMAL_GATE_MET when >= 50 adjudicated outcomes exist."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")
    monkeypatch.setenv("MEDIMIND_ESCROW_HMAC_SECRET", "escrow_super_secret_test_key_at_least_32_bytes_long!")

    for i in range(50):
        req = valid_diabetes_request.model_copy(
            update={"family_member_id": f"mem_gate50_{i}", "appointment_id": f"apt_gate50_{i}"}
        )
        res = ShadowDiabetesService.run_shadow_inference_sync(req, is_authorized=True)
        assert res is not None, f"Shadow inference failed for iteration {i}"
        cid = res["correlation_id"]
        outcome_val = 1 if i % 2 == 0 else 0
        ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=outcome_val, caller_role="ADJUDICATION_OFFICER")

    metrics = ShadowDiabetesService.compute_prospective_metrics()
    assert metrics["status"] == "FORMAL_GATE_MET"
    assert metrics["volume_gate_cleared"] is True
    assert metrics["adjudicated_count"] == 50
    assert metrics["required_minimum"] == 50




def test_production_response_independence_and_shadow_failure_handling(
    valid_diabetes_request, mock_all_governance_approved, monkeypatch
):
    """Verify that candidate execution errors never raise or affect caller."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")

    def mock_broken_staging(req, candidate_id):
        raise RuntimeError("Synthetic test error in candidate execution")

    monkeypatch.setattr("app.services.staging_diabetes_service.StagingDiabetesService.predict_staging", mock_broken_staging)

    # Must NOT raise exception
    res = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request, is_authorized=True)
    assert res is not None
    assert res["candidate_evaluations"]["appC_mlp_6layer_bottleneck_gelu"]["status"] == "ERROR"
    assert res["candidate_evaluations"]["appA_extratrees"]["status"] == "ERROR"

    ledger = ShadowDiabetesService.get_ledger()
    assert ledger["candidate_inferences"]["appC_mlp_6layer_bottleneck_gelu"]["failed"] == 1
    assert ledger["candidate_inferences"]["appA_extratrees"]["failed"] == 1


def test_governance_blocked_when_approval_expired(monkeypatch):
    """Verify that gate fails closed when an approval timestamp has passed its expiration."""
    domains = GovernanceActivationGate.MANDATORY_DOMAINS
    for d in domains:
        GovernanceActivationGate.record_domain_approval(
            d, ApprovalStatus.APPROVED, approver="Valid Approver"
        )
    assert GovernanceActivationGate.is_activation_cleared()

    # Expire domain 1
    GovernanceActivationGate.record_domain_approval(
        domains[0],
        ApprovalStatus.APPROVED,
        approver="Valid Approver",
        expires_at="2020-01-01T00:00:00Z",  # In the past
    )
    assert not GovernanceActivationGate.is_activation_cleared()


def test_governance_blocked_when_approval_revoked(monkeypatch):
    """Verify that gate fails closed when an approval is marked revoked."""
    domains = GovernanceActivationGate.MANDATORY_DOMAINS
    for d in domains:
        GovernanceActivationGate.record_domain_approval(
            d, ApprovalStatus.APPROVED, approver="Valid Approver"
        )
    assert GovernanceActivationGate.is_activation_cleared()

    # Revoke domain 2
    GovernanceActivationGate.record_domain_approval(
        domains[1],
        ApprovalStatus.APPROVED,
        approver="Valid Approver",
        is_revoked=True,
    )
    assert not GovernanceActivationGate.is_activation_cleared()


def test_governance_blocked_when_approver_identity_or_evidence_invalid(monkeypatch):
    """Verify that gate fails closed if approver identity is empty or evidence reference is unapproved."""
    domains = GovernanceActivationGate.MANDATORY_DOMAINS
    for d in domains:
        GovernanceActivationGate.record_domain_approval(
            d, ApprovalStatus.APPROVED, approver="Valid Approver"
        )
    assert GovernanceActivationGate.is_activation_cleared()

    # Unapproved evidence reference rejected
    GovernanceActivationGate.record_domain_approval(
        domains[0],
        ApprovalStatus.APPROVED,
        approver="Valid Approver",
        evidence_reference="arbitrary_unapproved_packet.txt",
    )
    assert not GovernanceActivationGate.is_activation_cleared()

    # Reset with valid evidence reference
    GovernanceActivationGate.record_domain_approval(domains[0], ApprovalStatus.APPROVED, approver="Valid Approver")
    assert GovernanceActivationGate.is_activation_cleared()

    # Empty approver
    matrix = GovernanceActivationGate.get_approval_matrix()
    matrix["domains"][domains[0]]["approved_by"] = ""
    monkeypatch.setattr("app.services.shadow_diabetes_service.GovernanceActivationGate.get_approval_matrix", lambda: matrix)
    assert not GovernanceActivationGate.is_activation_cleared()


def test_escrow_interface_fail_closed_when_secret_missing(monkeypatch):
    """Verify escrow interface raises PermissionError and unready when secret is missing."""
    monkeypatch.delenv("MEDIMIND_ESCROW_HMAC_SECRET", raising=False)
    monkeypatch.delenv("TEST_ESCROW_HMAC_KEY", raising=False)

    assert not SecureOutcomeEscrowInterface.is_escrow_ready()
    with pytest.raises(PermissionError) as exc_info:
        SecureOutcomeEscrowInterface.get_escrow_key()
    assert "unconfigured" in str(exc_info.value)

    # When escrow is not ready, gate must be blocked
    assert not GovernanceActivationGate.is_activation_cleared()


def test_escrow_interface_storage_failure_handled_gracefully(monkeypatch):
    """Verify that file storage failures in recording escrow mapping do not crash."""
    corr_id = "corr_storage_fail_test"
    # Mock open to fail
    def mock_broken_open(*args, **kwargs):
        raise OSError("Read-only filesystem error")

    monkeypatch.setattr("builtins.open", mock_broken_open)
    saved = SecureOutcomeEscrowInterface.record_linkage_mapping(
        correlation_id=corr_id,
        family_member_id="mem_001",
        appointment_id="apt_001",
        caller_role="SYSTEM_ESCROW",
    )
    assert saved is False


def test_role_to_domain_approval_authorization(monkeypatch):
    """Verify that only authorized roles can approve their designated governance domains."""
    # Attempting CMO domain with Privacy Officer role raises PermissionError
    with pytest.raises(PermissionError, match="not authorized to approve domain"):
        GovernanceActivationGate.record_domain_approval(
            "clinical_protocol_and_thresholds",
            ApprovalStatus.APPROVED,
            approver="Dr. Impostor",
            caller_role="Healthcare Privacy Officer",
        )

    # Valid role succeeds
    GovernanceActivationGate.record_domain_approval(
        "clinical_protocol_and_thresholds",
        ApprovalStatus.APPROVED,
        approver="Dr. Valid CMO",
        caller_role="Chief Medical Officer (CMO)",
    )
    matrix = GovernanceActivationGate.get_approval_matrix()
    assert matrix["domains"]["clinical_protocol_and_thresholds"]["status"] == "APPROVED"


def test_cross_hospital_adjudication_rejection(valid_diabetes_request, mock_all_governance_approved, monkeypatch):
    """Verify that adjudication fails when hospital scope does not match the encounter's hospital."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")

    res = ShadowDiabetesService.run_shadow_inference_sync(
        valid_diabetes_request, is_authorized=True, hospital_id="hosp_city_general"
    )
    assert res is not None
    cid = res["correlation_id"]

    # Adjudication attempt from mismatched hospital fails closed
    success_mismatch = ShadowDiabetesService.adjudicate_outcome(
        correlation_id=cid,
        confirmed_outcome=1,
        caller_role="ADJUDICATION_OFFICER",
        authorized_hospital_id="hosp_metro_east",
    )
    assert success_mismatch is False

    # Adjudication attempt from authorized hospital succeeds
    success_match = ShadowDiabetesService.adjudicate_outcome(
        correlation_id=cid,
        confirmed_outcome=1,
        caller_role="ADJUDICATION_OFFICER",
        authorized_hospital_id="hosp_city_general",
    )
    assert success_match is True

    # Duplicate re-adjudication attempt is rejected
    success_dup = ShadowDiabetesService.adjudicate_outcome(
        correlation_id=cid,
        confirmed_outcome=0,
        caller_role="ADJUDICATION_OFFICER",
        authorized_hospital_id="hosp_city_general",
    )
    assert success_dup is False


def test_adjudication_input_validation(valid_diabetes_request, mock_all_governance_approved, monkeypatch):
    """Verify adjudication rejects invalid roles, invalid status, and malformed outcome values."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")

    res = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request, is_authorized=True)
    cid = res["correlation_id"]

    # Reject unauthorized role
    assert not ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=1, caller_role="DOCTOR")

    # Reject invalid outcome status
    assert not ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=1, outcome_status="UNKNOWN_STATUS")

    # Reject invalid outcome value (must be 0 or 1 for ADJUDICATED)
    assert not ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=5, outcome_status="ADJUDICATED")

    # Reject non-None outcome value when OUTCOME_UNAVAILABLE
    assert not ShadowDiabetesService.adjudicate_outcome(cid, confirmed_outcome=1, outcome_status="OUTCOME_UNAVAILABLE")


def test_shadow_inference_aborts_if_linkage_fails(valid_diabetes_request, mock_all_governance_approved, monkeypatch):
    """Verify that if linkage persistence fails, shadow inference returns None and aborts record write."""
    monkeypatch.setenv("ENABLE_DIABETES_SHADOW_EVAL", "true")
    monkeypatch.setattr(
        "app.services.shadow_diabetes_service.SecureOutcomeEscrowInterface.record_linkage_mapping",
        lambda *args, **kwargs: False,
    )

    res = ShadowDiabetesService.run_shadow_inference_sync(valid_diabetes_request, is_authorized=True)
    assert res is None

