import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5007';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'medimind_internal_service_secret_2026';

console.log('========================================================================');
console.log('PHASE 17: EXECUTING AUTHORIZED 846-RECORD AI REMEDIATION PIPELINE');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. Preflight Validation & Pre-execution Gate
// -----------------------------------------------------------------------------
console.log('[Step 1] Preflight Verification & Health Check...');
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const apptCol = client.db('medimind_appointment').collection('appointments');
const predCol = client.db('medimind_ai').collection('predictions');
const hospCol = client.db('medimind_hospital').collection('hospitals');

// 1.1 Verify Backup
const backupDir = path.resolve('backend/scripts/backups/phase17_preflight_2026-10-29T07-08-31-222Z');
if (!fs.existsSync(backupDir) || !fs.existsSync(path.join(backupDir, 'manifest.json'))) {
  throw new Error(`CRITICAL: Verified preflight backup not found at ${backupDir}. Execution aborted.`);
}
console.log(`✓ Backup verified: ${backupDir}`);

// 1.2 Verify Standalone AI Predictions
const initialStandaloneCount = await predCol.countDocuments({
  $or: [
    { appointment_id: null },
    { appointment_id: '' },
    { appointment_id: { $exists: false } }
  ]
});
if (initialStandaloneCount !== 90) {
  throw new Error(`CRITICAL: Expected 90 standalone predictions, found ${initialStandaloneCount}. Execution aborted.`);
}
const initialTotalPreds = await predCol.countDocuments({});
console.log(`✓ Standalone AI predictions verified: exactly ${initialStandaloneCount} (Total predictions in DB: ${initialTotalPreds})`);

// 1.3 Verify AI Inference Service Health
try {
  const healthCheck = await fetch(`${AI_SERVICE_URL}/health`);
  if (!healthCheck.ok) throw new Error(`HTTP ${healthCheck.status}`);
  console.log(`✓ AI Inference Service healthy at ${AI_SERVICE_URL}`);
} catch (err) {
  throw new Error(`CRITICAL: AI Inference Service unreachable at ${AI_SERVICE_URL}: ${err.message}. Execution aborted.`);
}

