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
const aiDb = mongoose.connection.useDb('medimind_ai');

const novAppts = await apptDb.collection('appointments').find({
  appointment_date: { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-30T23:59:59Z') }
}).toArray();

const predIds = novAppts.map(a => a.ai_prediction_id).filter(Boolean);
console.log(`Found ${predIds.length} ai_prediction_ids in November appointments.`);

const matchedPreds = await aiDb.collection('predictions').find({
  prediction_id: { $in: predIds }
}).toArray();

console.log(`Matching predictions found in medimind_ai.predictions: ${matchedPreds.length}`);

if (matchedPreds.length > 0) {
  console.log('Sample matched prediction:', {
    prediction_id: matchedPreds[0].prediction_id,
    family_member_id: matchedPreds[0].family_member_id,
    appointment_id: matchedPreds[0].appointment_id,
    model_name: matchedPreds[0].model_name,
    model_version: matchedPreds[0].model_version,
    created_at: matchedPreds[0].created_at,
    result: matchedPreds[0].result
  });
}

// Check where 348 came from:
// Let's check intake month (created_at) vs scheduled month (appointment_date)
const createdInNov = await apptDb.collection('appointments').find({
  created_at: { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-30T23:59:59Z') }
}).toArray();
console.log(`Appointments created in November: ${createdInNov.length}`);

// Let's check appointments created in October with appointment_date in November or overall
const createdInOct = await apptDb.collection('appointments').find({
  created_at: { $gte: new Date('2026-10-01T00:00:00Z'), $lte: new Date('2026-10-31T23:59:59Z') }
}).toArray();
console.log(`Appointments created in October: ${createdInOct.length}`);

const createdInOctScheduledNov = createdInOct.filter(a => a.appointment_date >= new Date('2026-11-01T00:00:00Z') && a.appointment_date <= new Date('2026-11-30T23:59:59Z'));
console.log(`Created in Oct & scheduled in Nov: ${createdInOctScheduledNov.length}`);

await mongoose.disconnect();
