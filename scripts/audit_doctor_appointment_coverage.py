import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017")
doc_db = client["medimind_doctor"]
appt_db = client["medimind_appointment"]
hosp_db = client["medimind_hospital"]

hospitals = {str(h["_id"]): h["name"] for h in hosp_db.hospitals.find({})}

doctors = list(doc_db.doctors.find({}))
print(f"Total doctor documents in DB: {len(doctors)}")

doctor_appts = {}
for a in appt_db.appointments.find({}):
    did = str(a.get("doctor_id"))
    doctor_appts[did] = doctor_appts.get(did, 0) + 1

active_with_appts = []
active_without_appts = []
inactive_docs = []

for d in doctors:
    did = str(d["_id"])
    count = doctor_appts.get(did, 0)
    name = f"Dr. {d.get('first_name', '')} {d.get('last_name', '')}".strip()
    spec = d.get("specialization", "")
    status = d.get("status", "ACTIVE")
    email = d.get("email", "")
    hosp_name = hospitals.get(str(d.get("hospital_id")), "Unknown Hospital")
    
    info = {
        "id": did,
        "name": name,
        "email": email,
        "specialization": spec,
        "hospital": hosp_name,
        "status": status,
        "appointment_count": count
    }
    
    if status == "INACTIVE" or "demo" in email.lower():
        inactive_docs.append(info)
    elif count > 0:
        active_with_appts.append(info)
    else:
        active_without_appts.append(info)

print(f"Operational doctors with appointments: {len(active_with_appts)}")
print(f"Operational doctors with 0 appointments: {len(active_without_appts)}")
print(f"Inactive / Demo doctors (0 appointments): {len(inactive_docs)}")
total_appts_accounted = sum(d["appointment_count"] for d in active_with_appts)
print(f"Total appointments accounted for across doctors: {total_appts_accounted}")

print("\nSummary by Hospital for Operational Doctors with 0 appointments:")
hosp_summary = {}
for d in active_without_appts:
    hosp = d["hospital"]
    hosp_summary[hosp] = hosp_summary.get(hosp, 0) + 1
for h, c in hosp_summary.items():
    print(f"  {h}: {c} doctors")
