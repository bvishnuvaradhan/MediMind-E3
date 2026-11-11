import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const GATEWAY_URL = 'http://localhost:5000';
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017';

// Safely load Atlas URI
let ATLAS_MONGO_URI = process.env.MONGODB_URI;
try {
  const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && match[1].trim() === 'MONGODB_URI') {
      ATLAS_MONGO_URI = match[2].trim().replace(/^['"]|['"]$/g, '');
      break;
    }
  }
} catch (e) {}

async function loginUser(email, password) {
  const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return data.data?.token || data.token;
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('TEST SUITE: OCTOBER 2026 DEMONSTRATION DASHBOARD TARGET VIEW');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test 1: Authenticate and Fetch Demonstration API
  // -------------------------------------------------------------------------
  console.log('[Test 1] Authenticating as Chairman and Fetching Demonstration Endpoint...');
  const chairToken = await loginUser('chairman@medimind.org', 'Chair#2026' + String.fromCharCode(36) + '01!Dev');
  assert(!!chairToken, 'Chairman authentication token acquired.');

  const res = await fetch(`${GATEWAY_URL}/api/appointments/october-demonstration`, {
    headers: { Authorization: `Bearer ${chairToken}` }
  });
  assert(res.status === 200, `Demonstration endpoint responded with 200 OK (actual: ${res.status}).`);
  
  const payload = await res.json();
  assert(payload.success === true, 'Response payload marked success: true.');
  const data = payload.data;

  // -------------------------------------------------------------------------
  // Test 2: Verify Total Metrics
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Verifying Demonstration Totals (Requirement 4 & 6)...');
  assert(data.totals.genuineProductionAppointments === 741, `Genuine production count is exactly 741 (actual: ${data.totals.genuineProductionAppointments}).`);
  assert(data.totals.simulatedDemonstrationAppointments === 387, `Simulated demonstration count is exactly 387 (actual: ${data.totals.simulatedDemonstrationAppointments}).`);
  assert(data.totals.combinedDemonstrationTotal === 1128, `Combined demonstration total is exactly 1,128 (actual: ${data.totals.combinedDemonstrationTotal}).`);
  assert(data.totals.targetTotal === 1128, `Target total is 1,128.`);
  assert(data.totals.achievementRate === '100%', `Target achievement rate is 100%.`);
  assert(
    data.demonstrationLabel === 'Demonstration Total — Includes Simulated Data',
    `Mandatory label strictly present: "${data.demonstrationLabel}".`
  );

  // -------------------------------------------------------------------------
  // Test 3: Verify Hospital Allocation Breakdown
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Verifying Hospital Allocation Breakdown (Requirement 5)...');
  const allocations = data.hospitalAllocations;
  assert(Array.isArray(allocations) && allocations.length === 3, 'All 3 operational facilities represented.');

  const harborview = allocations.find(h => h.hospitalName.includes('Harborview'));
  const aarogyam = allocations.find(h => h.hospitalName.includes('Aarogyam'));
  const nexora = allocations.find(h => h.hospitalName.includes('Nexora'));

  assert(harborview.genuineCount === 325, `Harborview genuine count = 325 (actual: ${harborview.genuineCount}).`);
  assert(harborview.simulatedCount === 178, `Harborview simulated delta = 178 (actual: ${harborview.simulatedCount}).`);
  assert(harborview.demonstrationTotal === 503, `Harborview combined total = 503 (actual: ${harborview.demonstrationTotal}).`);
  assert(harborview.targetCount === 503, `Harborview target = 503.`);

  assert(aarogyam.genuineCount === 223, `Aarogyam genuine count = 223 (actual: ${aarogyam.genuineCount}).`);
  assert(aarogyam.simulatedCount === 100, `Aarogyam simulated delta = 100 (actual: ${aarogyam.simulatedCount}).`);
  assert(aarogyam.demonstrationTotal === 323, `Aarogyam combined total = 323 (actual: ${aarogyam.demonstrationTotal}).`);
  assert(aarogyam.targetCount === 323, `Aarogyam target = 323.`);

  assert(nexora.genuineCount === 193, `Nexora genuine count = 193 (actual: ${nexora.genuineCount}).`);
  assert(nexora.simulatedCount === 109, `Nexora simulated delta = 109 (actual: ${nexora.simulatedCount}).`);
  assert(nexora.demonstrationTotal === 302, `Nexora combined total = 302 (actual: ${nexora.demonstrationTotal}).`);
  assert(nexora.targetCount === 302, `Nexora target = 302.`);

  // -------------------------------------------------------------------------
  // Test 4: Synthetic Markers & Clinical Safety Safeguards
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Verifying Synthetic Markers & Clinical Safety Guarantees (Requirements 8 & 9)...');
  assert(data.metadata.syntheticMarker === 'SYNTHETIC_TEST_DATA', 'Synthetic marker verified.');
  assert(data.metadata.simulatedPrescriptionsCount === 0, 'Zero simulated prescriptions enforced.');
  assert(data.metadata.productionSafeguardActive === true, 'Production safeguard active flag set.');
  assert(
    data.metadata.disclaimer.includes('Demonstration Total — Includes Simulated Data') &&
    data.metadata.disclaimer.includes('quarantined'),
    'Disclaimer contains clear quarantine notice and demonstration label.'
  );

  // -------------------------------------------------------------------------
  // Test 5: Production Atlas Cleanliness & Immutability Check
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Verifying Production Atlas Cleanliness & Invariant Preservation...');
  const atlasClient = new MongoClient(ATLAS_MONGO_URI);
  await atlasClient.connect();

  const prodApptCol = atlasClient.db('medimind_appointment').collection('appointments');
  const prodHospCol = atlasClient.db('medimind_hospital').collection('hospitals');
  const prodAiCol = atlasClient.db('medimind_ai').collection('predictions');

  const activeHosps = await prodHospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const activeHospIds = activeHosps.map(h => h._id);

  const synthInProd = await prodApptCol.countDocuments({
    $or: [{ is_synthetic: true }, { synthetic_marker: { $exists: true } }, { dataset_tag: { $exists: true } }]
  });
  assert(synthInProd === 0, `Production Atlas contains strictly 0 synthetic records.`);

  const prodActiveTotal = await prodApptCol.countDocuments({ hospital_id: { $in: activeHospIds } });
  assert(prodActiveTotal === 5009, `Production total active appointments preserved at 5,009 (actual: ${prodActiveTotal}).`);

  const prodOctCount = await prodApptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: new Date('2026-10-01T00:00:00.000Z'), $lt: new Date('2026-11-01T00:00:00.000Z') }
  });
  assert(prodOctCount === 741, `Production October scheduled care preserved at verified 741 baseline.`);

  const prodNovCount = await prodApptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: new Date('2026-11-01T00:00:00.000Z'), $lt: new Date('2026-12-01T00:00:00.000Z') }
  });
  assert(prodNovCount === 330, `Production November advance workload preserved at 330.`);

  const standaloneNLP = await prodAiCol.countDocuments({
    appointment_id: { $in: [null, undefined, ''] },
    is_active: { $ne: false }
  });
  assert(standaloneNLP === 90, `Production standalone NLP symptom assessments preserved at 90.`);

  await atlasClient.close();

  // -------------------------------------------------------------------------
  // Test 6: Frontend Security Audit (No secrets in client bundle)
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Auditing Frontend Client Code for Leaked Credentials (Requirement 10)...');
  const bundleFiles = fs.readdirSync(path.resolve('frontend/dist/assets')).filter(f => f.endsWith('.js'));
  let bundleHasSecret = false;
  for (const f of bundleFiles) {
    const content = fs.readFileSync(path.resolve('frontend/dist/assets', f), 'utf-8');
    if (content.includes('mongodb+srv://') || content.includes('plxllln.mongodb.net') || content.includes('Boga123')) {
      bundleHasSecret = true;
      break;
    }
  }
  assert(!bundleHasSecret, 'Frontend compiled production bundle is completely free of MongoDB connection strings & credentials.');

  console.log('\n========================================================================');
  console.log(`ALL TESTS PASSED! (${passed}/${total} assertions succeeded)`);
  console.log('========================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
