import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function inspectCandidates() {
  console.log('========================================================================');
  console.log('INVESTIGATING 414 PAST UNCLOSED APPOINTMENTS');
  console.log('========================================================================\n');

  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connRec = await mongoose.createConnection(uri, { dbName: 'medimind_records' }).asPromise();
  const connHosp = await mongoose.createConnection(uri, { dbName: 'medimind_hospital' }).asPromise();

  const cutoff = new Date('2026-10-28T00:00:00.000Z');

  const candidates = await connAppt.collection('appointments').find({
    status: { $in: ['CONFIRMED', 'BOOKED', 'RESCHEDULED'] },
    appointment_date: { $lt: cutoff }
  }).sort({ hospital_id: 1, appointment_date: 1 }).toArray();

  console.log(`Total Candidates Found: ${candidates.length} (Expected: 414)`);

  const hospitals = await connHosp.collection('hospitals').find({
    status: { $regex: '^active$', $options: 'i' }
  }).toArray();

  const hospMap = {};
  for (const h of hospitals) hospMap[h._id.toString()] = h.name;

  // Group by hospital and status
  const summaryByHospital = {};
  for (const c of candidates) {
    const hid = c.hospital_id.toString();
    const hname = hospMap[hid] || hid;
    if (!summaryByHospital[hname]) {
      summaryByHospital[hname] = { total: 0, byStatus: {}, byType: {}, withCons: 0, withReplacement: 0, byMonth: {} };
    }
    summaryByHospital[hname].total++;
    summaryByHospital[hname].byStatus[c.status] = (summaryByHospital[hname].byStatus[c.status] || 0) + 1;
    summaryByHospital[hname].byType[c.appointment_type] = (summaryByHospital[hname].byType[c.appointment_type] || 0) + 1;

    const month = c.appointment_date.toISOString().slice(0, 7);
    summaryByHospital[hname].byMonth[month] = (summaryByHospital[hname].byMonth[month] || 0) + 1;

    if (c.replacement_appointment_id) summaryByHospital[hname].withReplacement++;
  }

  console.log('\n--- Summary By Hospital ---');
  console.log(JSON.stringify(summaryByHospital, null, 2));

  // Check clinical record linkages for these 414 candidates
  const candidateIds = candidates.map(c => c._id);
  const candidateIdStrs = candidates.map(c => c._id.toString());

  const linkedConsultations = await connRec.collection('consultations').find({
    $or: [
      { appointment_id: { $in: candidateIds } },
      { appointment_id: { $in: candidateIdStrs } }
    ]
  }).toArray();

  console.log(`\nConsultations directly referencing these 414 candidates: ${linkedConsultations.length}`);
  if (linkedConsultations.length > 0) {
    for (const cons of linkedConsultations) {
      console.log(`  Cons ID: ${cons._id}, Appt Ref: ${cons.appointment_id}, Status: ${cons.status}`);
    }
  }

  // Investigate RESCHEDULED appointments
  const rescheduledCandidates = candidates.filter(c => c.status === 'RESCHEDULED');
  console.log(`\n--- RESCHEDULED Appointments Audit (Total: ${rescheduledCandidates.length}) ---`);
  let hasReplacementCount = 0;
  for (const r of rescheduledCandidates.slice(0, 10)) {
    console.log(`  Appt: ${r._id}, Date: ${r.appointment_date.toISOString().slice(0, 10)}, Hosp: ${hospMap[r.hospital_id.toString()]}, replacement_id: ${r.replacement_appointment_id}`);
    if (r.replacement_appointment_id) {
      hasReplacementCount++;
      const repl = await connAppt.collection('appointments').findOne({ _id: new mongoose.Types.ObjectId(r.replacement_appointment_id) });
      console.log(`    -> Replacement Appt: ${repl?._id}, Status: ${repl?.status}, Date: ${repl?.appointment_date?.toISOString().slice(0, 10)}`);
    }
  }
  console.log(`Total RESCHEDULED with replacement_appointment_id: ${candidates.filter(c => c.status === 'RESCHEDULED' && c.replacement_appointment_id).length} / ${rescheduledCandidates.length}`);

  // Investigate BOOKED vs CONFIRMED
  const bookedCandidates = candidates.filter(c => c.status === 'BOOKED');
  const confirmedCandidates = candidates.filter(c => c.status === 'CONFIRMED');
  console.log(`\n--- BOOKED Appointments Audit (Total: ${bookedCandidates.length}) ---`);
  for (const b of bookedCandidates.slice(0, 5)) {
    console.log(`  Appt: ${b._id}, Date: ${b.appointment_date.toISOString().slice(0, 10)}, Hosp: ${hospMap[b.hospital_id.toString()]}, Reason: ${b.reason}`);
  }

  console.log(`\n--- CONFIRMED Appointments Audit (Total: ${confirmedCandidates.length}) ---`);
  for (const cf of confirmedCandidates.slice(0, 5)) {
    console.log(`  Appt: ${cf._id}, Date: ${cf.appointment_date.toISOString().slice(0, 10)}, Hosp: ${hospMap[cf.hospital_id.toString()]}, Reason: ${cf.reason}`);
  }

  await connAppt.close();
  await connRec.close();
  await connHosp.close();
}

inspectCandidates().catch(console.error);
