import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ.get("MONGODB_URI"))
appts = client["medimind_appointment"]["appointments"]

d_start = datetime(2026, 10, 25, 0, 0, 0, tzinfo=timezone.utc)
d_end = datetime(2026, 11, 4, 23, 59, 59, tzinfo=timezone.utc)

appts_oct25_nov4 = list(appts.find({
    "appointment_date": {"$gte": d_start, "$lte": d_end}
}))

print(f"Appointments scheduled between Oct 25 and Nov 4, 2026: {len(appts_oct25_nov4)}")
st_counts = {}
for a in appts_oct25_nov4:
    st = a.get("status")
    st_counts[st] = st_counts.get(st, 0) + 1
print("Status breakdown Oct 25 - Nov 4:", st_counts)
