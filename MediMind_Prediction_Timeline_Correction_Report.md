# MediMind — Prediction Timeline Correction & Triage Alignment Report

**Date:** 2026-10-23  
**Target Branch:** `experiment8-multiview-localized-fusion`  
**Execution Environment:** Production-Equivalent Multi-Tier Microservices with MongoDB Atlas Cluster (`cluster0.plxllln.mongodb.net`)

---

## 1. Executive Summary & Problem Root Cause

During executive clinical analytics review, inference volume charts in the Chairman portal displayed inferences in **November 2026**. Because the operational clock is October 2026, forward-dated inferences appeared alongside completed historical months (August, September, October), creating potential confusion between historical retrospective diagnostic volumes and prospective upcoming pre-screenings.

### Forensic Investigation:
1. **Provenance:** In an earlier remediation pass (`remediate_missing_predictions.py`), 610 non-walk-in appointments missing pre-screenings had inferences generated.
2. **Backfill Mechanism:** The backfill script set `pred_created_at = (appointment_date - timedelta(minutes=15))`. For appointments scheduled in November 2026 (Nov 5 – Nov 28), the inference `created_at` timestamp was incorrectly stamped with the prospective appointment time rather than the true appointment booking timestamp (`appointment.created_at`).
3. **Census:** Exactly 3,719 predictions exist in `medimind_ai.predictions`. Exactly 300 backfilled predictions had `created_at > 2026-11-04`.

---

## 2. Dry-Run Manifest & Timestamp Correction Migration

In accordance with strict healthcare data governance, we implemented an evidence-driven, 100% reversible migration script: [`scripts/migrate_prediction_timestamps.py`](file:///d:/projects/MediMind/scripts/migrate_prediction_timestamps.py).

### Safety & Reversibility Architecture:
- **Dry-Run Manifest:** Generated [`scripts/prediction_timeline_migration_manifest.json`](file:///d:/projects/MediMind/scripts/prediction_timeline_migration_manifest.json) before touching any live record.
- **Audit Fields Stored on Every Migrated Document:**
  - `original_created_at`: The pre-migration timestamp (preserved for bit-for-bit reversibility).
  - `migrated_at`: ISO 8601 UTC execution timestamp.
  - `migration_manifest_id`: Unique migration batch ID (`manifest_timeline_migration_1792765188`).
- **Target Value:** Aligned `created_at` with the linked appointment's authentic booking creation timestamp (`appointment.created_at`).

### Execution Evidence:
```text
=== MEDIMIND PREDICTION TIMELINE MIGRATION (Dry-Run: False) ===
Found 300 candidate predictions created after Nov 4.
Generated 300 migration targets with verified linked appointments.
Manifest written to scripts/prediction_timeline_migration_manifest.json (Size: 103978 bytes)
APPLYING TIMESTAMP CORRECTIONS TO ATLAS DATABASE...
SUCCESS: Successfully updated 300 predictions in medimind_ai.predictions!
```

---

## 3. Platform AI Analytics API Restructuring

In [`ai-prediction-service/app/api/v1/analytics.py`](file:///d:/projects/MediMind/ai-prediction-service/app/api/v1/analytics.py):
1. **Historical Trajectory Capping:** Restructued the monthly volume aggregation to strictly cap `monthlyVolume` to months completed or ongoing up to the current clock (`ym <= current_month_key`). November is completely eliminated from the historical progression line chart.
2. **Upcoming Pre-Screenings Isolation:** Future-dated inferences for prospective scheduled consultations are cleanly isolated and aggregated into a dedicated top-level payload object:
   ```json
   "upcomingPreScreenings": {
     "total": 336,
     "byModel": {
       "fracture": 106,
       "diabetes": 70,
       "heart": 68,
       "general": 92
     },
     "label": "Upcoming Pre-Screenings (Prospective Triage)"
   }
   ```
3. **Inference Trajectory Verification:**
   - **Aug 2026:** 1,246 inferences
   - **Sep 2026:** 1,255 inferences
   - **Oct 2026:** 882 inferences
   - **November 2026:** **0 inferences in historical trajectory** (strictly 0)

---

## 4. Chairman UI Clinical Intelligence Integration

In [`frontend/src/components/chairman/views/AiAnalyticsView.jsx`](file:///d:/projects/MediMind/frontend/src/components/chairman/views/AiAnalyticsView.jsx):
- Integrated the `upcomingPreScreenings` payload.
- Added a high-visibility badge to the **Monthly Clinical Prediction Volume Trajectory** card:
  - Header: `Upcoming Pre-Screenings`
  - Metric: `336 Inferences (Prospective Triage)`
- The historical multi-series Area/Line chart now exclusively renders authentic completed months (August, September, October 2026), providing clinical governance clarity without forward-dated distortion.
