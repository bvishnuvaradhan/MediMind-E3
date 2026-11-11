import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const hospCol = client.db('medimind_hospital').collection('hospitals');
const apptCol = client.db('medimind_appointment').collection('appointments');
const consultCol = client.db('medimind_records').collection('consultations');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const hospMap = Object.fromEntries(activeHosps.map(h => [h._id.toString(), h.name]));

const cutoffDate = new Date('2026-11-04T23:59:59.999Z');

// All appointments in active facilities
const apptsDue = await apptCol.find({
  hospital_id: { $in: activeHosps.map(h => h._id) },
  appointment_date: { $lte: cutoffDate }
}).toArray();

const apptsFuture = await apptCol.find({
  hospital_id: { $in: activeHosps.map(h => h._id) },
  appointment_date: { $gt: cutoffDate }
}).toArray();

console.log(`\n======================================================`);
console.log(`NOVEMBER 4, 2026 CUTOFF AUDIT`);
console.log(`======================================================`);
console.log(`Total Active Appointments: ${apptsDue.length + apptsFuture.length}`);
console.log(`Appointments Scheduled ON OR BEFORE Nov 4, 2026: ${apptsDue.length}`);
console.log(`Appointments Scheduled AFTER Nov 4, 2026 (Future Workload): ${apptsFuture.length}`);

// Breakdown of Due Appointments by Status
const dueStatus = {};
for (const a of apptsDue) {
  dueStatus[a.status] = (dueStatus[a.status] || 0) + 1;
}
console.log('\nStatus Breakdown of Due Appointments (<= Nov 4):', dueStatus);

// Breakdown of Future Appointments by Status
const futureStatus = {};
for (const a of apptsFuture) {
  futureStatus[a.status] = (futureStatus[a.status] || 0) + 1;
}
console.log('Status Breakdown of Future Appointments (> Nov 4):', futureStatus);

// Unresolved appointments due (BOOKED or CONFIRMED)
const unresolvedDue = apptsDue.filter(a => ['BOOKED', 'CONFIRMED'].includes(a.status));
console.log(`\nTotal Unresolved Due Appointments: ${unresolvedDue.length}`);

// Breakdown of Unresolved Due by Month and Hospital
const unresolvedByHospMonth = {};
for (const a of unresolvedDue) {
  const ad = a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '';
  const m = ad.slice(0, 7);
  const hname = hospMap[a.hospital_id.toString()] || a.hospital_id;
  const key = `${hname} | ${m}`;
  unresolvedByHospMonth[key] = (unresolvedByHospMonth[key] || 0) + 1;
}
console.table(unresolvedByHospMonth);

// Check if any of these unresolved due appointments have consultations
const unresolvedIds = unresolvedDue.map(a => a._id);
const consults = await consultCol.find({ appointment_id: { $in: unresolvedIds } }).toArray();
console.log(`\nConsultations Found for Unresolved Due Appointments: ${consults.length}`);

// Separate past October unclosed vs Nov 1-4 advance slots
const pastOctUnresolved = unresolvedDue.filter(a => {
  const ad = a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '';
  return ad.slice(0, 7) <= '2026-10';
});

const nov1to4Unresolved = unresolvedDue.filter(a => {
  const ad = a.appointment_date ? (a.appointment_date instanceof Date ? a.appointment_date.toISOString() : a.appointment_date) : '';
  return ad.slice(0, 7) === '2026-11';
});

console.log(`- Past October Unresolved (Scheduled <= Oct 2026): ${pastOctUnresolved.length}`);
console.log(`- Nov 1 to 4 Advance Unresolved: ${nov1to4Unresolved.length}`);

await mongoose.disconnect();
