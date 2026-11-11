import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const predCol = client.db('medimind_ai').collection('predictions');
const sample = await predCol.findOne({ appointment_id: { $ne: null } });
console.log('Sample appointment_id type:', typeof sample.appointment_id, sample.appointment_id?.constructor?.name, sample.appointment_id);

await mongoose.disconnect();
