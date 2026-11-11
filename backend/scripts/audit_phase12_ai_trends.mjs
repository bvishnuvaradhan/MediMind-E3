import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function auditPhase12() {
  console.log('========================================================================');
  console.log('PHASE 12 — COMPREHENSIVE AI TRENDS & MONTHLY DISTRIBUTION AUDIT');
  console.log('========================================================================\n');

  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connAi = await mongoose.createConnection(uri, { dbName: 'medimind_ai' }).asPromise();
  const connHosp = await mongoose.createConnection(uri, { dbName: 'medimind_hospital' }).asPromise();

  const hospitals = [
    { id: '6ac85a18074c2bc731a76385', name: 'Harborview Medical Centre', startMonth: '2026-03' },
    { id: '6ac85a18074c2bc731a76381', name: 'Aarogyam Multispeciality Hospital', startMonth: '2026-05' },
    { id: '6ac85a18074c2bc731a76383', name: 'Nexora Advanced Care Hospital', startMonth: '2026-07' },
  ];

  const months = [
    '2026-03', '2026-04', '2026-05', '2026-06',
    '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'
  ];

  // 1. Intake Bookings by created_at month
  console.log('--- 1. Monthly Intake Bookings (by created_at) ---');
  for (const h of hospitals) {
    const hidObj = new mongoose.Types.ObjectId(h.id);
    const docs = await connAppt.collection('appointments').find(
      { hospital_id: hidObj },
      { projection: { created_at: 1, appointment_date: 1 } }
    ).toArray();
    const map = {};
    for (const d of docs) {
      const dt = d.created_at ? new Date(d.created_at) : (d.appointment_date ? new Date(d.appointment_date) : null);
      if (!dt) continue;
      const m = dt.toISOString().slice(0, 7);
      map[m] = (map[m] || 0) + 1;
    }
    console.log(`${h.name}:`);
    for (const m of months) {
      console.log(`  ${m}: ${map[m] !== undefined ? map[m] : (m < h.startMonth ? 'Unavailable (Pre-onboarding)' : 0)}`);
    }
  }

  // 2. Appointments Served by appointment_date month for status COMPLETED
  console.log('\n--- 2. Monthly Appointments Served (COMPLETED by appointment_date) ---');
  for (const h of hospitals) {
    const hidObj = new mongoose.Types.ObjectId(h.id);
    const docs = await connAppt.collection('appointments').find(
      { hospital_id: hidObj, status: 'COMPLETED' },
      { projection: { appointment_date: 1 } }
    ).toArray();
    const map = {};
    for (const d of docs) {
      const dt = d.appointment_date ? new Date(d.appointment_date) : null;
      if (!dt) continue;
      const m = dt.toISOString().slice(0, 7);
      map[m] = (map[m] || 0) + 1;
    }
    console.log(`${h.name}:`);
    for (const m of months) {
      console.log(`  ${m}: ${map[m] !== undefined ? map[m] : (m < h.startMonth ? 'Unavailable (Pre-onboarding)' : 0)}`);
    }
  }

  // 3. Clinical AI Runs by inference created_at month in medimind_ai
  console.log('\n--- 3. Monthly Clinical AI Runs (by inference created_at in medimind_ai) ---');
  for (const h of hospitals) {
    const hidObj = new mongoose.Types.ObjectId(h.id);

    // AI runs linked to this hospital via appointment in medimind_appointment
    const apptsWithAi = await connAppt.collection('appointments').find(
      { hospital_id: hidObj, ai_prediction_id: { $type: 'string', $ne: '' } },
      { projection: { ai_prediction_id: 1, created_at: 1, appointment_date: 1 } }
    ).toArray();

    // Map by appointment created_at month
    const apptCreatedMonthMap = {};
    for (const a of apptsWithAi) {
      const m = a.created_at ? a.created_at.toISOString().slice(0, 7) : a.appointment_date?.toISOString().slice(0, 7);
      apptCreatedMonthMap[m] = (apptCreatedMonthMap[m] || 0) + 1;
    }

    console.log(`${h.name} (Linked AI Pre-Screenings by Intake Month):`);
    for (const m of months) {
      console.log(`  ${m}: ${apptCreatedMonthMap[m] !== undefined ? apptCreatedMonthMap[m] : (m < h.startMonth ? 'Unavailable' : 0)}`);
    }
  }

  // 4. Standalone AI Predictions in medimind_ai
  console.log('\n--- 4. Standalone AI Predictions in medimind_ai ---');
  const standalonePreds = await connAi.collection('predictions').find({
    $or: [{ appointment_id: null }, { appointment_id: { $exists: false } }, { appointment_id: '' }]
  }).toArray();
  const standaloneMap = {};
  for (const p of standalonePreds) {
    const d = p.created_at ? new Date(p.created_at) : null;
    const m = d ? d.toISOString().slice(0, 7) : 'Unknown';
    standaloneMap[m] = (standaloneMap[m] || 0) + 1;
  }
  console.log('Total standalone predictions:', standalonePreds.length);
  console.log('Standalone by month:', JSON.stringify(standaloneMap, null, 2));

  // 5. Investigate why AI runs drop in Harborview and Aarogyam
  console.log('\n--- 5. Investigation of Non-Monotonic AI Trajectories ---');
  async function getBreakdown(hid, name) {
    const docs = await connAppt.collection('appointments').find(
      { hospital_id: new mongoose.Types.ObjectId(hid) },
      { projection: { created_at: 1, appointment_date: 1, ai_prediction_id: 1, appointment_type: 1 } }
    ).toArray();
    const map = {};
    for (const d of docs) {
      const dt = d.created_at ? new Date(d.created_at) : (d.appointment_date ? new Date(d.appointment_date) : null);
      if (!dt) continue;
      const m = dt.toISOString().slice(0, 7);
      const hasAi = !!(d.ai_prediction_id && typeof d.ai_prediction_id === 'string' && d.ai_prediction_id.length > 0);
      const type = d.appointment_type || 'STANDARD';
      const key = `${m} | has_ai: ${hasAi} | type: ${type}`;
      map[key] = (map[key] || 0) + 1;
    }
    console.log(`${name} Monthly Booking AI Breakdown:`);
    const sortedKeys = Object.keys(map).sort();
    for (const k of sortedKeys) {
      console.log(`  ${k} => ${map[k]}`);
    }
  }

  await getBreakdown('6ac85a18074c2bc731a76385', 'Harborview');
  await getBreakdown('6ac85a18074c2bc731a76381', 'Aarogyam');
  await getBreakdown('6ac85a18074c2bc731a76383', 'Nexora');

  await connAppt.close();
  await connAi.close();
  await connHosp.close();
}

auditPhase12().catch(console.error);
