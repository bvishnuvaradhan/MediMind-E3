import datetime
from pymongo import MongoClient
from bson import ObjectId

with open('backend/.env') as f:
    for line in f:
        if line.startswith('MONGO_URI=') or line.startswith('MONGODB_URI='):
            uri = line.strip().split('=', 1)[1]
            break

client = MongoClient(uri)
db_doc = client['medimind_doctor']
db_auth = client['medimind_auth']

doc1_id = ObjectId('6adb00e9fddd89ae76d77438')
user1_id = ObjectId('6adb00e9fddd89ae76d77439')

now = datetime.datetime.now(datetime.timezone.utc)
deact_date = datetime.datetime(2026, 9, 30, 0, 0, 0, tzinfo=datetime.timezone.utc)

db_doc.doctors.update_one(
    {'_id': doc1_id},
    {'$set': {
        'full_name': 'Dr. Arvind Deshpande',
        'email': 'dr.arvind.deshpande@medimind.test',
        'specialization': 'Orthopedics & Trauma',
        'qualifications': ['MBBS', 'MS (Orthopedics)', 'FRCS'],
        'experience_years': 28,
        'professional_description': 'Retired Senior Orthopedic Consultant (Account Deactivated)',
        'status': 'INACTIVE',
        'is_demonstration': False,
        'deactivation_reason': 'Retired from active clinical practice',
        'deactivated_at': deact_date,
        'updated_at': now
    }}
)

db_auth.users.update_one(
    {'_id': user1_id},
    {'$set': {
        'email': 'dr.arvind.deshpande@medimind.test',
        'full_name': 'Dr. Arvind Deshpande',
        'name': 'Dr. Arvind Deshpande',
        'status': 'INACTIVE',
        'is_demonstration': False,
        'deactivated_at': deact_date,
        'updated_at': now
    }}
)

doc2_id = ObjectId('6adb00e9fddd89ae76d7743a')
user2_id = ObjectId('6adb00e9fddd89ae76d7743b')

db_doc.doctors.update_one(
    {'_id': doc2_id},
    {'$set': {
        'full_name': 'Dr. Meenakshi Sundaram',
        'email': 'dr.meenakshi.sundaram@medimind.test',
        'specialization': 'Diabetology & Endocrinology',
        'qualifications': ['MBBS', 'MD (Medicine)', 'DM (Endocrinology)'],
        'experience_years': 24,
        'professional_description': 'Former Senior Endocrinologist (Account Deactivated)',
        'status': 'INACTIVE',
        'is_demonstration': False,
        'deactivation_reason': 'Transitioned from platform network',
        'deactivated_at': deact_date,
        'updated_at': now
    }}
)

db_auth.users.update_one(
    {'_id': user2_id},
    {'$set': {
        'email': 'dr.meenakshi.sundaram@medimind.test',
        'full_name': 'Dr. Meenakshi Sundaram',
        'name': 'Dr. Meenakshi Sundaram',
        'status': 'INACTIVE',
        'is_demonstration': False,
        'deactivated_at': deact_date,
        'updated_at': now
    }}
)

print('Updated both deactivated doctor accounts successfully.')
for d in db_doc.doctors.find({'status': 'INACTIVE'}):
    print('Doctor:', d['full_name'], '|', d['email'], '|', d['status'], '| Demo:', d.get('is_demonstration'))
for u in db_auth.users.find({'status': 'INACTIVE'}):
    print('User:', u.get('full_name') or u.get('name'), '|', u['email'], '|', u['status'], '| Demo:', u.get('is_demonstration'))
