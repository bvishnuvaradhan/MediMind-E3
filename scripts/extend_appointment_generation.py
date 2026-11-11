"""
MediMind — Extended Appointment Generation Workflow
Extends the original production_seed_reset.py generation mechanism for the additional 387 October appointments.
Operates in controlled, isolated staging mode with strict production safeguards and deterministic idempotency.
"""

import os
import sys
import argparse
import random
import hashlib
from datetime import datetime, date, time, timedelta, timezone
from pymongo import MongoClient
from bson import ObjectId

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Production Safeguard Definition
PRODUCTION_HOST_PATTERNS = ["mongodb.net", "plxllln", "cluster0"]

# Allocation Specifications
ALLOCATION_SPEC = {
    "Harborview Medical Centre": {
        "hospital_id": ObjectId("6ac85a18074c2bc731a76385"),
        "hospital_code": "MM-MUM-03",
        "target_count": 178,
    },
    "Aarogyam Multispeciality Hospital": {
        "hospital_id": ObjectId("6ac85a18074c2bc731a76381"),
        "hospital_code": "MM-HYD-01",
        "target_count": 100,
    },
    "Nexora Advanced Care Hospital": {
        "hospital_id": ObjectId("6ac85a18074c2bc731a76383"),
        "hospital_code": "MM-HYD-02",
        "target_count": 109,
    },
}

TOTAL_ADDITIONAL_TARGET = 387
DATASET_TAG = "EXTENDED_ORIGINAL_WORKFLOW_OCT2026"

# Working hours & slots from production_seed_reset.py (09:00 - 17:00, lunch 12:30 - 14:00)
SLOT_STARTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
]

def get_end_time(start_str):
    h, m = map(int, start_str.split(":"))
    m += 30
    if m >= 60:
        h += 1
        m -= 60
    return f"{h:02d}:{m:02d}"

def get_weekdays_in_range(start_d, end_d):
    cur = start_d
    days = []
    while cur <= end_d:
        if cur.weekday() < 5:  # Monday to Friday
            days.append(cur)
        cur += timedelta(days=1)
    return days

def make_deterministic_object_id(seed_str):
    h = hashlib.md5(seed_str.encode("utf-8")).hexdigest()
    return ObjectId(h[:24])

def assert_staging_environment(uri, allow_production=False):
    """Enforces that synthetic/extended generation cannot inadvertently run on production Atlas."""
    if not uri:
        raise ValueError("Database URI must be specified.")
    lower = uri.lower()
    for pat in PRODUCTION_HOST_PATTERNS:
        if pat in lower:
            if not allow_production:
                raise PermissionError(
                    f"SAFEGUARD_HALT: Production write blocked! Extended generation contains simulated fixtures and cannot write to production URI: {pat}"
                )
    return True

