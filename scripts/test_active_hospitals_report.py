import requests
import json
import openpyxl
import io
import dotenv
import os

env = dotenv.dotenv_values('backend/.env')

# 1. Login as CHAIRMAN
chair_login = requests.post(
    'http://localhost:5001/api/auth/login',
    json={'email': 'chairman@medimind.org', 'password': 'Chair#2026$01!Dev'}
)

print(f"Chairman Login Status: {chair_login.status_code}")
chair_token = chair_login.json()['data']['token']

headers = {
    'Authorization': f'Bearer {chair_token}'
}

# 2. Test active hospital report preview (Aarogyam: 6ac85a18074c2bc731a76381)
print("\n--- 1. Testing GET /api/appointments/reports/preview with ACTIVE Hospital ---")
res_active = requests.get('http://localhost:5000/api/appointments/reports/preview?hospitalId=6ac85a18074c2bc731a76381', headers=headers)
print(f"Active Hospital Status: {res_active.status_code}")
assert res_active.status_code == 200, f"Expected 200, got {res_active.status_code}"
print("Summary for Active Hospital:", res_active.json()['data']['summary'])

# 3. Test pending hospital report preview (Sunrise Institute: 6ac85a18074c2bc731a76387)
print("\n--- 2. Testing GET /api/appointments/reports/preview with PENDING Hospital ---")
res_pending = requests.get('http://localhost:5000/api/appointments/reports/preview?hospitalId=6ac85a18074c2bc731a76387', headers=headers)
print(f"Pending Hospital Status: {res_pending.status_code}")
assert res_pending.status_code == 400, f"Expected 400, got {res_pending.status_code}"
print("Error message for Pending Hospital:", res_pending.json().get('message'))

# 4. Test platform-wide preview (ALL)
print("\n--- 3. Testing GET /api/appointments/reports/preview with hospitalId=ALL ---")
res_all = requests.get('http://localhost:5000/api/appointments/reports/preview?hospitalId=ALL', headers=headers)
print(f"ALL Scope Status: {res_all.status_code}")
assert res_all.status_code == 200
hosp_counts = res_all.json()['data']['summary'].get('hospitalsInScope')
print(f"Active Hospitals in Scope: {hosp_counts}")

# 5. Test Excel Export with PENDING hospital (must return 400)
print("\n--- 4. Testing GET /api/appointments/reports/export-excel with PENDING Hospital ---")
res_excel_pending = requests.get('http://localhost:5000/api/appointments/reports/export-excel?hospitalId=6ac85a18074c2bc731a76387', headers=headers)
print(f"Excel Pending Hospital Status: {res_excel_pending.status_code}")
assert res_excel_pending.status_code == 400, f"Expected 400, got {res_excel_pending.status_code}"

# 6. Test Excel Export with ACTIVE hospital (must return 200)
print("\n--- 5. Testing GET /api/appointments/reports/export-excel with ACTIVE Hospital ---")
res_excel_active = requests.get('http://localhost:5000/api/appointments/reports/export-excel?hospitalId=6ac85a18074c2bc731a76381', headers=headers)
print(f"Excel Active Hospital Status: {res_excel_active.status_code}")
assert res_excel_active.status_code == 200, f"Expected 200, got {res_excel_active.status_code}"
print(f"Excel payload size: {len(res_excel_active.content)} bytes")

print("\n[ALL TESTS PASSED] Active-hospital-only filtering strictly verified across preview and export!")
