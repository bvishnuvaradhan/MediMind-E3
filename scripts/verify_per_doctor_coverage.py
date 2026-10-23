import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ["MONGODB_URI"])

doc_coll = client["medimind_doctor"].doctors
appt_coll = client["medimind_appointment"].appointments
rec_coll = client["medimind_records"]
ai_coll = client["medimind_ai"].predictions

all_docs = list(doc_coll.find({"status": "ACTIVE", "isDemonstration": {"$ne": True}, "is_demonstration": {"$ne": True}}))
print(f"Total active operational doctors found: {len(all_docs)}")

coverage_stats = []
doctors_with_zero_appts = []
doctors_with_zero_ai = []

for doc in all_docs:
    d_id = doc["_id"]
    email = doc.get("email")
    name = doc.get("full_name")
    
    # Check appointments by ObjectId or string
    appts = list(appt_coll.find({"$or": [{"doctor_id": d_id}, {"doctor_id": str(d_id)}, {"doctorId": d_id}, {"doctorId": str(d_id)}]}))
    appt_ids = [a["_id"] for a in appts]
    appt_id_strs = [str(a["_id"]) for a in appts]
    
    # Check consultations
    consults = rec_coll.consultations.count_documents({
        "$or": [
            {"doctor_id": d_id}, {"doctor_id": str(d_id)},
            {"appointment_id": {"$in": appt_ids + appt_id_strs}}
        ]
    })
    
    # Check prescriptions
    rxs = rec_coll.prescriptions.count_documents({
        "$or": [
            {"doctor_id": d_id}, {"doctor_id": str(d_id)},
            {"appointment_id": {"$in": appt_ids + appt_id_strs}}
        ]
    })
    
    # Check AI predictions
    ai_preds = ai_coll.count_documents({
        "$or": [
            {"doctor_id": d_id}, {"doctor_id": str(d_id)},
            {"appointment_id": {"$in": appt_ids + appt_id_strs}}
        ]
    })
    
    if len(appts) == 0:
        doctors_with_zero_appts.append((email, name))
    if ai_preds == 0:
        doctors_with_zero_ai.append((email, name))
        
    coverage_stats.append({
        "name": name,
        "email": email,
        "specialization": doc.get("specialization"),
        "appointments": len(appts),
        "consultations": consults,
        "prescriptions": rxs,
        "ai_predictions": ai_preds
    })

print(f"Doctors with 0 appointments: {len(doctors_with_zero_appts)}")
print(f"Doctors with 0 AI predictions: {len(doctors_with_zero_ai)}")
print("\nSample 5 operational doctors coverage:")
for s in coverage_stats[:5]:
    print(s)
print("\nSample 5 newly provisioned doctors coverage:")
for s in coverage_stats[-5:]:
    print(s)
