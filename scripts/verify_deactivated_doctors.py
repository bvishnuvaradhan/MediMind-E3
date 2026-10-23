import os
import json
from bson import ObjectId
from pymongo import MongoClient
import dotenv

dotenv.load_dotenv('backend/.env')
uri = os.getenv('MONGODB_URI')
client = MongoClient(uri)

db_doc = client['medimind_doctor']
db_auth = client['medimind_auth']
db_app = client['medimind_appointment']
db_med = client['medimind_medical_record']

demo_docs = list(db_doc.doctors.find({'status': 'INACTIVE'}))
print(f"Found {len(demo_docs)} inactive doctor profiles:")

manifest = []

for d in demo_docs:
    u = db_auth.users.find_one({'_id': d.get('user_id')})
    app_count = db_app.appointments.count_documents({'doctor_id': d['_id']})
    cons_count = db_app.consultations.count_documents({'doctor_id': d['_id']})
    presc_count = db_app.prescriptions.count_documents({'doctor_id': d['_id']})
    notes_count = db_med.clinicalnotes.count_documents({'doctor_id': d['_id']}) if 'clinicalnotes' in db_med.list_collection_names() else 0

    print(f"\n--- Doctor Profile: {d['_id']} ---")
    print(f"  Name: {d.get('full_name')} | Email: {d.get('email')}")
    print(f"  Doctor Status: {d.get('status')} | Auth User Status: {u.get('status') if u else 'N/A'}")
    print(f"  Appointments: {app_count}")
    print(f"  Consultations: {cons_count}")
    print(f"  Prescriptions: {presc_count}")
    print(f"  Clinical Notes: {notes_count}")

    assert app_count == 0, f"Expected 0 appointments for {d['_id']}, got {app_count}"
    assert cons_count == 0, f"Expected 0 consultations for {d['_id']}, got {cons_count}"
    assert presc_count == 0, f"Expected 0 prescriptions for {d['_id']}, got {presc_count}"
    assert notes_count == 0, f"Expected 0 notes for {d['_id']}, got {notes_count}"

    manifest.append({
        'current_id': str(d['_id']),
        'current_name': d.get('full_name'),
        'current_email': d.get('email'),
        'current_status': d.get('status'),
        'proposed_replacement_name': 'Dr. Arvind Deshpande (Retired Senior Orthopedic Consultant)' if 'ortho' in (d.get('email') or '') else 'Dr. Meenakshi Sundaram (Former Senior Endocrinologist)',
        'proposed_replacement_email': 'arvind.deshpande.ret@aarogyam.hospital' if 'ortho' in (d.get('email') or '') else 'meenakshi.sundaram.ret@harborview.hospital',
        'proposed_status': 'DEACTIVATED',
        'deactivation_reason': 'Voluntary retirement / emeritus transition; historical credential preserved',
        'safe_to_replace_dry_run': True
    })

print("\n[ALL ZERO-RECORD INVARIANTS VERIFIED]")
print("\n--- DRY-RUN REPLACEMENT MANIFEST ---")
print(json.dumps(manifest, indent=2))
