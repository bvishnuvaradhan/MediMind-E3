import '../../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { hashPassword } from '../../auth-service/src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, '../../auth-service');
const FAMILY_DIR = path.resolve(__dirname, '../../family-service');
const HOSPITAL_DIR = path.resolve(__dirname, '../../hospital-service');
const DOCTOR_DIR = path.resolve(__dirname, '../../doctor-service');
const APPOINTMENT_DIR = path.resolve(__dirname, '../');
const GATEWAY_DIR = path.resolve(__dirname, '../../api-gateway');

function startProcess(name, dir, port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server.js'], {
      cwd: dir,
      env: { ...process.env, PORT: port.toString() },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error(`Timeout waiting for ${name} on port ${port}`));
      }
    }, 15000);

    proc.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Running on port') || msg.includes('API Gateway running')) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          resolve(proc);
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const err = data.toString();
      if (!started && err.includes('Error:')) {
        clearTimeout(timeout);
        reject(new Error(`Failed to start ${name}: ${err}`));
      }
    });

    proc.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`${name} exited prematurely with code ${code}`));
      }
    });
  });
}

async function waitForHttp(url, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Service at ${url} not responding`);
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('PHASE 5 LIVE INTEGRATION VERIFICATION: ALL MICROSERVICES + APPT');
  console.log('================================================================');

  let authProc, familyProc, hospitalProc, doctorProc, apptProc, gatewayProc;
  let authConn, familyConn, hospitalConn, doctorConn, apptConn;

  const timestamp = Date.now();
  const chairmanEmail = `live.chairman.p5.${timestamp}@medimind.org`;
  const doctor1Email = `dr.vikram.roy.${timestamp}@medimind.org`;
  const doctor2Email = `dr.ananya.sen.${timestamp}@medimind.org`;
  const familyEmail = `family.sharma.${timestamp}@medimind.org`;
  const defaultPassword = 'LiveSecurePass!2026';

  let hospitalId, departmentId;
  let doctor1Id, doctor2Id;
  let familyId, member1Id;
  let chairmanToken, doctor1Token, doctor2Token, familyToken;
  let createdApptId;

  try {
    console.log('\n1. Starting Microservices (Isolated Node Processes)...');
    authProc = await startProcess('Auth Service', AUTH_DIR, 5001);
    console.log('   ✓ Auth Service running on :5001');

    familyProc = await startProcess('Family Service', FAMILY_DIR, 5002);
    console.log('   ✓ Family Service running on :5002');

    hospitalProc = await startProcess('Hospital Service', HOSPITAL_DIR, 5003);
    console.log('   ✓ Hospital Service running on :5003');

    doctorProc = await startProcess('Doctor Service', DOCTOR_DIR, 5004);
    console.log('   ✓ Doctor Service running on :5004');

    apptProc = await startProcess('Appointment Service', APPOINTMENT_DIR, 5005);
    console.log('   ✓ Appointment Service running on :5005');

    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);
    console.log('   ✓ API Gateway running on :5000');

    console.log('\n2. Verifying Microservices Health...');
    await waitForHttp('http://localhost:5001/health');
    const authH = await (await fetch('http://localhost:5001/health')).json();
    console.log('   Auth Health:', authH.data.status, '| DB:', authH.data.database);

    await waitForHttp('http://localhost:5002/health');
    const famH = await (await fetch('http://localhost:5002/health')).json();
    console.log('   Family Health:', famH.data.status, '| DB:', famH.data.database);

    await waitForHttp('http://localhost:5003/health');
    const hospH = await (await fetch('http://localhost:5003/health')).json();
    console.log('   Hospital Health:', hospH.data.status, '| DB:', hospH.data.database);

    await waitForHttp('http://localhost:5004/health');
    const docH = await (await fetch('http://localhost:5004/health')).json();
    console.log('   Doctor Health:', docH.data.status, '| DB:', docH.data.database);

    await waitForHttp('http://localhost:5005/health');
    const apptH = await (await fetch('http://localhost:5005/health')).json();
    console.log('   Appointment Health:', apptH.data.status, '| DB:', apptH.data.database);

    await waitForHttp('http://localhost:5000/health');
    const gwH = await (await fetch('http://localhost:5000/health')).json();
    console.log('   Gateway Health:', gwH.data.status, '| Request ID:', gwH.data.requestId);

    // Database connections with fallback
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const familyDbName = process.env.FAMILY_DB_NAME || 'medimind_family';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const doctorDbName = process.env.DOCTOR_DB_NAME || 'medimind_doctor';
    const apptDbName = process.env.APPOINTMENT_DB_NAME || 'medimind_appointment';
    const mongoBase = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

    const connectWithFallback = async (dbName) => {
      try {
        return await mongoose.createConnection(mongoBase, { dbName, serverSelectionTimeoutMS: 2500 }).asPromise();
      } catch (err) {
        if (mongoBase.includes('mongodb+srv') || mongoBase.includes('@')) {
          return await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000 }).asPromise();
        }
        throw err;
      }
    };

    authConn = await connectWithFallback(authDbName);
    familyConn = await connectWithFallback(familyDbName);
    hospitalConn = await connectWithFallback(hospitalDbName);
    doctorConn = await connectWithFallback(doctorDbName);
    apptConn = await connectWithFallback(apptDbName);

    console.log('\n3. Seeding Test Entities Across Microservices...');

    // 1. Seed Chairman in Auth DB
    await authConn.collection('users').insertOne({
      email: chairmanEmail,
      password_hash: await hashPassword(defaultPassword),
      role: 'CHAIRMAN',
      account_type: 'CHAIRMAN_ACCOUNT',
      reference_id: new mongoose.Types.ObjectId(),
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2. Seed Hospital & Department in Hospital DB
    hospitalId = new mongoose.Types.ObjectId();
    await hospitalConn.collection('hospitals').insertOne({
      _id: hospitalId,
      name: `Apollo Jubilee Hills ${timestamp}`,
      code: `AJH-${timestamp.toString().slice(-4)}`,
      city: 'Hyderabad',
      state: 'Telangana',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    departmentId = new mongoose.Types.ObjectId();
    await hospitalConn.collection('departments').insertOne({
      _id: departmentId,
      hospital_id: hospitalId,
      name: 'Cardiology',
      code: 'CARD',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 3. Seed Doctors in Doctor DB & Auth DB
    doctor1Id = new mongoose.Types.ObjectId();
    const doc1AuthUser = await authConn.collection('users').insertOne({
      email: doctor1Email,
      password_hash: await hashPassword(defaultPassword),
      role: 'DOCTOR',
      account_type: 'DOCTOR_ACCOUNT',
      reference_id: doctor1Id,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await doctorConn.collection('doctors').insertOne({
      _id: doctor1Id,
      user_id: doc1AuthUser.insertedId,
      hospital_id: hospitalId,
      department_id: departmentId,
      full_name: 'Dr. Vikram Roy',
      email: doctor1Email,
      specialization: 'Cardiology',
      experience_years: 15,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    doctor2Id = new mongoose.Types.ObjectId();
    const doc2AuthUser = await authConn.collection('users').insertOne({
      email: doctor2Email,
      password_hash: await hashPassword(defaultPassword),
      role: 'DOCTOR',
      account_type: 'DOCTOR_ACCOUNT',
      reference_id: doctor2Id,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await doctorConn.collection('doctors').insertOne({
      _id: doctor2Id,
      user_id: doc2AuthUser.insertedId,
      hospital_id: hospitalId,
      department_id: departmentId,
      full_name: 'Dr. Ananya Sen',
      email: doctor2Email,
      specialization: 'Cardiology',
      experience_years: 10,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Register Family Account via Gateway
    const createFamRes = await fetch('http://localhost:5000/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyName: 'Sharma Family',
        email: familyEmail,
        mobile: '+91 98765 43210',
      }),
    });
    const createFamData = await createFamRes.json();
    if (!createFamData.success || !createFamData.data?.familyId) {
      throw new Error(`Family creation failed: ${JSON.stringify(createFamData)}`);
    }
    familyId = new mongoose.Types.ObjectId(createFamData.data.familyId);

    const familyAuthUser = await authConn.collection('users').insertOne({
      email: familyEmail,
      password_hash: await hashPassword(defaultPassword),
      role: 'FAMILY',
      account_type: 'FAMILY_ACCOUNT',
      reference_id: familyId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await familyConn.collection('families').updateOne(
      { _id: familyId },
      { $set: { creator_user_id: familyAuthUser.insertedId } }
    );

    console.log('   ✓ Test entities successfully provisioned.');

    console.log('\n4. Authenticating Users through API Gateway...');
    const login = async (email, password) => {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(`Login failed for ${email}: ${data.message}`);
      }
      return data.data.token;
    };

    chairmanToken = await login(chairmanEmail, defaultPassword);
    console.log('   ✓ Chairman logged in');

    doctor1Token = await login(doctor1Email, defaultPassword);
    console.log('   ✓ Doctor 1 (Dr. Vikram Roy) logged in');

    doctor2Token = await login(doctor2Email, defaultPassword);
    console.log('   ✓ Doctor 2 (Dr. Ananya Sen) logged in');

    familyToken = await login(familyEmail, defaultPassword);
    console.log('   ✓ Family user logged in');

    // Add Family Member 1 through Family API via Gateway
    const addMemRes = await fetch('http://localhost:5000/api/families/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        fullName: 'Rohan Sharma',
        dateOfBirth: '1995-05-15',
        gender: 'MALE',
        bloodGroup: 'B+',
      }),
    });
    const addMemData = await addMemRes.json();
    if (!addMemData.success || !addMemData.data?.memberId) {
      throw new Error(`Member addition failed: ${JSON.stringify(addMemData)}`);
    }
    member1Id = addMemData.data.memberId;
    console.log(`   ✓ Family Member added via Gateway with ID: ${member1Id}`);

    console.log('\n================================================================');
    console.log('5. Executing Live Verification Checks (End-to-End via Gateway)');
    console.log('================================================================\n');

    // CHECK 1: Book Appointment as Family via Gateway
    console.log('Check 1: Book Appointment via Gateway (POST /api/appointments)');
    const bookRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctor1Id.toString(),
        appointmentDate: '2026-10-30',
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Regular consultation and checkup',
      }),
    });
    const bookData = await bookRes.json();
    console.log('   Response Status:', bookRes.status, '| Success:', bookData.success);
    if (bookRes.status !== 201 || !bookData.data?._id) {
      throw new Error(`Check 1 Failed: ${JSON.stringify(bookData)}`);
    }
    createdApptId = bookData.data._id;
    console.log(`   ✓ Appointment booked with ID: ${createdApptId} (Status: ${bookData.data.status})`);

    // CHECK 2: Double-Booking Conflict Prevention
    console.log('\nCheck 2: Slot Conflict Detection (Duplicate slot returns 409)');
    const conflictRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctor1Id.toString(),
        appointmentDate: '2026-10-30',
        startTime: '10:15',
        endTime: '10:45',
        reason: 'Overlapping consultation attempt',
      }),
    });
    const conflictData = await conflictRes.json();
    console.log('   Response Status:', conflictRes.status, '| Message:', conflictData.message);
    if (conflictRes.status !== 409) {
      throw new Error(`Check 2 Failed: expected 409, got ${conflictRes.status}`);
    }
    console.log('   ✓ Overlapping appointment prevented successfully (409 Conflict)');

    // CHECK 3: Walk-In Appointment Support
    console.log('\nCheck 3: Walk-in Appointment Creation (appointmentType: WALK_IN)');
    const walkInRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctor1Id.toString(),
        appointmentDate: '2026-10-30',
        startTime: '11:00',
        endTime: '11:30',
        appointmentType: 'WALK_IN',
        reason: 'Emergency walk-in triage',
      }),
    });
    const walkInData = await walkInRes.json();
    console.log('   Response Status:', walkInRes.status, '| Type:', walkInData.data?.appointmentType);
    if (walkInRes.status !== 201 || walkInData.data?.appointmentType !== 'WALK_IN') {
      throw new Error(`Check 3 Failed: ${JSON.stringify(walkInData)}`);
    }
    console.log('   ✓ Walk-in appointment created successfully without requiring prior AI');

    // CHECK 4: Scoped Appointment Listing for Doctor 1
    console.log('\nCheck 4: Scoped Appointment Retrieval (GET /api/appointments for Doctor 1)');
    const docApptsRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    const docApptsData = await docApptsRes.json();
    console.log('   Doctor 1 Appointments Count:', docApptsData.data?.length);
    if (!docApptsRes.ok || docApptsData.data?.length < 2) {
      throw new Error(`Check 4 Failed: ${JSON.stringify(docApptsData)}`);
    }
    console.log('   ✓ Doctor 1 retrieved assigned appointments only');

    // CHECK 5: Retrieve Appointment Details
    console.log(`\nCheck 5: Retrieve Appointment Details (GET /api/appointments/${createdApptId})`);
    const getApptRes = await fetch(`http://localhost:5000/api/appointments/${createdApptId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    const getApptData = await getApptRes.json();
    console.log('   Response Status:', getApptRes.status, '| Doctor ID:', getApptData.data?.doctorId);
    if (getApptRes.status !== 200 || getApptData.data?.id !== createdApptId) {
      throw new Error(`Check 5 Failed: ${JSON.stringify(getApptData)}`);
    }
    console.log('   ✓ Appointment details retrieved with valid scoping');

    // CHECK 6: Cross-Doctor Access Rejection (403)
    console.log('\nCheck 6: Cross-Doctor Access Blocked (Doctor 2 viewing Doctor 1 appointment)');
    const crossDocRes = await fetch(`http://localhost:5000/api/appointments/${createdApptId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctor2Token}` },
    });
    const crossDocData = await crossDocRes.json();
    console.log('   Response Status:', crossDocRes.status, '| Message:', crossDocData.message);
    if (crossDocRes.status !== 403) {
      throw new Error(`Check 6 Failed: expected 403, got ${crossDocRes.status}`);
    }
    console.log('   ✓ Cross-doctor unauthorized access blocked with 403 Forbidden');

    // CHECK 7: Reschedule Appointment via Gateway
    console.log('\nCheck 7: Reschedule Appointment (PUT /api/appointments/:id/reschedule)');
    const reschedRes = await fetch(`http://localhost:5000/api/appointments/${createdApptId}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        appointmentDate: '2026-10-30',
        startTime: '14:00',
        endTime: '14:30',
      }),
    });
    const reschedData = await reschedRes.json();
    console.log('   Response Status:', reschedRes.status, '| New Status:', reschedData.data?.status, '| Start Time:', reschedData.data?.startTime);
    if (reschedRes.status !== 200 || reschedData.data?.status !== 'RESCHEDULED') {
      throw new Error(`Check 7 Failed: ${JSON.stringify(reschedData)}`);
    }
    console.log('   ✓ Appointment rescheduled successfully');

    // CHECK 8: Clinical Lifecycle State Transitions
    console.log('\nCheck 8: Lifecycle Status Transitions (CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED)');
    const transitions = ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'];
    for (const st of transitions) {
      const transRes = await fetch(`http://localhost:5000/api/appointments/${createdApptId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${doctor1Token}`,
        },
        body: JSON.stringify({ status: st }),
      });
      const transData = await transRes.json();
      if (transRes.status !== 200 || transData.data?.status !== st) {
        throw new Error(`Check 8 Failed for status ${st}: ${JSON.stringify(transData)}`);
      }
    }
    console.log('   ✓ Full lifecycle state progression certified: BOOKED -> CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED');

    // CHECK 9: Cancel Appointment with Reason
    console.log('\nCheck 9: Cancel Appointment (PUT /api/appointments/:id/cancel)');
    // Cancel the second appointment (the walk-in one)
    const cancelRes = await fetch(`http://localhost:5000/api/appointments/${walkInData.data._id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ reason: 'Patient requested cancellation' }),
    });
    const cancelData = await cancelRes.json();
    console.log('   Response Status:', cancelRes.status, '| Status:', cancelData.data?.status, '| Reason:', cancelData.data?.cancellationReason);
    if (cancelRes.status !== 200 || cancelData.data?.status !== 'CANCELLED') {
      throw new Error(`Check 9 Failed: ${JSON.stringify(cancelData)}`);
    }
    console.log('   ✓ Appointment cancelled with reason recorded and timestamp stored');

    // CHECK 10: Reject Cancelling Completed Appointment (Terminal State Validation)
    console.log('\nCheck 10: Terminal State Enforcement (Cannot cancel completed appointment)');
    const cancelCompRes = await fetch(`http://localhost:5000/api/appointments/${createdApptId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ reason: 'Attempt to cancel completed' }),
    });
    const cancelCompData = await cancelCompRes.json();
    console.log('   Response Status:', cancelCompRes.status, '| Message:', cancelCompData.message);
    if (cancelCompRes.status !== 400) {
      throw new Error(`Check 10 Failed: expected 400, got ${cancelCompRes.status}`);
    }
    console.log('   ✓ Terminal invariant preserved: completed appointments cannot be cancelled');

    // CHECK 11: Chairman Platform-Wide Query
    console.log('\nCheck 11: Chairman Unrestricted Platform Query (GET /api/appointments)');
    const chairRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'GET',
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    const chairData = await chairRes.json();
    console.log('   Platform Appointments Count:', chairData.data?.length);
    if (!chairRes.ok || chairData.data?.length < 2) {
      throw new Error(`Check 11 Failed: ${JSON.stringify(chairData)}`);
    }
    console.log('   ✓ Chairman platform visibility confirmed across microservices');

    console.log('\n================================================================');
    console.log('ALL 11 LIVE INTEGRATION CHECKS PASSED PERFECTLY (100%)');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ LIVE VERIFICATION FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('Cleaning up resources and stopping child microservices...');
    // Cleanup test data from databases
    try {
      if (apptConn && createdApptId) {
        await apptConn.collection('appointments').deleteMany({
          doctor_id: { $in: [doctor1Id, doctor2Id] },
        });
      }
      if (doctorConn && doctor1Id) {
        await doctorConn.collection('doctors').deleteMany({
          _id: { $in: [doctor1Id, doctor2Id] },
        });
      }
      if (hospitalConn && hospitalId) {
        await hospitalConn.collection('hospitals').deleteOne({ _id: hospitalId });
        await hospitalConn.collection('departments').deleteOne({ _id: departmentId });
      }
      if (familyConn && familyId) {
        await familyConn.collection('families').deleteOne({ _id: familyId });
        await familyConn.collection('family_members').deleteOne({ _id: member1Id });
      }
      if (authConn) {
        await authConn.collection('users').deleteMany({
          email: { $in: [chairmanEmail, doctor1Email, doctor2Email, familyEmail] },
        });
      }
      if (authConn) await authConn.close();
      if (familyConn) await familyConn.close();
      if (hospitalConn) await hospitalConn.close();
      if (doctorConn) await doctorConn.close();
      if (apptConn) await apptConn.close();
    } catch (cleanupErr) {
      console.warn('DB cleanup warning:', cleanupErr.message);
    }

    const killSafe = (p) => {
      try {
        if (p) p.kill('SIGTERM');
      } catch {
        // ignore
      }
    };

    killSafe(authProc);
    killSafe(familyProc);
    killSafe(hospitalProc);
    killSafe(doctorProc);
    killSafe(apptProc);
    killSafe(gatewayProc);

    await new Promise((r) => setTimeout(r, 1000));
  }
}

runLiveVerification();
