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
const APPOINTMENT_DIR = path.resolve(__dirname, '../../appointment-service');
const RECORD_DIR = path.resolve(__dirname, '../../medical-record-service');
const KNOWLEDGE_DIR = path.resolve(__dirname, '../');
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
  console.log('PHASE 7 LIVE INTEGRATION VERIFICATION: ALL MICROSERVICES + KNOWLEDGE');
  console.log('================================================================');

  let authProc, familyProc, hospitalProc, doctorProc, apptProc, recordProc, knowledgeProc, gatewayProc;
  let authConn, hospitalConn, doctorConn, knowledgeConn;

  const timestamp = Date.now();
  const doctorAEmail = `dr.alice.k.${timestamp}@medimind.org`;
  const doctorBEmail = `dr.bob.k.${timestamp}@medimind.org`;
  const deptHeadEmail = `head.cardio.${timestamp}@medimind.org`;
  const adminAEmail = `admin.hospa.${timestamp}@medimind.org`;
  const adminBEmail = `admin.hospb.${timestamp}@medimind.org`;
  const chairmanEmail = `chairman.k.${timestamp}@medimind.org`;
  const familyEmail = `family.k.${timestamp}@medimind.org`;
  const defaultPassword = 'LiveKnowledgePass!2026';

  let hospAId, hospBId;
  let deptAId, deptBId;
  let doctorAId, doctorAUserId;
  let doctorBId, doctorBUserId;
  let deptHeadDoctorId, deptHeadUserId;
  let adminAUserId, adminBUserId, chairmanUserId, familyUserId;

  let doctorAToken, doctorBToken, deptHeadToken, adminAToken, adminBToken, chairmanToken, familyToken;
  let articleId;

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

    recordProc = await startProcess('Medical Record Service', RECORD_DIR, 5006);
    console.log('   ✓ Medical Record Service running on :5006');

    knowledgeProc = await startProcess('Knowledge Service', KNOWLEDGE_DIR, 5008);
    console.log('   ✓ Knowledge Service running on :5008');

    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);
    console.log('   ✓ API Gateway running on :5000');

    console.log('\n2. Verifying Microservices Health...');
    await waitForHttp('http://localhost:5001/health');
    console.log('   ✓ Auth Service healthy');

    await waitForHttp('http://localhost:5002/health');
    console.log('   ✓ Family Service healthy');

    await waitForHttp('http://localhost:5003/health');
    console.log('   ✓ Hospital Service healthy');

    await waitForHttp('http://localhost:5004/health');
    console.log('   ✓ Doctor Service healthy');

    await waitForHttp('http://localhost:5005/health');
    console.log('   ✓ Appointment Service healthy');

    await waitForHttp('http://localhost:5006/health');
    console.log('   ✓ Medical Record Service healthy');

    await waitForHttp('http://localhost:5008/health');
    const knowH = await (await fetch('http://localhost:5008/health')).json();
    console.log('   ✓ Knowledge Service healthy:', knowH.data.status, '| DB:', knowH.data.database);

    await waitForHttp('http://localhost:5000/health');
    const gwH = await (await fetch('http://localhost:5000/health')).json();
    console.log('   ✓ API Gateway healthy:', gwH.data.status, '| Request ID:', gwH.data.requestId);

    const gwKnowH = await (await fetch('http://localhost:5000/api/knowledge/health')).json();
    console.log('   ✓ Knowledge Service reachable via Gateway:', gwKnowH.data.status);

    // Database connections
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const doctorDbName = process.env.DOCTOR_DB_NAME || 'medimind_doctor';
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
    hospitalConn = await connectWithFallback(hospitalDbName);
    doctorConn = await connectWithFallback(doctorDbName);
    knowledgeConn = await connectWithFallback(knowledgeDbName);

    console.log('\n3. Seeding Test Entities Across Microservices...');

    // 1. Hospital A & Hospital B
    hospAId = new mongoose.Types.ObjectId();
    hospBId = new mongoose.Types.ObjectId();
    deptAId = new mongoose.Types.ObjectId();
    deptBId = new mongoose.Types.ObjectId();

    await hospitalConn.collection('hospitals').insertMany([
      {
        _id: hospAId,
        name: `Apollo Metropolitan Hospital ${timestamp}`,
        license_number: `HOSP-A-${timestamp}`,
        address: { street: '100 Metro Ave', city: 'Bangalore', state: 'Karnataka', postal_code: '560001', country: 'India' },
        phone: '+91 9988776651',
        email: `apollom.${timestamp}@medimind.org`,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: hospBId,
        name: `City Children Hospital ${timestamp}`,
        license_number: `HOSP-B-${timestamp}`,
        address: { street: '200 City Rd', city: 'Hyderabad', state: 'Telangana', postal_code: '500001', country: 'India' },
        phone: '+91 9988776652',
        email: `citych.${timestamp}@medimind.org`,
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
        description: 'Department of Cardiovascular Medicine',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: deptBId,
        hospital_id: hospBId,
        name: 'Pediatrics',
        description: 'Department of Child & Adolescent Health',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 2. Doctor A in Dept A (Hosp A)
    doctorAId = new mongoose.Types.ObjectId();
    doctorAUserId = new mongoose.Types.ObjectId();
    await doctorConn.collection('doctors').insertOne({
      _id: doctorAId,
      user_id: doctorAUserId,
      full_name: 'Dr. Alice Carter',
      email: doctorAEmail,
      phone: '+91 9123456781',
      license_number: `DOC-A-${timestamp}`,
      specialization: 'Cardiology',
      department_id: deptAId,
      hospital_id: hospAId,
      experience_years: 10,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 3. Doctor B in Dept B (Hosp B)
    doctorBId = new mongoose.Types.ObjectId();
    doctorBUserId = new mongoose.Types.ObjectId();
    await doctorConn.collection('doctors').insertOne({
      _id: doctorBId,
      user_id: doctorBUserId,
      full_name: 'Dr. Bob Davis',
      email: doctorBEmail,
      phone: '+91 9123456782',
      license_number: `DOC-B-${timestamp}`,
      specialization: 'Pediatrics',
      department_id: deptBId,
      hospital_id: hospBId,
      experience_years: 8,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Department Head for Dept A
    deptHeadDoctorId = new mongoose.Types.ObjectId();
    deptHeadUserId = new mongoose.Types.ObjectId();
    await doctorConn.collection('doctors').insertOne({
      _id: deptHeadDoctorId,
      user_id: deptHeadUserId,
      full_name: 'Dr. Evelyn Stone',
      email: deptHeadEmail,
      phone: '+91 9123456783',
      license_number: `DOC-HEAD-${timestamp}`,
      specialization: 'Cardiology',
      department_id: deptAId,
      hospital_id: hospAId,
      experience_years: 18,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await hospitalConn.collection('department_heads').insertOne({
      _id: new mongoose.Types.ObjectId(),
      hospital_id: hospAId,
      department_id: deptAId,
      doctor_id: deptHeadDoctorId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 5. Auth Users
    adminAUserId = new mongoose.Types.ObjectId();
    adminBUserId = new mongoose.Types.ObjectId();
    chairmanUserId = new mongoose.Types.ObjectId();
    familyUserId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword(defaultPassword);

    await authConn.collection('users').insertMany([
      {
        _id: doctorAUserId,
        email: doctorAEmail,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctorAId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctorBUserId,
        email: doctorBEmail,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctorBId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: deptHeadUserId,
        email: deptHeadEmail,
        password_hash: hashedPassword,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: deptAId,
        doctor_id: deptHeadDoctorId,
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
      {
        _id: familyUserId,
        email: familyEmail,
        password_hash: hashedPassword,
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyUserId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('   ✓ Seeded Hospitals, Departments, Doctors, and Auth credentials');

    console.log('\n4. Authenticating Users via API Gateway...');
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

    doctorAToken = await loginUser(doctorAEmail);
    doctorBToken = await loginUser(doctorBEmail);
    deptHeadToken = await loginUser(deptHeadEmail);
    adminAToken = await loginUser(adminAEmail);
    adminBToken = await loginUser(adminBEmail);
    chairmanToken = await loginUser(chairmanEmail);
    familyToken = await loginUser(familyEmail);

    console.log('   ✓ Acquired JWT tokens for DOCTOR_A, DOCTOR_B, DEPT_HEAD, ADMIN_A, ADMIN_B, CHAIRMAN, FAMILY');

    console.log('\n5. Executing Knowledge Article End-to-End Workflow via API Gateway...');

    // A. Doctor A creates draft article
    console.log('   -> Step A: Doctor A creates draft article...');
    const createRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorAToken}`,
      },
      body: JSON.stringify({
        title: 'Advances in Acute Coronary Syndrome Protocols',
        summary: 'Clinical update on emergency cardiac biomarkers and fast-track triage.',
        content: 'Full protocols on troponin assays, ECG criteria, and catheterization timing.',
        category: 'Cardiology',
        tags: ['Cardiology', 'ACS', 'Emergency'],
        departmentId: deptAId.toString(),
        hospitalId: hospAId.toString(),
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      throw new Error(`Article creation failed: ${JSON.stringify(createData)}`);
    }
    articleId = createData.data.id;
    console.log(`   ✓ Draft article created with ID: ${articleId} (Status: ${createData.data.status})`);

    // B. Verify draft is private
    console.log('   -> Step B: Verifying draft privacy and access boundaries...');
    // Doctor A (author) can read it
    const authorGetRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
      headers: { Authorization: `Bearer ${doctorAToken}` },
    });
    if (!authorGetRes.ok) throw new Error('Author failed to retrieve own draft');
    console.log('   ✓ Author can access own draft (200 OK)');

    // Doctor B cannot read it (403)
    const otherDocRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
      headers: { Authorization: `Bearer ${doctorBToken}` },
    });
    if (otherDocRes.status !== 403) throw new Error(`Expected 403 for other doctor viewing draft, got ${otherDocRes.status}`);
    console.log('   ✓ Unauthorized doctor blocked from private draft (403 Forbidden)');

    // Hospital Admin cannot view private draft (403)
    const adminDraftRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    if (adminDraftRes.status !== 403) throw new Error(`Expected 403 for hospital admin viewing draft, got ${adminDraftRes.status}`);
    console.log('   ✓ Hospital Admin blocked from private draft (403 Forbidden)');

    // Unauthenticated user cannot view draft (401)
    const anonDraftRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`);
    if (anonDraftRes.status !== 401) throw new Error(`Expected 401 for unauthenticated draft access, got ${anonDraftRes.status}`);
    console.log('   ✓ Unauthenticated user blocked from draft (401 Unauthorized)');

    // C. Doctor A submits draft for review
    console.log('   -> Step C: Doctor A submits draft for Department Head review...');
    const submitRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorAToken}` },
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok || submitData.data.status !== 'UNDER_REVIEW') {
      throw new Error(`Submit for review failed: ${JSON.stringify(submitData)}`);
    }
    console.log('   ✓ Article status transitioned to UNDER_REVIEW');

    // D. Department Head review scoping & validations
    console.log('   -> Step D: Testing peer review authorization rules...');
    // Hospital Admin cannot review (403)
    const adminRevRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVE' }),
    });
    if (adminRevRes.status !== 403) throw new Error(`Expected 403 for hospital admin review, got ${adminRevRes.status}`);
    console.log('   ✓ Hospital Admin blocked from reviewing article (403 Forbidden)');

    // Requesting changes without feedback must fail (400)
    const noFeedbackRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deptHeadToken}`,
      },
      body: JSON.stringify({ decision: 'CHANGES_REQUESTED' }),
    });
    if (noFeedbackRes.status !== 400) throw new Error(`Expected 400 for review changes without feedback, got ${noFeedbackRes.status}`);
    console.log('   ✓ Requesting changes without written feedback rejected (400 Bad Request)');

    // Dept Head requests changes with feedback
    const reqChangesRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deptHeadToken}`,
      },
      body: JSON.stringify({
        decision: 'CHANGES_REQUESTED',
        feedback: 'Please integrate the latest 2026 ACC/AHA STEMI rapid triage criteria.',
      }),
    });
    const reqChangesData = await reqChangesRes.json();
    if (!reqChangesRes.ok || reqChangesData.data.status !== 'CHANGES_REQUESTED') {
      throw new Error(`Review with feedback failed: ${JSON.stringify(reqChangesData)}`);
    }
    console.log('   ✓ Article transitioned to CHANGES_REQUESTED with feedback recorded');

    // E. Author updates article and resubmits
    console.log('   -> Step E: Author updates article and resubmits for review...');
    const resubmitRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorAToken}`,
      },
      body: JSON.stringify({
        content: 'Full protocols on troponin assays and integrated 2026 ACC/AHA STEMI criteria.',
        submitForReview: true,
      }),
    });
    const resubmitData = await resubmitRes.json();
    if (!resubmitRes.ok || resubmitData.data.status !== 'UNDER_REVIEW') {
      throw new Error(`Resubmission failed: ${JSON.stringify(resubmitData)}`);
    }
    console.log('   ✓ Article updated and resubmitted (Status: UNDER_REVIEW)');

    // F. Dept Head approves and publishes
    console.log('   -> Step F: Department Head approves and publishes article...');
    const approveRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deptHeadToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVE', feedback: 'Clinical protocols verified and approved.' }),
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || approveData.data.status !== 'APPROVED') {
      throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
    }
    console.log('   ✓ Article approved by Department Head (Status: APPROVED)');

    const publishRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deptHeadToken}` },
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.data.status !== 'PUBLISHED') {
      throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);
    }
    console.log('   ✓ Article published successfully (Status: PUBLISHED)');

    // G. Public & Family read access
    console.log('   -> Step G: Verifying public read access...');
    const publicGetRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`);
    const publicGetData = await publicGetRes.json();
    if (!publicGetRes.ok || !publicGetData.success || publicGetData.data.status !== 'PUBLISHED') {
      throw new Error('Public access to published article failed');
    }
    console.log('   ✓ Unauthenticated public user retrieved published article (200 OK)');

    const familyListRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    const familyListData = await familyListRes.json();
    if (!familyListRes.ok || !familyListData.data.some((a) => a.id.toString() === articleId.toString())) {
      throw new Error('Family user failed to list published article');
    }
    console.log('   ✓ Family user listed published articles (200 OK)');

    // H. Hospital Admin & Chairman Oversight
    console.log('   -> Step H: Verifying Hospital Admin & Chairman oversight and filters...');
    const adminListRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    const adminListData = await adminListRes.json();
    if (!adminListRes.ok || !adminListData.data.some((a) => a.id.toString() === articleId.toString())) {
      throw new Error('Hospital Admin A failed to view Hospital A article');
    }
    console.log('   ✓ Hospital Admin A oversight confirmed for Hospital A articles');

    const adminBListRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      headers: { Authorization: `Bearer ${adminBToken}` },
    });
    const adminBListData = await adminBListRes.json();
    if (adminBListData.data.some((a) => a.hospitalId && a.hospitalId.toString() === hospAId.toString())) {
      throw new Error('Hospital Admin B should not see Hospital A articles');
    }
    console.log('   ✓ Cross-hospital administrative boundary strictly maintained');

    const chairmanListRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    const chairmanListData = await chairmanListRes.json();
    if (!chairmanListRes.ok || !chairmanListData.data.some((a) => a.id.toString() === articleId.toString())) {
      throw new Error('Chairman oversight failed');
    }
    console.log('   ✓ Chairman platform-wide oversight confirmed across all hospitals');

    // Keyword search filter
    const searchRes = await fetch('http://localhost:5000/api/knowledge/articles?q=Coronary');
    const searchData = await searchRes.json();
    if (!searchRes.ok || searchData.data.length === 0) {
      throw new Error('Keyword search failed');
    }
    console.log(`   ✓ Multi-parameter search filter verified (found ${searchData.data.length} articles matching "Coronary")`);

    console.log('\n================================================================');
    console.log('PHASE 7 LIVE INTEGRATION VERIFICATION: ALL CHECKS PASSED (100%)');
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('Cleaning up test data and child processes...');
    try {
      if (knowledgeConn) {
        if (articleId) await knowledgeConn.collection('articles').deleteOne({ _id: new mongoose.Types.ObjectId(articleId) });
        await knowledgeConn.close();
      }
      if (hospitalConn) {
        if (hospAId) await hospitalConn.collection('hospitals').deleteMany({ _id: { $in: [hospAId, hospBId] } });
        if (deptAId) await hospitalConn.collection('departments').deleteMany({ _id: { $in: [deptAId, deptBId] } });
        if (hospAId) await hospitalConn.collection('department_heads').deleteMany({ hospital_id: hospAId });
        await hospitalConn.close();
      }
      if (doctorConn) {
        if (doctorAId) await doctorConn.collection('doctors').deleteMany({ _id: { $in: [doctorAId, doctorBId, deptHeadDoctorId] } });
        await doctorConn.close();
      }
      if (authConn) {
        if (doctorAUserId) await authConn.collection('users').deleteMany({
          _id: { $in: [doctorAUserId, doctorBUserId, deptHeadUserId, adminAUserId, adminBUserId, chairmanUserId, familyUserId] }
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

runLiveVerification();
