import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function auditNovember() {
  const conn = await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const apptDb = conn.connection.useDb('medimind_appointment');
  const aiDb = conn.connection.useDb('medimind_ai');
  const hospDb = conn.connection.useDb('medimind_hospital');

  const apptsCol = apptDb.collection('appointments');
  const aiCol = aiDb.collection('predictions');
  const hospsCol = hospDb.collection('hospitals');

  const hosps = await hospsCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const hospMap = Object.fromEntries(hosps.map(h => [h._id.toString(), h.name]));

  // November 2026 range
  const novStart = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-12-01T00:00:00.000Z');

  const novAppts = await apptsCol.find({
    appointment_date: { $gte: novStart, $lt: novEnd }
  }).toArray();

  console.log(`\n======================================================`);
  console.log(`TOTAL NOVEMBER 2026 APPOINTMENTS: ${novAppts.length}`);
  console.log(`======================================================\n`);

  const byHospital = {};
  const byStatus = {};
  const byType = {};
  let withAiId = 0;
  let withoutAiId = 0;
  const aiValidation = { validInDb: 0, missingInDb: 0 };

  const sampleWithoutAi = [];
  const sampleWithAi = [];

  for (const a of novAppts) {
    const hid = a.hospital_id.toString();
    const hname = hospMap[hid] || hid;
    byHospital[hname] = (byHospital[hname] || 0) + 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byType[a.appointment_type || 'BOOKED'] = (byType[a.appointment_type || 'BOOKED'] || 0) + 1;

    if (a.ai_prediction_id) {
      withAiId++;
      // check if exists in predictions
      const pred = await aiCol.findOne({
        $or: [
          { prediction_id: a.ai_prediction_id },
          { _id: typeof a.ai_prediction_id === 'string' && a.ai_prediction_id.length === 24 ? new mongoose.Types.ObjectId(a.ai_prediction_id) : null }
        ].filter(Boolean)
      });
      if (pred) {
        aiValidation.validInDb++;
        if (sampleWithAi.length < 3) sampleWithAi.push({ id: a._id.toString(), ai_id: a.ai_prediction_id, pred_type: pred.prediction_type });
      } else {
        aiValidation.missingInDb++;
      }
    } else {
      withoutAiId++;
      if (sampleWithoutAi.length < 5) {
        sampleWithoutAi.push({
          id: a._id.toString(),
          hospital: hname,
          date: a.appointment_date,
          status: a.status,
          type: a.appointment_type,
          reason: a.reason,
          created_at: a.created_at
        });
      }
    }
  }

  console.log('Breakdown by Hospital:');
  console.table(byHospital);

  console.log('Breakdown by Status:');
  console.table(byStatus);

  console.log('Breakdown by Appointment Type:');
  console.table(byType);

  console.log('AI Pre-Screening Linkage Status:');
  console.log(`  With ai_prediction_id:    ${withAiId} (Valid in DB: ${aiValidation.validInDb}, Missing in DB: ${aiValidation.missingInDb})`);
  console.log(`  Without ai_prediction_id: ${withoutAiId}`);

  console.log('\nSample November appointments WITHOUT AI pre-screening:');
  console.log(sampleWithoutAi);

  // Check 348 vs 513: why did earlier query see 348 or 513?
  // Let's check advance bookings created in October vs created in November
  const createdOct = await apptsCol.countDocuments({
    appointment_date: { $gte: novStart, $lt: novEnd },
    created_at: { $lt: novStart }
  });
  const createdNov = await apptsCol.countDocuments({
    appointment_date: { $gte: novStart, $lt: novEnd },
    created_at: { $gte: novStart }
  });
  console.log(`\nAdvance bookings scheduled for Nov created in Oct (or earlier): ${createdOct}`);
  console.log(`Bookings scheduled for Nov created in Nov: ${createdNov}`);

  await conn.disconnect();
}

auditNovember().catch(console.error);
