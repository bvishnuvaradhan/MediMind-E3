import requests
import json
import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017')
doc_db = client['medimind_doctor']
auth_db = client['medimind_auth']
hosp_db = client['medimind_hospital']

docs = list(doc_db.doctors.find({'status': 'ACTIVE'}))
print(f"Total active doctors to test login: {len(docs)}")

# Map of emails to passwords
pw_map = {}
for i in range(1, 30):
    pw_map[i] = f"Doctor#2026${i:02d}!Dev"
for i in range(30, 67):
    pw_map[i] = f"Doctor#2026${i:02d}!Dev"

# Get ordered list of doctors matching DOC-001..DOC-066
# 1..29 are operational
from collections import OrderedDict
# Sort by email or match
all_verified = []
failed_logins = []

for idx in range(1, 67):
    pw = f"Doctor#2026${idx:02d}!Dev"
    # Find user in auth
    # We can test by finding the user matching Doctor#2026${idx}
    # Let's find user with that password or email
    # Let's check how operational users correspond to 1..29
    pass

# Better: load all 66 doctor auth users
auth_docs = list(auth_db.users.find({'role': 'DOCTOR', 'status': 'ACTIVE', 'email': {'$regex': r'@(aarogyam|nexora|harborview)\.hospital$'}}))
print(f"Operational & newly provisioned active doctor auth users: {len(auth_docs)}")

success_count = 0
for u in auth_docs:
    email = u['email']
    # Determine which password index
    # Test candidate passwords from 1 to 66
    logged_in = False
    for p_idx in range(1, 67):
        pw = f"Doctor#2026${p_idx:02d}!Dev"
        res = requests.post('http://localhost:5000/api/auth/login', json={'email': email, 'password': pw}, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get('token') and data.get('user', {}).get('role') == 'DOCTOR':
                success_count += 1
                logged_in = True
                all_verified.append({'email': email, 'role': 'DOCTOR', 'name': u.get('name') or email, 'pw_idx': p_idx})
                break
    if not logged_in:
        failed_logins.append(email)

print(f"\nLogin Verification Results:")
print(f"Total tested: {len(auth_docs)}")
print(f"Successful logins (HTTP 200 + JWT + role DOCTOR): {success_count}")
print(f"Failed logins: {len(failed_logins)}")
if failed_logins:
    print(f"Failed list: {failed_logins}")
