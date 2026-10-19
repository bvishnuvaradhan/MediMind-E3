import json
import pymongo
import openpyxl

client = pymongo.MongoClient('mongodb://127.0.0.1:27017')
auth_db = client['medimind_auth']
fam_db = client['medimind_family']
doc_db = client['medimind_doctor']
hosp_db = client['medimind_hospital']

wb = openpyxl.load_workbook('Documents/MediMind_Role_Credentials.xlsx', data_only=True)

with open('scripts/canonical_inventory.json', 'r', encoding='utf-8') as f:
    inventory = json.load(f)

print(f"Loaded {len(inventory)} accounts from inventory.")

# 1. Chairmen
chairmen_data = []
for item in inventory:
    if item['role'] == 'CHAIRMAN':
        parts = item['full_name'].split()
        initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) > 1 else item['full_name'][:2].upper()
        chairmen_data.append({
            'id': item['account_id'],
            'userId': item['account_id'],
            'name': item['full_name'],
            'email': item['email'],
            'role': 'CHAIRMAN',
            'title': 'Chairman & Platform Owner',
            'avatarInitials': initials,
            'avatarTone': 'indigo',
            'scope': 'Global Platform Owner',
        })
print("Chairmen count:", len(chairmen_data))

# 2. Hospital Admins
hospital_admins_data = []
for item in inventory:
    if item['role'] == 'HOSPITAL_ADMIN':
        parts = item['full_name'].split()
        initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) > 1 else item['full_name'][:2].upper()
        u = auth_db.users.find_one({'email': item['email']})
        hosp_id = u.get('hospital_id') or str(u.get('reference_id'))
        hospital_admins_data.append({
            'id': item['account_id'],
            'hospitalId': hosp_id,
            'hospitalName': item['hospital'],
            'name': item['full_name'],
            'email': item['email'],
            'phone': '+91 80 2345 6789',
            'status': 'Active',
            'role': 'Lead Hospital Administrator',
            'createdAt': '10 Jan 2024',
            'lastLogin': 'Today, 09:15 AM',
            'avatarInitials': initials,
            'avatarTone': 'sapphire',
        })
print("Hospital Admins count:", len(hospital_admins_data))

# 3. Department Heads
dept_heads_data = []
for item in inventory:
    if item['role'] == 'DEPARTMENT_HEAD':
        parts = item['full_name'].split()
        initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) > 1 else item['full_name'][:2].upper()
        u = auth_db.users.find_one({'email': item['email']})
        dept_heads_data.append({
            'id': item['account_id'],
            'name': item['full_name'],
            'email': item['email'],
            'role': 'Head of Department',
            'departmentName': item['department'],
            'departmentId': u.get('department_id') or f"DEPT-{item['department'][:3].upper()}",
            'hospitalName': item['hospital'],
            'hospitalId': u.get('hospital_id') or 'HOSP-001',
            'title': f"Head of {item['department']}",
            'avatarInitials': initials,
            'avatarTone': 'coral',
            'status': 'Active'
        })
print("Department Heads count:", len(dept_heads_data))

# 4. Doctors
doctors_data = []
for item in inventory:
    if item['role'] == 'DOCTOR':
        parts = item['full_name'].split()
        initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) > 1 else item['full_name'][:2].upper()
        u = auth_db.users.find_one({'email': item['email']})
        doc_record = doc_db.doctors.find_one({'email': item['email']})
        doctors_data.append({
            'id': item['account_id'],
            'codeId': item['doctor_code'],
            'name': item['full_name'],
            'email': item['email'],
            'specialization': item['specialization'],
            'departmentName': item['department'],
            'hospitalName': item['hospital'],
            'hospitalId': u.get('hospital_id') if u else 'HOSP-001',
            'departmentId': u.get('department_id') if u else 'DEPT-001',
            'title': 'Senior Consultant',
            'avatarInitials': initials,
            'avatarTone': 'coral',
            'rating': '4.9',
            'experience': '12+ Years',
            'status': 'Active',
            'room': 'OPD Room 204'
        })
print("Doctors count:", len(doctors_data))

# 5. Families and Family Members from MongoDB
families_data = []
family_members_data = []

fam_docs = list(fam_db.families.find())
for item in inventory:
    if item['role'] == 'FAMILY':
        email = item['email']
        fam_doc = fam_db.families.find_one({'email': email})
        fam_code = item['family_code'] or 'FAM-001'
        fam_name = item['full_name']
        
        # Get members from MongoDB
        mems = list(fam_db.familymembers.find({'family_id': fam_doc['_id']}))
        primary_contact = fam_name.replace(' Family', '')
        if len(mems) > 0:
            primary_contact = mems[0].get('full_name', primary_contact)
            
        families_data.append({
            'id': fam_code,
            'name': fam_name,
            'email': email,
            'mobile': fam_doc.get('mobile', '+91 98765 43210'),
            'primaryContact': primary_contact,
            'membersCount': len(mems),
            'headName': primary_contact,
            'status': 'Active',
            'category': 'Standard'
        })
        
        tones = ['coral', 'lilac', 'sapphire', 'mint', 'amber']
        for idx, m in enumerate(mems):
            m_name = m.get('full_name')
            m_parts = m_name.split()
            m_initials = (m_parts[0][0] + m_parts[-1][0]).upper() if len(m_parts) > 1 else m_name[:2].upper()
            dob = m.get('date_of_birth')
            dob_str = dob.strftime('%d %b %Y') if dob else '01 Jan 1990'
            age = (2026 - dob.year) if dob else 35
            
            family_members_data.append({
                'id': f"MEM-{fam_code}-{idx+1:02d}",
                'familyId': fam_code,
                'name': m_name,
                'fullName': m_name,
                'relation': 'You' if idx == 0 else 'Family member',
                'relationship': 'Primary' if idx == 0 else 'Family member',
                'initials': m_initials,
                'tone': tones[idx % len(tones)],
                'gender': m.get('gender', 'MALE').capitalize(),
                'bloodGroup': m.get('blood_group', 'O+'),
                'dob': dob_str,
                'age': age,
                'phone': m.get('phone') or '+91 98765 43210',
                'email': m.get('email') or email,
                'address': m.get('address') or 'Mumbai, Maharashtra',
                'emergencyContact': f"{primary_contact} · +91 98765 43210",
                'conditions': ', '.join(m.get('medical_conditions', [])) or 'None reported',
                'allergies': ', '.join(m.get('allergies', [])) or 'No known allergies',
                'treatments': ', '.join(m.get('previous_treatments', [])) or 'Routine health maintenance',
                'records': 4,
                'predictions': 1,
                'appointments': 1,
                'consultations': 2,
                'prescriptions': 1
            })

print("Families count:", len(families_data))
print("Family Members count:", len(family_members_data))

with open('scripts/canonical_frontend_data.json', 'w', encoding='utf-8') as f:
    json.dump({
        'chairmen': chairmen_data,
        'hospitalAdmins': hospital_admins_data,
        'departmentHeads': dept_heads_data,
        'doctors': doctors_data,
        'families': families_data,
        'familyMembers': family_members_data
    }, f, indent=2)

print("Saved scripts/canonical_frontend_data.json")
