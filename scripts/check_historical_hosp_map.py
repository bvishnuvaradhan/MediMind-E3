import json
import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017')
h_db = client['medimind_hospital']
hospitals = {h['code']: h for h in h_db.hospitals.find()}
# H1: MM-HYD-01 (Aarogyam), H2: MM-HYD-02 (Nexora), H3: MM-MUM-03 (Harborview)
hosp_map = {
    'MediMind Central Hospital': hospitals.get('MM-HYD-01'),
    'Apex Metro Healthcare': hospitals.get('MM-HYD-02'),
    'St. Jude Multispecialty Hospital': hospitals.get('MM-MUM-03')
}

depts = list(h_db.departments.find())
print("Active departments in medimind_hospital:")
for d in depts:
    print(f"  Hosp {d['hospital_id']} | Dept: {d['name']} ({d['code']}) | ID: {d['_id']}")

with open('scripts/historical_66_doctors.json', 'r', encoding='utf-8') as f:
    h66 = json.load(f)

print("\nChecking historical doctors mapping:")
for d in h66[:10]:
    h_name = d.get('hospitalName')
    dept_name = d.get('departmentName')
    h_obj = hosp_map.get(h_name)
    print(f"  {d.get('name')} | {h_name} -> {h_obj.get('name') if h_obj else 'None'} | Dept: {dept_name}")
