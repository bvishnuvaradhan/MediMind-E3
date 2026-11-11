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

const months = ['2026-08', '2026-09', '2026-10', '2026-11'];

for (const h of activeHosps) {
  const hid = h._id.toString();
  const hAppts = allAppts.filter(a => a.hospital_id.toString() === hid);

  console.log(`\n======================================================`);
  console.log(`HOSPITAL: ${h.name} (${hid})`);
  console.log(`======================================================`);

  const rows = [];
  for (const m of months) {
    // 1. Booking Intake (created_at)
    const intakeAppts = hAppts.filter(a => {
      const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : (a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '');
      return cd.slice(0, 7) === m;
    });
    const intakeVolume = intakeAppts.length;

    // 2. AI Triaged Scans attributed to intake cohort
    let intakeAI = 0;
    for (const a of intakeAppts) {
      if (a.appointment_type === 'WALK_IN') continue;
      if ((a.ai_prediction_id && predById.has(a.ai_prediction_id.toString())) || predByApptId.has(a._id.toString())) {
        intakeAI++;
      }
    }

    // 3. Completed Consultations (service date appointment_date)
    const completedAppts = hAppts.filter(a => {
      const ad = a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '';
      return ad.slice(0, 7) === m && a.status === 'COMPLETED';
    });
    const completedCount = completedAppts.length;

    rows.push({
      Period: m,
      'Booking Intake (created_at)': intakeVolume,
      'Cohort AI Scans': intakeAI,
      'Completed Consultations': completedCount
    });
  }

  console.table(rows);
}

// Network Total
console.log(`\n======================================================`);
console.log(`NETWORK-WIDE TOTALS`);
console.log(`======================================================`);
const netRows = [];
for (const m of months) {
  const intakeAppts = allAppts.filter(a => {
    const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : (a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '');
    return cd.slice(0, 7) === m;
  });
  const intakeVolume = intakeAppts.length;

  let intakeAI = 0;
  for (const a of intakeAppts) {
    if (a.appointment_type === 'WALK_IN') continue;
    if ((a.ai_prediction_id && predById.has(a.ai_prediction_id.toString())) || predByApptId.has(a._id.toString())) {
      intakeAI++;
    }
  }

  const completedAppts = allAppts.filter(a => {
    const ad = a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '';
    return ad.slice(0, 7) === m && a.status === 'COMPLETED';
  });
  const completedCount = completedAppts.length;

  netRows.push({
    Period: m,
    'Booking Intake (created_at)': intakeVolume,
    'Cohort AI Scans': intakeAI,
    'Completed Consultations': completedCount
  });
}
console.table(netRows);

await mongoose.disconnect();
