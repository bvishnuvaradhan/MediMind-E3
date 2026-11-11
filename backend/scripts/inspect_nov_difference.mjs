import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';

const envContent = fs.readFileSync('./backend/.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const apptDb = mongoose.connection.useDb('medimind_appointment');
const hospDb = mongoose.connection.useDb('medimind_hospital');

const activeHospitals = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
const activeHospIds = activeHospitals.map(h => h._id);

// Check all appointments created or scheduled in Oct/Nov
const resched = await apptDb.collection('appointments').find({
  hospital_id: { $in: activeHospIds },
  $or: [
    { appointment_date: { $gte: new Date('2026-10-25T00:00:00Z'), $lte: new Date('2026-12-05T00:00:00Z') } },
    { 'rescheduling_history.new_appointment_date': { $gte: new Date('2026-11-01T00:00:00Z') } }
  ]
}).toArray();

console.log('Found appointments in Oct 25 - Dec 5 window:', resched.length);

// Check if any appointments have appointment_date in November in raw DB
const allNov = await apptDb.collection('appointments').find({
  appointment_date: { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-30T23:59:59Z') }
}).toArray();

console.log('Total November appointments across ALL facilities (active & inactive):', allNov.length);

const byHospAll = {};
for (const a of allNov) {
  const hid = a.hospital_id ? a.hospital_id.toString() : 'UNKNOWN';
  byHospAll[hid] = (byHospAll[hid] || 0) + 1;
}
console.log('All November by hospital:', byHospAll);

// Now look at existing AI prediction IDs in those 330 appointments!
const withPred = allNov.filter(a => activeHospIds.some(h => h.toString() === a.hospital_id.toString()) && a.ai_prediction_id);
console.log('Active November appointments with ai_prediction_id:', withPred.length);
if (withPred.length > 0) {
  console.log('Sample ai_prediction_id values:', withPred.slice(0, 5).map(a => ({
    id: a._id,
    pred_id: a.ai_prediction_id,
    reason: a.reason
  })));
}

await mongoose.disconnect();
