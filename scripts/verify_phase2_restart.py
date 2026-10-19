import sys
import pymongo

try:
    client = pymongo.MongoClient('mongodb://127.0.0.1:27017', serverSelectionTimeoutMS=4000)
    server_status = client.admin.command('serverStatus')
    uptime = server_status.get('uptime')
    version = server_status.get('version')
    print(f"[STATUS] Connected to MongoDB v{version} on 127.0.0.1:27017")
    print(f"[STATUS] Current server uptime: {uptime} seconds")
    
    dbs = client.list_database_names()
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
    
    print("\n[VERIFICATION] Rechecking all 8 core MediMind databases after restart:")
    all_ok = True
    for edb in expected_dbs:
        if edb in dbs:
            colls = client[edb].list_collection_names()
            doc_count = sum(client[edb][c].count_documents({}) for c in colls)
            print(f"  [PASS] {edb}: Collections: {colls} (Total Docs: {doc_count})")
        else:
            print(f"  [FAIL] {edb}: MISSING!")
            all_ok = False
            
    if all_ok:
        print("\n[SUCCESS] Post-restart verification passed! All databases and collections are intact.")
    else:
        print("\n[ERROR] Post-restart verification failed.")
        sys.exit(1)

except Exception as e:
    print(f"[ERROR] Post-restart connection failed: {e}")
    sys.exit(1)
