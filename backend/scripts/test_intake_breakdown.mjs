import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const apptCol = mongoose.connection.collection('appointments');

const breakdown = await apptCol.aggregate([
  {
    $group: {
      _id: {
        hospital_id: '$hospital_id',
        bucket: {
          $dateToString: {
            format: '%Y-%m',
            date: {
              $cond: [
                { $ifNull: ['$created_at', false] },
                '$created_at',
                '$appointment_date'
              ]
            }
          }
        },
        status: '$status',
        type: '$appointment_type'
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { '_id.bucket': 1 } }
]).toArray();

console.log('Breakdown items count:', breakdown.length);
console.log('Sample breakdown item:', breakdown[0]);
await mongoose.disconnect();
