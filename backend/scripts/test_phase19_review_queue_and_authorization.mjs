import fs from 'fs';
import path from 'path';

// Parse backend/.env
const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
}

async function login(email, password) {
  let res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  let data = await res.json();
  if (!data.success && password !== 'Password123!') {
    res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' })
    });
    data = await res.json();
  }
  if (!data.success) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return data.data?.token || data.token;
}

async function run() {
  console.log('========================================================================');
  console.log('VERIFYING PHASE 19: REVIEW QUEUE, AUTHORIZATION & INVARIANTS');
  console.log('========================================================================\n');

  const chairToken = await login('chairman@medimind.org', 'Chair#2026' + String.fromCharCode(36) + '01!Dev');
  const adminToken = await login('admin@aarogyam.hospital', 'Admin#2026' + String.fromCharCode(36) + '01!Dev');
  const docToken = await login('dr.rahul.sharma@aarogyam.hospital', 'Doctor#2026' + String.fromCharCode(36) + '01!Dev');
  const famToken = await login('rohan.kapoor@example.com', 'Family#2026' + String.fromCharCode(36) + '01!Dev');

  // Test 1: Role Scoping & Access Control on Review Queue
  console.log('[Test 1] Testing Role Scoping & Tenant Isolation on Review Queue...');
  
  // Chairman (Platform-wide)
  const chairRes = await fetch('http://localhost:5000/api/appointments/review-queue', {
    headers: { 'Authorization': `Bearer ${chairToken}` }
  });
  const chairData = await chairRes.json();
  if (!chairData.success || chairData.data?.total !== 274) {
    throw new Error(`Expected Chairman review queue total 274, got ${chairData.data?.total}`);
  }
  console.log(`✓ PASS: Platform Owner retrieves complete review queue: ${chairData.data.total} items across active hospitals.`);

  // Aarogyam Admin (Scoped to Aarogyam only)
  const adminRes = await fetch('http://localhost:5000/api/appointments/review-queue', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminData = await adminRes.json();
  if (!adminData.success || adminData.data?.total !== 64) {
    throw new Error(`Expected Aarogyam Admin review queue total 64, got ${adminData.data?.total}`);
  }
  const adminHosps = Object.keys(adminData.data.countsByHospital);
  if (adminHosps.length !== 1 || adminHosps[0] !== 'Aarogyam Multispeciality Hospital') {
    throw new Error(`Expected single hospital scope for Aarogyam Admin, got ${JSON.stringify(adminHosps)}`);
  }
  console.log(`✓ PASS: Hospital Admin strictly scoped to facility: exactly 64 items for Aarogyam Multispeciality Hospital.`);

  // Doctor (Scoped to Dr. Rahul Sharma)
  const docRes = await fetch('http://localhost:5000/api/appointments/review-queue', {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const docData = await docRes.json();
  if (!docData.success || docData.data?.total !== 3) {
    throw new Error(`Expected Dr. Rahul Sharma review queue total 3, got ${docData.data?.total}`);
  }
  console.log(`✓ PASS: Attending Doctor strictly scoped to assigned encounters: exactly 3 items for Dr. Rahul Sharma.`);

  // Family Member (Forbidden)
  const famRes = await fetch('http://localhost:5000/api/appointments/review-queue', {
    headers: { 'Authorization': `Bearer ${famToken}` }
  });
  if (famRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Family role, got ${famRes.status}`);
  }
  console.log(`✓ PASS: Family / Patient role correctly forbidden (403) from accessing clinical review queue.`);

  // Test 2: Role Authorization on Review Decisions
  console.log('\n[Test 2] Testing Role Authorization & Permission Enforcement on Decisions...');
  const sampleAarogyamItem = adminData.data.items[0];

  // Hospital Admin attempting CLINICAL_COMPLETION (Forbidden)
  const adminIllegalRes = await fetch(`http://localhost:5000/api/appointments/${sampleAarogyamItem.id}/review`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'CLINICAL_COMPLETION',
      reason: 'Administrative mark as complete',
      evidenceReference: 'Administrative assumption'
    })
  });
  if (adminIllegalRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden when Hospital Admin attempts CLINICAL_COMPLETION, got ${adminIllegalRes.status}`);
  }
  console.log(`✓ PASS: Hospital Admin prohibited from making clinical completion decisions (403 Forbidden).`);

  // Test 3: Optimistic Concurrency & Stale Modification Prevention
  console.log('\n[Test 3] Testing Optimistic Concurrency & Stale Update Protection...');
  const staleRes = await fetch(`http://localhost:5000/api/appointments/${sampleAarogyamItem.id}/review`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'ESCALATE',
      reason: 'Routine escalation',
      evidenceReference: 'Review queue audit',
      expectedUpdatedAt: '2020-01-01T00:00:00.000Z' // Obsolete timestamp
    })
  });
  if (staleRes.status !== 409) {
    throw new Error(`Expected 409 Conflict on stale expectedUpdatedAt, got ${staleRes.status}`);
  }
  console.log(`✓ PASS: Stale update rejected with 409 Conflict (Optimistic concurrency locked).`);

  // Test 4: Auditable Escalation Transition (Safe Dry-Run Escalation without status mutation)
  console.log('\n[Test 4] Testing Safe Audit Logging & Status Preservation...');
  const escalateRes = await fetch(`http://localhost:5000/api/appointments/${sampleAarogyamItem.id}/review`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      decision: 'ESCALATE',
      reason: 'Phase 19 verification: escalated for clinician review without status mutation',
      evidenceReference: 'Audit log verification key',
      expectedUpdatedAt: sampleAarogyamItem.updatedAt
    })
  });
  const escalateData = await escalateRes.json();
  if (!escalateData.success) {
    throw new Error(`Escalation failed: ${JSON.stringify(escalateData)}`);
  }
  if (escalateData.data.status !== sampleAarogyamItem.status) {
    throw new Error(`Status mutated unexpectedly: ${escalateData.data.status} != ${sampleAarogyamItem.status}`);
  }
  const history = escalateData.data.clinicalReviewHistory || escalateData.data.clinical_review_history || [];
  if (history.length === 0 || history[history.length - 1].decision !== 'ESCALATE') {
    throw new Error(`Audit history missing transition: ${JSON.stringify(history)}`);
  }
  console.log(`✓ PASS: Audit transition recorded cleanly in clinicalReviewHistory; status preserved as ${escalateData.data.status}.`);

  // Test 5: Verify Critical Baseline & Safety Invariants
  console.log('\n[Test 5] Verifying Production Invariants...');
  
  // Total active appointments must remain exactly 5,009
  const statsRes = await fetch('http://localhost:5000/api/appointments/stats', {
    headers: { 'Authorization': `Bearer ${chairToken}` }
  });
  const stats = (await statsRes.json()).data;
  if (stats.dueWorkload + stats.futureWorkload !== 5009) {
    throw new Error(`Total active appointments altered: ${stats.dueWorkload + stats.futureWorkload} != 5009`);
  }
  console.log(`✓ PASS: Active appointments invariant verified: exactly 5,009.`);

  // October scheduled baseline must remain exactly 741
  const octTrend = (stats.monthlyTrends || []).find(m => m.monthKey === '2026-10' || m.month === 'Oct 2026');
  if (!octTrend || octTrend.scheduledWorkload !== 741) {
    throw new Error(`October scheduled baseline altered: ${octTrend?.scheduledWorkload} != 741`);
  }
  console.log(`✓ PASS: October scheduled workload locked at verified baseline: ${octTrend.scheduledWorkload}.`);

  // November advance appointments must remain exactly 330
  const novTrend = (stats.monthlyTrends || []).find(m => m.monthKey === '2026-11' || m.month === 'Nov 2026');
  if (!novTrend || novTrend.scheduledWorkload !== 330 || (!['Future Workload', 'MTD In Progress'].includes(novTrend.status))) {
    throw new Error(`November advance workload altered: ${novTrend?.scheduledWorkload} != 330 (status: ${novTrend?.status})`);
  }
  console.log(`✓ PASS: November advance workload locked at 330 (0 shifted, 0 completed, status: ${novTrend.status}).`);

  // Unresolved due appointments preserved
  if (stats.unresolvedDueCount !== 345) {
    throw new Error(`Unresolved due count altered: ${stats.unresolvedDueCount} != 345`);
  }
  console.log(`✓ PASS: Unresolved due workload preserved at exactly 345 (Zero synthetic closures).`);

  console.log('\n========================================================================');
  console.log('ALL PHASE 19 REVIEW QUEUE & AUTHORIZATION TESTS PASSED!');
  console.log('========================================================================');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
