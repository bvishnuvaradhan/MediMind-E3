"""
Audit script for Phase 5: Standalone Screenings, Model Distribution & Screening-to-Booking Conversion.
"""

import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
uri = os.environ.get("MONGODB_URI")
client = MongoClient(uri, serverSelectionTimeoutMS=5000)

preds_coll = client["medimind_ai"]["predictions"]
appts_coll = client["medimind_appointment"]["appointments"]

print("=== AUDIT OF AI PREDICTIONS & STANDALONE SCREENINGS (ATLAS) ===")
total_preds = preds_coll.count_documents({})
print(f"Total Predictions: {total_preds}")

# Standalone query: appointment_id is null, missing, or empty
q_standalone = {
    "$or": [
        {"appointment_id": None},
        {"appointment_id": ""},
        {"appointment_id": {"$exists": False}},
    ]
}
standalone_preds = list(preds_coll.find(q_standalone))
linked_preds_count = total_preds - len(standalone_preds)

print(f"Appointment-Linked Predictions: {linked_preds_count} ({round((linked_preds_count / total_preds) * 100, 1)}%)")
print(f"Standalone Screenings:          {len(standalone_preds)} ({round((len(standalone_preds) / total_preds) * 100, 1)}%)")

print("\n--- STANDALONE SCREENINGS BY MODEL ---")
model_dist = {}
for p in standalone_preds:
    m = p.get("model_name") or p.get("prediction_type") or "unknown"
    model_dist[m] = model_dist.get(m, 0) + 1

for m, count in sorted(model_dist.items()):
    print(f"  Model: {m:24} -> {count} screenings")

print("\n--- OVERALL PREDICTION CENSUS BY MODEL ---")
all_model_dist = {}
for p in preds_coll.find({}, {"model_name": 1, "prediction_type": 1}):
    m = p.get("model_name") or p.get("prediction_type") or "unknown"
    all_model_dist[m] = all_model_dist.get(m, 0) + 1

for m, count in sorted(all_model_dist.items()):
    print(f"  Model: {m:24} -> {count} predictions")

print("\n--- SCREENING-TO-BOOKING CONVERSION AUDIT (WITHIN 30 DAYS) ---")
# Pre-fetch all appointments by family_member_id
member_appts = {}
for a in appts_coll.find({}, {"family_member_id": 1, "created_at": 1, "appointment_date": 1}):
    mid = str(a.get("family_member_id"))
    if mid not in member_appts:
        member_appts[mid] = []
    member_appts[mid].append(a)

converted_count = 0
unconverted_count = 0

for sp in standalone_preds:
    mid = str(sp.get("family_member_id"))
    pred_time = sp.get("created_at")
    if isinstance(pred_time, str):
        try:
            pred_time = datetime.fromisoformat(pred_time.replace("Z", "+00:00"))
        except Exception:
            pred_time = None

    if not pred_time or mid not in member_appts:
        unconverted_count += 1
        continue

    if pred_time.tzinfo is None:
        pred_time = pred_time.replace(tzinfo=timezone.utc)

    # Check if member booked within 30 days after prediction
    converted = False
    for appt in member_appts[mid]:
        b_time = appt.get("created_at") or appt.get("appointment_date")
        if not b_time:
            continue
        if b_time.tzinfo is None:
            b_time = b_time.replace(tzinfo=timezone.utc)

        delta = (b_time - pred_time).total_seconds() / 86400.0
        if 0 <= delta <= 30.0:
            converted = True
            break

    if converted:
        converted_count += 1
    else:
        unconverted_count += 1

conv_rate = (converted_count / len(standalone_preds) * 100) if standalone_preds else 0.0
print(f"Total Standalone Screenings Evaluated: {len(standalone_preds)}")
print(f"Converted into Booked Appointments (<= 30d): {converted_count}")
print(f"Unconverted Standalone Screenings:           {unconverted_count}")
print(f"Screening-to-Booking Conversion Rate:        {conv_rate:.1f}%")
