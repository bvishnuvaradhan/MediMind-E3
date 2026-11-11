import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const apptCol = mongoose.connection.client.db('medimind_appointment').collection('appointments');
const hospCol = mongoose.connection.client.db('medimind_hospital').collection('hospitals');

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

console.log('Facet breakdown entries:', breakdown.length);

// Summarize by bucket and hasAI
const byBucket = {};
for (const b of breakdown) {
  const m = b._id.bucket;
  if (!byBucket[m]) byBucket[m] = { total: 0, walkIns: 0, withAI: 0, withoutAI: 0 };
  byBucket[m].total += b.count;
  if (b._id.type === 'WALK_IN') byBucket[m].walkIns += b.count;
  if (b._id.hasAI) byBucket[m].withAI += b.count;
  else byBucket[m].withoutAI += b.count;
}

console.table(Object.entries(byBucket).map(([m, stats]) => ({
  month: m,
  totalBookings: stats.total,
  walkIns: stats.walkIns,
  expectedAI: stats.total - stats.walkIns,
  actualWithAI: stats.withAI,
  shortfall: (stats.total - stats.walkIns) - stats.withAI,
  satisfied: (stats.total - stats.walkIns) === stats.withAI
})));

await mongoose.disconnect();
