import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  const conn = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const pastUnclosed = await conn.collection('appointments').find({
    appointment_date: { $lt: new Date('2026-10-28T00:00:00Z') },
    status: { $in: ['CONFIRMED', 'RESCHEDULED', 'BOOKED'] }
  }).toArray();

  const hospitals = {
    '6ac85a18074c2bc731a76385': 'Harborview',
    '6ac85a18074c2bc731a76381': 'Aarogyam',
    '6ac85a18074c2bc731a76383': 'Nexora'
  };

  const byHospAndMonth = {};
  for (const a of pastUnclosed) {
    const hname = hospitals[a.hospital_id.toString()] || a.hospital_id.toString();
    const mth = a.appointment_date.toISOString().slice(0, 7);
    const key = `${hname} | ${mth} | ${a.status}`;
    byHospAndMonth[key] = (byHospAndMonth[key] || 0) + 1;
  }

  console.log('414 Past Unclosed Appointments Distribution:');
  const sortedKeys = Object.keys(byHospAndMonth).sort();
  for (const k of sortedKeys) {
    console.log(`  ${k} => ${byHospAndMonth[k]}`);
  }

  // Summary by month across all hospitals
  const monthSummary = {};
  for (const a of pastUnclosed) {
    const mth = a.appointment_date.toISOString().slice(0, 7);
    monthSummary[mth] = (monthSummary[mth] || 0) + 1;
  }
  console.log('\nBy Month Summary:');
  for (const m of Object.keys(monthSummary).sort()) {
    console.log(`  ${m} => ${monthSummary[m]}`);
  }

  await conn.close();
}

run().catch(console.error);
