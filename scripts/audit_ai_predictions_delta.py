import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ["MONGODB_URI"])
pred_coll = client["medimind_ai"].predictions

recent_preds = list(pred_coll.find({"created_at": {"$gte": "2026-10-23"}}))
print(f"Total predictions created on 2026-10-23: {len(recent_preds)}")

linked_recent = [p for p in recent_preds if p.get("appointment_id")]
standalone_recent = [p for p in recent_preds if not p.get("appointment_id")]

print(f"  Appointment-linked recent predictions: {len(linked_recent)}")
print(f"  Standalone recent predictions: {len(standalone_recent)}")

# Check doctor IDs in recent predictions
recent_doctor_ids = set(str(p.get("doctor_id")) for p in recent_preds if p.get("doctor_id"))
print(f"  Distinct doctors in recent predictions: {len(recent_doctor_ids)}")

# Earlier baseline
earlier_preds = list(pred_coll.find({"created_at": {"$lt": "2026-10-23"}}))
print(f"Predictions created before 2026-10-23: {len(earlier_preds)}")
print(f"Sum: {len(earlier_preds)} + {len(recent_preds)} = {len(earlier_preds) + len(recent_preds)}")
