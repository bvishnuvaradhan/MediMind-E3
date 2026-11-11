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
const hospDb = mongoose.connection.useDb('medimind_hospital');

const hosps = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
const hospMap = Object.fromEntries(hosps.map(h => [h._id.toString(), h.name]));
const activeIds = hosps.map(h => h._id);

// 1. Direct from predictions with hospital_id
const p1 = await aiDb.collection('predictions').aggregate([
  { $match: { hospital_id: { $in: activeIds } } },
  {
    $project: {
      hospital_id: 1,
      bucket: {
        $substrCP: [
          {
            $cond: [
              { $eq: [{ $type: '$created_at' }, 'date'] },
              { $dateToString: { format: '%Y-%m', date: '$created_at' } },
              { $ifNull: ['$created_at', ''] }
            ]
          },
          0,
          7
        ]
      }
    }
  },
  {
    $group: {
      _id: { hospital_id: '$hospital_id', bucket: '$bucket' },
      count: { $sum: 1 }
    }
  }
]).toArray();

// 2. Predictions without hospital_id linked via appointments
const noHospPreds = await aiDb.collection('predictions').find({
  $or: [{ hospital_id: null }, { hospital_id: { $exists: false } }],
  appointment_id: { $ne: null }
}).toArray();

const apptIds = noHospPreds.map(p => {
  try { return new mongoose.Types.ObjectId(p.appointment_id); } catch { return null; }
}).filter(Boolean);

const appts = await apptDb.collection('appointments').find({
  _id: { $in: apptIds },
  hospital_id: { $in: activeIds }
}).toArray();

const apptHospMap = new Map();
for (const a of appts) {
  apptHospMap.set(a._id.toString(), a.hospital_id.toString());
}

const p2Map = {};
for (const p of noHospPreds) {
  const hid = apptHospMap.get(p.appointment_id);
  if (!hid) continue;
  let m = 'null';
  if (p.created_at) {
    if (typeof p.created_at === 'string') m = p.created_at.slice(0, 7);
    else if (p.created_at instanceof Date) m = p.created_at.toISOString().slice(0, 7);
  }
  const key = `${hid}|${m}`;
  p2Map[key] = (p2Map[key] || 0) + 1;
}

// Combine
const combinedMap = {};
for (const item of p1) {
  const hid = item._id.hospital_id.toString();
  const m = item._id.bucket;
  const key = `${hid}|${m}`;
  combinedMap[key] = (combinedMap[key] || 0) + item.count;
}
for (const [key, count] of Object.entries(p2Map)) {
  combinedMap[key] = (combinedMap[key] || 0) + count;
}

const result = Object.entries(combinedMap).map(([k, count]) => {
  const [hid, bucket] = k.split('|');
  return {
    _id: { hospital_id: new mongoose.Types.ObjectId(hid), bucket },
    hospitalId: hid,
    hospitalName: hospMap[hid],
    bucket,
    count
  };
}).sort((a, b) => a.bucket.localeCompare(b.bucket) || a.hospitalName.localeCompare(b.hospitalName));

console.log('\nFinal Combined Authoritative Monthly AI Predictions by Execution Month:');
console.table(result.map(r => ({
  hospital: r.hospitalName,
  bucket: r.bucket,
  count: r.count
})));

const totalAll = result.reduce((s, r) => s + r.count, 0);
console.log('Total appointment-linked AI runs accounted for:', totalAll);

await mongoose.disconnect();
