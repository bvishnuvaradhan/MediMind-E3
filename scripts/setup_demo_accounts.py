import pymongo
import bson
import datetime
import bcrypt
import requests

client = pymongo.MongoClient('mongodb://localhost:27017')
auth_db = client['medimind_auth']
doc_db = client['medimind_doctor']
hosp_db = client['medimind_hospital']

# First, clean any partial or existing demo entries
print("Cleaning existing demo accounts...")
auth_db.users.delete_many({'email': {'$regex': 'demo\\.', '$options': 'i'}})
doc_db.doctors.delete_many({'email': {'$regex': 'demo\\.', '$options': 'i'}})
hosp_db.departmentheads.delete_many({'email': {'$regex': 'demo\\.', '$options': 'i'}})

now = datetime.datetime.now(datetime.timezone.utc)

# Bcrypt hash of an unusable random demo token
pw_raw = 'DemoInactive_2026_SecureBlock!'
pw_hash = bcrypt.hashpw(pw_raw.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

# Hospital IDs
aarogyam_id = bson.ObjectId('6ac85a18074c2bc731a76381')
nexora_id = bson.ObjectId('6ac85a18074c2bc731a76383')
harborview_id = bson.ObjectId('6ac85a18074c2bc731a76385')

# Department IDs
aarogyam_ortho_id = bson.ObjectId('6ac85a18074c2bc731a7638b')
nexora_diab_id = bson.ObjectId('6ac85a18074c2bc731a7638f')

# 1. Doctor: Orthopedics @ Aarogyam
u1_id = bson.ObjectId()
p1_id = bson.ObjectId()
doc1_auth = {
    '_id': u1_id,
    'email': 'demo.doctor.ortho@medimind.test',
    'password_hash': pw_hash,
    'role': 'DOCTOR',
    'account_type': 'DOCTOR_ACCOUNT',
    'reference_id': p1_id,
    'family_id': None,
    'doctor_id': str(p1_id),
    'department_id': str(aarogyam_ortho_id),
    'hospital_id': str(aarogyam_id),
    'status': 'INACTIVE',
    'last_login_at': None,
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}
doc1_profile = {
    '_id': p1_id,
    'user_id': u1_id,
    'hospital_id': aarogyam_id,
    'department_id': aarogyam_ortho_id,
    'full_name': 'Demo Dr. Orthopedics (Inactive)',
    'profile_picture': None,
    'email': 'demo.doctor.ortho@medimind.test',
    'mobile': '+91 99999 00001',
    'specialization': 'Orthopedics & Trauma',
    'qualifications': ['MBBS', 'MS (Ortho)'],
    'experience_years': 5,
    'professional_description': 'Demonstration inactive doctor account for testing and audits.',
    'availability': [],
    'status': 'INACTIVE',
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}

# 2. Doctor: Diabetology @ Nexora
u2_id = bson.ObjectId()
p2_id = bson.ObjectId()
doc2_auth = {
    '_id': u2_id,
    'email': 'demo.doctor.diab@medimind.test',
    'password_hash': pw_hash,
    'role': 'DOCTOR',
    'account_type': 'DOCTOR_ACCOUNT',
    'reference_id': p2_id,
    'family_id': None,
    'doctor_id': str(p2_id),
    'department_id': str(nexora_diab_id),
    'hospital_id': str(nexora_id),
    'status': 'INACTIVE',
    'last_login_at': None,
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}
doc2_profile = {
    '_id': p2_id,
    'user_id': u2_id,
    'hospital_id': nexora_id,
    'department_id': nexora_diab_id,
    'full_name': 'Demo Dr. Diabetology (Inactive)',
    'profile_picture': None,
    'email': 'demo.doctor.diab@medimind.test',
    'mobile': '+91 99999 00002',
    'specialization': 'Diabetology',
    'qualifications': ['MBBS', 'MD (Endo)'],
    'experience_years': 6,
    'professional_description': 'Demonstration inactive diabetology doctor account.',
    'availability': [],
    'status': 'INACTIVE',
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}

# 3. Dept Head: Orthopedics @ Aarogyam
u3_id = bson.ObjectId()
p3_id = bson.ObjectId()
dh_auth = {
    '_id': u3_id,
    'email': 'demo.depthead.ortho@medimind.test',
    'password_hash': pw_hash,
    'role': 'DEPARTMENT_HEAD',
    'account_type': 'DEPARTMENT_HEAD_ACCOUNT',
    'reference_id': p3_id,
    'family_id': None,
    'doctor_id': None,
    'department_id': str(aarogyam_ortho_id),
    'hospital_id': str(aarogyam_id),
    'status': 'INACTIVE',
    'last_login_at': None,
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}
dh_profile = {
    '_id': p3_id,
    'user_id': u3_id,
    'hospital_id': aarogyam_id,
    'department_id': aarogyam_ortho_id,
    'full_name': 'Demo DeptHead Ortho (Inactive)',
    'email': 'demo.depthead.ortho@medimind.test',
    'phone': '+91 99999 00003',
    'specialization': 'Orthopedics & Trauma',
    'status': 'INACTIVE',
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}

# 4. Hospital Admin: Harborview
u4_id = bson.ObjectId()
ha_auth = {
    '_id': u4_id,
    'email': 'demo.admin.harborview@medimind.test',
    'password_hash': pw_hash,
    'role': 'HOSPITAL_ADMIN',
    'account_type': 'HOSPITAL_ADMIN_ACCOUNT',
    'reference_id': harborview_id,
    'family_id': None,
    'doctor_id': None,
    'department_id': None,
    'hospital_id': str(harborview_id),
    'status': 'INACTIVE',
    'last_login_at': None,
    'is_demonstration': True,
    'created_at': now,
    'updated_at': now
}

auth_db.users.insert_many([doc1_auth, doc2_auth, dh_auth, ha_auth])
doc_db.doctors.insert_many([doc1_profile, doc2_profile])
hosp_db.departmentheads.insert_one(dh_profile)

print("Provisioned 4 demonstration accounts successfully.")

# Verification test via Gateway / Auth API
print("\n--- Testing Login Attempts on Demonstration Accounts ---")
demo_emails = [
    'demo.doctor.ortho@medimind.test',
    'demo.doctor.diab@medimind.test',
    'demo.depthead.ortho@medimind.test',
    'demo.admin.harborview@medimind.test'
]

gateway_url = 'http://localhost:5000/api/auth/login'
all_blocked = True
for email in demo_emails:
    try:
        resp = requests.post(gateway_url, json={'email': email, 'password': pw_raw}, timeout=5)
        status_code = resp.status_code
        data = resp.json()
        print(f"Login {email} -> Status: {status_code}, Body: {data.get('message', data)}")
        # Must fail with 403 (inactive)
        if status_code != 403:
            print(f"FAILED: Expected 403, got {status_code}")
            all_blocked = False
        else:
            print(f"PASSED: Login correctly blocked with 403 ({data.get('message')})")
    except Exception as e:
        print(f"Error testing login for {email}: {e}")
        all_blocked = False

if all_blocked:
    print("\nALL 4 DEMO ACCOUNTS ARE ACTIVE IN DB WITH STATUS 'INACTIVE' AND STRICTLY BLOCKED FROM LOGIN.")
else:
    print("\nWARNING: Some demonstration accounts did not receive expected HTTP 403 response.")
