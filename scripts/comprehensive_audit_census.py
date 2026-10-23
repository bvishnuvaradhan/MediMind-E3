import os
import dotenv
from pymongo import MongoClient

env = dotenv.dotenv_values('backend/.env')
uri = env.get('MONGODB_URI')
client = MongoClient(uri, tls=True)

print("=== 1. APPOINTMENT CENSUS ===")
db_appt = client['medimind_appointment']
appts = list(db_appt['appointments'].find({}))
print(f"Total Appointments: {len(appts)}")

status_counts = {}
type_counts = {}
has_pred = 0
has_fam_id = 0
has_member_id = 0
doctor_appts = {}
family_appts = {}
member_appts = {}

for a in appts:
    st = a.get('status')
    status_counts[st] = status_counts.get(st, 0) + 1
    
    t = a.get('appointment_type') or a.get('type') or 'N/A'
    type_counts[t] = type_counts.get(t, 0) + 1
    
    if a.get('prediction_id'):
        has_pred += 1
        
    fid = str(a.get('family_id')) if a.get('family_id') else None
    if fid:
        has_fam_id += 1
        family_appts[fid] = family_appts.get(fid, 0) + 1
        
    mid = str(a.get('family_member_id')) if a.get('family_member_id') else None
    if mid:
        has_member_id += 1
        member_appts[mid] = member_appts.get(mid, 0) + 1
        
    did = str(a.get('doctor_id')) if a.get('doctor_id') else 'NO_DOC'
    doctor_appts[did] = doctor_appts.get(did, 0) + 1

print("Status Breakdown:", status_counts)
print("Type Breakdown:", type_counts)
print(f"Appointments with prediction_id: {has_pred} / {len(appts)}")
print(f"Appointments with family_id: {has_fam_id}")
print(f"Appointments with family_member_id: {has_member_id}")
print(f"Distinct doctors with appointments: {len(doctor_appts)}")
print(f"Distinct families with appointments: {len(family_appts)}")
print(f"Distinct family members with appointments: {len(member_appts)}")

print("\n=== 2. AI PREDICTION CENSUS ===")
db_ai = client['medimind_ai']
preds = list(db_ai['predictions'].find({}))
print(f"Total AI Predictions: {len(preds)}")
pred_types = {}
appt_linked = 0
standalone = 0
linked_appt_ids = set()

for p in preds:
    pt = p.get('prediction_type') or p.get('model_type') or 'UNKNOWN'
    pred_types[pt] = pred_types.get(pt, 0) + 1
    aid = p.get('appointment_id')
    if aid:
        appt_linked += 1
        linked_appt_ids.add(str(aid))
    else:
        standalone += 1

print(f"Appointment-linked: {appt_linked}, Standalone: {standalone}")
print(f"Distinct appointment_ids referenced in predictions: {len(linked_appt_ids)}")
print("Prediction types:", pred_types)

print("\n=== 3. DOCTOR CENSUS ===")
db_doc = client['medimind_doctor']
docs = list(db_doc['doctors'].find({}))
print(f"Total Doctor Profiles: {len(docs)}")
doc_statuses = {}
demo_docs = 0
for d in docs:
    st = d.get('status')
    doc_statuses[st] = doc_statuses.get(st, 0) + 1
    if d.get('is_demonstration') or 'demo' in (d.get('email') or ''):
        demo_docs += 1
print("Doctor Statuses:", doc_statuses)
print(f"Demo / test doctor profiles: {demo_docs}")

print("\n=== 4. AUTH USERS CENSUS ===")
db_auth = client['medimind_auth']
users = list(db_auth['users'].find({}))
print(f"Total Auth Users: {len(users)}")
user_roles = {}
user_statuses = {}
for u in users:
    r = u.get('role')
    user_roles[r] = user_roles.get(r, 0) + 1
    st = u.get('status')
    user_statuses[st] = user_statuses.get(st, 0) + 1
print("User Roles:", user_roles)
print("User Statuses:", user_statuses)

print("\n=== 5. FAMILY & MEMBERS CENSUS ===")
db_fam = client['medimind_family']
fams = list(db_fam['families'].find({}))
members = list(db_fam['familymembers'].find({}))
print(f"Total Families: {len(fams)}, Total Members: {len(members)}")

print("\n=== 6. MEDICAL RECORDS CENSUS ===")
db_rec = client['medimind_records']
recs = list(db_rec['records'].find({})) if 'records' in db_rec.list_collection_names() else list(db_rec['medicalrecords'].find({})) if 'medicalrecords' in db_rec.list_collection_names() else []
print(f"Total Medical Records: {len(recs)}")

print("\n=== 7. KNOWLEDGE CENSUS ===")
db_know = client['medimind_knowledge']
articles = list(db_know['articles'].find({}))
print(f"Total Knowledge Articles: {len(articles)}")
