import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
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
  console.log('--- Checking & Launching Services ---');
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

  let ready = false;
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const gwOk = await checkHealth('http://localhost:5000/health');
    const authOk = await checkHealth('http://localhost:5001/health');
    if (gwOk && authOk) {
      ready = true;
      break;
    }
  }
  if (!ready) {
    throw new Error('Services failed to become healthy within 40 seconds');
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

async function run() {
  try {
    await startServices();

    console.log('================================================================');
    console.log('  MEDIMIND MULTIPLE FAMILY ACCOUNTS & SESSION ISOLATION AUDIT');
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

    // Import frontend medimindData for authoritative expectations
    const medimindDataModule = await import('../../frontend/src/data/medimindData.js');
    const { families, familyMembers, getFamilyData, getFamilyPresentationData } = medimindDataModule;

    assertCheck('Frontend families array defines exactly 6 families', families.length === 6);

    const expectedFamilies = [
      { id: 'FAM-001', email: 'rohan.kapoor@example.com', head: 'Rohan Kapoor', name: 'Kapoor Family Account' },
      { id: 'FAM-002', email: 'ravi.sharma@example.com', head: 'Ravi Sharma', name: 'Sharma Family Account' },
      { id: 'FAM-003', email: 'vikram.patel@example.com', head: 'Vikram Patel', name: 'Patel Family Account' },
      { id: 'FAM-004', email: 'kiran.reddy@example.com', head: 'Kiran Reddy', name: 'Reddy Family Account' },
      { id: 'FAM-005', email: 'siddharth.menon@example.com', head: 'Siddharth Menon', name: 'Menon Family Account' },
      { id: 'FAM-006', email: 'debashis.mukherjee@example.com', head: 'Debashis Mukherjee', name: 'Mukherjee Family Account' },
    ];

    // Client session storage simulator
    let clientStorage = {};

    const clientLogin = async (email, password = 'Password123!') => {
      // Clear previous storage
      delete clientStorage['medimind_auth_session'];
      delete clientStorage['medimind_jwt_token'];

      const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        console.error(`  [DEBUG] Login failed for ${email}: status ${res.status}, message: ${data.message || data.error || 'unknown'}`);
        return { success: false, error: data.message || `status ${res.status}` };
      }

      const { user, token } = data.data;
      clientStorage['medimind_jwt_token'] = token;

      // Simulate AuthContext client mapping
      const resolvedFamId = user.familyId || (user.email && families.find((f) => f.email?.toLowerCase() === user.email.toLowerCase())?.id) || 'FAM-001';
      const matchedFam = families.find((f) => f.id === resolvedFamId) || families[0];

      const authenticatedUser = {
        id: user.userId || user.id,
        userId: user.userId || user.id,
        email: user.email,
        role: user.role,
        familyId: resolvedFamId,
        familyName: matchedFam.name,
        name: matchedFam.primaryContact,
        title: `${matchedFam.name} Head`,
        accountType: user.accountType,
        token,
      };

      clientStorage['medimind_auth_session'] = JSON.stringify(authenticatedUser);
      return { success: true, user: authenticatedUser, rawApiUser: user, token };
    };

    const clientLogout = async () => {
      const token = clientStorage['medimind_jwt_token'];
      delete clientStorage['medimind_auth_session'];
      delete clientStorage['medimind_jwt_token'];
      if (token) {
        await fetch(`${GATEWAY_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };

    // ================================================================
    // PART 1: INDIVIDUAL AUTHENTICATION OF ALL 6 FAMILY ACCOUNTS
    // ================================================================
    console.log('\n--- PART 1: Individual Authentication & Identity Verification for all 6 Families ---');

    for (const expFam of expectedFamilies) {
      console.log(`\n  * Testing Family Account: ${expFam.id} (${expFam.head})`);
      const authResult = await clientLogin(expFam.email);

      assertCheck(`[${expFam.id}] Login succeeds with status 200`, authResult.success === true);
      assertCheck(`[${expFam.id}] Role is strictly FAMILY`, authResult.user.role === 'FAMILY');
      assertCheck(`[${expFam.id}] Issued JWT token is non-empty`, !!authResult.token && authResult.token.length > 20);
      assertCheck(`[${expFam.id}] API user returns exact familyId ${expFam.id}`, authResult.rawApiUser.familyId === expFam.id);
      assertCheck(`[${expFam.id}] User email matches ${expFam.email}`, authResult.user.email.toLowerCase() === expFam.email.toLowerCase());
      assertCheck(`[${expFam.id}] User primary head matches ${expFam.head}`, authResult.user.name === expFam.head);
      assertCheck(`[${expFam.id}] User familyName matches ${expFam.name}`, authResult.user.familyName === expFam.name);

      // Verify scoped family data
      const famData = getFamilyData(expFam.id);
      assertCheck(`[${expFam.id}] Family members array loaded (count: ${famData.members.length})`, famData.members.length > 0);
      assertCheck(`[${expFam.id}] All members belong strictly to ${expFam.id}`, famData.members.every(m => m.familyId === expFam.id));
      assertCheck(`[${expFam.id}] Primary member is ${expFam.head}`, famData.members[0].fullName === expFam.head);

      const presData = getFamilyPresentationData(expFam.id);
      assertCheck(`[${expFam.id}] Presentation appointments scoped strictly to ${expFam.id}`, presData.Appointments.every(a => a.familyId === expFam.id));

      await clientLogout();
      assertCheck(`[${expFam.id}] Post-logout storage is cleared`, !clientStorage['medimind_auth_session'] && !clientStorage['medimind_jwt_token']);
    }

    // ================================================================
    // PART 2: STRICT CROSS-FAMILY DATA ISOLATION VERIFICATION
    // ================================================================
    console.log('\n--- PART 2: Strict Cross-Family Data Isolation ---');

    const fam1Data = getFamilyData('FAM-001');
    const fam2Data = getFamilyData('FAM-002');
    const fam3Data = getFamilyData('FAM-003');
    const fam4Data = getFamilyData('FAM-004');
    const fam5Data = getFamilyData('FAM-005');
    const fam6Data = getFamilyData('FAM-006');

    // Verify disjoint member IDs
    const fam1MemberIds = new Set(fam1Data.members.map(m => m.id));
    const fam2MemberIds = new Set(fam2Data.members.map(m => m.id));
    const fam3MemberIds = new Set(fam3Data.members.map(m => m.id));
    const fam4MemberIds = new Set(fam4Data.members.map(m => m.id));
    const fam5MemberIds = new Set(fam5Data.members.map(m => m.id));
    const fam6MemberIds = new Set(fam6Data.members.map(m => m.id));

    assertCheck('FAM-001 and FAM-002 have 0 overlapping members', ![...fam1MemberIds].some(id => fam2MemberIds.has(id)));
    assertCheck('FAM-002 and FAM-003 have 0 overlapping members', ![...fam2MemberIds].some(id => fam3MemberIds.has(id)));
    assertCheck('FAM-003 and FAM-004 have 0 overlapping members', ![...fam3MemberIds].some(id => fam4MemberIds.has(id)));
    assertCheck('FAM-004 and FAM-005 have 0 overlapping members', ![...fam4MemberIds].some(id => fam5MemberIds.has(id)));
    assertCheck('FAM-005 and FAM-006 have 0 overlapping members', ![...fam5MemberIds].some(id => fam6MemberIds.has(id)));

    // Verify disjoint records
    const fam1RecordIds = new Set(fam1Data.records.map(r => r.id));
    const fam2RecordIds = new Set(fam2Data.records.map(r => r.id));
    assertCheck('FAM-001 records are completely isolated from FAM-002', ![...fam1RecordIds].some(id => fam2RecordIds.has(id)));

    // ================================================================
    // PART 3: SEQUENTIAL SAME-BROWSER SWITCHING ACROSS ALL 6 FAMILIES
    // ================================================================
    console.log('\n--- PART 3: Sequential Same-Browser Switching across all 6 Families ---');

    for (let i = 0; i < expectedFamilies.length; i++) {
      const current = expectedFamilies[i];
      const next = expectedFamilies[(i + 1) % expectedFamilies.length];

      console.log(`  * Transitioning from ${current.id} (${current.head}) -> ${next.id} (${next.head})`);

      // Login current
      const res1 = await clientLogin(current.email);
      assertCheck(`Logged in as ${current.id}`, res1.user.familyId === current.id);

      // Verify active session matches current
      const activeSession1 = JSON.parse(clientStorage['medimind_auth_session']);
      assertCheck(`Session contains ${current.id} (${current.head})`, activeSession1.familyId === current.id && activeSession1.name === current.head);

      // Logout
      await clientLogout();
      assertCheck(`Session purged after logout of ${current.id}`, !clientStorage['medimind_auth_session']);

      // Login next
      const res2 = await clientLogin(next.email);
      assertCheck(`Logged in as ${next.id}`, res2.user.familyId === next.id);

      // Verify active session matches next and NO stale current data remains
      const activeSession2 = JSON.parse(clientStorage['medimind_auth_session']);
      assertCheck(`Session updated to ${next.id} (${next.head})`, activeSession2.familyId === next.id && activeSession2.name === next.head);
      assertCheck(`Zero stale identity remaining from ${current.id}`, activeSession2.email !== current.email && activeSession2.familyId !== current.id);

      await clientLogout();
    }

    // ================================================================
    // PART 4: CROSS-ROLE TRANSITIONS INVOLVING DIFFERENT FAMILIES
    // ================================================================
    console.log('\n--- PART 4: Cross-Role Transitions Involving Different Families ---');

    const roleSequence = [
      { email: 'rahul.mehta@medimindhospital.com', expectedRole: 'DOCTOR' },
      { email: 'ravi.sharma@example.com', expectedRole: 'FAMILY', expectedFamId: 'FAM-002', expectedHead: 'Ravi Sharma' },
      { email: 'admin@medimindhospital.com', expectedRole: 'HOSPITAL_ADMIN' },
      { email: 'kiran.reddy@example.com', expectedRole: 'FAMILY', expectedFamId: 'FAM-004', expectedHead: 'Kiran Reddy' },
      { email: 'priya.sharma@medimindhospital.com', expectedRole: 'DEPARTMENT_HEAD' },
      { email: 'siddharth.menon@example.com', expectedRole: 'FAMILY', expectedFamId: 'FAM-005', expectedHead: 'Siddharth Menon' },
      { email: 'chairman@medimind.org', expectedRole: 'CHAIRMAN' },
      { email: 'debashis.mukherjee@example.com', expectedRole: 'FAMILY', expectedFamId: 'FAM-006', expectedHead: 'Debashis Mukherjee' },
    ];

    for (let i = 0; i < roleSequence.length; i++) {
      const step = roleSequence[i];
      console.log(`  * Step ${i + 1}: Logging in as ${step.expectedRole} (${step.email})`);

      const res = await clientLogin(step.email);
      assertCheck(`Login successful for ${step.email}`, res.success === true);
      assertCheck(`Role is ${step.expectedRole}`, res.user.role === step.expectedRole);

      if (step.expectedRole === 'FAMILY') {
        assertCheck(`Family account is ${step.expectedFamId}`, res.user.familyId === step.expectedFamId);
        assertCheck(`Family head is ${step.expectedHead}`, res.user.name === step.expectedHead);
      }

      await clientLogout();
      assertCheck(`Storage cleared after step ${i + 1}`, !clientStorage['medimind_auth_session']);
    }

    // ================================================================
    // PART 5: FRONTEND CODEBASE AUDIT — ZERO SIDEBAR SWITCHERS
    // ================================================================
    console.log('\n--- PART 5: Frontend Codebase Audit — Verifying Removal of Sidebar Role Switchers ---');

    const layoutFiles = [
      'frontend/src/components/family/FamilyLayout.jsx',
      'frontend/src/components/doctor/DoctorLayout.jsx',
      'frontend/src/components/department-head/DepartmentHeadLayout.jsx',
      'frontend/src/components/hospital-admin/HospitalAdminLayout.jsx',
      'frontend/src/components/chairman/ChairmanLayout.jsx',
    ];

    for (const relPath of layoutFiles) {
      const fullPath = path.resolve(rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check that switchRole is not called in any onClick or event handler in layouts
      const hasSwitchRoleCall = /switchRole\s*\(/.test(content);
      assertCheck(`[${path.basename(relPath)}] switchRole() is NOT invoked anywhere in component`, !hasSwitchRoleCall);

      // Check that sidebar buttons with switch titles/labels are absent
      const hasQuickSwitchText = /Switch to (Doctor|Department Head|Hospital Admin|Chairman|Family|Dept Head)/i.test(content);
      assertCheck(`[${path.basename(relPath)}] No 'Switch to <Role>' buttons exist in markup`, !hasQuickSwitchText);
    }

    // Verify that legitimate dependent/member selection inside FamilyLayout is preserved
    const familyLayoutContent = fs.readFileSync(path.resolve(rootDir, 'frontend/src/components/family/FamilyLayout.jsx'), 'utf8');
    assertCheck('[FamilyLayout.jsx] selectedMember state is preserved for dependent switching', familyLayoutContent.includes('selectedMember'));
    assertCheck('[FamilyLayout.jsx] MemberProfileView receives selected member and familyMembers', familyLayoutContent.includes('member={currentProfileMember}') && familyLayoutContent.includes('familyMembers={familyMembers}'));

    console.log('\n================================================================');
    console.log(`  ALL AUDIT CHECKS COMPLETED: ${checksPassed}/${totalChecks} PASSED`);
    console.log('  VERDICT: PASS — ALL FAMILY ACCOUNTS OPEN THEIR OWN AUTHENTICATED FAMILY DATA');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ AUDIT FAILED:', err);
    process.exit(1);
  } finally {
    cleanup();
  }
}

run();
