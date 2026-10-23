import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ["MONGODB_URI"])

# Doctor sample
doc_sample = client["medimind_doctor"].doctors.find_one({"isDemonstration": {"$ne": True}})
print("Doctor doc keys:", list(doc_sample.keys()) if doc_sample else "None")
new_doc_sample = client["medimind_doctor"].doctors.find_one({"status": "ACTIVE", "created_at": {"$gte": "2026-10-23"}})
if not new_doc_sample:
    new_doc_sample = client["medimind_doctor"].doctors.find().sort("_id", -1).limit(1)[0]
print("New Doctor doc keys:", list(new_doc_sample.keys()) if new_doc_sample else "None")
print("Doctor ID / Code:", new_doc_sample.get("doctor_code"), new_doc_sample.get("doctor_id"), new_doc_sample.get("doctorId"), new_doc_sample.get("full_name"))

# Appointment sample & walkin check
appt_sample = client["medimind_appointment"].appointments.find().sort("_id", -1).limit(1)[0]
print("Appointment doc keys:", list(appt_sample.keys()))
print("Walkin fields in sample:", {k: appt_sample.get(k) for k in ["is_walk_in", "is_walkin", "isWalkin", "booking_source", "type", "appointment_type"]})

walkin_types = client["medimind_appointment"].appointments.distinct("type")
print("Appointment types in DB:", walkin_types)
booking_sources = client["medimind_appointment"].appointments.distinct("booking_source")
print("Appointment booking_sources in DB:", booking_sources)

# AI prediction sample
pred_sample = client["medimind_ai"].predictions.find().sort("_id", -1).limit(1)[0]
print("AI prediction doc keys:", list(pred_sample.keys()))
print("AI prediction fields:", {k: pred_sample.get(k) for k in ["service", "model_type", "type", "prediction_type", "model", "inference_type"]})

# Auth users breakdown by role
auth_roles = client["medimind_auth"].users.aggregate([
    {"$group": {"_id": {"role": "$role", "status": "$status"}, "count": {"$sum": 1}}}
])
print("Auth users breakdown:")
for r in auth_roles:
    print(r)
