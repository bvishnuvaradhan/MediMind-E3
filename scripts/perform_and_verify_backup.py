import os
import sys
import json
import hashlib
import subprocess
from datetime import datetime
import pymongo

BACKUP_PARENT = r"D:\MediMind_Backups"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
BACKUP_DIR = os.path.join(BACKUP_PARENT, f"MediMind_DB_Backup_{TIMESTAMP}")
DUMP_TOOL = r"C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-database-tools-windows-x86_64-100.9.0\bin\mongodump.exe"
RESTORE_TOOL = r"C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-database-tools-windows-x86_64-100.9.0\bin\mongorestore.exe"

TARGET_DBS = [
    'medimind_auth',
    'medimind_family',
    'medimind_doctor',
    'medimind_hospital',
    'medimind_appointment',
    'medimind_records',
    'medimind_knowledge',
    'medimind_ai'
]

print(f"=== MEDIMIND FRESH BACKUP & RESTORATION AUDIT ===")
print(f"Timestamp: {TIMESTAMP}")
print(f"Destination: {BACKUP_DIR}")

os.makedirs(BACKUP_DIR, exist_ok=True)

# 1. Connect to live MongoDB to get baseline counts
client = pymongo.MongoClient('mongodb://127.0.0.1:27017', serverSelectionTimeoutMS=4000)
baseline_counts = {}
for db_name in TARGET_DBS:
    baseline_counts[db_name] = {}
    db = client[db_name]
    for coll in db.list_collection_names():
        baseline_counts[db_name][coll] = db[coll].count_documents({})

print("\n--- Baseline Live Document Counts ---")
for db_name, colls in baseline_counts.items():
    total_docs = sum(colls.values())
    print(f"  {db_name}: {len(colls)} collections, {total_docs} documents")

# 2. Run mongodump for each database
print("\n--- Executing mongodump ---")
dump_success = True
for db_name in TARGET_DBS:
    cmd = [
        DUMP_TOOL,
        "--host", "127.0.0.1:27017",
        "--db", db_name,
        "--gzip",
        "--out", BACKUP_DIR
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"ERROR dumping {db_name}: {res.stderr}")
        dump_success = False
    else:
        print(f"  [DUMPED] {db_name}")

if not dump_success:
    print("Backup creation failed!")
    sys.exit(1)

# 3. Generate SHA256 checksums and manifest
print("\n--- Generating Checksums & Manifest ---")
checksums = {}
total_backup_bytes = 0
file_count = 0

checksum_file_path = os.path.join(BACKUP_DIR, "checksums.sha256")
with open(checksum_file_path, "w", encoding="utf-8") as cs_file:
    for root, dirs, files in os.walk(BACKUP_DIR):
        for f in files:
            if f in ["checksums.sha256", "backup_manifest.json"]:
                continue
            fp = os.path.join(root, f)
            rel_path = os.path.relpath(fp, BACKUP_DIR)
            file_count += 1
            fsize = os.path.getsize(fp)
            total_backup_bytes += fsize
            
            sha256 = hashlib.sha256()
            with open(fp, "rb") as bf:
                while chunk := bf.read(65536):
                    sha256.update(chunk)
            digest = sha256.hexdigest()
            checksums[rel_path] = digest
            cs_file.write(f"{digest}  {rel_path}\n")

manifest = {
    "backup_name": f"MediMind_DB_Backup_{TIMESTAMP}",
    "timestamp": datetime.now().isoformat(),
    "backup_path": BACKUP_DIR,
    "total_size_bytes": total_backup_bytes,
    "total_size_mb": round(total_backup_bytes / (1024 * 1024), 2),
    "total_files": file_count,
    "compression": "gzip",
    "databases": TARGET_DBS,
    "baseline_counts": baseline_counts
}

manifest_file_path = os.path.join(BACKUP_DIR, "backup_manifest.json")
with open(manifest_file_path, "w", encoding="utf-8") as mf_file:
    json.dump(manifest, mf_file, indent=2)

print(f"Generated checksums for {file_count} files.")
print(f"Total backup archive size: {manifest['total_size_mb']} MB")

# 4. Perform Isolated Test Restoration
print("\n--- Performing Isolated Test Restoration ---")
TEMP_PREFIX = "temp_restore_verify_"
restore_verification = {}
all_restore_passed = True

for db_name in TARGET_DBS:
    temp_db_name = f"{TEMP_PREFIX}{db_name}"
    db_dump_dir = os.path.join(BACKUP_DIR, db_name)
    
    # Drop temp db first if exists
    client.drop_database(temp_db_name)
    
    cmd = [
        RESTORE_TOOL,
        "--host", "127.0.0.1:27017",
        "--db", temp_db_name,
        "--gzip",
        "--dir", db_dump_dir
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"ERROR restoring {db_name} to {temp_db_name}: {res.stderr}")
        restore_verification[db_name] = {"status": "FAILED", "error": res.stderr}
        all_restore_passed = False
        continue
        
    temp_db = client[temp_db_name]
    restored_colls = temp_db.list_collection_names()
    mismatch = False
    counts_restored = {}
    
    for coll, expected_count in baseline_counts[db_name].items():
        if coll not in restored_colls:
            mismatch = True
            break
        act_count = temp_db[coll].count_documents({})
        counts_restored[coll] = act_count
        if act_count != expected_count:
            mismatch = True
            
    if not mismatch and len(restored_colls) == len(baseline_counts[db_name]):
        print(f"  [RESTORE VERIFIED] {db_name} -> {temp_db_name} (Collections: {len(restored_colls)}, Docs: {sum(counts_restored.values())})")
        restore_verification[db_name] = {
            "status": "PASSED",
            "collections_restored": len(restored_colls),
            "total_documents": sum(counts_restored.values())
        }
    else:
        print(f"  [RESTORE MISMATCH] {db_name} -> {temp_db_name}")
        restore_verification[db_name] = {"status": "MISMATCH", "expected": baseline_counts[db_name], "actual": counts_restored}
        all_restore_passed = False

    # Clean up temp database immediately
    client.drop_database(temp_db_name)

# 5. Write Evidence File
evidence = {
    "audit": "MediMind Fresh Database Backup & Isolated Recovery Verification",
    "timestamp": datetime.now().isoformat(),
    "backupLocation": BACKUP_DIR,
    "host": "127.0.0.1",
    "port": 27017,
    "status": "VERIFIED" if all_restore_passed else "FAILED",
    "compression": "gzip",
    "checksumAlgorithm": "SHA256",
    "manifestFile": "backup_manifest.json",
    "checksumFile": "checksums.sha256",
    "totalDatabasesTargeted": len(TARGET_DBS),
    "totalDatabasesVerified": len([d for d, r in restore_verification.items() if r.get('status') == 'PASSED']),
    "totalFiles": file_count,
    "totalSizeBytes": total_backup_bytes,
    "totalSizeMB": round(total_backup_bytes / (1024 * 1024), 2),
    "databases": [
        {
            "name": db_name,
            "collections": [{"name": c, "count": cnt} for c, cnt in baseline_counts[db_name].items()],
            "restoreVerification": restore_verification[db_name]["status"]
        }
        for db_name in TARGET_DBS
    ]
}

evidence_path = r"D:\projects\MediMind\Documents\Production_Readiness_Audit\MediMind_Backup_Verification_Evidence.json"
with open(evidence_path, "w", encoding="utf-8") as ef:
    json.dump(evidence, ef, indent=2)

print(f"\nWrote evidence to {evidence_path}")
print(f"Backup & Verification Status: {'ALL CHECKS PASSED' if all_restore_passed else 'RESTORE CHECKS FAILED'}")
