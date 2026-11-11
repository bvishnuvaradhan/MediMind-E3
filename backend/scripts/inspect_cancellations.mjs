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

const cancelledAppts = await apptDb.collection('appointments').find({
  status: { $in: ['CANCELLED', 'CANCELED'] }
}).toArray();

console.log(`Total CANCELLED appointments: ${cancelledAppts.length}`);

const cancelledWithDate = cancelledAppts.filter(a => a.cancelled_at);
console.log(`Cancelled with cancelled_at field: ${cancelledWithDate.length}`);
console.log(`Cancelled without cancelled_at field: ${cancelledAppts.length - cancelledWithDate.length}`);

// Sample cancelled appointments
console.log('\nSample cancelled appointments:');
console.log(cancelledAppts.slice(0, 5).map(a => ({
  id: a._id,
  hospital_id: a.hospital_id,
  appointment_date: a.appointment_date,
  created_at: a.created_at,
  cancelled_at: a.cancelled_at,
  cancellation_reason: a.cancellation_reason,
  status: a.status
})));

// Distribution of appointment_date on cancelled appointments
const apptMonthDist = {};
const cancelMonthDist = {};
const createdMonthDist = {};

for (const a of cancelledAppts) {
  const apptM = a.appointment_date ? a.appointment_date.toISOString().slice(0, 7) : 'null';
  apptMonthDist[apptM] = (apptMonthDist[apptM] || 0) + 1;

  if (a.cancelled_at) {
    const cM = (a.cancelled_at instanceof Date ? a.cancelled_at : new Date(a.cancelled_at)).toISOString().slice(0, 7);
    cancelMonthDist[cM] = (cancelMonthDist[cM] || 0) + 1;
  }

  if (a.created_at) {
    const crM = (a.created_at instanceof Date ? a.created_at : new Date(a.created_at)).toISOString().slice(0, 7);
    createdMonthDist[crM] = (createdMonthDist[crM] || 0) + 1;
  }
}

console.log('\nCancelled appointments by appointment_date month:', apptMonthDist);
console.log('Cancelled appointments by cancelled_at month:', cancelMonthDist);
console.log('Cancelled appointments by created_at month:', createdMonthDist);

await mongoose.disconnect();
