import openpyxl
from pymongo import MongoClient
from bson import ObjectId

c = MongoClient("mongodb://127.0.0.1:27017")
db_auth = c["medimind_auth"]
db_fam = c["medimind_family"]
db_doc = c["medimind_doctor"]
db_hosp = c["medimind_hospital"]

print("=== FAMILIES IN DB ===")
families = list(db_fam.families.find({}))
print(f"Total families in medimind_family.families: {len(families)}")
for f in families:
    mem_cnt = db_fam.familymembers.count_documents({"family_id": f["_id"]})
    print(f"Family _id={f['_id']}, family_code={f.get('family_id')}, name={f.get('family_name')}, primary_email={f.get('primary_contact_email')}, member_count={mem_cnt}")
    members = list(db_fam.familymembers.find({"family_id": f["_id"]}))
    for m in members:
        print(f"   Member: _id={m['_id']}, name={m.get('full_name', m.get('name'))}, rel={m.get('relationship')}, dob={m.get('dob')}")

print("\n=== FAMILY USERS IN medimind_auth.users ===")
users = list(db_auth.users.find({"role": "FAMILY"}))
print(f"Total FAMILY users in auth: {len(users)}")
for u in users:
    print(f"User _id={u['_id']}, email={u.get('email')}, name={u.get('name')}, reference_id={u.get('reference_id')}, family_id={u.get('family_id')}")

print("\n=== EXCEL WORKBOOK FAMILY SHEET ===")
wb = openpyxl.load_workbook("Documents/MediMind_Role_Credentials.xlsx", data_only=True)
ws = wb["Family"]
rows = list(ws.iter_rows(values_only=True))
headers = rows[0]
print("Family headers:", headers)
for r in rows[1:]:
    # Sanitized (no passwords)
    sanitized = {headers[i]: r[i] for i in range(len(headers)) if headers[i].lower() != "password"}
    print("Excel Family:", sanitized)
