import fs from 'fs';
import path from 'path';
import mongoose from '../node_modules/mongoose/index.js';

const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
}

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const consultCol = mongoose.connection.client.db('medimind_records').collection('consultations');

  const countWithDocId = await consultCol.countDocuments({
    $or: [
      { doctor_id: new mongoose.Types.ObjectId('6ac85a1a074c2bc731a763bb') },
      { doctor_id: '6ac85a1a074c2bc731a763bb' }
    ]
  });
  console.log('Consultations for Dr. Rahul Sharma:', countWithDocId);

  const sampleConsult = await consultCol.findOne({});
  console.log('Sample consultation keys and types:', {
    _id: sampleConsult?._id,
    doctor_id: sampleConsult?.doctor_id,
    doctor_id_type: typeof sampleConsult?.doctor_id,
    isObjectId: sampleConsult?.doctor_id instanceof mongoose.Types.ObjectId,
    appointment_id: sampleConsult?.appointment_id,
    appointment_id_type: typeof sampleConsult?.appointment_id
  });

  // Check how many appointments Dr. Rahul Sharma has in appointments collection
  const apptCol = mongoose.connection.client.db('medimind_appointment').collection('appointments');
  const docApptCount = await apptCol.countDocuments({
    doctor_id: new mongoose.Types.ObjectId('6ac85a1a074c2bc731a763bb')
  });
  console.log('Total appointments for Dr. Rahul Sharma:', docApptCount);

  const docCompletedAppts = await apptCol.countDocuments({
    doctor_id: new mongoose.Types.ObjectId('6ac85a1a074c2bc731a763bb'),
    status: 'COMPLETED'
  });
  console.log('Completed appointments for Dr. Rahul Sharma:', docCompletedAppts);

  await mongoose.disconnect();
}
run();
