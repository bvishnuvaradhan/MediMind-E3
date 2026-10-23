import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ["MONGODB_URI"])

# 1. Check Walk-in appointments
appt_coll = client["medimind_appointment"].appointments
walkins_count = appt_coll.count_documents({"$or": [{"isWalkIn": True}, {"is_walk_in": True}, {"is_walkin": True}]})
print(f"Total appointments: {appt_coll.count_documents({})}")
print(f"Walk-in count (isWalkIn=True): {walkins_count}")

# 2. Check doctors in medimind_doctor vs medimind_auth
doc_coll = client["medimind_doctor"].doctors
auth_coll = client["medimind_auth"].users

all_doc_profiles = list(doc_coll.find())
active_doc_profiles = [d for d in all_doc_profiles if str(d.get("status")).upper() == "ACTIVE" and not d.get("is_demonstration") and not d.get("isDemonstration")]
demo_doc_profiles = [d for d in all_doc_profiles if d.get("is_demonstration") or d.get("isDemonstration") or str(d.get("status")).upper() == "INACTIVE"]

print(f"\nDoctor profiles in medimind_doctor:")
print(f"  Total: {len(all_doc_profiles)}")
print(f"  Active Operational: {len(active_doc_profiles)}")
print(f"  Demonstration/Inactive: {len(demo_doc_profiles)}")

# Emails of active doctor profiles
doc_profile_emails = set(d.get("email").lower().strip() for d in active_doc_profiles if d.get("email"))

# Auth users with role DOCTOR
auth_doctors = list(auth_coll.find({"role": "DOCTOR"}))
active_auth_doctors = [u for u in auth_doctors if str(u.get("status")).upper() == "ACTIVE"]
inactive_auth_doctors = [u for u in auth_doctors if str(u.get("status")).upper() != "ACTIVE"]

print(f"\nAuth accounts with role DOCTOR:")
print(f"  Total: {len(auth_doctors)}")
print(f"  Active: {len(active_auth_doctors)}")
print(f"  Inactive: {len(inactive_auth_doctors)}")

auth_doc_emails = set(u.get("email").lower().strip() for u in active_auth_doctors if u.get("email"))

# Compare profile emails vs auth emails
diff_auth_not_profile = auth_doc_emails - doc_profile_emails
diff_profile_not_auth = doc_profile_emails - auth_doc_emails

print(f"\nAuth DOCTOR emails not in active doctor profiles ({len(diff_auth_not_profile)}):")
for e in sorted(diff_auth_not_profile):
    print("  ", e)

print(f"Active doctor profile emails not in active auth ({len(diff_profile_not_auth)}):")
for e in sorted(diff_profile_not_auth):
    print("  ", e)

# 3. AI prediction types breakdown
pred_coll = client["medimind_ai"].predictions
preds_by_type = list(pred_coll.aggregate([
    {"$group": {"_id": "$prediction_type", "count": {"$sum": 1}}}
]))
print(f"\nAI Predictions by prediction_type:")
for p in preds_by_type:
    print(f"  {p['_id']}: {p['count']}")
