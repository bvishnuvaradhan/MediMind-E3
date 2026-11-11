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
const sample = await aiDb.collection('predictions').findOne({ appointment_id: { $ne: null } });
console.log('Sample appointment-linked prediction in medimind_ai:');
console.log(sample);

const keys = Object.keys(sample || {});
console.log('Keys in prediction document:', keys);

const standaloneSample = await aiDb.collection('predictions').findOne({
  $or: [{ appointment_id: null }, { appointment_id: '' }]
});
console.log('Sample standalone prediction:');
console.log(standaloneSample);

await mongoose.disconnect();
