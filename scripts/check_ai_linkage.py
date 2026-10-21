import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017")
appt_db = client["medimind_appointment"]
ai_db = client["medimind_ai"]

appts_with_ai = list(appt_db.appointments.find({"ai_prediction_id": {"$ne": None}}))
print(f"Appointments with ai_prediction_id: {len(appts_with_ai)}")

preds = list(ai_db.predictions.find({}))
print(f"Total predictions: {len(preds)}")
preds_with_appt = [p for p in preds if p.get("appointment_id")]
print(f"Predictions with appointment_id: {len(preds_with_appt)}")

# Check if all prediction appointment_ids exist in appointments collection
appt_ids_in_db = set(str(a["_id"]) for a in appt_db.appointments.find({}, {"_id": 1}))
pred_appt_ids = set(str(p["appointment_id"]) for p in preds_with_appt)

matched = pred_appt_ids.intersection(appt_ids_in_db)
unmatched = pred_appt_ids - appt_ids_in_db
print(f"Prediction appointment_ids matching real appointments: {len(matched)}")
print(f"Unmatched prediction appointment_ids: {len(unmatched)}")

# Check reverse: do all appts_with_ai have corresponding predictions in ai_db?
pred_ids_in_db = set(str(p["prediction_id"]) for p in preds)
pred_object_ids = set(str(p["_id"]) for p in preds)
all_known_pred_ids = pred_ids_in_db.union(pred_object_ids)

appts_ai_refs = [str(a["ai_prediction_id"]) for a in appts_with_ai]
matched_ai_refs = [ref for ref in appts_ai_refs if ref in all_known_pred_ids]
print(f"Appointments whose ai_prediction_id matches real prediction: {len(matched_ai_refs)} / {len(appts_ai_refs)}")
