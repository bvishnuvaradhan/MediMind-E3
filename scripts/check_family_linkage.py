from pymongo import MongoClient

c = MongoClient("mongodb://127.0.0.1:27017")
db_auth = c["medimind_auth"]
db_fam = c["medimind_family"]

users = list(db_auth.users.find({"role": "FAMILY"}))
for u in users:
    ref_id = u.get("reference_id")
    fam = db_fam.families.find_one({"_id": ref_id})
    if fam:
        mem_cnt = db_fam.familymembers.count_documents({"family_id": fam["_id"]})
        print(f"User: {u['email']} -> Family: {fam['family_name']} (_id={fam['_id']}), members={mem_cnt}")
    else:
        print(f"User: {u['email']} -> Family NOT FOUND for reference_id={ref_id}")
