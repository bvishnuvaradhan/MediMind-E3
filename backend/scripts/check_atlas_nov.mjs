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
const hospDb = mongoose.connection.useDb('medimind_hospital');

const hosps = await hospDb.collection('hospitals').find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const activeIds = hosps.map(h => h._id);

const agg = await apptDb.collection('appointments').aggregate([
  {
    $project: {
      hospital_id: 1,
      status: 1,
      appointment_type: 1,
      bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
    }
  },
  { $match: { bucket: '2026-11' } },
  {
    $group: {
      _id: { hospital_id: '$hospital_id', status: '$status' },
      count: { $sum: 1 }
    }
  }
]).toArray();

console.log('November appointments in Atlas DB:');
console.table(agg.map(r => ({
  hospital_id: r._id.hospital_id ? r._id.hospital_id.toString() : 'null',
  hospital_name: hosps.find(h => h._id.toString() === r._id.hospital_id?.toString())?.name || 'Unknown/Inactive',
  status: r._id.status,
  count: r.count
})));

await mongoose.disconnect();
