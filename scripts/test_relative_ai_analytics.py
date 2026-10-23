import requests

chair_login = requests.post(
    'http://localhost:5001/api/auth/login',
    json={'email': 'chairman@medimind.org', 'password': 'Chair#2026$01!Dev'}
)
token = chair_login.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

for p in ['This Month', 'Previous Month', 'This Quarter', 'This Year', 'All Time']:
    r = requests.get(f'http://localhost:5000/api/ai/analytics?period={p}', headers=headers)
    d = r.json().get('data', {})
    total = d.get('totalPredictions')
    dr = d.get('dateRange')
    lbl = d.get('periodLabel')
    months = [m['month'] for m in d.get('monthlyVolume', [])]
    print(f"Period: {p:16} -> Status: {r.status_code} | Total: {total} | DateRange: {dr} | Months: {months}")
