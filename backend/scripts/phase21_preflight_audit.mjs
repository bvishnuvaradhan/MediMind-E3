import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

// Safely load Atlas URI
const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
let atlasUri = '';
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && match[1].trim() === 'MONGODB_URI') {
    atlasUri = match[2].trim().replace(/^['"]|['"]$/g, '');
    break;
  }
}

async function runPreflight() {
  console.log('========================================================================');
  console.log('PHASE 21: PRODUCTION PREFLIGHT & GENUINE BOOKING AUDIT');
  console.log('========================================================================\n');

  const client = new MongoClient(atlasUri);
  await client.connect();

  const apptDb = client.db('medimind_appointment');
  const hospDb = client.db('medimind_hospital');
  const aiDb = client.db('medimind_ai');
  const familyDb = client.db('medimind_family');
  const doctorDb = client.db('medimind_doctor');

  // 1. Hospitals
  const hospitals = await hospDb.collection('hospitals').find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const hospMap = new Map(hospitals.map(h => [String(h._id), h.name]));
  const activeHospIds = hospitals.map(h => h._id);

  console.log('[1. Active Production Hospitals]');
  hospitals.forEach(h => console.log(`  - ${h.name} (${h._id})`));

  // 2. Production Baseline Verification
  const apptCol = apptDb.collection('appointments');
  const totalActive = await apptCol.countDocuments({ hospital_id: { $in: activeHospIds } });
  
  const octStart = new Date('2026-10-01T00:00:00.000Z');
  const octEnd = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-12-01T00:00:00.000Z');

  const octScheduled = await apptCol.find({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: octStart, $lt: octEnd }
  }).toArray();

  const novAdvance = await apptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: octEnd, $lt: novEnd }
  });

  const predCol = aiDb.collection('predictions');
  const totalPreds = await predCol.countDocuments();
  const standaloneNLP = await predCol.countDocuments({
    appointment_id: { $in: [null, undefined, ''] },
    is_active: { $ne: false }
  });

  console.log('\n[2. Production Baseline Invariants]');
  console.log(`  Total Active Appointments: ${totalActive} (Expected: 5,009)`);
  console.log(`  October Scheduled Baseline: ${octScheduled.length} (Expected: 741)`);
  console.log(`  November Advance Scheduled: ${novAdvance} (Expected: 330)`);
  console.log(`  Standalone NLP Assessments: ${standaloneNLP} (Expected: 90)`);

  // October Hospital Breakdown & Statuses
  const hospStats = {};
  for (const h of hospitals) {
    hospStats[String(h._id)] = { name: h.name, total: 0, statuses: {} };
  }
  for (const a of octScheduled) {
    const hId = String(a.hospital_id);
    if (hospStats[hId]) {
      hospStats[hId].total++;
      const st = String(a.status || 'UNKNOWN').toUpperCase();
      hospStats[hId].statuses[st] = (hospStats[hId].statuses[st] || 0) + 1;
    }
  }

  console.log('\n[3. October 2026 Hospital Distribution & Shortfall]');
  const targets = {
    '6ac85a18074c2bc731a76385': { name: 'Harborview Medical Centre', target: 503 },
    '6ac85a18074c2bc731a76381': { name: 'Aarogyam Multispeciality Hospital', target: 323 },
    '6ac85a18074c2bc731a76383': { name: 'Nexora Advanced Care Hospital', target: 302 }
  };

  let totalShortfall = 0;
  for (const [hId, t] of Object.entries(targets)) {
    const act = hospStats[hId]?.total || 0;
    const diff = t.target - act;
    totalShortfall += diff;
    console.log(`  ${t.name}: Current=${act}, Target=${t.target}, Shortfall=${diff}`);
    console.log(`    Status breakdown:`, hospStats[hId]?.statuses);
  }
  console.log(`  Network Total: Current=${octScheduled.length}, Target=1128, Shortfall=${totalShortfall}`);

  // 4. Inspect Potential Genuine Booking Sources in Production
  console.log('\n[4. Investigating Potential Genuine Booking Sources in Production]');
  const dbList = await client.db().admin().listDatabases();
  console.log('  Available Databases:', dbList.databases.map(d => d.name));

  for (const dbInfo of dbList.databases) {
    if (dbInfo.name.startsWith('medimind_')) {
      const collections = await client.db(dbInfo.name).listCollections().toArray();
      const colNames = collections.map(c => c.name);
      console.log(`  DB: ${dbInfo.name} -> Collections:`, colNames.join(', '));
    }
  }

  // Check if medimind_appointment has any other collections like booking_requests, unconfirmed, intake_queue
  const apptCols = await apptDb.listCollections().toArray();
  console.log('\n  Collections in medimind_appointment:', apptCols.map(c => c.name));

  // Check if any appointments have created_at in Oct 2026 but appointment_date outside Oct (e.g. November advance)
  const intakeInOct = await apptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    created_at: { $gte: octStart, $lt: octEnd }
  });
  console.log(`  Appointments created in October (Intake): ${intakeInOct}`);

  // Check unique indexes in medimind_appointment.appointments
  const indexes = await apptCol.indexes();
  console.log('\n[5. Canonical Indexes on medimind_appointment.appointments]');
  indexes.forEach(idx => console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : '', idx.partialFilterExpression ? JSON.stringify(idx.partialFilterExpression) : ''));

  await client.close();
}

runPreflight().catch(err => {
  console.error('Preflight error:', err);
  process.exit(1);
});
