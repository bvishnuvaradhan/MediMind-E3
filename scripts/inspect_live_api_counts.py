import requests, json

auth = requests.post('http://localhost:5000/api/auth/login', json={'email': 'chairman@medimind.org', 'password': 'Chair#2026$01!Dev'}).json()
token = auth['data']['token']
headers = {'Authorization': f'Bearer {token}'}

for ep in [
    '/api/hospitals',
    '/api/departments',
    '/api/doctors?status=ALL',
    '/api/appointments/stats',
    '/api/ai/analytics',
    '/api/hospital-requests',
    '/api/department-heads'
]:
    r = requests.get(f'http://localhost:5000{ep}', headers=headers)
    print(f"\n=== {ep} (Status: {r.status_code}) ===")
    d = r.json().get('data')
    if isinstance(d, list):
        print(f"List with {len(d)} items")
        if len(d) > 0 and isinstance(d[0], dict):
            print("First item sample:", {k: d[0][k] for k in list(d[0].keys())[:5]})
            # Print status counts
            statuses = {}
            for item in d:
                s = item.get('status') or item.get('request_status')
                statuses[s] = statuses.get(s, 0) + 1
            print("Status breakdown:", statuses)
    elif isinstance(d, dict):
        print("Dict keys:", list(d.keys()))
        for k in ['total', 'upcoming', 'completed', 'cancelled', 'rescheduled', 'totalInferences', 'totalPredictions', 'dateRange']:
            if k in d:
                print(f"  {k}: {d[k]}")
