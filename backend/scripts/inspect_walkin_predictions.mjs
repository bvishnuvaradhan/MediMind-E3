import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const apptCol = client.db('medimind_appointment').collection('appointments');
const predCol = client.db('medimind_ai').collection('predictions');
const hospCol = client.db('medimind_hospital').collection('hospitals');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const hospMap = Object.fromEntries(activeHosps.map(h => [h._id.toString(), h.name]));

const allPreds = await predCol.find({ appointment_id: { $ne: null } }).toArray();
const apptObjIds = allPreds
  .map(p => p.appointment_id)
  .filter(id => mongoose.Types.ObjectId.isValid(id))
  .map(id => new mongoose.Types.ObjectId(id));

const walkInApptsWithPreds = await apptCol.find({
  _id: { $in: apptObjIds },
  appointment_type: 'WALK_IN'
}).toArray();

console.log('Walk-ins with AI predictions:', walkInApptsWithPreds.length);

const byHospMonth = {};
for (const a of walkInApptsWithPreds) {
  const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : (a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '');
  const m = cd.slice(0, 7);
  const key = `${hospMap[a.hospital_id.toString()] || a.hospital_id} | ${m}`;
  byHospMonth[key] = (byHospMonth[key] || 0) + 1;
}

console.log('Walk-ins with predictions by Hospital and Month:');
console.table(byHospMonth);

await mongoose.disconnect();
