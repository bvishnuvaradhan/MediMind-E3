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

  const userCol = client.db('medimind_auth').collection('users');
  const user = await userCol.findOne({ email: 'dr.rahul.sharma@aarogyam.hospital' });
  console.log('User record:', JSON.stringify(user, null, 2));

  await mongoose.disconnect();
}
run();
