import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
uri = os.environ.get("MONGODB_URI")
client = MongoClient(uri)

print("=== PHASE 3: AUTHORITATIVE ATLAS RECONCILIATION ===")

# 1. Doctor Profiles
doc_db = client["medimind_doctor"]
all_doctors = list(doc_db.doctors.find())
active_doctors = [d for d in all_doctors if str(d.get("status")).upper() == "ACTIVE" and not d.get("isDemonstration")]
inactive_demo_doctors = [d for d in all_doctors if d.get("isDemonstration") or str(d.get("status")).upper() == "INACTIVE"]

print(f"Total doctor profiles in medimind_doctor: {len(all_doctors)}")
print(f"Active operational doctors: {len(active_doctors)}")
print(f"Inactive demonstration doctor profiles: {len(inactive_demo_doctors)}")

# Verify DOC-030 through DOC-066
doc_codes = [d.get("doctor_code") or d.get("doctorCode") for d in all_doctors]
new_37_codes = [f"DOC-{i:03d}" for i in range(30, 67)]
missing_37 = [c for c in new_37_codes if c not in doc_codes]
print(f"DOC-030 through DOC-066 present: {len(missing_37) == 0} (Missing: {missing_37})")

# 2. Auth Accounts
auth_db = client["medimind_auth"]
all_auth = list(auth_db.users.find())
active_auth = [u for u in all_auth if str(u.get("status")).upper() == "ACTIVE"]
inactive_auth = [u for u in all_auth if str(u.get("status")).upper() != "ACTIVE"]

print(f"Total auth accounts: {len(all_auth)}")
print(f"Active auth accounts: {len(active_auth)}")
print(f"Inactive auth accounts: {len(inactive_auth)}")
for u in inactive_auth:
    print(f"  Inactive Auth: {u.get('email')} | Role: {u.get('role')} | Status: {u.get('status')}")

# 3. Hospitals & Departments
hosp_db = client["medimind_hospital"]
hospitals = list(hosp_db.hospitals.find())
departments = list(hosp_db.departments.find())
active_hospitals = [h for h in hospitals if str(h.get("status")).upper() == "ACTIVE"]
pending_hospitals = [h for h in hospitals if str(h.get("status")).upper() == "PENDING"]
print(f"Total hospitals: {len(hospitals)} (Active: {len(active_hospitals)}, Pending: {len(pending_hospitals)})")
print(f"Total departments: {len(departments)}")

# 4. Appointments & Walk-ins
appt_db = client["medimind_appointment"]
appointments = list(appt_db.appointments.find())
walkins = [a for a in appointments if a.get("is_walkin") is True or a.get("isWalkin") is True or a.get("booking_source") == "WALK_IN" or a.get("bookingSource") == "WALK_IN"]
print(f"Total appointments: {len(appointments)}")
print(f"Walk-in appointments: {len(walkins)} (Ceiling: <= 400)")

# 5. Clinical Records (Consultations & Prescriptions)
rec_db = client["medimind_records"]
consultations = list(rec_db.consultations.find())
prescriptions = list(rec_db.prescriptions.find())
print(f"Total consultations: {len(consultations)}")
print(f"Total prescriptions: {len(prescriptions)}")

# 6. AI Predictions
ai_db = client["medimind_ai"]
predictions = list(ai_db.predictions.find())
linked_preds = [p for p in predictions if p.get("appointment_id") or p.get("appointmentId")]
standalone_preds = [p for p in predictions if not (p.get("appointment_id") or p.get("appointmentId"))]
print(f"Total AI predictions: {len(predictions)}")
print(f"Appointment-linked AI predictions: {len(linked_preds)}")
print(f"Standalone AI predictions: {len(standalone_preds)}")

# Module breakdown
modules = {}
for p in predictions:
    m = p.get("model_type") or p.get("module") or "unknown"
    modules[m] = modules.get(m, 0) + 1
print(f"AI Predictions by module: {modules}")
