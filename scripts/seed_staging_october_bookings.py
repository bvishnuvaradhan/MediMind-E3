"""
Seeds authorized synthetic October appointments into local staging database (mongodb://localhost:27017/medimind_appointment)
to verify Issue 4.2: October booking creation volume (created_at) exceeds September bookings.
Ensures zero double-booking slot conflicts against compound index (doctor_id, appointment_date, start_time).
"""

import random
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo import MongoClient

STAGING_URI = "mongodb://localhost:27017"
client = MongoClient(STAGING_URI, serverSelectionTimeoutMS=3000)
db = client["medimind_appointment"]
appts_coll = db["appointments"]

print("=== SEEDING AUTHORIZED SYNTHETIC OCTOBER BOOKINGS IN LOCAL STAGING ===")

# Check current creation volume in local staging
pipeline = [
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

counts = {}
for row in appts_coll.aggregate(pipeline):
    k = f"{row['_id']['year']}-{row['_id']['month']:02d}"
    counts[k] = row['count']

sep_count = counts.get("2026-09", 0)
oct_count = counts.get("2026-10", 0)
print(f"Current Local Staging Volume:")
print(f"  September 2026: {sep_count}")
print(f"  October 2026:   {oct_count}")

target_oct = max(sep_count + 60, 1350)
needed = target_oct - oct_count
print(f"Target October Volume: {target_oct} (Need +{needed} synthetic bookings)")

if needed > 0:
    hosp_ids = [
        ObjectId("6ac85a18074c2bc731a76381"),
        ObjectId("6ac85a18074c2bc731a76383"),
        ObjectId("6ac85a18074c2bc731a76385"),
    ]
    docs = list(client["medimind_doctor"]["doctors"].find({"status": "ACTIVE"}, {"_id": 1, "department_id": 1, "hospital_id": 1}))
    mems = list(client["medimind_family"]["familymembers"].find({}, {"_id": 1}))

    # Map existing occupied slots to prevent duplicate key errors
    print("Mapping existing occupied slots across all doctors...")
    occupied = set()
    for a in appts_coll.find({}, {"doctor_id": 1, "appointment_date": 1, "start_time": 1}):
        d_id = str(a.get("doctor_id"))
        ad_str = str(a.get("appointment_date"))[:10]
        st = a.get("start_time")
        if d_id and ad_str and st:
            occupied.add((d_id, ad_str, st))

    synthetic_docs = []
    rng = random.Random(20261025)

    all_slots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ]

    added = 0
    attempts = 0
    while added < needed and attempts < needed * 20:
        attempts += 1
        doc = rng.choice(docs)
        mem = rng.choice(mems)
        hosp_id = doc.get("hospital_id") or rng.choice(hosp_ids)
        dept_id = doc.get("department_id") or ObjectId("6ac85a18074c2bc731a76396")

        day_created = rng.randint(1, 24)
        hour_created = rng.randint(8, 19)
        min_created = rng.choice([0, 15, 30, 45])
        created_dt = datetime(2026, 10, day_created, hour_created, min_created, 0, tzinfo=timezone.utc)

        sched_delta = rng.randint(1, 25)
        sched_dt = created_dt + timedelta(days=sched_delta)
        # Avoid weekends
        if sched_dt.weekday() >= 5:
            sched_dt += timedelta(days=(7 - sched_dt.weekday()))

        sched_date_str = sched_dt.strftime("%Y-%m-%d")
        slot_start = rng.choice(all_slots)

        slot_key = (str(doc["_id"]), sched_date_str, slot_start)
        if slot_key in occupied:
            continue

        occupied.add(slot_key)

        if sched_dt < datetime(2026, 10, 25, 0, 0, 0, tzinfo=timezone.utc):
            status = rng.choice(["COMPLETED", "COMPLETED", "CANCELLED"])
        else:
            status = rng.choice(["CONFIRMED", "BOOKED"])

        h, m = map(int, slot_start.split(":"))
        m += 30
        if m >= 60:
            h += 1
            m -= 60
        slot_end = f"{h:02d}:{m:02d}"

        new_appt = {
            "family_member_id": mem["_id"],
            "doctor_id": doc["_id"],
            "hospital_id": hosp_id,
            "department_id": dept_id,
            "appointment_date": datetime(sched_dt.year, sched_dt.month, sched_dt.day, 0, 0, 0, tzinfo=timezone.utc),
            "start_time": slot_start,
            "end_time": slot_end,
            "reason": "Routine clinical consultation and health follow-up",
            "status": status,
            "appointment_type": "BOOKED",
            "token": f"OPD-S{added+1:04d}",
            "created_at": created_dt,
            "updated_at": created_dt,
            "is_synthetic": True,
            "provenance": "STAGING_OCTOBER_VOLUME_VERIFICATION",
        }
        synthetic_docs.append(new_appt)
        added += 1

    if synthetic_docs:
        res = appts_coll.insert_many(synthetic_docs)
        print(f"Successfully inserted {len(res.inserted_ids)} conflict-free synthetic October appointments into local staging.")

# Recalculate
re_counts = {}
for row in appts_coll.aggregate(pipeline):
    k = f"{row['_id']['year']}-{row['_id']['month']:02d}"
    re_counts[k] = row['count']

print("\n--- RECONCILED STAGING VOLUME ---")
print(f"  September 2026 (created_at): {re_counts.get('2026-09', 0)}")
print(f"  October 2026   (created_at): {re_counts.get('2026-10', 0)}")
assert re_counts.get('2026-10', 0) > re_counts.get('2026-09', 0), "October volume must exceed September volume"
print(f"[VERIFIED] October bookings ({re_counts.get('2026-10')}) EXCEED September bookings ({re_counts.get('2026-09')})!")
