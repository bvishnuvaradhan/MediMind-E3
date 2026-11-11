import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

const hospitals = [
  { id: '6ac85a18074c2bc731a76385', name: 'Harborview Medical Centre', startMonth: '2026-03' },
  { id: '6ac85a18074c2bc731a76381', name: 'Aarogyam Multispeciality Hospital', startMonth: '2026-05' },
  { id: '6ac85a18074c2bc731a76383', name: 'Nexora Advanced Care Hospital', startMonth: '2026-07' },
];

const months = [
  '2026-03', '2026-04', '2026-05', '2026-06',
  '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'
];

async function runDiagnostics() {
  console.log('========================================================================');
  console.log('PHASE 12 DIAGNOSTIC DATA AUDIT: DB -> BACKEND AGG -> API -> FRONTEND');
  console.log('========================================================================\n');

  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connAi = await mongoose.createConnection(uri, { dbName: 'medimind_ai' }).asPromise();

  // 1. Fetch from live API
  console.log('--- Fetching live stats API from port 5000 ---');
  let apiStats = null;
  try {
    const authRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chairman@medimind.org',
        password: 'Chair#2026$01!Dev'
      })
    });
    const authJson = await authRes.json();
    const token = authJson.data?.token;

    const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const statsJson = await statsRes.json();
    apiStats = statsJson.data;
    console.log('Successfully retrieved stats directly via API Gateway (/api/appointments/stats)');
  } catch (err) {
    console.warn('Could not call API Gateway:', err.message);
  }

  // 2. Compute Raw DB Counts
  console.log('\n--- Auditing Raw Database Counts vs Aggregation Results ---');

  for (const h of hospitals) {
    console.log(`\n========================================================================`);
    console.log(`FACILITY: ${h.name} (ID: ${h.id}, Onboarded: ${h.startMonth})`);
    console.log(`========================================================================`);

    const hidObj = new mongoose.Types.ObjectId(h.id);
    const allAppts = await connAppt.collection('appointments').find({ hospital_id: hidObj }).toArray();

    console.log(`Total appointments in DB: ${allAppts.length}`);

    // Tabulate per month
    console.log('\n--- CHART A: INTAKE BOOKINGS (Date Field: created_at) ---');
    console.log('| Month | Raw DB (created_at) | Backend Agg Bucket | Onboarding Status | Exclusion Rules |');
    console.log('|---|---:|---:|:---:|---|');
    for (const m of months) {
      const isPreOnboarding = m < h.startMonth;
      const rawCount = allAppts.filter(a => {
        const d = a.created_at ? new Date(a.created_at) : (a.appointment_date ? new Date(a.appointment_date) : null);
        return d && d.toISOString().slice(0, 7) === m;
      }).length;

      const aggMatch = (apiStats?.byHospitalMonthlyIntake || []).find(
        b => b.hospitalId === h.id && b.bucket === m
      );
      const aggCount = aggMatch ? aggMatch.count : 0;

      const status = isPreOnboarding ? 'PRE-ONBOARDING' : (m === '2026-10' ? 'ACTIVE (MTD)' : (m > '2026-10' ? 'FUTURE' : 'HISTORICAL'));
      const exclusions = isPreOnboarding ? 'Render as null/gap' : (m === '2026-11' ? 'Booked in advance in Oct; 0 created in Nov' : 'None');

      console.log(`| ${m} | ${rawCount} | ${aggCount} | ${status} | ${exclusions} |`);
    }

    console.log('\n--- CHART B: APPOINTMENTS SERVED (Date Field: appointment_date, status: COMPLETED) ---');
    console.log('| Month | Raw DB (COMPLETED) | Raw DB (CONFIRMED) | Raw DB (RESCHEDULED) | Backend Agg | Status | Note on Oct Dip |');
    console.log('|---|---:|---:|---:|---:|:---:|---|');
    for (const m of months) {
      const isPreOnboarding = m < h.startMonth;
      const completed = allAppts.filter(a => {
        return a.status === 'COMPLETED' && a.appointment_date && new Date(a.appointment_date).toISOString().slice(0, 7) === m;
      }).length;
      const confirmed = allAppts.filter(a => {
        return a.status === 'CONFIRMED' && a.appointment_date && new Date(a.appointment_date).toISOString().slice(0, 7) === m;
      }).length;
      const rescheduled = allAppts.filter(a => {
        return a.status === 'RESCHEDULED' && a.appointment_date && new Date(a.appointment_date).toISOString().slice(0, 7) === m;
      }).length;

      const aggMatch = (apiStats?.byHospitalMonthlyCompleted || []).find(
        b => b.hospitalId === h.id && b.bucket === m
      );
      const aggCount = aggMatch ? aggMatch.count : 0;

      const note = m === '2026-10'
        ? `MTD cutoff (Oct 28). Has ${confirmed} unclosed CONFIRMED slots`
        : (m === '2026-09' ? `Has ${confirmed} unclosed CONFIRMED slots` : (m > '2026-10' ? 'Future dates' : '-'));

      console.log(`| ${m} | ${completed} | ${confirmed} | ${rescheduled} | ${aggCount} | ${isPreOnboarding ? 'PRE' : 'ACTIVE'} | ${note} |`);
    }

    console.log('\n--- CHART C: CLINICAL AI RUNS (Execution Date Field: created_at) ---');
    console.log('| Month | Appt-Linked AI (created_at) | Standalone AI | Total AI Runs | Backend Agg | Note |');
    console.log('|---|---:|---:|---:|---:|---|');
    for (const m of months) {
      const isPreOnboarding = m < h.startMonth;
      // In appointment collection:
      const linkedAppts = allAppts.filter(a => {
        const hasAi = a.ai_prediction_id && typeof a.ai_prediction_id === 'string' && a.ai_prediction_id.length > 0;
        const d = a.created_at ? new Date(a.created_at) : (a.appointment_date ? new Date(a.appointment_date) : null);
        return hasAi && d && d.toISOString().slice(0, 7) === m;
      }).length;

      const aggMatch = (apiStats?.byHospitalMonthlyPreds || []).find(
        b => b.hospitalId === h.id && b.bucket === m
      );
      const aggCount = aggMatch ? aggMatch.count : 0;

      const note = isPreOnboarding
        ? 'PRE-ONBOARDING (render null)'
        : (m === '2026-08' && h.name.includes('Harborview') ? '192 web bookings lacked AI' :
          (m === '2026-09' && h.name.includes('Harborview') ? '270 web bookings lacked AI' :
          (m === '2026-09' && h.name.includes('Aarogyam') ? '89 web bookings lacked AI' : '-')));

      console.log(`| ${m} | ${linkedAppts} | - | ${linkedAppts} | ${aggCount} | ${note} |`);
    }
  }

  // Standalone AI summary
  console.log('\n--- STANDALONE AI PREDICTIONS IN MEDIMIND_AI ---');
  const standalone = await connAi.collection('predictions').find({
    $or: [{ appointment_id: null }, { appointment_id: { $exists: false } }, { appointment_id: '' }]
  }).toArray();
  const stMap = {};
  for (const s of standalone) {
    const d = s.created_at ? new Date(s.created_at) : null;
    const m = d ? d.toISOString().slice(0, 7) : 'Unknown';
    stMap[m] = (stMap[m] || 0) + 1;
  }
  console.log(`Total Genuine Standalone Assessments: ${standalone.length}`);
  console.log('Monthly Standalone Breakdown:', stMap);

  await connAppt.close();
  await connAi.close();
}

runDiagnostics().catch(console.error);
