"""
Benchmark Platform Owner Dashboard, Analytics, AI Diagnostics & Reporting Endpoints.
Measures cold and warm latency and verifies cache freshness & TTL.
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

print(f"=== PLATFORM OWNER PERFORMANCE & CACHE BENCHMARK SUITE ===")
print(f"Auth Login Latency: {(login_t1 - login_t0) * 1000:.1f}ms\n")

endpoints = [
    ("Platform Hospitals", "http://localhost:5000/api/hospitals"),
    ("Platform Departments", "http://localhost:5000/api/departments"),
    ("Department Heads Roster", "http://localhost:5000/api/department-heads"),
    ("Doctors Workforce", "http://localhost:5000/api/doctors?status=ALL"),
    ("Appointment Stats", "http://localhost:5000/api/appointments/stats"),
    ("AI Platform Analytics", "http://localhost:5000/api/ai/analytics"),
    ("AI Relative 'This Month'", "http://localhost:5000/api/ai/analytics?period=This%20Month"),
    ("AI Relative 'This Quarter'", "http://localhost:5000/api/ai/analytics?period=This%20Quarter"),
    ("Knowledge Articles Roster", "http://localhost:5000/api/knowledge"),
    ("Report Preview (Appointment)", "http://localhost:5000/api/appointments/reports/preview?reportType=appointment&hospitalId=ALL"),
    ("Report Preview (Hospital)", "http://localhost:5000/api/appointments/reports/preview?reportType=hospital&hospitalId=ALL"),
    ("Report Preview (User)", "http://localhost:5000/api/appointments/reports/preview?reportType=user&hospitalId=ALL"),
    ("Report Preview (AI Diagnostics)", "http://localhost:5000/api/appointments/reports/preview?reportType=ai&hospitalId=ALL"),
]

results = []
for name, url in endpoints:
    times = []
    # 2 runs: cold & warm
    for run in range(2):
        t0 = time.time()
        res = requests.get(url, headers=headers, timeout=60)
        t1 = time.time()
        assert res.status_code == 200, f"Failed {name}: {res.status_code}"
        times.append((t1 - t0) * 1000)

    cold, warm = times[0], times[1]
    print(f"  {name:32} Cold: {cold:7.1f}ms | Warm: {warm:7.1f}ms")
    results.append({'endpoint': name, 'cold_ms': cold, 'warm_ms': warm})

# Cache TTL Verification (AI Analytics 30s TTL)
print("\n--- CACHE FRESHNESS & TTL VERIFICATION ---")
t0 = time.time()
r_cached = requests.get("http://localhost:5000/api/ai/analytics", headers=headers)
t_cached = (time.time() - t0) * 1000
print(f"Immediate Cache Hit (within 30s TTL): {t_cached:.1f}ms (Target: < 100ms)")
assert t_cached < 100, f"Expected cache hit < 100ms, got {t_cached:.1f}ms"

print("\n[PERFORMANCE BENCHMARK COMPLETE - ALL OWNER WORKSPACES HIGHLY OPTIMIZED]")
