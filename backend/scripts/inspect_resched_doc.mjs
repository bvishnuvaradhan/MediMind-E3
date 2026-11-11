import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const apptCol = mongoose.connection.collection('appointments');

const reschedSample = await apptCol.findOne({ status: 'RESCHEDULED' });
console.log('Sample RESCHEDULED doc keys:', Object.keys(reschedSample));
console.log({
  appointment_date: reschedSample.appointment_date,
  created_at: reschedSample.created_at,
  updated_at: reschedSample.updated_at,
  rescheduled_at: reschedSample.rescheduled_at,
  rescheduling_history: reschedSample.rescheduling_history,
  notes: reschedSample.notes
});

await mongoose.disconnect();
