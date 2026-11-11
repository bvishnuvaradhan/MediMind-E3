import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const apptCol = client.db('medimind_appointment').collection('appointments');
const hospCol = client.db('medimind_hospital').collection('hospitals');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();

const breakdown = await apptCol.aggregate([
  {
    $match: {
      hospital_id: { $in: activeHosps.map(h => h._id) },
      $or: [
        { created_at: { $lte: new Date() } },
        { created_at: { $exists: false }, appointment_date: { $lte: new Date() } }
      ]
    }
  },
  {
    $group: {
      _id: {
        hospital_id: '$hospital_id',
        bucket: {
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
        },
        status: '$status',
        type: '$appointment_type',
        hasAI: { $cond: [{ $ifNull: ['$ai_prediction_id', false] }, true, false] }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { '_id.bucket': 1 } }
]).toArray();

console.log('Total aggregated breakdown records:', breakdown.length);

// Test for Harborview
const hId = '6ac85a18074c2bc731a76385';
const hRecords = breakdown.filter(b => b._id.hospital_id.toString() === hId);
const distinctMonths = [...new Set(hRecords.map(b => b._id.bucket))].sort();

const rows = [];
for (const m of distinctMonths) {
  const mItems = hRecords.filter(b => b._id.bucket === m);
  const intakeVolume = mItems.reduce((s, i) => s + i.count, 0);
  const walkInsCohort = mItems.filter(b => b._id.type === 'WALK_IN').reduce((s, i) => s + i.count, 0);
  const onlineCohort = intakeVolume - walkInsCohort;
  const aiTriagedScans = mItems.filter(b => b._id.type !== 'WALK_IN' && b._id.hasAI).reduce((s, i) => s + i.count, 0);
  const shortfall = Math.max(0, onlineCohort - aiTriagedScans);
  const satisfied = onlineCohort === aiTriagedScans;

  rows.push({
    month: m,
    intakeVolume,
    walkInsCohort,
    onlineCohort,
    aiTriagedScans,
    shortfall,
    satisfied
  });
}

console.log('Harborview Intake Attribution Contract Check:');
console.table(rows);

await mongoose.disconnect();
