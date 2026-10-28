import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function rateAudit() {
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connHosp = await mongoose.createConnection(uri, { dbName: 'medimind_hospital' }).asPromise();

  const activeHospitals = await connHosp.collection('hospitals').find({
    status: { $regex: '^active$', $options: 'i' }
  }).toArray();

  const now = new Date('2026-10-28T00:00:00Z');

  console.log('========================================================================');
  console.log('OPERATIONAL RATES RECONCILIATION ACROSS ALL DENOMINATORS');
  console.log('========================================================================\n');

  let netTotalIntake = 0;
  let netPastAppts = 0;
  let netCompleted = 0;
  let netCancelled = 0;
  let netNoShow = 0;
  let netPastPending = 0;
  let netFuture = 0;

  for (const h of activeHospitals) {
    const hid = h._id;
    const totalIntake = await connAppt.collection('appointments').countDocuments({ hospital_id: hid });
    const pastAppts = await connAppt.collection('appointments').countDocuments({ hospital_id: hid, appointment_date: { $lt: now } });
    const futureAppts = await connAppt.collection('appointments').countDocuments({ hospital_id: hid, appointment_date: { $gte: now } });

    const completed = await connAppt.collection('appointments').countDocuments({ hospital_id: hid, status: 'COMPLETED' });
    const cancelled = await connAppt.collection('appointments').countDocuments({ hospital_id: hid, status: { $in: ['CANCELLED', 'CANCELED'] } });
    const noShow = await connAppt.collection('appointments').countDocuments({ hospital_id: hid, status: 'NO_SHOW' });

    // Past appointments that remain unclosed (BOOKED, CONFIRMED, RESCHEDULED with past appointment_date)
    const pastPending = await connAppt.collection('appointments').countDocuments({
      hospital_id: hid,
      status: { $in: ['BOOKED', 'CONFIRMED', 'RESCHEDULED'] },
      appointment_date: { $lt: now }
    });

    netTotalIntake += totalIntake;
    netPastAppts += pastAppts;
    netCompleted += completed;
    netCancelled += cancelled;
    netNoShow += noShow;
    netPastPending += pastPending;
    netFuture += futureAppts;

    console.log(`Facility: ${h.name} (${hid})`);
    console.log(`  Total Intake Bookings:    ${totalIntake}`);
    console.log(`  Eligible Past Appts:      ${pastAppts} (Future/Upcoming Scheduled: ${futureAppts})`);
    console.log(`  Status Breakdown:`);
    console.log(`    Completed:              ${completed}`);
    console.log(`    Cancelled:              ${cancelled}`);
    console.log(`    No-Show:                ${noShow}`);
    console.log(`    Past Unclosed/Pending:  ${pastPending}`);
    console.log(`    Future Scheduled:       ${futureAppts}`);
    console.log(`  Check: ${completed} + ${cancelled} + ${noShow} + ${pastPending} + ${futureAppts} = ${completed + cancelled + noShow + pastPending + futureAppts} (diff=${totalIntake - (completed + cancelled + noShow + pastPending + futureAppts)})`);

    console.log(`  Rates (Denominator: Total Intake Bookings = ${totalIntake}):`);
    console.log(`    Completion Rate:   ${((completed / totalIntake) * 100).toFixed(1)}% (${completed}/${totalIntake})`);
    console.log(`    Cancellation Rate: ${((cancelled / totalIntake) * 100).toFixed(1)}% (${cancelled}/${totalIntake})`);
    console.log(`    No-Show Rate:      ${((noShow / totalIntake) * 100).toFixed(1)}% (${noShow}/${totalIntake})`);

    console.log(`  Rates (Denominator: Eligible Past Appointments = ${pastAppts}):`);
    console.log(`    Completion Rate:   ${((completed / pastAppts) * 100).toFixed(1)}% (${completed}/${pastAppts})`);
    console.log(`    Cancellation Rate: ${((cancelled / pastAppts) * 100).toFixed(1)}% (${cancelled}/${pastAppts})`);
    console.log(`    No-Show Rate:      ${((noShow / pastAppts) * 100).toFixed(1)}% (${noShow}/${pastAppts})`);
    console.log(`    Unclosed Ratio:    ${((pastPending / pastAppts) * 100).toFixed(1)}% (${pastPending}/${pastAppts})\n`);
  }

  console.log('------------------------------------------------------------------------');
  console.log('NETWORK-WIDE OPERATIONAL TOTALS & RATES');
  console.log('------------------------------------------------------------------------');
  console.log(`Network Total Intake Bookings:    ${netTotalIntake}`);
  console.log(`Network Eligible Past Appts:      ${netPastAppts}`);
  console.log(`Network Future/Upcoming Appts:    ${netFuture}`);
  console.log(`Network Completed Consultations:  ${netCompleted}`);
  console.log(`Network Cancelled Bookings:       ${netCancelled}`);
  console.log(`Network No-Show Bookings:         ${netNoShow}`);
  console.log(`Network Past Unclosed/Pending:    ${netPastPending}`);

  console.log(`\nNetwork Rates (Denominator: Total Intake = ${netTotalIntake}):`);
  console.log(`  Completion Rate:   ${((netCompleted / netTotalIntake) * 100).toFixed(1)}%`);
  console.log(`  Cancellation Rate: ${((netCancelled / netTotalIntake) * 100).toFixed(1)}%`);
  console.log(`  No-Show Rate:      ${((netNoShow / netTotalIntake) * 100).toFixed(1)}%`);

  console.log(`\nNetwork Rates (Denominator: Eligible Past = ${netPastAppts}):`);
  console.log(`  Completion Rate:   ${((netCompleted / netPastAppts) * 100).toFixed(1)}%`);
  console.log(`  Cancellation Rate: ${((netCancelled / netPastAppts) * 100).toFixed(1)}%`);
  console.log(`  No-Show Rate:      ${((netNoShow / netPastAppts) * 100).toFixed(1)}%`);
  console.log(`  Unclosed Ratio:    ${((netPastPending / netPastAppts) * 100).toFixed(1)}%`);

  await connAppt.close();
  await connHosp.close();
}

rateAudit().catch(console.error);
