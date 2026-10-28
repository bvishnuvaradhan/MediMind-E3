import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function audit() {
  console.log('========================================================================');
  console.log('READ-ONLY AUTHORITATIVE BOOKING, AI, AND OPERATIONAL RATE AUDIT');
  console.log('========================================================================\n');

  // Connection safety check (without exposing secrets)
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`[Config] MongoDB Target Host: ${maskedUri.split('?')[0]}`);
  console.log(`[Config] Logical Databases: Appointment, AI, Hospital, Records, Doctor, Family`);

  const connAppt = await mongoose.createConnection(uri, { dbName: process.env.APPOINTMENT_DB_NAME || 'medimind_appointment' }).asPromise();
  const connHosp = await mongoose.createConnection(uri, { dbName: process.env.HOSPITAL_DB_NAME || 'medimind_hospital' }).asPromise();
  const connAi = await mongoose.createConnection(uri, { dbName: process.env.AI_DB_NAME || 'medimind_ai' }).asPromise();
  const connRec = await mongoose.createConnection(uri, { dbName: process.env.RECORD_DB_NAME || 'medimind_records' }).asPromise();
  const connDoc = await mongoose.createConnection(uri, { dbName: process.env.DOCTOR_DB_NAME || 'medimind_doctor' }).asPromise();
  const connFam = await mongoose.createConnection(uri, { dbName: process.env.FAMILY_DB_NAME || 'medimind_family' }).asPromise();

  // 1. Discover Active Hospitals Dynamically
  const hospitals = await connHosp.collection('hospitals').find({}).toArray();
  console.log('\n--- Hospital Discovery (All Discovered Facilities) ---');
  for (const h of hospitals) {
    console.log(`ID: ${h._id} | Code: ${h.code} | Status: ${h.status} | Name: ${h.name} | City: ${h.city}`);
  }

  const activeHospitals = hospitals.filter(h => (h.status || '').toUpperCase() === 'ACTIVE');
  console.log(`\nActive Facilities Count: ${activeHospitals.length}`);

  // 2. Appointment Schema & Distinct Fields Inspection
  const sampleAppt = await connAppt.collection('appointments').findOne({});
  console.log('\n--- Sample Appointment Document Keys ---');
  console.log(Object.keys(sampleAppt || {}));

  // Distinct appointment sources/channels
  const distinctSources = await connAppt.collection('appointments').distinct('appointment_type');
  const distinctStatuses = await connAppt.collection('appointments').distinct('status');
  console.log('\nDistinct appointment_type values in DB:', distinctSources);
  console.log('Distinct status values in DB:', distinctStatuses);

  // Check if booking channel or source fields exist (e.g. source, channel, booking_source, created_by, walk_in)
  const channelCheck = await connAppt.collection('appointments').aggregate([
    {
      $group: {
        _id: {
          appointment_type: '$appointment_type',
          has_reason: { $ne: [{ $ifNull: ['$reason', null] }, null] },
          has_ai: { $ne: [{ $ifNull: ['$ai_prediction_id', null] }, null] }
        },
        count: { $sum: 1 }
      }
    }
  ]).toArray();
  console.log('\nAppointment type and AI presence grouping:');
  console.log(JSON.stringify(channelCheck, null, 2));

  // 3. For each active hospital, detailed lifecycle breakdown
  const now = new Date('2026-10-28T00:00:00Z');

  for (const h of activeHospitals) {
    const hid = h._id;
    console.log(`\n========================================================================`);
    console.log(`FACILITY AUDIT: ${h.name} (${hid})`);
    console.log(`========================================================================`);

    const totalBookings = await connAppt.collection('appointments').countDocuments({ hospital_id: hid });
    const statuses = await connAppt.collection('appointments').aggregate([
      { $match: { hospital_id: hid } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    const apptTypes = await connAppt.collection('appointments').aggregate([
      { $match: { hospital_id: hid } },
      { $group: { _id: '$appointment_type', count: { $sum: 1 } } }
    ]).toArray();

    // AI linkage: appointments with ai_prediction_id
    const withAi = await connAppt.collection('appointments').countDocuments({
      hospital_id: hid,
      ai_prediction_id: { $type: 'string', $ne: '' }
    });
    const withoutAi = await connAppt.collection('appointments').countDocuments({
      hospital_id: hid,
      $or: [
        { ai_prediction_id: null },
        { ai_prediction_id: { $exists: false } },
        { ai_prediction_id: '' }
      ]
    });

    // Date breakdowns: past vs future
    const pastAppts = await connAppt.collection('appointments').countDocuments({
      hospital_id: hid,
      appointment_date: { $lt: now }
    });
    const futureAppts = await connAppt.collection('appointments').countDocuments({
      hospital_id: hid,
      appointment_date: { $gte: now }
    });

    // Month by month appointment_date
    const byApptMonth = await connAppt.collection('appointments').aggregate([
      { $match: { hospital_id: hid } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Month by month created_at
    const byCreatedMonth = await connAppt.collection('appointments').aggregate([
      { $match: { hospital_id: hid } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Status by past vs future
    const statusByTimeline = await connAppt.collection('appointments').aggregate([
      { $match: { hospital_id: hid } },
      {
        $group: {
          _id: {
            status: '$status',
            isPast: { $lt: ['$appointment_date', now] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.isPast': -1, '_id.status': 1 } }
    ]).toArray();

    // Linkage to Consultations in medimind_records
    // Sample consultation to see linkage field
    const sampleCons = await connRec.collection('consultations').findOne({ hospital_id: hid });
    const consultationsCount = await connRec.collection('consultations').countDocuments({ hospital_id: hid });
    const prescriptionsCount = await connRec.collection('prescriptions').countDocuments({ hospital_id: hid });

    console.log(`Total Bookings: ${totalBookings}`);
    console.log(`By Status:`, JSON.stringify(statuses));
    console.log(`By Appointment Type (Channel):`, JSON.stringify(apptTypes));
    console.log(`AI Linkage: With AI=${withAi}, Without AI=${withoutAi} (Sum=${withAi + withoutAi})`);
    console.log(`Timeline: Past Appts=${pastAppts}, Future/Current Appts=${futureAppts}`);
    console.log(`Appointment Month Distribution:`, byApptMonth.map(m => `${m._id}: ${m.count}`).join(', '));
    console.log(`Creation Month Distribution:   `, byCreatedMonth.map(m => `${m._id}: ${m.count}`).join(', '));
    console.log(`Status Timeline Breakdown:`);
    for (const s of statusByTimeline) {
      console.log(`  ${s._id.isPast ? '[PAST]' : '[FUTURE]'} Status: ${s._id.status} => ${s.count}`);
    }
    console.log(`Clinical Records: Consultations=${consultationsCount}, Prescriptions=${prescriptionsCount}`);
  }

  // 4. AI Database Audit (medimind_ai)
  console.log(`\n========================================================================`);
  console.log(`AI DATABASE AUDIT (medimind_ai.predictions)`);
  console.log(`========================================================================`);
  const totalPredictions = await connAi.collection('predictions').countDocuments({});
  console.log(`Total AI Predictions in DB: ${totalPredictions}`);

  const predsByModule = await connAi.collection('predictions').aggregate([
    { $group: { _id: '$module_id', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Predictions by module_id:', predsByModule);

  const predsByHospital = await connAi.collection('predictions').aggregate([
    { $group: { _id: '$hospital_id', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Predictions by hospital_id:', predsByHospital);

  const standalonePreds = await connAi.collection('predictions').countDocuments({
    $or: [{ appointment_id: null }, { appointment_id: { $exists: false } }, { appointment_id: '' }]
  });
  const linkedPreds = await connAi.collection('predictions').countDocuments({
    appointment_id: { $type: 'objectId' }
  });
  const stringLinkedPreds = await connAi.collection('predictions').countDocuments({
    appointment_id: { $type: 'string', $ne: '' }
  });
  console.log(`Predictions: Standalone=${standalonePreds}, ObjectId Linked=${linkedPreds}, String Linked=${stringLinkedPreds}`);

  // Discrepancy investigation for Harborview
  const hvId = new mongoose.Types.ObjectId('6ac85a18074c2bc731a76385');
  const hvNoAiSample = await connAppt.collection('appointments').find({
    hospital_id: hvId,
    $or: [{ ai_prediction_id: null }, { ai_prediction_id: { $exists: false } }, { ai_prediction_id: '' }]
  }).limit(5).toArray();

  console.log('\nSample Harborview Bookings Without AI:');
  for (const a of hvNoAiSample) {
    console.log(`  ID: ${a._id}, status: ${a.status}, type: ${a.appointment_type}, date: ${a.appointment_date?.toISOString().slice(0, 10)}, created: ${a.created_at?.toISOString().slice(0, 10)}, reason: ${a.reason?.slice(0, 40)}`);
  }

  // Distribution of without-AI bookings by month for Harborview
  const hvNoAiByMonth = await connAppt.collection('appointments').aggregate([
    {
      $match: {
        hospital_id: hvId,
        $or: [{ ai_prediction_id: null }, { ai_prediction_id: { $exists: false } }, { ai_prediction_id: '' }]
      }
    },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  console.log('Harborview Bookings Without AI by created_at month:', hvNoAiByMonth);

  const hvNoAiByApptMonth = await connAppt.collection('appointments').aggregate([
    {
      $match: {
        hospital_id: hvId,
        $or: [{ ai_prediction_id: null }, { ai_prediction_id: { $exists: false } }, { ai_prediction_id: '' }]
      }
    },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  console.log('Harborview Bookings Without AI by appointment_date month:', hvNoAiByApptMonth);

  // Close connections
  await connAppt.close();
  await connHosp.close();
  await connAi.close();
  await connRec.close();
  await connDoc.close();
  await connFam.close();
}

audit().catch(console.error);
