import '../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
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

// In-memory mock AI Prediction Server
let mockAiServer = null;
const mockPredictionsStore = new Map();

function startMockAiService(port = 5007) {
  return new Promise((resolve) => {
    mockAiServer = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const method = req.method;

      // GET /health
      if (method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'HEALTHY',
            service: 'ai-prediction-service',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            models_loaded: {
              fracture: true,
              diabetes: true,
              heart_disease: true,
              general_health: true,
            },
          })
        );
        return;
      }

      // POST /api/ai/general-health
      if (method === 'POST' && url.pathname === '/api/ai/general-health') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const predId = `PRED-GH-${Date.now()}`;
            const pred = {
              prediction_id: predId,
              module: 'GENERAL_HEALTH',
              member_id: data.member_id || 'MEM-001',
              risk_level: 'MODERATE',
              recommended_department: 'General Medicine',
              confidence_score: 0.89,
              urgency_level: 'ROUTINE',
              key_findings: ['Mild chest discomfort reported', 'Elevated pulse rate'],
              recommended_actions: ['Schedule consultation with General Medicine or Cardiology', 'Monitor blood pressure daily'],
              created_at: new Date().toISOString(),
            };
            mockPredictionsStore.set(predId, pred);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(pred));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // POST /api/ai/heart-disease
      if (method === 'POST' && url.pathname === '/api/ai/heart-disease') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const predId = `PRED-HD-${Date.now()}`;
            const pred = {
              prediction_id: predId,
              module: 'HEART_DISEASE',
              member_id: data.member_id || 'MEM-001',
              risk_level: 'HIGH',
              recommended_department: 'Cardiology',
              confidence_score: 0.94,
              urgency_level: 'HIGH',
              key_findings: ['ST-segment depression', 'Elevated resting BP (140 mmHg)'],
              recommended_actions: ['Immediate Cardiology consultation recommended', 'Avoid strenuous physical activity'],
              created_at: new Date().toISOString(),
            };
            mockPredictionsStore.set(predId, pred);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(pred));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // POST /api/ai/diabetes
      if (method === 'POST' && url.pathname === '/api/ai/diabetes') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const predId = `PRED-DB-${Date.now()}`;
            const pred = {
              prediction_id: predId,
              module: 'DIABETES',
              member_id: data.member_id || 'MEM-001',
              risk_level: 'MODERATE',
              recommended_department: 'Diabetology & Endocrinology',
              confidence_score: 0.86,
              urgency_level: 'ROUTINE',
              key_findings: ['Elevated fasting glucose (148 mg/dL)', 'BMI above normal range (29.2)'],
              recommended_actions: ['Dietary management consult', 'HbA1c test recommended'],
              created_at: new Date().toISOString(),
            };
            mockPredictionsStore.set(predId, pred);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(pred));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // POST /api/ai/fracture
      if (method === 'POST' && url.pathname === '/api/ai/fracture') {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString();
          const memMatch = rawBody.match(/name="member_id"\r?\n\r?\n([^\r\n]+)/);
          const memberId = memMatch ? memMatch[1].trim() : 'MEM-001';
          const predId = `PRED-FR-${Date.now()}`;
          const pred = {
            prediction_id: predId,
            module: 'FRACTURE',
            member_id: memberId,
            risk_level: 'HIGH',
            recommended_department: 'Orthopedics',
            confidence_score: 0.96,
            urgency_level: 'URGENT',
            key_findings: ['Distal radius hairline fracture indicated', 'Localized soft tissue swelling'],
            recommended_actions: ['Orthopedic immobilization and cast evaluation', 'Follow-up X-Ray in 2 weeks'],
            created_at: new Date().toISOString(),
          };
          mockPredictionsStore.set(predId, pred);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(pred));
        });
        return;
      }

      // GET /api/ai/member/:memberId
      const memberMatch = url.pathname.match(/^\/api\/ai\/member\/([^/]+)$/);
      if (method === 'GET' && memberMatch) {
        const memberId = memberMatch[1];
        const preds = Array.from(mockPredictionsStore.values()).filter((p) => p.member_id === memberId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ member_id: memberId, count: preds.length, predictions: preds }));
        return;
      }

      // GET /api/ai/:predictionId
      const predMatch = url.pathname.match(/^\/api\/ai\/([^/]+)$/);
      if (method === 'GET' && predMatch && !url.pathname.includes('/member/')) {
        const predId = predMatch[1];
        const pred = mockPredictionsStore.get(predId);
        if (pred) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(pred));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prediction not found' }));
        }
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    mockAiServer.listen(port, () => {
      resolve(mockAiServer);
    });
  });
}

