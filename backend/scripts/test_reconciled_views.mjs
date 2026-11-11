import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';

const envContent = fs.readFileSync('./backend/.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const apptDb = mongoose.connection.useDb('medimind_appointment');
const aiDb = mongoose.connection.useDb('medimind_ai');
const hospDb = mongoose.connection.useDb('medimind_hospital');

const hosps = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
const hospMap = Object.fromEntries(hosps.map(h => [h._id.toString(), h.name]));
const activeIds = hosps.map(h => h._id);

console.log('Active hospitals:', hospMap);

// Fetch all appointments for active facilities
const appts = await apptDb.collection('appointments').find({
  hospital_id: { $in: activeIds }
}).toArray();

console.log(`Total appointments fetched: ${appts.length}`);

// Fetch all AI predictions
const preds = await aiDb.collection('predictions').find({}).toArray();
console.log(`Total AI predictions fetched: ${preds.length}`);

// Map predictions by appointment_id and prediction_id
const predByApptId = new Map();
const predById = new Map();
for (const p of preds) {
  if (p.prediction_id) predById.set(p.prediction_id, p);
  if (p.appointment_id) predByApptId.set(p.appointment_id.toString(), p);
}

// Build monthly data for each hospital
const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

for (const [hid, hname] of Object.entries(hospMap)) {
  console.log(`\n========================================================================`);
  console.log(`HOSPITAL: ${hname} (${hid})`);
  console.log(`========================================================================`);

  const hAppts = appts.filter(a => a.hospital_id.toString() === hid);

  console.log('\n--- VIEW 1: SCHEDULED WORKLOAD (BY APPOINTMENT DATE) ---');
  console.log('Reconciliation Formula: Total Scheduled = Completed + Cancelled + Rescheduled + No-Show + Pending');

  const schedRows = [];

  for (const m of months) {
    const mAppts = hAppts.filter(a => a.appointment_date && a.appointment_date.toISOString().slice(0, 7) === m);
    if (mAppts.length === 0 && m < '2026-07' && hname.includes('Nexora')) continue;
    if (mAppts.length === 0 && m < '2026-05' && hname.includes('Aarogyam')) continue;

    const totalScheduled = mAppts.length;
    const completed = mAppts.filter(a => a.status === 'COMPLETED').length;
    const cancelled = mAppts.filter(a => a.status === 'CANCELLED' || a.status === 'CANCELED').length;
    const rescheduled = mAppts.filter(a => a.status === 'RESCHEDULED').length;
    const noShow = mAppts.filter(a => a.status === 'NO_SHOW' || a.status === 'NOSHOW').length;
    const walkIns = mAppts.filter(a => a.appointment_type === 'WALK_IN').length;
    const pending = totalScheduled - completed - cancelled - rescheduled - noShow;

    const balanced = totalScheduled === (completed + cancelled + rescheduled + noShow + pending);

    // AI scans whose prediction actually executed in month m for this hospital
    // Count predictions where created_at month is m
    let aiRunsInMonth = 0;
    for (const a of hAppts) {
      if (a.ai_prediction_id) {
        const p = predById.get(a.ai_prediction_id);
        if (p && p.created_at) {
          const pM = (typeof p.created_at === 'string' ? p.created_at : p.created_at.toISOString()).slice(0, 7);
          if (pM === m) aiRunsInMonth++;
        }
      }
    }

    const completionRate = m > '2026-10' ? 'N/A' : (totalScheduled > 0 ? ((completed / totalScheduled) * 100).toFixed(1) + '%' : '0.0%');
    const noShowRate = m > '2026-10' ? 'N/A' : (totalScheduled > 0 ? ((noShow / totalScheduled) * 100).toFixed(1) + '%' : '0.0%');
    const status = m > '2026-10' ? 'Future Workload' : (m === '2026-10' ? 'MTD In Progress' : 'Closed Cycle');

    schedRows.push({
      Period: m,
      'Total Sched': totalScheduled,
      Completed: completed,
      'Comp Rate': completionRate,
      Cancelled: cancelled,
      Rescheduled: rescheduled,
      'No-Show': noShow,
      'No-Show Rate': noShowRate,
      Pending: pending,
      'Walk-ins': walkIns,
      'AI Scans (Exec Month)': aiRunsInMonth,
      Balanced: balanced ? 'TRUE' : 'FALSE',
      Status: status,
    });
  }

  console.table(schedRows);

  console.log('\n--- VIEW 2: BOOKING INTAKE (BY CREATION DATE) ---');
  const intakeRows = [];

  for (const m of months) {
    const mIntake = hAppts.filter(a => {
      const cd = a.created_at ? (a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at) : '';
      return cd.slice(0, 7) === m;
    });
    if (mIntake.length === 0 && m < '2026-07' && hname.includes('Nexora')) continue;
    if (mIntake.length === 0 && m < '2026-05' && hname.includes('Aarogyam')) continue;

    const intakeVolume = mIntake.length;
    const completed = mIntake.filter(a => a.status === 'COMPLETED').length;
    const cancelled = mIntake.filter(a => a.status === 'CANCELLED').length;
    const rescheduled = mIntake.filter(a => a.status === 'RESCHEDULED').length;
    const noShow = mIntake.filter(a => a.status === 'NO_SHOW').length;
    const walkIns = mIntake.filter(a => a.appointment_type === 'WALK_IN').length;
    const pending = intakeVolume - completed - cancelled - rescheduled - noShow;

    intakeRows.push({
      Period: m,
      'Intake Volume': intakeVolume,
      Completed: completed,
      Cancelled: cancelled,
      Rescheduled: rescheduled,
      'No-Show': noShow,
      Pending: pending,
      'Walk-ins': walkIns,
    });
  }

  console.table(intakeRows);
}

await mongoose.disconnect();
