from pymongo import MongoClient
from bson import ObjectId
import json
from collections import Counter

client = MongoClient('mongodb://127.0.0.1:27017')
appt_db = client['medimind_appointment']
ai_db = client['medimind_ai']
hosp_db = client['medimind_hospital']

depts = {str(d['_id']): d.get('name', '') for d in hosp_db.departments.find({})}
appts = list(appt_db.appointments.find({}))
preds = list(ai_db.predictions.find({}))

# Map prediction by appointment_id
pred_by_appt = {}
for p in preds:
    aid = p.get('appointment_id')
    if aid:
        pred_by_appt[str(aid)] = p

print(f"Total appointments: {len(appts)}")

# Supported AI model departments:
# 1. Orthopedics -> Fracture Detection
# 2. Diabetology / Endocrinology -> Diabetes Risk
# 3. Cardiology -> Heart Disease Risk
# 4. General Medicine -> General Health NLP
supported_depts = {'Orthopedics', 'Diabetology', 'Cardiology', 'General Medicine'}

by_dept_appts = Counter()
by_dept_preds = Counter()
by_status = Counter()
by_type = Counter()

for a in appts:
    dname = depts.get(str(a.get('department_id')), 'Unknown')
    by_dept_appts[dname] += 1
    by_status[a.get('status')] += 1
    by_type[a.get('appointment_type', 'BOOKED')] += 1
    aid_str = str(a['_id'])
    if aid_str in pred_by_appt:
        by_dept_preds[dname] += 1

print("\n--- Appointments by Department & Predictions Linked ---")
for dname, cnt in sorted(by_dept_appts.items(), key=lambda x: -x[1]):
    p_cnt = by_dept_preds[dname]
    is_sup = "SUPPORTED AI DEPT" if dname in supported_depts else "NON-AI DEPT"
    print(f"  {dname:20s}: {cnt:4d} appointments | {p_cnt:4d} predictions ({is_sup})")

print("\n--- Appointments by Type ---")
for t, c in by_type.items():
    print(f"  {t}: {c}")

print("\n--- Appointments by Status ---")
for s, c in by_status.items():
    print(f"  {s}: {c}")

total_supported_appts = sum(cnt for d, cnt in by_dept_appts.items() if d in supported_depts)
total_unsupported_appts = sum(cnt for d, cnt in by_dept_appts.items() if d not in supported_depts)
print(f"\nTotal appointments in 4 AI-supported departments: {total_supported_appts}")
print(f"Total appointments in other 9 non-AI departments: {total_unsupported_appts}")
print(f"Total predictions linked across all appointments: {len(pred_by_appt)}")
