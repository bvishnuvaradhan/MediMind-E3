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

const sampleNoHosp = await aiDb.collection('predictions').find({
  hospital_id: { $exists: false },
  appointment_id: { $ne: null }
}).limit(5).toArray();

console.log('Sample predictions without hospital_id but with appointment_id:');
console.log(sampleNoHosp.map(p => ({
  id: p.prediction_id,
  type: p.prediction_type,
  appt_id: p.appointment_id,
  created_at: p.created_at
})));

await mongoose.disconnect();
