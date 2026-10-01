import '../load-env.js';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { hashPassword } from '../auth-service/src/utils/password.js';

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
            const predId = `PRED-GH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
            const predId = `PRED-HD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
            const predId = `PRED-DB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
          const predId = `PRED-FR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

async function runEndpointAuditVerification() {
  console.log('================================================================');
  console.log('MEDIMIND FINAL API ENDPOINT & CONTRACT AUDIT VERIFICATION');
  console.log('================================================================');

  let authProc, familyProc, hospitalProc, doctorProc, apptProc, recordProc, knowledgeProc, gatewayProc;
  let authConn, familyConn, hospitalConn, doctorConn, apptConn, recordConn, knowledgeConn;

  const timestamp = Date.now();
  const defaultPassword = 'PassAudit2026!';

  // User credentials across all 5 roles
  const family1Email = `family.audit1.${timestamp}@medimind.org`;
  const family2Email = `family.audit2.${timestamp}@medimind.org`;
  const doctor1Email = `dr.cardio.${timestamp}@medimind.org`;
  const doctor2Email = `dr.pedia.${timestamp}@medimind.org`;
  const headAEmail = `head.cardio.${timestamp}@medimind.org`;
  const headBEmail = `head.pedia.${timestamp}@medimind.org`;
  const adminAEmail = `admin.metro.${timestamp}@medimind.org`;
  const adminBEmail = `admin.city.${timestamp}@medimind.org`;
  const chairmanEmail = `chairman.audit.${timestamp}@medimind.org`;

  let tokens = {};
  let ids = {};

  try {
    console.log('\n[1/6] Starting mock AI service and background microservices...');
    await startMockAiService(5007);
    console.log('  * Mock AI Prediction Service listening on port 5007');

    authProc = await startProcess('auth-service', AUTH_DIR, 5001);
    familyProc = await startProcess('family-service', FAMILY_DIR, 5002);
    hospitalProc = await startProcess('hospital-service', HOSPITAL_DIR, 5003);
    doctorProc = await startProcess('doctor-service', DOCTOR_DIR, 5004);
    apptProc = await startProcess('appointment-service', APPOINTMENT_DIR, 5005);
    recordProc = await startProcess('medical-record-service', RECORD_DIR, 5006);
    knowledgeProc = await startProcess('knowledge-service', KNOWLEDGE_DIR, 5008);
    gatewayProc = await startProcess('api-gateway', GATEWAY_DIR, 5000);

    console.log('  * Waiting for services to respond...');
    await waitForHttp('http://localhost:5001/health');
    await waitForHttp('http://localhost:5002/health');
    await waitForHttp('http://localhost:5003/health');
    await waitForHttp('http://localhost:5004/health');
    await waitForHttp('http://localhost:5005/health');
    await waitForHttp('http://localhost:5006/health');
    await waitForHttp('http://localhost:5008/health');
    await waitForHttp('http://localhost:5000/health');
    console.log('  * All 8 microservices and Gateway are UP and healthy!');

    console.log('\n[2/6] Connecting to logical databases and seeding audit datasets...');
    const mongoBase = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const authDbName = process.env.AUTH_DB_NAME || 'medimind_auth';
    const familyDbName = process.env.FAMILY_DB_NAME || 'medimind_family';
    const hospitalDbName = process.env.HOSPITAL_DB_NAME || 'medimind_hospital';
    const doctorDbName = process.env.DOCTOR_DB_NAME || 'medimind_doctor';
    const apptDbName = process.env.APPOINTMENT_DB_NAME || 'medimind_appointment';
    const recordDbName = process.env.RECORD_DB_NAME || process.env.MEDICAL_RECORD_DB_NAME || 'medimind_records';
    const knowledgeDbName = process.env.KNOWLEDGE_DB_NAME || 'medimind_knowledge';

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

    const hospAId = new mongoose.Types.ObjectId();
    const hospBId = new mongoose.Types.ObjectId();
    const deptAId = new mongoose.Types.ObjectId();
    const deptBId = new mongoose.Types.ObjectId();

    ids.hospitalAId = hospAId.toString();
    ids.hospitalBId = hospBId.toString();
    ids.deptCardioId = deptAId.toString();
    ids.deptPediaId = deptBId.toString();

    // 1. Seed Hospitals and Departments
    await hospitalConn.collection('hospitals').insertMany([
      {
        _id: hospAId,
        name: `Apollo Metro ${timestamp}`,
        license_number: `HOSP-METRO-${timestamp}`,
        address: { street: '100 Metro Ave', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
        phone: '+91 9988776601',
        email: `apollo.metro.${timestamp}@medimind.org`,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: hospBId,
        name: `City Children Clinic ${timestamp}`,
        license_number: `HOSP-CITY-${timestamp}`,
        address: { street: '200 City Rd', city: 'Hyderabad', state: 'Telangana', pincode: '500001', country: 'India' },
        phone: '+91 9988776602',
        email: `city.clinic.${timestamp}@medimind.org`,
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
        description: 'Cardiovascular Care',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: deptBId,
        hospital_id: hospBId,
        name: 'Pediatrics',
        description: 'Child Health',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 2. Doctors & Department Heads
    const doctor1Id = new mongoose.Types.ObjectId();
    const doctor1UserId = new mongoose.Types.ObjectId();
    const doctor2Id = new mongoose.Types.ObjectId();
    const doctor2UserId = new mongoose.Types.ObjectId();
    const headADoctorId = new mongoose.Types.ObjectId();
    const headAUserId = new mongoose.Types.ObjectId();
    const headBDoctorId = new mongoose.Types.ObjectId();
    const headBUserId = new mongoose.Types.ObjectId();

    ids.doctor1Id = doctor1Id.toString();
    ids.doctor2Id = doctor2Id.toString();

    await doctorConn.collection('doctors').insertMany([
      {
        _id: doctor1Id,
        user_id: doctor1UserId,
        full_name: 'Dr. Arjun Roy',
        email: doctor1Email,
        mobile: '+91 9123456701',
        license_number: `DOC-CARD-${timestamp}`,
        specialization: 'Cardiology',
        department_id: deptAId,
        hospital_id: hospAId,
        experience_years: 12,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctor2Id,
        user_id: doctor2UserId,
        full_name: 'Dr. Neha Sharma',
        email: doctor2Email,
        mobile: '+91 9123456702',
        license_number: `DOC-PED-${timestamp}`,
        specialization: 'Pediatrics',
        department_id: deptBId,
        hospital_id: hospBId,
        experience_years: 9,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headADoctorId,
        user_id: headAUserId,
        full_name: 'Dr. Suresh Mehta',
        email: headAEmail,
        mobile: '+91 9123456703',
        license_number: `DOC-HEAD-A-${timestamp}`,
        specialization: 'Cardiology',
        department_id: deptAId,
        hospital_id: hospAId,
        experience_years: 22,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headBDoctorId,
        user_id: headBUserId,
        full_name: 'Dr. Kavita Rao',
        email: headBEmail,
        mobile: '+91 9123456704',
        license_number: `DOC-HEAD-B-${timestamp}`,
        specialization: 'Pediatrics',
        department_id: deptBId,
        hospital_id: hospBId,
        experience_years: 19,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await hospitalConn.collection('departmentheads').insertMany([
      {
        _id: new mongoose.Types.ObjectId(),
        user_id: headAUserId,
        hospital_id: hospAId,
        department_id: deptAId,
        doctor_id: headADoctorId,
        full_name: 'Dr. Suresh Mehta',
        email: headAEmail,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user_id: headBUserId,
        hospital_id: hospBId,
        department_id: deptBId,
        doctor_id: headBDoctorId,
        full_name: 'Dr. Kavita Rao',
        email: headBEmail,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 3. Families and Family Members
    const family1Id = new mongoose.Types.ObjectId();
    const family1UserId = new mongoose.Types.ObjectId();
    const member1Id = new mongoose.Types.ObjectId();
    const member2Id = new mongoose.Types.ObjectId();

    const family2Id = new mongoose.Types.ObjectId();
    const family2UserId = new mongoose.Types.ObjectId();
    const member3Id = new mongoose.Types.ObjectId();

    ids.family1Id = family1Id.toString();
    ids.family2Id = family2Id.toString();
    ids.member1Id = member1Id.toString();
    ids.member2Id = member2Id.toString();
    ids.member3Id = member3Id.toString();

    await familyConn.collection('families').insertMany([
      {
        _id: family1Id,
        family_name: 'Sharma Family',
        creator_user_id: family1UserId,
        email: family1Email,
        mobile: '+91 9876543201',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: family2Id,
        family_name: 'Verma Family',
        creator_user_id: family2UserId,
        email: family2Email,
        mobile: '+91 9876543202',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await familyConn.collection('familymembers').insertMany([
      {
        _id: member1Id,
        family_id: family1Id,
        full_name: 'Rohan Sharma',
        date_of_birth: new Date('1990-05-15'),
        gender: 'MALE',
        blood_group: 'O+',
        phone: '+91 9876543201',
        email: family1Email,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: member2Id,
        family_id: family1Id,
        full_name: 'Priya Sharma',
        date_of_birth: new Date('1994-08-20'),
        gender: 'FEMALE',
        blood_group: 'A+',
        phone: '+91 9876543203',
        email: 'priya.sharma@example.com',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: member3Id,
        family_id: family2Id,
        full_name: 'Amit Verma',
        date_of_birth: new Date('1985-02-10'),
        gender: 'MALE',
        blood_group: 'B+',
        phone: '+91 9876543202',
        email: family2Email,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 4. Auth Users for all 5 Roles
    const adminAUserId = new mongoose.Types.ObjectId();
    const adminBUserId = new mongoose.Types.ObjectId();
    const chairmanUserId = new mongoose.Types.ObjectId();

    ids[family1Email] = family1UserId.toString();
    ids[family2Email] = family2UserId.toString();
    ids[doctor1Email] = doctor1UserId.toString();
    ids[doctor2Email] = doctor2UserId.toString();
    ids[headAEmail] = headAUserId.toString();
    ids[headBEmail] = headBUserId.toString();
    ids[adminAEmail] = adminAUserId.toString();
    ids[adminBEmail] = adminBUserId.toString();
    ids[chairmanEmail] = chairmanUserId.toString();

    const hashedPassword = await hashPassword(defaultPassword);

    await authConn.collection('users').insertMany([
      {
        _id: family1UserId,
        email: family1Email,
        password_hash: hashedPassword,
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: family1Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: family2UserId,
        email: family2Email,
        password_hash: hashedPassword,
        role: 'FAMILY',
        account_type: 'FAMILY_ACCOUNT',
        reference_id: family2Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctor1UserId,
        email: doctor1Email,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctor1Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: doctor2UserId,
        email: doctor2Email,
        password_hash: hashedPassword,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: doctor2Id,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headAUserId,
        email: headAEmail,
        password_hash: hashedPassword,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: deptAId,
        doctor_id: headADoctorId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: headBUserId,
        email: headBEmail,
        password_hash: hashedPassword,
        role: 'DEPARTMENT_HEAD',
        account_type: 'DEPARTMENT_HEAD_ACCOUNT',
        reference_id: deptBId,
        doctor_id: headBDoctorId,
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
    ]);

    console.log('  * Successfully seeded test datasets for all 5 roles.');

    console.log('\n[3/6] Authenticating all roles through Gateway (/api/auth/login)...');
    const loginUsers = [
      { key: 'family1', email: family1Email },
      { key: 'family2', email: family2Email },
      { key: 'doctor1', email: doctor1Email },
      { key: 'doctor2', email: doctor2Email },
      { key: 'headA', email: headAEmail },
      { key: 'headB', email: headBEmail },
      { key: 'adminA', email: adminAEmail },
      { key: 'adminB', email: adminBEmail },
      { key: 'chairman', email: chairmanEmail },
    ];

    for (const u of loginUsers) {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: defaultPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data?.token) {
        throw new Error(`Login failed for ${u.email}: ${JSON.stringify(data)}`);
      }
      tokens[u.key] = data.data.token;
    }
    console.log('  * All 9 tokens successfully acquired via Gateway :5000.');

    console.log('\n[4/6] Executing Granular End-to-End Positive API Endpoint Coverage...');

    // 1. Auth Service Endpoints
    console.log('  --> Testing Auth Service Endpoints...');
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${tokens.family1}` },
    });
    const meData = await meRes.json();
    if (!meRes.ok || meData.data?.email !== family1Email) {
      throw new Error(`GET /api/auth/me failed: ${JSON.stringify(meData)}`);
    }

    const logoutRes = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.family1}` },
    });
    if (!logoutRes.ok) throw new Error('POST /api/auth/logout failed');

    // 2. Family Service Endpoints
    console.log('  --> Testing Family Service Endpoints...');
    const famMeRes = await fetch('http://localhost:5000/api/families/me', {
      headers: { Authorization: `Bearer ${tokens.family1}` },
    });
    const famMeData = await famMeRes.json();
    if (!famMeRes.ok || !famMeData.data) throw new Error('GET /api/families/me failed');

    const listMemRes = await fetch('http://localhost:5000/api/families/members', {
      headers: { Authorization: `Bearer ${tokens.family1}` },
    });
    const listMemData = await listMemRes.json();
    if (!listMemRes.ok || !Array.isArray(listMemData.data) || listMemData.data.length < 2) {
      throw new Error('GET /api/families/members failed');
    }

    // 3. Hospital Service Endpoints
    console.log('  --> Testing Hospital Service Endpoints...');
    const listHospRes = await fetch('http://localhost:5000/api/hospitals');
    const listHospData = await listHospRes.json();
    if (!listHospRes.ok || !Array.isArray(listHospData.data)) throw new Error('GET /api/hospitals failed');

    const getHospRes = await fetch(`http://localhost:5000/api/hospitals/${ids.hospitalAId}`);
    const getHospData = await getHospRes.json();
    if (!getHospRes.ok || getHospData.data?.id !== ids.hospitalAId) throw new Error('GET /api/hospitals/:id failed');

    const updateHospRes = await fetch(`http://localhost:5000/api/hospitals/${ids.hospitalAId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokens.adminA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: '+91 22 9999 8888' }),
    });
    if (!updateHospRes.ok) throw new Error('PUT /api/hospitals/:id failed');

    const listDeptRes = await fetch('http://localhost:5000/api/departments', {
      headers: { Authorization: `Bearer ${tokens.adminA}` },
    });
    const listDeptData = await listDeptRes.json();
    if (!listDeptRes.ok || !Array.isArray(listDeptData.data)) throw new Error('GET /api/departments failed');

    // Hospital Onboarding Request Workflow
    const reqSubmitRes = await fetch('http://localhost:5000/api/hospital-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Apollo Super Care ${timestamp}`,
        city: 'Bengaluru',
        state: 'Karnataka',
        address: '12 Bannerghatta Rd, Bengaluru, Karnataka 560076',
        contactPerson: 'Dr. Ramesh Kumar',
        phone: '+91 80 2345 6789',
        email: `contact.apollo.${timestamp}@medimind.org`,
        requestedDepartments: ['Cardiology', 'Neurology'],
      }),
    });
    const reqSubmitData = await reqSubmitRes.json();
    if (!reqSubmitRes.ok || !reqSubmitData.data?.id) throw new Error(`POST /api/hospital-requests failed: ${JSON.stringify(reqSubmitData)}`);
    const onboardReqId = reqSubmitData.data.id;

    const reqApproveRes = await fetch(`http://localhost:5000/api/hospital-requests/${onboardReqId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.chairman}`,
      },
    });
    if (!reqApproveRes.ok) throw new Error('POST /api/hospital-requests/:id/approve failed');

    // 4. Doctor Service Endpoints
    console.log('  --> Testing Doctor Service Endpoints...');
    const listDocsRes = await fetch('http://localhost:5000/api/doctors');
    const listDocsData = await listDocsRes.json();
    if (!listDocsRes.ok || !Array.isArray(listDocsData.data)) throw new Error('GET /api/doctors failed');

    const getDocRes = await fetch(`http://localhost:5000/api/doctors/${ids.doctor1Id}`);
    const getDocData = await getDocRes.json();
    if (!getDocRes.ok || getDocData.data?.id !== ids.doctor1Id) throw new Error('GET /api/doctors/:id failed');

    const availUpdateRes = await fetch(`http://localhost:5000/api/doctors/${ids.doctor1Id}/availability`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokens.doctor1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        availability: [
          { day: 'MONDAY', startTime: '09:00', endTime: '17:00' },
          { day: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
        ],
      }),
    });
    if (!availUpdateRes.ok) throw new Error('PUT /api/doctors/:id/availability failed');

    // 5. Appointment Service Endpoints
    console.log('  --> Testing Appointment Service Endpoints...');
    const bookApptRes = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.family1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyMemberId: ids.member1Id,
        doctorId: ids.doctor1Id,
        hospitalId: ids.hospitalAId,
        departmentId: ids.deptCardioId,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Regular cardiac follow-up and ECG review',
      }),
    });
    const bookApptData = await bookApptRes.json();
    if (!bookApptRes.ok || !bookApptData.data?.id) {
      throw new Error(`POST /api/appointments failed: ${JSON.stringify(bookApptData)}`);
    }
    const apptId = bookApptData.data.id;

    const listApptRes = await fetch('http://localhost:5000/api/appointments', {
      headers: { Authorization: `Bearer ${tokens.family1}` },
    });
    const listApptData = await listApptRes.json();
    if (!listApptRes.ok || listApptData.data.length === 0) throw new Error('GET /api/appointments failed');

    // Doctor confirms appointment
    const confirmApptRes = await fetch(`http://localhost:5000/api/appointments/${apptId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokens.doctor1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    if (!confirmApptRes.ok) throw new Error('PUT /api/appointments/:id/status failed');

    // 6. Medical Record & Access Control Endpoints
    console.log('  --> Testing Medical Record & Clinical Endpoints...');
    const uploadRecRes = await fetch('http://localhost:5000/api/records', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.family1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyMemberId: ids.member1Id,
        recordType: 'ECG',
        recordDate: new Date().toISOString(),
        title: 'Initial ECG Report',
        description: 'Baseline resting 12-lead ECG tracing',
        fileUrl: 'https://medimind.org/records/ecg-001.pdf',
        fileName: 'ecg-001.pdf',
      }),
    });
    const uploadRecData = await uploadRecRes.json();
    if (!uploadRecRes.ok || !uploadRecData.data?.id) {
      throw new Error(`POST /api/records failed: ${JSON.stringify(uploadRecData)}`);
    }
    const _recordId = uploadRecData.data.id;

    // Grant Record Access to Doctor 1
    const grantAccRes = await fetch('http://localhost:5000/api/records/access', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.family1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyMemberId: ids.member1Id,
        doctorId: ids.doctor1Id,
        hospitalId: ids.hospitalAId,
        accessDurationDays: 7,
      }),
    });
    const grantAccData = await grantAccRes.json();
    if (!grantAccRes.ok || !grantAccData.data?.id) throw new Error('POST /api/records/access failed');
    const accessId = grantAccData.data.id;

    // Doctor accesses records with granted access
    const docRecRes = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
      headers: { Authorization: `Bearer ${tokens.doctor1}` },
    });
    const docRecData = await docRecRes.json();
    if (!docRecRes.ok || docRecData.data.length === 0) {
      throw new Error('GET /api/records/member/:id with Doctor Access failed');
    }

    // 7. Consultation & Prescription Lifecycle Endpoints
    console.log('  --> Testing Consultation & Prescription Lifecycle Endpoints...');
    const createConsultRes = await fetch('http://localhost:5000/api/consultations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.doctor1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyMemberId: ids.member1Id,
        appointmentId: apptId,
        symptoms: 'Occasional chest tightness upon exertion',
        observations: 'BP 120/80 mmHg, HR 72 bpm',
        clinicalAssessment: 'Normal sinus rhythm, mild exertional angina',
        treatmentPlan: 'Patient advised lifestyle modification and low-sodium diet',
      }),
    });
    const createConsultData = await createConsultRes.json();
    if (!createConsultRes.ok || !createConsultData.data?.id) {
      throw new Error(`POST /api/consultations failed: ${JSON.stringify(createConsultData)}`);
    }
    const consultId = createConsultData.data.id;

    // Finalize Consultation
    const finConsultRes = await fetch(`http://localhost:5000/api/consultations/${consultId}/finalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.doctor1}` },
    });
    if (!finConsultRes.ok) throw new Error('PUT /api/consultations/:id/finalize failed');

    // Create & Finalize Prescription
    const createPrescRes = await fetch('http://localhost:5000/api/prescriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.doctor1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyMemberId: ids.member1Id,
        consultationId: consultId,
        medicines: [
          { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily', duration: '30 days' },
        ],
        generalInstructions: 'Continue 30 min daily walking exercise',
      }),
    });
    const createPrescData = await createPrescRes.json();
    if (!createPrescRes.ok || !createPrescData.data?.id) {
      throw new Error(`POST /api/prescriptions failed: ${JSON.stringify(createPrescData)}`);
    }
    const prescId = createPrescData.data.id;

    const finPrescRes = await fetch(`http://localhost:5000/api/prescriptions/${prescId}/finalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.doctor1}` },
    });
    if (!finPrescRes.ok) throw new Error('PUT /api/prescriptions/:id/finalize failed');

    // 8. Knowledge Service Endpoints & Workflow
    console.log('  --> Testing Knowledge Service Endpoints & Workflow...');
    const draftArtRes = await fetch('http://localhost:5000/api/knowledge/articles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.doctor1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Modern Cardiac Rehabilitation Guidelines',
        category: 'Cardiology',
        departmentId: ids.deptCardioId,
        hospitalId: ids.hospitalAId,
        content: 'Evidence-based protocols for post-infarction rehabilitation and recovery management.',
        summary: 'A clinical overview of modern cardiovascular rehab best practices.',
        tags: ['Cardiology', 'Rehabilitation'],
      }),
    });
    const draftArtData = await draftArtRes.json();
    if (!draftArtRes.ok || !draftArtData.data?.id) {
      throw new Error(`POST /api/knowledge/articles failed: ${JSON.stringify(draftArtData)}`);
    }
    const articleId = draftArtData.data.id;

    // Submit article for review
    const submitArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.doctor1}` },
    });
    if (!submitArtRes.ok) throw new Error('POST /api/knowledge/articles/:id/submit failed');

    // Dept Head reviews and publishes
    const pubArtRes = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.headA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedback: 'Peer reviewed and approved for clinical knowledge repository.' }),
    });
    if (!pubArtRes.ok) throw new Error('POST /api/knowledge/articles/:id/publish failed');

    // 9. AI Prediction Service Endpoints
    console.log('  --> Testing AI Prediction Service Endpoints...');
    const aiHealthRes = await fetch('http://localhost:5000/api/ai/health');
    const aiHealthData = await aiHealthRes.json();
    if (!aiHealthRes.ok || (aiHealthData.status !== 'HEALTHY' && aiHealthData.data?.status !== 'HEALTHY')) {
      throw new Error(`GET /api/ai/health failed: ${JSON.stringify(aiHealthData)}`);
    }

    const aiGenRes = await fetch('http://localhost:5000/api/ai/general-health', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.family1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        member_id: ids.member1Id,
        age: 41,
        gender: 'male',
        symptoms: ['Mild exertional fatigue', 'Occasional palpitations'],
      }),
    });
    const aiGenData = await aiGenRes.json();
    if (!aiGenRes.ok || aiGenData.module !== 'GENERAL_HEALTH') throw new Error('POST /api/ai/general-health failed');

    const aiHdRes = await fetch('http://localhost:5000/api/ai/heart-disease', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.family1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        member_id: ids.member1Id,
        age: 41,
        sex: 1,
        cp: 2,
        trestbps: 130,
        chol: 210,
        fbs: 0,
        restecg: 1,
        thalach: 155,
        exang: 0,
        oldpeak: 1.2,
        slope: 1,
        ca: 0,
        thal: 2,
      }),
    });
    const aiHdData = await aiHdRes.json();
    if (!aiHdRes.ok || aiHdData.module !== 'HEART_DISEASE') throw new Error('POST /api/ai/heart-disease failed');

    const aiListRes = await fetch(`http://localhost:5000/api/ai/member/${ids.member1Id}`, {
      headers: { Authorization: `Bearer ${tokens.family1}` },
    });
    const aiListData = await aiListRes.json();
    if (!aiListRes.ok || aiListData.predictions.length < 2) throw new Error('GET /api/ai/member/:id failed');

    console.log('\n[5/6] Running 22-Point Negative Security & Access Control Matrix...');

    const securityMatrix = [
      {
        id: 1,
        desc: 'Missing JWT token on protected endpoint rejected with 401',
        fn: async () => {
          const res = await fetch('http://localhost:5000/api/auth/me');
          return res.status === 401;
        },
      },
      {
        id: 2,
        desc: 'Malformed/Invalid JWT token rejected with 401',
        fn: async () => {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: 'Bearer this.is.an.invalid.token' },
          });
          return res.status === 401;
        },
      },
      {
        id: 3,
        desc: 'Expired JWT token rejected with 401',
        fn: async () => {
          const expiredToken = jwt.sign(
            { id: ids[family1Email], role: 'FAMILY', iat: Math.floor(Date.now() / 1000) - 7200 },
            process.env.JWT_SECRET || 'medimind-super-secret-jwt-key-for-development-2026',
            { expiresIn: '1s' }
          );
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${expiredToken}` },
          });
          return res.status === 401;
        },
      },
      {
        id: 4,
        desc: 'Tampered JWT payload/signature rejected with 401',
        fn: async () => {
          const parts = tokens.family1.split('.');
          const tampered = `${parts[0]}.${parts[1]}xyz.${parts[2]}`;
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${tampered}` },
          });
          return res.status === 401;
        },
      },
      {
        id: 5,
        desc: 'Client-spoofed x-user-id header is stripped and sanitized by Gateway',
        fn: async () => {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${tokens.family1}`,
              'x-user-id': 'spoofed-fake-user-id-999',
            },
          });
          const data = await res.json();
          return res.ok && data.data?.userId === ids[family1Email];
        },
      },
      {
        id: 6,
        desc: 'Client-spoofed x-user-role header is stripped and sanitized by Gateway',
        fn: async () => {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${tokens.family1}`,
              'x-user-role': 'CHAIRMAN',
            },
          });
          const data = await res.json();
          return res.ok && data.data?.role === 'FAMILY';
        },
      },
      {
        id: 7,
        desc: 'Client-spoofed family headers are sanitized by Gateway',
        fn: async () => {
          const res = await fetch('http://localhost:5000/api/families/me', {
            headers: {
              Authorization: `Bearer ${tokens.family1}`,
              'x-family-id': 'spoofed-family-id',
            },
          });
          const data = await res.json();
          return res.ok && (data.data?.familyId === ids.family1Id || data.data?.id === ids.family1Id || data.data?._id === ids.family1Id);
        },
      },
      {
        id: 8,
        desc: 'Direct microservice access without internal secret returns 401',
        fn: async () => {
          const res = await fetch('http://localhost:5001/api/auth/me', {
            headers: { 'x-user-id': ids[family1Email], 'x-user-role': 'FAMILY' },
          });
          return res.status === 401;
        },
      },
      {
        id: 9,
        desc: 'Cross-family medical record access blocked (Family 2 accessing Family 1 records) with 403',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
            headers: { Authorization: `Bearer ${tokens.family2}` },
          });
          return res.status === 403;
        },
      },
      {
        id: 10,
        desc: 'Doctor without active RecordAccess blocked from member clinical records with 403',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
            headers: { Authorization: `Bearer ${tokens.doctor2}` },
          });
          return res.status === 403;
        },
      },
      {
        id: 11,
        desc: 'Revoked RecordAccess immediately blocks Doctor from accessing records with 403',
        fn: async () => {
          const revokeRes = await fetch(`http://localhost:5000/api/records/access/${accessId}/revoke`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${tokens.family1}` },
          });
          if (!revokeRes.ok) return false;

          const res = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
            headers: { Authorization: `Bearer ${tokens.doctor1}` },
          });
          return res.status === 403;
        },
      },
      {
        id: 12,
        desc: 'Hospital Admin blocked from viewing patient clinical medical records with 403',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
            headers: { Authorization: `Bearer ${tokens.adminA}` },
          });
          return res.status === 403;
        },
      },
      {
        id: 13,
        desc: 'Department Head blocked from viewing patient clinical medical records with 403',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
            headers: { Authorization: `Bearer ${tokens.headA}` },
          });
          return res.status === 403;
        },
      },
      {
        id: 14,
        desc: 'Chairman blocked from viewing patient clinical medical records with 403',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/records/member/${ids.member1Id}`, {
            headers: { Authorization: `Bearer ${tokens.chairman}` },
          });
          return res.status === 403;
        },
      },
      {
        id: 15,
        desc: 'Cross-hospital doctor modification blocked with 403',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/doctors/${ids.doctor1Id}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${tokens.adminB}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ specialization: 'Neurology' }),
          });
          return res.status === 403;
        },
      },
      {
        id: 16,
        desc: 'Cross-department knowledge article review blocked with 403',
        fn: async () => {
          const draftRes = await fetch('http://localhost:5000/api/knowledge/articles', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.doctor1}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Pediatric vs Cardio Test',
              category: 'Cardiology',
              departmentId: ids.deptCardioId,
              hospitalId: ids.hospitalAId,
              content: 'Cardiology specific content.',
              summary: 'Cardio summary.',
            }),
          });
          const draftData = await draftRes.json();
          const artId = draftData.data.id;
          await fetch(`http://localhost:5000/api/knowledge/articles/${artId}/submit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokens.doctor1}` },
          });

          const res = await fetch(`http://localhost:5000/api/knowledge/articles/${artId}/publish`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.headB}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feedback: 'Cross review attempt' }),
          });
          return res.status === 403;
        },
      },
      {
        id: 17,
        desc: 'Author self-review/approval of own knowledge article blocked with 403',
        fn: async () => {
          const draftRes = await fetch('http://localhost:5000/api/knowledge/articles', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.headA}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Head A Cardio Paper',
              category: 'Cardiology',
              departmentId: ids.deptCardioId,
              hospitalId: ids.hospitalAId,
              content: 'Content by Head A.',
              summary: 'Summary.',
            }),
          });
          const draftData = await draftRes.json();
          const artId = draftData.data.id;
          await fetch(`http://localhost:5000/api/knowledge/articles/${artId}/submit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokens.headA}` },
          });

          const res = await fetch(`http://localhost:5000/api/knowledge/articles/${artId}/publish`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.headA}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feedback: 'Self approving' }),
          });
          return res.status === 403;
        },
      },
      {
        id: 18,
        desc: 'Editing finalized consultation rejected with 400',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/consultations/${consultId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${tokens.doctor1}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symptoms: 'Attempting to change finalized notes' }),
          });
          return res.status === 400;
        },
      },
      {
        id: 19,
        desc: 'Editing finalized prescription rejected with 400',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/prescriptions/${prescId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${tokens.doctor1}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ generalInstructions: 'Attempting to edit finalized prescription advice' }),
          });
          return res.status === 400;
        },
      },
      {
        id: 20,
        desc: 'Editing published knowledge article rejected with 400',
        fn: async () => {
          const res = await fetch(`http://localhost:5000/api/knowledge/articles/${articleId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${tokens.doctor1}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Attempting to edit published article' }),
          });
          return res.status === 400;
        },
      },
      {
        id: 21,
        desc: 'AI service gracefully returns 503 when downstream AI service is offline',
        fn: async () => {
          await stopMockAiService();
          const res = await fetch('http://localhost:5000/api/ai/health');
          await startMockAiService(5007);
          return res.status === 503;
        },
      },
      {
        id: 22,
        desc: 'Administrative roles (Admin/Chairman/DeptHead) blocked from AI prediction inference with 403',
        fn: async () => {
          const res = await fetch('http://localhost:5000/api/ai/general-health', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.adminA}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ member_id: ids.member1Id, symptoms: ['Headache'] }),
          });
          return res.status === 403;
        },
      },
    ];

    let passedCount = 0;
    for (const test of securityMatrix) {
      try {
        const passed = await test.fn();
        if (passed) {
          console.log(`  [PASS] #${test.id}: ${test.desc}`);
          passedCount++;
        } else {
          console.error(`  [FAIL] #${test.id}: ${test.desc}`);
          throw new Error(`Security test #${test.id} failed`);
        }
      } catch (err) {
        console.error(`  [ERROR] #${test.id}: ${test.desc} - ${err.message}`);
        throw err;
      }
    }

    console.log(`\n[6/6] Security Matrix complete: ${passedCount}/22 security tests passed!`);

    console.log('\n================================================================');
    console.log('FINAL API CONTRACT AUDIT: ALL CHECKS PASSED');
    console.log('================================================================\n');
  } finally {
    console.log('Cleaning up resources and stopping services...');
    await stopMockAiService();

    if (authConn) await authConn.close();
    if (familyConn) await familyConn.close();
    if (hospitalConn) await hospitalConn.close();
    if (doctorConn) await doctorConn.close();
    if (apptConn) await apptConn.close();
    if (recordConn) await recordConn.close();
    if (knowledgeConn) await knowledgeConn.close();

    if (gatewayProc) gatewayProc.kill();
    if (authProc) authProc.kill();
    if (familyProc) familyProc.kill();
    if (hospitalProc) hospitalProc.kill();
    if (doctorProc) doctorProc.kill();
    if (apptProc) apptProc.kill();
    if (recordProc) recordProc.kill();
    if (knowledgeProc) knowledgeProc.kill();
  }
}

runEndpointAuditVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
