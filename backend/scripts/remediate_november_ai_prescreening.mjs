import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';
import path from 'path';

// Load backend environment variables
const envContent = fs.readFileSync('./backend/.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const MONGO_URI = process.env.MONGODB_URI;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5007';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

const isLive = process.argv.includes('--live-execute');
const dryRun = !isLive;

async function run() {
  console.log('========================================================================');
  console.log(`MEDIMIND NOVEMBER AI PRE-SCREENING REMEDIATION (${dryRun ? 'DRY-RUN' : 'LIVE EXECUTION'})`);
  console.log('========================================================================\n');

  if (dryRun) {
    console.log('ℹ️  RUNNING IN SAFE DRY-RUN MODE. Zero database writes will occur.');
    console.log('   Pass --live-execute to apply changes after review.\n');
  } else {
    console.log('⚠️  RUNNING IN LIVE EXECUTION MODE. Backups will be taken before writes.\n');
  }

  const conn = await mongoose.connect(MONGO_URI);
  const apptDb = conn.connection.useDb('medimind_appointment');
  const aiDb = conn.connection.useDb('medimind_ai');
  const hospDb = conn.connection.useDb('medimind_hospital');

  const activeHospitals = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
  const activeIds = activeHospitals.map(h => h._id);
  const hospMap = Object.fromEntries(activeHospitals.map(h => [h._id.toString(), h.name]));

  const novStart = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-11-30T23:59:59.999Z');

  // Query all appointments in November for active facilities
  const appts = await apptDb.collection('appointments').find({
    hospital_id: { $in: activeIds },
    appointment_date: { $gte: novStart, $lte: novEnd }
  }).sort({ hospital_id: 1, appointment_date: 1, start_time: 1 }).toArray();

  console.log(`Found ${appts.length} candidate appointments across active facilities in November.\n`);

  // Batch query all existing predictions
  const existingPredIds = appts.map(a => a.ai_prediction_id).filter(Boolean);
  const existingPreds = await aiDb.collection('predictions').find({
    prediction_id: { $in: existingPredIds }
  }).toArray();
  const validPredMap = new Set(existingPreds.map(p => p.prediction_id));

  // Classify each appointment
  const summary = {
    Harborview: { eligible: [], alreadyLinked: [], genericPlaceholder: [], missingText: [] },
    Aarogyam: { eligible: [], alreadyLinked: [], genericPlaceholder: [], missingText: [] },
    Nexora: { eligible: [], alreadyLinked: [], genericPlaceholder: [], missingText: [] },
  };

  const getHospShort = (hId) => {
    const name = hospMap[hId.toString()] || '';
    if (name.includes('Harborview')) return 'Harborview';
    if (name.includes('Aarogyam')) return 'Aarogyam';
    if (name.includes('Nexora')) return 'Nexora';
    return 'Other';
  };

  const placeholderRegex = /routine clinical consultation|regular check-?up|routine visit|general consultation|consultation$/i;

  for (const a of appts) {
    const hKey = getHospShort(a.hospital_id);
    const reason = (a.reason || '').trim();

    if (a.ai_prediction_id && validPredMap.has(a.ai_prediction_id)) {
      summary[hKey].alreadyLinked.push(a);
      continue;
    }

    if (!reason) {
      summary[hKey].missingText.push(a);
    } else if (placeholderRegex.test(reason) && !reason.includes('(')) {
      summary[hKey].genericPlaceholder.push({ appt: a, reason });
    } else {
      summary[hKey].eligible.push({ appt: a, reason });
    }
  }

  // Print Dry-Run Classification Table
  console.log('------------------------------------------------------------------------');
  console.log('DRY-RUN CLASSIFICATION SUMMARY (BY FACILITY)');
  console.log('------------------------------------------------------------------------');
  const reportRows = Object.entries(summary).map(([name, data]) => ({
    Facility: name,
    Total: data.eligible.length + data.alreadyLinked.length + data.genericPlaceholder.length + data.missingText.length,
    'Already Linked (Valid)': data.alreadyLinked.length,
    'Eligible for AI Inference': data.eligible.length,
    'Review Required: Generic Placeholder': data.genericPlaceholder.length,
    'Excluded: Missing Symptoms': data.missingText.length,
  }));
  console.table(reportRows);

  const totalEligible = Object.values(summary).reduce((acc, s) => acc + s.eligible.length, 0);
  const totalAlreadyLinked = Object.values(summary).reduce((acc, s) => acc + s.alreadyLinked.length, 0);
  const totalGeneric = Object.values(summary).reduce((acc, s) => acc + s.genericPlaceholder.length, 0);

  console.log(`\nTotals:`);
  console.log(`  - Already Linked & Verified in medimind_ai: ${totalAlreadyLinked}`);
  console.log(`  - Eligible for Inference (Specific symptom source): ${totalEligible}`);
  console.log(`  - Flagged Review Required (Generic placeholder): ${totalGeneric}`);

  if (dryRun) {
    console.log('\n✓ Dry run completed. No database modifications made.');
    await conn.disconnect();
    return;
  }

  // LIVE EXECUTION FLOW
  if (totalEligible === 0) {
    console.log('\nAll candidate appointments already possess valid linked predictions. No writes required.');
    await conn.disconnect();
    return;
  }

  // 1. Pre-Write Backup
  const backupDir = path.resolve('./backend/scripts/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const apptBackupPath = path.join(backupDir, `appointments_nov_backup_${ts}.json`);
  const predBackupPath = path.join(backupDir, `predictions_backup_${ts}.json`);

  console.log('\nCreating pre-write backup snapshots:');
  fs.writeFileSync(apptBackupPath, JSON.stringify(appts, null, 2), 'utf8');
  console.log(`✓ Appointments snapshot saved to: ${apptBackupPath}`);

  const currentPreds = await aiDb.collection('predictions').find({}).toArray();
  fs.writeFileSync(predBackupPath, JSON.stringify(currentPreds, null, 2), 'utf8');
  console.log(`✓ Predictions snapshot saved to: ${predBackupPath}`);

  // 2. Controlled Execution
  const createdPredIds = [];
  try {
    for (const [facility, data] of Object.entries(summary)) {
      console.log(`\nProcessing eligible appointments for ${facility} (${data.eligible.length})...`);
      for (const item of data.eligible) {
        const appt = item.appt;
        const text = item.reason;

        // Call internal AI service
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/general-health`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Key': INTERNAL_SECRET,
          },
          body: JSON.stringify({
            family_member_id: appt.family_member_id.toString(),
            text: text,
            appointment_id: appt._id.toString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`AI inference failed for appointment ${appt._id}: ${response.statusText}`);
        }

        const aiData = await response.json();
        createdPredIds.push(aiData.prediction_id);

        // Atomic link to appointment
        await apptDb.collection('appointments').updateOne(
          { _id: appt._id, ai_prediction_id: null },
          { $set: { ai_prediction_id: aiData.prediction_id } }
        );
      }
    }
    console.log(`\n✓ Successfully processed and linked ${createdPredIds.length} predictions.`);
  } catch (err) {
    console.error(`\n❌ Error encountered during execution: ${err.message}`);
    console.log('Initiating rollback of newly generated predictions...');
    for (const pid of createdPredIds) {
      await aiDb.collection('predictions').deleteOne({ prediction_id: pid });
    }
    console.log('Rollback complete. Pre-existing database state preserved.');
    throw err;
  } finally {
    await conn.disconnect();
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
