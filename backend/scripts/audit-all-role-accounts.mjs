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
  console.log('--- Initializing MediMind Microservices for All-Role Multi-Account Audit ---');
  for (const svc of services) {
    const isOnline = await checkHealth(`http://localhost:${svc.port}/health`);
    if (isOnline) {
      console.log(`  * ${svc.name} is already online on :${svc.port}`);
      continue;
    }
    const child = spawn(svc.cmd, svc.args, {
      cwd: svc.dir,
      env: { ...process.env, PORT: svc.port.toString(), NODE_ENV: 'test' },
      stdio: 'ignore',
      shell: true,
    });
    processes.push(child);
  }

  let ready = false;
  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    const gwOk = await checkHealth('http://localhost:5000/health');
    const authOk = await checkHealth('http://localhost:5001/health');
    if (gwOk && authOk) {
      ready = true;
      break;
    }
  }
  if (!ready) {
    throw new Error('Required services (API Gateway & Auth Service) failed to become healthy within 45s');
  }
  console.log('✓ API Gateway & Auth Service are online and responding!\n');
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

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

async function loginAccount(email, password = 'Password123!') {
  const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function getMe(token) {
  const res = await fetch(`${GATEWAY_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function logoutAccount(token) {
  const res = await fetch(`${GATEWAY_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, ok: res.ok };
}

// 26 Canonical Accounts from credentials.txt
const ALL_ACCOUNTS = [
  // 1. CHAIRMAN (2 Accounts)
  {
    role: 'CHAIRMAN',
    name: 'Dr. Devendra Roy',
    email: 'chairman@medimind.org',
    expectedAccountType: 'CHAIRMAN_ACCOUNT',
    scope: 'Global Platform Owner',
  },
  {
    role: 'CHAIRMAN',
    name: 'Dr. Suresh Menon',
    email: 'chairman@medimind.com',
    expectedAccountType: 'CHAIRMAN_ACCOUNT',
    scope: 'Global Platform Owner',
  },

  // 2. HOSPITAL ADMINS (3 Accounts)
  {
    role: 'HOSPITAL_ADMIN',
    name: 'Dr. Rajesh Sharma',
    email: 'admin@medimindhospital.com',
    expectedAccountType: 'HOSPITAL_ADMIN_ACCOUNT',
    hospitalId: 'HOSP-001',
    hospitalName: 'MediMind Central Hospital',
  },
  {
    role: 'HOSPITAL_ADMIN',
    name: 'Vikram Malhotra',
    email: 'admin@apexmetro.hospital',
    expectedAccountType: 'HOSPITAL_ADMIN_ACCOUNT',
    hospitalId: 'HOSP-002',
    hospitalName: 'Apex Metro Healthcare',
  },
  {
    role: 'HOSPITAL_ADMIN',
    name: 'Matthew Varghese',
    email: 'admin@stjude.hospital',
    expectedAccountType: 'HOSPITAL_ADMIN_ACCOUNT',
    hospitalId: 'HOSP-003',
    hospitalName: 'St. Jude Multispecialty Hospital',
  },

  // 3. DEPARTMENT HEADS (9 Accounts)
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@medimindhospital.com',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H1-ORTHO',
    hospitalId: 'HOSP-001',
    departmentName: 'Orthopedics',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Suresh Iyer',
    email: 'suresh.iyer@medimindhospital.com',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H1-DIAB',
    hospitalId: 'HOSP-001',
    departmentName: 'Diabetology & Endocrinology',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Rajesh Nair',
    email: 'rajesh.nair@medimindhospital.com',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H1-CARDIO',
    hospitalId: 'HOSP-001',
    departmentName: 'Cardiology',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Amit Verma',
    email: 'amit.verma@medimindhospital.com',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H1-GEN',
    hospitalId: 'HOSP-001',
    departmentName: 'General Medicine',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Sunita Kulkarni',
    email: 'sunita.kulkarni@medimindhospital.com',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H1-NEURO',
    hospitalId: 'HOSP-001',
    departmentName: 'Neurology',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Vikram Deshmukh',
    email: 'vikram.deshmukh@medimindhospital.com',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H1-ONCO',
    hospitalId: 'HOSP-001',
    departmentName: 'Oncology',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Harish Rao',
    email: 'harish.rao@apexmetro.hospital',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H2-ORTHO',
    hospitalId: 'HOSP-002',
    departmentName: 'Orthopedics',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Meera Reddy',
    email: 'meera.reddy@apexmetro.hospital',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H2-DIAB',
    hospitalId: 'HOSP-002',
    departmentName: 'Diabetology',
  },
  {
    role: 'DEPARTMENT_HEAD',
    name: 'Dr. Sanjay Gupta',
    email: 'sanjay.gupta@apexmetro.hospital',
    expectedAccountType: 'DEPARTMENT_HEAD_ACCOUNT',
    departmentId: 'DEP-H2-CARDIO',
    hospitalId: 'HOSP-002',
    departmentName: 'Cardiology',
  },

  // 4. DOCTORS (6 Accounts)
  {
    role: 'DOCTOR',
    name: 'Dr. Rahul Mehta',
    email: 'rahul.mehta@medimindhospital.com',
    expectedAccountType: 'DOCTOR_ACCOUNT',
    doctorId: 'doc_001',
    departmentId: 'DEP-H1-ORTHO',
    hospitalId: 'HOSP-001',
  },
  {
    role: 'DOCTOR',
    name: 'Dr. Vikram Anand',
    email: 'vikram.anand@medimindhospital.com',
    expectedAccountType: 'DOCTOR_ACCOUNT',
    doctorId: 'DOC-H1-ORTHO-2',
    departmentId: 'DEP-H1-ORTHO',
    hospitalId: 'HOSP-001',
  },
  {
    role: 'DOCTOR',
    name: 'Dr. Sneha Reddy',
    email: 'sneha.reddy@medimindhospital.com',
    expectedAccountType: 'DOCTOR_ACCOUNT',
    doctorId: 'DOC-H1-ORTHO-3',
    departmentId: 'DEP-H1-ORTHO',
    hospitalId: 'HOSP-001',
  },
  {
    role: 'DOCTOR',
    name: 'Dr. Ananya Roy',
    email: 'ananya.roy@medimindhospital.com',
    expectedAccountType: 'DOCTOR_ACCOUNT',
    doctorId: 'DOC-H1-DIAB-1',
    departmentId: 'DEP-H1-DIAB',
    hospitalId: 'HOSP-001',
  },
  {
    role: 'DOCTOR',
    name: 'Dr. Arjun Patel',
    email: 'arjun.patel@medimindhospital.com',
    expectedAccountType: 'DOCTOR_ACCOUNT',
    doctorId: 'DOC-H1-CARDIO-1',
    departmentId: 'DEP-H1-CARDIO',
    hospitalId: 'HOSP-001',
  },
  {
    role: 'DOCTOR',
    name: 'Dr. Deepak Verma',
    email: 'deepak.verma@medimindhospital.com',
    expectedAccountType: 'DOCTOR_ACCOUNT',
    doctorId: 'DOC-H1-GEN-1',
    departmentId: 'DEP-H1-GEN',
    hospitalId: 'HOSP-001',
  },

  // 5. FAMILIES (6 Accounts)
  {
    role: 'FAMILY',
    name: 'Rohan Kapoor',
    email: 'rohan.kapoor@example.com',
    expectedAccountType: 'FAMILY_ACCOUNT',
    familyId: 'FAM-001',
  },
  {
    role: 'FAMILY',
    name: 'Ravi Sharma',
    email: 'ravi.sharma@example.com',
    expectedAccountType: 'FAMILY_ACCOUNT',
    familyId: 'FAM-002',
  },
  {
    role: 'FAMILY',
    name: 'Vikram Patel',
    email: 'vikram.patel@example.com',
    expectedAccountType: 'FAMILY_ACCOUNT',
    familyId: 'FAM-003',
  },
  {
    role: 'FAMILY',
    name: 'Kiran Reddy',
    email: 'kiran.reddy@example.com',
    expectedAccountType: 'FAMILY_ACCOUNT',
    familyId: 'FAM-004',
  },
  {
    role: 'FAMILY',
    name: 'Siddharth Menon',
    email: 'siddharth.menon@example.com',
    expectedAccountType: 'FAMILY_ACCOUNT',
    familyId: 'FAM-005',
  },
  {
    role: 'FAMILY',
    name: 'Debashis Mukherjee',
    email: 'debashis.mukherjee@example.com',
    expectedAccountType: 'FAMILY_ACCOUNT',
    familyId: 'FAM-006',
  },
];

async function run() {
  try {
    await startServices();

    console.log('================================================================');
    console.log('  MEDIMIND COMPLETE MULTI-ACCOUNT IDENTITY & SESSION AUDIT');
    console.log('  ALL 26 CANONICAL ACCOUNTS FROM credentials.txt');
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

    // -------------------------------------------------------------------------
    // PHASE 1: INDIVIDUAL AUTHENTICATION & JWT VERIFICATION (26 ACCOUNTS)
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 1: Individual Authentication & JWT Verification (26 Accounts) ---');
    const accountSessions = {};

    for (const acc of ALL_ACCOUNTS) {
      console.log(`\n  Checking [${acc.role}] ${acc.name} <${acc.email}>...`);
      const res = await loginAccount(acc.email);

      assertCheck(`${acc.email}: HTTP status 200`, res.status === 200);
      assertCheck(`${acc.email}: Success flag true`, res.data?.success === true);
      assertCheck(`${acc.email}: Valid JWT token returned`, Boolean(res.data?.data?.token));

      const { user, token } = res.data.data;
      accountSessions[acc.email] = { token, user };

      assertCheck(`${acc.email}: User ID populated`, Boolean(user.userId));
      assertCheck(`${acc.email}: Email matches exact lowercase`, user.email === acc.email.toLowerCase());
      assertCheck(`${acc.email}: Role matches '${acc.role}'`, user.role === acc.role);
      assertCheck(`${acc.email}: AccountType matches '${acc.expectedAccountType}'`, user.accountType === acc.expectedAccountType);

      // Verify JWT payload claims
      const claims = parseJwt(token);
      assertCheck(`${acc.email}: JWT payload valid`, claims !== null);
      assertCheck(`${acc.email}: JWT role claim matches`, claims.role === acc.role);
      assertCheck(`${acc.email}: JWT userId claim matches`, claims.userId === user.userId);

      // Verify role-specific entity linkages
      if (acc.role === 'FAMILY') {
        assertCheck(`${acc.email}: familyId matches '${acc.familyId}'`, user.familyId === acc.familyId && claims.familyId === acc.familyId);
      }
      if (acc.role === 'DOCTOR') {
        assertCheck(`${acc.email}: doctorId matches '${acc.doctorId}'`, user.doctorId === acc.doctorId);
        assertCheck(`${acc.email}: departmentId matches '${acc.departmentId}'`, user.departmentId === acc.departmentId);
        assertCheck(`${acc.email}: hospitalId matches '${acc.hospitalId}'`, user.hospitalId === acc.hospitalId);
      }
      if (acc.role === 'DEPARTMENT_HEAD') {
        assertCheck(`${acc.email}: departmentId matches '${acc.departmentId}'`, user.departmentId === acc.departmentId);
        assertCheck(`${acc.email}: hospitalId matches '${acc.hospitalId}'`, user.hospitalId === acc.hospitalId);
      }
      if (acc.role === 'HOSPITAL_ADMIN') {
        assertCheck(`${acc.email}: hospitalId matches '${acc.hospitalId}'`, user.hospitalId === acc.hospitalId);
      }

      // Verify /api/auth/me session persistence with token
      const meRes = await getMe(token);
      assertCheck(`${acc.email}: /api/auth/me returns 200`, meRes.status === 200);
      assertCheck(`${acc.email}: /api/auth/me userId matches`, meRes.data?.data?.userId === user.userId);
      assertCheck(`${acc.email}: /api/auth/me role matches`, meRes.data?.data?.role === acc.role);
    }

    // -------------------------------------------------------------------------
    // PHASE 2: SAME-BROWSER SEQUENTIAL SWITCHING WITHIN EACH ROLE
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 2: Same-Browser Sequential Account Switching (Within-Role) ---');

    // 2.1 Sequential Doctor Switching (6 Doctors)
    console.log('\n  >> Sequential Doctor Switching (6 Distinct Clinicians):');
    const doctorAccounts = ALL_ACCOUNTS.filter((a) => a.role === 'DOCTOR');
    let previousDocId = null;
    let previousDocToken = null;

    for (const doc of doctorAccounts) {
      if (previousDocToken) {
        const out = await logoutAccount(previousDocToken);
        assertCheck(`Logout previous doctor session before switching to ${doc.name}`, out.status === 200);
      }
      const login = await loginAccount(doc.email);
      assertCheck(`Login as ${doc.name} succeeds (200)`, login.status === 200);
      assertCheck(`Session belongs strictly to doctor '${doc.doctorId}'`, login.data.data.user.doctorId === doc.doctorId);
      assertCheck(`Session token differs from previous clinician`, login.data.data.token !== previousDocToken);
      assertCheck(`Clinician doctorId differs from previous doctor`, login.data.data.user.doctorId !== previousDocId);

      previousDocId = login.data.data.user.doctorId;
      previousDocToken = login.data.data.token;
    }
    await logoutAccount(previousDocToken);

    // 2.2 Sequential Department Head Switching (9 Heads across H1 & H2)
    console.log('\n  >> Sequential Department Head Switching (9 Clinical Department Leaders):');
    const headAccounts = ALL_ACCOUNTS.filter((a) => a.role === 'DEPARTMENT_HEAD');
    let previousDeptId = null;
    let previousHeadToken = null;

    for (const head of headAccounts) {
      if (previousHeadToken) {
        const out = await logoutAccount(previousHeadToken);
        assertCheck(`Logout previous department head before switching to ${head.name}`, out.status === 200);
      }
      const login = await loginAccount(head.email);
      assertCheck(`Login as ${head.name} succeeds (200)`, login.status === 200);
      assertCheck(`Department head mapped to '${head.departmentId}'`, login.data.data.user.departmentId === head.departmentId);
      assertCheck(`Hospital ID matches facility '${head.hospitalId}'`, login.data.data.user.hospitalId === head.hospitalId);
      assertCheck(`Session token is unique per department head`, login.data.data.token !== previousHeadToken);

      previousDeptId = login.data.data.user.departmentId;
      previousHeadToken = login.data.data.token;
    }
    await logoutAccount(previousHeadToken);

    // 2.3 Sequential Hospital Admin Switching (3 Hospitals)
    console.log('\n  >> Sequential Hospital Admin Switching (3 Facility Admins: H1, H2, H3):');
    const adminAccounts = ALL_ACCOUNTS.filter((a) => a.role === 'HOSPITAL_ADMIN');
    let previousHospId = null;
    let previousAdminToken = null;

    for (const admin of adminAccounts) {
      if (previousAdminToken) {
        const out = await logoutAccount(previousAdminToken);
        assertCheck(`Logout previous admin session before switching to ${admin.name}`, out.status === 200);
      }
      const login = await loginAccount(admin.email);
      assertCheck(`Login as ${admin.name} succeeds (200)`, login.status === 200);
      assertCheck(`Admin mapped to facility '${admin.hospitalId}'`, login.data.data.user.hospitalId === admin.hospitalId);
      assertCheck(`Admin facility differs from previous facility`, login.data.data.user.hospitalId !== previousHospId);

      previousHospId = login.data.data.user.hospitalId;
      previousAdminToken = login.data.data.token;
    }
    await logoutAccount(previousAdminToken);

    // 2.4 Sequential Chairman Switching (2 Platform Owners)
    console.log('\n  >> Sequential Chairman Switching (2 Platform Owners):');
    const chairAccounts = ALL_ACCOUNTS.filter((a) => a.role === 'CHAIRMAN');
    let previousChairUserId = null;
    let previousChairToken = null;

    for (const chair of chairAccounts) {
      if (previousChairToken) {
        const out = await logoutAccount(previousChairToken);
        assertCheck(`Logout previous chairman before switching to ${chair.name}`, out.status === 200);
      }
      const login = await loginAccount(chair.email);
      assertCheck(`Login as ${chair.name} succeeds (200)`, login.status === 200);
      assertCheck(`Chairman session has distinct userId`, login.data.data.user.userId !== previousChairUserId);

      previousChairUserId = login.data.data.user.userId;
      previousChairToken = login.data.data.token;
    }
    await logoutAccount(previousChairToken);

    // 2.5 Sequential Family Switching (6 Families)
    console.log('\n  >> Sequential Family Switching (6 Distinct Family Households):');
    const familyAccounts = ALL_ACCOUNTS.filter((a) => a.role === 'FAMILY');
    let previousFamId = null;
    let previousFamToken = null;

    for (const fam of familyAccounts) {
      if (previousFamToken) {
        const out = await logoutAccount(previousFamToken);
        assertCheck(`Logout previous family before switching to ${fam.name}`, out.status === 200);
      }
      const login = await loginAccount(fam.email);
      assertCheck(`Login as ${fam.name} succeeds (200)`, login.status === 200);
      assertCheck(`Household isolated to '${fam.familyId}'`, login.data.data.user.familyId === fam.familyId);
      assertCheck(`Family code differs from previous household`, login.data.data.user.familyId !== previousFamId);

      previousFamId = login.data.data.user.familyId;
      previousFamToken = login.data.data.token;
    }
    await logoutAccount(previousFamToken);

    // -------------------------------------------------------------------------
    // PHASE 3: CROSS-ROLE TRANSITIONS (FAMILY -> DOCTOR -> HEAD -> ADMIN -> CHAIRMAN)
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 3: Cross-Role Sequential Switching Matrix ---');
    const crossRoleSequence = [
      { role: 'FAMILY', email: 'rohan.kapoor@example.com' },
      { role: 'DOCTOR', email: 'rahul.mehta@medimindhospital.com' },
      { role: 'DEPARTMENT_HEAD', email: 'priya.sharma@medimindhospital.com' },
      { role: 'HOSPITAL_ADMIN', email: 'admin@medimindhospital.com' },
      { role: 'CHAIRMAN', email: 'chairman@medimind.org' },
      { role: 'FAMILY', email: 'ravi.sharma@example.com' },
      { role: 'DOCTOR', email: 'ananya.roy@medimindhospital.com' },
      { role: 'DEPARTMENT_HEAD', email: 'suresh.iyer@medimindhospital.com' },
      { role: 'HOSPITAL_ADMIN', email: 'admin@apexmetro.hospital' },
      { role: 'CHAIRMAN', email: 'chairman@medimind.com' },
    ];

    let activeSessionToken = null;
    for (let i = 0; i < crossRoleSequence.length; i++) {
      const step = crossRoleSequence[i];
      if (activeSessionToken) {
        await logoutAccount(activeSessionToken);
      }
      const res = await loginAccount(step.email);
      assertCheck(`Transition ${i + 1}/${crossRoleSequence.length}: login as ${step.email} [${step.role}] succeeds`, res.status === 200);
      assertCheck(`Transition ${i + 1}: authenticated role is strictly '${step.role}'`, res.data.data.user.role === step.role);
      activeSessionToken = res.data.data.token;
    }
    if (activeSessionToken) await logoutAccount(activeSessionToken);

    // -------------------------------------------------------------------------
    // PHASE 4: DATA ISOLATION & RBAC BOUNDARIES
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 4: Cross-Account Data Isolation & Security Boundaries ---');

    // 4.1 Unauthenticated requests are rejected
    const unauth = await fetch(`${GATEWAY_URL}/api/auth/me`);
    assertCheck('Access without token rejected with 401 Unauthorized', unauth.status === 401);

    // 4.2 Bad password rejected
    const badPass = await loginAccount('rahul.mehta@medimindhospital.com', 'WrongPassword123!');
    assertCheck('Invalid password rejected with 401', badPass.status === 401);

    // 4.3 Non-existent email rejected
    const fakeEmail = await loginAccount('unknown.doctor@medimindhospital.com', 'Password123!');
    assertCheck('Non-existent email rejected with 401', fakeEmail.status === 401);

    // 4.4 Tampered JWT rejected
    const tampered = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature' },
    });
    assertCheck('Tampered JWT token rejected with 401', tampered.status === 401);

    // 4.5 Distinct token identities are immutable
    const d1 = await loginAccount('rahul.mehta@medimindhospital.com');
    const d2 = await loginAccount('vikram.anand@medimindhospital.com');
    assertCheck('Dr. Rahul Mehta and Dr. Vikram Anand receive distinct tokens', d1.data.data.token !== d2.data.data.token);
    assertCheck('Dr. Rahul Mehta user ID is unique', d1.data.data.user.userId !== d2.data.data.user.userId);
    assertCheck('Dr. Rahul Mehta doctorId is doc_001', d1.data.data.user.doctorId === 'doc_001');
    assertCheck('Dr. Vikram Anand doctorId is DOC-H1-ORTHO-2', d2.data.data.user.doctorId === 'DOC-H1-ORTHO-2');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  AUDIT COMPLETE: ${checksPassed} / ${totalChecks} CHECKS PASSED (100%)`);
    console.log('  FINAL VERDICT: PASS — ALL CREDENTIALS MAP TO THEIR CORRECT AUTHENTICATED ACCOUNTS');
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Audit encountered an error:', err.message);
    process.exit(1);
  } finally {
    cleanup();
  }
}

run();