// 1.4 Load and Revalidate 846 Manifest Candidates
const manifestPath = path.resolve('backend/scripts/phase17_ai_remediation_manifest.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error(`CRITICAL: AI remediation manifest not found at ${manifestPath}. Execution aborted.`);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
if (manifest.length !== 846) {
  throw new Error(`CRITICAL: Manifest must contain exactly 846 records, found ${manifest.length}. Execution aborted.`);
}

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const activeHospIds = new Set(activeHosps.map(h => h._id.toString()));

console.log(`\nRevalidating all ${manifest.length} candidates against live MongoDB Atlas...`);
const candidateApptIds = manifest.map(m => new mongoose.Types.ObjectId(m.appointment_id));
const liveAppts = await apptCol.find({ _id: { $in: candidateApptIds } }).toArray();
const liveApptMap = new Map(liveAppts.map(a => [a._id.toString(), a]));

for (const c of manifest) {
  const live = liveApptMap.get(c.appointment_id);
  if (!live) {
    throw new Error(`CRITICAL: Candidate appointment ${c.appointment_id} not found in database.`);
  }
  if (!activeHospIds.has(live.hospital_id.toString())) {
    throw new Error(`CRITICAL: Candidate appointment ${c.appointment_id} does not belong to active hospital.`);
  }
  if (live.ai_prediction_id) {
    throw new Error(`CRITICAL: Candidate appointment ${c.appointment_id} already has ai_prediction_id: ${live.ai_prediction_id}`);
  }
  const symptoms = (live.reason || c.symptoms || '').trim();
  if (symptoms.length < 3) {
    throw new Error(`CRITICAL: Candidate appointment ${c.appointment_id} has invalid symptom text length.`);
  }
}
console.log(`✓ All 846 candidates 100% revalidated. Zero discrepancies detected.`);

// -----------------------------------------------------------------------------
// 2. Bounded Batch Execution Pipeline
// -----------------------------------------------------------------------------
console.log('\n[Step 2] Executing Bounded Batch AI Inference & Atomic Linkage...');

const BATCH_SIZE = 25;
const executionLog = {
  startedAt: new Date().toISOString(),
  totalCandidates: manifest.length,
  successfulExecutions: 0,
  successfulLinkages: 0,
  failedRecords: [],
  skippedRecords: [],
  batchesProcessed: 0,
  completedAt: null
};

const totalBatches = Math.ceil(manifest.length / BATCH_SIZE);

for (let bIdx = 0; bIdx < totalBatches; bIdx++) {
  const startIdx = bIdx * BATCH_SIZE;
  const endIdx = Math.min(startIdx + BATCH_SIZE, manifest.length);
  const currentBatch = manifest.slice(startIdx, endIdx);

  console.log(`Processing Batch ${bIdx + 1}/${totalBatches} (Records ${startIdx + 1} to ${endIdx})...`);

  for (const item of currentBatch) {
    const liveAppt = liveApptMap.get(item.appointment_id);
    const symptomsText = (liveAppt.reason || item.symptoms).trim();
    const patientMemberId = liveAppt.family_member_id.toString();

    let createdPredictionId = null;

    try {
      // 2.1 Call AI Inference Pipeline
      const aiResponse = await fetch(`${AI_SERVICE_URL}/api/ai/general-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
          'x-user-id': 'phase17_remediation_worker',
          'x-user-role': 'CHAIRMAN',
        },
        body: JSON.stringify({
          family_member_id: patientMemberId,
          text: symptomsText,
          appointment_id: item.appointment_id
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI Service returned HTTP ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      if (!aiData.prediction_id) {
        throw new Error('AI Service did not return prediction_id');
      }

      createdPredictionId = aiData.prediction_id;
      executionLog.successfulExecutions++;

      // 2.2 Atomic Conditional Update on Appointment
      const updateResult = await apptCol.updateOne(
        {
          _id: new mongoose.Types.ObjectId(item.appointment_id),
          $or: [
            { ai_prediction_id: null },
            { ai_prediction_id: { $exists: false } },
            { ai_prediction_id: '' }
          ]
        },
        {
          $set: {
            ai_prediction_id: createdPredictionId,
            updated_at: new Date()
          }
        }
      );

      if (updateResult.modifiedCount !== 1) {
        // Rollback created prediction to prevent orphan record
        await fetch(`${AI_SERVICE_URL}/api/ai/${createdPredictionId}`, {
          method: 'DELETE',
          headers: {
            'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
            'x-user-id': 'phase17_remediation_rollback',
            'x-user-role': 'CHAIRMAN'
          }
        }).catch(() => {});
        throw new Error(`Atomic update failed: modifiedCount=${updateResult.modifiedCount}`);
      }

      executionLog.successfulLinkages++;

    } catch (err) {
      console.error(`❌ Failure on appointment ${item.appointment_id}: ${err.message}`);
      executionLog.failedRecords.push({
        appointment_id: item.appointment_id,
        patient_id: patientMemberId,
        error: err.message
      });
      // Bounded safety: abort on consecutive unrecoverable failures
      if (executionLog.failedRecords.length >= 5) {
        throw new Error(`CRITICAL: 5 failures encountered. Stopping batch execution for safety.`);
      }
    }
  }

  executionLog.batchesProcessed++;
  console.log(`  -> Progress: ${executionLog.successfulLinkages}/${manifest.length} linked (${((executionLog.successfulLinkages / manifest.length) * 100).toFixed(1)}%)`);
}

executionLog.completedAt = new Date().toISOString();
console.log(`\n✓ All batches completed: ${executionLog.successfulLinkages} appointments successfully screened and linked.`);

const logFilePath = path.resolve('backend/scripts/phase17_ai_remediation_execution_log.json');
fs.writeFileSync(logFilePath, JSON.stringify(executionLog, null, 2), 'utf-8');
console.log(`Execution log written to: ${logFilePath}`);

// -------------------------------------------------------------
// 3. Post-Execution Database Verification & Invariant Audit
// -------------------------------------------------------------
console.log('\n[Step 3] Post-Execution Database Verification & Invariant Audit...');

// 3.1 Verify Standalone Predictions Unaltered
const finalStandaloneCount = await predCol.countDocuments({
  $or: [
    { appointment_id: null },
    { appointment_id: '' },
    { appointment_id: { $exists: false } }
  ]
});
if (finalStandaloneCount !== 90) {
  throw new Error(`CRITICAL: Standalone prediction count changed from 90 to ${finalStandaloneCount}`);
}
console.log(`✓ PASS: Standalone AI assessments strictly preserved at exactly ${finalStandaloneCount}.`);

// 3.2 Verify Total Predictions
const finalTotalPreds = await predCol.countDocuments({});
const expectedTotalPreds = initialTotalPreds + 846;
if (finalTotalPreds !== expectedTotalPreds) {
  throw new Error(`CRITICAL: Total predictions expected ${expectedTotalPreds}, got ${finalTotalPreds}`);
}
console.log(`✓ PASS: Total AI predictions in DB: ${finalTotalPreds} (exactly +846 from initial ${initialTotalPreds}).`);

// 3.3 Verify Appointment Statuses Unaltered
const finalStatusCounts = {};
const postAppts = await apptCol.find({ hospital_id: { $in: activeHosps.map(h => h._id) } }).toArray();
postAppts.forEach(a => {
  finalStatusCounts[a.status] = (finalStatusCounts[a.status] || 0) + 1;
});
console.log('Post-Execution Appointment Statuses:', finalStatusCounts);
if (
  finalStatusCounts['COMPLETED'] !== 3945 ||
  finalStatusCounts['CANCELLED'] !== 226 ||
  finalStatusCounts['RESCHEDULED'] !== 176 ||
  finalStatusCounts['NO_SHOW'] !== 35 ||
  finalStatusCounts['CONFIRMED'] !== 412 ||
  finalStatusCounts['BOOKED'] !== 215
) {
  throw new Error('CRITICAL: Appointment status breakdown was altered! Rollback required.');
}
console.log('✓ PASS: All appointment statuses strictly preserved (zero synthetic status changes).');

// 3.4 Verify Intake Attribution Contract Equality (100% Across All Months & Hospitals)
console.log('\n--- Intake Attribution Contract Equality Audit (AI = Total - Walk-ins) ---');
for (const h of activeHosps) {
  const hAppts = postAppts.filter(a => a.hospital_id.toString() === h._id.toString());
  const distinctMonths = [...new Set(hAppts.map(a => {
    const d = a.created_at || a.appointment_date;
    return new Date(d).toISOString().slice(0, 7);
  }))].sort();

  console.log(`\nAuditing ${h.name} (${distinctMonths.length} cohort months):`);
  const rows = [];
  for (const m of distinctMonths) {
    const mAppts = hAppts.filter(a => {
      const d = a.created_at || a.appointment_date;
      return new Date(d).toISOString().slice(0, 7) === m;
    });
    const intake = mAppts.length;
    const walkIns = mAppts.filter(a => a.appointment_type === 'WALK_IN').length;
    const online = intake - walkIns;
    const aiTriaged = mAppts.filter(a => a.appointment_type !== 'WALK_IN' && a.ai_prediction_id).length;
    const shortfall = Math.max(0, online - aiTriaged);
    const satisfied = online === aiTriaged;

    if (!satisfied || shortfall !== 0) {
      throw new Error(`CRITICAL: Equality failed for ${h.name} in ${m}: Online=${online}, AI=${aiTriaged}, Shortfall=${shortfall}`);
    }
    rows.push({ month: m, intake, walkIns, online, aiTriaged, shortfall, satisfied });
  }
  console.table(rows);
}

console.log('\n========================================================================');
console.log('PHASE 17 LIVE AI REMEDIATION OPERATION COMPLETED & 100% VERIFIED!');
console.log('========================================================================\n');

await mongoose.disconnect();
