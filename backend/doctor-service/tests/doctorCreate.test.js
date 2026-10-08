import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Doctor from '../src/models/Doctor.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_doctor_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospAId, hospBId;
let deptAId, deptBId;
let chairmanToken, adminAToken, headAToken, doctorToken, familyToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Doctor.deleteMany({});

  hospAId = new mongoose.Types.ObjectId();
  hospBId = new mongoose.Types.ObjectId();
  deptAId = new mongoose.Types.ObjectId();
  deptBId = new mongoose.Types.ObjectId();

  chairmanToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'CHAIRMAN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  adminAToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'HOSPITAL_ADMIN',
      referenceId: hospAId.toString(),
      hospitalId: hospAId.toString(),
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  headAToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DEPARTMENT_HEAD',
      hospitalId: hospAId.toString(),
      departmentId: deptAId.toString(),
      referenceId: deptAId.toString(),
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  doctorToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'DOCTOR',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await Doctor.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Doctor.deleteMany({});
});

describe('2. Doctor Creation & Account Provisioning', () => {
  it('allows Department Head to create a doctor within assigned department', async () => {
    const uniqueEmail = `neha.sharma.${Date.now()}.${Math.random().toString(36).substr(2, 5)}@test.org`;
    const payload = {
      fullName: 'Dr. Neha Sharma',
      email: uniqueEmail,
      mobile: '+91 98765 11111',
      specialization: 'Orthopedics',
      qualifications: ['MBBS', 'MS Ortho'],
      experienceYears: 6,
      professionalDescription: 'Specialist in joint replacement',
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${headAToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Dr. Neha Sharma');
    expect(res.body.data.email).toBe(uniqueEmail);
    expect(res.body.data.departmentId).toBe(deptAId.toString());
    expect(res.body.data.hospitalId).toBe(hospAId.toString());
    expect(res.body.data.status).toBe('ACTIVE');

    // Verify persisted in DB
    const saved = await Doctor.findOne({ email: uniqueEmail });
    expect(saved).not.toBeNull();
    expect(saved.full_name).toBe('Dr. Neha Sharma');
  });

  it('blocks Department Head from creating doctor in another department', async () => {
    const payload = {
      fullName: 'Dr. Imposter Dept',
      email: `imposter.dept.${Date.now()}@test.org`,
      mobile: '+91 98765 22222',
      specialization: 'Neurology',
      departmentId: deptBId.toString(),
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${headAToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows Hospital Admin to create doctor in any department of their hospital', async () => {
    const uniqueEmail = `suresh.verma.${Date.now()}.${Math.random().toString(36).substr(2, 5)}@test.org`;
    const payload = {
      fullName: 'Dr. Suresh Verma',
      email: uniqueEmail,
      mobile: '+91 98765 33333',
      specialization: 'Cardiology',
      departmentId: deptAId.toString(),
      experienceYears: 14,
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Dr. Suresh Verma');
    expect(res.body.data.hospitalId).toBe(hospAId.toString());
  });

  it('blocks Hospital Admin from creating doctor for another hospital', async () => {
    const payload = {
      fullName: 'Dr. Cross Hospital',
      email: `cross.hosp.${Date.now()}@test.org`,
      mobile: '+91 98765 44444',
      specialization: 'Pediatrics',
      hospitalId: hospBId.toString(),
      departmentId: deptBId.toString(),
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when Hospital Admin omits departmentId', async () => {
    const payload = {
      fullName: 'Dr. No Dept',
      email: `no.dept.${Date.now()}@test.org`,
      mobile: '+91 98765 55555',
      specialization: 'Radiology',
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('allows Chairman to create doctor across any hospital and department', async () => {
    const uniqueEmail = `chairman.doc.${Date.now()}.${Math.random().toString(36).substr(2, 5)}@test.org`;
    const payload = {
      fullName: 'Dr. Chairman Created',
      email: uniqueEmail,
      mobile: '+91 98765 66666',
      specialization: 'Oncology',
      hospitalId: hospBId.toString(),
      departmentId: deptBId.toString(),
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.hospitalId).toBe(hospBId.toString());
    expect(res.body.data.departmentId).toBe(deptBId.toString());
  });

  it('returns 400 if Chairman omits hospitalId or departmentId', async () => {
    const payload = {
      fullName: 'Dr. Missing Target',
      email: 'missing.target@test.org',
      mobile: '+91 98765 77777',
      specialization: 'Pathology',
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('returns 409 conflict when doctor email is already registered', async () => {
    // Create the initial doctor first
    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${headAToken}`)
      .send({
        fullName: 'Dr. Original',
        email: 'neha.sharma@test.org',
        mobile: '+91 98765 11111',
        specialization: 'Orthopedics',
      });

    const payload = {
      fullName: 'Dr. Duplicate',
      email: 'neha.sharma@test.org',
      mobile: '+91 98765 88888',
      specialization: 'General Surgery',
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${headAToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when required fields are missing', async () => {
    const payload = {
      fullName: 'Incomplete Doctor',
      // missing email, mobile, specialization
    };

    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${headAToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('blocks DOCTOR and FAMILY roles from creating doctor accounts (403)', async () => {
    const payload = {
      fullName: 'Dr. Unprivileged',
      email: 'unpriv@test.org',
      mobile: '+91 98765 99999',
      specialization: 'ENT',
    };

    const docRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(payload);
    expect(docRes.status).toBe(403);

    const famRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${familyToken}`)
      .send(payload);
    expect(famRes.status).toBe(403);
  });

  it('returns 401 Unauthorized for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .send({ fullName: 'Dr. Ghost' });

    expect(res.status).toBe(401);
  });
});
