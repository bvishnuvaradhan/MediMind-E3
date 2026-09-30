import '../../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { hashPassword } from '../../auth-service/src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, '../../auth-service');
const HOSPITAL_DIR = path.resolve(__dirname, '../');
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
  console.log('PHASE 3 LIVE INTEGRATION VERIFICATION: GATEWAY + AUTH + HOSPITAL');
  console.log('================================================================');

  let authProc, hospitalProc, gatewayProc;
  let authConn, hospitalConn;

  const timestamp = Date.now();
  const chairmanEmail = `live.chairman.${timestamp}@medimind.org`;
  const adminAEmail = `live.admin.a.${timestamp}@medimind.org`;
  const adminBEmail = `live.admin.b.${timestamp}@medimind.org`;
  const defaultPassword = 'LiveSecurePass!2026';

  let createdRequestId = null;
  let createdHospitalId = null;
  let hospitalAId = null;
  let hospitalBId = null;
  let testDeptId = null;
  let testHeadId = null;

  try {
    console.log('\n1. Starting Child Microservices (Isolated Node Processes)...');
    authProc = await startProcess('Auth Service', AUTH_DIR, 5001);
    console.log('   ✓ Auth Service running on :5001');

    hospitalProc = await startProcess('Hospital Service', HOSPITAL_DIR, 5003);
    console.log('   ✓ Hospital Service running on :5003');

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

    await waitForHttp('http://localhost:5000/health');
    const gwHealthRes = await fetch('http://localhost:5000/health');
    const gwHealth = await gwHealthRes.json();
    console.log('   Gateway Health:', gwHealth.data.status, '| Request ID:', gwHealth.data.requestId);

    // Direct DB connections for seeding users and teardown
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const mongoBase = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

    const connectWithFallback = async (dbName) => {
      try {
        return await mongoose.createConnection(mongoBase, { dbName }).asPromise();
      } catch (err) {
        if (mongoBase.includes('mongodb+srv')) {
          return await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`).asPromise();
        }
        throw err;
      }
    };

    authConn = await connectWithFallback(authDbName);
    hospitalConn = await connectWithFallback(hospitalDbName);

    // Create 2 test hospitals directly in DB for scoping checks
    hospitalAId = new mongoose.Types.ObjectId();
    hospitalBId = new mongoose.Types.ObjectId();

    await hospitalConn.collection('hospitals').insertMany([
      {
        _id: hospitalAId,
        name: `Live Test Hospital Alpha ${timestamp}`,
        code: `LTHA-${timestamp.toString().slice(-4)}`,
        type: 'SUPER_SPECIALTY',
        address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        phone: '+91 80 1111 2222',
        email: `contact.alpha.${timestamp}@medimind.org`,
        bedCapacity: 250,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: hospitalBId,
        name: `Live Test Hospital Beta ${timestamp}`,
        code: `LTHB-${timestamp.toString().slice(-4)}`,
        type: 'GENERAL',
        address: { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
        phone: '+91 40 3333 4444',
        email: `contact.beta.${timestamp}@medimind.org`,
        bedCapacity: 180,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Seed Chairman, Hospital Admin A, Hospital Admin B users
    const pwdHash = await hashPassword(defaultPassword);
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
    ]);

    // 3. Submit Public Hospital Onboarding Request via Gateway
    console.log('\n3. Submitting Public Hospital Onboarding Request via Gateway (POST /api/hospital-requests)...');
    const reqRes = await fetch('http://localhost:5000/api/hospital-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `St. Jude Care Center ${timestamp}`,
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '101 Healthcare Blvd, Bandra West',
        contactPerson: 'Dr. Vivek Joshi',
        phone: '+91 22 9988 7766',
        email: `info.stjude.${timestamp}@hospital.org`,
        bedCapacity: 350,
        requestedDepartments: ['Cardiology', 'Neurology', 'Pediatrics'],
      }),
    });
    const reqData = await reqRes.json();
    console.log('   Status:', reqRes.status, reqData.message);
    if (!reqData.success || !reqData.data.requestId) {
      throw new Error(`Onboarding request failed: ${JSON.stringify(reqData)}`);
    }
    createdRequestId = reqData.data.requestId;
    console.log('   ✓ Onboarding Request Created with ID:', createdRequestId);

    // 4. Authenticate as Chairman via Gateway
    console.log('\n4. Authenticating as Chairman (POST /api/auth/login)...');
    const chairLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: chairmanEmail, password: defaultPassword }),
    });
    const chairLogin = await chairLoginRes.json();
    if (!chairLogin.success || !chairLogin.data.token) {
      throw new Error(`Chairman login failed: ${JSON.stringify(chairLogin)}`);
    }
    const chairmanToken = chairLogin.data.token;
    console.log('   ✓ Chairman authenticated successfully.');

    // 5. Chairman Lists Onboarding Requests via Gateway
    console.log('\n5. Chairman Listing Onboarding Requests (GET /api/hospital-requests)...');
    const listReqRes = await fetch('http://localhost:5000/api/hospital-requests?status=PENDING', {
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    const listReqData = await listReqRes.json();
    console.log('   Status:', listReqRes.status, 'Total pending requests:', listReqData.data?.length);
    const foundReq = listReqData.data?.find((r) => r.requestId === createdRequestId);
    if (!foundReq) {
      throw new Error('Created onboarding request not found in pending list');
    }
    console.log('   ✓ Found created request in Chairman pending queue');

    // 6. Chairman Approves Onboarding Request -> Auto-provisions Hospital & Departments
    console.log('\n6. Chairman Approving Onboarding Request (POST /api/hospital-requests/:id/approve)...');
    const approveRes = await fetch(`http://localhost:5000/api/hospital-requests/${createdRequestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    const approveData = await approveRes.json();
    console.log('   Status:', approveRes.status, approveData.message);
    if (!approveData.success || !approveData.data.hospital) {
      throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
    }
    createdHospitalId = approveData.data.hospital.id || approveData.data.hospital.hospitalId;
    console.log('   ✓ Hospital Auto-Provisioned ID:', createdHospitalId);

    // Verify provisioned departments via Chairman endpoint
    const deptsRes = await fetch(`http://localhost:5000/api/departments?hospital_id=${createdHospitalId}`, {
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    const deptsData = await deptsRes.json();
    console.log('   ✓ Departments Provisioned Count:', deptsData.data?.length);
    if (!deptsData.success || deptsData.data?.length !== 3) {
      throw new Error(`Expected 3 departments created, got ${deptsData.data?.length}`);
    }

    // 7. Verify Duplicate Approval is Rejected with 400
    console.log('\n7. Verifying Duplicate Decision is Rejected (400 Bad Request)...');
    const dupApproveRes = await fetch(`http://localhost:5000/api/hospital-requests/${createdRequestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    console.log('   Duplicate Approval Status:', dupApproveRes.status);
    if (dupApproveRes.status !== 400) {
      throw new Error(`Expected 400 on duplicate approval, got ${dupApproveRes.status}`);
    }
    console.log('   ✓ Duplicate onboarding decision rejected with 400');

    // 8. Authenticate as Hospital Admin A and test Scoping
    console.log('\n8. Authenticating as Hospital Admin A (POST /api/auth/login)...');
    const adminALoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminAEmail, password: defaultPassword }),
    });
    const adminALogin = await adminALoginRes.json();
    const tokenAdminA = adminALogin.data.token;
    console.log('   ✓ Hospital Admin A authenticated.');

    // Hospital Admin A accesses own hospital
    console.log('\n9. Testing Hospital Admin A Scoping: Own Hospital Access...');
    const ownHospRes = await fetch(`http://localhost:5000/api/hospitals/${hospitalAId}`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    const ownHospData = await ownHospRes.json();
    console.log('   Own Hospital Status:', ownHospRes.status, 'Name:', ownHospData.data?.name);
    if (ownHospRes.status !== 200 || !ownHospData.data) {
      throw new Error('Failed to access own hospital');
    }
    console.log('   ✓ Hospital Admin A can access assigned hospital');

    // Hospital Admin A attempts to access Hospital B (Cross-Hospital Isolation)
    console.log('\n10. Testing Hospital Admin A Cross-Hospital Scoping (Hospital B)...');
    const crossHospRes = await fetch(`http://localhost:5000/api/hospitals/${hospitalBId}`, {
      headers: { Authorization: `Bearer ${tokenAdminA}` },
    });
    console.log('   Cross-Hospital Read Status:', crossHospRes.status);
    if (crossHospRes.status !== 403) {
      throw new Error(`Expected 403 on cross-hospital access, got ${crossHospRes.status}`);
    }
    console.log('   ✓ Cross-hospital read BLOCKED with 403 Forbidden');

    // Hospital Admin A attempts to update Hospital B
    const crossUpdateRes = await fetch(`http://localhost:5000/api/hospitals/${hospitalBId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({ bedCapacity: 999 }),
    });
    console.log('   Cross-Hospital Update Status:', crossUpdateRes.status);
    if (crossUpdateRes.status !== 403) {
      throw new Error(`Expected 403 on cross-hospital update, got ${crossUpdateRes.status}`);
    }
    console.log('   ✓ Cross-hospital update BLOCKED with 403 Forbidden');

    // 11. Department Management & Scoping via Gateway
    console.log('\n11. Creating Department in Hospital A (POST /api/departments)...');
    const createDeptRes = await fetch('http://localhost:5000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        hospital_id: hospitalAId.toString(),
        name: 'Emergency Medicine',
        code: 'EM-01',
        specialization: 'Emergency and Critical Care',
        bedCapacity: 30,
      }),
    });
    const createDeptData = await createDeptRes.json();
    console.log('   Create Department Status:', createDeptRes.status, createDeptData.message);
    const deptId = createDeptData.data?.id || createDeptData.data?.departmentId || createDeptData.data?._id;
    if (!createDeptData.success || !deptId) {
      throw new Error('Failed to create department in Hospital A');
    }
    testDeptId = deptId;
    console.log('   ✓ Department Created with ID:', testDeptId);

    // Duplicate Department in Same Hospital returns 409
    console.log('\n12. Verifying Unique Department Constraint within same hospital (409 Conflict)...');
    const dupDeptRes = await fetch('http://localhost:5000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        hospital_id: hospitalAId.toString(),
        name: 'Emergency Medicine',
        code: 'EM-02',
      }),
    });
    console.log('   Duplicate Department Status:', dupDeptRes.status);
    if (dupDeptRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate department name, got ${dupDeptRes.status}`);
    }
    console.log('   ✓ Duplicate department within same hospital rejected with 409 Conflict');

    // Admin A attempts to create Department in Hospital B -> 403 Forbidden
    console.log('\n13. Testing Admin A creating department in Hospital B (403 Forbidden)...');
    const crossCreateDeptRes = await fetch('http://localhost:5000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        hospital_id: hospitalBId.toString(),
        name: 'General Surgery',
      }),
    });
    console.log('   Cross Create Department Status:', crossCreateDeptRes.status);
    if (crossCreateDeptRes.status !== 403) {
      throw new Error(`Expected 403 on cross-hospital department creation, got ${crossCreateDeptRes.status}`);
    }
    console.log('   ✓ Cross-hospital department creation BLOCKED with 403 Forbidden');

    // 14. Department Head Assignment & Scoping via Gateway
    console.log('\n14. Assigning Department Head in Hospital A (POST /api/department-heads)...');
    const headUserId = new mongoose.Types.ObjectId();
    const createHeadRes = await fetch('http://localhost:5000/api/department-heads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdminA}`,
      },
      body: JSON.stringify({
        user_id: headUserId.toString(),
        hospital_id: hospitalAId.toString(),
        department_id: testDeptId,
        full_name: 'Dr. Arjun Rampal',
        email: `arjun.${timestamp}@medimind.org`,
        phone: '+91 99887 76655',
      }),
    });
    const createHeadData = await createHeadRes.json();
    console.log('   Assign Head Status:', createHeadRes.status, createHeadData.message);
    const headId = createHeadData.data?.id || createHeadData.data?.headId || createHeadData.data?._id;
    if (!createHeadData.success || !headId) {
      throw new Error('Failed to assign department head');
    }
    testHeadId = headId;
    console.log('   ✓ Department Head Assigned with ID:', testHeadId);

    console.log('\n================================================================');
    console.log('ALL PHASE 3 LIVE VERIFICATION CHECKS PASSED (100% GREEN)');
    console.log('================================================================\n');
  } finally {
    // Teardown DB records
    if (hospitalConn) {
      if (hospitalAId) {
        await hospitalConn.collection('hospitals').deleteOne({ _id: hospitalAId });
      }
      if (hospitalBId) {
        await hospitalConn.collection('hospitals').deleteOne({ _id: hospitalBId });
      }
      if (createdHospitalId) {
        await hospitalConn.collection('hospitals').deleteOne({ _id: new mongoose.Types.ObjectId(createdHospitalId) });
        await hospitalConn.collection('departments').deleteMany({ hospital_id: new mongoose.Types.ObjectId(createdHospitalId) });
      }
      if (createdRequestId) {
        await hospitalConn.collection('hospital_requests').deleteOne({ _id: new mongoose.Types.ObjectId(createdRequestId) });
      }
      if (testDeptId) {
        await hospitalConn.collection('departments').deleteOne({ _id: new mongoose.Types.ObjectId(testDeptId) });
      }
      if (testHeadId) {
        await hospitalConn.collection('department_heads').deleteOne({ _id: new mongoose.Types.ObjectId(testHeadId) });
      }
      await hospitalConn.close();
    }

    if (authConn) {
      await authConn.collection('users').deleteMany({
        email: { $in: [chairmanEmail, adminAEmail, adminBEmail] },
      });
      await authConn.close();
    }

    if (authProc) authProc.kill('SIGTERM');
    if (hospitalProc) hospitalProc.kill('SIGTERM');
    if (gatewayProc) gatewayProc.kill('SIGTERM');
  }
}

runLiveVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
