import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017')
doc_db = client['medimind_doctor']
docs = list(doc_db.doctors.find())
print(f"Total doctor profiles in medimind_doctor.doctors: {len(docs)}")
for i, d in enumerate(docs, 1):
    print(f"{i:02d}. {d.get('full_name')} | {d.get('email')} | Hosp: {d.get('hospital_id')} | Dept: {d.get('department_id')} | Status: {d.get('status')}")
