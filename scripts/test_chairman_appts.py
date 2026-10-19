import requests
from test_auth_boundaries import tokens

r = requests.get('http://localhost:5000/api/appointments', headers={'Authorization': f'Bearer {tokens["CHAIRMAN"]}'})
print('Status:', r.status_code)
d = r.json()
print('Success:', d.get('success'))
appts = d.get('data', [])
print('Total appointments returned for Chairman:', len(appts))
statuses = {}
for a in appts:
    st = a.get('status', 'Unknown')
    statuses[st] = statuses.get(st, 0) + 1
print('Statuses:', statuses)
