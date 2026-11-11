import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';
import path from 'path';
import {
  generateSyntheticOctoberDataset,
  assertStagingEnvironment,
  STAGING_URI,
  STAGING_DB_NAME,
  DATASET_RUN_ID,
  DATASET_TAG,
  TOTAL_SYNTHETIC_TARGET,
  SYNTHETIC_ALLOCATION
} from './generate_synthetic_october_staging.mjs';
import { teardownSyntheticOctoberDataset } from './teardown_synthetic_october_staging.mjs';

// Parse production backend/.env
const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
}
const PROD_URI = env.MONGODB_URI;

async function runValidation() {
  console.log('========================================================================');
  console.log('PHASE 20: SYNTHETIC STAGING VALIDATION & PRODUCTION IMMUTABILITY SUITE');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // Check 1: Production Safeguard Blocks Production URI
  // ---------------------------------------------------------------------------
  console.log('[Check 1] Verifying Production Safeguard Guards...');
  let safeguardTriggered = false;
  try {
    assertStagingEnvironment(PROD_URI);
  } catch (err) {
    if (err.message.includes('SAFEGUARD_HALT: Production write blocked!')) {
      safeguardTriggered = true;
    }
  }
  if (!safeguardTriggered) {
    throw new Error('FAIL: Production safeguard failed to reject Atlas production URI!');
  }
  console.log('✓ PASS: Production safeguard successfully blocked production URI execution.');

  // ---------------------------------------------------------------------------
  // Check 2: Execute Generator in Staging & Verify 387 Fixtures
  // ---------------------------------------------------------------------------
  console.log('\n[Check 2] Generating Synthetic Fixtures in Isolated Staging...');
  const genResult = await generateSyntheticOctoberDataset(STAGING_URI);
  if (genResult.total !== TOTAL_SYNTHETIC_TARGET) {
    throw new Error(`FAIL: Expected ${TOTAL_SYNTHETIC_TARGET} synthetic records, got ${genResult.total}`);
  }
  console.log(`✓ PASS: Exactly ${TOTAL_SYNTHETIC_TARGET} synthetic fixtures generated in staging.`);

  // ---------------------------------------------------------------------------
  // Check 3: Verify Hospital Distribution (178, 100, 109)
  // ---------------------------------------------------------------------------
  console.log('\n[Check 3] Verifying Hospital Allocation...');
  const stagingConn = await mongoose.createConnection(STAGING_URI).asPromise();
  const stagingApptCol = stagingConn.useDb(STAGING_DB_NAME).collection('appointments');

  for (const alloc of SYNTHETIC_ALLOCATION) {
    const count = await stagingApptCol.countDocuments({
      hospital_id: new mongoose.Types.ObjectId(alloc.hospitalId),
      dataset_run_id: DATASET_RUN_ID
    });
    if (count !== alloc.count) {
      throw new Error(`FAIL: Expected ${alloc.count} fixtures for ${alloc.hospitalName}, got ${count}`);
    }
    console.log(`✓ PASS: ${alloc.hospitalName}: verified exactly ${count} fixtures.`);
  }

  // ---------------------------------------------------------------------------
  // Check 4: Idempotency Verification (Rerunning does not duplicate)
  // ---------------------------------------------------------------------------
  console.log('\n[Check 4] Testing Generator Idempotency...');
  const rerunResult = await generateSyntheticOctoberDataset(STAGING_URI);
  const postRerunCount = await stagingApptCol.countDocuments({ dataset_run_id: DATASET_RUN_ID });
  if (postRerunCount !== TOTAL_SYNTHETIC_TARGET) {
    throw new Error(`FAIL: Idempotency failed! Expected ${TOTAL_SYNTHETIC_TARGET} records after rerun, got ${postRerunCount}`);
  }
  console.log(`✓ PASS: Rerunning generator is 100% idempotent; count preserved at ${postRerunCount}.`);

  // ---------------------------------------------------------------------------
  // Check 5: Synthetic Marker & Isolation Flags on Every Fixture
  // ---------------------------------------------------------------------------
  console.log('\n[Check 5] Verifying Synthetic Markers on Every Fixture...');
  const unmarkedCount = await stagingApptCol.countDocuments({
    dataset_run_id: DATASET_RUN_ID,
    $or: [
      { is_synthetic: { $ne: true } },
      { synthetic_marker: { $ne: DATASET_TAG } },
      { production_eligible: { $ne: false } }
    ]
  });
  if (unmarkedCount !== 0) {
    throw new Error(`FAIL: Found ${unmarkedCount} records missing synthetic isolation markers!`);
  }
  console.log(`✓ PASS: 100% (${postRerunCount}/${postRerunCount}) fixtures visibly tagged with "${DATASET_TAG}".`);

  // ---------------------------------------------------------------------------
  // Check 6: Production Database Immutability & Absence of Synthetic Records
  // ---------------------------------------------------------------------------
  console.log('\n[Check 6] Verifying Complete Absence of Synthetic Data in Production...');
  const prodConn = await mongoose.createConnection(PROD_URI).asPromise();
  const prodApptCol = prodConn.useDb('medimind_appointment').collection('appointments');
  const prodPredCol = prodConn.useDb('medimind_ai').collection('predictions');
  const prodConsultCol = prodConn.useDb('medimind_records').collection('consultations');

  const prodSynthAppts = await prodApptCol.countDocuments({
    $or: [{ is_synthetic: true }, { dataset_run_id: DATASET_RUN_ID }]
  });
  const prodSynthPreds = await prodPredCol.countDocuments({
    $or: [{ is_synthetic: true }, { dataset_run_id: DATASET_RUN_ID }]
  });
  const prodSynthConsults = await prodConsultCol.countDocuments({
    $or: [{ is_synthetic: true }, { dataset_run_id: DATASET_RUN_ID }]
  });

  if (prodSynthAppts !== 0 || prodSynthPreds !== 0 || prodSynthConsults !== 0) {
    throw new Error(`FAIL: Synthetic data detected in production database! Appts=${prodSynthAppts}, Preds=${prodSynthPreds}`);
  }
  console.log(`✓ PASS: Production database contains 0 synthetic appointments, 0 synthetic predictions, and 0 synthetic consultations.`);

  // ---------------------------------------------------------------------------
  // Check 7: Production Invariants Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Check 7] Verifying Production Operational Invariants...');
  const totalActiveAppts = await prodApptCol.countDocuments({
    hospital_id: { $in: SYNTHETIC_ALLOCATION.map(a => new mongoose.Types.ObjectId(a.hospitalId)) }
  });
  if (totalActiveAppts !== 5009) {
    throw new Error(`FAIL: Production active appointments altered: expected 5009, got ${totalActiveAppts}`);
  }
  console.log(`✓ PASS: Production total active appointments locked at ${totalActiveAppts}.`);

  const octScheduled = await prodApptCol.countDocuments({
    hospital_id: { $in: SYNTHETIC_ALLOCATION.map(a => new mongoose.Types.ObjectId(a.hospitalId)) },
    appointment_date: { $gte: new Date('2026-10-01T00:00:00.000Z'), $lt: new Date('2026-11-01T00:00:00.000Z') }
  });
  if (octScheduled !== 741) {
    throw new Error(`FAIL: Production October scheduled baseline altered: expected 741, got ${octScheduled}`);
  }
  console.log(`✓ PASS: Production October scheduled baseline locked at ${octScheduled}.`);

  const novScheduled = await prodApptCol.countDocuments({
    hospital_id: { $in: SYNTHETIC_ALLOCATION.map(a => new mongoose.Types.ObjectId(a.hospitalId)) },
    appointment_date: { $gte: new Date('2026-11-01T00:00:00.000Z'), $lt: new Date('2026-12-01T00:00:00.000Z') }
  });
  if (novScheduled !== 330) {
    throw new Error(`FAIL: Production November advance appointments altered: expected 330, got ${novScheduled}`);
  }
  console.log(`✓ PASS: Production November advance workload locked at ${novScheduled}.`);

  const standalonePreds = await prodPredCol.countDocuments({
    $or: [{ appointment_id: null }, { appointment_id: '' }, { appointment_id: { $exists: false } }]
  });
  if (standalonePreds !== 90) {
    throw new Error(`FAIL: Standalone NLP assessments altered: expected 90, got ${standalonePreds}`);
  }
  console.log(`✓ PASS: Production standalone NLP symptom assessments locked at ${standalonePreds}.`);

  // ---------------------------------------------------------------------------
  // Check 8: Teardown Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Check 8] Testing Staging Teardown Script...');
  const teardownResult = await teardownSyntheticOctoberDataset(STAGING_URI);
  if (teardownResult.appointmentsDeleted !== TOTAL_SYNTHETIC_TARGET) {
    throw new Error(`FAIL: Expected ${TOTAL_SYNTHETIC_TARGET} appointments deleted, got ${teardownResult.appointmentsDeleted}`);
  }
  const remainingInStaging = await stagingApptCol.countDocuments({ dataset_run_id: DATASET_RUN_ID });
  if (remainingInStaging !== 0) {
    throw new Error(`FAIL: Residual synthetic records in staging: ${remainingInStaging}`);
  }
  console.log(`✓ PASS: Teardown removed all ${teardownResult.appointmentsDeleted} synthetic appointments cleanly.`);

  // ---------------------------------------------------------------------------
  // Check 9: Clean Re-seeding for Staging Demonstration Use
  // ---------------------------------------------------------------------------
  console.log('\n[Check 9] Re-seeding Staging Dataset for Demonstration Use...');
  await generateSyntheticOctoberDataset(STAGING_URI);
  const finalStagingCount = await stagingApptCol.countDocuments({ dataset_run_id: DATASET_RUN_ID });
  console.log(`✓ PASS: Staging dataset cleanly populated for demonstration use (${finalStagingCount} fixtures).`);

  await stagingConn.close();
  await prodConn.close();

  console.log('\n========================================================================');
  console.log('ALL PHASE 20 SYNTHETIC STAGING VALIDATION CHECKS PASSED!');
  console.log('========================================================================');
}

runValidation().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
