import requests

auth = requests.post("http://localhost:5000/api/auth/login", json={"email": "chairman@medimind.org", "password": "Chair#2026$01!Dev"}).json()
token = auth["data"]["token"]
headers = {"Authorization": f"Bearer {token}"}

r = requests.get("http://localhost:5000/api/hospitals", headers=headers)
print("Status:", r.status_code)
hospitals = r.json().get("data", [])
for h in hospitals:
    print(f"Name: {h.get('name')} | ID: {h.get('_id')} | Code: {h.get('code')} | Status: {h.get('status')}")
