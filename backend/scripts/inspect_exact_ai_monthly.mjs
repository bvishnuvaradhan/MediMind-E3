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
const aiDb = mongoose.connection.useDb('medimind_ai');
const apptDb = mongoose.connection.useDb('medimind_appointment');
const hospDb = mongoose.connection.useDb('medimind_hospital');

const hosps = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
const hospMap = Object.fromEntries(hosps.map(h => [h._id.toString(), h.name]));
const activeIds = hosps.map(h => h._id);

const appts = await apptDb.collection('appointments').find({
  hospital_id: { $in: activeIds },
  ai_prediction_id: { $type: 'string', $ne: '' }
}).toArray();

console.log(`Appointments with ai_prediction_id: ${appts.length}`);

// Map apptId -> hospital_id, and predId -> hospital_id
const predIdToHosp = new Map();
for (const a of appts) {
  predIdToHosp.set(a.ai_prediction_id, a.hospital_id.toString());
}

const preds = await aiDb.collection('predictions').find({
  prediction_id: { $in: Array.from(predIdToHosp.keys()) }
}).toArray();

console.log(`Matching predictions found: ${preds.length}`);

const monthlyByHosp = {};
for (const p of preds) {
  const hid = p.hospital_id ? p.hospital_id.toString() : predIdToHosp.get(p.prediction_id);
  if (!hid || !hospMap[hid]) continue;

  let m = 'null';
  if (p.created_at) {
    if (typeof p.created_at === 'string') m = p.created_at.slice(0, 7);
    else if (p.created_at instanceof Date) m = p.created_at.toISOString().slice(0, 7);
  }

  const key = `${hospMap[hid]}|${m}`;
  monthlyByHosp[key] = (monthlyByHosp[key] || 0) + 1;
}

console.log('\nAI Runs by Execution Month and Hospital:');
const rows = Object.entries(monthlyByHosp).map(([km, count]) => {
  const [hosp, month] = km.split('|');
  return { hospital: hosp, month, count };
}).sort((a, b) => a.month.localeCompare(b.month) || a.hospital.localeCompare(b.hospital));

console.table(rows);

await mongoose.disconnect();
