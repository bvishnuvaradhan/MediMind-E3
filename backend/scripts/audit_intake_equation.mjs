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

// Get all appointments in active hospitals
const allAppts = await apptCol.find({ hospital_id: { $in: activeHosps.map(h => h._id) } }).toArray();
const allPreds = await predCol.find({}).toArray();

// Map predictions by appointment_id and prediction_id
const predByApptId = new Map();
const predById = new Map();
for (const p of allPreds) {
  predById.set(p._id.toString(), p);
  if (p.prediction_id) predById.set(p.prediction_id, p);
  if (p.appointment_id) {
    predByApptId.set(p.appointment_id.toString(), p);
  }
}

console.log('Total Appointments:', allAppts.length);
console.log('Total Predictions:', allPreds.length);

const results = [];

for (const h of activeHosps) {
  const hid = h._id.toString();
  const hAppts = allAppts.filter(a => a.hospital_id.toString() === hid);

  // Group appointments by creation month (using created_at, fallback appointment_date)
  const byMonth = {};
  for (const a of hAppts) {
    const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : (a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '');
    const m = cd.slice(0, 7);
    if (!m) continue;
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(a);
  }

  const sortedMonths = Object.keys(byMonth).sort();
  for (const m of sortedMonths) {
    const apptsInMonth = byMonth[m];
    const totalBookings = apptsInMonth.length;
    const walkIns = apptsInMonth.filter(a => a.appointment_type === 'WALK_IN').length;
    const onlineBookings = totalBookings - walkIns;

    // Check how many appointments have an attributable valid prediction
    let linkedCount = 0;
    let missingPreds = [];

    for (const a of apptsInMonth) {
      if (a.appointment_type === 'WALK_IN') continue; // walk-ins bypass AI
      
      let hasPred = false;
      if (a.ai_prediction_id && predById.has(a.ai_prediction_id.toString())) {
        hasPred = true;
      } else if (predByApptId.has(a._id.toString())) {
        hasPred = true;
      }

      if (hasPred) {
        linkedCount++;
      } else {
        missingPreds.push({
          apptId: a._id.toString(),
          reason: a.reason || a.notes || '',
          status: a.status,
          date: a.appointment_date
        });
      }
    }

    const difference = onlineBookings - linkedCount;
    results.push({
      hospital: h.name,
      month: m,
      totalBookings,
      walkIns,
      expectedAI: onlineBookings,
      actualLinkedAI: linkedCount,
      difference,
      matches: difference === 0 ? 'YES' : 'NO',
      sampleMissing: missingPreds.length > 0 ? missingPreds[0] : null
    });
  }
}

console.table(results.map(r => ({
  hospital: r.hospital.replace(' Hospital', '').replace(' Medical Centre', ''),
  month: r.month,
  totalBookings: r.totalBookings,
  walkIns: r.walkIns,
  expectedAI: r.expectedAI,
  actualLinkedAI: r.actualLinkedAI,
  difference: r.difference,
  matches: r.matches
})));

await mongoose.disconnect();
