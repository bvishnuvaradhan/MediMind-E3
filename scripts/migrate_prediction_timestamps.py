"""
MediMind Prediction Timestamp Migration & Dry-Run Manifest Generator
Section 2 of User Specification:
- Identify predictions after Nov 4 backfilled by remediate_missing_predictions.py
- Reconcile created_at with linked appointment's booking creation timestamp (appointment.created_at)
- Preserve original timestamps in 'original_created_at' and tag with 'migration_manifest_id'
- Support --dry-run (default) and --apply flags
"""

import os
import sys
import json
import datetime
from bson import ObjectId
import pymongo
from dotenv import load_dotenv

load_dotenv('backend/.env')

URI = os.getenv('MONGODB_URI')
if not URI:
    print("ERROR: MONGODB_URI not found in backend/.env")
    sys.exit(1)

client = pymongo.MongoClient(URI)
db_ai = client['medimind_ai']
db_apt = client['medimind_appointment']

dry_run = '--apply' not in sys.argv

print(f"=== MEDIMIND PREDICTION TIMELINE MIGRATION (Dry-Run: {dry_run}) ===")

# Query predictions with created_at > 2026-11-04T23:59:59
cutoff_str = "2026-11-04T23:59:59"
cutoff_dt = datetime.datetime(2026, 11, 4, 23, 59, 59)

preds_to_migrate = list(db_ai.predictions.find({
    '$or': [
        {'created_at': {'$gt': cutoff_str}},
        {'created_at': {'$gt': cutoff_dt}},
    ]
}))

print(f"Found {len(preds_to_migrate)} candidate predictions created after Nov 4.")

# Fetch linked appointments
apt_ids = [ObjectId(p['appointment_id']) for p in preds_to_migrate if p.get('appointment_id') and ObjectId.is_valid(p['appointment_id'])]
apts = list(db_apt.appointments.find({'_id': {'$in': apt_ids}}, {'created_at': 1, 'appointment_date': 1}))
apt_map = {str(a['_id']): a for a in apts}

manifest_records = []
now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
manifest_id = f"manifest_timeline_migration_{int(datetime.datetime.now().timestamp())}"

for p in preds_to_migrate:
    pid = str(p['_id'])
    aid = str(p.get('appointment_id'))
    curr_created = p.get('created_at')
    apt = apt_map.get(aid)
    
    if not apt or not apt.get('created_at'):
        continue

    apt_created = apt.get('created_at')
    # Convert to string format consistent with DB
    if isinstance(apt_created, datetime.datetime):
        new_created = apt_created.isoformat()
    else:
        new_created = str(apt_created)

    curr_created_str = curr_created.isoformat() if isinstance(curr_created, datetime.datetime) else str(curr_created)

    manifest_records.append({
        'prediction_id': pid,
        'prediction_ref': p.get('prediction_id'),
        'appointment_id': aid,
        'original_created_at': curr_created_str,
        'new_created_at': new_created,
        'scheduled_appointment_date': apt.get('appointment_date').isoformat() if isinstance(apt.get('appointment_date'), datetime.datetime) else str(apt.get('appointment_date')),
        'model_name': p.get('model_name'),
        'prediction_type': p.get('prediction_type'),
    })

print(f"Generated {len(manifest_records)} migration targets with verified linked appointments.")

# Save manifest to disk
manifest_payload = {
    'manifest_id': manifest_id,
    'generated_at': now_iso,
    'dry_run': dry_run,
    'total_candidates': len(preds_to_migrate),
    'total_targets': len(manifest_records),
    'records': manifest_records,
}

manifest_path = 'scripts/prediction_timeline_migration_manifest.json'
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest_payload, f, indent=2)

print(f"Manifest written to {manifest_path} (Size: {len(json.dumps(manifest_payload))} bytes)")

if not dry_run:
    print("APPLYING TIMESTAMP CORRECTIONS TO ATLAS DATABASE...")
    updated_count = 0
    for rec in manifest_records:
        res = db_ai.predictions.update_one(
            {'_id': ObjectId(rec['prediction_id'])},
            {
                '$set': {
                    'created_at': rec['new_created_at'],
                    'original_created_at': rec['original_created_at'],
                    'migration_manifest_id': manifest_id,
                    'migrated_at': now_iso,
                }
            }
        )
        if res.modified_count > 0:
            updated_count += 1
    print(f"SUCCESS: Successfully updated {updated_count} predictions in medimind_ai.predictions!")
else:
    print("[DRY-RUN COMPLETE] Atlas was NOT modified. Use --apply to execute.")
