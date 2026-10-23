import requests

chair_login = requests.post(
    'http://localhost:5001/api/auth/login',
    json={'email': 'chairman@medimind.org', 'password': 'Chair#2026$01!Dev'}
)
token = chair_login.json()['data']['token']
headers = {'Authorization': f'Bearer {token}'}

r = requests.get('http://localhost:5000/api/knowledge/articles', headers=headers)
articles = r.json()['data']

def isProtocolOrSop(a):
    cat = (a.get('category') or '').lower()
    tags = [t.lower() for t in (a.get('tags') or [])]
    return cat == 'clinical protocols & sops' or 'protocol' in cat or 'sop' in cat or any('protocol' in t or 'sop' in t or 'guideline' in t for t in tags)

def isUnderPeerReview(a):
    st = (a.get('status') or '').upper()
    return st in ['UNDER REVIEW', 'IN_REVIEW', 'UNDER_REVIEW', 'CHANGES REQUESTED', 'CHANGES_REQUESTED', 'SUBMITTED']

under_rev = [a for a in articles if isUnderPeerReview(a)]
protocols = [a for a in articles if isProtocolOrSop(a)]
pub_research = [a for a in articles if not isUnderPeerReview(a) and not isProtocolOrSop(a)]

print(f'Total Articles: {len(articles)}')
print(f'Under Peer Review: {len(under_rev)}')
print(f'Clinical Protocols & SOPs: {len(protocols)}')
print(f'Published Research: {len(pub_research)}')
assert len(articles) == 53
assert len(under_rev) == 5
assert len(protocols) == 5
assert len(pub_research) == 43
print('All assertion checks PASSED!')
