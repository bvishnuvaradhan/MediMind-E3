import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
let mockAiServer;
let receivedDownstreamHeaders = {};
let receivedDownstreamBody = null;

const familyToken = jwt.sign(
  { userId: 'user_fam_1', role: 'FAMILY', referenceId: 'fam_1', family_member_ids: ['mem_001_01', 'mem_001_02'] },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const doctorToken = jwt.sign(
  { userId: 'user_doc_1', role: 'DOCTOR', referenceId: 'doc_1', doctorId: 'doc_1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { userId: 'user_admin_1', role: 'HOSPITAL_ADMIN', referenceId: 'hosp_1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const chairmanToken = jwt.sign(
  { userId: 'user_chair_1', role: 'CHAIRMAN', referenceId: 'chair_1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const deptHeadToken = jwt.sign(
  { userId: 'user_head_1', role: 'DEPARTMENT_HEAD', referenceId: 'dept_1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

beforeAll((done) => {
  // Mock downstream AI Service listening on port 5007
  mockAiServer = http.createServer((req, res) => {
    receivedDownstreamHeaders = { ...req.headers };

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        receivedDownstreamBody = body ? JSON.parse(body) : null;
      } catch {
        receivedDownstreamBody = body;
      }

      if (req.url === '/health' || req.url === '/api/ai/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'MediMind AI Prediction Service',
          version: '1.0.0',
          database_connected: true,
        }));
      } else if (req.url === '/api/ai/general-health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          prediction_id: 'pred_gen_001',
          family_member_id: receivedDownstreamBody?.family_member_id || 'mem_001_01',
          prediction_type: 'GENERAL_HEALTH',
          input_type: 'TEXT',
          input_data: receivedDownstreamBody,
          result: {
            possibleConcerns: ['Acute Upper Respiratory Infection'],
            urgency: 'MEDICAL_EVALUATION_RECOMMENDED',
            guidance: 'Maintain hydration and rest. Schedule clinical evaluation if symptoms persist.',
            symptomsExtracted: ['cough', 'fever', 'sore throat'],
            disclaimer: 'AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional.',
          },
          risk_level: 'MEDIUM',
          risk_score: 0.65,
          confidence: 0.92,
          model_name: 'General-Health-NLP-v1.1.0',
          model_version: '1.1.0',
          created_at: new Date().toISOString(),
        }));
      } else if (req.url === '/api/ai/heart-disease') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          prediction_id: 'pred_cardio_001',
          family_member_id: receivedDownstreamBody?.family_member_id || 'mem_001_01',
          prediction_type: 'HEART_DISEASE_RISK',
          input_type: 'HEALTH_PARAMETERS',
          input_data: receivedDownstreamBody,
          result: {
            cardiovascularRisk: 'High Risk',
            riskScorePercentage: 72.4,
            calibratedThreshold: 0.40,
            keyRiskFactors: ['Elevated systolic BP', 'High cholesterol', 'Smoking history'],
            disclaimer: 'AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional.',
          },
          risk_level: 'HIGH',
          risk_score: 0.724,
          confidence: 0.885,
          model_name: 'CardioRisk-RandomForest-v1.0.0',
          model_version: '1.0.0',
          created_at: new Date().toISOString(),
        }));
      } else if (req.url === '/api/ai/diabetes') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          prediction_id: 'pred_diab_001',
          family_member_id: receivedDownstreamBody?.family_member_id || 'mem_001_01',
          prediction_type: 'DIABETES_RISK',
          input_type: 'HEALTH_PARAMETERS',
          input_data: receivedDownstreamBody,
          result: {
            diabetesRisk: 'High Risk',
            riskScorePercentage: 78.0,
            calibratedThreshold: 0.25,
            imputedFeatures: [],
            disclaimer: 'AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional.',
          },
          risk_level: 'HIGH',
          risk_score: 0.78,
          confidence: 0.85,
          model_name: 'DiabetesRisk-MLP-v1.0.0',
          model_version: '1.0.0',
          created_at: new Date().toISOString(),
        }));
      } else if (req.url === '/api/ai/fracture') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          prediction_id: 'pred_frac_001',
          family_member_id: 'mem_001_01',
          prediction_type: 'FRACTURE_DETECTION',
          input_type: 'IMAGE',
          input_data: { filename: 'xray_wrist.png' },
          result: {
            possibleFracture: false,
            confidence: 0.948,
            targetRegion: 'Wrist (Radiograph)',
            finding: 'No Acute Cortical Fracture Detected',
            disclaimer: 'AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional.',
          },
          risk_level: 'LOW',
          risk_score: 0.052,
          confidence: 0.948,
          model_name: 'FractureDetection-ResNet18-v0.1.0',
          model_version: '0.1.0',
          created_at: new Date().toISOString(),
        }));
      } else if (req.url.startsWith('/api/ai/member/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
          {
            prediction_id: 'pred_gen_001',
            family_member_id: 'mem_001_01',
            prediction_type: 'GENERAL_HEALTH',
            risk_level: 'MEDIUM',
            risk_score: 0.65,
            confidence: 0.92,
            created_at: new Date().toISOString(),
          },
          {
            prediction_id: 'pred_cardio_001',
            family_member_id: 'mem_001_01',
            prediction_type: 'HEART_DISEASE_RISK',
            risk_level: 'HIGH',
            risk_score: 0.724,
            confidence: 0.885,
            created_at: new Date().toISOString(),
          },
        ]));
      } else if (req.url === '/api/ai/pred_cardio_001') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          prediction_id: 'pred_cardio_001',
          family_member_id: 'mem_001_01',
          prediction_type: 'HEART_DISEASE_RISK',
          input_type: 'HEALTH_PARAMETERS',
          risk_level: 'HIGH',
          risk_score: 0.724,
          confidence: 0.885,
          model_name: 'CardioRisk-RandomForest-v1.0.0',
          created_at: new Date().toISOString(),
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Endpoint not found' }));
      }
    });
  });

  mockAiServer.listen(5007, done);
});

