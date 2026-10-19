import pymongo
from collections import defaultdict
import datetime

client = pymongo.MongoClient('mongodb://127.0.0.1:27017')
db = client['medimind_appointment']
appts = list(db['appointments'].find())

print(f"Total appointments in DB: {len(appts)}")

by_month = defaultdict(int)
by_doctor = defaultdict(lambda: defaultdict(int))
by_status = defaultdict(int)
by_hosp = defaultdict(int)
by_patient = defaultdict(int)

for a in appts:
    d = a.get('appointment_date')
    if d:
        dt_str = str(d)[:7] # YYYY-MM
        by_month[dt_str] += 1
    st = a.get('status', 'Unknown')
    by_status[st] += 1
    doc_id = str(a.get('doctor_id') or 'Unknown')
    by_doctor[doc_id][dt_str] += 1
    by_doctor[doc_id]['total'] += 1
    hosp_id = str(a.get('hospital_id') or 'Unknown')
    by_hosp[hosp_id] += 1
    pat_id = str(a.get('family_member_id') or a.get('patient_id') or 'Unknown')
    by_patient[pat_id] += 1

print("\n--- BY MONTH ---")
for m in sorted(by_month.keys()):
    print(f"  {m}: {by_month[m]}")

print("\n--- BY STATUS ---")
for st, cnt in by_status.items():
    print(f"  {st}: {cnt}")

print("\n--- BY HOSPITAL ---")
for h, cnt in by_hosp.items():
    print(f"  {h}: {cnt}")

print(f"\n--- DOCTORS COVERAGE ({len(by_doctor)} doctors have appointments) ---")
# Check doctor collection to compare
doc_db = client['medimind_doctor']
all_docs = list(doc_db['doctors'].find())
all_doc_ids = set(str(d['_id']) for d in all_docs)
print(f"Total doctors in medimind_doctor.doctors: {len(all_docs)}")

doc_counts = []
for d in all_docs:
    did = str(d['_id'])
    name = d.get('full_name') or d.get('name')
    exp = d.get('experience_years') or d.get('experience') or 0
    hosp = d.get('hospital_name') or str(d.get('hospital_id'))
    tot = by_doctor[did]['total']
    aug = by_doctor[did]['2026-08']
    sep = by_doctor[did]['2026-09']
    oct_ = by_doctor[did]['2026-10']
    nov = by_doctor[did]['2026-11']
    doc_counts.append((name, exp, tot, aug, sep, oct_, nov))

print(f"{'Doctor Name':<28} | {'Exp':<4} | {'Total':<5} | {'Aug':<4} | {'Sep':<4} | {'Oct':<4} | {'Nov':<4}")
print("-" * 65)
for name, exp, tot, aug, sep, oct_, nov in doc_counts:
    print(f"{name:<28} | {exp:<4} | {tot:<5} | {aug:<4} | {sep:<4} | {oct_:<4} | {nov:<4}")

print(f"\nMinimum appointments across all 29 doctors: {min(d[2] for d in doc_counts)}")
print(f"Maximum appointments across all 29 doctors: {max(d[2] for d in doc_counts)}")
print(f"Average appointments across all 29 doctors: {sum(d[2] for d in doc_counts)/len(doc_counts):.1f}")
