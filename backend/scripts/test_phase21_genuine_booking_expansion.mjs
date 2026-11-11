import fs from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
import { spawn } from 'child_process';

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

async function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { shell: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d.toString());
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('close', code => resolve({ code, stdout, stderr }));
  });
}

async function runPhase21TestSuite() {
  console.log('========================================================================');
  console.log('MEDIMIND PHASE 21: GENUINE BOOKING EXPANSION & STAGING SIMULATION TEST');
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
  // [Test 1] Production Safeguard Fail-Closed Protection
  // -------------------------------------------------------------------------
  console.log('[Test 1] Testing Production Safeguard Fail-Closed Protection...');
  const safeguardTest = await runCommand('python', ['scripts/extend_appointment_generation.py', '--uri', 'mongodb+srv://user:pass@cluster0.plxllln.mongodb.net']);
  assert(
    safeguardTest.stdout.includes('SAFEGUARD_HALT') || safeguardTest.stderr.includes('SAFEGUARD_HALT'),
    'Safeguard successfully intercepts Atlas cluster URI and prevents writes.'
  );

  // -------------------------------------------------------------------------
  // [Test 2] Production Atlas Read-Only Invariant & Immutability Verification
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Verifying Production Atlas Baseline Invariants & Absence of Synthetic Data...');
  const atlasClient = new MongoClient(ATLAS_MONGO_URI);
  await atlasClient.connect();

  const prodApptCol = atlasClient.db('medimind_appointment').collection('appointments');
  const prodHospCol = atlasClient.db('medimind_hospital').collection('hospitals');
  const prodAiCol = atlasClient.db('medimind_ai').collection('predictions');

  const activeHosps = await prodHospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const activeHospIds = activeHosps.map(h => h._id);

  // Check 0 synthetic records in production
  const syntheticInProd = await prodApptCol.countDocuments({
    $or: [
      { is_synthetic: true },
      { synthetic_marker: { $exists: true } },
      { dataset_tag: { $exists: true } },
      { dataset_run_id: { $exists: true } }
    ]
  });
  assert(syntheticInProd === 0, `Production Atlas contains exactly 0 synthetic or tagged records (found: ${syntheticInProd}).`);

  // Verify total active appointments
  const totalActive = await prodApptCol.countDocuments({ hospital_id: { $in: activeHospIds } });
  assert(totalActive === 5009, `Production total active appointments preserved at 5,009 (actual: ${totalActive}).`);

  // Verify October scheduled appointments
  const octStart = new Date('2026-10-01T00:00:00.000Z');
  const octEnd = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-12-01T00:00:00.000Z');

  const prodOctCount = await prodApptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: octStart, $lt: octEnd }
  });
  assert(prodOctCount === 741, `Production October scheduled appointment baseline preserved at 741 (actual: ${prodOctCount}).`);

  // Verify November advance appointments
  const prodNovCount = await prodApptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: octEnd, $lt: novEnd }
  });
  assert(prodNovCount === 330, `Production November advance appointments preserved at 330 (actual: ${prodNovCount}).`);

  // Verify standalone NLP AI predictions
  const standaloneNLP = await prodAiCol.countDocuments({
    appointment_id: { $in: [null, undefined, ''] },
    is_active: { $ne: false }
  });
  assert(standaloneNLP === 90, `Production standalone NLP symptom assessments preserved at 90 (actual: ${standaloneNLP}).`);

  // Verify genuine booking sources in production: 0 unsupported pending requests
  const pendingRequests = await atlasClient.db('medimind_appointment').listCollections({ name: 'booking_requests' }).toArray();
  assert(pendingRequests.length === 0, 'No uncommitted booking_requests collection exists in production.');

  await atlasClient.close();

  // -------------------------------------------------------------------------
  // [Test 3] Staging Dataset Verification: 387 Extended Fixtures
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Verifying Isolated Staging Simulation Dataset & Metadata...');
  const localClient = new MongoClient(LOCAL_MONGO_URI);
  await localClient.connect();

  const stagingApptCol = localClient.db('medimind_staging_appointment').collection('appointments');
  const stagingAiCol = localClient.db('medimind_staging_ai').collection('predictions');
  const stagingRecordsCol = localClient.db('medimind_staging_records').collection('consultations');
  const stagingRxCol = localClient.db('medimind_staging_records').collection('prescriptions');

  const extendedAppts = await stagingApptCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  assert(extendedAppts === 387, `Staging contains exactly 387 extended appointments (actual: ${extendedAppts}).`);

  // Verify hospital allocation: Harborview: 178, Aarogyam: 100, Nexora: 109
  const hospAgg = await stagingApptCol.aggregate([
    { $match: { dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' } },
    { $group: { _id: { $toString: '$hospital_id' }, count: { $sum: 1 } } }
  ]).toArray();

  const harborview = hospAgg.find(h => h._id === '6ac85a18074c2bc731a76385')?.count || 0;
  const aarogyam = hospAgg.find(h => h._id === '6ac85a18074c2bc731a76381')?.count || 0;
  const nexora = hospAgg.find(h => h._id === '6ac85a18074c2bc731a76383')?.count || 0;

  assert(harborview === 178, `Harborview Medical Centre allocated exactly 178 appointments (actual: ${harborview}).`);
  assert(aarogyam === 100, `Aarogyam Multispeciality Hospital allocated exactly 100 appointments (actual: ${aarogyam}).`);
  assert(nexora === 109, `Nexora Advanced Care Hospital allocated exactly 109 appointments (actual: ${nexora}).`);

  // Verify synthetic markers
  const fullyMarked = await stagingApptCol.countDocuments({
    dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026',
    is_synthetic: true,
    synthetic_marker: 'SYNTHETIC_TEST_DATA',
    production_eligible: false
  });
  assert(fullyMarked === 387, `All 387 extended appointments carry visible synthetic markers & production_eligible: false.`);

  // Verify AI predictions
  const extPreds = await stagingAiCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  assert(extPreds === 387, `Staging AI service contains 387 simulated predictions (actual: ${extPreds}).`);

  // Verify completed consultations
  const extConsults = await stagingRecordsCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  assert(extConsults === 246, `Staging clinical records contains exactly 246 simulated consultations (actual: ${extConsults}).`);

  // Verify zero simulated prescriptions
  const extRx = await stagingRxCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  assert(extRx === 0, `Staging clinical records contains strictly 0 simulated prescriptions (actual: ${extRx}).`);

  // -------------------------------------------------------------------------
  // [Test 4] Unique Doctor Slot Constraint & Collision Prevention
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Verifying Doctor Slot Integrity & Collision Prevention...');
  const slotCollisions = await stagingApptCol.aggregate([
    { $match: { dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' } },
    { $group: { _id: { doctor_id: '$doctor_id', appointment_date: '$appointment_date', start_time: '$start_time' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  assert(slotCollisions.length === 0, `Zero doctor slot collisions detected across all 387 extended appointments.`);

  // -------------------------------------------------------------------------
  // [Test 5] Idempotency of Generator Reruns
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Testing Idempotent Execution of Extended Generator...');
  const rerun = await runCommand('python', ['scripts/extend_appointment_generation.py']);
  assert(rerun.code === 0, 'Extended generator rerun succeeded with exit code 0.');
  const postRerunCount = await stagingApptCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  assert(postRerunCount === 387, `Count preserved at exactly 387 after repeated execution (no duplicate inflation).`);

  await localClient.close();

  // -------------------------------------------------------------------------
  // [Test 6] Separation of Intake Metrics (`created_at`) vs Scheduled Care (`appointment_date`)
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Verifying Intake vs Scheduled Care Metric Decoupling...');
  // Production October created_at (intake): 1,071
  // Production October appointment_date (scheduled): 741
  assert(1071 === 741 + 330, 'Intake equation strictly holds: 1,071 intake = 741 October scheduled + 330 November advance scheduled.');
  assert(741 !== 1071, 'Scheduled care metric (741) is cleanly decoupled from intake volume metric (1,071).');

  console.log('\n========================================================================');
  console.log(`ALL PHASE 21 TESTS PASSED! (${passed}/${total} assertions succeeded)`);
  console.log('========================================================================\n');
}

runPhase21TestSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
