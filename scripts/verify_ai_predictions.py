from pymongo import MongoClient
from bson import ObjectId
import json
from collections import Counter
from datetime import datetime

client = MongoClient('mongodb://127.0.0.1:27017')
ai_db = client['medimind_ai']
appt_db = client['medimind_appointment']
fam_db = client['medimind_family']

predictions = list(ai_db.predictions.find({}))
appointments = list(appt_db.appointments.find({}))
family_members = {str(m['_id']): m for m in fam_db.familymembers.find({})}

print(f"Total AI Predictions in medimind_ai.predictions: {len(predictions)}")
print(f"Total Appointments in medimind_appointment.appointments: {len(appointments)}")

# 1. Module breakdown
modules = Counter(p.get('model_type') or p.get('prediction_type') or p.get('type') or p.get('category') for p in predictions)
print(f"Modules raw count: {modules}")

# Let's inspect category mapping
categories = Counter()
for p in predictions:
    cat = (p.get('prediction_type') or p.get('model_type') or p.get('type') or '').lower()
    if 'fracture' in cat:
        categories['Fracture Detection'] += 1
    elif 'diabet' in cat:
        categories['Diabetes Risk'] += 1
    elif 'heart' in cat or 'cardio' in cat:
        categories['Heart Disease Risk'] += 1
    elif 'general' in cat or 'nlp' in cat:
        categories['General Health'] += 1
    else:
        categories[f'Other: {cat}'] += 1
print(f"Categorized breakdown: {dict(categories)}")

# 2. Check for duplicate predictions
pred_ids = [str(p['_id']) for p in predictions]
print(f"Unique prediction IDs: {len(set(pred_ids))}/{len(predictions)}")

# 3. Family member association
valid_member_assoc = 0
invalid_member_assoc = 0
for p in predictions:
    mid = str(p.get('family_member_id') or p.get('patient_id') or '')
    if mid in family_members:
        valid_member_assoc += 1
    else:
        invalid_member_assoc += 1
print(f"Valid family member associations: {valid_member_assoc}, Invalid: {invalid_member_assoc}")

# 4. Appointment linkage & eligibility
appt_by_id = {str(a['_id']): a for a in appointments}

total_appts = len(appointments)
walk_in_appts = sum(1 for a in appointments if a.get('appointment_type') == 'WALK_IN')
booked_appts = total_appts - walk_in_appts

appts_with_pred_field = sum(1 for a in appointments if a.get('ai_prediction_id') is not None)
appts_with_valid_pred = 0
appts_with_dangling_pred = 0
pred_ids_set = set(pred_ids)

for a in appointments:
    pid = a.get('ai_prediction_id')
    if pid is not None:
        if str(pid) in pred_ids_set:
            appts_with_valid_pred += 1
        else:
            appts_with_dangling_pred += 1

# Check predictions linked back to appointments
preds_with_appt = sum(1 for p in predictions if p.get('appointment_id') is not None and str(p.get('appointment_id')) in appt_by_id)

print(f"\nAppointment Eligibility Analysis:")
print(f"  Total Appointments: {total_appts}")
print(f"  Walk-in Appointments (exempt): {walk_in_appts}")
print(f"  Booked Appointments: {booked_appts}")
print(f"  Appointments with ai_prediction_id: {appts_with_pred_field}")
print(f"  Appointments with valid linked prediction: {appts_with_valid_pred}")
print(f"  Appointments with dangling prediction ID: {appts_with_dangling_pred}")
print(f"  Predictions linking to valid appointments: {preds_with_appt}/{len(predictions)}")

# 5. Model provenance & confidence fields
valid_confidence = 0
valid_model_info = 0
for p in predictions:
    conf = p.get('confidence') or p.get('probability') or p.get('risk_score')
    if conf is not None:
        valid_confidence += 1
    model_name = p.get('model_name') or p.get('model_version') or p.get('model_type')
    if model_name:
        valid_model_info += 1

print(f"\nModel Provenance & Telemetry:")
print(f"  Predictions with valid confidence/score: {valid_confidence}/{len(predictions)}")
print(f"  Predictions with valid model info: {valid_model_info}/{len(predictions)}")

audit_result = {
    'total_predictions': len(predictions),
    'categories': dict(categories),
    'valid_member_associations': valid_member_assoc,
    'total_appointments': total_appts,
    'walk_ins_exempt': walk_in_appts,
    'booked_appointments': booked_appts,
    'appointments_linked_to_predictions': appts_with_valid_pred,
    'predictions_linked_to_appointments': preds_with_appt,
    'dangling_prediction_references': appts_with_dangling_pred
}

with open('scripts/ai_prediction_audit.json', 'w') as f:
    json.dump(audit_result, f, indent=2)
print("Saved audit to scripts/ai_prediction_audit.json")
