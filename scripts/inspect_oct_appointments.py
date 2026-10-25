import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ.get("MONGODB_URI"))
appts = client["medimind_appointment"]["appointments"]

# Let's inspect appointments whose appointment_date is in October
oct_appts = list(appts.find({
    "appointment_date": {"$gte": "2026-10-01", "$lt": "2026-11-01"}
}))
print(f"Total appointments scheduled in October: {len(oct_appts)}")
# How were they created?
created_dist = {}
for a in oct_appts:
    cm = str(a.get("created_at"))[:7]
    created_dist[cm] = created_dist.get(cm, 0) + 1
print("October appointments created in months:", created_dist)

# What about all appointments by appointment_date?
appt_dist = {}
for a in appts.find():
    ad = str(a.get("appointment_date"))[:7]
    appt_dist[ad] = appt_dist.get(ad, 0) + 1
print("All appointments by appointment_date month:", sorted(appt_dist.items()))
