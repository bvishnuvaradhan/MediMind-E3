import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { hashPassword } from '../../auth-service/src/utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, '../../auth-service');
const FAMILY_DIR = path.resolve(__dirname, '../');
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
    }, 10000);

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
      // capture error if startup fails
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
  console.log('PHASE 2 LIVE INTEGRATION VERIFICATION: GATEWAY + AUTH + FAMILY');
  console.log('================================================================');

  let authProc, familyProc, gatewayProc;
  let authConn, familyConn;

  const testEmailA = `test.family.a.${Date.now()}@example.com`;
  const testEmailB = `test.family.b.${Date.now()}@example.com`;
  const testPassword = 'SecureFamilyPass!2026';

  let familyAId = null;
  let familyBId = null;

  try {
    console.log('\n1. Starting Child Microservices (Isolated Node Processes)...');
    authProc = await startProcess('Auth Service', AUTH_DIR, 5001);
    console.log('   ✓ Auth Service running on :5001');

    familyProc = await startProcess('Family Service', FAMILY_DIR, 5002);
    console.log('   ✓ Family Service running on :5002');

    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);
    console.log('   ✓ API Gateway running on :5000');

    console.log('\n2. Verifying Microservices Health...');
    await waitForHttp('http://localhost:5001/health');
    const authHealthRes = await fetch('http://localhost:5001/health');
    const authHealth = await authHealthRes.json();
    console.log('   Auth Service Health:', authHealth.data.status, '| DB:', authHealth.data.database);

    await waitForHttp('http://localhost:5002/health');
    const famHealthRes = await fetch('http://localhost:5002/health');
    const famHealth = await famHealthRes.json();
    console.log('   Family Service Health:', famHealth.data.status, '| DB:', famHealth.data.database);

    await waitForHttp('http://localhost:5000/health');
    const gwHealthRes = await fetch('http://localhost:5000/health');
    const gwHealth = await gwHealthRes.json();
    console.log('   Gateway Health:', gwHealth.data.status, '| Request ID:', gwHealth.data.requestId);

    // Direct DB connections for seeding auth accounts & teardown
    authConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/medimind_auth').asPromise();
    familyConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/medimind_family').asPromise();

    // 3. Register Family A via Gateway (Public POST /api/families)
    console.log('\n3. Registering Family A through Gateway (POST /api/families)...');
    const createFamARes = await fetch('http://localhost:5000/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyName: 'Kapoor Test Family',
        email: testEmailA,
        mobile: '+91 98765 43210',
      }),
    });
    const createFamA = await createFamARes.json();
    console.log('   Status:', createFamARes.status, createFamA.message);
    if (!createFamA.success || !createFamA.data.familyId) {
      throw new Error(`Family A creation failed: ${JSON.stringify(createFamA)}`);
    }
    familyAId = createFamA.data.familyId;
    console.log('   ✓ Family A Created with ID:', familyAId);

    // Create auth account for Family A
    const passwordHashA = await hashPassword(testPassword);
    const userA = await authConn.collection('users').insertOne({
      email: testEmailA,
      password_hash: passwordHashA,
      role: 'FAMILY',
      account_type: 'FAMILY_ACCOUNT',
      reference_id: new mongoose.Types.ObjectId(familyAId),
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    await familyConn.collection('families').updateOne(
      { _id: new mongoose.Types.ObjectId(familyAId) },
      { $set: { creator_user_id: userA.insertedId } }
    );

    // 4. Authenticate as Family A via Gateway (POST /api/auth/login)
    console.log('\n4. Authenticating as Family A (POST /api/auth/login)...');
    const loginARes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailA, password: testPassword }),
    });
    const loginA = await loginARes.json();
    console.log('   Status:', loginARes.status, loginA.message);
    if (!loginA.success || !loginA.data.token) {
      throw new Error(`Family A login failed: ${JSON.stringify(loginA)}`);
    }
    const tokenA = loginA.data.token;
    console.log('   ✓ Family A Authenticated. JWT token received.');

    // 5. Get My Family via Gateway (GET /api/families/me)
    console.log('\n5. Fetching Family A Details (GET /api/families/me)...');
    const meRes = await fetch('http://localhost:5000/api/families/me', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meData = await meRes.json();
    console.log('   Status:', meRes.status, 'Family Name:', meData.data?.familyName);
    if (!meData.success || meData.data.familyId !== familyAId) {
      throw new Error('Get My Family failed');
    }
    console.log('   ✓ Verified Family A account profile retrieval');

    // 6. Add Family Members via Gateway (POST /api/families/members)
    console.log('\n6. Adding Members to Family A...');
    const member1Res = await fetch('http://localhost:5000/api/families/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        fullName: 'Rohan Kapoor',
        dateOfBirth: '1972-03-12',
        gender: 'MALE',
        bloodGroup: 'O+',
        phone: '+91 98765 43210',
        email: 'rohan@example.com',
      }),
    });
    const member1 = await member1Res.json();
    console.log('   Added Member 1:', member1.data?.fullName, '| ID:', member1.data?.memberId);

    const member2Res = await fetch('http://localhost:5000/api/families/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        fullName: 'Priya Kapoor',
        dateOfBirth: '1975-07-24',
        gender: 'FEMALE',
        bloodGroup: 'A+',
        allergies: ['Penicillin'],
      }),
    });
    const member2 = await member2Res.json();
    console.log('   Added Member 2:', member2.data?.fullName, '| ID:', member2.data?.memberId);
    console.log('   ✓ Successfully added 2 family members to Family A');

    // 7. List Active Family Members via Gateway (GET /api/families/members)
    console.log('\n7. Listing Family A Members (GET /api/families/members)...');
    const listRes = await fetch('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = await listRes.json();
    console.log('   Status:', listRes.status, 'Active count:', listData.data?.length);
    if (!listData.success || listData.data.length !== 2) {
      throw new Error('List members failed');
    }
    console.log('   ✓ Verified active member roster listing');

    // 8. Create Family B and test Cross-Family Scoping Isolation
    console.log('\n8. Testing Cross-Family Scoping & Boundary Isolation...');
    const createFamBRes = await fetch('http://localhost:5000/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyName: 'Patel Test Family',
        email: testEmailB,
        mobile: '+91 98765 43230',
      }),
    });
    const createFamB = await createFamBRes.json();
    familyBId = createFamB.data.familyId;

    const userB = await authConn.collection('users').insertOne({
      email: testEmailB,
      password_hash: passwordHashA,
      role: 'FAMILY',
      account_type: 'FAMILY_ACCOUNT',
      reference_id: new mongoose.Types.ObjectId(familyBId),
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    await familyConn.collection('families').updateOne(
      { _id: new mongoose.Types.ObjectId(familyBId) },
      { $set: { creator_user_id: userB.insertedId } }
    );

    const loginBRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailB, password: testPassword }),
    });
    const loginB = await loginBRes.json();
    const tokenB = loginB.data.token;

    // Family B attempts to read Family A's member
    const crossAccessRes = await fetch(`http://localhost:5000/api/families/members/${member1.data.memberId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const crossAccessData = await crossAccessRes.json();
    console.log('   Cross-access Status:', crossAccessRes.status, crossAccessData.message);
    if (crossAccessRes.status !== 403) {
      throw new Error('Cross-family access was not blocked with 403!');
    }
    console.log('   ✓ Cross-family access BLOCKED with 403 Forbidden');

    // 9. Remove Member (DELETE /api/families/members/:memberId)
    console.log('\n9. Removing Member 2 (DELETE /api/families/members/:memberId)...');
    const deleteRes = await fetch(`http://localhost:5000/api/families/members/${member2.data.memberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const deleteData = await deleteRes.json();
    console.log('   Delete Status:', deleteRes.status, deleteData.message);
    if (!deleteData.success) {
      throw new Error('Member deletion failed');
    }

    const verifyListRes = await fetch('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const verifyListData = await verifyListRes.json();
    if (verifyListData.data.length !== 1) {
      throw new Error('Soft-deleted member still visible in active list');
    }
    console.log('   ✓ Member soft-deleted; active list updated to 1 member');

    console.log('\n================================================================');
    console.log('ALL PHASE 2 LIVE VERIFICATION CHECKS PASSED (100% GREEN)');
    console.log('================================================================\n');
  } finally {
    // Teardown DB records
    if (familyConn) {
      if (familyAId) {
        await familyConn.collection('families').deleteOne({ _id: new mongoose.Types.ObjectId(familyAId) });
        await familyConn.collection('family_members').deleteMany({ family_id: new mongoose.Types.ObjectId(familyAId) });
      }
      if (familyBId) {
        await familyConn.collection('families').deleteOne({ _id: new mongoose.Types.ObjectId(familyBId) });
        await familyConn.collection('family_members').deleteMany({ family_id: new mongoose.Types.ObjectId(familyBId) });
      }
      await familyConn.close();
    }

    if (authConn) {
      await authConn.collection('users').deleteMany({ email: { $in: [testEmailA, testEmailB] } });
      await authConn.close();
    }

    if (authProc) authProc.kill('SIGTERM');
    if (familyProc) familyProc.kill('SIGTERM');
    if (gatewayProc) gatewayProc.kill('SIGTERM');
  }
}

runLiveVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
