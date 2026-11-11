import { MongoClient } from 'mongodb';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017';

// Load Atlas URI from backend/.env safely
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

async function verifyExtendedGeneration() {
  console.log('=== Step 1: Testing Safeguard Halt on Production Atlas URI ===');
  const safeguardTest = await runCommand('python', ['scripts/extend_appointment_generation.py', '--uri', 'mongodb+srv://user:pass@cluster0.plxllln.mongodb.net']);
  if (safeguardTest.stdout.includes('SAFEGUARD_HALT') || safeguardTest.stderr.includes('SAFEGUARD_HALT')) {
    console.log(' PASS: Safeguard successfully prevented execution against Atlas cluster URI.');
  } else {
    console.error(' FAIL: Safeguard did not halt on Atlas URI!', safeguardTest);
    process.exit(1);
  }

  console.log('\n=== Step 2: Testing Python Extended Generation Dry Run ===');
  const dryRun = await runCommand('python', ['scripts/extend_appointment_generation.py', '--dry-run']);
  if (dryRun.stdout.includes('DRY-RUN COMPLETE') && dryRun.stdout.includes('Total Appointments Scheduled: 387')) {
    console.log(' PASS: Dry run generated exactly 387 in-memory appointments.');
  } else {
    console.error(' FAIL: Dry run failed!', dryRun);
    process.exit(1);
  }

  console.log('\n=== Step 3: Verifying Staging Database Collection Contents ===');
  const localClient = new MongoClient(LOCAL_MONGO_URI);
  await localClient.connect();
  const stagingApptDb = localClient.db('medimind_staging_appointment');
  const stagingAiDb = localClient.db('medimind_staging_ai');
  const stagingRecordsDb = localClient.db('medimind_staging_records');

  const apptCol = stagingApptDb.collection('appointments');
  const predCol = stagingAiDb.collection('predictions');
  const consultCol = stagingRecordsDb.collection('consultations');

  const totalExtendedAppts = await apptCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  console.log(`Extended appointments found in staging: ${totalExtendedAppts}`);
  if (totalExtendedAppts !== 387) {
    console.error(` FAIL: Expected 387 extended appointments, found ${totalExtendedAppts}`);
    process.exit(1);
  }

  // Hospital breakdown by hospital_id
  const hospCounts = await apptCol.aggregate([
    { $match: { dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' } },
    { $group: { _id: { $toString: '$hospital_id' }, count: { $sum: 1 } } }
  ]).toArray();
  console.log('Hospital Breakdown:', hospCounts);

  const harborview = hospCounts.find(h => h._id === '6ac85a18074c2bc731a76385')?.count || 0;
  const aarogyam = hospCounts.find(h => h._id === '6ac85a18074c2bc731a76381')?.count || 0;
  const nexora = hospCounts.find(h => h._id === '6ac85a18074c2bc731a76383')?.count || 0;

  if (harborview !== 178 || aarogyam !== 100 || nexora !== 109) {
    console.error(` FAIL: Hospital counts do not match expected (178, 100, 109). Got: H=${harborview}, A=${aarogyam}, N=${nexora}`);
    process.exit(1);
  }
  console.log(' PASS: Hospital counts strictly match (Harborview: 178, Aarogyam: 100, Nexora: 109).');

  // Verify predictions
  const totalExtendedPreds = await predCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  console.log(`Extended AI predictions: ${totalExtendedPreds}`);
  if (totalExtendedPreds !== 387) {
    console.error(` FAIL: Expected 387 predictions, found ${totalExtendedPreds}`);
    process.exit(1);
  }
  console.log(' PASS: 387 AI predictions generated and linked to appointments.');

  // Verify consultations
  const totalExtendedConsults = await consultCol.countDocuments({ dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' });
  console.log(`Extended consultations: ${totalExtendedConsults}`);
  if (totalExtendedConsults !== 246) {
    console.error(` FAIL: Expected 246 consultations (for 246 completed appointments), found ${totalExtendedConsults}`);
    process.exit(1);
  }
  console.log(' PASS: Exactly 246 consultations created for completed appointments.');

  // Check slot collisions / uniqueness
  const slotAgg = await apptCol.aggregate([
    { $match: { dataset_tag: 'EXTENDED_ORIGINAL_WORKFLOW_OCT2026' } },
    { $group: { _id: { doctor_id: '$doctor_id', appointment_date: '$appointment_date', start_time: '$start_time' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  if (slotAgg.length > 0) {
    console.error(' FAIL: Duplicate slots detected within extended appointments!', slotAgg);
    process.exit(1);
  }
  console.log(' PASS: Zero doctor slot collisions detected.');

  // Check doctor and family member linkages
  const docDb = localClient.db('medimind_doctor');
  const familyDb = localClient.db('medimind_family');
  const docCount = await docDb.collection('doctors').countDocuments();
  const famCount = await familyDb.collection('familymembers').countDocuments();
  console.log(`Staging environment doctors: ${docCount}, family members: ${famCount}`);

  await localClient.close();

  console.log('\n=== Step 4: Verifying Production Atlas Cleanliness & Invariance ===');
  const atlasClient = new MongoClient(ATLAS_MONGO_URI);
  await atlasClient.connect();
  const prodApptCol = atlasClient.db('medimind_appointment').collection('appointments');
  const prodHospCol = atlasClient.db('medimind_hospital').collection('hospitals');

  const activeHosps = await prodHospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const activeHospIds = activeHosps.map(h => h._id);

  const prodTagged = await prodApptCol.countDocuments({ dataset_tag: { $exists: true } });
  console.log(`Production appointments with dataset_tag: ${prodTagged}`);
  if (prodTagged !== 0) {
    console.error(' CRITICAL FAIL: Synthetic tags found in Atlas production!');
    process.exit(1);
  }

  const prodOctBaseline = await prodApptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: new Date('2026-10-01T00:00:00.000Z'), $lt: new Date('2026-11-01T00:00:00.000Z') }
  });
  console.log(`Production October scheduled baseline count: ${prodOctBaseline}`);
  if (prodOctBaseline !== 741) {
    console.error(` CRITICAL FAIL: Production October baseline altered! Expected 741, found ${prodOctBaseline}`);
    process.exit(1);
  }

  const prodNovAdvance = await prodApptCol.countDocuments({
    hospital_id: { $in: activeHospIds },
    appointment_date: { $gte: new Date('2026-11-01T00:00:00.000Z'), $lt: new Date('2026-12-01T00:00:00.000Z') }
  });
  console.log(`Production November advance scheduled count: ${prodNovAdvance}`);
  if (prodNovAdvance !== 330) {
    console.error(` CRITICAL FAIL: Production November advance altered! Expected 330, found ${prodNovAdvance}`);
    process.exit(1);
  }

  const prodTotalActive = await prodApptCol.countDocuments({ hospital_id: { $in: activeHospIds } });
  console.log(`Production total active appointments: ${prodTotalActive}`);
  if (prodTotalActive !== 5009) {
    console.error(` CRITICAL FAIL: Production total active count altered! Expected 5009, found ${prodTotalActive}`);
    process.exit(1);
  }

  await atlasClient.close();
  console.log(' PASS: Production MongoDB Atlas is completely unchanged and verified (741 Oct, 330 Nov, 5009 Total).');
  console.log('\n=== ALL EXTENDED GENERATION WORKFLOW TESTS PASSED ===');
}

verifyExtendedGeneration().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
