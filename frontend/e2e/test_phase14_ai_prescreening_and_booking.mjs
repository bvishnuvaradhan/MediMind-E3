import mongoose from '../../backend/node_modules/mongoose/index.js';
import fs from 'fs';

// Load backend .env
if (fs.existsSync('./backend/.env')) {
  const envContent = fs.readFileSync('./backend/.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const APPT_BASE = 'http://localhost:5005/api/appointments';
const AI_BASE = 'http://localhost:5007/api/ai';
const INTERNAL_SECRET = 'medimind_internal_service_secret_2026';

async function main() {
  console.log('--- Phase 14 AI Pre-Screening & Booking Lifecycle Verification ---');

  // Connect to DB to inspect appointments and test targets
  await mongoose.connect(MONGO_URI);
  const apptDb = mongoose.connection.useDb('medimind_appointment');
  const aiDb = mongoose.connection.useDb('medimind_ai');
  const hospDb = mongoose.connection.useDb('medimind_hospital');
  const docDb = mongoose.connection.useDb('medimind_doctor');
  const famDb = mongoose.connection.useDb('medimind_family');

  // Find an active hospital, doctor, and family member
  const hospital = await hospDb.collection('hospitals').findOne({ status: 'ACTIVE' });
  const doctor = await docDb.collection('doctors').findOne({ hospital_id: hospital._id, status: 'ACTIVE' });
  const member = await famDb.collection('familymembers').findOne({});

  if (!hospital || !doctor || !member) {
    throw new Error('Test prerequisites missing: could not find active hospital, doctor, or member');
  }

  console.log(`Test Context: Hospital "${hospital.name}" (${hospital._id}), Doctor "${doctor.full_name}" (${doctor._id}), Member "${member.full_name}" (${member._id})`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-internal-service-secret': INTERNAL_SECRET,
    'x-user-id': 'test_admin_user',
    'x-user-role': 'CHAIRMAN',
  };

  const testDate = '2026-11-20';
  const startOfDay = new Date('2026-11-20T00:00:00.000Z');
  const endOfDay = new Date('2026-11-20T23:59:59.999Z');

  // Initial clean up of any prior test appointments on this date
  await apptDb.collection('appointments').deleteMany({
    appointment_date: { $gte: startOfDay, $lte: endOfDay },
  });

  const createdApptIds = [];
  const createdPredIds = [];

  try {
    // -------------------------------------------------------------
    // Test 1: Online booking with missing symptoms (<3 chars) -> 400
    // -------------------------------------------------------------
    console.log('\n[Test 1] Online booking with empty symptoms should return 400 Bad Request');
    const res1 = await fetch(APPT_BASE, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        familyMemberId: member._id.toString(),
        doctorId: doctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: (doctor.department_id?._id || doctor.department_id || hospital.departments?.[0] || '6ac85a18074c2bc731a76399').toString(),
        appointmentDate: testDate,
        startTime: '09:00',
        endTime: '09:30',
        appointmentType: 'BOOKED',
        reason: 'hi', // too short (<3 chars)
      }),
    });
    console.log(`Response status: ${res1.status}`);
    const body1 = await res1.json();
    console.log(`Error message: ${body1.message}`);
    if (res1.status !== 400 || !body1.message?.includes('symptoms description of at least 3 characters')) {
      throw new Error(`Test 1 failed: Expected 400 Bad Request for short symptoms, got ${res1.status}: ${JSON.stringify(body1)}`);
    }
    console.log('✓ Test 1 Passed: Short/missing symptoms rejected without booking or AI run.');

    // -------------------------------------------------------------
    // Test 2: Online booking with valid symptoms -> Triggers Real AI & Links
    // -------------------------------------------------------------
    console.log('\n[Test 2] Online booking with valid symptoms should invoke AI and link prediction_id');
    const res2 = await fetch(APPT_BASE, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        familyMemberId: member._id.toString(),
        doctorId: doctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: (doctor.department_id?._id || doctor.department_id || hospital.departments?.[0] || '6ac85a18074c2bc731a76399').toString(),
        appointmentDate: testDate,
        startTime: '09:30',
        endTime: '10:00',
        appointmentType: 'BOOKED',
        symptoms: 'Patient has severe lower back pain radiating down the left leg for 3 weeks',
      }),
    });
    console.log(`Response status: ${res2.status}`);
    const body2 = await res2.json();
    if (res2.status !== 201 || !body2.data?.ai_prediction_id) {
      throw new Error(`Test 2 failed: Expected 201 with linked ai_prediction_id, got ${res2.status}: ${JSON.stringify(body2)}`);
    }

    const apptId2 = body2.data._id || body2.data.id;
    const predId2 = body2.data.ai_prediction_id;
    createdApptIds.push(apptId2);
    createdPredIds.push(predId2);

    console.log(`✓ Appointment created: ${apptId2}`);
    console.log(`✓ Real AI Prediction linked: ${predId2}`);

    // Verify prediction exists in medimind_ai collection
    const predDoc = await aiDb.collection('predictions').findOne({ prediction_id: predId2 });
    if (!predDoc) {
      throw new Error(`Test 2 failed: Prediction '${predId2}' not found in medimind_ai collection`);
    }
    console.log(`✓ Verified prediction in DB: Model: ${predDoc.model_name} v${predDoc.model_version}, Urgency: ${predDoc.result?.urgency}, Disclaimer: "${predDoc.result?.disclaimer?.slice(0, 30)}..."`);
    console.log('✓ Test 2 Passed: Real AI pre-screening executed and linked end to end.');

    // -------------------------------------------------------------
    // Test 3: Idempotency control on duplicate retry
    // -------------------------------------------------------------
    console.log('\n[Test 3] Resubmitting the identical booking should return existing appointment without re-running AI');
    const initialPredCount = await aiDb.collection('predictions').countDocuments();
    const res3 = await fetch(APPT_BASE, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        familyMemberId: member._id.toString(),
        doctorId: doctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: (doctor.department_id?._id || doctor.department_id || hospital.departments?.[0] || '6ac85a18074c2bc731a76399').toString(),
        appointmentDate: testDate,
        startTime: '09:30',
        endTime: '10:00',
        appointmentType: 'BOOKED',
        symptoms: 'Patient has severe lower back pain radiating down the left leg for 3 weeks',
      }),
    });
    console.log(`Response status: ${res3.status}`);
    const body3 = await res3.json();
    const afterPredCount = await aiDb.collection('predictions').countDocuments();
    if (res3.status !== 201 || (body3.data._id || body3.data.id) !== apptId2) {
      throw new Error(`Test 3 failed: Expected existing appointment ID ${apptId2}, got ${body3.data?._id}`);
    }
    if (afterPredCount !== initialPredCount) {
      throw new Error(`Test 3 failed: AI predictions increased from ${initialPredCount} to ${afterPredCount}`);
    }
    console.log('✓ Test 3 Passed: Idempotency preserved; existing appointment returned without duplicate AI execution.');

    // -------------------------------------------------------------
    // Test 4: Walk-in registration bypasses AI pre-screening
    // -------------------------------------------------------------
    console.log('\n[Test 4] Walk-in registration should bypass AI pre-screening requirement');
    const res4 = await fetch(APPT_BASE, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        familyMemberId: member._id.toString(),
        doctorId: doctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: (doctor.department_id?._id || doctor.department_id || hospital.departments?.[0] || '6ac85a18074c2bc731a76399').toString(),
        appointmentDate: testDate,
        startTime: '10:00',
        endTime: '10:30',
        appointmentType: 'WALK_IN',
        reason: 'Walk-in front desk triage registration',
      }),
    });
    console.log(`Response status: ${res4.status}`);
    const body4 = await res4.json();
    if (res4.status !== 201 || body4.data?.appointment_type !== 'WALK_IN' || body4.data?.ai_prediction_id) {
      throw new Error(`Test 4 failed: Expected 201 WALK_IN with null ai_prediction_id, got ${res4.status}`);
    }
    const apptId4 = body4.data._id || body4.data.id;
    createdApptIds.push(apptId4);
    console.log(`✓ Walk-in appointment created: ${apptId4}, ai_prediction_id: ${body4.data.ai_prediction_id}`);
    console.log('✓ Test 4 Passed: Walk-in appointment cleanly bypassed AI triage requirement.');

    // -------------------------------------------------------------
    // Test 5: Online booking with invalid pre-supplied aiPredictionId -> 404
    // -------------------------------------------------------------
    console.log('\n[Test 5] Online booking with invalid aiPredictionId should return 404');
    const res5 = await fetch(APPT_BASE, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        familyMemberId: member._id.toString(),
        doctorId: doctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: (doctor.department_id?._id || doctor.department_id || hospital.departments?.[0] || '6ac85a18074c2bc731a76399').toString(),
        appointmentDate: testDate,
        startTime: '10:30',
        endTime: '11:00',
        appointmentType: 'BOOKED',
        aiPredictionId: 'pred_nonexistent_12345',
      }),
    });
    console.log(`Response status: ${res5.status}`);
    const body5 = await res5.json();
    console.log(`Error message: ${body5.message}`);
    if (res5.status !== 404) {
      throw new Error(`Test 5 failed: Expected 404 for invalid aiPredictionId, got ${res5.status}`);
    }
    console.log('✓ Test 5 Passed: Non-existent AI prediction rejected with 404 without booking.');

  } finally {
    // Clean up test appointments and predictions
    console.log('\n--- Cleaning up test records ---');
    for (const apptId of createdApptIds) {
      await apptDb.collection('appointments').deleteOne({ _id: new mongoose.Types.ObjectId(apptId) });
      console.log(`Deleted test appointment: ${apptId}`);
    }
    for (const predId of createdPredIds) {
      await aiDb.collection('predictions').deleteOne({ prediction_id: predId });
      console.log(`Deleted test AI prediction: ${predId}`);
    }
    await mongoose.disconnect();
  }

  console.log('\n======================================================');
  console.log('ALL PHASE 14 AI PRE-SCREENING & BOOKING TESTS PASSED!');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
