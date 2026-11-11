import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'medimind_ai' });
const res = await mongoose.connection.useDb('medimind_ai').collection('predictions').deleteOne({ prediction_id: 'pred_8d2984c8629b' });
console.log('Deleted test prediction:', res.deletedCount);
const total = await mongoose.connection.useDb('medimind_ai').collection('predictions').countDocuments();
console.log('Total predictions now:', total);
await mongoose.disconnect();
