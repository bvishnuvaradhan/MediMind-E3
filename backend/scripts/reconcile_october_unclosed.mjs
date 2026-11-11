import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function reconcile() {
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connRec = await mongoose.createConnection(uri, { dbName: 'medimind_records' }).asPromise();
  const cutoff = new Date('2026-10-28T00:00:00Z');

  const past = await connAppt.collection('appointments').find({
    appointment_date: { $lt: cutoff },
    status: { $in: ['CONFIRMED', 'BOOKED', 'RESCHEDULED'] }
  }).toArray();

  const hospitals = {
    '6ac85a18074c2bc731a76385': 'Harborview Medical Centre',
    '6ac85a18074c2bc731a76381': 'Aarogyam Multispeciality Hospital',
    '6ac85a18074c2bc731a76383': 'Nexora Advanced Care Hospital'
  };

  console.log(`Total Past Appointments (< 2026-10-28) in CONFIRMED, BOOKED, RESCHEDULED: ${past.length}`);

  // Breakdown by month and status
  const byMonthAndStatus = {};
  for (const a of past) {
    const mth = a.appointment_date.toISOString().slice(0, 7);
    const key = `${mth} | ${a.status}`;
    byMonthAndStatus[key] = (byMonthAndStatus[key] || 0) + 1;
  }
  console.log('\nBreakdown across entire demo history:');
  for (const k of Object.keys(byMonthAndStatus).sort()) {
    console.log(`  ${k} => ${byMonthAndStatus[k]}`);
  }

  // Monthly totals across all 3 statuses
  const monthTotals = {};
  for (const a of past) {
    const mth = a.appointment_date.toISOString().slice(0, 7);
    monthTotals[mth] = (monthTotals[mth] || 0) + 1;
  }
  console.log('\nTotal unclosed per month (March - October):');
  for (const m of Object.keys(monthTotals).sort()) {
    console.log(`  ${m} => ${monthTotals[m]}`);
  }

  // Status breakdown for October alone:
  const octAppts = past.filter(a => a.appointment_date.toISOString().slice(0, 7) === '2026-10');
  console.log(`\nOctober 2026 Past Unclosed Total: ${octAppts.length}`);
  const octStatusCounts = {};
  for (const a of octAppts) {
    octStatusCounts[a.status] = (octStatusCounts[a.status] || 0) + 1;
  }
  console.log('October status counts:', octStatusCounts);

  // October breakdown by hospital:
  const octByHosp = {};
  for (const a of octAppts) {
    const hname = hospitals[a.hospital_id.toString()] || a.hospital_id.toString();
    const key = `${hname} | ${a.status}`;
    octByHosp[key] = (octByHosp[key] || 0) + 1;
  }
  console.log('\nOctober unclosed by hospital:');
  for (const k of Object.keys(octByHosp).sort()) {
    console.log(`  ${k} => ${octByHosp[k]}`);
  }

  // Check consultation records for October unclosed
  const octIds = octAppts.map(a => a._id.toString());
  const consults = await connRec.collection('consultations').find({
    appointment_id: { $in: octIds }
  }).toArray();
  console.log(`\nConsultations found for October unclosed appointments: ${consults.length}`);

  // Summary comparing past history vs October
  const nonOctConfirmed = past.filter(a => a.status === 'CONFIRMED' && a.appointment_date.toISOString().slice(0, 7) !== '2026-10').length;
  const octConfirmed = octStatusCounts.CONFIRMED || 0;
  const octBooked = octStatusCounts.BOOKED || 0;
  console.log('\n--- Reconciliation Math ---');
  console.log(`Total Past CONFIRMED: ${past.filter(a => a.status === 'CONFIRMED').length}`);
  console.log(`  - August CONFIRMED: ${past.filter(a => a.status === 'CONFIRMED' && a.appointment_date.toISOString().slice(0, 7) === '2026-08').length}`);
  console.log(`  - September CONFIRMED: ${past.filter(a => a.status === 'CONFIRMED' && a.appointment_date.toISOString().slice(0, 7) === '2026-09').length}`);
  console.log(`  - October CONFIRMED: ${octConfirmed}`);
  console.log(`Total Past BOOKED: ${past.filter(a => a.status === 'BOOKED').length} (All October: ${octBooked})`);
  console.log(`Total October Unclosed (CONFIRMED + BOOKED): ${octConfirmed + octBooked} = ${octAppts.length}`);

  // Check appointments on October 28 (today) and remainder of October
  const oct28Start = new Date('2026-10-28T00:00:00Z');
  const octEnd = new Date('2026-10-31T23:59:59.999Z');
  const remainingOct = await connAppt.collection('appointments').find({
    appointment_date: { $gte: oct28Start, $lte: octEnd },
    status: { $in: ['CONFIRMED', 'BOOKED'] }
  }).toArray();
  console.log(`\nRemaining October appointments (Oct 28-31): ${remainingOct.length}`);
  const remStatusCounts = {};
  for (const a of remainingOct) {
    remStatusCounts[a.status] = (remStatusCounts[a.status] || 0) + 1;
  }
  console.log('Remaining October status counts:', remStatusCounts);

  // Total unclosed in the entire month of October
  const allOctUnclosed = await connAppt.collection('appointments').find({
    appointment_date: { $gte: new Date('2026-10-01T00:00:00Z'), $lte: octEnd },
    status: { $in: ['CONFIRMED', 'BOOKED'] }
  }).toArray();
  console.log(`\nTotal CONFIRMED + BOOKED in entire month of October: ${allOctUnclosed.length}`);
  const allOctCounts = {};
  for (const a of allOctUnclosed) {
    allOctCounts[a.status] = (allOctCounts[a.status] || 0) + 1;
  }
  console.log('All October counts:', allOctCounts);

  await connAppt.close();
  await connRec.close();
}

reconcile().catch(console.error);
