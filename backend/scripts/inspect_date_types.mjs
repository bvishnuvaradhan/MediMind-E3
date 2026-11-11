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

const novStart = new Date('2026-11-01T00:00:00.000Z');
const novEnd = new Date('2026-12-01T00:00:00.000Z');

const q1 = await apptDb.collection('appointments').countDocuments({
  appointment_date: { $gte: novStart, $lt: novEnd }
});
console.log('q1 (appointment_date $gte 2026-11-01, $lt 2026-12-01):', q1);

// What are the date types in appointments?
const sample = await apptDb.collection('appointments').find({
  appointment_date: { $gte: novStart, $lt: novEnd }
}).limit(5).toArray();

console.log('Sample dates:', sample.map(s => ({
  id: s._id,
  hosp: s.hospital_id,
  date: s.appointment_date,
  dateType: typeof s.appointment_date,
  isDate: s.appointment_date instanceof Date,
  reason: s.reason,
  ai_id: s.ai_prediction_id
})));

// How many have string date vs Date date?
const stringDates = await apptDb.collection('appointments').countDocuments({
  appointment_date: { $type: 'string' }
});
const dateDates = await apptDb.collection('appointments').countDocuments({
  appointment_date: { $type: 'date' }
});
console.log('stringDates:', stringDates, 'dateDates:', dateDates);

await mongoose.disconnect();
