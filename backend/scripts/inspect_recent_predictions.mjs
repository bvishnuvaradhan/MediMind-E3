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

const standalone = await aiDb.collection('predictions').find({
  $or: [{ appointment_id: null }, { appointment_id: '' }, { appointment_id: { $exists: false } }]
}).sort({ created_at: -1 }).limit(10).toArray();

console.log('Recent standalone predictions:', standalone.map(p => ({
  id: p.prediction_id,
  type: p.prediction_type,
  created_at: p.created_at,
  family_member_id: p.family_member_id
})));

const bookedCount = await apptDb.collection('appointments').countDocuments({ status: 'BOOKED' });
const confirmedCount = await apptDb.collection('appointments').countDocuments({ status: 'CONFIRMED' });
console.log('BOOKED count:', bookedCount, 'CONFIRMED count:', confirmedCount);

await mongoose.disconnect();
