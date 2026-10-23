import os
import json
import datetime
import bcrypt
import pymongo
from bson import ObjectId
from dotenv import load_dotenv

def provision_atlas():
    load_dotenv("backend/.env")
    uri = os.environ.get("MONGODB_URI")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)

    auth_db = client["medimind_auth"]
    doc_db = client["medimind_doctor"]
    hosp_db = client["medimind_hospital"]
    appt_db = client["medimind_appointment"]

    initial_docs = doc_db.doctors.count_documents({})
    initial_users = auth_db.users.count_documents({})
    initial_appts = appt_db.appointments.count_documents({})
    print(f"[*] Initial Atlas State: Doctors={initial_docs}, AuthUsers={initial_users}, Appointments={initial_appts}")

    # Load hospital mappings
    hospitals = {h["code"]: h for h in hosp_db.hospitals.find()}
    h1 = hospitals["MM-HYD-01"] # Aarogyam
    h2 = hospitals["MM-HYD-02"] # Nexora
    h3 = hospitals["MM-MUM-03"] # Harborview

    hosp_slug_map = {
        h1["_id"]: "aarogyam",
        h2["_id"]: "nexora",
        h3["_id"]: "harborview"
    }

    # Departments map: (hospital_id, dept_code or dept_type) -> department_id
    depts = list(hosp_db.departments.find())
    dept_by_hosp = {}
    for d in depts:
        hid = d.get("hospital_id") or d.get("hospitalId")
        if hid not in dept_by_hosp:
            dept_by_hosp[hid] = {}
        dept_by_hosp[hid][d["code"]] = d["_id"]
        dept_by_hosp[hid][d["name"]] = d["_id"]

    standard_avail = [
        {"day": "MONDAY", "start_time": "09:00", "end_time": "17:00"},
        {"day": "TUESDAY", "start_time": "09:00", "end_time": "17:00"},
        {"day": "WEDNESDAY", "start_time": "09:00", "end_time": "17:00"},
        {"day": "THURSDAY", "start_time": "09:00", "end_time": "17:00"},
        {"day": "FRIDAY", "start_time": "09:00", "end_time": "17:00"},
    ]

    existing_docs = list(doc_db.doctors.find())
    existing_names = {d.get("name") or d.get("full_name") for d in existing_docs}

    with open("scripts/historical_66_doctors.json", "r", encoding="utf-8") as f:
        h66 = json.load(f)

    candidates = [d for d in h66 if d.get("name") not in existing_names][:37]
    print(f"[*] Selected {len(candidates)} doctor profiles from historical_66_doctors.json to provision as DOC-030 .. DOC-066.")

    now = datetime.datetime.now(datetime.timezone.utc)

    def resolve_department(hid, orig_dept_name, spec):
        h_depts = dept_by_hosp.get(hid, {})
        name_low = (orig_dept_name + " " + spec).lower()
        if "ortho" in name_low or "joint" in name_low or "trauma" in name_low or "spine" in name_low:
            return h_depts.get("ORTHO") or list(h_depts.values())[0]
        elif "diab" in name_low or "endocrin" in name_low or "metabolic" in name_low or "glycemic" in name_low:
            return h_depts.get("DIAB") or list(h_depts.values())[0]
        elif "cardio" in name_low or "heart" in name_low or "angio" in name_low or "coronary" in name_low:
            return h_depts.get("CARDIO") or list(h_depts.values())[0]
        elif "gen" in name_low or "adult" in name_low or "primary" in name_low:
            return h_depts.get("GENMED") or h_depts.get("INTMED") or h_depts.get("PREVMED") or list(h_depts.values())[0]
        elif "internal" in name_low or "nephro" in name_low or "pulm" in name_low or "gastro" in name_low:
            return h_depts.get("INTMED") or h_depts.get("GENMED") or list(h_depts.values())[0]
        elif "prev" in name_low or "family" in name_low:
            return h_depts.get("PREVMED") or h_depts.get("GENMED") or list(h_depts.values())[0]
        else:
            return list(h_depts.values())[0]

    def resolve_hospital(orig_hosp_name):
        if "MediMind Central" in orig_hosp_name:
            return h1["_id"]
        elif "Apex" in orig_hosp_name:
            return h2["_id"]
        else:
            return h3["_id"]

    provisioned = 0
    for idx, d in enumerate(candidates, 30):
        full_name = d.get("name").strip()
        orig_hosp = d.get("hospitalName")
        orig_dept = d.get("departmentName")
        spec = d.get("specialization")

        hid = resolve_hospital(orig_hosp)
        dept_id = resolve_department(hid, orig_dept, spec)
        hosp_slug = hosp_slug_map[hid]

        name_parts = [p.lower() for p in full_name.replace("Dr.", "").strip().split() if p]
        clean_slug = ".".join(name_parts)
        email = f"dr.{clean_slug}@{hosp_slug}.hospital"

        existing_doc = doc_db.doctors.find_one({"email": email})
        existing_user = auth_db.users.find_one({"email": email})

        plaintext_pw = f"Doctor#2026${idx:02d}!Dev"
        pw_hash = bcrypt.hashpw(plaintext_pw.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

        doc_id = existing_doc["_id"] if existing_doc else ObjectId()
        user_id = existing_user["_id"] if existing_user else ObjectId()

        quals = [q.strip() for q in d.get("qualification", "MBBS, MD").split(",")]
        try:
            exp_yrs = int(d.get("experienceYears") or d.get("experience", "8").split()[0])
        except Exception:
            exp_yrs = 8

        mobile = d.get("phone") or f"+91 98490 {idx:05d}"
        desc = d.get("description") or f"Consultant Specialist in {spec} at {hosp_db.hospitals.find_one({'_id': hid})['name']}."

        doc_data = {
            "_id": doc_id,
            "user_id": user_id,
            "hospital_id": hid,
            "department_id": dept_id,
            "full_name": full_name,
            "profile_picture": None,
            "email": email,
            "mobile": mobile,
            "specialization": spec,
            "qualifications": quals,
            "experience_years": exp_yrs,
            "professional_description": desc,
            "availability": standard_avail,
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now
        }
        doc_db.doctors.update_one({"_id": doc_id}, {"$set": doc_data}, upsert=True)

        user_data = {
            "_id": user_id,
            "email": email,
            "password_hash": pw_hash,
            "role": "DOCTOR",
            "account_type": "DOCTOR_ACCOUNT",
            "reference_id": doc_id,
            "doctor_id": doc_id,
            "family_id": None,
            "hospital_id": hid,
            "department_id": dept_id,
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now
        }
        auth_db.users.update_one({"_id": user_id}, {"$set": user_data}, upsert=True)
        provisioned += 1

    print(f"[+] Successfully provisioned {provisioned} doctors on Atlas.")

    # Provision 2 inactive demo doctor accounts
    demo_pw = bcrypt.hashpw("DemoInactive_2026_SecureBlock!".encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")
    
    # Demo 1: Ortho demo
    d1_email = "demo.doctor.ortho@medimind.test"
    d1_doc = doc_db.doctors.find_one({"email": d1_email})
    d1_id = d1_doc["_id"] if d1_doc else ObjectId()
    d1_uid = d1_doc.get("user_id") if d1_doc else ObjectId()

    aarogyam_ortho = dept_by_hosp[h1["_id"]].get("ORTHO") or list(dept_by_hosp[h1["_id"]].values())[0]

    doc_db.doctors.update_one({"email": d1_email}, {"$set": {
        "_id": d1_id,
        "user_id": d1_uid,
        "hospital_id": h1["_id"],
        "department_id": aarogyam_ortho,
        "full_name": "Dr. Demo Ortho (INACTIVE)",
        "email": d1_email,
        "mobile": "+91 99999 00001",
        "specialization": "Orthopedics & Trauma Surgery",
        "qualifications": ["MBBS", "MS (Ortho)"],
        "experience_years": 10,
        "status": "INACTIVE",
        "is_demonstration": True,
        "created_at": now,
        "updated_at": now,
    }}, upsert=True)

    auth_db.users.update_one({"email": d1_email}, {"$set": {
        "_id": d1_uid,
        "email": d1_email,
        "password_hash": demo_pw,
        "role": "DOCTOR",
        "account_type": "DOCTOR_ACCOUNT",
        "reference_id": d1_id,
        "doctor_id": d1_id,
        "hospital_id": h1["_id"],
        "department_id": aarogyam_ortho,
        "status": "INACTIVE",
        "is_demonstration": True,
        "created_at": now,
        "updated_at": now,
    }}, upsert=True)

    # Demo 2: Diabetes demo
    d2_email = "demo.doctor.diab@medimind.test"
    d2_doc = doc_db.doctors.find_one({"email": d2_email})
    d2_id = d2_doc["_id"] if d2_doc else ObjectId()
    d2_uid = d2_doc.get("user_id") if d2_doc else ObjectId()

    nexora_diab = dept_by_hosp[h2["_id"]].get("DIAB") or list(dept_by_hosp[h2["_id"]].values())[0]

    doc_db.doctors.update_one({"email": d2_email}, {"$set": {
        "_id": d2_id,
        "user_id": d2_uid,
        "hospital_id": h2["_id"],
        "department_id": nexora_diab,
        "full_name": "Dr. Demo Diab (INACTIVE)",
        "email": d2_email,
        "mobile": "+91 99999 00002",
        "specialization": "Diabetology & Endocrinology",
        "qualifications": ["MBBS", "MD (Endo)"],
        "experience_years": 12,
        "status": "INACTIVE",
        "is_demonstration": True,
        "created_at": now,
        "updated_at": now,
    }}, upsert=True)

    auth_db.users.update_one({"email": d2_email}, {"$set": {
        "_id": d2_uid,
        "email": d2_email,
        "password_hash": demo_pw,
        "role": "DOCTOR",
        "account_type": "DOCTOR_ACCOUNT",
        "reference_id": d2_id,
        "doctor_id": d2_id,
        "hospital_id": h2["_id"],
        "department_id": nexora_diab,
        "status": "INACTIVE",
        "is_demonstration": True,
        "created_at": now,
        "updated_at": now,
    }}, upsert=True)

    final_active_docs = doc_db.doctors.count_documents({"status": "ACTIVE"})
    final_total_docs = doc_db.doctors.count_documents({})
    final_auth_users = auth_db.users.count_documents({"status": "ACTIVE"})
    print(f"[+] Final Atlas State: Active Doctors={final_active_docs}, Total Profiles={final_total_docs}, Active AuthUsers={final_auth_users}")

if __name__ == "__main__":
    provision_atlas()
