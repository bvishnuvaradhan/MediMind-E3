"""
Reconciliation & Governance Resolution for Sunrise Pending Encounter (6adb58ad69a4c190e1a40d0f).
Preserves full record provenance and updates status to CANCELLED with explicit audit justification.
"""

import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv("backend/.env")
uri = os.environ.get("MONGODB_URI")
client = MongoClient(uri, serverSelectionTimeoutMS=5000)

appts_coll = client["medimind_appointment"]["appointments"]
target_id = ObjectId("6adb58ad69a4c190e1a40d0f")

doc = appts_coll.find_one({"_id": target_id})
if not doc:
    print(f"Record {target_id} not found.")
    exit(0)

print("--- BEFORE RECONCILIATION ---")
print(f"ID: {doc.get('_id')}")
print(f"Hospital ID: {doc.get('hospital_id')}")
print(f"Status: {doc.get('status')}")
print(f"Created: {doc.get('created_at')}")

update_payload = {
    "$set": {
        "status": "CANCELLED",
        "cancellation_reason": "Automated governance: Sunrise Institute (MM-BLR-04) is pending accreditation. Encounter cancelled in adherence to hospital eligibility boundary.",
        "cancelled_at": datetime.now(timezone.utc),
        "cancelled_by": "GOVERNANCE_AUDIT",
        "updated_at": datetime.now(timezone.utc),
    }
}

res = appts_coll.update_one({"_id": target_id}, update_payload)
print(f"\nUpdate result: Matched {res.matched_count}, Modified {res.modified_count}")

updated_doc = appts_coll.find_one({"_id": target_id})
print("\n--- AFTER RECONCILIATION ---")
print(f"ID: {updated_doc.get('_id')}")
print(f"Status: {updated_doc.get('status')}")
print(f"Cancellation Reason: {updated_doc.get('cancellation_reason')}")
print(f"Cancelled By: {updated_doc.get('cancelled_by')}")
print(f"Cancelled At: {updated_doc.get('cancelled_at')}")
