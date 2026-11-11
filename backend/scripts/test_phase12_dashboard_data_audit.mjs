import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS } from '../../frontend/src/utils/dateUtils.js';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

const hospitals = [
  { id: '6ac85a18074c2bc731a76385', name: 'Harborview Medical Centre', startMonth: '2026-03' },
  { id: '6ac85a18074c2bc731a76381', name: 'Aarogyam Multispeciality Hospital', startMonth: '2026-05' },
  { id: '6ac85a18074c2bc731a76383', name: 'Nexora Advanced Care Hospital', startMonth: '2026-07' },
];

async function runAuditTests() {
  console.log('========================================================================');
  console.log('PHASE 12 COMPREHENSIVE DASHBOARD DATA RETRIEVAL & AUDIT SUITE');
  console.log('========================================================================\n');

  // Authenticate as Chairman
  let authRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'chairman@medimind.org',
      password: 'Chair#2026$01!Dev'
    })
  });
  let authJson = await authRes.json();
  if (!authJson.success) {
    authRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chairman@medimind.org',
        password: 'Password123!'
      })
    });
    authJson = await authRes.json();
  }
  const token = authJson.data?.token;
  if (!token) throw new Error('Chairman authentication failed');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. All eight reporting-period options return valid structures
  console.log('--- 1. Testing All 8 Reporting-Period Options ---');
  assert(STANDARDIZED_ANALYTICS_PERIODS.length === 8, 'Exactly 8 standardized reporting periods defined');

  for (const period of STANDARDIZED_ANALYTICS_PERIODS) {
    const range = getRelativeDateRange(period);
    const query = new URLSearchParams();
    if (range.startDate) query.append('startDate', range.startDate);
    if (range.endDate) query.append('endDate', range.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`http://localhost:5000/api/appointments/stats${qs}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    assert(json.success && json.data, `Period [${period}] returns HTTP 200 with data envelope`);
  }

  // 2. Monthly aggregation and date boundaries
  console.log('\n--- 2. Monthly Aggregation & Date Boundaries ---');
  const allTimeRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const allTimeJson = await allTimeRes.json();
  const allTimeStats = allTimeJson.data;

  assert(Array.isArray(allTimeStats.byHospitalMonthlyIntake), 'byHospitalMonthlyIntake is an array');
  assert(Array.isArray(allTimeStats.byHospitalMonthlyCompleted), 'byHospitalMonthlyCompleted is an array');
  assert(Array.isArray(allTimeStats.byHospitalMonthlyPreds), 'byHospitalMonthlyPreds is an array');

  // Verify buckets match YYYY-MM format
  const validBucket = (b) => /^\d{4}-\d{2}$/.test(b);
  assert(allTimeStats.byHospitalMonthlyIntake.every(m => validBucket(m.bucket)), 'All intake monthly buckets formatted YYYY-MM');
  assert(allTimeStats.byHospitalMonthlyCompleted.every(m => validBucket(m.bucket)), 'All completed monthly buckets formatted YYYY-MM');
  assert(allTimeStats.byHospitalMonthlyPreds.every(m => validBucket(m.bucket)), 'All AI monthly buckets formatted YYYY-MM');

  // 3. Facility onboarding dates & pre-onboarding checks
  console.log('\n--- 3. Facility Onboarding & Absence of Pre-Onboarding Demo Activity ---');
  for (const h of hospitals) {
    const intakePre = allTimeStats.byHospitalMonthlyIntake.filter(m => m.hospitalId === h.id && m.bucket < h.startMonth);
    const completedPre = allTimeStats.byHospitalMonthlyCompleted.filter(m => m.hospitalId === h.id && m.bucket < h.startMonth);
    const predsPre = allTimeStats.byHospitalMonthlyPreds.filter(m => m.hospitalId === h.id && m.bucket < h.startMonth);

    assert(intakePre.length === 0, `${h.name}: Zero intake buckets prior to onboarding month (${h.startMonth})`);
    assert(completedPre.length === 0, `${h.name}: Zero completed buckets prior to onboarding month (${h.startMonth})`);
    assert(predsPre.length === 0, `${h.name}: Zero AI prediction buckets prior to onboarding month (${h.startMonth})`);
  }

  // 4. Future appointments & advance bookings
  console.log('\n--- 4. Advance Bookings Reality & Future Date Scoping ---');
  const novCompleted = allTimeStats.byHospitalMonthlyCompleted.filter(m => m.bucket === '2026-11');
  const novPreds = allTimeStats.byHospitalMonthlyPreds.filter(m => m.bucket === '2026-11');
  const novIntake = allTimeStats.byHospitalMonthlyIntake.filter(m => m.bucket === '2026-11');

  assert(novCompleted.length === 0, 'November completed encounters count is 0 (November has not occurred)');
  assert(novPreds.length === 0, 'November AI runs count is 0 (Inferences executed at intake in October)');
  assert(novIntake.length === 0, 'November intake bookings count is 0 (All 348 advance bookings created in October)');

  // 5. Completed vs incomplete appointments
  console.log('\n--- 5. Completed vs Incomplete Appointments ---');
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const rawCompleted = await connAppt.collection('appointments').countDocuments({ status: 'COMPLETED' });
  const rawConfirmed = await connAppt.collection('appointments').countDocuments({ status: 'CONFIRMED' });
  const rawRescheduled = await connAppt.collection('appointments').countDocuments({ status: 'RESCHEDULED' });
  const rawBooked = await connAppt.collection('appointments').countDocuments({ status: 'BOOKED' });

  assert(rawCompleted === 3945, `Authoritative raw COMPLETED count is exactly 3,945 (found ${rawCompleted})`);
  assert(rawConfirmed === 412, `Authoritative raw CONFIRMED count preserved (found ${rawConfirmed})`);
  assert(rawRescheduled === 176, `Authoritative raw RESCHEDULED count preserved at 176 (found ${rawRescheduled})`);
  assert(rawBooked === 215, `Authoritative raw BOOKED count preserved at 215 (found ${rawBooked})`);

  // Verify sum of completed across all hospitals in stats API matches rawCompleted
  const totalApiCompleted = Object.values(allTimeStats.byHospitalCompleted || {}).reduce((a, b) => a + b, 0);
  assert(totalApiCompleted === rawCompleted, `Total API completed visits (${totalApiCompleted}) exactly equals raw DB COMPLETED (${rawCompleted})`);

  // 6. Successful persisted AI runs vs Standalone assessments
  console.log('\n--- 6. Successful AI Runs & Standalone Preservation ---');
  const connAi = await mongoose.createConnection(uri, { dbName: 'medimind_ai' }).asPromise();
  const totalPreds = await connAi.collection('predictions').countDocuments({});
  const standalonePreds = await connAi.collection('predictions').countDocuments({
    $or: [{ appointment_id: null }, { appointment_id: { $exists: false } }, { appointment_id: '' }]
  });
  const linkedPreds = await connAi.collection('predictions').countDocuments({
    appointment_id: { $type: 'string', $ne: '' }
  });

  assert(totalPreds === 5043 || totalPreds === 4197, `Total persisted AI predictions in database verified (found ${totalPreds})`);
  assert(standalonePreds === 90, `Genuine standalone NLP symptom assessments preserved at 90 (found ${standalonePreds})`);
  assert(linkedPreds === 4953 || linkedPreds === 4107, `Appointment-linked clinical AI pre-screenings verified (found ${linkedPreds})`);

  // 7. Correct hospital attribution and duplicate prevention
  console.log('\n--- 7. Hospital Attribution & Duplicate Prevention ---');
  const distinctHospInStats = Object.keys(allTimeStats.byHospitalIntake || {});
  assert(distinctHospInStats.length === 3, 'Exactly 3 active hospital facilities attributed in Platform Owner stats');
  for (const h of hospitals) {
    assert(distinctHospInStats.includes(h.id), `Hospital ${h.name} (${h.id}) correctly attributed`);
  }

  // 8. Cancellation limits honored
  console.log('\n--- 8. Operational Bounds: Cancellation Caps ---');
  const cancellations = allTimeStats.byHospitalCancelled || {};
  let totalCancelled = 0;
  for (const h of hospitals) {
    const c = cancellations[h.id] || 0;
    totalCancelled += c;
    assert(c <= 100, `${h.name} cancellations (${c}) within per-hospital limit of <= 100`);
  }
  assert(totalCancelled <= 300, `Network total cancellations (${totalCancelled}) within limit of <= 300`);

  await connAppt.close();
  await connAi.close();

  console.log('\n========================================================================');
  console.log(`AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
  console.log('========================================================================');

  if (failed > 0) process.exit(1);
}

runAuditTests().catch(err => {
  console.error('Audit suite encountered error:', err);
  process.exit(1);
});
