import mongoose from '../node_modules/mongoose/index.js';
import crypto from 'crypto';

// Configuration
export const STAGING_URI = process.env.STAGING_MONGODB_URI || 'mongodb://127.0.0.1:27017';
export const STAGING_DB_NAME = 'medimind_staging_appointment';
export const DATASET_RUN_ID = 'phase19_synth_oct2026_demo_v1';
export const DATASET_TAG = 'SYNTHETIC_TEST_DATA';

// Hospital Targets & Allocation
export const SYNTHETIC_ALLOCATION = [
  {
    hospitalName: 'Harborview Medical Centre',
    hospitalId: '6ac85a18074c2bc731a76385',
    hospitalCode: 'MM-BLR-03',
    departmentId: '6ac85a18074c2bc731a7638d', // General Medicine
    syntheticDoctorId: '6a0000000000000000000001',
    count: 178,
  },
  {
    hospitalName: 'Aarogyam Multispeciality Hospital',
    hospitalId: '6ac85a18074c2bc731a76381',
    hospitalCode: 'MM-BLR-01',
    departmentId: '6ac85a18074c2bc731a76389', // Cardiology
    syntheticDoctorId: '6a0000000000000000000002',
    count: 100,
  },
  {
    hospitalName: 'Nexora Advanced Care Hospital',
    hospitalId: '6ac85a18074c2bc731a76383',
    hospitalCode: 'MM-BLR-02',
    departmentId: '6ac85a18074c2bc731a7638b', // Orthopedics
    syntheticDoctorId: '6a0000000000000000000003',
    count: 109,
  },
];

export const TOTAL_SYNTHETIC_TARGET = 387;

/**
 * Automated Production Safeguard Guard
 * Throws immediately if targeting a production database or production URI.
 */
export function assertStagingEnvironment(uri) {
  if (!uri || typeof uri !== 'string') {
    throw new Error('SAFEGUARD_HALT: Staging URI is undefined or invalid.');
  }

  const lower = uri.toLowerCase();
  const isAtlas = lower.includes('mongodb.net') || lower.includes('plxllln') || lower.includes('cluster');
  const isProdEnv = process.env.NODE_ENV === 'production';

  if (isAtlas || isProdEnv) {
    throw new Error(
      `SAFEGUARD_HALT: Production write blocked! Synthetic generation can only target an isolated local staging environment. Target was: ${uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')}`
    );
  }

  return true;
}

/**
 * Generates a deterministic ObjectId from a synthetic key string
 */
export function makeDeterministicObjectId(seedString) {
  const hash = crypto.createHash('md5').update(seedString).digest('hex');
  return new mongoose.Types.ObjectId(hash.slice(0, 24));
}

/**
 * Main Generator Function
 */
