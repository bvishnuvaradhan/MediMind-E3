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

  const sep29 = new Date('2026-09-29T00:00:00.000Z');
  const oct03 = new Date('2026-10-03T00:00:00.000Z');
  const apptsNearOct1 = await apptCol.find({
    appointment_date: { $gte: sep29, $lte: oct03 }
  }).toArray();
  console.log('Appts between 2026-09-29 and 2026-10-03:', apptsNearOct1.length);
  const datesOct1 = {};
  for (const a of apptsNearOct1) {
    const dStr = a.appointment_date?.toISOString?.();
    datesOct1[dStr] = (datesOct1[dStr] || 0) + 1;
  }
  console.log('Dates near Oct 1:', datesOct1);

  const oct29 = new Date('2026-10-29T00:00:00.000Z');
  const nov03 = new Date('2026-11-03T00:00:00.000Z');
  const apptsNearNov1 = await apptCol.find({
    appointment_date: { $gte: oct29, $lte: nov03 }
  }).toArray();
  console.log('\nAppts between 2026-10-29 and 2026-11-03:', apptsNearNov1.length);
  const datesNov1 = {};
  for (const a of apptsNearNov1) {
    const dStr = a.appointment_date?.toISOString?.();
    datesNov1[dStr] = (datesNov1[dStr] || 0) + 1;
  }
  console.log('Dates near Nov 1:', datesNov1);

  await mongoose.disconnect();
}
run();
