import json
import datetime
import bcrypt
import pymongo
from bson import ObjectId

client = pymongo.MongoClient('mongodb://localhost:27017')
auth_db = client['medimind_auth']
doc_db = client['medimind_doctor']
hosp_db = client['medimind_hospital']
appt_db = client['medimind_appointment']

# 1. Verify existing state
initial_appts = appt_db.appointments.count_documents({})
print(f"Initial appointment count: {initial_appts} (MUST REMAIN INTACT)")

# Load hospital mappings
hospitals = {h['code']: h for h in hosp_db.hospitals.find()}
h1 = hospitals['MM-HYD-01'] # Aarogyam
h2 = hospitals['MM-HYD-02'] # Nexora
h3 = hospitals['MM-MUM-03'] # Harborview

hosp_slug_map = {
    h1['_id']: 'aarogyam',
    h2['_id']: 'nexora',
    h3['_id']: 'harborview'
}

# Departments map: (hospital_id, dept_code or dept_type) -> department_id
depts = list(hosp_db.departments.find())
dept_by_hosp = {}
for d in depts:
    hid = d['hospital_id']
    if hid not in dept_by_hosp:
        dept_by_hosp[hid] = {}
    dept_by_hosp[hid][d['code']] = d['_id']
    dept_by_hosp[hid][d['name']] = d['_id']

# Standard availability
standard_avail = [
    {"day": "MONDAY", "start_time": "09:00", "end_time": "17:00"},
    {"day": "TUESDAY", "start_time": "09:00", "end_time": "17:00"},
    {"day": "WEDNESDAY", "start_time": "09:00", "end_time": "17:00"},
    {"day": "THURSDAY", "start_time": "09:00", "end_time": "17:00"},
    {"day": "FRIDAY", "start_time": "09:00", "end_time": "17:00"},
]

# Existing operational doctors
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

candidates = [d for d in h66 if d.get('name') not in existing_29_names][:37]
print(f"Selected {len(candidates)} doctor profiles from historical_66_doctors.json to provision as DOC-030 .. DOC-066.")

now = datetime.datetime.now(datetime.timezone.utc)

def resolve_department(hid, orig_dept_name, spec):
    h_depts = dept_by_hosp[hid]
    name_low = (orig_dept_name + ' ' + spec).lower()
    if 'ortho' in name_low or 'joint' in name_low or 'trauma' in name_low or 'spine' in name_low:
        return h_depts.get('ORTHO') or list(h_depts.values())[0]
    elif 'diab' in name_low or 'endocrin' in name_low or 'metabolic' in name_low or 'glycemic' in name_low:
        return h_depts.get('DIAB') or list(h_depts.values())[0]
    elif 'cardio' in name_low or 'heart' in name_low or 'angio' in name_low or 'coronary' in name_low:
        return h_depts.get('CARDIO') or list(h_depts.values())[0]
    elif 'gen' in name_low or 'adult' in name_low or 'primary' in name_low:
        return h_depts.get('GENMED') or h_depts.get('INTMED') or h_depts.get('PREVMED') or list(h_depts.values())[0]
    elif 'internal' in name_low or 'nephro' in name_low or 'pulm' in name_low or 'gastro' in name_low:
        return h_depts.get('INTMED') or h_depts.get('GENMED') or list(h_depts.values())[0]
    elif 'prev' in name_low or 'family' in name_low:
        return h_depts.get('PREVMED') or h_depts.get('GENMED') or list(h_depts.values())[0]
    else:
        return list(h_depts.values())[0]

def resolve_hospital(orig_hosp_name):
    if 'MediMind Central' in orig_hosp_name:
        return h1['_id']
    elif 'Apex' in orig_hosp_name:
        return h2['_id']
    else:
        return h3['_id']

provisioned_accounts = []

for idx, d in enumerate(candidates, 30):
    full_name = d.get('name').strip()
    orig_hosp = d.get('hospitalName')
    orig_dept = d.get('departmentName')
    spec = d.get('specialization')
    
    hid = resolve_hospital(orig_hosp)
    dept_id = resolve_department(hid, orig_dept, spec)
    hosp_slug = hosp_slug_map[hid]
    
    # Generate clean email
    name_parts = [p.lower() for p in full_name.replace('Dr.', '').strip().split() if p]
    clean_slug = '.'.join(name_parts)
    email = f"dr.{clean_slug}@{hosp_slug}.hospital"
    
    # Check if already exists in doc_db
    existing_doc = doc_db.doctors.find_one({'email': email})
    existing_user = auth_db.users.find_one({'email': email})
    
    # Generate password
    plaintext_pw = f"Doctor#2026${idx:02d}!Dev"
    pw_hash = bcrypt.hashpw(plaintext_pw.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
    
    doc_id = existing_doc['_id'] if existing_doc else ObjectId()
    user_id = existing_user['_id'] if existing_user else ObjectId()
    
    # Qualifications & experience
    quals = [q.strip() for q in d.get('qualification', 'MBBS, MD').split(',')]
    try:
        exp_yrs = int(d.get('experienceYears') or d.get('experience', '8').split()[0])
    except Exception:
        exp_yrs = 8
        
    mobile = d.get('phone') or f"+91 98490 {idx:05d}"
    desc = d.get('description') or f"Consultant Specialist in {spec} at {hosp_db.hospitals.find_one({'_id': hid})['name']}."
    
    # 1. Upsert Doctor Profile
    doc_data = {
        '_id': doc_id,
        'user_id': user_id,
        'hospital_id': hid,
        'department_id': dept_id,
        'full_name': full_name,
        'profile_picture': None,
        'email': email,
        'mobile': mobile,
        'specialization': spec,
        'qualifications': quals,
        'experience_years': exp_yrs,
        'professional_description': desc,
        'availability': standard_avail,
        'status': 'ACTIVE',
        'created_at': now,
        'updated_at': now
    }
    doc_db.doctors.update_one({'_id': doc_id}, {'$set': doc_data}, upsert=True)
    
    # 2. Upsert Auth User
    user_data = {
        '_id': user_id,
        'email': email,
        'password_hash': pw_hash,
        'role': 'DOCTOR',
        'account_type': 'DOCTOR_ACCOUNT',
        'reference_id': doc_id,
        'doctor_id': doc_id,
        'family_id': None,
        'hospital_id': hid,
        'department_id': dept_id,
        'status': 'ACTIVE',
        'created_at': now,
        'updated_at': now
    }
    auth_db.users.update_one({'_id': user_id}, {'$set': user_data}, upsert=True)
    
    provisioned_accounts.append({
        'roster_id': f"DOC-{idx:03d}",
        'name': full_name,
        'email': email,
        'hospital_id': str(hid),
        'department_id': str(dept_id),
        'user_id': str(user_id),
        'doctor_id': str(doc_id),
        'password': plaintext_pw
    })

print(f"Successfully provisioned/upserted {len(provisioned_accounts)} doctor accounts.")

# Verify appointments still intact
final_appts = appt_db.appointments.count_documents({})
print(f"Final appointment count: {final_appts} (Must be exactly 2,851: {final_appts == 2851})")

# Verify total active doctors in doc_db
total_active_docs = doc_db.doctors.count_documents({'status': 'ACTIVE'})
print(f"Total active doctors in medimind_doctor: {total_active_docs} (Expect 66: {total_active_docs == 66})")

total_auth_active_docs = auth_db.users.count_documents({'role': 'DOCTOR', 'status': 'ACTIVE'})
print(f"Total active DOCTOR users in medimind_auth: {total_auth_active_docs}")
