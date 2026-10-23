import os
from urllib.parse import urlparse
import pymongo
from dotenv import load_dotenv

def get_masked_uri(raw_uri: str) -> str:
    clean = raw_uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")
    p = urlparse(clean)
    proto = "mongodb+srv://" if raw_uri.startswith("mongodb+srv://") else "mongodb://"
    return f"{proto}***:***@{p.hostname}"

def inspect_atlas():
    load_dotenv("backend/.env")
    uri = os.environ.get("MONGODB_URI")
    print(f"Connecting to: {get_masked_uri(uri)}")

    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    info = client.server_info()
    print(f"MongoDB Version: {info.get('version')}")

    dbs = client.list_database_names()
    print(f"Logical Databases: {dbs}\n")

    results = {}

    # 1. Hospitals
    hosp_db = client["medimind_hospital"]
    hospitals = list(hosp_db.hospitals.find({}, {"name": 1, "code": 1, "status": 1}))
    depts = list(hosp_db.departments.find({}, {"name": 1, "hospitalId": 1}))
    reqs = list(hosp_db.hospitalrequests.find({}, {"hospitalName": 1, "status": 1}))
    print(f"--- HOSPITALS (medimind_hospital) ---")
    print(f"Total Hospitals: {len(hospitals)}")
    for h in hospitals:
        print(f"  - {h.get('name')} ({h.get('code')}) - Status: {h.get('status')}")
    print(f"Total Departments: {len(depts)}")
    print(f"Pending/Decided Hospital Requests: {len(reqs)}")
    for r in reqs:
        print(f"  - Request: {r.get('hospitalName')} - Status: {r.get('status')}")

    # 2. Doctors
    doc_db = client["medimind_doctor"]
    doctors = list(doc_db.doctors.find({}))
    print(f"\n--- DOCTORS (medimind_doctor) ---")
    print(f"Total Doctor Profiles: {len(doctors)}")
    active_docs = [d for d in doctors if d.get("status") == "ACTIVE"]
    inactive_docs = [d for d in doctors if d.get("status") != "ACTIVE"]
    print(f"  Active Doctors: {len(active_docs)}")
    print(f"  Inactive Doctors: {len(inactive_docs)}")
    for d in inactive_docs:
        print(f"    - Inactive: {d.get('name')} ({d.get('email')}) - Status: {d.get('status')}")

    # 3. Auth Users
    auth_db = client["medimind_auth"]
    users = list(auth_db.users.find({}))
    print(f"\n--- AUTH USERS (medimind_auth) ---")
    print(f"Total Auth Users: {len(users)}")
    role_counts = {}
    for u in users:
        r = u.get("role", "UNKNOWN")
        role_counts[r] = role_counts.get(r, 0) + 1
    for r, count in sorted(role_counts.items()):
        print(f"  Role {r}: {count}")

    # 4. Family Accounts
    fam_db = client["medimind_family"]
    families = list(fam_db.families.find({}))
    members = list(fam_db.familymembers.find({}))
    print(f"\n--- FAMILIES (medimind_family) ---")
    print(f"Total Families: {len(families)}")
    print(f"Total Family Members: {len(members)}")

    # 5. Appointments
    apt_db = client["medimind_appointment"]
    apts = list(apt_db.appointments.find({}))
    print(f"\n--- APPOINTMENTS (medimind_appointment) ---")
    print(f"Total Appointments: {len(apts)}")
    status_counts = {}
    walkins = 0
    apt_by_doc = {}
    for a in apts:
        st = a.get("status", "UNKNOWN")
        status_counts[st] = status_counts.get(st, 0) + 1
        if a.get("isWalkIn") or a.get("type") == "WALK_IN":
            walkins += 1
        did = str(a.get("doctorId", ""))
        apt_by_doc[did] = apt_by_doc.get(did, 0) + 1

    for st, count in sorted(status_counts.items()):
        print(f"  Status {st}: {count}")
    print(f"  Walk-in Appointments: {walkins}")

    # Check doctor appointment coverage
    docs_with_apts = 0
    docs_zero_apts = []
    for d in doctors:
        did = str(d.get("_id"))
        uid = str(d.get("userId", ""))
        c = apt_by_doc.get(did, 0) or apt_by_doc.get(uid, 0)
        if c > 0:
            docs_with_apts += 1
        else:
            docs_zero_apts.append(d)

    print(f"  Doctors with appointments: {docs_with_apts}")
    print(f"  Doctors with 0 appointments: {len(docs_zero_apts)}")

    # 6. Medical Records
    rec_db = client["medimind_records"]
    consultations = list(rec_db.consultations.find({})) if "consultations" in rec_db.list_collection_names() else []
    prescriptions = list(rec_db.prescriptions.find({})) if "prescriptions" in rec_db.list_collection_names() else []
    records = list(rec_db.medicalrecords.find({})) if "medicalrecords" in rec_db.list_collection_names() else []
    print(f"\n--- RECORDS (medimind_records) ---")
    print(f"Total Consultations: {len(consultations)}")
    print(f"Total Prescriptions: {len(prescriptions)}")
    print(f"Total Medical Records: {len(records)}")

    # 7. AI Predictions
    ai_db = client["medimind_ai"]
    preds = list(ai_db.predictions.find({}))
    print(f"\n--- AI PREDICTIONS (medimind_ai) ---")
    print(f"Total Predictions: {len(preds)}")
    pred_models = {}
    linked = 0
    for p in preds:
        m = p.get("model_name", "UNKNOWN")
        pred_models[m] = pred_models.get(m, 0) + 1
        if p.get("appointment_id"):
            linked += 1
    for m, c in sorted(pred_models.items()):
        print(f"  Model {m}: {c}")
    print(f"  Appointment-linked: {linked}, Standalone: {len(preds) - linked}")

    # 8. Knowledge
    know_db = client["medimind_knowledge"]
    articles = list(know_db.articles.find({})) if "articles" in know_db.list_collection_names() else []
    print(f"\n--- KNOWLEDGE (medimind_knowledge) ---")
    print(f"Total Articles: {len(articles)}")
    art_status = {}
    for a in articles:
        st = a.get("status", "UNKNOWN")
        art_status[st] = art_status.get(st, 0) + 1
    for st, c in sorted(art_status.items()):
        print(f"  Status {st}: {c}")

if __name__ == "__main__":
    inspect_atlas()
