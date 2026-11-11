import mongoose from '../node_modules/mongoose/index.js';
import {
  STAGING_URI,
  STAGING_DB_NAME,
  DATASET_RUN_ID,
  assertStagingEnvironment,
} from './generate_synthetic_october_staging.mjs';

/**
 * Teardown script that removes ONLY records belonging to the exact synthetic dataset identifier.
 */
export async function teardownSyntheticOctoberDataset(uri = STAGING_URI) {
  console.log('========================================================================');
  console.log('PHASE 19/20: ISOLATED STAGING SYNTHETIC DATASET TEARDOWN');
  console.log('========================================================================\n');

  // 1. Verify Safeguard
  assertStagingEnvironment(uri);
  console.log(`✓ Production Safeguard Passed: Target URI is non-production (${uri})`);

  // 2. Connect to Staging Database
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  const stagingApptCol = conn.useDb(STAGING_DB_NAME).collection('appointments');
  const stagingPredCol = conn.useDb('medimind_staging_ai').collection('predictions');
  const stagingConsultCol = conn.useDb('medimind_staging_records').collection('consultations');

  console.log(`✓ Connected to isolated staging database: ${STAGING_DB_NAME}`);
  console.log(`  Deleting records matching dataset_run_id: "${DATASET_RUN_ID}" and is_synthetic: true...`);

  const apptResult = await stagingApptCol.deleteMany({
    dataset_run_id: DATASET_RUN_ID,
    is_synthetic: true,
  });

  const predResult = await stagingPredCol.deleteMany({
    dataset_run_id: DATASET_RUN_ID,
    is_synthetic: true,
  });

  const consultResult = await stagingConsultCol.deleteMany({
    dataset_run_id: DATASET_RUN_ID,
    is_synthetic: true,
  });

  console.log('\n========================================================================');
  console.log('SYNTHETIC DATASET TEARDOWN SUMMARY:');
  console.log(`  Appointments Removed: ${apptResult.deletedCount}`);
  console.log(`  Predictions Removed: ${predResult.deletedCount}`);
  console.log(`  Consultations Removed: ${consultResult.deletedCount}`);
  console.log('========================================================================\n');

  await conn.close();
  return {
    appointmentsDeleted: apptResult.deletedCount,
    predictionsDeleted: predResult.deletedCount,
    consultationsDeleted: consultResult.deletedCount,
  };
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('teardown_synthetic_october_staging.mjs')) {
  teardownSyntheticOctoberDataset().catch((err) => {
    console.error('Fatal error during synthetic teardown:', err);
    process.exit(1);
  });
}
