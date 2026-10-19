import openpyxl
import requests
import json
from pymongo import MongoClient
from bson import ObjectId

c = MongoClient("mongodb://127.0.0.1:27017")
db_auth = c["medimind_auth"]
db_fam = c["medimind_family"]
db_doc = c["medimind_doctor"]
db_hosp = c["medimind_hospital"]

wb = openpyxl.load_workbook("Documents/MediMind_Role_Credentials.xlsx", data_only=True)
sheets = ["Chairman", "Hospital Admin", "Department Head", "Doctor", "Family"]

GATEWAY_URL = "http://localhost:5000"

results = []

for s in sheets:
    ws = wb[s]
    rows = list(ws.iter_rows(values_only=True))
    headers = [str(h) if h is not None else "" for h in rows[0]]
    
    email_idx = headers.index("Email / Username")
    pwd_idx = headers.index("Password")
    role_idx = headers.index("Role")
    name_idx = headers.index("Full Name")
    id_idx = headers.index("Account ID")
    
    for row in rows[1:]:
        email = row[email_idx]
        pwd = row[pwd_idx]
        role = row[role_idx]
        expected_name = row[name_idx]
        expected_id = row[id_idx]
        
        # 1. Database check
        user_doc = db_auth.users.find_one({"email": email})
        db_exists = user_doc is not None
        db_role = user_doc.get("role") if user_doc else None
        
        # 2. Login via API Gateway
        login_ok = False
        api_user = {}
        token = ""
        error_msg = ""
        try:
            res = requests.post(f"{GATEWAY_URL}/api/auth/login", json={"email": email, "password": pwd}, timeout=5)
            if res.status_code == 200:
                body = res.json()
                login_ok = body.get("success", False)
                data = body.get("data", {})
                token = data.get("token", "")
                api_user = data.get("user", {})
            else:
                error_msg = f"HTTP {res.status_code}: {res.text[:100]}"
        except Exception as e:
            error_msg = str(e)
            
        # 3. Role-specific API & data verification
        role_details = {}
        if login_ok and token:
            headers_auth = {"Authorization": f"Bearer {token}"}
            if role == "FAMILY":
                try:
                    fam_res = requests.get(f"{GATEWAY_URL}/api/families/me", headers=headers_auth, timeout=5)
                    fam_data = fam_res.json().get("data", {}) if fam_res.status_code == 200 else {}
                    
                    mem_res = requests.get(f"{GATEWAY_URL}/api/families/members", headers=headers_auth, timeout=5)
                    mem_data = mem_res.json().get("data", []) if mem_res.status_code == 200 else []
                    
                    # Direct DB members count
                    db_fam_doc = db_fam.families.find_one({"_id": user_doc.get("reference_id")})
                    db_mem_count = db_fam.familymembers.count_documents({"family_id": db_fam_doc["_id"]}) if db_fam_doc else 0
                    
                    role_details = {
                        "family_name": fam_data.get("familyName"),
                        "family_id_str": user_doc.get("family_id"),
                        "api_member_count": len(mem_data),
                        "db_member_count": db_mem_count,
                        "members": [m.get("fullName") for m in mem_data]
                    }
                except Exception as e:
                    role_details["error"] = str(e)
            elif role == "DOCTOR":
                doc_id = api_user.get("doctorId") or (str(user_doc.get("reference_id")) if user_doc else None)
                db_doc_record = db_doc.doctors.find_one({"_id": ObjectId(doc_id)}) if doc_id else None
                role_details = {
                    "doctor_id": doc_id,
                    "doctor_name": db_doc_record.get("full_name") or db_doc_record.get("name") if db_doc_record else None,
                    "specialty": db_doc_record.get("specialty") or db_doc_record.get("specialization") if db_doc_record else None,
                    "hospital_id": str(db_doc_record.get("hospital_id")) if db_doc_record else None,
                    "department_id": str(db_doc_record.get("department_id")) if db_doc_record else None
                }
            elif role == "DEPARTMENT_HEAD":
                dept_id = api_user.get("departmentId") or (str(user_doc.get("reference_id")) if user_doc else None)
                db_head = db_hosp.departmentheads.find_one({"user_id": user_doc["_id"]}) if user_doc else None
                role_details = {
                    "department_id": dept_id,
                    "head_name": db_head.get("name") if db_head else None,
                    "department_name": db_head.get("department_name") if db_head else None,
                    "hospital_id": str(db_head.get("hospital_id")) if db_head else None
                }
            elif role == "HOSPITAL_ADMIN":
                hosp_id = api_user.get("hospitalId") or (str(user_doc.get("reference_id")) if user_doc else None)
                db_hosp_record = db_hosp.hospitals.find_one({"_id": ObjectId(hosp_id)}) if hosp_id else None
                role_details = {
                    "hospital_id": hosp_id,
                    "hospital_name": db_hosp_record.get("name") if db_hosp_record else None
                }
            elif role == "CHAIRMAN":
                role_details = {
                    "scope": "Global Platform Owner"
                }

        results.append({
            "email": email,
            "role": role,
            "expected_name": expected_name,
            "expected_id": expected_id,
            "db_exists": db_exists,
            "db_role": db_role,
            "login_ok": login_ok,
            "error_msg": error_msg,
            "api_user_id": api_user.get("userId"),
            "role_details": role_details
        })

print(f"Total accounts audited: {len(results)}")
login_successes = sum(1 for r in results if r["login_ok"])
print(f"Login successes: {login_successes}/{len(results)}")

with open("scripts/audit_api_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

# Summarize findings by role
for role in ["Chairman", "Hospital Admin", "Department Head", "Doctor", "Family"]:
    role_res = [r for r in results if r["role"].upper() == role.upper().replace(" ", "_")]
    print(f"\n--- {role} ({len(role_res)} accounts) ---")
    for r in role_res:
        status_sym = "[OK]" if r["login_ok"] else "[FAIL]"
        extra = ""
        if r["role"] == "FAMILY":
            extra = f" | DB members: {r['role_details'].get('db_member_count')} | API members: {r['role_details'].get('api_member_count')}"
        elif r["role"] == "DOCTOR":
            extra = f" | Name: {r['role_details'].get('doctor_name')} | Spec: {r['role_details'].get('specialty')}"
        elif r["role"] == "DEPARTMENT_HEAD":
            extra = f" | Dept: {r['role_details'].get('department_name')} | Name: {r['role_details'].get('head_name')}"
        elif r["role"] == "HOSPITAL_ADMIN":
            extra = f" | Hosp: {r['role_details'].get('hospital_name')}"
        print(f"  {status_sym} {r['email']}{extra}")
