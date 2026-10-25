import requests

# 1. Login as CHAIRMAN
chair_login = requests.post(
    'http://localhost:5001/api/auth/login',
    json={'email': 'chairman@medimind.org', 'password': 'Chair#2026$01!Dev'}
)
assert chair_login.status_code == 200, f"Chairman login failed: {chair_login.text}"
token = chair_login.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

pending_hospital_id = '6ac85a18074c2bc731a76387' # Sunrise (PENDING)
active_hospital_id = '6ac85a18074c2bc731a76385'  # Harborview (ACTIVE)

print("=== TESTING BACKEND HOSPITAL ELIGIBILITY ENFORCEMENT ===")

# Test 1: Create Department in PENDING hospital -> Must return HTTP 400
r_dept = requests.post('http://localhost:5000/api/departments', headers=headers, json={
    'name': 'Test Neuro Surgery',
    'hospital_id': pending_hospital_id
})
print(f"1. Create Dept in PENDING Hospital -> Status: {r_dept.status_code} | Msg: {r_dept.json().get('message')}")
assert r_dept.status_code == 400, f"Expected 400, got {r_dept.status_code}"
assert 'pending approval or inactive' in r_dept.json().get('message', ''), "Expected pending approval message"

# Test 2: Create Doctor in PENDING hospital -> Must return HTTP 400
r_doc = requests.post('http://localhost:5000/api/doctors', headers=headers, json={
    'fullName': 'Dr. Test Unapproved',
    'email': 'dr.test.unapproved@medimind.test',
    'mobile': '+91 99999 12345',
    'specialization': 'General Surgery',
    'hospitalId': pending_hospital_id,
    'departmentId': '6ac85a18074c2bc731a76396'
})
print(f"2. Create Doctor in PENDING Hospital -> Status: {r_doc.status_code} | Msg: {r_doc.json().get('message')}")
assert r_doc.status_code in [400, 422], f"Expected 400/422, got {r_doc.status_code}"
assert 'pending' in r_doc.json().get('message', '').lower(), "Expected pending approval message"

# Test 3: Book Appointment in PENDING hospital -> Must return HTTP 400 or 422
r_apt = requests.post('http://localhost:5000/api/appointments', headers=headers, json={
    'familyMemberId': '6ac85a18074c2bc731a763b1',
    'doctorId': '6ac85a1c074c2bc731a763ed',
    'hospitalId': pending_hospital_id,
    'departmentId': '6ac85a18074c2bc731a76396',
    'appointmentDate': '2026-10-30',
    'startTime': '10:00',
    'endTime': '10:30'
})
print(f"3. Book Appointment in PENDING Hospital -> Status: {r_apt.status_code} | Msg: {r_apt.json().get('message')}")
assert r_apt.status_code in [400, 422], f"Expected 400/422, got {r_apt.status_code}"
assert 'pending' in r_apt.json().get('message', '').lower(), "Expected pending error message"

print("\n[ALL BACKEND HOSPITAL ELIGIBILITY VALIDATION TESTS PASSED]")
