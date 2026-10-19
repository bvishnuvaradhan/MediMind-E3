import urllib.request
import json
import openpyxl

def get_creds():
    wb = openpyxl.load_workbook(r'Documents/MediMind_Role_Credentials.xlsx', read_only=True)
    creds = {}
    for s in wb.sheetnames:
        if s in ['Instructions', 'Credential Index']:
            continue
        ws = wb[s]
        rows = list(ws.iter_rows(values_only=True))
        if not rows or not rows[0]:
            continue
        h = [str(x).strip().lower() for x in rows[0] if x is not None]
        try:
            e_i = next(i for i, x in enumerate(h) if 'email' in x or 'username' in x)
            p_i = next(i for i, x in enumerate(h) if 'password' in x)
            for r in rows[1:]:
                if not r or len(r) <= e_i or not r[e_i]:
                    continue
                email = str(r[e_i]).strip().lower()
                creds[email] = str(r[p_i])
        except Exception:
            continue
    wb.close()
    return creds

def login(email, password):
    url = 'http://localhost:5000/api/auth/login'
    data = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res['data']['token']

def api_get(token, endpoint):
    url = f'http://localhost:5000{endpoint}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    creds = get_creds()
    c_email = 'chairman@medimind.org'
    token = login(c_email, creds[c_email])
    print(f'Logged in as Chairman: {c_email}')

    # 1. Hospitals
    hosp_res = api_get(token, '/api/hospitals')
    hosps = hosp_res.get('data', [])
    print(f'Hospitals API count: {len(hosps)}')
    for h in hosps:
        print(f"  - {h.get('name')} | status: {h.get('status', 'ACTIVE')} | code: {h.get('code')}")

    # 2. Departments
    dept_res = api_get(token, '/api/departments')
    depts = dept_res.get('data', [])
    print(f'Departments API count: {len(depts)}')
    
    # 3. Doctors
    doc_res = api_get(token, '/api/doctors')
    docs = doc_res.get('data', [])
    print(f'Doctors API count: {len(docs)}')

    # 4. Knowledge Articles
    know_res = api_get(token, '/api/knowledge')
    articles = know_res.get('data', [])
    print(f'Knowledge Articles API count: {len(articles)}')
    published = sum(1 for a in articles if a.get('status') == 'PUBLISHED')
    print(f'  Published: {published}/{len(articles)}')

    # 5. Hospital Requests
    req_res = api_get(token, '/api/hospital-requests')
    requests = req_res.get('data', [])
    print(f'Hospital Requests API count: {len(requests)}')

    # Summary
    metrics = {
        'hospitals_active': len(hosps),
        'departments': len(depts),
        'doctors': len(docs),
        'knowledge_articles': len(articles),
        'knowledge_published': published,
        'hospital_requests': len(requests)
    }
    with open('scripts/owner_metrics_verified.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    print('\nOwner metrics verified and saved to scripts/owner_metrics_verified.json')

if __name__ == '__main__':
    main()
