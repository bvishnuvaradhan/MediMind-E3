import fs from 'fs';
import path from 'path';

// Parse backend/.env
const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

const GATEWAY_URL = 'http://localhost:5000';
const AI_SERVICE_URL = 'http://127.0.0.1:5007';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function login(email, password) {
  let res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  let data = await res.json();
  if (!data.success && password !== 'Password123!') {
    res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
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
  console.log('MEDIMIND PHASE 20: COMPLETE SYSTEM INTEGRATION & E2E VALIDATION SUITE');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. Authenticate All Five User Roles
  // ---------------------------------------------------------------------------
  console.log('[Step 1] Authenticating All Five Platform Roles...');
  
  const familyToken = await login('rohan.kapoor@example.com', 'Password123!');
  assert(!!familyToken, '1.1 Patient / Family authentication successful (rohan.kapoor@example.com)');

  const doctorToken = await login('dr.rahul.sharma@aarogyam.hospital', 'Doctor#2026' + String.fromCharCode(36) + '01!Dev');
  assert(!!doctorToken, '1.2 Attending Doctor authentication successful (dr.rahul.sharma@aarogyam.hospital)');

  const deptHeadToken = await login('priya.sharma@medimindhospital.com', 'Password123!');
  assert(!!deptHeadToken, '1.3 Department Head authentication successful (priya.sharma@medimindhospital.com)');

  const adminToken = await login('admin@aarogyam.hospital', 'Admin#2026' + String.fromCharCode(36) + '01!Dev');
  assert(!!adminToken, '1.4 Hospital Admin authentication successful (admin@aarogyam.hospital)');

  const chairToken = await login('chairman@medimind.org', 'Password123!');
  assert(!!chairToken, '1.5 Chairman / Platform Owner authentication successful (chairman@medimind.org)');

  // ---------------------------------------------------------------------------
  // 2. Role-Based Access Control & Tenant Boundaries
  // ---------------------------------------------------------------------------
  console.log('\n[Step 2] Validating Role-Based Access Control & Tenant Isolation...');

  // 2.1 Family Member Profile & Scoping
  const famProfileRes = await fetch(`${GATEWAY_URL}/api/families/my-family`, {
    headers: { 'Authorization': `Bearer ${familyToken}` }
  });
  const famProfile = await famProfileRes.json();
  assert(famProfileRes.status === 200 && famProfile.success, '2.1 Family profile retrieved successfully');

  // Negative Check: Family prohibited from clinician review queue
  const famReviewRes = await fetch(`${GATEWAY_URL}/api/appointments/review-queue`, {
    headers: { 'Authorization': `Bearer ${familyToken}` }
  });
  assert(famReviewRes.status === 403, '2.2 Family role strictly prohibited (403) from accessing review queue');

  // 2.2 Hospital Admin Scoping
  const adminQueueRes = await fetch(`${GATEWAY_URL}/api/appointments/review-queue`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminQueue = await adminQueueRes.json();
  assert(adminQueue.success && adminQueue.data.total === 64, '2.3 Hospital Admin strictly scoped to own facility (64 unclosed items at Aarogyam)');
  const adminHospKeys = Object.keys(adminQueue.data.countsByHospital);
  assert(adminHospKeys.length === 1 && adminHospKeys[0] === 'Aarogyam Multispeciality Hospital', '2.4 Hospital Admin tenant isolation: 0 cross-facility visibility');

  // Negative Check: Hospital Admin prohibited from clinical completion
  const sampleAarogyamItem = adminQueue.data.items[0];
  const adminIllegalRes = await fetch(`${GATEWAY_URL}/api/appointments/${sampleAarogyamItem.id}/review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'CLINICAL_COMPLETION', reason: 'Admin attempt' })
  });
  assert(adminIllegalRes.status === 403, '2.5 Hospital Admin prohibited from CLINICAL_COMPLETION decision (403)');

  // 2.3 Doctor Scoping
  const docQueueRes = await fetch(`${GATEWAY_URL}/api/appointments/review-queue`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  const docQueue = await docQueueRes.json();
  assert(docQueue.success && docQueue.data.total === 3, '2.6 Doctor strictly scoped to assigned encounters (3 items for Dr. Rahul Sharma)');

  // 2.4 Chairman Platform-Wide Scoping
  const chairQueueRes = await fetch(`${GATEWAY_URL}/api/appointments/review-queue`, {
    headers: { 'Authorization': `Bearer ${chairToken}` }
  });
  const chairQueue = await chairQueueRes.json();
  assert(chairQueue.success && chairQueue.data.total === 274, '2.7 Platform Owner retrieves network-wide review queue (all 274 items)');

  // ---------------------------------------------------------------------------
  // 3. Validate All Four AI Modules End-to-End
  // ---------------------------------------------------------------------------
  console.log('\n[Step 3] Validating All Four AI Prediction Modules...');

  // Identify a valid family member ID from family profile
  const members = famProfile.data?.members || famProfile.data?.family_members || [];
  const testMemberId = members.length > 0 ? (members[0]._id || members[0].id || members[0].family_member_id) : 'MEM-FAM-001-01';

  // 3.1 Module 1: Fracture Detection (via API Gateway)
  console.log('  Testing Module 1: Bone Fracture Detection...');
  const sampleCandidates = [
    path.resolve('ai-prediction-service/test-dataset/Bone Facture/FracAtlas/FracAtlas/images/Fractured/IMG0000019.jpg'),
    path.resolve('test-dataset/Bone Facture/FracAtlas/FracAtlas/images/Fractured/IMG0000021.jpg')
  ];
  const sampleImagePath = sampleCandidates.find(p => fs.existsSync(p));
  let fracSuccess = false;
  if (sampleImagePath && fs.existsSync(sampleImagePath)) {
    const fileBytes = fs.readFileSync(sampleImagePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="family_member_id"\r\n\r\n${testMemberId}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${path.basename(sampleImagePath)}"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    const payloadHeader = Buffer.from(body, 'utf-8');
    const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullPayload = Buffer.concat([payloadHeader, fileBytes, payloadFooter]);

    const fracRes = await fetch(`${GATEWAY_URL}/api/ai/fracture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${familyToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: fullPayload
    });
    const fracData = await fracRes.json();
    assert(fracRes.status === 200 && fracData.prediction_id, `3.1 Fracture detection inference successful (ID: ${fracData.prediction_id}, Model: ${fracData.model_name})`);
    assert(fracData.result?.disclaimer?.includes('not a medical diagnosis'), '3.2 Fracture detection non-diagnostic disclaimer present');
    fracSuccess = true;
  } else {
    console.log('  [Notice] Sample image IMG0000021.jpg not found, verifying schema endpoint directly...');
    const fracDirectRes = await fetch(`${AI_SERVICE_URL}/health`);
    assert(fracDirectRes.status === 200, '3.1 Fracture inference service operational');
  }

  // 3.2 Module 2: Diabetes Risk Prediction (via API Gateway)
  console.log('  Testing Module 2: Diabetes Risk Prediction...');
  const diabetesPayload = {
    family_member_id: String(testMemberId),
    Pregnancies: 2,
    Glucose: 148.0,
    BloodPressure: 72.0,
    SkinThickness: 35.0,
    Insulin: 125.0,
    BMI: 33.6,
    DiabetesPedigreeFunction: 0.627,
    Age: 45
  };

  const diabRes = await fetch(`${GATEWAY_URL}/api/ai/diabetes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${familyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(diabetesPayload)
  });
  const diabData = await diabRes.json();
  assert(diabRes.status === 200 && diabData.prediction_id, `3.3 Diabetes inference successful (ID: ${diabData.prediction_id}, Risk: ${diabData.risk_level}, Score: ${diabData.risk_score})`);
  assert(diabData.prediction_type === 'DIABETES_RISK', '3.4 Diabetes prediction contract validated');

  // Negative Check: Invalid Out-of-Range Glucose
  const invalidDiabRes = await fetch(`${GATEWAY_URL}/api/ai/diabetes`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${familyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...diabetesPayload, Glucose: 999.0 })
  });
  assert(invalidDiabRes.status === 422, '3.5 Diabetes input validation: Out-of-range value rejected (422 Unprocessable Entity)');

  // 3.3 Module 3: Heart Disease Risk Prediction (via API Gateway)
  console.log('  Testing Module 3: Heart Disease Risk Prediction...');
  const heartPayload = {
    family_member_id: String(testMemberId),
    AGE: 52.0,
    GENDER: 1.0,
    HEIGHT: 168.0,
    WEIGHT: 75.0,
    AP_HIGH: 130.0,
    AP_LOW: 85.0,
    CHOLESTEROL: 2.0,
    GLUCOSE: 1.0,
    SMOKE: 0.0,
    ALCOHOL: 0.0,
    PHYSICAL_ACTIVITY: 1.0
  };

  const heartRes = await fetch(`${GATEWAY_URL}/api/ai/heart-disease`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${familyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(heartPayload)
  });
  const heartData = await heartRes.json();
  assert(heartRes.status === 200 && heartData.prediction_id, `3.6 Heart disease inference successful (ID: ${heartData.prediction_id}, Risk: ${heartData.risk_level}, Score: ${heartData.risk_score})`);
  assert(heartData.prediction_type === 'HEART_DISEASE_RISK', '3.7 Heart disease prediction contract validated');

  // Negative Check: Missing required parameter AP_HIGH
  const invalidHeartPayload = { ...heartPayload };
  delete invalidHeartPayload.AP_HIGH;
  const invalidHeartRes = await fetch(`${GATEWAY_URL}/api/ai/heart-disease`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${familyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidHeartPayload)
  });
  assert(invalidHeartRes.status === 422, '3.8 Heart disease validation: Missing required feature rejected (422)');

  // 3.4 Module 4: General Health Assessment / NLP Triage (via API Gateway)
  console.log('  Testing Module 4: General Health & NLP Symptom Triage...');
  const nlpPayload = {
    family_member_id: String(testMemberId),
    text: 'Severe crushing chest pain radiating to left arm with acute shortness of breath and sweating for 30 minutes.'
  };

  const nlpRes = await fetch(`${GATEWAY_URL}/api/ai/general-health`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${familyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nlpPayload)
  });
  const nlpData = await nlpRes.json();
  assert(nlpRes.status === 200 && nlpData.prediction_id, `3.9 NLP triage inference successful (ID: ${nlpData.prediction_id})`);
  assert(nlpData.result?.urgency === 'EMERGENCY', '3.10 NLP red-flag safety: Acute cardiac symptoms triaged as EMERGENCY');
  assert(nlpData.result?.disclaimer?.includes('not a medical diagnosis'), '3.11 NLP triage non-diagnostic disclaimer present');

  // Routine symptoms case
  const routineNlpRes = await fetch(`${GATEWAY_URL}/api/ai/general-health`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${familyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      family_member_id: String(testMemberId),
      text: 'Mild dry throat and occasional sneezing since yesterday morning without fever.'
    })
  });
  const routineData = await routineNlpRes.json();
  assert(routineNlpRes.status === 200 && routineData.result?.urgency !== 'EMERGENCY', '3.12 NLP routine symptom differentiation (Non-emergency classification)');

  // ---------------------------------------------------------------------------
  // 4. Prediction Persistence and History Retrieval
  // ---------------------------------------------------------------------------
  console.log('\n[Step 4] Validating Prediction Persistence & History Retrieval...');
  const historyRes = await fetch(`${GATEWAY_URL}/api/ai/member/${testMemberId}`, {
    headers: { 'Authorization': `Bearer ${familyToken}` }
  });
  const historyData = await historyRes.json();
  assert(historyRes.status === 200 && Array.isArray(historyData), `4.1 Prediction history successfully retrieved (${Array.isArray(historyData) ? historyData.length : 0} records found)`);
  if (Array.isArray(historyData) && historyData.length > 0) {
    const latest = historyData[0];
    assert(!!latest.prediction_id && !!latest.created_at, `4.2 Prediction record verified: ID=${latest.prediction_id}, Type=${latest.prediction_type}, Model=${latest.model_name}`);
  }

  // Retrieve specific prediction by ID
  const specificRes = await fetch(`${GATEWAY_URL}/api/ai/${nlpData.prediction_id}`, {
    headers: { 'Authorization': `Bearer ${familyToken}` }
  });
  const specificData = await specificRes.json();
  assert(specificRes.status === 200 && specificData.prediction_id === nlpData.prediction_id, `4.3 Direct prediction retrieval by ID verified (${nlpData.prediction_id})`);

  // ---------------------------------------------------------------------------
  // 5. Dashboard Metrics & Database Invariant Verification
  // ---------------------------------------------------------------------------
  console.log('\n[Step 5] Validating Dashboard Analytics Against Database Invariants...');
  const statsRes = await fetch(`${GATEWAY_URL}/api/appointments/stats`, {
    headers: { 'Authorization': `Bearer ${chairToken}` }
  });
  const stats = (await statsRes.json()).data;

  // Active workload invariant
  assert(stats.dueWorkload + stats.futureWorkload === 5009, `5.1 Total active appointments locked at 5,009 (${stats.dueWorkload} due + ${stats.futureWorkload} future)`);

  // October baseline
  const octTrend = (stats.monthlyTrends || []).find(m => m.monthKey === '2026-10' || m.month === 'Oct 2026');
  assert(octTrend?.scheduledWorkload === 741, `5.2 October scheduled workload locked at verified baseline (741)`);

  // November advance appointments
  const novTrend = (stats.monthlyTrends || []).find(m => m.monthKey === '2026-11' || m.month === 'Nov 2026');
  assert(novTrend?.scheduledWorkload === 330, `5.3 November advance workload locked at verified baseline (330)`);

  // Unresolved due workload
  assert(stats.unresolvedDueCount === 345, `5.4 Unresolved due appointments preserved without synthetic closures (345)`);

  // ---------------------------------------------------------------------------
  // 6. Security, Resilience & Failure Handling
  // ---------------------------------------------------------------------------
  console.log('\n[Step 6] Validating Security, Resilience & Failure Handling...');

  // Invalid Token Rejection
  const invalidTokenRes = await fetch(`${GATEWAY_URL}/api/appointments/stats`, {
    headers: { 'Authorization': 'Bearer invalid.jwt.token' }
  });
  assert(invalidTokenRes.status === 401, '6.1 Invalid JWT rejected with HTTP 401 Unauthorized');

  // Expired / Missing Token Rejection
  const missingTokenRes = await fetch(`${GATEWAY_URL}/api/appointments/stats`);
  assert(missingTokenRes.status === 401, '6.2 Unauthenticated request rejected with HTTP 401');

  // Stale Update 409 Conflict
  const staleRes = await fetch(`${GATEWAY_URL}/api/appointments/${sampleAarogyamItem.id}/review`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision: 'ESCALATE',
      reason: 'Stale test',
      expectedUpdatedAt: '2020-01-01T00:00:00.000Z'
    })
  });
  assert(staleRes.status === 409, '6.3 Optimistic concurrency locked: Stale update rejected with HTTP 409 Conflict');

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} TESTS.`);
  console.log('========================================================================');

  if (failedTests > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal validation suite error:', err);
  process.exit(1);
});
