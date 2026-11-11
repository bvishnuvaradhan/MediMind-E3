import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'medimind_appointment' });
const apptCol = mongoose.connection.useDb('medimind_appointment').collection('appointments');
const ids = [
  '6ac85a20074c2bc731a764b5',
  '6ac85a22074c2bc731a76518',
  '6ac85a22074c2bc731a76519',
  '6ac85a23074c2bc731a76555',
  '6ac85a23074c2bc731a7655b',
  '6ac85a23074c2bc731a7655d'
].map(id => new mongoose.Types.ObjectId(id));

const docs = await apptCol.find({ _id: { $in: ids } }).toArray();
for (const d of docs) {
  console.log(`Appointment ID: ${d._id}`);
  console.log(`  Date: ${d.appointment_date?.toISOString().slice(0, 10)}, Time: ${d.start_time}-${d.end_time}`);
  console.log(`  Doctor: ${d.doctor_id}, Dept: ${d.department_id}, Patient: ${d.family_member_id}`);
  console.log(`  Status: ${d.status}, Type: ${d.appointment_type}`);
  console.log(`  Reason: ${d.reason}`);
  console.log(`  AI Prediction ID: ${d.ai_prediction_id}`);
  console.log(`  Updated At: ${d.updated_at}, Created At: ${d.created_at}`);
  console.log('---');
}

await mongoose.disconnect();