function stopMockAiService() {
  return new Promise((resolve) => {
    if (mockAiServer) {
      mockAiServer.close(() => {
        mockAiServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

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

async function runPhase9Verification() {
  console.log('================================================================');
  console.log('PHASE 9: AI PRODUCTION WORKFLOW INTEGRATION VERIFICATION');
  console.log('================================================================');

  let authProc, familyProc, hospitalProc, doctorProc, apptProc, recordProc, knowledgeProc, gatewayProc;
  let authConn, familyConn, hospitalConn, doctorConn, apptConn, recordConn, knowledgeConn;

  const timestamp = Date.now();
  const defaultPassword = 'LiveFinalPass!2026';

  const familyEmail = `family.ai.${timestamp}@medimind.org`;
  const doctorCardioEmail = `dr.cardio.${timestamp}@medimind.org`;
  const doctorOrthoEmail = `dr.ortho.${timestamp}@medimind.org`;
  const deptHeadEmail = `head.cardio.${timestamp}@medimind.org`;
  const hospitalAdminEmail = `admin.metro.${timestamp}@medimind.org`;
  const chairmanEmail = `chairman.ai.${timestamp}@medimind.org`;

  try {
    // 1. Central Dataset Validation
    console.log('\n[Phase 9] 1. Validating Central Dataset Consistency...');
    const datasetResult = validateCentralDataset();
    if (!datasetResult.valid || datasetResult.summary.errors.length > 0) {
      throw new Error(`Central dataset validation failed: ${JSON.stringify(datasetResult.summary.errors)}`);
    }
    console.log('   ✓ Central dataset is fully valid and consistent');

    // 2. Start Mock AI Service on :5007
    console.log('\n[Phase 9] 2. Starting AI Prediction Service on :5007...');
    await startMockAiService(5007);
    console.log('   ✓ AI Prediction Service listening on port 5007');

    // 3. Start All 8 Backend Microservices
    console.log('\n[Phase 9] 3. Starting All 8 Backend Microservices...');
    authProc = await startProcess('Auth Service', AUTH_DIR, 5001);
    familyProc = await startProcess('Family Service', FAMILY_DIR, 5002);
    hospitalProc = await startProcess('Hospital Service', HOSPITAL_DIR, 5003);
    doctorProc = await startProcess('Doctor Service', DOCTOR_DIR, 5004);
    apptProc = await startProcess('Appointment Service', APPOINTMENT_DIR, 5005);
    recordProc = await startProcess('Medical Record Service', RECORD_DIR, 5006);
    knowledgeProc = await startProcess('Knowledge Service', KNOWLEDGE_DIR, 5008);
    gatewayProc = await startProcess('API Gateway', GATEWAY_DIR, 5000);

    await waitForHttp('http://localhost:5000/health');
    console.log('   ✓ All microservices and API Gateway are UP and healthy');

    // 4. Connect to MongoDB Databases
    console.log('\n[Phase 9] 4. Connecting to MongoDB for Data Seeding...');
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

    // Entity IDs
    const hospitalId = new mongoose.Types.ObjectId();
    const cardioDeptId = new mongoose.Types.ObjectId();
    const orthoDeptId = new mongoose.Types.ObjectId();

    const doctorCardioId = new mongoose.Types.ObjectId();
    const doctorCardioUserId = new mongoose.Types.ObjectId();

    const doctorOrthoId = new mongoose.Types.ObjectId();
    const doctorOrthoUserId = new mongoose.Types.ObjectId();

    const headUserId = new mongoose.Types.ObjectId();
    const adminUserId = new mongoose.Types.ObjectId();
    const chairmanUserId = new mongoose.Types.ObjectId();

    const familyId = new mongoose.Types.ObjectId();
    const familyUserId = new mongoose.Types.ObjectId();
    const primaryMemberId = new mongoose.Types.ObjectId();

    // 1. Seed Hospital & Departments
    await hospitalConn.collection('hospitals').insertOne({
      _id: hospitalId,
      name: `Metro AI Research Hospital ${timestamp}`,
      license_number: `HOSP-AI-${timestamp}`,
      address: { street: '100 HiTech City', city: 'Hyderabad', state: 'Telangana', postal_code: '500081', country: 'India' },
      phone: '+91 9988776611',
      email: `metro.ai.${timestamp}@medimind.org`,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await hospitalConn.collection('departments').insertMany([
      {
        _id: cardioDeptId,
        hospital_id: hospitalId,
        name: 'Cardiology',
        description: 'Cardiovascular Care & Diagnostics',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: orthoDeptId,
        hospital_id: hospitalId,
        name: 'Orthopedics',
        description: 'Musculoskeletal and Fracture Care',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 2. Seed Doctors
    await doctorConn.collection('doctors').insertMany([
      {
        _id: doctorCardioId,
        user_id: doctorCardioUserId,
        full_name: 'Dr. Anand Verma',
        email: doctorCardioEmail,
        phone: '+91 9123456711',
        license_number: `DOC-CARD-${timestamp}`,
        specialization: 'Cardiology',
        department_id: cardioDeptId,
        hospital_id: hospitalId,
        experience_years: 15,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctorOrthoId,
        user_id: doctorOrthoUserId,
        full_name: 'Dr. Ramesh Ortho',
        email: doctorOrthoEmail,
        phone: '+91 9123456712',
        license_number: `DOC-ORTHO-${timestamp}`,
        specialization: 'Orthopedics',
        department_id: orthoDeptId,
        hospital_id: hospitalId,
        experience_years: 12,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. Seed Family & Member
    await familyConn.collection('families').insertOne({
      _id: familyId,
      family_name: 'Sharma AI Family',
      creator_user_id: familyUserId,
      email: familyEmail,
      mobile: '+91 9876543299',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await familyConn.collection('familymembers').insertOne({
      _id: primaryMemberId,
      family_id: familyId,
      full_name: 'Aditya Sharma',
      date_of_birth: new Date('1985-05-15'),
      gender: 'MALE',
      blood_group: 'O+',
      phone: '+91 9876543299',
      email: familyEmail,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 4. Seed Auth Users
    const hashedPassword = await hashPassword(defaultPassword);
    await authConn.collection('users').insertMany([
      {
        _id: familyUserId,
        email: familyEmail,
        password_hash: hashedPassword,
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: familyId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctorCardioUserId,
        email: doctorCardioEmail,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctorCardioId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctorOrthoUserId,
        email: doctorOrthoEmail,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctorOrthoId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headUserId,
        email: deptHeadEmail,
        password_hash: hashedPassword,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: cardioDeptId,
        doctor_id: doctorCardioId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: adminUserId,
        email: hospitalAdminEmail,
        password_hash: hashedPassword,
        role: 'HOSPITAL_ADMIN',
        account_type: 'HOSPITAL_ADMIN_ACCOUNT',
        reference_id: hospitalId,
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

    // Acquire Authenticated JWT Tokens via Gateway
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

    const familyToken = await loginUser(familyEmail);
    const doctorCardioToken = await loginUser(doctorCardioEmail);
    const doctorOrthoToken = await loginUser(doctorOrthoEmail);
    const headToken = await loginUser(deptHeadEmail);
    const adminToken = await loginUser(hospitalAdminEmail);
    const chairmanToken = await loginUser(chairmanEmail);

    console.log('   ✓ Seeded and logged in all 5 platform roles');

    // ==========================================
    // STEP 1: AI SERVICE HEALTH VIA GATEWAY
    // ==========================================
    console.log('\n[Phase 9] STEP 1: AI Service Health Check via Gateway (/api/ai/health)...');
    const healthRes = await fetch('http://localhost:5000/api/ai/health');
    if (healthRes.status !== 200) {
      throw new Error(`Expected 200 from /api/ai/health, got ${healthRes.status}`);
    }
    const healthJson = await healthRes.json();
    const healthData = healthJson.data || healthJson;
    if (healthData.service !== 'ai-prediction-service' || !healthData.models_loaded) {
      throw new Error(`Invalid health response payload: ${JSON.stringify(healthJson)}`);
    }
    console.log('   ✓ Health check returned 200 with loaded AI models');

    // ==========================================
    // STEP 2: GENERAL HEALTH NLP TRIAGE
    // ==========================================
    console.log('\n[Phase 9] STEP 2: General Health NLP Triage Prediction...');
    const ghRes = await fetch('http://localhost:5000/api/ai/general-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        member_id: primaryMemberId.toString(),
        symptoms: ['Mild chest heaviness', 'Fatigue after stairs'],
        vitals: { resting_bp: '135/85', heart_rate: 88 },
        age: 41,
        gender: 'male',
      }),
    });
    if (ghRes.status !== 200) {
      throw new Error(`General Health prediction failed with status ${ghRes.status}`);
    }
    const ghData = await ghRes.json();
    if (!ghData.prediction_id || ghData.module !== 'GENERAL_HEALTH') {
      throw new Error(`Invalid General Health prediction output: ${JSON.stringify(ghData)}`);
    }
    const ghPredId = ghData.prediction_id;
    console.log(`   ✓ General Health prediction generated: ${ghPredId} (Dept: ${ghData.recommended_department})`);

    // ==========================================
    // STEP 3: CARDIOVASCULAR RISK ASSESSMENT
    // ==========================================
    console.log('\n[Phase 9] STEP 3: Cardiovascular Risk Assessment...');
    const hdRes = await fetch('http://localhost:5000/api/ai/heart-disease', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        member_id: primaryMemberId.toString(),
        age: 41,
        sex: 1,
        chest_pain_type: 2,
        resting_bp: 140,
        cholesterol: 240,
        fasting_bs: 0,
        resting_ecg: 1,
        max_hr: 155,
        exercise_angina: 0,
        oldpeak: 1.5,
        st_slope: 2,
      }),
    });
    if (hdRes.status !== 200) {
      throw new Error(`Cardio prediction failed with status ${hdRes.status}`);
    }
    const hdData = await hdRes.json();
    if (!hdData.prediction_id || hdData.module !== 'HEART_DISEASE') {
      throw new Error(`Invalid Cardio prediction output: ${JSON.stringify(hdData)}`);
    }
    const hdPredId = hdData.prediction_id;
    console.log(`   ✓ Cardiovascular prediction generated: ${hdPredId} (Risk: ${hdData.risk_level})`);

    // ==========================================
    // STEP 4: DIABETES RISK ASSESSMENT
    // ==========================================
    console.log('\n[Phase 9] STEP 4: Diabetes Risk Assessment...');
    const dbRes = await fetch('http://localhost:5000/api/ai/diabetes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        member_id: primaryMemberId.toString(),
        pregnancies: 0,
        glucose: 148,
        blood_pressure: 82,
        skin_thickness: 25,
        insulin: 110,
        bmi: 29.2,
        diabetes_pedigree_function: 0.45,
        age: 41,
      }),
    });
    if (dbRes.status !== 200) {
      throw new Error(`Diabetes prediction failed with status ${dbRes.status}`);
    }
    const dbData = await dbRes.json();
    if (!dbData.prediction_id || dbData.module !== 'DIABETES') {
      throw new Error(`Invalid Diabetes prediction output: ${JSON.stringify(dbData)}`);
    }
    const dbPredId = dbData.prediction_id;
    console.log(`   ✓ Diabetes prediction generated: ${dbPredId} (Risk: ${dbData.risk_level})`);

    // ==========================================
    // STEP 5: FRACTURE RADIOGRAPH DETECTION
    // ==========================================
    console.log('\n[Phase 9] STEP 5: Fracture Radiograph Multipart Analysis...');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const formBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="member_id"',
      '',
      primaryMemberId.toString(),
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="xray.png"',
      'Content-Type: image/png',
      '',
      'FAKE_PNG_BINARY_DATA',
      `--${boundary}--`,
    ].join('\r\n');

    const frRes = await fetch('http://localhost:5000/api/ai/fracture', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${familyToken}`,
      },
      body: formBody,
    });
    if (frRes.status !== 200) {
      throw new Error(`Fracture prediction failed with status ${frRes.status}`);
    }
    const frData = await frRes.json();
    if (!frData.prediction_id || frData.module !== 'FRACTURE') {
      throw new Error(`Invalid Fracture prediction output: ${JSON.stringify(frData)}`);
    }
    const frPredId = frData.prediction_id;
    console.log(`   ✓ Fracture prediction generated: ${frPredId} (Urgency: ${frData.urgency_level})`);

    // ==========================================
    // STEP 6: PREDICTION RETRIEVAL & HISTORY
    // ==========================================
    console.log('\n[Phase 9] STEP 6: AI Prediction Retrieval & Member History...');
    const historyRes = await fetch(`http://localhost:5000/api/ai/member/${primaryMemberId}`, {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    if (historyRes.status !== 200) {
      throw new Error(`Failed to retrieve prediction history: ${historyRes.status}`);
    }
    const historyData = await historyRes.json();
    if (historyData.predictions.length < 4) {
      throw new Error(`Expected at least 4 predictions in history, got ${historyData.predictions.length}`);
    }
    console.log(`   ✓ Retrieved ${historyData.predictions.length} predictions for member ${primaryMemberId}`);

    const singleRes = await fetch(`http://localhost:5000/api/ai/${hdPredId}`, {
      headers: { Authorization: `Bearer ${familyToken}` },
    });
    if (singleRes.status !== 200) {
      throw new Error(`Failed to retrieve single prediction: ${singleRes.status}`);
    }
    const singleData = await singleRes.json();
    if (singleData.prediction_id !== hdPredId) {
      throw new Error(`Retrieved wrong prediction id: ${singleData.prediction_id}`);
    }
    console.log(`   ✓ Successfully fetched specific prediction ${hdPredId}`);

    // ==========================================
    // STEP 7: APPOINTMENT WORKFLOW INTEGRATION
    // ==========================================
    console.log('\n[Phase 9] STEP 7: Appointment Workflow Integration with AI Prediction Link...');
    // Book appointment with AI Prediction ID linked
    const bookApptRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        familyMemberId: primaryMemberId.toString(),
        doctorId: doctorCardioId.toString(),
        hospitalId: hospitalId.toString(),
        departmentId: cardioDeptId.toString(),
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Follow-up on high cardiovascular risk AI prediction',
        type: 'IN_PERSON',
        ai_prediction_id: hdPredId,
      }),
    });
    if (bookApptRes.status !== 201) {
      const errText = await bookApptRes.text();
      throw new Error(`Booking appointment with AI prediction failed: ${bookApptRes.status} - ${errText}`);
    }
    const apptData = (await bookApptRes.json()).data;
    const apptAiPredId = apptData.ai_prediction_id || apptData.aiPredictionId;
    if (apptAiPredId !== hdPredId) {
      throw new Error(`Appointment ai_prediction_id mismatch: expected ${hdPredId}, got ${apptAiPredId}`);
    }
    console.log(`   ✓ Appointment ${apptData.id || apptData._id} created with ai_prediction_id: ${apptAiPredId}`);

    // Book walk-in appointment without AI Prediction ID
    const walkinApptRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        familyMemberId: primaryMemberId.toString(),
        doctorId: doctorOrthoId.toString(),
        hospitalId: hospitalId.toString(),
        departmentId: orthoDeptId.toString(),
        appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        startTime: '11:00',
        endTime: '11:30',
        reason: 'Standard routine check-up',
        type: 'IN_PERSON',
      }),
    });
    if (walkinApptRes.status !== 201) {
      throw new Error(`Walk-in appointment booking failed: ${walkinApptRes.status}`);
    }
    const walkinData = (await walkinApptRes.json()).data;
    console.log(`   ✓ Walk-in appointment ${walkinData.id || walkinData._id} created without AI prediction`);

    // ==========================================
    // STEP 8: CONSULTATION & MEDICAL RECORD INTEGRATION
    // ==========================================
    console.log('\n[Phase 9] STEP 8: Consultation & Medical Record Integration...');
    // Grant RecordAccess from Family to Doctor Cardio
    await recordConn.collection('recordaccesses').insertOne({
      _id: new mongoose.Types.ObjectId(),
      member_id: primaryMemberId,
      doctor_id: doctorCardioId,
      hospital_id: hospitalId,
      granted_by_user_id: familyUserId,
      access_level: 'FULL',
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Doctor creates Consultation referencing ai_prediction_ids
    const createConsultRes = await fetch('http://localhost:5000/api/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorCardioToken}`,
      },
      body: JSON.stringify({
        familyMemberId: primaryMemberId.toString(),
        appointmentId: (apptData.id || apptData._id).toString(),
        symptoms: 'Chest pain on exertion, Fatigue',
        observations: 'BP 138/86 mmHg, HR 82 bpm',
        clinicalAssessment: 'Coronary Artery Disease - Moderate Grade',
        treatmentPlan: 'Reviewed AI Assessment (PRED-HD). Beta-blockers prescribed.',
        ai_prediction_ids: [hdPredId, ghPredId],
      }),
    });
    if (createConsultRes.status !== 201) {
      const errText = await createConsultRes.text();
      throw new Error(`Creating consultation with AI predictions failed: ${createConsultRes.status} - ${errText}`);
    }
    const consultData = (await createConsultRes.json()).data;
    const consultAiPreds = consultData.ai_prediction_ids || consultData.aiPredictionIds || [];
    if (!consultAiPreds.includes(hdPredId)) {
      throw new Error(`Consultation missing ai_prediction_ids: ${JSON.stringify(consultData)}`);
    }
    console.log(`   ✓ Consultation ${consultData.id || consultData._id} created with linked AI predictions [${consultAiPreds.join(', ')}]`);

    // Doctor Ortho attempting to read clinical records without RecordAccess -> must fail 403
    const unauthRecordsRes = await fetch(`http://localhost:5000/api/records/member/${primaryMemberId}`, {
      headers: { Authorization: `Bearer ${doctorOrthoToken}` },
    });
    if (unauthRecordsRes.status !== 403) {
      throw new Error(`Expected 403 for doctor without RecordAccess, got ${unauthRecordsRes.status}`);
    }
    console.log('   ✓ Invariant verified: Doctor without RecordAccess blocked from clinical records (403 Forbidden)');

    // ==========================================
    // STEP 9: SECURITY & ROLE BOUNDARY ENFORCEMENT
    // ==========================================
    console.log('\n[Phase 9] STEP 9: Security Negative Matrix & Role Boundaries...');

    // 1. Missing Token
    const unauthRes = await fetch('http://localhost:5000/api/ai/general-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: primaryMemberId.toString() }),
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('   ✓ Missing token rejected with 401');

    // 2. Tampered Token
    const tamperedRes = await fetch('http://localhost:5000/api/ai/general-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.tampered.token',
      },
      body: JSON.stringify({ member_id: primaryMemberId.toString() }),
    });
    if (tamperedRes.status !== 401) {
      throw new Error(`Expected 401 for tampered token, got ${tamperedRes.status}`);
    }
    console.log('   ✓ Tampered token rejected with 401');

    // 3. Hospital Admin Blocked from Patient AI Predictions (403)
    const adminAiRes = await fetch('http://localhost:5000/api/ai/general-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ member_id: primaryMemberId.toString() }),
    });
    if (adminAiRes.status !== 403) {
      throw new Error(`Expected 403 for Hospital Admin on AI inference, got ${adminAiRes.status}`);
    }
    console.log('   ✓ Hospital Admin blocked from clinical inference (403 Forbidden)');

    // 4. Department Head Blocked from Direct Patient AI Predictions (403)
    const headAiRes = await fetch(`http://localhost:5000/api/ai/member/${primaryMemberId}`, {
      headers: { Authorization: `Bearer ${headToken}` },
    });
    if (headAiRes.status !== 403) {
      throw new Error(`Expected 403 for Dept Head on patient AI history, got ${headAiRes.status}`);
    }
    console.log('   ✓ Department Head blocked from patient AI history (403 Forbidden)');

    // 5. Chairman Blocked from Direct Patient AI Predictions (403)
    const chairAiRes = await fetch(`http://localhost:5000/api/ai/${hdPredId}`, {
      headers: { Authorization: `Bearer ${chairmanToken}` },
    });
    if (chairAiRes.status !== 403) {
      throw new Error(`Expected 403 for Chairman on patient AI predictions, got ${chairAiRes.status}`);
    }
    console.log('   ✓ Chairman blocked from private clinical predictions (403 Forbidden)');

    // 6. Direct Microservice Access without Internal Secret (401)
    const directRes = await fetch('http://localhost:5005/api/appointments', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (directRes.status !== 401) {
      throw new Error(`Direct microservice call without secret returned ${directRes.status}, expected 401`);
    }
    console.log('   ✓ Direct microservice invocation without internal key rejected (401 Unauthorized)');

    // ==========================================
    // STEP 10: AI OFFLINE & RESILIENCY
    // ==========================================
    console.log('\n[Phase 9] STEP 10: AI Offline Downstream Fallback (503)...');
    await stopMockAiService();
    console.log('   (Simulating AI Prediction Service offline...)');

    const offlineRes = await fetch('http://localhost:5000/api/ai/general-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${familyToken}`,
      },
      body: JSON.stringify({ member_id: primaryMemberId.toString() }),
    });
    if (offlineRes.status !== 503) {
      throw new Error(`Expected 503 when AI service is offline, got ${offlineRes.status}`);
    }
    const offlineBody = await offlineRes.json();
    if (!offlineBody.message || !offlineBody.message.includes('unavailable')) {
      throw new Error(`Unexpected offline payload: ${JSON.stringify(offlineBody)}`);
    }
    console.log('   ✓ API Gateway returned 503 Service Unavailable with friendly fallback');

    // Restart AI Service & confirm recovery
    await startMockAiService(5007);
    const recoverRes = await fetch('http://localhost:5000/api/ai/health');
    if (recoverRes.status !== 200) {
      throw new Error(`Recovery check failed with status ${recoverRes.status}`);
    }
    console.log('   ✓ AI Prediction Service recovered cleanly on port 5007');

    console.log('\n================================================================');
    console.log('✅ PHASE 9 VERIFICATION PASSED: AI PRODUCTION WORKFLOW INTEGRATED');
    console.log('================================================================\n');
  } finally {
    await stopMockAiService();
    if (authConn) await authConn.close();
    if (familyConn) await familyConn.close();
    if (hospitalConn) await hospitalConn.close();
    if (doctorConn) await doctorConn.close();
    if (apptConn) await apptConn.close();
    if (recordConn) await recordConn.close();
    if (knowledgeConn) await knowledgeConn.close();

    const procs = [authProc, familyProc, hospitalProc, doctorProc, apptProc, recordProc, knowledgeProc, gatewayProc];
    for (const p of procs) {
      if (p) p.kill();
    }
  }
}

runPhase9Verification().catch((err) => {
  console.error('\n❌ PHASE 9 VERIFICATION FAILED:');
  console.error(err);
  process.exit(1);
});
