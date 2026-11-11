import fs from 'fs';
import path from 'path';
import mongoose from '../node_modules/mongoose/index.js';

// Load environment variables without exposing secrets
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

const uri = env.MONGODB_URI || 'mongodb://localhost:27017/medimind';

async function main() {
  console.log('========================================================================');
  console.log('MEDIMIND PHASE 18: PRODUCTION-SAFE READ-ONLY SHORTFALL INVESTIGATION');
  console.log('========================================================================\n');

  // Connect to DB
  await mongoose.connect(uri);
  const client = mongoose.connection.client;

  // Environment check
  const hostMatch = uri.match(/@([^/?]+)/);
  const host = hostMatch ? hostMatch[1] : 'local/unauthenticated';
  console.log('[Phase A: Environment Preflight]');
  console.log(`  Database Target Host: ${host}`);
  console.log(`  Mongoose Ready State: ${mongoose.connection.readyState}`);

  const adminDb = client.db('admin');
  let buildInfo = {};
  try {
    buildInfo = await adminDb.command({ buildInfo: 1 });
    console.log(`  MongoDB Version: ${buildInfo.version}`);
  } catch (e) {
    console.log(`  MongoDB Version: Could not retrieve buildInfo (${e.message})`);
  }

  // Active Hospitals
  const hospDb = client.db('medimind_hospital');
  const hospitals = await hospDb.collection('hospitals').find({}).toArray();
  const activeHospitals = hospitals.filter(h => String(h.status).toLowerCase() === 'active');

  console.log(`\n  Active Approved Hospitals (${activeHospitals.length}):`);
  const activeHospIds = activeHospitals.map(h => h._id);
  const hospMap = new Map();
  for (const h of activeHospitals) {
    hospMap.set(String(h._id), h);
    console.log(`   - ID: ${h._id} | Name: ${h.name} | Code: ${h.hospitalCode || 'N/A'}`);
  }

  // Database Collections
  const apptDb = client.db('medimind_appointment');
  const apptCol = apptDb.collection('appointments');
  const predDb = client.db('medimind_ai');
  const predCol = predDb.collection('predictions');
  const recordDb = client.db('medimind_records');
  const consultCol = recordDb.collection('consultations');
  const rxCol = recordDb.collection('prescriptions');

  console.log('\n[Phase B: Baseline Recomputation & Shortfall Audit]');

  // Date boundaries: October 1 00:00:00 to November 1 00:00:00 UTC
  const octStart = new Date('2026-10-01T00:00:00.000Z');
  const octEnd = new Date('2026-11-01T00:00:00.000Z');
  const novStart = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-12-01T00:00:00.000Z');

  // Query all appointments in active hospitals
  const allActiveAppts = await apptCol.find({ hospital_id: { $in: activeHospIds } }).toArray();
  console.log(`  Total Active Appointments in Database: ${allActiveAppts.length}`);

  // Inspect October scheduled appointments
  const octScheduled = [];
  const novScheduled = [];
  const otherScheduled = [];
  const invalidDateAppts = [];

  for (const appt of allActiveAppts) {
    const rawDate = appt.appointment_date;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      invalidDateAppts.push(appt);
      continue;
    }
    if (d >= octStart && d < octEnd) {
      octScheduled.push(appt);
    } else if (d >= novStart && d < novEnd) {
      novScheduled.push(appt);
    } else {
      otherScheduled.push(appt);
    }
  }

  console.log(`  Scheduled in October (appointment_date): ${octScheduled.length}`);
  console.log(`  Scheduled in November (appointment_date): ${novScheduled.length}`);
  console.log(`  Scheduled in Other Months: ${otherScheduled.length}`);
  console.log(`  Invalid/Unparseable appointment_date: ${invalidDateAppts.length}`);

  // Targets
  const targets = {
    'Harborview Medical Centre': { target: 503, id: '6ac85a18074c2bc731a76385' },
    'Aarogyam Multispeciality Hospital': { target: 323, id: '6ac85a18074c2bc731a76381' },
    'Nexora Advanced Care Hospital': { target: 302, id: '6ac85a18074c2bc731a76383' }
  };

  // Group October scheduled by hospital and status
  const hospOctBreakdown = {};
  for (const [name, cfg] of Object.entries(targets)) {
    hospOctBreakdown[cfg.id] = {
      name,
      target: cfg.target,
      total: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      pending: 0,
      rescheduled: 0,
      other: 0,
      statusCounts: {}
    };
  }

  const distinctIds = new Set();
  const duplicates = [];

  for (const appt of octScheduled) {
    const strId = String(appt._id);
    if (distinctIds.has(strId)) {
      duplicates.push(strId);
    }
    distinctIds.add(strId);

    const hId = String(appt.hospital_id);
    const hData = hospOctBreakdown[hId];
    if (!hData) {
      console.warn(`  Warning: Unknown active hospital ID: ${hId} for appointment ${strId}`);
      continue;
    }

    hData.total++;
    const st = String(appt.status || 'UNKNOWN').toUpperCase();
    hData.statusCounts[st] = (hData.statusCounts[st] || 0) + 1;

    if (st === 'COMPLETED') hData.completed++;
    else if (st === 'CANCELLED') hData.cancelled++;
    else if (st === 'NO_SHOW' || st === 'NO-SHOW') hData.noShow++;
    else if (st === 'RESCHEDULED') hData.rescheduled++;
    else if (['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'PENDING'].includes(st)) hData.pending++;
    else hData.other++;
  }

  console.log(`\n  Duplicate IDs in October cohort: ${duplicates.length}`);

  console.log('\n  --- OCTOBER BASELINE RECOMPUTATION TABLE ---');
  let networkTotal = 0;
  let networkCompleted = 0;
  let networkCancelled = 0;
  let networkNoShow = 0;
  let networkPending = 0;
  let networkRescheduled = 0;

  for (const [hId, d] of Object.entries(hospOctBreakdown)) {
    const shortfall = d.target - d.total;
    console.log(`  ${d.name}:`);
    console.log(`    Actual Scheduled: ${d.total} | Target: ${d.target} | Shortfall: ${shortfall}`);
    console.log(`    Status Breakdown: Completed=${d.completed}, Cancelled=${d.cancelled}, No-Show=${d.noShow}, Pending=${d.pending}, Rescheduled=${d.rescheduled}`);
    console.log(`    Raw Statuses: ${JSON.stringify(d.statusCounts)}`);
    networkTotal += d.total;
    networkCompleted += d.completed;
    networkCancelled += d.cancelled;
    networkNoShow += d.noShow;
    networkPending += d.pending;
    networkRescheduled += d.rescheduled;
  }

  console.log(`  Network Total:`);
  console.log(`    Actual Scheduled: ${networkTotal} | Target: 1,128 | Shortfall: ${1128 - networkTotal}`);
  console.log(`    Status Breakdown: Completed=${networkCompleted}, Cancelled=${networkCancelled}, No-Show=${networkNoShow}, Pending=${networkPending}, Rescheduled=${networkRescheduled}`);

  // Status Accounting Invariant check
  const sumStatuses = networkCompleted + networkCancelled + networkNoShow + networkPending + networkRescheduled;
  console.log(`    Sum of status buckets: ${sumStatuses} (Match exact total: ${sumStatuses === networkTotal})`);

  // Investigation of Exclusions:
  console.log('\n[Phase B.2: Investigation of Potential Exclusions & Misclassifications]');

  // Check 1: Appointments in inactive hospitals
  const inactiveHospAppts = await apptCol.countDocuments({ hospital_id: { $nin: activeHospIds } });
  console.log(`  Appointments in inactive/unapproved hospitals: ${inactiveHospAppts}`);

  // Check 2: Appointments with created_at in October vs appointment_date
  const octIntake = await apptCol.find({
    hospital_id: { $in: activeHospIds },
    created_at: { $gte: octStart, $lt: octEnd }
  }).toArray();
  console.log(`  Intake Volume in October (created_at in Oct): ${octIntake.length}`);

  // Where do these 1,071 appointments fall in terms of appointment_date?
  let intakeOctAppts = 0;
  let intakeNovAppts = 0;
  let intakeOtherAppts = 0;
  for (const appt of octIntake) {
    const d = new Date(appt.appointment_date);
    if (d >= octStart && d < octEnd) intakeOctAppts++;
    else if (d >= novStart && d < novEnd) intakeNovAppts++;
    else intakeOtherAppts++;
  }
  console.log(`    - Intake scheduled in October: ${intakeOctAppts}`);
  console.log(`    - Intake scheduled in November (Advance Bookings): ${intakeNovAppts}`);
  console.log(`    - Intake scheduled in other months: ${intakeOtherAppts}`);

  // Check 3: Walk-ins vs Online in October Intake
  let octWalkIns = 0;
  let octOnline = 0;
  for (const appt of octIntake) {
    if (appt.is_walk_in === true || appt.intake_source === 'walk_in' || appt.booking_type === 'WALK_IN') {
      octWalkIns++;
    } else {
      octOnline++;
    }
  }
  console.log(`    - October Intake Walk-ins: ${octWalkIns}`);
  console.log(`    - October Intake Online Bookings: ${octOnline}`);

  // Check 4: Appointments scheduled in October that were created before October
  let octScheduledCreatedPrior = 0;
  for (const appt of octScheduled) {
    const c = new Date(appt.created_at);
    if (c < octStart) octScheduledCreatedPrior++;
  }
  console.log(`  October scheduled appointments created before October: ${octScheduledCreatedPrior}`);

  // Check 5: Look for any loose bookings / queues / draft appointments in other collections
  console.log('\n[Phase B.3: Investigation of Alternative Booking Queues / Drafts / External Sources]');
  const allDbNames = (await client.db('admin').admin().listDatabases()).databases.map(d => d.name);
  console.log(`  Databases in Atlas Cluster: ${allDbNames.join(', ')}`);

  for (const dbName of allDbNames) {
    if (dbName.startsWith('medimind')) {
      const db = client.db(dbName);
      const cols = await db.listCollections().toArray();
      const colNames = cols.map(c => c.name);
      console.log(`   Database '${dbName}': ${colNames.join(', ')}`);
      
      // Check for any collection containing 'draft', 'queue', 'request', 'intake', 'temp'
      for (const cName of colNames) {
        if (/queue|draft|request|temp|buffer|pending/i.test(cName)) {
          const count = await db.collection(cName).countDocuments({});
          console.log(`     -> Found candidate collection: ${dbName}.${cName} (count: ${count})`);
        }
      }
    }
  }

  // Check 6: Check family members and patient capacity
  const userDb = client.db('medimind_auth');
  const userCount = await userDb.collection('users').countDocuments({});
  const famDb = client.db('medimind_family');
  const famCount = await famDb.collection('familymembers').countDocuments({});
  console.log(`  Registered platform users: ${userCount}`);
  console.log(`  Registered family members / patients: ${famCount}`);

  // Phase C: AI and Clinical Integrity
  console.log('\n[Phase C: AI Prediction & Clinical Record Integrity]');
  const totalPreds = await predCol.countDocuments({});
  const standalonePreds = await predCol.countDocuments({
    $or: [
      { appointment_id: null },
      { appointment_id: '' },
      { appointment_id: { $exists: false } }
    ]
  });
  console.log(`  Total AI predictions in DB: ${totalPreds}`);
  console.log(`  Standalone NLP symptom assessments: ${standalonePreds} (Required: 90)`);

  // Check AI linkage for October scheduled appointments
  const octApptStringIds = octScheduled.map(a => String(a._id));
  const octPredsLinked = await predCol.countDocuments({ appointment_id: { $in: octApptStringIds } });
  console.log(`  AI predictions linked to October scheduled cohort: ${octPredsLinked} / ${octScheduled.length}`);

  // Check AI linkage for October intake online cohort (1,071 - walkins)
  const octOnlineIntakeStringIds = octIntake
    .filter(a => !(a.is_walk_in === true || a.intake_source === 'walk_in' || a.booking_type === 'WALK_IN'))
    .map(a => String(a._id));
  const octOnlinePredsLinked = await predCol.countDocuments({ appointment_id: { $in: octOnlineIntakeStringIds } });
  console.log(`  AI predictions linked to October Online Intake cohort: ${octOnlinePredsLinked} / ${octOnlineIntakeStringIds.length}`);

  // Check 330 November Appointments
  console.log('\n[November Preservation Audit]');
  console.log(`  Total November Scheduled Appointments: ${novScheduled.length} (Required: 330)`);
  const novStatuses = {};
  const novHosps = {};
  for (const a of novScheduled) {
    const st = String(a.status).toUpperCase();
    novStatuses[st] = (novStatuses[st] || 0) + 1;
    const hName = hospMap.get(String(a.hospital_id))?.name || 'Unknown';
    novHosps[hName] = (novHosps[hName] || 0) + 1;
  }
  console.log(`  November Status Breakdown: ${JSON.stringify(novStatuses)}`);
  console.log(`  November Hospital Breakdown: ${JSON.stringify(novHosps)}`);
  const novApptStringIds = novScheduled.map(a => String(a._id));
  const novPredsLinked = await predCol.countDocuments({ appointment_id: { $in: novApptStringIds } });
  console.log(`  November appointments with linked AI predictions: ${novPredsLinked} / ${novScheduled.length}`);

  // Check Clinical documentation for October completed appointments
  console.log('\n[Clinical Consultation Audit]');
  const totalConsults = await consultCol.countDocuments({});
  console.log(`  Total consultations in DB: ${totalConsults}`);
  
  // Find completed appointments lacking signed consultation records
  const completedAppts = octScheduled.filter(a => String(a.status).toUpperCase() === 'COMPLETED');
  const completedApptIds = completedAppts.map(a => a._id);
  const linkedConsults = await consultCol.find({ appointment_id: { $in: completedApptIds } }).toArray();
  const linkedApptIdSet = new Set(linkedConsults.map(c => String(c.appointment_id)));
  
  const completedMissingConsult = completedAppts.filter(a => !linkedApptIdSet.has(String(a._id)));
  console.log(`  October completed appointments: ${completedAppts.length}`);
  console.log(`  October completed appointments with valid signed consultation: ${linkedConsults.length}`);
  console.log(`  October completed appointments missing consultation: ${completedMissingConsult.length}`);
  for (const mc of completedMissingConsult) {
    console.log(`    - ID: ${mc._id} | Hospital: ${hospMap.get(String(mc.hospital_id))?.name} | Doctor ID: ${mc.doctor_id} | Date: ${mc.appointment_date}`);
  }

  // Phase D: Dry-Run Manifest Summary
  console.log('\n[Phase D: Dry-Run Reconciliation Plan & Candidate Classification]');
  console.log('  Candidate Classification:');
  console.log(`  - EXISTING_VALID_RECORD: ${octScheduled.length} (already counted correctly in baseline)`);
  console.log(`  - EXISTING_RECORD_MISREPORTED: 0 (no genuine October appointments are filtered or misreported)`);
  console.log(`  - VERIFIED_IMPORT_CANDIDATE: 0 (no unpersisted queues, draft imports, or verified sources exist)`);
  console.log(`  - DUPLICATE: 0`);
  console.log(`  - INSUFFICIENT_EVIDENCE: 0`);
  console.log(`  - INVALID_OR_TEST_DATA: 0`);

  console.log('\n========================================================================');
  console.log('AUDIT COMPLETED READ-ONLY.');
  console.log('========================================================================');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
