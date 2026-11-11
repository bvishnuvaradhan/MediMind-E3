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

const reschedAppts = await apptDb.collection('appointments').find({
  $or: [
    { status: 'RESCHEDULED' },
    { 'rescheduling_history.0': { $exists: true } }
  ]
}).toArray();

console.log(`Total RESCHEDULED or with history: ${reschedAppts.length}`);

// Sample
console.log('\nSample rescheduled records:');
console.log(reschedAppts.slice(0, 3).map(a => ({
  id: a._id,
  hospital_id: a.hospital_id,
  appointment_date: a.appointment_date,
  created_at: a.created_at,
  status: a.status,
  history: a.rescheduling_history
})));

// Months of appointment_date
const apptDateMonths = {};
// Months of created_at
const createdAtMonths = {};
// Months of rescheduled_at
const reschedAtMonths = {};

for (const a of reschedAppts) {
  const ad = a.appointment_date ? a.appointment_date.toISOString().slice(0, 7) : 'null';
  apptDateMonths[ad] = (apptDateMonths[ad] || 0) + 1;

  const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at : new Date(a.created_at)).toISOString().slice(0, 7) : 'null';
  createdAtMonths[cd] = (createdAtMonths[cd] || 0) + 1;

  if (a.rescheduling_history && a.rescheduling_history.length > 0) {
    for (const h of a.rescheduling_history) {
      if (h.rescheduled_at) {
        const rd = (h.rescheduled_at instanceof Date ? h.rescheduled_at : new Date(h.rescheduled_at)).toISOString().slice(0, 7);
        reschedAtMonths[rd] = (reschedAtMonths[rd] || 0) + 1;
      }
    }
  }
}

console.log('\nRescheduled by appointment_date month:', apptDateMonths);
console.log('Rescheduled by created_at month:', createdAtMonths);
console.log('Rescheduled by event-time rescheduled_at month:', reschedAtMonths);

await mongoose.disconnect();
