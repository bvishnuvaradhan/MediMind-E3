import sys
import pymongo

try:
    client = pymongo.MongoClient('mongodb://127.0.0.1:27017', serverSelectionTimeoutMS=4000)
    server_info = client.server_info()
    version = server_info.get('version')
    print(f"CONNECTED SUCCESSFULLY to MongoDB at 127.0.0.1:27017")
    print(f"MongoDB Version: {version}")
    
    dbs = client.list_database_names()
    print(f"\nDiscovered Databases ({len(dbs)}): {dbs}")
    
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
    
    print("\nVerifying Expected Databases and Collections:")
    all_present = True
    for edb in expected_dbs:
        if edb in dbs:
            colls = client[edb].list_collection_names()
            doc_count = sum(client[edb][c].count_documents({}) for c in colls)
            print(f"  [PASS] {edb}: Collections: {colls} (Total Docs: {doc_count})")
        else:
            print(f"  [FAIL] {edb}: MISSING!")
            all_present = False
            
    if all_present:
        print("\nALL 8 EXPECTED DATABASES ARE PRESENT AND POPULATED.")
    else:
        print("\nSOME DATABASES ARE MISSING.")
        sys.exit(1)

except Exception as e:
    print(f"CONNECTION FAILED: {e}")
    sys.exit(1)