export async function generateSyntheticOctoberDataset(uri = STAGING_URI) {
  console.log('========================================================================');
  console.log('PHASE 19/20: ISOLATED STAGING 387-RECORD SYNTHETIC DATASET GENERATOR');
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

  let totalInserted = 0;
  const hospitalCounts = {};

  for (const alloc of SYNTHETIC_ALLOCATION) {
    console.log(`\nGenerating ${alloc.count} synthetic records for ${alloc.hospitalName}...`);
    let hospCount = 0;

    for (let i = 1; i <= alloc.count; i++) {
      const padIdx = String(i).padStart(4, '0');
      const seedKey = `${DATASET_RUN_ID}_${alloc.hospitalCode}_${padIdx}`;
      const apptId = makeDeterministicObjectId(`appt_${seedKey}`);
      const patientId = makeDeterministicObjectId(`patient_${seedKey}`);
      const predId = `synth_pred_${seedKey}`;
      const consultId = makeDeterministicObjectId(`consult_${seedKey}`);

      // Distribute evenly across October 1-31, 2026
      const dayOfMonth = (i % 31) + 1;
      const padDay = String(dayOfMonth).padStart(2, '0');
      const apptDate = new Date(`2026-10-${padDay}T10:00:00.000Z`);

      // 65% Completed, 25% Pending, 10% Cancelled scenario distribution
      let status = 'COMPLETED';
      if (i % 4 === 0) status = 'CONFIRMED';
      else if (i % 10 === 0) status = 'CANCELLED';

      const syntheticApptDoc = {
        _id: apptId,
        token: `SYNTH-${alloc.hospitalCode.slice(-2)}-${padIdx}`,
        family_member_id: patientId,
        doctor_id: new mongoose.Types.ObjectId(alloc.syntheticDoctorId),
        hospital_id: new mongoose.Types.ObjectId(alloc.hospitalId),
        department_id: new mongoose.Types.ObjectId(alloc.departmentId),
        appointment_date: apptDate,
        start_time: '10:00',
        end_time: '10:30',
        reason: 'Synthetic Demonstration Encounter: October Target Planning Scenario',
        status,
        appointment_type: 'BOOKED',
        ai_prediction_id: predId,
        cancelled_at: status === 'CANCELLED' ? new Date(`2026-10-${padDay}T09:00:00.000Z`) : null,
        cancellation_reason: status === 'CANCELLED' ? 'Simulated patient cancellation' : null,
        
        // Strict Synthetic Metadata Isolation Flags
        is_synthetic: true,
        synthetic_marker: DATASET_TAG,
        dataset_run_id: DATASET_RUN_ID,
        simulated_scenario: 'DEMO_OCTOBER_WORKLOAD_GAP',
        production_eligible: false,

        created_at: new Date(`2026-10-01T08:00:00.000Z`),
        updated_at: new Date(`2026-10-${padDay}T10:30:00.000Z`),
      };

      // Idempotent upsert
      await stagingApptCol.updateOne(
        { _id: apptId },
        { $set: syntheticApptDoc },
        { upsert: true }
      );

      // Corresponding synthetic AI prediction fixture in staging AI DB
      const syntheticPredDoc = {
        _id: makeDeterministicObjectId(`pred_${seedKey}`),
        prediction_id: predId,
        appointment_id: apptId.toString(),
        patient_id: patientId.toString(),
        model_version: 'v2.1.0-synthetic-simulated',
        risk_level: 'LOW',
        confidence_score: 0.92,
        is_synthetic: true,
        synthetic_marker: DATASET_TAG,
        dataset_run_id: DATASET_RUN_ID,
        created_at: new Date(`2026-10-01T08:05:00.000Z`),
      };
      await stagingPredCol.updateOne(
        { prediction_id: predId },
        { $set: syntheticPredDoc },
        { upsert: true }
      );

      // If completed, add synthetic consultation fixture in staging records DB
      if (status === 'COMPLETED') {
        const syntheticConsultDoc = {
          _id: consultId,
          appointment_id: apptId,
          family_member_id: patientId,
          doctor_id: new mongoose.Types.ObjectId(alloc.syntheticDoctorId),
          status: 'FINAL',
          symptoms: 'Simulated clinical demonstration presentation',
          clinical_assessment: 'Simulated diagnostic assessment for scenario testing',
          treatment_plan: 'Simulated treatment plan (DEMO ONLY - NOT A REAL CLINICAL ORDER)',
          is_synthetic: true,
          synthetic_marker: DATASET_TAG,
          dataset_run_id: DATASET_RUN_ID,
          created_at: new Date(`2026-10-${padDay}T10:30:00.000Z`),
        };
        await stagingConsultCol.updateOne(
          { _id: consultId },
          { $set: syntheticConsultDoc },
          { upsert: true }
        );
      }

      hospCount++;
      totalInserted++;
    }

    hospitalCounts[alloc.hospitalName] = hospCount;
    console.log(`  ✓ Created ${hospCount} fixtures for ${alloc.hospitalName}`);
  }

  console.log('\n========================================================================');
  console.log('SYNTHETIC DATASET GENERATION SUMMARY:');
  console.log(`  Target Database: ${STAGING_DB_NAME} (Staging Only)`);
  console.log(`  Dataset Identifier: ${DATASET_RUN_ID}`);
  console.log(`  Total Fixtures Generated: ${totalInserted}`);
  console.log(`  Hospital Breakdown: ${JSON.stringify(hospitalCounts)}`);
  console.log('========================================================================\n');

  await conn.close();
  return {
    total: totalInserted,
    hospitalCounts,
    datasetRunId: DATASET_RUN_ID,
    stagingDb: STAGING_DB_NAME,
  };
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('generate_synthetic_october_staging.mjs')) {
  generateSyntheticOctoberDataset().catch((err) => {
    console.error('Fatal error during synthetic generation:', err);
    process.exit(1);
  });
}
