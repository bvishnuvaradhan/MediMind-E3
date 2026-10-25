"""
Audit script for Phase 4: Appointment Status Distribution, October Bookings & Record Integrity (Optimized with Set Lookups).
"""

import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
uri = os.environ.get("MONGODB_URI")
client = MongoClient(uri, serverSelectionTimeoutMS=5000)

appts_coll = client["medimind_appointment"]["appointments"]
consults_coll = client["medimind_records"]["consultations"]
prescripts_coll = client["medimind_records"]["prescriptions"]
doctors_coll = client["medimind_doctor"]["doctors"]

now_utc = datetime.now(timezone.utc)
print(f"Audit Baseline Timestamp: {now_utc.isoformat()}")

print("\n--- 1. APPOINTMENT STATUS DISTRIBUTION ---")
statuses = list(appts_coll.aggregate([
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
]))
for s in statuses:
    print(f"  Status: {s['_id']:12} -> {s['count']}")

# Check past-dated appointments that are still BOOKED or CONFIRMED
cutoff = datetime(2026, 10, 25, 0, 0, 0, tzinfo=timezone.utc)
past_open = list(appts_coll.find({
    "appointment_date": {"$lt": cutoff},
    "status": {"$in": ["BOOKED", "CONFIRMED", "PENDING"]}
}))
print(f"\nPast-dated appointments still BOOKED/CONFIRMED/PENDING before Oct 25, 2026: {len(past_open)}")
if past_open:
    for a in past_open[:5]:
        print(f"  Appt ID: {a['_id']} | Date: {a.get('appointment_date')} | Status: {a.get('status')} | Doc: {a.get('doctor_id')}")

# Check future-dated appointments (Oct 25 to Nov 4, 2026 and beyond)
future_appts = list(appts_coll.find({
    "appointment_date": {"$gte": cutoff}
}))
print(f"Appointments scheduled on or after Oct 25, 2026: {len(future_appts)}")
future_by_status = {}
for a in future_appts:
    st = a.get("status")
    future_by_status[st] = future_by_status.get(st, 0) + 1
for st, cnt in sorted(future_by_status.items()):
    print(f"  Future Status: {st:12} -> {cnt}")

print("\n--- 2. BOOKING CREATION VOLUME BY CREATED_AT TIMESTAMP ---")
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
for cv in creation_volume:
    y = cv['_id']['year']
    m = cv['_id']['month']
    cnt = cv['count']
    print(f"  Created in {y}-{m:02d}: {cnt} bookings")

print("\n--- 3. CLINICAL CONSULTATION & PRESCRIPTION INTEGRITY ---")
total_consults = consults_coll.count_documents({})
total_prescripts = prescripts_coll.count_documents({})
print(f"Total Consultations: {total_consults}")
print(f"Total Prescriptions: {total_prescripts}")

# Bulk fetch all valid IDs into sets (1 single query per collection)
valid_appt_ids = {str(doc['_id']) for doc in appts_coll.find({}, {"_id": 1})}
valid_doc_ids = {str(doc['_id']) for doc in doctors_coll.find({}, {"_id": 1})}

# Consultations audit
all_consults = list(consults_coll.find({}, {"_id": 1, "appointment_id": 1, "doctor_id": 1}))
valid_consult_ids = {str(c['_id']) for c in all_consults}

orphaned_consult_appts = 0
orphaned_consult_docs = 0
for c in all_consults:
    appt_id = str(c.get("appointment_id")) if c.get("appointment_id") else None
    doc_id = str(c.get("doctor_id")) if c.get("doctor_id") else None
    if not appt_id or appt_id not in valid_appt_ids:
        orphaned_consult_appts += 1
    if not doc_id or doc_id not in valid_doc_ids:
        orphaned_consult_docs += 1

print(f"Orphaned Consultation -> Appointment links: {orphaned_consult_appts}")
print(f"Orphaned Consultation -> Doctor links: {orphaned_consult_docs}")

# Prescriptions audit
all_prescripts = list(prescripts_coll.find({}, {"_id": 1, "consultation_id": 1, "doctor_id": 1}))
orphaned_presc_consults = 0
orphaned_presc_docs = 0
for p in all_prescripts:
    c_id = str(p.get("consultation_id")) if p.get("consultation_id") else None
    d_id = str(p.get("doctor_id")) if p.get("doctor_id") else None
    if not c_id or c_id not in valid_consult_ids:
        orphaned_presc_consults += 1
    if not d_id or d_id not in valid_doc_ids:
        orphaned_presc_docs += 1

print(f"Orphaned Prescription -> Consultation links: {orphaned_presc_consults}")
print(f"Orphaned Prescription -> Doctor links: {orphaned_presc_docs}")
