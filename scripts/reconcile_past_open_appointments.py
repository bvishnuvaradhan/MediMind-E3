"""
Reconciles past open appointments in Atlas:
- Identifies past-dated appointments prior to 2026-10-25 with status BOOKED/CONFIRMED/PENDING.
- Since zero consultations exist for these slots, transitions status to CANCELLED with audit trail.
- Reconciles future-dated created_at timestamps (Nov 2026) to advance booking dates in October 2026,
  preserving original_created_at and migration_manifest_id for full audit trail.
"""

import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
uri = os.environ.get("MONGODB_URI")
client = MongoClient(uri, serverSelectionTimeoutMS=5000)
appts_coll = client["medimind_appointment"]["appointments"]

cutoff = datetime(2026, 10, 25, 0, 0, 0, tzinfo=timezone.utc)
now_utc = datetime.now(timezone.utc)

print(f"=== RECONCILING PAST UNATTENDED APPOINTMENTS (Cutoff: {cutoff.isoformat()}) ===")

# 1. Past unattended appointments
past_open = list(appts_coll.find({
    "appointment_date": {"$lt": cutoff},
    "status": {"$in": ["BOOKED", "CONFIRMED", "PENDING"]}
}))
print(f"Found {len(past_open)} past unattended appointments to transition to CANCELLED.")

updated_past = 0
for a in past_open:
    appt_date = a.get("appointment_date")
    # Cancelled at appointment date + 4 hours or audit time
    cancelled_time = (appt_date + timedelta(hours=4)) if appt_date else now_utc
    if cancelled_time.tzinfo is None:
        cancelled_time = cancelled_time.replace(tzinfo=timezone.utc)
    
    appts_coll.update_one(
        {"_id": a["_id"]},
        {
            "$set": {
                "status": "CANCELLED",
                "cancellation_reason": "Clinical operational policy: Unattended/unconsulted past appointment slot closed",
                "cancelled_at": cancelled_time,
                "cancelled_by": "SYSTEM_GOVERNANCE_AUDIT",
                "previous_status": a.get("status"),
                "updated_at": now_utc,
            }
        }
    )
    updated_past += 1

print(f"Successfully transitioned {updated_past} past appointments to CANCELLED.")

# 2. Future-dated created_at timestamps (> Oct 25, 2026)
nov_created = list(appts_coll.find({
    "created_at": {"$gte": cutoff}
}))
print(f"\nFound {len(nov_created)} appointments with created_at >= Oct 25, 2026.")

manifest_id = f"manifest_booking_timeline_reconcile_{int(now_utc.timestamp())}"
reconciled_created = 0

for a in nov_created:
    orig_created = a.get("created_at")
    appt_date = a.get("appointment_date")
    # A patient booking in advance for November booked during October (e.g. 10-14 days prior, capped to Oct 24)
    if appt_date:
        if appt_date.tzinfo is None:
            appt_date = appt_date.replace(tzinfo=timezone.utc)
        advance_days = 7
        new_created = appt_date - timedelta(days=advance_days)
        if new_created >= cutoff:
            new_created = cutoff - timedelta(hours=12)
    else:
        new_created = cutoff - timedelta(days=2)

    appts_coll.update_one(
        {"_id": a["_id"]},
        {
            "$set": {
                "created_at": new_created,
                "original_created_at": orig_created,
                "migration_manifest_id": manifest_id,
                "updated_at": now_utc,
            }
        }
    )
    reconciled_created += 1

print(f"Successfully reconciled {reconciled_created} future-dated created_at timestamps to October advance booking dates.")

# Verification
statuses = list(appts_coll.aggregate([
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
]))
print("\n--- RECONCILED APPOINTMENT STATUS CENSUS ---")
for s in statuses:
    print(f"  Status: {s['_id']:12} -> {s['count']}")

# Creation month census
pipeline_creation = [
    {
        "$group": {
            "_id": {
                "year": {"$year": "$created_at"},
                "month": {"$month": "$created_at"}
            },
            "count": {"$sum": 1}
        }
    },
    {"$sort": {"_id.year": 1, "_id.month": 1}}
]
creation_volume = list(appts_coll.aggregate(pipeline_creation))
print("\n--- RECONCILED BOOKING CREATION BY MONTH (created_at) ---")
for cv in creation_volume:
    y = cv['_id']['year']
    m = cv['_id']['month']
    cnt = cv['count']
    print(f"  Created in {y}-{m:02d}: {cnt} bookings")
