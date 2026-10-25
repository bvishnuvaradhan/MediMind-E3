import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ.get("MONGODB_URI"))
appts = client["medimind_appointment"]["appointments"]
consults = client["medimind_records"]["consultations"]

cutoff = datetime(2026, 10, 25, 0, 0, 0, tzinfo=timezone.utc)
past_open = list(appts.find({
    "appointment_date": {"$lt": cutoff},
    "status": {"$in": ["BOOKED", "CONFIRMED", "PENDING"]}
}))

consulted_appts = {str(c["appointment_id"]) for c in consults.find({}, {"appointment_id": 1})}

has_consult = 0
no_consult = 0
for a in past_open:
    if str(a["_id"]) in consulted_appts:
        has_consult += 1
    else:
        no_consult += 1

print(f"Past open appointments with consultation: {has_consult}")
print(f"Past open appointments with NO consultation: {no_consult}")
