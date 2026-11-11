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

async function inspect(uri, label) {
  console.log(`\n================== ${label} ==================`);
  try {
    const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 3000 }).asPromise();
    const apptDb = conn.useDb('medimind_appointment');
    const aiDb = conn.useDb('medimind_ai');
    const hospDb = conn.useDb('medimind_hospital');

    const hosps = await hospDb.collection('hospitals').find({}).toArray();
    console.log('Hospitals found:', hosps.map(h => ({ id: h._id.toString(), name: h.name, status: h.status })));

    const novStart = new Date('2026-11-01T00:00:00.000Z');
    const novEnd = new Date('2026-11-30T23:59:59.999Z');

    const novAppts = await apptDb.collection('appointments').find({
      appointment_date: { $gte: novStart, $lte: novEnd }
    }).toArray();

    console.log(`Total November appointments: ${novAppts.length}`);

    const hospCounts = {};
    const statusCounts = {};
    let withAi = 0;
    let withoutAi = 0;
    const reasons = {};

    for (const a of novAppts) {
      const hid = a.hospital_id ? a.hospital_id.toString() : 'null';
      hospCounts[hid] = (hospCounts[hid] || 0) + 1;
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      if (a.ai_prediction_id) withAi++;
      else withoutAi++;
      const r = (a.reason || '').trim();
      reasons[r] = (reasons[r] || 0) + 1;
    }

    console.log('Appointments by hospital:', hospCounts);
    console.log('Appointments by status:', statusCounts);
    console.log(`With AI prediction: ${withAi}, Without AI: ${withoutAi}`);
    console.log('Unique reasons count:', Object.keys(reasons).length);
    console.log('Sample reasons (first 5):', Object.entries(reasons).slice(0, 5));

    const totalPreds = await aiDb.collection('predictions').countDocuments();
    const standalonePreds = await aiDb.collection('predictions').countDocuments({
      $or: [{ appointment_id: null }, { appointment_id: '' }, { appointment_id: { $exists: false } }]
    });
    console.log(`Total AI predictions in DB: ${totalPreds}, Standalone: ${standalonePreds}`);

    await conn.close();
  } catch (err) {
    console.error(`Failed to connect to ${label}:`, err.message);
  }
}

await inspect(process.env.MONGODB_URI, 'MONGODB ATLAS CLOUD');
await inspect('mongodb://127.0.0.1:27017', 'LOCAL MONGODB');
