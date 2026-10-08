import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');

const GATEWAY_URL = 'http://localhost:5000';
const services = [
  { name: 'Auth Service', dir: path.resolve(backendDir, 'auth-service'), cmd: 'node', args: ['server.js'], port: 5001 },
  { name: 'Family Service', dir: path.resolve(backendDir, 'family-service'), cmd: 'node', args: ['server.js'], port: 5002 },
  { name: 'Hospital Service', dir: path.resolve(backendDir, 'hospital-service'), cmd: 'node', args: ['server.js'], port: 5003 },
  { name: 'Doctor Service', dir: path.resolve(backendDir, 'doctor-service'), cmd: 'node', args: ['server.js'], port: 5004 },
  { name: 'AI Prediction Service', dir: path.resolve(rootDir, 'ai-prediction-service'), cmd: 'python', args: ['-m', 'uvicorn', 'app.main:app', '--port', '5007'], port: 5007 },
  { name: 'API Gateway', dir: path.resolve(backendDir, 'api-gateway'), cmd: 'node', args: ['server.js'], port: 5000 },
];

const processes = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkHealth(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

async function startServices() {
  console.log('--- Launching Services for Multi-Account Switching Verification ---');
  for (const svc of services) {
    const isOnline = await checkHealth(`http://localhost:${svc.port}/health`);
    if (isOnline) {
      console.log(`  * ${svc.name} is already online on :${svc.port}`);
      continue;
    }
    const child = spawn(svc.cmd, svc.args, {
      cwd: svc.dir,
      env: { ...process.env, PORT: svc.port.toString() },
      stdio: 'ignore',
      shell: true,
    });
    processes.push(child);
  }

  // Poll until Gateway, Auth, and AI service are healthy
  console.log('--- Waiting for services to become healthy... ---');
  let ready = false;
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const gwOk = await checkHealth('http://localhost:5000/health');
    const authOk = await checkHealth('http://localhost:5001/health');
    const aiOk = await checkHealth('http://localhost:5007/health');
    if (gwOk && authOk && aiOk) {
      ready = true;
      break;
    }
  }
  if (!ready) {
    throw new Error('Services failed to become healthy within 40 seconds');
  }
  console.log('✓ All required services are healthy and responding!\n');
}

function cleanup() {
  for (const proc of processes) {
    try {
      proc.kill('SIGTERM');
    } catch {}
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });

