import json
import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017')
h_db = client['medimind_hospital']

# Active hospitals
hosp_by_name = {h['name']: h for h in h_db.hospitals.find()}
hosp_by_code = {h['code']: h for h in h_db.hospitals.find()}

# H1 = Aarogyam, H2 = Nexora, H3 = Harborview
h1 = hosp_by_code['MM-HYD-01']
h2 = hosp_by_code['MM-HYD-02']
h3 = hosp_by_code['MM-MUM-03']

# Active departments by hospital and name
depts = list(h_db.departments.find())
print(f"Total active departments: {len(depts)}")

# Existing 29 names
existing_29_names = {
    'Dr. Rahul Sharma', 'Dr. Sneha Reddy', 'Dr. Vikram Joshi', 'Dr. Ananya Roy',
    'Dr. Arjun Patel', 'Dr. Deepak Verma', 'Dr. Karthik Iyer', 'Dr. Pooja Hegde',
    'Dr. Sanjay Gupta', 'Dr. Meera Nambiar', 'Dr. Harish Rao', 'Dr. Kavita Nair',
    'Dr. Suresh Menon', 'Dr. Radhika Swaminathan', 'Dr. Rohinton Mistry',
    'Dr. Adil Bharucha', 'Dr. Neville Tata', 'Dr. Cyrus Poonawalla', 'Dr. Diana Edulji',
    'Dr. Darius Batliwala', 'Dr. Freny Cooper', 'Dr. Jamshed Dalal', 'Dr. Shirin Daruwala',
    'Dr. Kavasji Jamshed', 'Dr. Mahrukh Billimoria', 'Dr. Noshirwan Guzder',
    'Dr. Pheroza Godrej', 'Dr. Ratan Vakil', 'Dr. Shenaz Treasury'
}

with open('scripts/historical_66_doctors.json', 'r', encoding='utf-8') as f:
    h66 = json.load(f)

candidates = []
for d in h66:
    if d.get('name') not in existing_29_names:
        candidates.append(d)

selected_37 = candidates[:37]
print(f"Total non-colliding candidates: {len(candidates)}, selected: {len(selected_37)}")

print("\n--- Selected 37 Doctor Profiles to Provision ---")
for idx, doc in enumerate(selected_37, 30):
    print(f"DOC-{idx:03d} | {doc.get('name')} | Orig Hosp: {doc.get('hospitalName')} | Orig Dept: {doc.get('departmentName')} | Spec: {doc.get('specialization')}")
