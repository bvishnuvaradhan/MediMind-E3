import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ.get("MONGODB_URI"))
appts = client["medimind_appointment"]["appointments"]

nov_appts = list(appts.find({
    "created_at": {"$gte": datetime(2026, 11, 1, 0, 0, 0, tzinfo=timezone.utc)}
}))

print(f"Total appointments with created_at >= Nov 1, 2026: {len(nov_appts)}")
for a in nov_appts[:10]:
    print(f"ID: {a['_id']} | Created: {a.get('created_at')} | ApptDate: {a.get('appointment_date')} | Status: {a.get('status')}")
