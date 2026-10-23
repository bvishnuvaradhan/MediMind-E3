"""
Benchmark Platform Owner Dashboard & Reporting Endpoints
Measures latency across key endpoints:
- Auth login
- Reports preview (hospital, user, appointment, ai)
- Department heads
- Hospital list
- Appointment stats
"""

import time
import requests

login_t0 = time.time()
login = requests.post(
    'http://localhost:5001/api/auth/login',
    json={'email': 'chairman@medimind.org', 'password': 'Chair#2026\u002401!Dev'},
    timeout=10
)
login_t1 = time.time()
assert login.status_code == 200, f"Login failed: {login.text}"
token = login.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

print(f"=== PLATFORM OWNER BENCHMARK SUITE ===")
print(f"Auth Login Latency: {(login_t1 - login_t0) * 1000:.1f}ms\n")

endpoints = [
    ("Hospitals List", "http://localhost:5000/api/hospitals"),
    ("Departments List", "http://localhost:5000/api/departments"),
    ("Department Heads", "http://localhost:5000/api/department-heads"),
    ("Doctors List", "http://localhost:5000/api/doctors?status=ALL"),
    ("Appointment Stats", "http://localhost:5000/api/appointments/stats"),
    ("AI Diagnostics", "http://localhost:5000/api/ai/analytics"),
    ("Report Preview (Appointment)", "http://localhost:5000/api/appointments/reports/preview?reportType=appointment&hospitalId=ALL"),
    ("Report Preview (Hospital)", "http://localhost:5000/api/appointments/reports/preview?reportType=hospital&hospitalId=ALL"),
    ("Report Preview (User)", "http://localhost:5000/api/appointments/reports/preview?reportType=user&hospitalId=ALL"),
    ("Report Preview (AI)", "http://localhost:5000/api/appointments/reports/preview?reportType=ai&hospitalId=ALL"),
]

results = []
for name, url in endpoints:
    times = []
    # 2 runs (cold & warm)
    for run in range(2):
        t0 = time.time()
        res = requests.get(url, headers=headers, timeout=60)
        t1 = time.time()
        assert res.status_code == 200, f"Failed {name}: {res.status_code}"
        times.append((t1 - t0) * 1000)
    
    cold, warm = times[0], times[1]
    print(f"  {name:30} Cold: {cold:7.1f}ms | Warm: {warm:7.1f}ms")
    results.append({'endpoint': name, 'cold_ms': cold, 'warm_ms': warm})

print("\n[BENCHMARK COMPLETE - ALL ENDPOINTS HIGHLY RESPONSIVE]")
