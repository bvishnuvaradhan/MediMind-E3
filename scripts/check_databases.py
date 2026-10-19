from pymongo import MongoClient

c = MongoClient("mongodb://127.0.0.1:27017")
dbs = [
    "medimind_auth",
    "medimind_family",
    "medimind_doctor",
    "medimind_hospital",
    "medimind_appointment",
    "medimind_records",
    "medimind_knowledge",
    "medimind_ai"
]

for db_name in dbs:
    db = c[db_name]
    colls = db.list_collection_names()
    print(f"\n[{db_name}] Collections: {len(colls)}")
    for col in sorted(colls):
        cnt = db[col].count_documents({})
        print(f"  - {col}: {cnt} documents")
