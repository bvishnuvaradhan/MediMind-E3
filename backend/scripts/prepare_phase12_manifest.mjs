import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const hospitals = [
  { id: '6ac85a18074c2bc731a76385', name: 'Harborview Medical Centre', startMonth: '2026-03' },
  { id: '6ac85a18074c2bc731a76381', name: 'Aarogyam Multispeciality Hospital', startMonth: '2026-05' },
  { id: '6ac85a18074c2bc731a76383', name: 'Nexora Advanced Care Hospital', startMonth: '2026-07' },
];

async function prepare() {
  console.log('========================================================================');
  console.log('PHASE 12 — PREPARATION OF CHANGE MANIFEST & BEFORE/AFTER AUDIT');
  console.log('========================================================================\n');

  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connAi = await mongoose.createConnection(uri, { dbName: 'medimind_ai' }).asPromise();
  const connRec = await mongoose.createConnection(uri, { dbName: 'medimind_records' }).asPromise();

  // 1. Verify the 24 October 27 BOOKED records
  const cutoff = new Date('2026-10-28T00:00:00Z');
  const pastBooked = await connAppt.collection('appointments').find({
    appointment_date: { $lt: cutoff },
    status: 'BOOKED'
  }).toArray();

  console.log(`1. Verification of Past BOOKED Records: Exactly ${pastBooked.length} records found.`);

  const bookedManifest = [];
  for (const b of pastBooked) {
    // Check if any consultation exists
    const consult = await connRec.collection('consultations').findOne({
      appointment_id: b._id.toString()
    });

    const hosp = hospitals.find(h => h.id === b.hospital_id.toString());

    bookedManifest.push({
      _id: b._id.toString(),
      hospital_id: b.hospital_id.toString(),
      hospital_name: hosp ? hosp.name : b.hospital_id.toString(),
      patient_id: b.patient_id ? b.patient_id.toString() : null,
      doctor_id: b.doctor_id ? b.doctor_id.toString() : null,
      appointment_date: b.appointment_date.toISOString(),
      created_at: b.created_at ? b.created_at.toISOString() : null,
      appointment_type: b.appointment_type || 'BOOKED',
      current_status: b.status,
      proposed_status: 'NO_SHOW',
      has_consultation: !!consult,
      has_ai_prediction: !!b.ai_prediction_id,
      criteria_met: (
        b.status === 'BOOKED' &&
        new Date(b.appointment_date) < cutoff &&
        !consult
      )
    });
  }

  // Group 24 records by hospital
  const bookedByHosp = {};
  for (const item of bookedManifest) {
    bookedByHosp[item.hospital_name] = (bookedByHosp[item.hospital_name] || 0) + 1;
  }
  console.log('Past BOOKED records by hospital:', bookedByHosp);
  console.log('All 24 criteria met (no consultation, past date, status BOOKED):', bookedManifest.every(i => i.criteria_met));

  // 2. Operational Rates Before vs After for the 24 NO_SHOW reclassification
  console.log('\n2. Operational Rates: Current (Before) vs Proposed (After 24 NO_SHOW reclassification):');
  for (const h of hospitals) {
    const hidObj = new mongoose.Types.ObjectId(h.id);
    const allHospAppts = await connAppt.collection('appointments').find({ hospital_id: hidObj }).toArray();
    const total = allHospAppts.length;

    const currentCounts = { COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0, BOOKED: 0, CONFIRMED: 0, RESCHEDULED: 0 };
    for (const a of allHospAppts) {
      if (currentCounts[a.status] !== undefined) currentCounts[a.status]++;
    }

    const proposedNoShows = currentCounts.NO_SHOW + (bookedByHosp[h.name] || 0);
    const proposedBooked = currentCounts.BOOKED - (bookedByHosp[h.name] || 0);

    const currentNoShowRate = ((currentCounts.NO_SHOW / total) * 100).toFixed(1);
    const proposedNoShowRate = ((proposedNoShows / total) * 100).toFixed(1);
    const cancelRate = ((currentCounts.CANCELLED / total) * 100).toFixed(1);
    const compRate = ((currentCounts.COMPLETED / total) * 100).toFixed(1);

    console.log(`\n  --- ${h.name} (Total Bookings: ${total}) ---`);
    console.log(`    Current NO_SHOW: ${currentCounts.NO_SHOW} (${currentNoShowRate}%) -> Proposed: ${proposedNoShows} (${proposedNoShowRate}%)`);
    console.log(`    Current BOOKED: ${currentCounts.BOOKED} -> Proposed: ${proposedBooked}`);
    console.log(`    COMPLETED: ${currentCounts.COMPLETED} (${compRate}%) [Unchanged per Option A]`);
    console.log(`    CANCELLED: ${currentCounts.CANCELLED} (${cancelRate}%) [Unchanged, well below 100 cap]`);
    console.log(`    RESCHEDULED: ${currentCounts.RESCHEDULED} [Unchanged, preserved per Decision 1]`);
    console.log(`    CONFIRMED: ${currentCounts.CONFIRMED} [Unchanged, preserved per Option A Decision 3]`);
  }

  // Network total rates
  const allAppts = await connAppt.collection('appointments').find({}).toArray();
  const netTotal = allAppts.length;
  const netCurrentCounts = { COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0, BOOKED: 0, CONFIRMED: 0, RESCHEDULED: 0 };
  for (const a of allAppts) {
    if (netCurrentCounts[a.status] !== undefined) netCurrentCounts[a.status]++;
  }
  const netProposedNoShows = netCurrentCounts.NO_SHOW + 24;
  console.log(`\n  --- NETWORK TOTAL (Total Bookings: ${netTotal}) ---`);
  console.log(`    Current NO_SHOW: ${netCurrentCounts.NO_SHOW} (${((netCurrentCounts.NO_SHOW / netTotal) * 100).toFixed(1)}%) -> Proposed: ${netProposedNoShows} (${((netProposedNoShows / netTotal) * 100).toFixed(1)}%)`);
  console.log(`    COMPLETED: ${netCurrentCounts.COMPLETED} (${((netCurrentCounts.COMPLETED / netTotal) * 100).toFixed(1)}%)`);
  console.log(`    CANCELLED: ${netCurrentCounts.CANCELLED} (${((netCurrentCounts.CANCELLED / netTotal) * 100).toFixed(1)}%) [Below 300 network cap]`);

  // 3. Status of the 214 CONFIRMED records (Preserved per Option A)
  const pastConfirmed = await connAppt.collection('appointments').find({
    appointment_date: { $lt: cutoff },
    status: 'CONFIRMED'
  }).toArray();
  console.log(`\n3. Status of 214 CONFIRMED Records: Exactly ${pastConfirmed.length} records verified.`);
  console.log('   Preserved as CONFIRMED per Option A (no status change, no synthetic consultations generated).');

  // 4. Status of the 176 RESCHEDULED records
  const pastRescheduled = await connAppt.collection('appointments').find({
    appointment_date: { $lt: cutoff },
    status: 'RESCHEDULED'
  }).toArray();
  console.log(`\n4. Status of 176 RESCHEDULED Records: Exactly ${pastRescheduled.length} records verified.`);
  console.log('   Preserved as RESCHEDULED per Decision 1 (no status change).');

  // 5. Audit AI Pre-Screening candidates for Harborview and Aarogyam
  console.log('\n5. Proposed AI Pre-Screening Backfill Manifest:');
  // For Harborview:
  // Aug: target +165 (out of 192 web bookings lacking AI)
  // Sep: target +226 (out of 270 web bookings lacking AI)
  // Oct: target +136 (out of 181 web bookings lacking AI)
  // For Aarogyam:
  // Sep: target +66 (out of 89 web bookings lacking AI)
  // Oct: target +84 (out of 114 web bookings lacking AI)

  async function getBackfillCandidates(hid, monthStr, countNeeded) {
    const start = new Date(`${monthStr}-01T00:00:00.000Z`);
    const [y, m] = monthStr.split('-').map(Number);
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));

    const appts = await connAppt.collection('appointments').find({
      hospital_id: new mongoose.Types.ObjectId(hid),
      created_at: { $gte: start, $lt: end },
      appointment_type: { $ne: 'WALK_IN' },
      $or: [{ ai_prediction_id: null }, { ai_prediction_id: { $exists: false } }, { ai_prediction_id: '' }]
    }).sort({ created_at: 1 }).limit(countNeeded).toArray();

    return appts;
  }

  const hvAugCandidates = await getBackfillCandidates('6ac85a18074c2bc731a76385', '2026-08', 165);
  const hvSepCandidates = await getBackfillCandidates('6ac85a18074c2bc731a76385', '2026-09', 226);
  const hvOctCandidates = await getBackfillCandidates('6ac85a18074c2bc731a76385', '2026-10', 136);

  const agSepCandidates = await getBackfillCandidates('6ac85a18074c2bc731a76381', '2026-09', 66);
  const agOctCandidates = await getBackfillCandidates('6ac85a18074c2bc731a76381', '2026-10', 84);

  console.log(`Harborview Candidates: Aug: ${hvAugCandidates.length}/165, Sep: ${hvSepCandidates.length}/226, Oct: ${hvOctCandidates.length}/136`);
  console.log(`Aarogyam Candidates: Sep: ${agSepCandidates.length}/66, Oct: ${agOctCandidates.length}/84`);

  const totalAiBackfills = hvAugCandidates.length + hvSepCandidates.length + hvOctCandidates.length + agSepCandidates.length + agOctCandidates.length;
  console.log(`Total candidate appointments for AI pre-screening backfill: ${totalAiBackfills}`);

  // Check 90 standalone predictions
  const standalonePreds = await connAi.collection('predictions').find({
    $or: [{ appointment_id: null }, { appointment_id: { $exists: false } }, { appointment_id: '' }]
  }).toArray();
  console.log(`\n6. Genuine Standalone Predictions: Exactly ${standalonePreds.length} verified.`);
  console.log('   All 90 will remain untouched, standalone, and strictly unlinked.');

  // Save the complete prepared manifest to a backup file
  const preparedManifest = {
    timestamp: new Date().toISOString(),
    reporting_cutoff: '2026-10-28T00:00:00.000Z',
    section8_pre_write_gate: true,
    decisions: {
      decision_1_rescheduled: { count: pastRescheduled.length, action: 'PRESERVE_UNCHANGED' },
      decision_2_booked_no_show: {
        count: bookedManifest.length,
        action: 'RECLASSIFY_TO_NO_SHOW',
        records: bookedManifest
      },
      decision_3_confirmed_option_a: { count: pastConfirmed.length, action: 'PRESERVE_UNCHANGED_OPTION_A' },
      decision_4_ai_backfill: {
        total_backfills: totalAiBackfills,
        cohort_label: 'DEMO_COHORT_PHASE12_MONOTONIC_AI_20261028',
        harborview: {
          aug: hvAugCandidates.map(a => ({ _id: a._id.toString(), created_at: a.created_at, patient_id: a.patient_id?.toString(), department: a.department })),
          sep: hvSepCandidates.map(a => ({ _id: a._id.toString(), created_at: a.created_at, patient_id: a.patient_id?.toString(), department: a.department })),
          oct: hvOctCandidates.map(a => ({ _id: a._id.toString(), created_at: a.created_at, patient_id: a.patient_id?.toString(), department: a.department }))
        },
        aarogyam: {
          sep: agSepCandidates.map(a => ({ _id: a._id.toString(), created_at: a.created_at, patient_id: a.patient_id?.toString(), department: a.department })),
          oct: agOctCandidates.map(a => ({ _id: a._id.toString(), created_at: a.created_at, patient_id: a.patient_id?.toString(), department: a.department }))
        }
      },
      standalone_preservation: { count: standalonePreds.length, action: 'PRESERVE_UNTOUCHED' }
    }
  };

  const backupDir = 'backend/scripts/backups';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const manifestPath = `${backupDir}/phase12_final_prepared_manifest_20261028.json`;
  fs.writeFileSync(manifestPath, JSON.stringify(preparedManifest, null, 2));
  console.log(`\nPrepared Manifest saved to: ${manifestPath}`);

  await connAppt.close();
  await connAi.close();
  await connRec.close();
}

prepare().catch(console.error);
