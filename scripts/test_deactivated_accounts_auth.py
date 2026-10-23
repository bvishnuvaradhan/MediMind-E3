import requests

emails = [
    'dr.arvind.deshpande@medimind.test',
    'dr.meenakshi.sundaram@medimind.test',
    'demo.doctor.ortho@medimind.test',
    'demo.doctor.diab@medimind.test',
]

passwords = ['Demo#2026$01!Dev', 'Password123!', 'WrongPass!123', 'DoctorPass@2026']

print("=== TESTING DEACTIVATED ACCOUNTS AUTHENTICATION DENIAL ===")

for email in emails:
    for pw in passwords:
        r = requests.post(
            'http://localhost:5001/api/auth/login',
            json={'email': email, 'password': pw}
        )
        print(f"Login attempt: {email} | Status: {r.status_code} | Msg: {r.json().get('message')}")
        assert r.status_code in [401, 403], f"Expected 401/403 for deactivated/nonexistent account, got {r.status_code}"

print("[PASS] All deactivated account authentication attempts strictly rejected (HTTP 401/403)!")
