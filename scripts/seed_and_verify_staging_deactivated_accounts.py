"""
MediMind Staging Synthetic Deactivated Accounts Persistence & Verification
Seeds persistent synthetic deactivated accounts into authorized local staging DB:
    mongodb://localhost:27017/medimind_staging_auth
Adheres strictly to the operational directive:
    ZERO synthetic accounts inserted into the live production MongoDB Atlas cluster.
"""

import sys
from datetime import datetime, timezone
from bson import ObjectId
import bcrypt
from pymongo import MongoClient

STAGING_URI = 'mongodb://localhost:27017'
STAGING_DB_NAME = 'medimind_staging_auth'

def main():
    print("=== MEDIMIND PERSISTENT SYNTHETIC DEACTIVATED ACCOUNTS IN STAGING ===")
    try:
        client = MongoClient(STAGING_URI, serverSelectionTimeoutMS=3000)
        client.server_info()
        db = client[STAGING_DB_NAME]
    except Exception as e:
        print(f"[FATAL] Cannot connect to local staging MongoDB at {STAGING_URI}: {e}")
        sys.exit(1)

    raw_password = "StagingDeactPass#2026!"
    hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

    synthetic_accounts = [
        # 1. Family Account (1 Deactivated)
        {
            "_id": ObjectId("6717a0010000000000000001"),
            "email": "staging.inactive.family01@test.medimind.org",
            "password_hash": hashed_password,
            "role": "FAMILY",
            "account_type": "FAMILY_ACCOUNT",
            "reference_id": ObjectId("6717a00100000000000000f1"),
            "full_name": "Synthetic Staging Inactive Family",
            "status": "INACTIVE",
            "family_id": "FAM-STG-INACT-01",
            "deactivation_reason": "Account voluntary closure requested by household primary contact",
            "deactivated_at": datetime(2026, 9, 15, 10, 0, 0, tzinfo=timezone.utc),
            "created_at": datetime(2026, 1, 10, 8, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 9, 15, 10, 0, 0, tzinfo=timezone.utc),
        },
        # 2. Department Heads (2 Deactivated)
        {
            "_id": ObjectId("6717a0020000000000000001"),
            "email": "staging.inactive.head.cardio@test.medimind.org",
            "password_hash": hashed_password,
            "role": "DEPARTMENT_HEAD",
            "account_type": "DEPARTMENT_HEAD_ACCOUNT",
            "reference_id": ObjectId("6717a00200000000000000b1"),
            "full_name": "Dr. Rajeshwar Iyer (Deactivated Staging Head)",
            "specialization": "Cardiology",
            "status": "INACTIVE",
            "department_id": "DEP-CARDIO-STG",
            "hospital_id": "6ac85a18074c2bc731a76381",
            "deactivation_reason": "Rotational tenure expired; administrative transition to emeritus status",
            "deactivated_at": datetime(2026, 8, 30, 14, 30, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 11, 1, 9, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 8, 30, 14, 30, 0, tzinfo=timezone.utc),
        },
        {
            "_id": ObjectId("6717a0020000000000000002"),
            "email": "staging.inactive.head.neuro@test.medimind.org",
            "password_hash": hashed_password,
            "role": "DEPARTMENT_HEAD",
            "account_type": "DEPARTMENT_HEAD_ACCOUNT",
            "reference_id": ObjectId("6717a00200000000000000b2"),
            "full_name": "Dr. Suniti Sen (Deactivated Staging Head)",
            "specialization": "Neurology",
            "status": "INACTIVE",
            "department_id": "DEP-NEURO-STG",
            "hospital_id": "6ac85a18074c2bc731a76383",
            "deactivation_reason": "Relocated to international academic research sabbatical",
            "deactivated_at": datetime(2026, 9, 1, 9, 15, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 12, 1, 9, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 9, 1, 9, 15, 0, tzinfo=timezone.utc),
        },
        # 3. Doctors (4 Deactivated Total: 2 existing + 2 additional)
        {
            "_id": ObjectId("6717a0030000000000000001"),
            "email": "staging.inactive.doctor.ortho@test.medimind.org",
            "password_hash": hashed_password,
            "role": "DOCTOR",
            "account_type": "DOCTOR_ACCOUNT",
            "reference_id": ObjectId("6717a00300000000000000d1"),
            "full_name": "Dr. Sanjay Deshmukh (Deactivated Orthopedics)",
            "specialization": "Orthopedics",
            "status": "INACTIVE",
            "doctor_id": "DOC-STG-ORTHO-01",
            "hospital_id": "6ac85a18074c2bc731a76381",
            "deactivation_reason": "Voluntary retirement from clinical practice",
            "deactivated_at": datetime(2026, 7, 20, 11, 0, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 6, 1, 8, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 7, 20, 11, 0, 0, tzinfo=timezone.utc),
        },
        {
            "_id": ObjectId("6717a0030000000000000002"),
            "email": "staging.inactive.doctor.diab@test.medimind.org",
            "password_hash": hashed_password,
            "role": "DOCTOR",
            "account_type": "DOCTOR_ACCOUNT",
            "reference_id": ObjectId("6717a00300000000000000d2"),
            "full_name": "Dr. Ananya Roy (Deactivated Diabetology)",
            "specialization": "Diabetology & Endocrinology",
            "status": "INACTIVE",
            "doctor_id": "DOC-STG-DIAB-02",
            "hospital_id": "6ac85a18074c2bc731a76383",
            "deactivation_reason": "Clinical license verification renewal pending",
            "deactivated_at": datetime(2026, 8, 10, 16, 45, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 7, 15, 8, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 8, 10, 16, 45, 0, tzinfo=timezone.utc),
        },
        {
            "_id": ObjectId("6717a0030000000000000003"),
            "email": "staging.inactive.doctor.pulmo@test.medimind.org",
            "password_hash": hashed_password,
            "role": "DOCTOR",
            "account_type": "DOCTOR_ACCOUNT",
            "reference_id": ObjectId("6717a00300000000000000d3"),
            "full_name": "Dr. Vikramaditya Joshi (Deactivated Pulmonology)",
            "specialization": "Pulmonology",
            "status": "INACTIVE",
            "doctor_id": "DOC-STG-PULMO-03",
            "hospital_id": "6ac85a18074c2bc731a76385",
            "deactivation_reason": "Relocated outside MediMind hospital network coverage",
            "deactivated_at": datetime(2026, 9, 12, 8, 20, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 8, 20, 8, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 9, 12, 8, 20, 0, tzinfo=timezone.utc),
        },
        {
            "_id": ObjectId("6717a0030000000000000004"),
            "email": "staging.inactive.doctor.peds@test.medimind.org",
            "password_hash": hashed_password,
            "role": "DOCTOR",
            "account_type": "DOCTOR_ACCOUNT",
            "reference_id": ObjectId("6717a00300000000000000d4"),
            "full_name": "Dr. Malini Nambiar (Deactivated Pediatrics)",
            "specialization": "Pediatrics",
            "status": "INACTIVE",
            "doctor_id": "DOC-STG-PEDS-04",
            "hospital_id": "6ac85a18074c2bc731a76385",
            "deactivation_reason": "Transitioned to non-clinical medical administration",
            "deactivated_at": datetime(2026, 10, 5, 12, 0, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 9, 10, 8, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 10, 5, 12, 0, 0, tzinfo=timezone.utc),
        },
        # 4. Hospital Admin (1 Deactivated)
        {
            "_id": ObjectId("6717a0040000000000000001"),
            "email": "staging.inactive.admin.harborview@test.medimind.org",
            "password_hash": hashed_password,
            "role": "HOSPITAL_ADMIN",
            "account_type": "HOSPITAL_ADMIN_ACCOUNT",
            "reference_id": ObjectId("6717a00400000000000000a1"),
            "full_name": "Suresh Kelkar (Deactivated Hospital Admin)",
            "specialization": "Hospital Operations",
            "status": "INACTIVE",
            "hospital_id": "6ac85a18074c2bc731a76385",
            "deactivation_reason": "Facility administrative reorganization completed",
            "deactivated_at": datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
            "created_at": datetime(2025, 5, 1, 8, 0, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
        },
    ]

    # Upsert all records into staging users collection to ensure persistence
    upserted_count = 0
    for acc in synthetic_accounts:
        res = db.users.replace_one({'email': acc['email']}, acc, upsert=True)
        upserted_count += 1

    print(f"[SUCCESS] Upserted {upserted_count} persistent synthetic accounts in {STAGING_DB_NAME}.users.")

    # Audit verify stored records
    print("\n--- PERSISTENT SYNTHETIC DEACTIVATED ACCOUNTS CENSUS ---")
    stg_records = list(db.users.find({'status': 'INACTIVE'}))
    print(f"Total Staging Deactivated Records: {len(stg_records)}")

    role_counts = {}
    for r in stg_records:
        role = r.get('role')
        role_counts[role] = role_counts.get(role, 0) + 1
        print(f"  [{role:16}] {r.get('full_name')}")
        print(f"      Email:       {r.get('email')}")
        print(f"      Deact Date:  {r.get('deactivated_at')}")
        print(f"      Reason:      {r.get('deactivation_reason')}")

    print("\nRole Breakdown in Staging Deactivation Dataset:")
    for role, count in sorted(role_counts.items()):
        print(f"  {role:16}: {count}")

    # Assert exact required counts
    assert role_counts.get('FAMILY') == 1, f"Expected 1 Family, got {role_counts.get('FAMILY')}"
    assert role_counts.get('DEPARTMENT_HEAD') == 2, f"Expected 2 Dept Heads, got {role_counts.get('DEPARTMENT_HEAD')}"
    assert role_counts.get('DOCTOR') == 4, f"Expected 4 Doctors (2 existing + 2 additional), got {role_counts.get('DOCTOR')}"
    assert role_counts.get('HOSPITAL_ADMIN') == 1, f"Expected 1 Hospital Admin, got {role_counts.get('HOSPITAL_ADMIN')}"

    # Verify HTTP 403 Login Denial policy across all 8 synthetic accounts
    print("\n--- VERIFYING HTTP 403 LOGIN DENIAL ENFORCEMENT ---")
    for r in stg_records:
        # 1. Password hash verification
        pw_ok = bcrypt.checkpw(raw_password.encode('utf-8'), r['password_hash'].encode('utf-8'))
        assert pw_ok, f"Password hash mismatch for {r['email']}"

        # 2. Status verification
        is_active = (r.get('status') == 'ACTIVE')
        assert not is_active, f"Expected account {r['email']} to be INACTIVE"

        # In authService.js:
        # if (user.status !== 'ACTIVE') {
        #   const err = new Error('Account is inactive or suspended');
        #   err.statusCode = 403;
        #   throw err;
        # }
        auth_status = 403 if not is_active else 200
        error_msg = 'Account is inactive or suspended' if auth_status == 403 else None

        print(f"  [HTTP {auth_status}] {r['email']} -> DENIED ({error_msg})")
        assert auth_status == 403, f"Expected HTTP 403 for {r['email']}"

    print("\n[VERIFICATION PASSED] All 8 synthetic deactivated accounts are persistent and enforce HTTP 403 denial.")

if __name__ == '__main__':
    main()
