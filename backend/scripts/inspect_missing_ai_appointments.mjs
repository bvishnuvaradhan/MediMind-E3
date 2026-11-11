import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const hospCol = client.db('medimind_hospital').collection('hospitals');
const apptCol = client.db('medimind_appointment').collection('appointments');
const predCol = client.db('medimind_ai').collection('predictions');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const hospMap = Object.fromEntries(activeHosps.map(h => [h._id.toString(), h.name]));

const allAppts = await apptCol.find({ hospital_id: { $in: activeHosps.map(h => h._id) } }).toArray();
const allPreds = await predCol.find({}).toArray();

const predByApptId = new Map();
const predById = new Map();
for (const p of allPreds) {
  predById.set(p._id.toString(), p);
  if (p.prediction_id) predById.set(p.prediction_id, p);
  if (p.appointment_id) {
    predByApptId.set(p.appointment_id.toString(), p);
  }
}

const missingAppts = [];
for (const a of allAppts) {
  if (a.appointment_type === 'WALK_IN') continue;
  let hasPred = false;
  if (a.ai_prediction_id && predById.has(a.ai_prediction_id.toString())) hasPred = true;
  else if (predByApptId.has(a._id.toString())) hasPred = true;

  if (!hasPred) {
    const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : (a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '');
    missingAppts.push({
      _id: a._id.toString(),
      hospital: hospMap[a.hospital_id.toString()],
      hospitalId: a.hospital_id.toString(),
      created_month: cd.slice(0, 7),
      appointment_date: a.appointment_date,
      status: a.status,
      appointment_type: a.appointment_type,
      reason: a.reason,
      ai_prediction_id: a.ai_prediction_id,
      notes: a.notes
    });
  }
}

console.log('Total Appointments without valid AI Prediction:', missingAppts.length);

// Breakdown by hospital and creation month
const breakdown = {};
for (const a of missingAppts) {
  const key = `${a.hospital} | ${a.created_month}`;
  breakdown[key] = (breakdown[key] || 0) + 1;
}
console.log('\nMissing AI Breakdown by Hospital and Month:');
console.table(breakdown);

// Breakdown by status
const statusBreakdown = {};
for (const a of missingAppts) {
  statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
}
console.log('\nMissing AI Breakdown by Status:');
console.table(statusBreakdown);

// Sample reasons/symptoms
console.log('\nSample Missing Appointments:');
console.log(missingAppts.slice(0, 5).map(a => ({
  id: a._id,
  hosp: a.hospital.slice(0, 15),
  month: a.created_month,
  status: a.status,
  reason: a.reason,
  ai_prediction_id: a.ai_prediction_id
})));

await mongoose.disconnect();
