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

// Check predictions created_at distribution
const allPreds = await aiDb.collection('predictions').find({}).toArray();
console.log(`Total predictions in medimind_ai: ${allPreds.length}`);

const predMonthDist = {};
for (const p of allPreds) {
  let m = 'null';
  if (p.created_at) {
    if (typeof p.created_at === 'string') {
      m = p.created_at.slice(0, 7);
    } else if (p.created_at instanceof Date) {
      m = p.created_at.toISOString().slice(0, 7);
    }
  }
  predMonthDist[m] = (predMonthDist[m] || 0) + 1;
}
console.log('AI Predictions by created_at month:', predMonthDist);

// Now check the predictions linked to November appointments
const novAppts = await apptDb.collection('appointments').find({
  appointment_date: { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-30T23:59:59Z') }
}).toArray();

const novPredIds = novAppts.map(a => a.ai_prediction_id).filter(Boolean);
const novPreds = await aiDb.collection('predictions').find({ prediction_id: { $in: novPredIds } }).toArray();

const novPredMonthDist = {};
for (const p of novPreds) {
  let m = 'null';
  if (p.created_at) {
    if (typeof p.created_at === 'string') {
      m = p.created_at.slice(0, 7);
    } else if (p.created_at instanceof Date) {
      m = p.created_at.toISOString().slice(0, 7);
    }
  }
  novPredMonthDist[m] = (novPredMonthDist[m] || 0) + 1;
}
console.log('November-linked predictions by actual created_at month:', novPredMonthDist);

await mongoose.disconnect();