afterAll((done) => {
  mockAiServer.close(done);
});

beforeEach(() => {
  receivedDownstreamHeaders = {};
  receivedDownstreamBody = null;
});

describe('1. API Gateway → AI Service Health & Public Access', () => {
  it('GET /api/ai/health returns 200 with AI service health envelope', async () => {
    const res = await request(app).get('/api/ai/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('MediMind AI Prediction Service');
    expect(res.body.data.status).toBe('healthy');
  });
});

describe('2. Four AI Model Prediction Invocations', () => {
  it('POST /api/ai/general-health produces NLP triage prediction', async () => {
    const payload = {
      family_member_id: 'mem_001_01',
      text: 'Patient has had mild dry cough, low-grade fever, and sore throat for two days.',
      appointment_id: 'appt_101',
    };

    const res = await request(app)
      .post('/api/ai/general-health')
      .set('Authorization', `Bearer ${familyToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.prediction_type).toBe('GENERAL_HEALTH');
    expect(res.body.result.urgency).toBe('MEDICAL_EVALUATION_RECOMMENDED');
    expect(res.body.result.symptomsExtracted).toContain('cough');
    expect(res.body.result.disclaimer).toBeDefined();

    // Verify trusted identity headers and internal service signature passed downstream
    expect(receivedDownstreamHeaders['x-internal-service-key']).toBeDefined();
    expect(receivedDownstreamHeaders['x-user-id']).toBe('user_fam_1');
    expect(receivedDownstreamHeaders['x-user-role']).toBe('FAMILY');
  });

  it('POST /api/ai/heart-disease produces cardiovascular risk assessment', async () => {
    const payload = {
      family_member_id: 'mem_001_01',
      AGE: 58,
      GENDER: 1,
      HEIGHT: 172,
      WEIGHT: 84,
      AP_HIGH: 145,
      AP_LOW: 92,
      CHOLESTEROL: 2,
      GLUCOSE: 1,
      SMOKE: 1,
      ALCOHOL: 0,
      PHYSICAL_ACTIVITY: 1,
    };

    const res = await request(app)
      .post('/api/ai/heart-disease')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.prediction_type).toBe('HEART_DISEASE_RISK');
    expect(res.body.risk_level).toBe('HIGH');
    expect(res.body.risk_score).toBe(0.724);
    expect(res.body.result.disclaimer).toBeDefined();
    expect(receivedDownstreamHeaders['x-user-role']).toBe('DOCTOR');
  });

  it('POST /api/ai/diabetes produces metabolic risk assessment', async () => {
    const payload = {
      family_member_id: 'mem_001_01',
      Pregnancies: 2,
      Glucose: 154.0,
      BloodPressure: 78.0,
      SkinThickness: 32.0,
      Insulin: 140.0,
      BMI: 31.2,
      DiabetesPedigreeFunction: 0.58,
      Age: 45,
    };

    const res = await request(app)
      .post('/api/ai/diabetes')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.prediction_type).toBe('DIABETES_RISK');
    expect(res.body.risk_level).toBe('HIGH');
    expect(res.body.risk_score).toBe(0.78);
    expect(res.body.result.disclaimer).toBeDefined();
  });

  it('POST /api/ai/fracture forwards multipart radiograph request', async () => {
    const res = await request(app)
      .post('/api/ai/fracture')
      .set('Authorization', `Bearer ${doctorToken}`)
      .set('Content-Type', 'application/json')
      .send({ family_member_id: 'mem_001_01' });

    expect(res.status).toBe(200);
    expect(res.body.prediction_type).toBe('FRACTURE_DETECTION');
    expect(res.body.risk_level).toBe('LOW');
    expect(res.body.confidence).toBe(0.948);
  });
});

describe('3. Prediction Retrieval & History Scoping', () => {
  it('GET /api/ai/member/:memberId returns history list for authorized user', async () => {
    const res = await request(app)
      .get('/api/ai/member/mem_001_01')
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].prediction_type).toBe('GENERAL_HEALTH');
  });

  it('GET /api/ai/:predictionId returns single prediction record', async () => {
    const res = await request(app)
      .get('/api/ai/pred_cardio_001')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.prediction_id).toBe('pred_cardio_001');
    expect(res.body.prediction_type).toBe('HEART_DISEASE_RISK');
  });
});

describe('4. Security & Role Boundary Enforcement', () => {
  it('rejects unauthenticated request with 401', async () => {
    const res = await request(app)
      .post('/api/ai/general-health')
      .send({ family_member_id: 'mem_001_01', text: 'Headache' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid/tampered JWT with 401', async () => {
    const res = await request(app)
      .post('/api/ai/general-health')
      .set('Authorization', 'Bearer invalid.token.tampered')
      .send({ family_member_id: 'mem_001_01', text: 'Headache' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('BLOCKS Hospital Admin from accessing private clinical predictions (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/ai/member/mem_001_01')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access forbidden');
  });

  it('BLOCKS Chairman from accessing private clinical predictions (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/ai/member/mem_001_01')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access forbidden');
  });

  it('BLOCKS Department Head from accessing private patient clinical predictions (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/ai/diabetes')
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ family_member_id: 'mem_001_01', Glucose: 120 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access forbidden');
  });
});
