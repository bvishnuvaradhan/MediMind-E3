import pymongo
import json

client = pymongo.MongoClient('mongodb://localhost:27017')

print("=== 1. DEMO ACCOUNTS IN MONGODB ===")
auth_db = client['medimind_auth']
demo_users = list(auth_db.users.find({'email': {'$regex': 'demo\\.'}}, {'password_hash': 0}))
print(f"Total demo users in medimind_auth.users: {len(demo_users)}")
for u in demo_users:
    print(f"  User: id={u.get('_id')}, email={u.get('email')}, role={u.get('role')}, status={u.get('status')}, hospital={u.get('hospital_id')}")

doc_db = client['medimind_doctor']
demo_docs = list(doc_db.doctors.find({'email': {'$regex': 'demo\\.'}}))
print(f"Total demo doctors in medimind_doctor.doctors: {len(demo_docs)}")
for d in demo_docs:
    print(f"  Doctor Profile: id={d.get('_id')}, user_id={d.get('user_id')}, email={d.get('email')}, name={d.get('full_name')}, status={d.get('status')}")

hosp_db = client['medimind_hospital']
demo_dhs = list(hosp_db.departmentheads.find({'email': {'$regex': 'demo\\.'}}))
print(f"Total demo dept heads in medimind_hospital.departmentheads: {len(demo_dhs)}")
for dh in demo_dhs:
    print(f"  DeptHead Profile: id={dh.get('_id')}, user_id={dh.get('user_id')}, email={dh.get('email')}, status={dh.get('status')}")

print("\n=== 2. TOTAL USER ACCOUNTS BY ROLE IN medimind_auth.users ===")
pipeline = [
    {'$group': {'_id': {'role': '$role', 'status': '$status'}, 'count': {'$sum': 1}}}
]
role_counts = list(auth_db.users.aggregate(pipeline))
for rc in sorted(role_counts, key=lambda x: str(x['_id'])):
    print(f"  Role: {rc['_id'].get('role'):16} | Status: {rc['_id'].get('status'):10} | Count: {rc['count']}")

print("\n=== 3. 66 DOCTOR ROSTER RECONCILIATION ===")
with open('scripts/historical_66_doctors.json', 'r', encoding='utf-8') as f:
    hist_66 = json.load(f)
print(f"Entries in scripts/historical_66_doctors.json: {len(hist_66)}")

auth_doctors = list(auth_db.users.find({'role': 'DOCTOR'}))
auth_doc_emails = {u.get('email', '').lower(): u for u in auth_doctors}
doc_profiles = list(doc_db.doctors.find())
doc_profile_emails = {d.get('email', '').lower(): d for d in doc_profiles}

print(f"Total DOCTOR users in auth: {len(auth_doctors)}")
print(f"Total doctor profiles in doctor DB: {len(doc_profiles)}")

provisioned = []
unprovisioned = []
for h in hist_66:
    email = h.get('email', '').lower()
    in_auth = email in auth_doc_emails
    in_profile = email in doc_profile_emails
    if in_auth and in_profile:
        provisioned.append(h)
    else:
        unprovisioned.append(h)

print(f"Historical 66 doctors matched as provisioned operational: {len(provisioned)}")
print(f"Historical 66 doctors unprovisioned (design capacity): {len(unprovisioned)}")

print("\n=== 4. APPOINTMENT DATABASE COUNTS ===")
appt_db = client['medimind_appointment']
total_appts = appt_db.appointments.count_documents({})
print(f"Total appointments in medimind_appointment: {total_appts}")
status_counts = list(appt_db.appointments.aggregate([
    {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
]))
for sc in sorted(status_counts, key=lambda x: str(x['_id'])):
    print(f"  Status: {sc['_id']:12} | Count: {sc['count']}")
