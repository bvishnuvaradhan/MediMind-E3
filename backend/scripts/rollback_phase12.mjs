import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

export async function rollbackPhase12(manifestPath = 'backend/scripts/backups/phase12_final_prepared_manifest_20261028.json') {
  console.log('========================================================================');
  console.log('PHASE 12 ROLLBACK UTILITY');
  console.log('========================================================================\n');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connAi = await mongoose.createConnection(uri, { dbName: 'medimind_ai' }).asPromise();

  // 1. Rollback the 24 NO_SHOW appointments back to BOOKED
  const bookedRecords = manifest.decisions?.decision_2_booked_no_show?.records || [];
  console.log(`1. Reverting ${bookedRecords.length} NO_SHOW appointments back to BOOKED...`);
  let apptReverts = 0;
  for (const r of bookedRecords) {
    const res = await connAppt.collection('appointments').updateOne(
      { _id: new mongoose.Types.ObjectId(r._id), status: 'NO_SHOW' },
      { $set: { status: 'BOOKED', updated_at: new Date() } }
    );
    if (res.modifiedCount > 0) apptReverts++;
  }
  console.log(`   Successfully reverted ${apptReverts}/${bookedRecords.length} appointments to BOOKED.`);

  // 2. Delete AI backfill predictions and unlink appointments
  const cohortLabel = manifest.decisions?.decision_4_ai_backfill?.cohort_label || 'DEMO_COHORT_PHASE12_MONOTONIC_AI_20261028';
  console.log(`\n2. Deleting backfill AI predictions with cohort label "${cohortLabel}"...`);
  const delRes = await connAi.collection('predictions').deleteMany({
    demonstration_cohort: cohortLabel
  });
  console.log(`   Deleted ${delRes.deletedCount} AI predictions.`);

  // Unlink appointments
  const unlinkedRes = await connAppt.collection('appointments').updateMany(
    { ai_cohort_label: cohortLabel },
    { $unset: { ai_cohort_label: '' }, $set: { ai_prediction_id: null, updated_at: new Date() } }
  );
  console.log(`   Unlinked ${unlinkedRes.modifiedCount} appointment AI associations.`);

  console.log('\nRollback completed successfully.');

  await connAppt.close();
  await connAi.close();
}

// Allow standalone execution
if (process.argv[1]?.endsWith('rollback_phase12.mjs')) {
  rollbackPhase12().catch(console.error);
}
