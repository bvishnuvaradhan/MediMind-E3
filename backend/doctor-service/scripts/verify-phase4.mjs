import '../../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { hashPassword } from '../../auth-service/src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, '../../auth-service');
const HOSPITAL_DIR = path.resolve(__dirname, '../../hospital-service');
const DOCTOR_DIR = path.resolve(__dirname, '../');
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

async function waitForHttp(url, maxAttempts = 15) {
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
  console.log('PHASE 4 LIVE INTEGRATION VERIFICATION: GATEWAY + AUTH + HOSP + DOC');
  console.log('================================================================');

  let authProc, hospitalProc, doctorProc, gatewayProc;
  let authConn, hospitalConn, doctorConn;

  const timestamp = Date.now();
  const chairmanEmail = `live.chairman.${timestamp}@medimind.org`;
  const adminAEmail = `live.admin.a.${timestamp}@medimind.org`;
  const adminBEmail = `live.admin.b.${timestamp}@medimind.org`;
  const headAEmail = `live.head.a.${timestamp}@medimind.org`;
  const headBEmail = `live.head.b.${timestamp}@medimind.org`;
  const doctorEmail = `dr.priya.sharma.${timestamp}@medimind.org`;
  const defaultPassword = 'LiveSecurePass!2026';

  let hospitalAId = null;
  let hospitalBId = null;
  let deptAId = null;
  let deptBId = null;
  let headAId = null;
  let headBId = null;
  let createdDoctorId = null;
  let doctorToken = null;

  try {
    console.log('\n1. Starting Child Microservices (Isolated Node Processes)...');
    authProc = await startProcess('Auth Service', AUTH_DIR, 5001);
    console.log('   ✓ Auth Service running on :5001');

    hospitalProc = await startProcess('Hospital Service', HOSPITAL_DIR, 5003);
    console.log('   ✓ Hospital Service running on :5003');

    doctorProc = await startProcess('Doctor Service', DOCTOR_DIR, 5004);
    console.log('   ✓ Doctor Service running on :5004');

    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);
    console.log('   ✓ API Gateway running on :5000');

    console.log('\n2. Verifying Microservices Health...');
    await waitForHttp('http://localhost:5001/health');
    const authHealthRes = await fetch('http://localhost:5001/health');
    const authHealth = await authHealthRes.json();
    console.log('   Auth Health:', authHealth.data.status, '| DB:', authHealth.data.database);

    await waitForHttp('http://localhost:5003/health');
    const hospHealthRes = await fetch('http://localhost:5003/health');
    const hospHealth = await hospHealthRes.json();
    console.log('   Hospital Health:', hospHealth.data.status, '| DB:', hospHealth.data.database);

    await waitForHttp('http://localhost:5004/health');
    const docHealthRes = await fetch('http://localhost:5004/health');
    const docHealth = await docHealthRes.json();
    console.log('   Doctor Health:', docHealth.data.status, '| DB:', docHealth.data.database);

    await waitForHttp('http://localhost:5000/health');
    const gwHealthRes = await fetch('http://localhost:5000/health');
    const gwHealth = await gwHealthRes.json();
    console.log('   Gateway Health:', gwHealth.data.status, '| Request ID:', gwHealth.data.requestId);

    // Database connections
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const doctorDbName = process.env.DOCTOR_DB_NAME || 'medimind_doctor';
    const mongoBase = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

    const connectWithFallback = async (dbName) => {
      try {
        return await mongoose.createConnection(mongoBase, { dbName, serverSelectionTimeoutMS: 2500 }).asPromise();
      } catch (err) {
        if (mongoBase.includes('mongodb+srv') || mongoBase.includes('@')) {
          console.log(`[verify-phase4] Atlas connection failed (${err.name}). Falling back to local MongoDB for ${dbName}`);
          return await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`, { serverSelectionTimeoutMS: 5000 }).asPromise();
        }
        throw err;
      }
    };

    authConn = await connectWithFallback(authDbName);
    hospitalConn = await connectWithFallback(hospitalDbName);
    doctorConn = await connectWithFallback(doctorDbName);

    // Seed test hospitals and departments
    hospitalAId = new mongoose.Types.ObjectId();
    hospitalBId = new mongoose.Types.ObjectId();
    deptAId = new mongoose.Types.ObjectId();
    deptBId = new mongoose.Types.ObjectId();
    headAId = new mongoose.Types.ObjectId();
    headBId = new mongoose.Types.ObjectId();

    await hospitalConn.collection('hospitals').insertMany([
      {
        _id: hospitalAId,
        name: `Live Hospital Alpha ${timestamp}`,
        code: `LHA-${timestamp.toString().slice(-4)}`,
        type: 'SUPER_SPECIALTY',
        address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        phone: '+91 80 1111 2222',
        email: `hosp.a.${timestamp}@medimind.org`,
        bedCapacity: 300,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: hospitalBId,
        name: `Live Hospital Beta ${timestamp}`,
        code: `LHB-${timestamp.toString().slice(-4)}`,
        type: 'GENERAL',
        address: { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
        phone: '+91 44 2222 3333',
        email: `hosp.b.${timestamp}@medimind.org`,
        bedCapacity: 200,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await hospitalConn.collection('departments').insertMany([
      {
        _id: deptAId,
        hospital_id: hospitalAId,
        name: 'Cardiology',
        code: 'CARD-A',
        head_id: headAId,
        active_doctors_count: 0,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: deptBId,
        hospital_id: hospitalBId,
        name: 'Neurology',
        code: 'NEUR-B',
        head_id: headBId,
        active_doctors_count: 0,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const pwdHash = await hashPassword(defaultPassword);
    const headAUserId = new mongoose.Types.ObjectId();
    const headBUserId = new mongoose.Types.ObjectId();

    await hospitalConn.collection('departmentheads').insertMany([
      {
        _id: headAId,
        user_id: headAUserId,
        hospital_id: hospitalAId,
        department_id: deptAId,
        full_name: 'Dr. Head Alpha',
        email: headAEmail,
        mobile: '+91 99000 11111',
        qualification: 'MD Cardiology',
        experience_years: 15,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headBId,
        user_id: headBUserId,
        hospital_id: hospitalBId,
        department_id: deptBId,
        full_name: 'Dr. Head Beta',
        email: headBEmail,
        mobile: '+91 99000 22222',
        qualification: 'DM Neurology',
        experience_years: 18,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await authConn.collection('users').insertMany([
      {
        email: chairmanEmail,
        password_hash: pwdHash,
        role: 'CHAIRMAN',
        account_type: 'CHAIRMAN_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: adminAEmail,
        password_hash: pwdHash,
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: hospitalAId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: adminBEmail,
        password_hash: pwdHash,
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: hospitalBId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headAUserId,
        email: headAEmail,
        password_hash: pwdHash,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: headAId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headBUserId,
        email: headBEmail,
        password_hash: pwdHash,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: headBId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. Authenticate as Department Head A via Gateway
    console.log('\n3. Authenticating as Department Head A via Gateway (POST /api/auth/login)...');
    const headALoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: headAEmail, password: defaultPassword }),
    });
    const headALogin = await headALoginRes.json();
    if (!headALogin.success || !headALogin.data.token) {
      throw new Error(`Dept Head A login failed: ${JSON.stringify(headALogin)}`);
    }
    const headAToken = headALogin.data.token;
    console.log('   ✓ Dept Head A authenticated successfully');

    // 4. Create Doctor as Department Head A via Gateway (Cross-service provisioning)
    console.log('\n4. Creating Doctor via Gateway (POST /api/doctors)...');
    const createDocRes = await fetch('http://localhost:5000/api/doctors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headAToken}`,
      },
      body: JSON.stringify({
        fullName: 'Dr. Priya Sharma',
        email: doctorEmail,
        mobile: '+91 98765 43210',
        specialization: 'Cardiology',
        qualifications: ['MBBS', 'MD Cardiology'],
        experienceYears: 8,
        professionalDescription: 'Specialist in non-invasive cardiac imaging',
      }),
    });
    const createDocData = await createDocRes.json();
    console.log('   Status:', createDocRes.status, createDocData.message);
    if (!createDocData.success || !createDocData.data.doctorId) {
      throw new Error(`Doctor creation failed: ${JSON.stringify(createDocData)}`);
    }
    createdDoctorId = createDocData.data.doctorId;
    console.log('   ✓ Doctor created with ID:', createdDoctorId);
    console.log('   ✓ Assigned Hospital ID:', createDocData.data.hospitalId);
    console.log('   ✓ Assigned Department ID:', createDocData.data.departmentId);

    // Verify Auth record was created in medimind_auth by internal REST call
    const authDoctorUser = await authConn.collection('users').findOne({ email: doctorEmail });
    if (!authDoctorUser) {
      throw new Error(`Auth user not created for doctor ${doctorEmail}`);
    }
    console.log('   ✓ Internal Auth Service user confirmed in medimind_auth (Role:', authDoctorUser.role, ')');

    // 5. Authenticate as the newly created Doctor via Gateway
    console.log('\n5. Authenticating as newly created Doctor (POST /api/auth/login)...');
    const docLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: doctorEmail, password: 'DoctorPass@2026' }),
    });
    const docLogin = await docLoginRes.json();
    if (!docLogin.success || !docLogin.data.token) {
      throw new Error(`Doctor login failed: ${JSON.stringify(docLogin)}`);
    }
    doctorToken = docLogin.data.token;
    console.log('   ✓ Doctor authenticated successfully (Role:', docLogin.data.user.role, ')');

    // 6. Doctor views own profile via Gateway
    console.log('\n6. Doctor views own profile via Gateway (GET /api/doctors/:id)...');
    const getProfileRes = await fetch(`http://localhost:5000/api/doctors/${createdDoctorId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const profileData = await getProfileRes.json();
    if (!profileData.success || profileData.data.doctorId !== createdDoctorId) {
      throw new Error(`Get doctor profile failed: ${JSON.stringify(profileData)}`);
    }
    console.log('   ✓ Doctor profile retrieved:', profileData.data.fullName, '| Specialization:', profileData.data.specialization);

    // 7. Doctor updates own profile via Gateway
    console.log('\n7. Doctor updates own profile via Gateway (PUT /api/doctors/:id)...');
    const updateProfileRes = await fetch(`http://localhost:5000/api/doctors/${createdDoctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        qualifications: ['MBBS', 'MD Cardiology', 'FACC'],
        experienceYears: 9,
        professionalDescription: 'Fellow of American College of Cardiology',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    if (!updateProfileData.success || updateProfileData.data.experienceYears !== 9) {
      throw new Error(`Update doctor profile failed: ${JSON.stringify(updateProfileData)}`);
    }
    console.log('   ✓ Doctor profile updated. Experience:', updateProfileData.data.experienceYears);

    // 8. Doctor updates own availability via Gateway
    console.log('\n8. Doctor updates availability via Gateway (PUT /api/doctors/:id/availability)...');
    const updateAvailRes = await fetch(`http://localhost:5000/api/doctors/${createdDoctorId}/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        availability: [
          { day: 'MONDAY', startTime: '09:00', endTime: '13:00' },
          { day: 'WEDNESDAY', startTime: '14:00', endTime: '18:00' },
          { day: 'FRIDAY', startTime: '10:00', endTime: '15:00' },
        ],
      }),
    });
    const updateAvailData = await updateAvailRes.json();
    if (!updateAvailData.success || updateAvailData.data.availability.length !== 3) {
      throw new Error(`Doctor availability update failed: ${JSON.stringify(updateAvailData)}`);
    }
    console.log('   ✓ Doctor availability updated with', updateAvailData.data.availability.length, 'weekly slots');

    // 9. Public / Family views Doctor Availability Schedule via Gateway
    console.log('\n9. Public retrieval of Doctor Availability (GET /api/doctors/:id/availability)...');
    const getAvailRes = await fetch(`http://localhost:5000/api/doctors/${createdDoctorId}/availability`);
    const getAvailData = await getAvailRes.json();
    if (!getAvailData.success || getAvailData.data.availability.length !== 3) {
      throw new Error(`Public availability fetch failed: ${JSON.stringify(getAvailData)}`);
    }
    console.log('   ✓ Public schedule verified for:', getAvailData.data.fullName);

    // 10. Public Directory Listing & Search via Gateway
    console.log('\n10. Public Doctor Directory with Specialization & Search filters...');
    const searchRes = await fetch('http://localhost:5000/api/doctors?specialization=Cardiology&search=Priya');
    const searchData = await searchRes.json();
    if (!searchData.success || searchData.data.length < 1) {
      throw new Error(`Directory search failed: ${JSON.stringify(searchData)}`);
    }
    console.log('   ✓ Search matched doctor in directory:', searchData.data[0].fullName);

    // 11. Security & Scoping Verifications
    console.log('\n11. Verifying Scoping & Security Rules...');

    // A. Login as Dept Head B
    const headBLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: headBEmail, password: defaultPassword }),
    });
    const headBLogin = await headBLoginRes.json();
    const headBToken = headBLogin.data.token;

    // B. Dept Head B attempts to update Dept Head A's doctor -> Expect 403
    const crossDeptUpdateRes = await fetch(`http://localhost:5000/api/doctors/${createdDoctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headBToken}`,
      },
      body: JSON.stringify({ experienceYears: 20 }),
    });
    console.log('   Dept Head B -> Dept A Doctor Update status:', crossDeptUpdateRes.status, '(Expected: 403)');
    if (crossDeptUpdateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-department update, got ${crossDeptUpdateRes.status}`);
    }
    console.log('   ✓ Scoping verified: Department Head cannot modify cross-department doctor');

    // C. Login as Hospital Admin B
    const adminBLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminBEmail, password: defaultPassword }),
    });
    const adminBLogin = await adminBLoginRes.json();
    const adminBToken = adminBLogin.data.token;

    // D. Hospital Admin B attempts to update Hospital A's doctor -> Expect 403
    const crossHospUpdateRes = await fetch(`http://localhost:5000/api/doctors/${createdDoctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminBToken}`,
      },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    console.log('   Hosp Admin B -> Hosp A Doctor Update status:', crossHospUpdateRes.status, '(Expected: 403)');
    if (crossHospUpdateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-hospital update, got ${crossHospUpdateRes.status}`);
    }
    console.log('   ✓ Scoping verified: Hospital Admin cannot modify cross-hospital doctor');

    console.log('\n================================================================');
    console.log('ALL PHASE 4 LIVE INTEGRATION VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ Phase 4 Live Verification Error:', error.message);
    process.exitCode = 1;
  } finally {
    // Teardown test records
    console.log('Cleaning up test data...');
    try {
      if (doctorConn) {
        if (createdDoctorId) {
          await doctorConn.collection('doctors').deleteOne({ _id: new mongoose.Types.ObjectId(createdDoctorId) });
        }
        await doctorConn.close();
      }
      if (hospitalConn) {
        if (hospitalAId) await hospitalConn.collection('hospitals').deleteOne({ _id: hospitalAId });
        if (hospitalBId) await hospitalConn.collection('hospitals').deleteOne({ _id: hospitalBId });
        if (deptAId) await hospitalConn.collection('departments').deleteOne({ _id: deptAId });
        if (deptBId) await hospitalConn.collection('departments').deleteOne({ _id: deptBId });
        if (headAId) await hospitalConn.collection('departmentheads').deleteOne({ _id: headAId });
        if (headBId) await hospitalConn.collection('departmentheads').deleteOne({ _id: headBId });
        await hospitalConn.close();
      }
      if (authConn) {
        await authConn.collection('users').deleteMany({
          email: {
            $in: [
              chairmanEmail,
              adminAEmail,
              adminBEmail,
              headAEmail,
              headBEmail,
              doctorEmail,
            ],
          },
        });
        await authConn.close();
      }
      console.log('   ✓ Test data cleared');
    } catch (cleanupErr) {
      console.warn('   Cleanup warning:', cleanupErr.message);
    }

    // Kill microservices
    console.log('Stopping microservice child processes...');
    if (authProc) authProc.kill();
    if (hospitalProc) hospitalProc.kill();
    if (doctorProc) doctorProc.kill();
    if (gatewayProc) gatewayProc.kill();
    console.log('   ✓ All processes terminated');
  }
}

runLiveVerification();
