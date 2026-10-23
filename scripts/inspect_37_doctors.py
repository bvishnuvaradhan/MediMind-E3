import pymongo

client = pymongo.MongoClient("mongodb://127.0.0.1:27017")
doc_db = client["medimind_doctor"]
appt_db = client["medimind_appointment"]
hosp_db = client["medimind_hospital"]

hospitals = {str(h["_id"]): h for h in hosp_db.hospitals.find({})}
departments = {str(d["_id"]): d for d in hosp_db.departments.find({})}

doctor_appts = {str(d["_id"]): appt_db.appointments.count_documents({"doctor_id": d["_id"]}) for d in doc_db.doctors.find({})}

new_37_docs = []
for d in doc_db.doctors.find({}):
    did = str(d["_id"])
    count = doctor_appts[did]
    status = d.get("status", "ACTIVE")
    email = d.get("email", "")
    if status == "ACTIVE" and count == 0 and "demo" not in email.lower():
        hid = str(d.get("hospital_id"))
        dept_id = str(d.get("department_id"))
        hosp = hospitals.get(hid, {})
        dept = departments.get(dept_id, {})
        new_37_docs.append({
            "id": did,
            "name": f"Dr. {d.get('first_name', '')} {d.get('last_name', '')}",
            "email": email,
            "specialization": d.get("specialization"),
            "hospital_id": hid,
            "hospital_name": hosp.get("name"),
            "hospital_code": hosp.get("code"),
            "department_id": dept_id,
            "department_name": dept.get("name"),
        })

print(f"Total new doctors identified: {len(new_37_docs)}")
hosp_counts = {}
dept_counts = {}
for d in new_37_docs:
    hosp_counts[d["hospital_name"]] = hosp_counts.get(d["hospital_name"], 0) + 1
    dept_counts[d["department_name"]] = dept_counts.get(d["department_name"], 0) + 1

print("\nBy Hospital:", hosp_counts)
print("\nBy Department:", dept_counts)
print("\nSample new doctors:")
for d in new_37_docs[:5]:
    print(" ", d)
