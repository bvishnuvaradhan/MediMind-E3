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

const novAppts = await apptDb.collection('appointments').find({
  appointment_date: { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-30T23:59:59Z') }
}).toArray();

const apptCreatedAtMonth = {};
for (const a of novAppts) {
  let m = 'null';
  if (a.created_at) {
    if (a.created_at instanceof Date) m = a.created_at.toISOString().slice(0, 7);
    else m = a.created_at.slice(0, 7);
  }
  apptCreatedAtMonth[m] = (apptCreatedAtMonth[m] || 0) + 1;
}

console.log('November appointments by Appointment.created_at:', apptCreatedAtMonth);

await mongoose.disconnect();
