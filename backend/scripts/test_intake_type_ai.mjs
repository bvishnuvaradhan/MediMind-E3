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
        type: '$appointment_type',
        hasAI: { $cond: [{ $ifNull: ['$ai_prediction_id', false] }, true, false] }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { '_id.bucket': 1 } }
]).toArray();

const byBucket = {};
for (const b of breakdown) {
  const m = b._id.bucket;
  if (!byBucket[m]) byBucket[m] = {
    total: 0,
    walkIns: 0,
    onlineTotal: 0,
    onlineWithAI: 0,
    onlineWithoutAI: 0,
    walkInWithAI: 0
  };
  byBucket[m].total += b.count;
  const isWalkIn = b._id.type === 'WALK_IN';
  if (isWalkIn) {
    byBucket[m].walkIns += b.count;
    if (b._id.hasAI) byBucket[m].walkInWithAI += b.count;
  } else {
    byBucket[m].onlineTotal += b.count;
    if (b._id.hasAI) byBucket[m].onlineWithAI += b.count;
    else byBucket[m].onlineWithoutAI += b.count;
  }
}

console.table(Object.entries(byBucket).map(([m, s]) => ({
  month: m,
  totalBookings: s.total,
  walkIns: s.walkIns,
  onlineBookings: s.onlineTotal,
  onlineWithAI: s.onlineWithAI,
  walkInWithAI: s.walkInWithAI,
  unscreenedOnline: s.onlineWithoutAI,
  equalitySatisfied: s.onlineTotal === s.onlineWithAI
})));

await mongoose.disconnect();
