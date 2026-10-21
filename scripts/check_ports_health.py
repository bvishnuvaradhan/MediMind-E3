import requests

services = [
    (5000, 'http://localhost:5000/api/appointments/health', 'Gateway / Appointment'),
    (5001, 'http://localhost:5001/api/auth/health', 'Auth Service'),
    (5002, 'http://localhost:5002/api/family/health', 'Family Service'),
    (5003, 'http://localhost:5003/api/hospitals/health', 'Hospital Service'),
    (5004, 'http://localhost:5004/api/doctors/health', 'Doctor Service'),
    (5005, 'http://localhost:5005/api/appointments/health', 'Appointment Service'),
    (5006, 'http://localhost:5006/api/medical-records/health', 'Medical Record Service'),
    (5007, 'http://localhost:5007/health', 'AI Service'),
    (5008, 'http://localhost:5008/api/knowledge/health', 'Knowledge Service'),
]

for port, url, name in services:
    try:
        r = requests.get(url, timeout=3)
        print(f"[{'PASS' if r.status_code == 200 else 'FAIL'}] {name} (Port {port}): Status {r.status_code}")
    except Exception as e:
        print(f"[FAIL] {name} (Port {port}): Exception {e}")
