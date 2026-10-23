import pymongo
from collections import Counter

client = pymongo.MongoClient("mongodb://localhost:27017")

print("--- MONGO DATABASES ---")
db_names = [d for d in client.list_database_names() if d.startswith("medimind")]
for dbn in sorted(db_names):
    db = client[dbn]
    colls = db.list_collection_names()
    print(f"DB: {dbn} -> Collections: {colls}")
    for c in colls:
        cnt = db[c].count_documents({})
        print(f"   {c}: {cnt} docs")

# Check doctors
doc_db = client["medimind_doctor"]
appt_db = client["medimind_appointment"]
ai_db = client["medimind_ai"]
auth_db = client["medimind_auth"]
hosp_db = client["medimind_hospital"]

print("\n--- DOCTORS SUMMARY ---")
docs = list(doc_db.doctors.find({}))
print(f"Total doctor profiles: {len(docs)}")
status_cnt = Counter(d.get("status") for d in docs)
print("Doctor status counts:", status_cnt)

# Check appointments per doctor
doctor_appts = Counter(str(a.get("doctor_id")) for a in appt_db.appointments.find({}))
print(f"Total appointments: {appt_db.appointments.count_documents({})}")
with_appts = [d for d in docs if doctor_appts[str(d["_id"])] > 0]
without_appts = [d for d in docs if doctor_appts[str(d["_id"])] == 0]
print(f"Doctors with appointments: {len(with_appts)}")
print(f"Doctors with 0 appointments: {len(without_appts)}")

# Check AI predictions
print("\n--- AI PREDICTIONS SUMMARY ---")
total_preds = ai_db.predictions.count_documents({})
linked_preds = ai_db.predictions.count_documents({"appointment_id": {"$ne": None}})
standalone_preds = ai_db.predictions.count_documents({"appointment_id": None})
print(f"Total AI predictions: {total_preds}")
print(f"Linked to appointment: {linked_preds}")
print(f"Standalone: {standalone_preds}")
by_model = Counter(p.get("model_name") for p in ai_db.predictions.find({}))
print("By model:", by_model)

# Check hospitals
print("\n--- HOSPITALS SUMMARY ---")
hosps = list(hosp_db.hospitals.find({}))
for h in hosps:
    print(f"Hospital: {h.get('name')} (ID: {h.get('_id')}, Code: {h.get('code')}, Status: {h.get('status')})")

# Check users (Auth)
print("\n--- AUTH USERS SUMMARY ---")
users = list(auth_db.users.find({}))
print(f"Total auth users: {len(users)}")
role_cnt = Counter(u.get("role") for u in users)
print("Users by role:", role_cnt)
user_status_cnt = Counter(u.get("status", "ACTIVE") for u in users)
print("Users by status:", user_status_cnt)
