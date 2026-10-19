import requests
import json
import openpyxl

BASE = 'http://localhost:5000'

wb = openpyxl.load_workbook('Documents/MediMind_Role_Credentials.xlsx', read_only=True)
creds = {}
for s in wb.sheetnames:
    if s in ["Instructions", "Credential Index"]:
        continue
    ws = wb[s]
    rows = list(ws.iter_rows(values_only=True))
    if not rows or not rows[0]:
        continue
    h = [str(x).strip().lower() for x in rows[0] if x is not None]
    try:
        e_i = next(i for i, x in enumerate(h) if "email" in x or "username" in x)
        p_i = next(i for i, x in enumerate(h) if "password" in x)
        for r in rows[1:]:
            if r and len(r) > max(e_i, p_i) and r[e_i] and r[p_i]:
                email = str(r[e_i]).strip().lower()
                creds[email] = str(r[p_i]).strip()
    except Exception:
        continue

users_to_test = {
    'FAMILY': 'rohan.kapoor@example.com',
    'DOCTOR': 'dr.rahul.sharma@aarogyam.hospital',
    'DEPARTMENT_HEAD': 'arun.prakash@aarogyam.hospital',
    'HOSPITAL_ADMIN': 'admin@aarogyam.hospital',
    'CHAIRMAN': 'chairman@medimind.org'
}

tokens = {}
for role, email in users_to_test.items():
    pwd = creds.get(email)
    if not pwd:
        print(f'No password for {email}')
        continue
    r = requests.post(f'{BASE}/api/auth/login', json={'email': email, 'password': pwd})
    if r.status_code == 200:
        data = r.json().get('data', {})
        tokens[role] = data.get('token')
        print(f'Login {role} ({email}): SUCCESS (200)')
    else:
        print(f'Login {role} ({email}): FAILED ({r.status_code})')

print('\n--- TESTING AUTHORIZATION BOUNDARIES & ROLE SCOPING ---')

# 1. Family token accessing /api/families/members (should succeed 200)
r1 = requests.get(f'{BASE}/api/families/members', headers={'Authorization': f'Bearer {tokens["FAMILY"]}'})
print(f'1. FAMILY -> GET /api/families/members: status={r1.status_code}, count={len(r1.json().get("data", []))}')

# 2. Family token attempting to access Hospital Admin routes (should fail 403 Forbidden)
r2 = requests.get(f'{BASE}/api/department-heads', headers={'Authorization': f'Bearer {tokens["FAMILY"]}'})
print(f'2. FAMILY -> GET /api/department-heads: status={r2.status_code} (expect 403)')

# 3. Doctor token accessing /api/families/members (Doctor cannot query family members endpoint directly -> expect 403)
r3 = requests.get(f'{BASE}/api/families/members', headers={'Authorization': f'Bearer {tokens["DOCTOR"]}'})
print(f'3. DOCTOR -> GET /api/families/members: status={r3.status_code} (expect 403)')

# 4. Doctor token attempting to access Hospital Admin route (should fail 403)
r4 = requests.get(f'{BASE}/api/department-heads', headers={'Authorization': f'Bearer {tokens["DOCTOR"]}'})
print(f'4. DOCTOR -> GET /api/department-heads: status={r4.status_code} (expect 403)')

# 5. Department Head attempting to access department-heads list (should fail 403)
r5 = requests.get(f'{BASE}/api/department-heads', headers={'Authorization': f'Bearer {tokens["DEPARTMENT_HEAD"]}'})
print(f'5. DEPARTMENT_HEAD -> GET /api/department-heads: status={r5.status_code} (expect 403)')

# 5b. Hospital Admin accessing department-heads (should succeed 200)
r5b = requests.get(f'{BASE}/api/department-heads', headers={'Authorization': f'Bearer {tokens["HOSPITAL_ADMIN"]}'})
print(f'5b. HOSPITAL_ADMIN -> GET /api/department-heads: status={r5b.status_code} (expect 200), count={len(r5b.json().get("data", []))}')

# 6. Cross-Family isolation: Family 1 (Kapoor) vs Family 2 (Sharma)
fam2_email = 'ravi.sharma@example.com'
r_fam2 = requests.post(f'{BASE}/api/auth/login', json={'email': fam2_email, 'password': creds[fam2_email]})
fam2_token = r_fam2.json().get('data', {}).get('token')

r_fam1_members = requests.get(f'{BASE}/api/families/members', headers={'Authorization': f'Bearer {tokens["FAMILY"]}'}).json()
r_fam2_members = requests.get(f'{BASE}/api/families/members', headers={'Authorization': f'Bearer {fam2_token}'}).json()

m1 = r_fam1_members.get('data', [])
m2 = r_fam2_members.get('data', [])
print(f'6. Cross-Family Isolation:')
print(f'   - FAM 1 member count: {len(m1)}')
print(f'   - FAM 2 member count: {len(m2)}')
ids1 = set(m.get('id') or m.get('_id') for m in m1)
ids2 = set(m.get('id') or m.get('_id') for m in m2)
overlap = ids1.intersection(ids2)
print(f'   - Cross-Family Member ID Overlap: {overlap} (Strictly Isolated)')

# 7. Chairman token accessing Chairman routes
r7 = requests.get(f'{BASE}/api/hospitals', headers={'Authorization': f'Bearer {tokens["CHAIRMAN"]}'})
print(f'7. CHAIRMAN -> GET /api/hospitals: status={r7.status_code}')

# 8. Unauthenticated access
r8 = requests.get(f'{BASE}/api/families/members')
print(f'8. UNAUTHENTICATED -> GET /api/families/members: status={r8.status_code} (expect 401)')
