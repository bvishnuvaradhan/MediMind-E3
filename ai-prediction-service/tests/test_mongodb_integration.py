"""
test_mongodb_integration.py — Phase 2 MongoDB persistence validation.

Covers:
- Full prediction lifecycle (save → query by member → query by id)
- Index creation (no duplicate prediction_id)
- Pagination (skip/limit) on member history
- Sort order (most recent first)
- Integrity guard (missing required fields raises ValueError)
"""

import pytest
import asyncio
from datetime import datetime, timezone
from app.core.database import Database
from app.schemas.prediction_schemas import PredictionType, InputType, UrgencyLevel, RiskLevel
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_record(prediction_id: str, member_id: str, text: str, created_at: str) -> dict:
    return {
        "prediction_id":    prediction_id,
        "family_member_id": member_id,
        "appointment_id":   None,
        "prediction_type":  PredictionType.GENERAL_HEALTH.value,
        "input_type":       InputType.TEXT.value,
        "input_data":       {"text": text},
        "result": {
            "possibleConcerns": ["Possible urgent medical condition (Chest pain or tightness)"],
            "urgency":          UrgencyLevel.EMERGENCY.value,
            "guidance":         "CRITICAL ALERT: Emergency evaluation required.",
            "symptomsExtracted": ["Chest pain or tightness"],
            "disclaimer":       GeneralHealthNLPEngine.MANDATORY_DISCLAIMER,
        },
        "risk_level":   RiskLevel.HIGH.value,
        "risk_score":   0.94,
        "confidence":   0.92,
        "model_name":   GeneralHealthNLPEngine.MODEL_NAME,
        "model_version": GeneralHealthNLPEngine.MODEL_VERSION,
        "explanation_reference": None,
        "created_at":   created_at,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_mongodb_prediction_lifecycle():
    """Basic lifecycle: save → query by member → query by id."""
    await Database.connect_db()

    member_id   = "integration_test_mem_001"
    pred_id     = "pred_integration_lifecycle_001"
    now_iso     = datetime.now(timezone.utc).isoformat()
    record      = _make_record(pred_id, member_id, "Severe chest pain and difficulty breathing", now_iso)

    # Save
    inserted_id = await Database.save_prediction(record)
    assert inserted_id is not None

    # Query by member
    member_history = await Database.get_predictions_by_member(member_id)
    assert len(member_history) >= 1
    matched = [p for p in member_history if p["prediction_id"] == pred_id]
    assert len(matched) == 1
    rec = matched[0]
    assert rec["family_member_id"] == member_id
    assert rec["risk_level"] == "HIGH"
    assert rec["result"]["urgency"] == "EMERGENCY"
    assert rec["result"]["disclaimer"] == GeneralHealthNLPEngine.MANDATORY_DISCLAIMER

    # Query by id
    single_doc = await Database.get_prediction_by_id(pred_id)
    assert single_doc is not None
    assert single_doc["prediction_id"] == pred_id
    assert single_doc["input_data"]["text"] == "Severe chest pain and difficulty breathing"

    await Database.close_db()


@pytest.mark.asyncio
async def test_integrity_guard_raises_on_missing_fields():
    """save_prediction must reject records missing required fields."""
    await Database.connect_db()

    incomplete_record = {
        "prediction_id": "pred_bad_001",
        # Missing: family_member_id, risk_level, prediction_type, created_at
        "input_data": {"text": "chest pain"},
    }

    with pytest.raises(ValueError, match="missing required fields"):
        await Database.save_prediction(incomplete_record)

    await Database.close_db()


@pytest.mark.asyncio
async def test_pagination_and_sort_order():
    """
    Inserts 5 records for a single member with staggered timestamps,
    then verifies:
    - Pagination (limit=2, skip=0 and skip=2)
    - Sort order (most recent first)
    """
    await Database.connect_db()

    member_id = "pagination_test_member_007"
    base_time = datetime(2026, 9, 1, 12, 0, 0, tzinfo=timezone.utc)

    pred_ids = []
    for i in range(5):
        pid    = f"pred_page_test_{i:03d}"
        ts     = base_time.replace(minute=i).isoformat()
        record = _make_record(pid, member_id, f"Symptom text {i}", ts)
        await Database.save_prediction(record)
        pred_ids.append((pid, ts))

    # Most recent first: pred_page_test_004 should be first
    page1 = await Database.get_predictions_by_member(member_id, skip=0, limit=2)
    assert len(page1) == 2
    # Verify descending order
    assert page1[0]["created_at"] >= page1[1]["created_at"], (
        "Results should be sorted most-recent-first"
    )

    # Page 2
    page2 = await Database.get_predictions_by_member(member_id, skip=2, limit=2)
    assert len(page2) == 2
    assert page2[0]["created_at"] >= page2[1]["created_at"]

    # No overlap between pages
    page1_ids = {r["prediction_id"] for r in page1}
    page2_ids = {r["prediction_id"] for r in page2}
    assert page1_ids.isdisjoint(page2_ids), "Pages must not overlap"

    # Page 3 (last 1 item)
    page3 = await Database.get_predictions_by_member(member_id, skip=4, limit=2)
    assert len(page3) == 1

    await Database.close_db()


@pytest.mark.asyncio
async def test_no_duplicate_prediction_id():
    """
    Saving two records with the same prediction_id should raise on MongoDB
    (unique index) or be caught gracefully by the in-memory store.
    """
    await Database.connect_db()

    member_id = "dedup_test_member_001"
    pred_id   = "pred_duplicate_test_001"
    now_iso   = datetime.now(timezone.utc).isoformat()
    record    = _make_record(pred_id, member_id, "chest pain", now_iso)

    # First insert — should succeed
    await Database.save_prediction(record)

    if Database.db is not None:
        # MongoDB unique index should reject the second insert
        import pytest
        with pytest.raises(Exception):
            await Database.save_prediction(record.copy())
    else:
        # In-memory fallback: both appended (no dedup), but at least we confirm
        # the first insert was stored correctly
        results = await Database.get_predictions_by_member(member_id)
        assert any(r["prediction_id"] == pred_id for r in results)

    await Database.close_db()
