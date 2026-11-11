import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';
import fs from 'fs';

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

const manifest = [];
for (const a of allAppts) {
  if (a.appointment_type === 'WALK_IN') continue;
  let hasPred = false;
  if (a.ai_prediction_id && predById.has(a.ai_prediction_id.toString())) hasPred = true;
  else if (predByApptId.has(a._id.toString())) hasPred = true;

  if (!hasPred) {
    const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : (a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '');
    manifest.push({
      appointment_id: a._id.toString(),
      hospital_id: a.hospital_id.toString(),
      hospital_name: hospMap[a.hospital_id.toString()],
      intake_month: cd.slice(0, 7),
      created_at: a.created_at,
      appointment_date: a.appointment_date,
      status: a.status,
      appointment_type: a.appointment_type || 'BOOKED',
      patient_symptoms: a.reason || 'None provided',
      existing_prediction_id: a.ai_prediction_id || null,
      discrepancy_reason: 'Legacy intake booking created without automated clinical AI inference invocation'
    });
  }
}

console.log('Total Missing AI Manifest Items:', manifest.length);

fs.writeFileSync('./backend/scripts/phase16_missing_ai_manifest.json', JSON.stringify(manifest, null, 2), 'utf8');
console.log('Manifest written to backend/scripts/phase16_missing_ai_manifest.json');

await mongoose.disconnect();
