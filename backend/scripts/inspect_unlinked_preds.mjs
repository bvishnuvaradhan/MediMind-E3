import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const predCol = client.db('medimind_ai').collection('predictions');
const allPreds = await predCol.find({}).toArray();

console.log('Total predictions in medimind_ai:', allPreds.length);

const unlinked = allPreds.filter(p => !p.appointment_id);
console.log('Predictions without appointment_id:', unlinked.length);
console.log('Sample unlinked prediction:');
if (unlinked.length > 0) {
  console.log({
    _id: unlinked[0]._id,
    screening_type: unlinked[0].screening_type,
    model_name: unlinked[0].model_name,
    patient_id: unlinked[0].patient_id,
    notes: unlinked[0].notes,
    is_standalone: unlinked[0].is_standalone
  });
}

await mongoose.disconnect();
