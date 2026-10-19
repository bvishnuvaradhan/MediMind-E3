import os
import json
import pymongo

client = pymongo.MongoClient('mongodb://127.0.0.1:27017', serverSelectionTimeoutMS=4000)
info = client.server_info()
print(f"MongoDB Connected. Version: {info.get('version')}")

expected_dbs = [
    'medimind_auth',
    'medimind_family',
    'medimind_doctor',
    'medimind_hospital',
    'medimind_appointment',
    'medimind_records',
    'medimind_knowledge',
    'medimind_ai'
]

backup_path = r"D:\MediMind_Backups\MediMind_DB_Backup_20261016_202100"
manifest_file = os.path.join(backup_path, 'backup_manifest.json')
baseline = {}
if os.path.exists(manifest_file):
    with open(manifest_file, 'r', encoding='utf-8') as f:
        mf = json.load(f)
        baseline = mf.get('baseline_counts', {})
    print(f"Loaded baseline from {manifest_file}")
else:
    print("Manifest not found at backup path!")

print("\nDatabase Comparison (Live vs Baseline):")
all_matched = True
for db_name in expected_dbs:
    db = client[db_name]
    live_colls = db.list_collection_names()
    live_counts = {c: db[c].count_documents({}) for c in live_colls}
    base_counts = baseline.get(db_name, {})
    match = live_counts == base_counts
    if not match:
        all_matched = False
    print(f"  {db_name}: Live={live_counts} | Baseline={base_counts} | Match={match}")

print(f"\nAll Databases Document Counts Matched Exactly: {all_matched}")

print(f"\nBackup folder exists: {os.path.exists(backup_path)}")
if os.path.exists(backup_path):
    files = [f for root, dirs, fls in os.walk(backup_path) for f in fls]
    print(f"Backup archive files count: {len(files)}")
