import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
await mongoose.connect(MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const hospCol = client.db('medimind_hospital').collection('hospitals');
const apptCol = client.db('medimind_appointment').collection('appointments');
const predCol = client.db('medimind_ai').collection('predictions');

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const activeHospIds = new Set(activeHosps.map(h => h._id.toString()));

const allPreds = await predCol.find({}).toArray();
const allAppts = await apptCol.find({}).toArray();
const apptMap = new Map(allAppts.map(a => [a._id.toString(), a]));

console.log('Total Predictions:', allPreds.length);

let standaloneCount = 0;
let linkedToActiveAppt = 0;
let linkedToWalkIn = 0;
let linkedToInactiveAppt = 0;
let orphanedPredictions = 0;

for (const p of allPreds) {
  const isStandalone = !p.appointment_id || p.is_standalone === true || p.screening_type === 'STANDALONE_NLP';
  if (isStandalone) {
    standaloneCount++;
    continue;
  }

  const apptIdStr = p.appointment_id.toString();
  const appt = apptMap.get(apptIdStr);
  if (!appt) {
    orphanedPredictions++;
  } else if (!activeHospIds.has(appt.hospital_id.toString())) {
    linkedToInactiveAppt++;
  } else {
    if (appt.appointment_type === 'WALK_IN') {
      linkedToWalkIn++;
    } else {
      linkedToActiveAppt++;
    }
  }
}

console.log({
  totalPredictions: allPreds.length,
  standaloneCount,
  linkedToActiveAppt,
  linkedToWalkIn,
  linkedToInactiveAppt,
  orphanedPredictions
});

await mongoose.disconnect();
