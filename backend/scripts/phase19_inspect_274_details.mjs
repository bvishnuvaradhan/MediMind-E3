import fs from 'fs';
import path from 'path';
import mongoose from '../node_modules/mongoose/index.js';

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

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const client = mongoose.connection.client;

  const apptCol = client.db('medimind_appointment').collection('appointments');
  const hospCol = client.db('medimind_hospital').collection('hospitals');
  const consultCol = client.db('medimind_records').collection('consultations');
  const rxCol = client.db('medimind_records').collection('prescriptions');
  const medRecordCol = client.db('medimind_records').collection('medicalrecords');

  const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const activeIds = activeHosps.map(h => h._id);
  const hospMap = new Map(activeHosps.map(h => [String(h._id), h.name]));

  const systemDate = new Date('2026-10-29T19:00:00.000Z');
  
  // Find all appointments scheduled <= systemDate that are in pending status
  const unclosed = await apptCol.find({
    hospital_id: { $in: activeIds },
    appointment_date: { $lte: systemDate },
    status: { $in: ['BOOKED', 'CONFIRMED', 'PENDING', 'IN_PROGRESS'] }
  }).sort({ appointment_date: 1 }).toArray();

  console.log(`Total live past unclosed appointments found: ${unclosed.length}`);

  const countsByHosp = {};
  for (const a of unclosed) {
    const h = hospMap.get(String(a.hospital_id)) || 'Unknown';
    countsByHosp[h] = (countsByHosp[h] || 0) + 1;
  }
  console.log('Counts by hospital:', countsByHosp);

  // Check evidence across collections
  const unclosedIds = unclosed.map(a => a._id);
  const unclosedStringIds = unclosed.map(a => String(a._id));

  const consults = await consultCol.find({
    appointment_id: { $in: [...unclosedIds, ...unclosedStringIds] }
  }).toArray();
  const rxs = await rxCol.find({
    appointment_id: { $in: [...unclosedIds, ...unclosedStringIds] }
  }).toArray();
  const records = await medRecordCol.find({
    appointment_id: { $in: [...unclosedIds, ...unclosedStringIds] }
  }).toArray();

  console.log(`Linked Consultations: ${consults.length}`);
  console.log(`Linked Prescriptions: ${rxs.length}`);
  console.log(`Linked Medical Records: ${records.length}`);

  // Check each appointment for any evidence flags
  const classifications = {
    VERIFIED_ATTENDED: [],
    VERIFIED_CANCELLED: [],
    VERIFIED_RESCHEDULED: [],
    VERIFIED_NO_SHOW: [],
    STILL_PENDING: [],
    INSUFFICIENT_EVIDENCE: [],
    CONFLICT_REQUIRES_REVIEW: []
  };

  for (const a of unclosed) {
    const id = String(a._id);
    const hasConsult = consults.some(c => String(c.appointment_id) === id);
    const hasRx = rxs.some(r => String(r.appointment_id) === id);
    const hasRecord = records.some(m => String(m.appointment_id) === id);
    const hasCheckIn = !!(a.check_in_time || a.checkin_time || a.attended_at || a.attendance_status === 'ATTENDED');
    const hasCancelInfo = !!(a.cancelled_at || a.cancellation_reason || a.cancelled_by);
    const hasReschedInfo = !!(a.rescheduled_at || a.original_appointment_id || a.replacement_appointment_id);
    const hasNoShowInfo = !!(a.no_show_at || a.no_show_reason);

    const d = new Date(a.appointment_date);

    if (hasConsult || hasRx || hasRecord || hasCheckIn) {
      classifications.VERIFIED_ATTENDED.push(a);
    } else if (hasCancelInfo) {
      classifications.VERIFIED_CANCELLED.push(a);
    } else if (hasReschedInfo) {
      classifications.VERIFIED_RESCHEDULED.push(a);
    } else if (hasNoShowInfo) {
      classifications.VERIFIED_NO_SHOW.push(a);
    } else if (d > systemDate) {
      classifications.STILL_PENDING.push(a);
    } else {
      // Past scheduled date with NO check-in, NO cancellation, NO consultation
      classifications.INSUFFICIENT_EVIDENCE.push(a);
    }
  }

  console.log('\n--- Classification Counts ---');
  for (const [k, v] of Object.entries(classifications)) {
    console.log(`${k}: ${v.length}`);
  }

  // Sample date distribution of INSUFFICIENT_EVIDENCE
  const dateDist = {};
  for (const a of classifications.INSUFFICIENT_EVIDENCE) {
    const dStr = a.appointment_date?.toISOString().slice(0, 10);
    dateDist[dStr] = (dateDist[dStr] || 0) + 1;
  }
  console.log('\nDate Distribution of INSUFFICIENT_EVIDENCE (past unclosed):', dateDist);

  await mongoose.disconnect();
}
run();
