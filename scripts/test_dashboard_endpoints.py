import requests

auth = requests.post('http://localhost:5000/api/auth/login', json={'email': 'chairman@medimind.org', 'password': 'Chair#2026$01!Dev'}).json()
token = auth['data']['token']
headers = {'Authorization': f'Bearer {token}'}

for ep in [
    '/api/ai/analytics',
    '/api/appointments/stats',
    '/api/doctors?status=ALL',
    '/api/hospital-requests',
    '/api/department-heads'
]:
    r = requests.get(f'http://localhost:5000{ep}', headers=headers)
    data = r.json()
    count = None
    if isinstance(data.get('data'), list):
        count = len(data['data'])
    elif isinstance(data.get('data'), dict):
        count = len(data['data'].keys())
    print(f"{ep}: status={r.status_code}, success={data.get('success')}, count/keys={count}")