def run_extended_generation(
    mongo_uri="mongodb://127.0.0.1:27017",
    target_db="medimind_staging_appointment",
    dry_run=False,
    random_seed=20261029
):
    print("========================================================================")
    print("MEDIMIND — EXTENDED APPOINTMENT GENERATION WORKFLOW (387 APPOINTMENTS)")
    print("========================================================================\n")

    # 1. Enforce Safeguard
    assert_staging_environment(mongo_uri)
    print(f"✓ Production Safeguard Verified: Target URI is non-production ({mongo_uri})")
    print(f"  Target Staging Database: {target_db}")
    print(f"  Execution Mode: {'PREVIEW DRY-RUN (No writes)' if dry_run else 'ACTIVE WRITING'}")

    # 2. Connect
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db_appt = client[target_db]
    db_doc = client["medimind_doctor"]
    db_fam = client["medimind_family"]
    db_ai = client["medimind_staging_ai"]
    db_rec = client["medimind_staging_records"]

    # 3. Retrieve Active Doctors & Family Members
    active_doctors = list(db_doc.doctors.find({"status": "ACTIVE"}))
    if not active_doctors:
        # Fallback to general doctors query if status not populated in staging
        active_doctors = list(db_doc.doctors.find({}))
    print(f"✓ Loaded {len(active_doctors)} doctors from medimind_doctor.doctors")

    # Group doctors by hospital_id
    doctors_by_hosp = {}
    for d in active_doctors:
        hid = str(d.get("hospital_id"))
        if hid not in doctors_by_hosp:
            doctors_by_hosp[hid] = []
        doctors_by_hosp[hid].append(d)

    # Load Family Members with weighting (matching production_seed_reset.py)
    all_members = list(db_fam.familymembers.find({}))
    if not all_members:
        print("  Warning: medimind_family.familymembers empty in staging, creating deterministic fallback patient pool...")
        all_members = [{"_id": make_deterministic_object_id(f"synth_member_{i}"), "family_code": f"FAM-{i:03d}"} for i in range(1, 45)]

    fam_weights = {
        "FAM-001": 20, "FAM-003": 15, "FAM-007": 18, "FAM-009": 12,
        "FAM-005": 10, "FAM-010": 9, "FAM-004": 6, "FAM-008": 6,
        "FAM-002": 4, "FAM-006": 4
    }
    weighted_members = []
    for m in all_members:
        w = fam_weights.get(m.get("family_code"), 5)
        weighted_members.extend([m] * w)
    print(f"✓ Loaded {len(all_members)} family members ({len(weighted_members)} weighted pool)")

    # 4. Map Existing Occupied Slots (Avoid double-booking index conflicts with base appointments)
    print("Mapping occupied slots in target database to prevent slot collisions...")
    occupied_slots = set()
    for a in db_appt.appointments.find({"dataset_tag": {"$ne": DATASET_TAG}}, {"doctor_id": 1, "appointment_date": 1, "start_time": 1}):
        d_id = str(a.get("doctor_id"))
        ad_str = str(a.get("appointment_date"))[:10]
        st = a.get("start_time")
        if d_id and ad_str and st:
            occupied_slots.add((d_id, ad_str, st))
    print(f"  Existing occupied slots mapped: {len(occupied_slots)}")

    # 5. Deterministic Generation Setup
    rng = random.Random(random_seed)
    oct_weekdays = get_weekdays_in_range(date(2026, 10, 1), date(2026, 10, 31))

    preview_manifest = []
    generated_appts = []
    generated_preds = []
    generated_consults = []

    total_generated = 0
    hospital_actual_counts = {}

    for hosp_name, spec in ALLOCATION_SPEC.items():
        hid_str = str(spec["hospital_id"])
        hosp_docs = doctors_by_hosp.get(hid_str, [])
        if not hosp_docs:
            # Fallback if doctors collection in staging doesn't have this hospital ID
            fallback_doc_id = make_deterministic_object_id(f"doc_{spec['hospital_code']}")
            hosp_docs = [{
                "_id": fallback_doc_id,
                "full_name": f"Dr. Staff Physician ({spec['hospital_code']})",
                "department_id": ObjectId("6ac85a18074c2bc731a7638d"),
                "dept_name": "General Medicine",
                "hospital_id": spec["hospital_id"]
            }]

        target_count = spec["target_count"]
        print(f"\nProcessing {hosp_name} (Target: {target_count} appointments across {len(hosp_docs)} doctors)...")

        # Create slot pool
        slot_pool = [(d, s) for d in oct_weekdays for s in SLOT_STARTS]
        rng.shuffle(slot_pool)

        hosp_count = 0
        attempts = 0
        max_attempts = target_count * 50

        while hosp_count < target_count and attempts < max_attempts:
            attempts += 1
            doc = rng.choice(hosp_docs)
            slot_day, slot_time = rng.choice(slot_pool)

            slot_key = (str(doc["_id"]), slot_day.strftime("%Y-%m-%d"), slot_time)
            if slot_key in occupied_slots:
                continue

            occupied_slots.add(slot_key)
            hosp_count += 1
            total_generated += 1

            pad_idx = f"{hosp_count:04d}"
            seed_key = f"{DATASET_TAG}_{spec['hospital_code']}_{pad_idx}"
            appt_id = make_deterministic_object_id(f"appt_{seed_key}")
            patient = rng.choice(weighted_members)
            mem_id = patient["_id"]

            slot_end = get_end_time(slot_time)
            appt_dt = datetime.combine(slot_day, datetime.strptime(slot_time, "%H:%M").time(), tzinfo=timezone.utc)

            # Realistic status distribution: 65% Completed, 25% Pending, 10% Cancelled
            roll = rng.random()
            if roll < 0.65:
                status = "COMPLETED"
                can_reason = None
            elif roll < 0.90:
                status = "CONFIRMED"
                can_reason = None
            else:
                status = "CANCELLED"
                can_reason = "Patient requested cancellation due to scheduling conflict."

            pred_hex = f"ext_pred_{spec['hospital_code'].lower()}_{pad_idx}"

            appt_doc = {
                "_id": appt_id,
                "token": f"EXT-{spec['hospital_code'].split('-')[-1]}-{pad_idx}",
                "family_member_id": mem_id,
                "doctor_id": doc["_id"],
                "hospital_id": spec["hospital_id"],
                "department_id": doc.get("department_id", ObjectId("6ac85a18074c2bc731a7638d")),
                "appointment_date": appt_dt,
                "start_time": slot_time,
                "end_time": slot_end,
                "reason": f"Extended Clinical Evaluation ({doc.get('dept_name', 'General Care')})",
                "status": status,
                "appointment_type": "BOOKED",
                "ai_prediction_id": pred_hex,
                "cancelled_at": appt_dt - timedelta(hours=4) if status == "CANCELLED" else None,
                "cancellation_reason": can_reason,
                "created_at": appt_dt - timedelta(days=rng.randint(2, 6)),
                "updated_at": appt_dt,
                
                # Traceable lineage markers
                "is_extended_dataset": True,
                "is_synthetic": True,
                "synthetic_marker": "SYNTHETIC_TEST_DATA",
                "dataset_run_id": "phase21_extended_original_workflow_v1",
                "dataset_tag": DATASET_TAG,
                "production_eligible": False,
                "generation_workflow": "EXTENDED_PRODUCTION_SEED_WORKFLOW",
            }
            generated_appts.append(appt_doc)

            # Corresponding AI Prediction
            pred_doc = {
                "_id": make_deterministic_object_id(f"pred_{seed_key}"),
                "prediction_id": pred_hex,
                "appointment_id": str(appt_id),
                "family_member_id": str(mem_id),
                "model_version": "v2.1.0-extended-simulated",
                "risk_level": "LOW" if rng.random() > 0.3 else "MODERATE",
                "confidence_score": round(0.85 + (rng.random() * 0.12), 3),
                "is_synthetic": True,
                "synthetic_marker": "SYNTHETIC_TEST_DATA",
                "dataset_run_id": "phase21_extended_original_workflow_v1",
                "dataset_tag": DATASET_TAG,
                "production_eligible": False,
                "created_at": appt_dt - timedelta(days=rng.randint(2, 6)),
            }
            generated_preds.append(pred_doc)

            # If completed, add simulated clinical consultation
            if status == "COMPLETED":
                consult_doc = {
                    "_id": make_deterministic_object_id(f"consult_{seed_key}"),
                    "appointment_id": appt_id,
                    "family_member_id": mem_id,
                    "doctor_id": doc["_id"],
                    "status": "FINAL",
                    "symptoms": "Simulated extended demonstration symptoms",
                    "clinical_assessment": "Simulated clinical encounter assessment",
                    "treatment_plan": "Demonstration plan: Follow-up lifestyle guidance (NOT A REAL CLINICAL ORDER)",
                    "is_synthetic": True,
                    "synthetic_marker": "SYNTHETIC_TEST_DATA",
                    "dataset_run_id": "phase21_extended_original_workflow_v1",
                    "dataset_tag": DATASET_TAG,
                    "production_eligible": False,
                    "created_at": appt_dt + timedelta(minutes=20),
                }
                generated_consults.append(consult_doc)

            preview_manifest.append({
                "id": str(appt_id),
                "token": appt_doc["token"],
                "hospital": hosp_name,
                "doctor_id": str(doc["_id"]),
                "date": appt_dt.strftime("%Y-%m-%d"),
                "time": slot_time,
                "status": status,
                "pred_id": pred_hex,
            })

        hospital_actual_counts[hosp_name] = hosp_count
        print(f"  ✓ Created {hosp_count} conflict-free records for {hosp_name}")

    print("\n========================================================================")
    print("EXTENDED GENERATION PREVIEW & DRY-RUN MANIFEST SUMMARY:")
    print(f"  Total Appointments Scheduled: {total_generated} (Target: {TOTAL_ADDITIONAL_TARGET})")
    print(f"  Hospital Allocation: {hospital_actual_counts}")
    print(f"  AI Predictions Formulated: {len(generated_preds)}")
    print(f"  Simulated Consultations Formulated: {len(generated_consults)}")
    print(f"  Zero Prescriptions Created (Strict Compliance): True")
    print("========================================================================\n")

    if dry_run:
        print("[DRY-RUN COMPLETE] Zero database writes executed.")
        client.close()
        return {
            "total": total_generated,
            "hospital_counts": hospital_actual_counts,
            "dry_run": True,
            "manifest_sample": preview_manifest[:5]
        }

    # 6. Active Execution: Idempotent Upserts
    print(f"Writing {len(generated_appts)} extended appointments to {target_db}.appointments...")
    for doc in generated_appts:
        db_appt.appointments.update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)

    print(f"Writing {len(generated_preds)} predictions to medimind_staging_ai.predictions...")
    for doc in generated_preds:
        db_ai.predictions.update_one({"prediction_id": doc["prediction_id"]}, {"$set": doc}, upsert=True)

    print(f"Writing {len(generated_consults)} consultations to medimind_staging_records.consultations...")
    for doc in generated_consults:
        db_rec.consultations.update_one({"_id": doc["_id"]}, {"$set": doc}, upsert=True)

    print("\n✓ SUCCESS: Extended generation workflow completed idempotently in staging.")
    client.close()

    return {
        "total": total_generated,
        "hospital_counts": hospital_actual_counts,
        "dry_run": False,
        "manifest_sample": preview_manifest[:5]
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MediMind Extended Appointment Generation Workflow")
    parser.add_argument("--uri", default="mongodb://127.0.0.1:27017", help="MongoDB target URI (Staging only)")
    parser.add_argument("--db", default="medimind_staging_appointment", help="Target database name")
    parser.add_argument("--dry-run", action="store_true", help="Preview manifest without writing")
    args = parser.parse_args()

    run_extended_generation(mongo_uri=args.uri, target_db=args.db, dry_run=args.dry_run)
