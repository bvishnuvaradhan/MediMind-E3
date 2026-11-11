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

const novAppts = await apptDb.collection('appointments').find({
  appointment_date: { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-30T23:59:59Z') }
}).toArray();

const predIds = novAppts.map(a => a.ai_prediction_id).filter(Boolean);
const samplePreds = await aiDb.collection('predictions').find({ prediction_id: { $in: predIds } }).limit(10).toArray();

console.log('Sample November predictions:');
console.log(samplePreds.map(p => ({
  id: p.prediction_id,
  created_at: p.created_at,
  created_at_type: typeof p.created_at,
  model: p.model_name
})));

await mongoose.disconnect();
