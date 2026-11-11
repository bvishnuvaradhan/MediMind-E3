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

// Search for appointments with rescheduling_history or status RESCHEDULED
const resched = await apptDb.collection('appointments').find({
  $or: [
    { status: 'RESCHEDULED' },
    { 'rescheduling_history.0': { $exists: true } }
  ]
}).toArray();

console.log('Total RESCHEDULED / with history:', resched.length);

const hospCounts = {};
for (const a of resched) {
  const hid = a.hospital_id.toString();
  hospCounts[hid] = (hospCounts[hid] || 0) + 1;
}
console.log('Rescheduled by hospital:', hospCounts);

// Check if any appointment was rescheduled TO November
const toNov = resched.filter(a => {
  return a.rescheduling_history?.some(h => {
    const d = new Date(h.new_appointment_date);
    return d.getMonth() === 10; // Nov (0-indexed)
  });
});
console.log('Rescheduled TO November:', toNov.length);

// What about the 18 NO_SHOW appointments in Phase 13?
const noShows = await apptDb.collection('appointments').find({ status: 'NO_SHOW' }).toArray();
console.log('Total NO_SHOW appointments:', noShows.length);
console.log('NO_SHOW dates:', noShows.map(a => ({
  id: a._id,
  hosp: a.hospital_id,
  date: a.appointment_date,
  reason: a.reason
})));

await mongoose.disconnect();
