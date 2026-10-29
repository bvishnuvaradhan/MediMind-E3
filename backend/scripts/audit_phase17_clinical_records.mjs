import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const apptCol = client.db('medimind_appointment').collection('appointments');
const consultCol = client.db('medimind_records').collection('consultations');
const rxCol = client.db('medimind_records').collection('prescriptions');
const hospCol = client.db('medimind_hospital').collection('hospitals');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const activeHospIds = activeHosps.map(h => h._id);

console.log('Active Hospitals:', activeHosps.map(h => `${h.name} (${h._id})`));

// Inspect consultations schema sample
const sampleConsult = await consultCol.findOne({});
console.log('\nSample Consultation Fields:', Object.keys(sampleConsult || {}));
console.log('Sample Consultation Statuses:', await consultCol.distinct('status'));

// Inspect prescriptions schema sample
const sampleRx = await rxCol.findOne({});
console.log('\nSample Prescription Fields:', Object.keys(sampleRx || {}));
console.log('Sample Prescription Statuses:', await rxCol.distinct('status'));

// Audit total appointments
const allAppts = await apptCol.find({ hospital_id: { $in: activeHospIds } }).toArray();
console.log(`\nTotal Active Appointments: ${allAppts.length}`);

// Group by status
const statusCounts = {};
allAppts.forEach(a => {
  statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
});
console.log('Status Counts:', statusCounts);

// Audit consultations mapping
const allConsults = await consultCol.find({}).toArray();
console.log(`\nTotal Consultations in DB: ${allConsults.length}`);

// Map consultations by appointment_id
const consultsByApptId = new Map();
allConsults.forEach(c => {
  const apptId = c.appointment_id?.toString();
  if (apptId) {
    if (!consultsByApptId.has(apptId)) consultsByApptId.set(apptId, []);
    consultsByApptId.get(apptId).push(c);
  }
});

console.log(`Distinct Appointment IDs referenced in consultations: ${consultsByApptId.size}`);

// Check COMPLETED appointments vs consultations
const completedAppts = allAppts.filter(a => a.status === 'COMPLETED');
const completedWithoutConsult = completedAppts.filter(a => !consultsByApptId.has(a._id.toString()));
console.log(`Completed appointments without consultation: ${completedWithoutConsult.length}`);

if (completedWithoutConsult.length > 0) {
  console.log('Completed appointments without consultation details:');
  console.table(completedWithoutConsult.map(a => ({
    id: a._id.toString(),
    hosp: a.hospital_id.toString(),
    date: a.appointment_date?.toISOString?.().slice(0, 10),
    type: a.appointment_type,
    created: a.created_at?.toISOString?.().slice(0, 10)
  })));
}

// Check if any consultations reference non-completed appointments
const nonCompletedWithConsult = allAppts.filter(a => a.status !== 'COMPLETED' && consultsByApptId.has(a._id.toString()));
console.log(`Non-completed appointments with consultation: ${nonCompletedWithConsult.length}`);
if (nonCompletedWithConsult.length > 0) {
  console.table(nonCompletedWithConsult.map(a => ({
    id: a._id.toString(),
    status: a.status,
    consults: consultsByApptId.get(a._id.toString()).length
  })));
}

// Check consultations whose appointment_id is not in active appointments
const orphanConsults = allConsults.filter(c => {
  const apptId = c.appointment_id?.toString();
  return !allAppts.some(a => a._id.toString() === apptId);
});
console.log(`Consultations not matching active appointments: ${orphanConsults.length}`);
if (orphanConsults.length > 0) {
  console.log('Orphan consult samples:', orphanConsults.slice(0, 5).map(c => ({
    id: c._id.toString(),
    appointment_id: c.appointment_id,
    doctor_id: c.doctor_id,
    date: c.created_at || c.consultation_date
  })));
}

// Check Prescriptions mapping to Consultations & Appointments
const allRx = await rxCol.find({}).toArray();
console.log(`\nTotal Prescriptions in DB: ${allRx.length}`);
const rxByConsultId = new Map();
allRx.forEach(r => {
  const cId = r.consultation_id?.toString();
  if (cId) {
    if (!rxByConsultId.has(cId)) rxByConsultId.set(cId, []);
    rxByConsultId.get(cId).push(r);
  }
});
console.log(`Distinct Consultation IDs referenced in prescriptions: ${rxByConsultId.size}`);

// Check Cutoff <= Nov 4, 2026
const cutoff = new Date('2026-11-04T23:59:59.999Z');
const dueAppts = allAppts.filter(a => new Date(a.appointment_date) <= cutoff);
const futureAppts = allAppts.filter(a => new Date(a.appointment_date) > cutoff);
console.log(`\nAppointments <= Cutoff (Nov 4): ${dueAppts.length}`);
console.log(`Appointments > Cutoff (Future): ${futureAppts.length}`);

// Check the 345 unresolved appointments (BOOKED, CONFIRMED, PENDING <= Nov 4)
const unresolvedDue = dueAppts.filter(a => ['BOOKED', 'CONFIRMED', 'PENDING'].includes(a.status));
console.log(`Unresolved Due Appointments: ${unresolvedDue.length}`);

// Check if ANY of the 345 have consultations, prescriptions, check-in, or attendance evidence
let consultsForUnresolved = 0;
let rxForUnresolved = 0;
let attendanceEvidenceCount = 0;

unresolvedDue.forEach(a => {
  const aId = a._id.toString();
  if (consultsByApptId.has(aId)) consultsForUnresolved++;
  if (a.check_in_time || a.checked_in || a.attended || a.vitals || a.encounter_id) attendanceEvidenceCount++;
});

console.log(`Consultations found for 345 unresolved: ${consultsForUnresolved}`);
console.log(`Attendance/Check-in fields found on 345 unresolved: ${attendanceEvidenceCount}`);

await mongoose.disconnect();