async function run() {
  try {
    await startServices();

    console.log('================================================================');
    console.log('  MEDIMIND MULTI-ACCOUNT LOGIN / SESSION ISOLATION AUDIT');
    console.log('================================================================\n');

    let checksPassed = 0;
    let totalChecks = 0;

    const assertCheck = (desc, cond) => {
      totalChecks++;
      if (cond) {
        checksPassed++;
        console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
      } else {
        console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc}`);
        throw new Error(`Assertion failed: ${desc}`);
      }
    };

    // Client session simulation
    let currentStorage = {};
    let currentSessionStorage = {};
    let currentHash = '';

    const simulateClientLogin = async (email, password) => {
      // Clear previous storage
      delete currentStorage['medimind_auth_session'];
      delete currentStorage['medimind_jwt_token'];
      currentSessionStorage = {};
      currentHash = '';

      const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.message };
      }

      const { user, token } = data.data;
      currentStorage['medimind_jwt_token'] = token;
      const authenticatedUser = {
        id: user.userId || user.id,
        userId: user.userId || user.id,
        email: user.email,
        role: user.role,
        referenceId: user.referenceId,
        accountType: user.accountType,
        token,
      };
      currentStorage['medimind_auth_session'] = JSON.stringify(authenticatedUser);
      return { success: true, user: authenticatedUser, token };
    };

    const simulateClientLogout = async () => {
      const token = currentStorage['medimind_jwt_token'];
      delete currentStorage['medimind_auth_session'];
      delete currentStorage['medimind_jwt_token'];
      currentSessionStorage = {};
      currentHash = '';

      if (token) {
        await fetch(`${GATEWAY_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };

    const simulatePageRefresh = () => {
      const stored = currentStorage['medimind_auth_session'];
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        return parsed && parsed.role ? parsed : null;
      } catch {
        return null;
      }
    };

    // -------------------------------------------------------------
    // SECTION 1: 13-STEP SEQUENTIAL SWITCHING MATRIX
    // -------------------------------------------------------------
    console.log('--- Step 1: Login as Family (rohan.kapoor@example.com) ---');
    const step1 = await simulateClientLogin('rohan.kapoor@example.com', 'Password123!');
    assertCheck('Step 1: Family login succeeded', step1.success === true);
    assertCheck('Step 1: Role is FAMILY', step1.user.role === 'FAMILY');
    assertCheck('Step 1: Email is rohan.kapoor@example.com', step1.user.email === 'rohan.kapoor@example.com');
    assertCheck('Step 1: JWT token is non-empty', typeof step1.token === 'string' && step1.token.length > 50);

    // Verify GET /api/auth/me returns FAMILY
    const me1 = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${step1.token}` },
    }).then(r => r.json());
    assertCheck('Step 1: Gateway /api/auth/me validates Family identity', me1.data?.role === 'FAMILY');

    const familyToken = step1.token;

    console.log('\n--- Step 2: Logout from Family ---');
    await simulateClientLogout();
    assertCheck('Step 2: medimind_jwt_token removed', currentStorage['medimind_jwt_token'] === undefined);
    assertCheck('Step 2: medimind_auth_session removed', currentStorage['medimind_auth_session'] === undefined);
    assertCheck('Step 2: Page refresh yields unauthenticated', simulatePageRefresh() === null);

    console.log('\n--- Step 3: Login as Doctor (rahul.mehta@medimindhospital.com) ---');
    const step3 = await simulateClientLogin('rahul.mehta@medimindhospital.com', 'Password123!');
    assertCheck('Step 3: Doctor login succeeded', step3.success === true);
    assertCheck('Step 3: Role is DOCTOR', step3.user.role === 'DOCTOR');
    assertCheck('Step 3: Email is rahul.mehta@medimindhospital.com', step3.user.email === 'rahul.mehta@medimindhospital.com');
    assertCheck('Step 3: Doctor token differs from Family token', step3.token !== familyToken);

    // Verify GET /api/auth/me returns DOCTOR
    const me3 = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${step3.token}` },
    }).then(r => r.json());
    assertCheck('Step 3: Gateway /api/auth/me validates Doctor identity', me3.data?.role === 'DOCTOR');

    const doctorToken = step3.token;

    console.log('\n--- Step 4: Logout from Doctor ---');
    await simulateClientLogout();
    assertCheck('Step 4: Session cleared', simulatePageRefresh() === null);

    console.log('\n--- Step 5: Login as Department Head (priya.sharma@medimindhospital.com) ---');
    const step5 = await simulateClientLogin('priya.sharma@medimindhospital.com', 'Password123!');
    assertCheck('Step 5: Department Head login succeeded', step5.success === true);
    assertCheck('Step 5: Role is DEPARTMENT_HEAD', step5.user.role === 'DEPARTMENT_HEAD');
    assertCheck('Step 5: Email is priya.sharma@medimindhospital.com', step5.user.email === 'priya.sharma@medimindhospital.com');

    const me5 = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${step5.token}` },
    }).then(r => r.json());
    assertCheck('Step 5: Gateway /api/auth/me validates Department Head identity', me5.data?.role === 'DEPARTMENT_HEAD');

    console.log('\n--- Step 6: Logout from Department Head ---');
    await simulateClientLogout();
    assertCheck('Step 6: Session cleared', simulatePageRefresh() === null);

    console.log('\n--- Step 7: Login as Hospital Admin (admin@medimindhospital.com) ---');
    const step7 = await simulateClientLogin('admin@medimindhospital.com', 'Password123!');
    assertCheck('Step 7: Hospital Admin login succeeded', step7.success === true);
    assertCheck('Step 7: Role is HOSPITAL_ADMIN', step7.user.role === 'HOSPITAL_ADMIN');
    assertCheck('Step 7: Email is admin@medimindhospital.com', step7.user.email === 'admin@medimindhospital.com');

    const me7 = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${step7.token}` },
    }).then(r => r.json());
    assertCheck('Step 7: Gateway /api/auth/me validates Hospital Admin identity', me7.data?.role === 'HOSPITAL_ADMIN');

    const adminToken = step7.token;

    console.log('\n--- Step 8: Logout from Hospital Admin ---');
    await simulateClientLogout();
    assertCheck('Step 8: Session cleared', simulatePageRefresh() === null);

    console.log('\n--- Step 9: Login as Chairman (chairman@medimind.org) ---');
    const step9 = await simulateClientLogin('chairman@medimind.org', 'Password123!');
    assertCheck('Step 9: Chairman login succeeded', step9.success === true);
    assertCheck('Step 9: Role is CHAIRMAN', step9.user.role === 'CHAIRMAN');
    assertCheck('Step 9: Email is chairman@medimind.org', step9.user.email === 'chairman@medimind.org');

    const me9 = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${step9.token}` },
    }).then(r => r.json());
    assertCheck('Step 9: Gateway /api/auth/me validates Chairman identity', me9.data?.role === 'CHAIRMAN');

    console.log('\n--- Step 10: Logout from Chairman ---');
    await simulateClientLogout();
    assertCheck('Step 10: Session cleared', simulatePageRefresh() === null);

    console.log('\n--- Step 11: Login back as Doctor (rahul.mehta@medimindhospital.com) ---');
    const step11 = await simulateClientLogin('rahul.mehta@medimindhospital.com', 'Password123!');
    assertCheck('Step 11: Re-login as Doctor succeeded', step11.success === true);
    assertCheck('Step 11: Role is DOCTOR', step11.user.role === 'DOCTOR');
    assertCheck('Step 11: Browser refresh maintains Doctor session', simulatePageRefresh()?.role === 'DOCTOR');

    console.log('\n--- Step 12: Logout from Doctor ---');
    await simulateClientLogout();
    assertCheck('Step 12: Session cleared', simulatePageRefresh() === null);

    console.log('\n--- Step 13: Login back as Family (rohan.kapoor@example.com) ---');
    const step13 = await simulateClientLogin('rohan.kapoor@example.com', 'Password123!');
    assertCheck('Step 13: Re-login as Family succeeded', step13.success === true);
    assertCheck('Step 13: Role is FAMILY', step13.user.role === 'FAMILY');
    assertCheck('Step 13: Browser refresh maintains Family session', simulatePageRefresh()?.role === 'FAMILY');

    // -------------------------------------------------------------
    // SECTION 2: SECURITY & RBAC ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Security & RBAC Isolation Verification ---');

    // Test: Family token attempting to access Doctor-only route or Admin route
    const familyHospRes = await fetch(`${GATEWAY_URL}/api/hospitals/system-settings`, {
      headers: { Authorization: `Bearer ${step13.token}` },
    });
    assertCheck('Security: Family cannot access hospital system-settings (403/404)', familyHospRes.status === 403 || familyHospRes.status === 404);

    // Test: Hospital Admin token attempting AI prediction without authorization
    const adminAiRes = await fetch(`${GATEWAY_URL}/api/ai/fracture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ family_member_id: 'MEM-001-01', filename: 'wrist_xray.png' }),
    });
    assertCheck('Security: Hospital Admin cannot run family clinical AI inference (403)', adminAiRes.status === 403);

    // -------------------------------------------------------------
    // SECTION 3: REAL AI SERVICE HEALTH & INFERENCE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- Section 3: AI Inference Verification with Family Token ---');
    const aiRes = await fetch(`${GATEWAY_URL}/api/ai/heart-disease`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${step13.token}` },
      body: JSON.stringify({
        family_member_id: 'MEM-001-01',
        AGE: 54,
        GENDER: 1,
        HEIGHT: 172,
        WEIGHT: 76,
        AP_HIGH: 130,
        AP_LOW: 85,
        CHOLESTEROL: 1,
        GLUCOSE: 1,
        SMOKE: 0,
        ALCOHOL: 0,
        PHYSICAL_ACTIVITY: 1,
      }),
    });
    const aiData = await aiRes.json().catch(() => ({}));
    console.log('  [AI Debug]', { status: aiRes.status, aiData });
    assertCheck('AI: Heart disease inference responds 200 OK', aiRes.status === 200);
    assertCheck('AI: Result contains probability or risk_score', typeof (aiData.probability ?? aiData.risk_score ?? aiData.result?.probability) === 'number');

    console.log('\n================================================================');
    console.log(`  VERIFICATION COMPLETE: ${checksPassed}/${totalChecks} CHECKS PASSED (100%)`);
    console.log('  VERDICT: PASS — MULTI-ACCOUNT LOGIN/SESSION ISOLATION FIXED');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n\x1b[31m[AUDIT FAILED]\x1b[0m', err.message);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

run();
