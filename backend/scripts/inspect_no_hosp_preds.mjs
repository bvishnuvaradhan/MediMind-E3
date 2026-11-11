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

const noHospPreds = await aiDb.collection('predictions').find({
  $or: [{ hospital_id: null }, { hospital_id: { $exists: false } }]
}).toArray();

console.log('Predictions without hospital_id:', noHospPreds.length);
const withAppt = noHospPreds.filter(p => p.appointment_id);
console.log('Predictions with appointment_id:', withAppt.length);
const withoutAppt = noHospPreds.filter(p => !p.appointment_id);
console.log('Predictions without appointment_id (genuine standalone):', withoutAppt.length);

// For the ones with appointment_id, check the hospital_id of those appointments!
const apptIds = withAppt.map(p => new mongoose.Types.ObjectId(p.appointment_id));
const appts = await apptDb.collection('appointments').find({ _id: { $in: apptIds } }).toArray();
console.log(`Found ${appts.length} appointments for these predictions.`);

const hospBreakdown = {};
for (const a of appts) {
  const hid = a.hospital_id.toString();
  hospBreakdown[hid] = (hospBreakdown[hid] || 0) + 1;
}
console.log('Hospitals of these appointments:', hospBreakdown);

await mongoose.disconnect();
