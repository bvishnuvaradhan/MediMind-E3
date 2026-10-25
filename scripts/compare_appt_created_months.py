import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")
client = MongoClient(os.environ.get("MONGODB_URI"))
appts = client["medimind_appointment"]["appointments"]

pipeline = [
    {
        "$group": {
            "_id": {
                "appt_month": {"$month": "$appointment_date"},
                "created_month": {"$month": "$created_at"},
            },
            "count": {"$sum": 1}
        }
    },
    {"$sort": {"_id.appt_month": 1, "_id.created_month": 1}}
]

for row in appts.aggregate(pipeline):
    am = row['_id']['appt_month']
    cm = row['_id']['created_month']
    print(f"Appt Month: {am:02d} | Created Month: {cm:02d} -> {row['count']} appointments")
