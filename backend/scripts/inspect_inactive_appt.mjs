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
  const client = mongoose.connection.client;
  const apptCol = client.db('medimind_appointment').collection('appointments');
  const hospCol = client.db('medimind_hospital').collection('hospitals');

  const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const activeIds = activeHosps.map(h => h._id);

  const inactiveAppt = await apptCol.findOne({ hospital_id: { $nin: activeIds } });
  console.log('Inactive hospital appointment:', JSON.stringify(inactiveAppt, null, 2));

  if (inactiveAppt && inactiveAppt.hospital_id) {
    const hosp = await hospCol.findOne({ _id: inactiveAppt.hospital_id });
    console.log('Associated hospital:', JSON.stringify(hosp, null, 2));
  }
  await mongoose.disconnect();
}
run();
