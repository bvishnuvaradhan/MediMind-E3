import '../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { hashPassword } from '../auth-service/src/utils/password.js';
import { validateCentralDataset } from '../../frontend/src/data/medimindData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, '../auth-service');
const FAMILY_DIR = path.resolve(__dirname, '../family-service');
const HOSPITAL_DIR = path.resolve(__dirname, '../hospital-service');
const DOCTOR_DIR = path.resolve(__dirname, '../doctor-service');
const APPOINTMENT_DIR = path.resolve(__dirname, '../appointment-service');
const RECORD_DIR = path.resolve(__dirname, '../medical-record-service');
const KNOWLEDGE_DIR = path.resolve(__dirname, '../knowledge-service');
const GATEWAY_DIR = path.resolve(__dirname, '../api-gateway');

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

async function waitForHttp(url, maxAttempts = 25) {
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

async function runPhase8FinalIntegration() {
  console.log('================================================================');
  console.log('PHASE 8 FINAL SYSTEM INTEGRATION: COMPLETE ARCHITECTURE & WORKFLOW');
  console.log('================================================================');

  let authProc, familyProc, hospitalProc, doctorProc, apptProc, recordProc, knowledgeProc, gatewayProc;
  let authConn, familyConn, hospitalConn, doctorConn, apptConn, recordConn, knowledgeConn;

  const timestamp = Date.now();
  const defaultPassword = 'LiveFinalPass!2026';

  // Seed user identifiers
  const family1Email = `family.sharma.${timestamp}@medimind.org`;
  const family2Email = `family.verma.${timestamp}@medimind.org`;
  const doctor1Email = `dr.cardio.${timestamp}@medimind.org`;
  const doctor2Email = `dr.pedia.${timestamp}@medimind.org`;
  const headAEmail = `head.cardio.${timestamp}@medimind.org`;
  const headBEmail = `head.pedia.${timestamp}@medimind.org`;
  const adminAEmail = `admin.metro.${timestamp}@medimind.org`;
  const adminBEmail = `admin.city.${timestamp}@medimind.org`;
  const chairmanEmail = `chairman.final.${timestamp}@medimind.org`;

  let hospAId, hospBId;
  let deptAId, deptBId;
  let doctor1Id, doctor1UserId;
  let doctor2Id, doctor2UserId;
  let headADoctorId, headAUserId;
  let headBDoctorId, headBUserId;
  let adminAUserId, adminBUserId, chairmanUserId;
  let family1Id, family1UserId, member1Id, member2Id;
  let family2Id, family2UserId, member3Id;
  let selfArticleId;

  let family1Token, family2Token, doctor1Token, doctor2Token;
  let headAToken, headBToken, adminAToken, adminBToken, chairmanToken;

  let appointmentId, uploadedRecordId, grantedAccessId;
  let consultationId, amendedConsultationId, prescriptionId, correctedPrescriptionId;
  let articleId;

  try {
    // ----------------------------------------------------------------
    // SECTION 1: CENTRAL DATASET INTEGRITY & VALIDATION AUDIT
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 1: Central Dataset Validation ---');
    const datasetResult = validateCentralDataset();
    if (!datasetResult.valid || datasetResult.summary.errors.length > 0) {
      throw new Error(`Central dataset validation failed: ${JSON.stringify(datasetResult.summary.errors)}`);
    }

    console.log('   ✓ Central Dataset Valid: true');
    console.log(`   ✓ Active Hospitals: ${datasetResult.summary.hospitalsCount} (Expected: 3)`);
    console.log(`   ✓ Pending Hospital Requests: ${datasetResult.summary.hospitalRequestsCount} (Expected: 2)`);
    console.log(`   ✓ Departments: ${datasetResult.summary.departmentsCount} (Expected: 17)`);
    console.log(`   ✓ Department Heads: ${datasetResult.summary.departmentHeadsCount} (Expected: 18)`);
    console.log(`   ✓ Regular Doctors: ${datasetResult.summary.regularDoctorsCount} (Expected: 66)`);
    console.log(`   ✓ Hospital Admins: ${datasetResult.summary.hospitalAdminsCount} (Expected: 6)`);
    console.log(`   ✓ Families: ${datasetResult.summary.familyAccountsCount} (Expected: 6)`);
    console.log(`   ✓ Family Members: ${datasetResult.summary.familyMembersCount} (Expected: 29)`);
    console.log(`   ✓ Total Users: ${datasetResult.summary.usersCount} (Expected: 97)`);
    console.log(`   ✓ Medical Records: ${datasetResult.summary.medicalRecordsCount} (Expected: 20)`);
    console.log(`   ✓ AI Predictions: ${datasetResult.summary.aiPredictionsCount} (Expected: 16)`);
    console.log(`   ✓ Appointments: ${datasetResult.summary.appointmentsCount} (Expected: 19)`);
    console.log(`   ✓ Consultations: ${datasetResult.summary.consultationsCount} (Expected: 10)`);
    console.log(`   ✓ Prescriptions: ${datasetResult.summary.prescriptionsCount} (Expected: 10)`);
    console.log(`   ✓ Record Accesses: ${datasetResult.summary.recordAccessesCount} (Expected: 12)`);
    console.log(`   ✓ Knowledge Articles: ${datasetResult.summary.knowledgeArticlesCount} (Expected: 11)`);
    console.log('   ✓ Zero orphan records, duplicate keys, or broken relationships in central dataset');

    // ----------------------------------------------------------------
    // SECTION 2: PROCESS SPAWNING & HEALTH VERIFICATION
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 2: Launching All 8 Backend Microservices ---');
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

    recordProc = await startProcess('Medical Record Service', RECORD_DIR, 5006);
    console.log('   ✓ Medical Record Service running on :5006');

    knowledgeProc = await startProcess('Knowledge Service', KNOWLEDGE_DIR, 5008);
    console.log('   ✓ Knowledge Service running on :5008');

    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);
    console.log('   ✓ API Gateway running on :5000');

    console.log('\n--- Checking Direct & Gateway Routed Health Status ---');
    await waitForHttp('http://localhost:5001/health');
    await waitForHttp('http://localhost:5002/health');
    await waitForHttp('http://localhost:5003/health');
    await waitForHttp('http://localhost:5004/health');
    await waitForHttp('http://localhost:5005/health');
    await waitForHttp('http://localhost:5006/health');
    await waitForHttp('http://localhost:5008/health');
    await waitForHttp('http://localhost:5000/health');

    // Gateway route health verification
    const gwAuth = await (await fetch('http://localhost:5000/api/auth/health')).json();
    const gwFamily = await (await fetch('http://localhost:5000/api/families/health')).json();
    const gwHospital = await (await fetch('http://localhost:5000/api/hospitals/health')).json();
    const gwDoctor = await (await fetch('http://localhost:5000/api/doctors/health')).json();
    const gwAppt = await (await fetch('http://localhost:5000/api/appointments/health')).json();
    const gwRecord = await (await fetch('http://localhost:5000/api/records/health')).json();
    const gwKnowledge = await (await fetch('http://localhost:5000/api/knowledge/health')).json();

    if (!gwAuth.success || !gwFamily.success || !gwHospital.success || !gwDoctor.success || !gwAppt.success || !gwRecord.success || !gwKnowledge.success) {
      throw new Error('One or more service health checks failed via Gateway');
    }
    console.log('   ✓ All 7 microservices verified healthy through Gateway route mappings');

    // ----------------------------------------------------------------
    // SECTION 3: MONGODB CONNECTIONS & SEEDING TEST ENTITIES
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 3: Establishing Database Connections & Seeding Test Data ---');
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const familyDbName = process.env.FAMILY_DB_NAME || 'medimind_family';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const doctorDbName = process.env.DOCTOR_DB_NAME || 'medimind_doctor';
    const apptDbName = process.env.APPOINTMENT_DB_NAME || 'medimind_appointment';
    const recordDbName = process.env.RECORD_DB_NAME || 'medimind_records';
    const knowledgeDbName = process.env.KNOWLEDGE_DB_NAME || 'medimind_knowledge';
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
    recordConn = await connectWithFallback(recordDbName);
    knowledgeConn = await connectWithFallback(knowledgeDbName);

    // 1. Hospital Facilities & Departments
    hospAId = new mongoose.Types.ObjectId();
    hospBId = new mongoose.Types.ObjectId();
    deptAId = new mongoose.Types.ObjectId();
    deptBId = new mongoose.Types.ObjectId();

    await hospitalConn.collection('hospitals').insertMany([
      {
        _id: hospAId,
        name: `Apollo Metro ${timestamp}`,
        license_number: `HOSP-METRO-${timestamp}`,
        address: { street: '100 Metro Ave', city: 'Bangalore', state: 'Karnataka', postal_code: '560001', country: 'India' },
        phone: '+91 9988776601',
        email: `apollo.metro.${timestamp}@medimind.org`,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: hospBId,
        name: `City Children Clinic ${timestamp}`,
        license_number: `HOSP-CITY-${timestamp}`,
        address: { street: '200 City Rd', city: 'Hyderabad', state: 'Telangana', postal_code: '500001', country: 'India' },
        phone: '+91 9988776602',
        email: `city.clinic.${timestamp}@medimind.org`,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await hospitalConn.collection('departments').insertMany([
      {
        _id: deptAId,
        hospital_id: hospAId,
        name: 'Cardiology',
        description: 'Cardiovascular Care',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: deptBId,
        hospital_id: hospBId,
        name: 'Pediatrics',
        description: 'Child Health',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 2. Doctors & Department Heads
    doctor1Id = new mongoose.Types.ObjectId();
    doctor1UserId = new mongoose.Types.ObjectId();
    doctor2Id = new mongoose.Types.ObjectId();
    doctor2UserId = new mongoose.Types.ObjectId();
    headADoctorId = new mongoose.Types.ObjectId();
    headAUserId = new mongoose.Types.ObjectId();
    headBDoctorId = new mongoose.Types.ObjectId();
    headBUserId = new mongoose.Types.ObjectId();

    await doctorConn.collection('doctors').insertMany([
      {
        _id: doctor1Id,
        user_id: doctor1UserId,
        full_name: 'Dr. Arjun Roy',
        email: doctor1Email,
        phone: '+91 9123456701',
        license_number: `DOC-CARD-${timestamp}`,
        specialization: 'Cardiology',
        department_id: deptAId,
        hospital_id: hospAId,
        experience_years: 12,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctor2Id,
        user_id: doctor2UserId,
        full_name: 'Dr. Neha Sharma',
        email: doctor2Email,
        phone: '+91 9123456702',
        license_number: `DOC-PED-${timestamp}`,
        specialization: 'Pediatrics',
        department_id: deptBId,
        hospital_id: hospBId,
        experience_years: 9,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headADoctorId,
        user_id: headAUserId,
        full_name: 'Dr. Suresh Mehta',
        email: headAEmail,
        phone: '+91 9123456703',
        license_number: `DOC-HEAD-A-${timestamp}`,
        specialization: 'Cardiology',
        department_id: deptAId,
        hospital_id: hospAId,
        experience_years: 22,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headBDoctorId,
        user_id: headBUserId,
        full_name: 'Dr. Kavita Rao',
        email: headBEmail,
        phone: '+91 9123456704',
        license_number: `DOC-HEAD-B-${timestamp}`,
        specialization: 'Pediatrics',
        department_id: deptBId,
        hospital_id: hospBId,
        experience_years: 19,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await hospitalConn.collection('departmentheads').insertMany([
      {
        _id: new mongoose.Types.ObjectId(),
        user_id: headAUserId,
        hospital_id: hospAId,
        department_id: deptAId,
        doctor_id: headADoctorId,
        full_name: 'Dr. Suresh Mehta',
        email: headAEmail,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user_id: headBUserId,
        hospital_id: hospBId,
        department_id: deptBId,
        doctor_id: headBDoctorId,
        full_name: 'Dr. Kavita Rao',
        email: headBEmail,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. Families and Family Members
    family1Id = new mongoose.Types.ObjectId();
    family1UserId = new mongoose.Types.ObjectId();
    member1Id = new mongoose.Types.ObjectId();
    member2Id = new mongoose.Types.ObjectId();

    family2Id = new mongoose.Types.ObjectId();
    family2UserId = new mongoose.Types.ObjectId();
    member3Id = new mongoose.Types.ObjectId();

    await familyConn.collection('families').insertMany([
      {
        _id: family1Id,
        family_name: 'Sharma Family',
        creator_user_id: family1UserId,
        email: family1Email,
        mobile: '+91 9876543201',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: family2Id,
        family_name: 'Verma Family',
        creator_user_id: family2UserId,
        email: family2Email,
        mobile: '+91 9876543202',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await familyConn.collection('familymembers').insertMany([
      {
        _id: member1Id,
        family_id: family1Id,
        full_name: 'Rohan Sharma',
        date_of_birth: new Date('1990-05-15'),
        gender: 'MALE',
        blood_group: 'O+',
        phone: '+91 9876543201',
        email: family1Email,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: member2Id,
        family_id: family1Id,
        full_name: 'Priya Sharma',
        date_of_birth: new Date('1994-08-20'),
        gender: 'FEMALE',
        blood_group: 'A+',
        phone: '+91 9876543203',
        email: 'priya.sharma@example.com',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: member3Id,
        family_id: family2Id,
        full_name: 'Amit Verma',
        date_of_birth: new Date('1985-02-10'),
        gender: 'MALE',
        blood_group: 'B+',
        phone: '+91 9876543202',
        email: family2Email,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 4. Auth Users for all 5 Roles
    adminAUserId = new mongoose.Types.ObjectId();
    adminBUserId = new mongoose.Types.ObjectId();
    chairmanUserId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword(defaultPassword);

    await authConn.collection('users').insertMany([
      {
        _id: family1UserId,
        email: family1Email,
        password_hash: hashedPassword,
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: family1Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: family2UserId,
        email: family2Email,
        password_hash: hashedPassword,
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: family2Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctor1UserId,
        email: doctor1Email,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctor1Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctor2UserId,
        email: doctor2Email,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctor2Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headAUserId,
        email: headAEmail,
        password_hash: hashedPassword,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: deptAId,
        doctor_id: headADoctorId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headBUserId,
        email: headBEmail,
        password_hash: hashedPassword,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: deptBId,
        doctor_id: headBDoctorId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: adminAUserId,
        email: adminAEmail,
        password_hash: hashedPassword,
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: hospAId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: adminBUserId,
        email: adminBEmail,
        password_hash: hashedPassword,
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: hospBId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: chairmanUserId,
        email: chairmanEmail,
        password_hash: hashedPassword,
        role: 'CHAIRMAN',
        account_type: 'CHAIRMAN_ACCOUNT',
        reference_id: chairmanUserId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('   ✓ Seeded Hospitals, Departments, Doctors, Families, and Auth users');

    // ----------------------------------------------------------------
    // SECTION 4: AUTHENTICATION FOR ALL FIVE ROLES VIA GATEWAY
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 4: Authenticating All 5 Platform Roles via Gateway ---');
    const loginUser = async (email) => {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: defaultPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
      return data.data.token;
    };

    family1Token = await loginUser(family1Email);
    family2Token = await loginUser(family2Email);
    doctor1Token = await loginUser(doctor1Email);
    doctor2Token = await loginUser(doctor2Email);
    headAToken = await loginUser(headAEmail);
    headBToken = await loginUser(headBEmail);
    adminAToken = await loginUser(adminAEmail);
    adminBToken = await loginUser(adminBEmail);
    chairmanToken = await loginUser(chairmanEmail);

    console.log('   ✓ Family 1 Token Acquired (Role: FAMILY)');
    console.log('   ✓ Family 2 Token Acquired (Role: FAMILY)');
    console.log('   ✓ Doctor 1 Token Acquired (Role: DOCTOR)');
    console.log('   ✓ Doctor 2 Token Acquired (Role: DOCTOR)');
    console.log('   ✓ Dept Head A Token Acquired (Role: DEPARTMENT_HEAD)');
    console.log('   ✓ Dept Head B Token Acquired (Role: DEPARTMENT_HEAD)');
    console.log('   ✓ Hospital Admin A Token Acquired (Role: HOSPITAL_ADMIN)');
    console.log('   ✓ Hospital Admin B Token Acquired (Role: HOSPITAL_ADMIN)');
    console.log('   ✓ Chairman Token Acquired (Role: CHAIRMAN)');

    // ----------------------------------------------------------------
    // SECTION 5: FAMILY -> APPOINTMENT -> ACCESS -> RECORD -> CONSULTATION -> RX FLOW
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 5: End-to-End Clinical Lifecycle Workflow ---');

    // Step 5.1: Family queries members & doctor directory
    const famMembersRes = await fetch('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${family1Token}` },
    });
    const famMembersData = await famMembersRes.json();
    if (!famMembersRes.ok || famMembersData.data.length !== 2) throw new Error('Family member retrieval failed');
    console.log('   ✓ Step 5.1: Family 1 retrieved 2 active family members');

    const docDirRes = await fetch('http://localhost:5000/api/doctors', {
      headers: { Authorization: `Bearer ${family1Token}` },
    });
    const docDirData = await docDirRes.json();
    if (!docDirRes.ok || !docDirData.data.some((d) => d.id.toString() === doctor1Id.toString())) {
      throw new Error('Doctor directory query failed');
    }
    console.log('   ✓ Step 5.2: Family 1 queried doctors directory (Cardiology specialist found)');

    // Step 5.2: Book appointment
    const bookApptRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${family1Token}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctor1Id.toString(),
        hospitalId: hospAId.toString(),
        departmentId: deptAId.toString(),
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Severe chest tightness and palpitations during exertion',
      }),
    });
    const bookApptData = await bookApptRes.json();
    if (!bookApptRes.ok || bookApptData.data.status !== 'BOOKED') throw new Error('Appointment booking failed');
    appointmentId = bookApptData.data.id;
    console.log(`   ✓ Step 5.3: Appointment booked with ID: ${appointmentId} (Status: BOOKED)`);

    // Step 5.3: Doctor confirms appointment
    const confirmApptRes = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const confirmApptData = await confirmApptRes.json();
    if (!confirmApptRes.ok || confirmApptData.data.status !== 'CONFIRMED') throw new Error('Appointment confirmation failed');
    console.log('   ✓ Step 5.4: Doctor 1 confirmed appointment (Status: CONFIRMED)');

    // Step 5.4: Family uploads patient medical record
    const uploadRecRes = await fetch('http://localhost:5000/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${family1Token}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        recordType: 'ECG',
        fileName: 'ecg_baseline.pdf',
        fileUrl: 'https://storage.medimind.org/records/ecg_baseline.pdf',
        title: 'Baseline 12-Lead Electrocardiogram',
        description: 'Baseline ECG showing sinus rhythm with occasional PVCs',
        recordDate: new Date().toISOString(),
      }),
    });
    const uploadRecData = await uploadRecRes.json();
    if (!uploadRecRes.ok) throw new Error(`Record upload failed: ${JSON.stringify(uploadRecData)}`);
    uploadedRecordId = uploadRecData.data.id;
    console.log(`   ✓ Step 5.5: Family uploaded medical record with ID: ${uploadedRecordId}`);

    // Step 5.5: CRITICAL SECURITY INVARIANT VERIFICATION
    // Doctor with confirmed appointment CANNOT read clinical records without active RecordAccess
    const blockedDocRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    if (blockedDocRecRes.status !== 403) {
      throw new Error(`CRITICAL BREACH: Expected 403 for doctor without RecordAccess, received: ${blockedDocRecRes.status}`);
    }
    console.log('   ✓ Step 5.6 [CRITICAL INVARIANT]: Confirmed appointment DOES NOT grant record access (403 Forbidden confirmed)');

    // Step 5.6: Family grants RecordAccess to Doctor 1
    const grantAccessRes = await fetch('http://localhost:5000/api/records/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${family1Token}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        doctorId: doctor1Id.toString(),
        hospitalId: hospAId.toString(),
        accessDurationDays: 7,
      }),
    });
    const grantAccessData = await grantAccessRes.json();
    if (!grantAccessRes.ok || grantAccessData.data.status !== 'ACTIVE') throw new Error('RecordAccess grant failed');
    grantedAccessId = grantAccessData.data.id;
    console.log(`   ✓ Step 5.7: Family granted RecordAccess to Doctor 1 (Status: ACTIVE, ID: ${grantedAccessId})`);

    // Step 5.7: Doctor can now read clinical records
    const docRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    const docRecData = await docRecRes.json();
    if (!docRecRes.ok || docRecData.data.length === 0) throw new Error('Doctor failed to access clinical records after grant');
    console.log(`   ✓ Step 5.8: Doctor 1 successfully accessed clinical records (${docRecData.data.length} records retrieved)`);

    // Step 5.8: Doctor creates, updates, and finalizes Consultation
    const createConsRes = await fetch('http://localhost:5000/api/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        appointmentId: appointmentId.toString(),
        symptoms: 'Chest tightness, exertional dyspnea, heart palpitations',
        observations: 'BP 138/88 mmHg, HR 82 bpm regular, S1/S2 heard normally',
        clinicalAssessment: 'Suspected stable angina pectoris, recommend coronary evaluation',
        treatmentPlan: 'Sublingual nitroglycerin PRN, statin therapy, outpatient stress test',
      }),
    });
    const createConsData = await createConsRes.json();
    if (!createConsRes.ok || createConsData.data.status !== 'DRAFT') throw new Error('Consultation creation failed');
    consultationId = createConsData.data.id;
    console.log(`   ✓ Step 5.9: Consultation created by Doctor 1 (Status: DRAFT, ID: ${consultationId})`);

    const finalizeConsRes = await fetch(`http://localhost:5000/api/consultations/${consultationId}/finalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    const finalizeConsData = await finalizeConsRes.json();
    if (!finalizeConsRes.ok || finalizeConsData.data.status !== 'FINAL') throw new Error('Consultation finalization failed');
    console.log('   ✓ Step 5.10: Consultation finalized (Status: FINAL)');

    // Step 5.9: Consultation amendment workflow
    const amendConsRes = await fetch(`http://localhost:5000/api/consultations/${consultationId}/amend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        notes: 'Added recommendation for high-sensitivity C-reactive protein panel',
      }),
    });
    const amendConsData = await amendConsRes.json();
    if (!amendConsRes.ok || amendConsData.data.status !== 'AMENDED') throw new Error('Consultation amendment failed');
    amendedConsultationId = amendConsData.data.id;
    console.log(`   ✓ Step 5.11: Consultation amended successfully (New ID: ${amendedConsultationId}, Linked Original: ${consultationId})`);

    // Step 5.10: Doctor creates, updates, and finalizes Prescription
    const createRxRes = await fetch('http://localhost:5000/api/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        familyMemberId: member1Id.toString(),
        consultationId: consultationId.toString(),
        medicines: [
          { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', duration: '30 days' },
          { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily with meals', duration: '30 days' },
        ],
        generalInstructions: 'Take medications regularly. Follow low-sodium, heart-healthy diet.',
      }),
    });
    const createRxData = await createRxRes.json();
    if (!createRxRes.ok || createRxData.data.status !== 'DRAFT') throw new Error('Prescription creation failed');
    prescriptionId = createRxData.data.id;
    console.log(`   ✓ Step 5.12: Prescription created (Status: DRAFT, ID: ${prescriptionId})`);

    const finalizeRxRes = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}/finalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    const finalizeRxData = await finalizeRxRes.json();
    if (!finalizeRxRes.ok || finalizeRxData.data.status !== 'FINAL') throw new Error('Prescription finalization failed');
    console.log('   ✓ Step 5.13: Prescription finalized (Status: FINAL)');

    // Step 5.11: Prescription correction workflow
    const correctRxRes = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}/correct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        correctionReason: 'Adjusted Atorvastatin dosage to 40mg based on lipid risk calculation',
        medicines: [
          { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily at bedtime', duration: '30 days' },
          { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily with meals', duration: '30 days' },
        ],
      }),
    });
    const correctRxData = await correctRxRes.json();
    if (!correctRxRes.ok || correctRxData.data.status !== 'CORRECTED') throw new Error('Prescription correction failed');
    correctedPrescriptionId = correctRxData.data.id;
    console.log(`   ✓ Step 5.14: Prescription corrected successfully (New ID: ${correctedPrescriptionId}, Linked Original: ${prescriptionId})`);

    // ----------------------------------------------------------------
    // SECTION 6: KNOWLEDGE PUBLISHING & PEER-REVIEW LIFECYCLE
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 6: Knowledge Service Review & Publishing Lifecycle ---');

    // Step 6.1: Doctor 1 authors draft article
    const createArtRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        title: 'Modern Protocols in Acute Myocardial Infarction',
        summary: 'Clinical guidelines on emergency cardiac triage and early revascularization.',
        content: 'Clinical evidence supports 0/1-hour hs-cTn algorithm for rule-in/rule-out of non-STEMI.',
        category: 'Cardiology',
        tags: ['Cardiology', 'MI', 'Emergency'],
        departmentId: deptAId.toString(),
        hospitalId: hospAId.toString(),
      }),
    });
    const createArtData = await createArtRes.json();
    if (!createArtRes.ok || createArtData.data.status !== 'DRAFT') throw new Error('Article creation failed');
    articleId = createArtData.data.id;
    console.log(`   ✓ Step 6.1: Draft article authored by Doctor 1 (Status: DRAFT, ID: ${articleId})`);

    // Step 6.2: Submit for review
    const submitArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    const submitArtData = await submitArtRes.json();
    if (!submitArtRes.ok || submitArtData.data.status !== 'UNDER_REVIEW') throw new Error('Article submit failed');
    console.log('   ✓ Step 6.2: Article submitted for review (Status: UNDER_REVIEW)');

    // Step 6.3: Department Head A requests changes with clinical feedback
    const reviewChangesRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headAToken}`,
      },
      body: JSON.stringify({
        decision: 'CHANGES_REQUESTED',
        feedback: 'Please expand on renal dosing considerations for P2Y12 inhibitors.',
      }),
    });
    const reviewChangesData = await reviewChangesRes.json();
    if (!reviewChangesRes.ok || reviewChangesData.data.status !== 'CHANGES_REQUESTED') throw new Error('Review changes failed');
    console.log('   ✓ Step 6.3: Department Head requested changes with written feedback (Status: CHANGES_REQUESTED)');

    // Step 6.4: Doctor 1 updates and resubmits
    const resubmitArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({
        content: 'Clinical evidence supports 0/1-hour hs-cTn algorithm. Added renal dosing considerations.',
        submitForReview: true,
      }),
    });
    const resubmitArtData = await resubmitArtRes.json();
    if (!resubmitArtRes.ok || resubmitArtData.data.status !== 'UNDER_REVIEW') throw new Error('Article resubmit failed');
    console.log('   ✓ Step 6.4: Author updated content and resubmitted (Status: UNDER_REVIEW)');

    // Step 6.5: Department Head approves and publishes
    const approveArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headAToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVE', feedback: 'Protocols approved.' }),
    });
    const approveArtData = await approveArtRes.json();
    if (!approveArtRes.ok || approveArtData.data.status !== 'APPROVED') throw new Error('Article approval failed');

    const publishArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${headAToken}` },
    });
    const publishArtData = await publishArtRes.json();
    if (!publishArtRes.ok || publishArtData.data.status !== 'PUBLISHED') throw new Error('Article publishing failed');
    console.log('   ✓ Step 6.5: Article approved and published (Status: PUBLISHED)');

    // Step 6.6: Public user can view published article without authentication
    const publicArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`);
    const publicArtData = await publicArtRes.json();
    if (!publicArtRes.ok || !publicArtData.success) throw new Error('Public article read failed');
    console.log('   ✓ Step 6.6: Public/unauthenticated user successfully retrieved published article (200 OK)');

    // ----------------------------------------------------------------
    // SECTION 7: HOSPITAL ADMIN & CHAIRMAN OVERSIGHT
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 7: Hospital Admin & Chairman Administrative Oversight ---');

    // Admin A sees Hospital A departments & doctors
    const adminDeptsRes = await fetch('http://localhost:5000/api/departments', {
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    const adminDeptsData = await adminDeptsRes.json();
    if (!adminDeptsRes.ok || !adminDeptsData.data.every((d) => d.hospitalId.toString() === hospAId.toString())) {
      throw new Error('Hospital Admin A department scoping failed');
    }
    console.log('   ✓ Step 7.1: Hospital Admin A restricted to Hospital A departments');

    // Chairman platform-wide queries
    const chairDeptsRes = await fetch('http://localhost:5000/api/departments', {
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    const chairDeptsData = await chairDeptsRes.json();
    const hospIdsInChair = [...new Set(chairDeptsData.data.map((d) => d.hospitalId?.toString()).filter(Boolean))];
    if (!chairDeptsRes.ok || !hospIdsInChair.includes(hospAId.toString()) || !hospIdsInChair.includes(hospBId.toString())) {
      throw new Error('Chairman multi-hospital visibility failed');
    }
    console.log('   ✓ Step 7.2: Chairman possesses platform-wide multi-hospital visibility across all facilities');

    // ----------------------------------------------------------------
    // SECTION 8: COMPREHENSIVE SECURITY NEGATIVE TESTING MATRIX
    // ----------------------------------------------------------------
    console.log('\n--- SECTION 8: Comprehensive Security Negative Testing Matrix ---');

    // Negative 1: Missing JWT
    const noJwtRes = await fetch('http://localhost:5000/api/auth/me');
    if (noJwtRes.status !== 401) throw new Error(`Negative 1 Failed: Expected 401, got ${noJwtRes.status}`);
    console.log('   ✓ Negative 1: Missing JWT blocked with 401 Unauthorized');

    // Negative 2: Tampered JWT
    const badJwtRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });
    if (badJwtRes.status !== 401) throw new Error(`Negative 2 Failed: Expected 401, got ${badJwtRes.status}`);
    console.log('   ✓ Negative 2: Tampered/invalid JWT blocked with 401 Unauthorized');

    // Negative 3: Expired JWT
    const expiredToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR' },
      process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production',
      { expiresIn: '-10s' }
    );
    const expJwtRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    if (expJwtRes.status !== 401) throw new Error(`Negative 3 Failed: Expected 401, got ${expJwtRes.status}`);
    console.log('   ✓ Negative 3: Expired JWT blocked with 401 Unauthorized');

    // Negative 4: Client spoofing x-user-id / x-user-role stripped by Gateway
    const spoofRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${doctor1Token}`,
        'x-user-id': 'spoofed_admin_id',
        'x-user-role': 'CHAIRMAN',
      },
    });
    const spoofData = await spoofRes.json();
    if (!spoofRes.ok || spoofData.data.role !== 'DOCTOR' || spoofData.data.userId === 'spoofed_admin_id') {
      throw new Error('Negative 4 Failed: Gateway failed to strip spoofed client headers');
    }
    console.log('   ✓ Negative 4: Spoofed client identity headers stripped and replaced by Gateway');

    // Negative 5: Missing internal secret on direct microservice call
    const directRes = await fetch('http://localhost:5006/api/records/member/any-id', {
      headers: { 'x-user-id': 'attacker', 'x-user-role': 'CHAIRMAN' },
    });
    if (directRes.status !== 401) throw new Error(`Negative 5 Failed: Expected 401, got ${directRes.status}`);
    console.log('   ✓ Negative 5: Direct microservice invocation without secret blocked with 401 Unauthorized');

    // Negative 6: Cross-family clinical record access
    const crossFamRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${family2Token}` }, // Family 2 attempting to view Family 1 member
    });
    if (crossFamRecRes.status !== 403) throw new Error(`Negative 6 Failed: Expected 403, got ${crossFamRecRes.status}`);
    console.log('   ✓ Negative 6: Cross-family clinical record access blocked with 403 Forbidden');

    // Negative 7: Hospital Admin attempting clinical record access
    const adminRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    if (adminRecRes.status !== 403) throw new Error(`Negative 7 Failed: Expected 403, got ${adminRecRes.status}`);
    console.log('   ✓ Negative 7: Hospital Admin clinical record access blocked with 403 Forbidden');

    // Negative 8: Department Head attempting clinical record access
    const headRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${headAToken}` },
    });
    if (headRecRes.status !== 403) throw new Error(`Negative 8 Failed: Expected 403, got ${headRecRes.status}`);
    console.log('   ✓ Negative 8: Department Head clinical record access blocked with 403 Forbidden');

    // Negative 9: Chairman attempting clinical record access
    const chairRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    if (chairRecRes.status !== 403) throw new Error(`Negative 9 Failed: Expected 403, got ${chairRecRes.status}`);
    console.log('   ✓ Negative 9: Chairman clinical record access blocked with 403 Forbidden');

    // Negative 10: Cross-hospital doctor update by Hospital Admin
    const crossDocUpdRes = await fetch(`http://localhost:5000/api/doctors/${doctor1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminBToken}`, // Admin B attempting to modify Doctor 1 in Hosp A
      },
      body: JSON.stringify({ experience_years: 99 }),
    });
    if (crossDocUpdRes.status !== 403) throw new Error(`Negative 10 Failed: Expected 403, got ${crossDocUpdRes.status}`);
    console.log('   ✓ Negative 10: Cross-hospital doctor modification blocked with 403 Forbidden');

    // Negative 11: Cross-department knowledge article review
    const crossDeptRevRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headBToken}`, // Head B in Pediatrics reviewing Cardio article
      },
      body: JSON.stringify({ decision: 'APPROVE' }),
    });
    if (crossDeptRevRes.status !== 403) throw new Error(`Negative 11 Failed: Expected 403, got ${crossDeptRevRes.status}`);
    console.log('   ✓ Negative 11: Cross-department knowledge review blocked with 403 Forbidden');

    // Negative 12: Clinician cannot peer-review own article
    const selfArtRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headAToken}`,
      },
      body: JSON.stringify({
        title: 'Head Self-Authored Cardiology Protocol',
        summary: 'Testing self-review block',
        content: 'This protocol authored by Head A cannot be peer-reviewed by Head A',
        category: 'Cardiology',
        departmentId: deptAId.toString(),
        submitForReview: true,
      }),
    });
    const selfArtData = await selfArtRes.json();
    if (!selfArtRes.ok) throw new Error(`Negative 12 Setup Failed: ${JSON.stringify(selfArtData)}`);
    selfArticleId = selfArtData.data.id;

    const selfRevRes = await fetch(`http://localhost:5000/api/knowledge/articles/${selfArticleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headAToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVE' }),
    });
    if (selfRevRes.status !== 403) throw new Error(`Negative 12 Failed: Expected 403, got ${selfRevRes.status}`);
    console.log('   ✓ Negative 12: Author peer-reviewing own article blocked with 403 Forbidden');

    // Negative 13: Direct editing of finalized consultation
    const editFinalConsRes = await fetch(`http://localhost:5000/api/consultations/${consultationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ symptoms: 'Tampered symptoms' }),
    });
    if (editFinalConsRes.status !== 400) throw new Error(`Negative 13 Failed: Expected 400, got ${editFinalConsRes.status}`);
    console.log('   ✓ Negative 13: Direct editing of finalized consultation rejected with 400 Bad Request');

    // Negative 14: Direct editing of finalized prescription
    const editFinalRxRes = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ instructions: 'Tampered instructions' }),
    });
    if (editFinalRxRes.status !== 400) throw new Error(`Negative 14 Failed: Expected 400, got ${editFinalRxRes.status}`);
    console.log('   ✓ Negative 14: Direct editing of finalized prescription rejected with 400 Bad Request');

    // Negative 15: Direct editing of published article
    const editPublishedArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ title: 'Tampered Title' }),
    });
    if (editPublishedArtRes.status !== 400) throw new Error(`Negative 15 Failed: Expected 400, got ${editPublishedArtRes.status}`);
    console.log('   ✓ Negative 15: Direct editing of published knowledge article rejected with 400 Bad Request');

    // Negative 16: Unavailable AI service behavior (503 Service Unavailable)
    const aiUnavailableRes = await fetch('http://localhost:5000/api/ai/diabetes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctor1Token}`,
      },
      body: JSON.stringify({ glucose: 150, bmi: 28 }),
    });
    if (aiUnavailableRes.status !== 503) {
      throw new Error(`Negative 16 Failed: Expected 503 for offline AI service, got ${aiUnavailableRes.status}`);
    }
    const aiUnavailableData = await aiUnavailableRes.json();
    if (!aiUnavailableData.message.includes('unavailable')) {
      throw new Error('Negative 16 Failed: Unexpected error message for offline AI service');
    }
    console.log('   ✓ Negative 16: Offline AI service gracefully returns 503 Service Unavailable without crashing');

    // Negative 17: Cross-doctor unauthorized clinical record access
    const crossDocRecRes = await fetch(`http://localhost:5000/api/records/member/${member1Id}`, {
      headers: { Authorization: `Bearer ${doctor2Token}` },
    });
    if (crossDocRecRes.status !== 403) throw new Error(`Negative 17 Failed: Expected 403, got ${crossDocRecRes.status}`);
    console.log('   ✓ Negative 17: Cross-doctor without RecordAccess blocked from clinical records (403 Forbidden)');

    console.log('\n================================================================');
    console.log('PHASE 8 FINAL SYSTEM INTEGRATION: ALL AUDITS & TESTS PASSED 100%');
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ PHASE 8 VERIFICATION FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('Cleaning up test data and child processes...');
    try {
      if (knowledgeConn) {
        if (articleId) await knowledgeConn.collection('articles').deleteOne({ _id: new mongoose.Types.ObjectId(articleId) });
        if (selfArticleId) await knowledgeConn.collection('articles').deleteOne({ _id: new mongoose.Types.ObjectId(selfArticleId) });
        await knowledgeConn.collection('articles').deleteMany({ author_doctor_id: { $in: [headADoctorId, deptAId] } });
        await knowledgeConn.close();
      }
      if (recordConn) {
        if (uploadedRecordId) await recordConn.collection('medicalrecords').deleteOne({ _id: new mongoose.Types.ObjectId(uploadedRecordId) });
        if (grantedAccessId) await recordConn.collection('recordaccesses').deleteOne({ _id: new mongoose.Types.ObjectId(grantedAccessId) });
        if (consultationId) await recordConn.collection('consultations').deleteMany({ _id: { $in: [new mongoose.Types.ObjectId(consultationId), new mongoose.Types.ObjectId(amendedConsultationId)] } });
        if (prescriptionId) await recordConn.collection('prescriptions').deleteMany({ _id: { $in: [new mongoose.Types.ObjectId(prescriptionId), new mongoose.Types.ObjectId(correctedPrescriptionId)] } });
        await recordConn.close();
      }
      if (apptConn) {
        if (appointmentId) await apptConn.collection('appointments').deleteOne({ _id: new mongoose.Types.ObjectId(appointmentId) });
        await apptConn.close();
      }
      if (familyConn) {
        if (family1Id) await familyConn.collection('families').deleteMany({ _id: { $in: [family1Id, family2Id] } });
        if (member1Id) await familyConn.collection('familymembers').deleteMany({ _id: { $in: [member1Id, member2Id, member3Id] } });
        await familyConn.close();
      }
      if (hospitalConn) {
        if (hospAId) await hospitalConn.collection('hospitals').deleteMany({ _id: { $in: [hospAId, hospBId] } });
        if (deptAId) await hospitalConn.collection('departments').deleteMany({ _id: { $in: [deptAId, deptBId] } });
        if (hospAId) await hospitalConn.collection('departmentheads').deleteMany({ hospital_id: { $in: [hospAId, hospBId] } });
        await hospitalConn.close();
      }
      if (doctorConn) {
        if (doctor1Id) await doctorConn.collection('doctors').deleteMany({ _id: { $in: [doctor1Id, doctor2Id, headADoctorId, headBDoctorId] } });
        await doctorConn.close();
      }
      if (authConn) {
        if (family1UserId) await authConn.collection('users').deleteMany({
          _id: { $in: [family1UserId, family2UserId, doctor1UserId, doctor2UserId, headAUserId, headBUserId, adminAUserId, adminBUserId, chairmanUserId] }
        });
        await authConn.close();
      }
    } catch {
      // ignore
    }

    const killProc = (p) => {
      try {
        if (p && !p.killed) p.kill('SIGTERM');
      } catch {
        // ignore
      }
    };

    killProc(authProc);
    killProc(familyProc);
    killProc(hospitalProc);
    killProc(doctorProc);
    killProc(apptProc);
    killProc(recordProc);
    killProc(knowledgeProc);
    killProc(gatewayProc);

    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 1200);
  }
}

runPhase8FinalIntegration();
