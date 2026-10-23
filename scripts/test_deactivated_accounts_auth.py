import requests

for email in ['demo.doctor.ortho@medimind.test', 'demo.doctor.diab@medimind.test']:
    res = requests.post(
        'http://localhost:5001/api/auth/login',
        json={'email': email, 'password': 'DemoInactive_2026_SecureBlock!'}
    )
    print(f"Login for {email}: Status {res.status_code}, Response: {res.json()}")
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    assert 'inactive' in res.json().get('message', '').lower()

print("\n[ALL TESTS PASSED] Authentication strictly denied to deactivated doctor accounts!")
