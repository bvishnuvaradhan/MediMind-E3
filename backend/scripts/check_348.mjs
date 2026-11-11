import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function check348vs513() {
  const conn = await mongoose.connect(MONGO_URI);
  const apptDb = conn.connection.useDb('medimind_appointment');
  const apptsCol = apptDb.collection('appointments');

  const hospDb = conn.connection.useDb('medimind_hospital');
  const hosps = await hospDb.collection('hospitals').find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const activeIds = hosps.map(h => h._id);

  console.log('Active Hospital IDs:', activeIds);

  // In getStats, Appointment.aggregate had match:
  // if user is CHAIRMAN without query.hospitalId:
  // match.hospital_id = { $in: activeHosps.map(h => h._id) }
  // And facet was:
  // byHospitalMonthlyScheduled: [
  //   { $group: { _id: { hospital_id: '$hospital_id', bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } } }, count: { $sum: 1 } } }
  // ]

  const aggAll = await apptsCol.aggregate([
    { $match: { hospital_id: { $in: activeIds } } },
    { $group: {
      _id: {
        hospital_id: '$hospital_id',
        bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
      },
      count: { $sum: 1 }
    } },
    { $match: { '_id.bucket': '2026-11' } }
  ]).toArray();

  console.log('Aggregation of November with hospital_id in activeHosps:', aggAll);

  // Check what filter was in appointmentService.js when monthlyTrends produced 348
  // Let's check schedItems in appointmentService.js!
  await conn.disconnect();
}

check348vs513().catch(console.error);
