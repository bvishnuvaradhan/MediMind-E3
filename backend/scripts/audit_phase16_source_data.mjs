import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
console.log('Connecting to MongoDB URI:', MONGODB_URI.includes('@') ? MONGODB_URI.split('@')[1] : MONGODB_URI);

await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const hospCol = client.db('medimind_hospital').collection('hospitals');
const apptCol = client.db('medimind_appointment').collection('appointments');
const predCol = client.db('medimind_ai').collection('predictions');
const consultCol = client.db('medimind_records').collection('consultations');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const activeHospIds = activeHosps.map(h => h._id.toString());
const hospMap = Object.fromEntries(activeHosps.map(h => [h._id.toString(), h.name]));

console.log('Active Hospitals:', hospMap);

// 1. Total appointments in active facilities
const totalAppts = await apptCol.countDocuments({ hospital_id: { $in: activeHosps.map(h => h._id) } });
console.log('Total Appointments in active hospitals:', totalAppts);

// 2. Total predictions
const totalPreds = await predCol.countDocuments({});
const standalonePreds = await predCol.countDocuments({
  $or: [
    { appointment_id: null },
    { appointment_id: { $exists: false } },
    { is_standalone: true },
    { screening_type: 'STANDALONE_NLP' }
  ]
});
const linkedPreds = await predCol.countDocuments({
  appointment_id: { $ne: null, $exists: true },
  is_standalone: { $ne: true }
});
console.log('Total AI Predictions in medimind_ai:', totalPreds, '(Standalone:', standalonePreds, ', Linked:', linkedPreds, ')');

// 3. Status breakdown across active facilities
const statusBreakdown = await apptCol.aggregate([
  { $match: { hospital_id: { $in: activeHosps.map(h => h._id) } } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
]).toArray();
console.log('Status Breakdown in Active Facilities:', statusBreakdown);

// 4. November Appointments Breakdown
const novAppts = await apptCol.find({
  hospital_id: { $in: activeHosps.map(h => h._id) },
  appointment_date: {
    $gte: new Date('2026-11-01T00:00:00.000Z'),
    $lt: new Date('2026-12-01T00:00:00.000Z')
  }
}).toArray();

console.log(`\nNovember Appointments: ${novAppts.length}`);
const novByHosp = {};
for (const a of novAppts) {
  const hId = a.hospital_id.toString();
  novByHosp[hospMap[hId] || hId] = (novByHosp[hospMap[hId] || hId] || 0) + 1;
}
console.log('November Appointments by Hospital:', novByHosp);

// Check November <= Nov 4, 2026
const cutoffNov4 = new Date('2026-11-04T23:59:59.999Z');
const novOnOrBeforeCutoff = novAppts.filter(a => a.appointment_date <= cutoffNov4);
const novAfterCutoff = novAppts.filter(a => a.appointment_date > cutoffNov4);
console.log(`November <= Nov 4, 2026: ${novOnOrBeforeCutoff.length}`);
console.log(`November > Nov 4, 2026: ${novAfterCutoff.length}`);

// Check statuses of novOnOrBeforeCutoff
const cutoffStatus = {};
for (const a of novOnOrBeforeCutoff) {
  cutoffStatus[a.status] = (cutoffStatus[a.status] || 0) + 1;
}
console.log('Status of appointments scheduled on or before Nov 4:', cutoffStatus);

// Check consultations linked to novOnOrBeforeCutoff
const cutoffApptIds = novOnOrBeforeCutoff.map(a => a._id);
const linkedConsults = await consultCol.find({
  appointment_id: { $in: cutoffApptIds }
}).toArray();
console.log(`Consultations linked to appointments <= Nov 4: ${linkedConsults.length}`);

await mongoose.disconnect();
