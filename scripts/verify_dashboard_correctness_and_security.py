import requests
import time
import openpyxl
import pymongo
import bson

BASE_URL = 'http://localhost:5000'

# 1. Connect directly to MongoDB for authoritative truth
client = pymongo.MongoClient('mongodb://localhost:27017')
appt_coll = client['medimind_appointment'].appointments

# Compute independent authoritative ground truth counts
pipeline = [
    {
        '$facet': {
            'total': [{'$count': 'count'}],
            'byStatus': [{'$group': {'_id': '$status', 'count': {'$sum': 1}}}],
            'byHospital': [{'$group': {'_id': '$hospital_id', 'count': {'$sum': 1}}}],
        }
    }
]
db_truth = list(appt_coll.aggregate(pipeline))[0]
db_total = db_truth['total'][0]['count']
db_status_map = {s['_id']: s['count'] for s in db_truth['byStatus']}
db_hosp_map = {str(h['_id']): h['count'] for h in db_truth['byHospital']}

print("=== 1. AUTHORITATIVE DATABASE GROUND TRUTH ===")
print(f"Total Appointments: {db_total}")
print(f"By Status: {db_status_map}")
print(f"By Hospital: {db_hosp_map}")

# 2. Login personas
wb = openpyxl.load_workbook('Documents/MediMind_Role_Credentials.xlsx', data_only=True)
def get_cred(sheet_name):
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    h = [str(x).lower() if x else '' for x in rows[0]]
    e_i = next(i for i, x in enumerate(h) if 'email' in x or 'username' in x)
    p_i = next(i for i, x in enumerate(h) if 'password' in x)
    return str(rows[1][e_i]).strip(), str(rows[1][p_i]).strip()

chair_email, chair_pass = get_cred('Chairman')
ha_email, ha_pass = get_cred('Hospital Admin')
doc_email, doc_pass = get_cred('Doctor')

def login(email, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={'email': email, 'password': password})
    return res.json()['data']['token']

token_chair = login(chair_email, chair_pass)
token_ha = login(ha_email, ha_pass)
token_doc = login(doc_email, doc_pass)

# 3. Test Chairman Network-Wide Stats
res_chair = requests.get(f"{BASE_URL}/api/appointments/stats", headers={'Authorization': f'Bearer {token_chair}'})
api_stats = res_chair.json()['data']

print("\n=== 2. API GET /api/appointments/stats vs DB TRUTH ===")
print(f"API Total: {api_stats['total']} | DB Total: {db_total} | Match: {api_stats['total'] == db_total}")
print(f"API Completed: {api_stats['completed']} | DB Completed: {db_status_map.get('COMPLETED')} | Match: {api_stats['completed'] == db_status_map.get('COMPLETED')}")
print(f"API Cancelled: {api_stats['cancelled']} | DB Cancelled: {db_status_map.get('CANCELLED')} | Match: {api_stats['cancelled'] == db_status_map.get('CANCELLED')}")
hosp_matches = all(api_stats['byHospital'].get(hid) == count for hid, count in db_hosp_map.items())
print(f"All Hospital Breakdowns Match: {hosp_matches}")

# 4. Test Cross-Tenant Security & Role Boundary Enforcement
# Hospital Admin for Aarogyam (6ac85a18074c2bc731a76381)
res_ha = requests.get(f"{BASE_URL}/api/appointments/stats", headers={'Authorization': f'Bearer {token_ha}'})
ha_stats = res_ha.json()['data']
aarogyam_count = db_hosp_map.get('6ac85a18074c2bc731a76381')
print("\n=== 3. HOSPITAL ADMIN ROLE-BASED SCOPING ===")
print(f"Hospital Admin Total: {ha_stats['total']} (Expected: {aarogyam_count}) | Scoped Match: {ha_stats['total'] == aarogyam_count}")

# Attack scenario: Hospital Admin attempts to pass ?hospitalId=6ac85a18074c2bc731a76383 (Nexora)
res_attack = requests.get(f"{BASE_URL}/api/appointments/stats?hospitalId=6ac85a18074c2bc731a76383", headers={'Authorization': f'Bearer {token_ha}'})
attack_stats = res_attack.json()['data']
tamper_prevented = (attack_stats['total'] == aarogyam_count)
print(f"Cross-Tenant Tamper Test (?hospitalId=Nexora passed by Aarogyam Admin):")
print(f"  Result Total: {attack_stats['total']} | Tamper Prevented (Locked to Assigned Hospital): {tamper_prevented}")

# 5. Performance Measurement (10 Repeated Runs)
times = []
for _ in range(10):
    t0 = time.perf_counter()
    r = requests.get(f"{BASE_URL}/api/appointments/stats", headers={'Authorization': f'Bearer {token_chair}'})
    times.append((time.perf_counter() - t0) * 1000)

times.sort()
median_time = times[len(times)//2]
avg_time = sum(times) / len(times)
print("\n=== 4. RIGOROUS STATS ENDPOINT BENCHMARK (10 RUNS) ===")
print(f"  Min:    {min(times):.2f} ms")
print(f"  Median: {median_time:.2f} ms")
print(f"  Avg:    {avg_time:.2f} ms")
print(f"  Max:    {max(times):.2f} ms")
print(f"  Payload Size: {len(r.content)} bytes ({len(r.content)/1024:.2f} KB)")
print(f"  Status: {r.status_code}")
