import json
import pymongo
from bson import ObjectId
from datetime import datetime

client = pymongo.MongoClient('mongodb://127.0.0.1:27017')
hosp_db = client['medimind_hospital']
doc_db = client['medimind_doctor']
fam_db = client['medimind_family']
auth_db = client['medimind_auth']

def sanitize(doc):
    res = {}
    for k, v in doc.items():
        if 'password' in k.lower() or 'secret' in k.lower() or 'hash' in k.lower():
            continue
        if isinstance(v, ObjectId):
            res[k] = str(v)
        elif isinstance(v, datetime):
            res[k] = v.isoformat()
        elif isinstance(v, dict):
            res[k] = sanitize(v)
        elif isinstance(v, list):
            res[k] = [sanitize(x) if isinstance(x, dict) else str(x) if isinstance(x, (ObjectId, datetime)) else x for x in v]
        else:
            res[k] = v
    return res

hospitals = [sanitize(h) for h in hosp_db.hospitals.find()]
departments = [sanitize(d) for d in hosp_db.departments.find()]
department_heads = [sanitize(dh) for dh in hosp_db.departmentheads.find()]
doctors = [sanitize(doc) for doc in doc_db.doctors.find()]
families = [sanitize(f) for f in fam_db.families.find()]
family_members = [sanitize(m) for m in fam_db.familymembers.find()]
chairmen = [sanitize(u) for u in auth_db.users.find({'role': 'CHAIRMAN'})]

data = {
    'hospitals': hospitals,
    'departments': departments,
    'department_heads': department_heads,
    'doctors': doctors,
    'families': families,
    'family_members': family_members,
    'chairmen': chairmen
}

with open('scripts/canonical_db_dump.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Dumped counts:')
print(f'Hospitals: {len(hospitals)}')
print(f'Departments: {len(departments)}')
print(f'Department Heads: {len(department_heads)}')
print(f'Doctors: {len(doctors)}')
print(f'Families: {len(families)}')
print(f'Family Members: {len(family_members)}')
print(f'Chairmen: {len(chairmen)}')
