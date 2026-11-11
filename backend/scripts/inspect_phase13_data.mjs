import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const APPT_DB_NAME = process.env.APPOINTMENT_DB_NAME || 'medimind_appointment';
const AI_DB_NAME = process.env.AI_DB_NAME || 'medimind_ai';
const HOSP_DB_NAME = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';

async function main() {
  const conn = await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const apptDb = conn.connection.useDb(APPT_DB_NAME);
  const apptsCol = apptDb.collection('appointments');
  const aiDb = conn.connection.useDb(AI_DB_NAME);
  const aiCol = aiDb.collection('predictions');
  const hospDb = conn.connection.useDb(HOSP_DB_NAME);
  const hospsCol = hospDb.collection('hospitals');

  const hosps = await hospsCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  console.log('Active hospitals:', hosps.map(h => ({ id: h._id.toString(), name: h.name })));

  // 1. Walk-ins
  const walkinCount = await apptsCol.countDocuments({ appointment_type: 'WALK_IN' });
  console.log('\n--- Walk-in Counts ---');
  console.log('Total WALK_IN count:', walkinCount);

  const walkinByHosp = await apptsCol.aggregate([
    { $match: { appointment_type: 'WALK_IN' } },
    { $group: { _id: '$hospital_id', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Walk-ins by hospital:', walkinByHosp);

  const walkinByMonth = await apptsCol.aggregate([
    { $match: { appointment_type: 'WALK_IN' } },
    { $group: {
      _id: {
        hospital_id: '$hospital_id',
        month: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
      },
      count: { $sum: 1 }
    } },
    { $sort: { '_id.month': 1 } }
  ]).toArray();
  console.log('Walk-ins by hospital and appointment month:', walkinByMonth);

  // 2. Rescheduled
  const rescheduledCount = await apptsCol.countDocuments({ status: 'RESCHEDULED' });
  console.log('\n--- Rescheduled Counts ---');
  console.log('Total status=RESCHEDULED:', rescheduledCount);

  const reschedWithOrig = await apptsCol.countDocuments({ original_appointment_id: { $ne: null } });
  const reschedWithRepl = await apptsCol.countDocuments({ replacement_appointment_id: { $ne: null } });
  console.log('Appointments with original_appointment_id:', reschedWithOrig);
  console.log('Appointments with replacement_appointment_id:', reschedWithRepl);

  const reschedByHosp = await apptsCol.aggregate([
    { $match: { status: 'RESCHEDULED' } },
    { $group: {
      _id: {
        hospital_id: '$hospital_id',
        month: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
      },
      count: { $sum: 1 }
    } },
    { $sort: { '_id.month': 1 } }
  ]).toArray();
  console.log('Rescheduled by hospital & appointment month:', reschedByHosp);

  // Also check rescheduled by created_at month
  const reschedByCreatedMonth = await apptsCol.aggregate([
    { $match: { status: 'RESCHEDULED' } },
    { $group: {
      _id: {
        hospital_id: '$hospital_id',
        month: {
          $dateToString: {
            format: '%Y-%m',
            date: {
              $cond: [
                { $eq: [{ $type: '$created_at' }, 'date'] },
                '$created_at',
                { $ifNull: [{ $dateFromString: { dateString: '$created_at', onError: null } }, '$appointment_date'] }
              ]
            }
          }
        }
      },
      count: { $sum: 1 }
    } },
    { $sort: { '_id.month': 1 } }
  ]).toArray();
  console.log('Rescheduled by hospital & created_at month:', reschedByCreatedMonth);

  // 3. November Bookings
  console.log('\n--- November 2026 Bookings ---');
  const novAppts = await apptsCol.find({
    appointment_date: {
      $gte: new Date('2026-11-01T00:00:00.000Z'),
      $lt: new Date('2026-12-01T00:00:00.000Z')
    }
  }).toArray();
  console.log('November appointment_date total:', novAppts.length);

  const novByHosp = {};
  const novByStatus = {};
  novAppts.forEach(a => {
    const hid = a.hospital_id.toString();
    novByHosp[hid] = (novByHosp[hid] || 0) + 1;
    novByStatus[a.status] = (novByStatus[a.status] || 0) + 1;
  });
  console.log('November by hospital:', novByHosp);
  console.log('November by status:', novByStatus);

  // Check created_at of November appointments
  const novCreatedMonths = {};
  novAppts.forEach(a => {
    const cDate = a.created_at ? new Date(a.created_at).toISOString().slice(0, 7) : 'no_created_at';
    novCreatedMonths[cDate] = (novCreatedMonths[cDate] || 0) + 1;
  });
  console.log('November appointments created_at distribution:', novCreatedMonths);

  // 4. Trace by Month for Each Hospital
  console.log('\n--- Trace by Month across active hospitals ---');
  for (const h of hosps) {
    const hid = h._id;
    console.log(`\n=== Hospital: ${h.name} (${hid}) ===`);
    const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
    for (const m of months) {
      const [y, mo] = m.split('-').map(Number);
      const start = new Date(Date.UTC(y, mo - 1, 1));
      const end = new Date(Date.UTC(y, mo, 1));

      const createdCount = await apptsCol.countDocuments({
        hospital_id: hid,
        created_at: { $gte: start, $lt: end }
      });
      const scheduledCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end }
      });
      const completedCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: 'COMPLETED'
      });
      const cancelledCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: { $in: ['CANCELLED', 'CANCELED'] }
      });
      const reschedCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: 'RESCHEDULED'
      });
      const noShowCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: { $in: ['NO_SHOW', 'NOSHOW'] }
      });
      const walkInCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        appointment_type: 'WALK_IN'
      });
      const pendingCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: { $in: ['BOOKED', 'CONFIRMED', 'SCHEDULED', 'PENDING'] }
      });
      const aiLinkedCount = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        ai_prediction_id: { $type: 'string', $ne: '' }
      });

      if (createdCount > 0 || scheduledCount > 0) {
        console.log(` Month ${m}: Created=${createdCount} | Sched=${scheduledCount} | Completed=${completedCount} | Canc=${cancelledCount} | Resched=${reschedCount} | NoShow=${noShowCount} | WalkIn=${walkInCount} | Pending=${pendingCount} | AI=${aiLinkedCount}`);
      }
    }
  }

  await conn.disconnect();
}

main().catch(console.error);
