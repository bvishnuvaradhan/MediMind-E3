import dotenv
from pymongo import MongoClient

env = dotenv.dotenv_values('backend/.env')
client = MongoClient(env['MONGODB_URI'], tls=True)

db_appt = client['medimind_appointment']
db_doc = client['medimind_doctor']
db_fam = client['medimind_family']
db_rec = client['medimind_records']
db_ai = client['medimind_ai']

appts = list(db_appt['appointments'].find({}))
docs = list(db_doc['doctors'].find({}))
fams = list(db_fam['families'].find({}))
members = list(db_fam['familymembers'].find({}))
preds = list(db_ai['predictions'].find({}))

doc_id_to_doc = {str(d['_id']): d for d in docs}
member_id_to_member = {str(m['_id']): m for m in members}
fam_id_to_fam = {str(f['_id']): f for f in fams}

print("=== APPOINTMENTS PER DOCTOR ===")
doc_appts = {}
doc_statuses = {}
for a in appts:
    did = str(a.get('doctor_id'))
    doc_appts[did] = doc_appts.get(did, 0) + 1
    st = a.get('status')
    if did not in doc_statuses:
        doc_statuses[did] = {}
    doc_statuses[did][st] = doc_statuses[did].get(st, 0) + 1

active_docs = [d for d in docs if d.get('status') == 'ACTIVE']
print(f"Total active doctors: {len(active_docs)}")
counts = [doc_appts.get(str(d['_id']), 0) for d in active_docs]
print(f"Min appts per active doctor: {min(counts)}")
print(f"Max appts per active doctor: {max(counts)}")
print(f"Avg appts per active doctor: {sum(counts)/len(counts):.1f}")
zero_appts_docs = [d for d in active_docs if doc_appts.get(str(d['_id']), 0) == 0]
print(f"Active doctors with 0 appointments: {len(zero_appts_docs)}")

print("\n=== APPOINTMENTS PER FAMILY MEMBER ===")
member_appt_counts = {}
for a in appts:
    mid = str(a.get('family_member_id'))
    member_appt_counts[mid] = member_appt_counts.get(mid, 0) + 1

mem_counts = [member_appt_counts.get(str(m['_id']), 0) for m in members]
print(f"Total family members: {len(members)}")
print(f"Min appts per member: {min(mem_counts)}")
print(f"Max appts per member: {max(mem_counts)}")
print(f"Avg appts per member: {sum(mem_counts)/len(mem_counts):.1f}")
zero_appts_members = [m for m in members if member_appt_counts.get(str(m['_id']), 0) == 0]
print(f"Members with 0 appointments: {len(zero_appts_members)}")

print("\n=== CHECK COLLECTIONS IN medimind_records & OTHER DBS ===")
for db_name in client.list_database_names():
    if 'medimind' in db_name:
        db = client[db_name]
        print(f"DB {db_name}: {db.list_collection_names()}")
        for c in db.list_collection_names():
            cnt = db[c].count_documents({})
            print(f"   {c}: {cnt}")
