import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv("backend/.env")
uri = os.environ.get("MONGODB_URI")
client = MongoClient(uri, serverSelectionTimeoutMS=5000)

hosp_id_str = "6ac85a18074c2bc731a76387"
hosp_id_oid = ObjectId(hosp_id_str)

print("=== ATLAS SEARCH FOR SUNRISE ENCOUNTERS ===")
appts_coll = client["medimind_appointment"]["appointments"]

q = {
    "$or": [
        {"hospital_id": hosp_id_str},
        {"hospital_id": hosp_id_oid},
        {"hospitalId": hosp_id_str},
        {"hospitalId": hosp_id_oid},
        {"hospital_name": {"$regex": "Sunrise", "$options": "i"}},
    ]
}

appts = list(appts_coll.find(q))
print(f"Total Appointments referencing Sunrise in Atlas: {len(appts)}")
for a in appts:
    print(f"  Appt ID: {a.get('_id')} | Status: {a.get('status')} | Doctor: {a.get('doctor_id')} | Created: {a.get('created_at')}")

preds_coll = client["medimind_ai"]["predictions"]
preds = list(preds_coll.find({
    "$or": [
        {"hospital_id": hosp_id_str},
        {"hospital_id": hosp_id_oid},
        {"hospitalId": hosp_id_str},
        {"hospitalId": hosp_id_oid},
    ]
}))
print(f"Total AI Predictions referencing Sunrise in Atlas: {len(preds)}")

consults_coll = client["medimind_records"]["consultations"]
consults = list(consults_coll.find({
    "$or": [
        {"hospital_id": hosp_id_str},
        {"hospital_id": hosp_id_oid},
        {"hospitalId": hosp_id_str},
        {"hospitalId": hosp_id_oid},
    ]
}))
print(f"Total Consultations referencing Sunrise in Atlas: {len(consults)}")

print("\n=== LOCAL MONGODB SEARCH FOR SUNRISE ENCOUNTERS ===")
try:
    local_client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
    local_appts = list(local_client["medimind_appointment"]["appointments"].find(q))
    print(f"Total Appointments referencing Sunrise in Local: {len(local_appts)}")
    for a in local_appts:
        print(f"  Local Appt ID: {a.get('_id')} | Status: {a.get('status')} | Created: {a.get('created_at')}")
except Exception as e:
    print("Local check error:", e)
