import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function probe() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const conn = await mongoose.createConnection(uri, { dbName: 'medimind_ai' }).asPromise();
  const sample = await conn.collection('predictions').findOne({ appointment_id: { $ne: null } });
  console.log('Sample Prediction Document:');
  console.log(JSON.stringify(sample, null, 2));

  // Check distinct models / prediction types
  const types = await conn.collection('predictions').distinct('model_type');
  console.log('Distinct model_types:', types);

  // Check distinct prediction_type
  const ptypes = await conn.collection('predictions').distinct('prediction_type');
  console.log('Distinct prediction_types:', ptypes);

  await conn.close();
}

probe().catch(console.error);
