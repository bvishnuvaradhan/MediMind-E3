import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Doctor from '../src/models/Doctor.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_doctor_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospAId, hospBId;
let deptAId, deptBId;
let docA1;
let chairmanToken, adminAToken, adminBToken, headAToken, familyToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Doctor.deleteMany({});

  hospAId = new mongoose.Types.ObjectId();
  hospBId = new mongoose.Types.ObjectId();
  deptAId = new mongoose.Types.ObjectId();
  deptBId = new mongoose.Types.ObjectId();

  // Create test doctors
  docA1 = await Doctor.create({
    user_id: new mongoose.Types.ObjectId(),
    hospital_id: hospAId,
    department_id: deptAId,
    full_name: 'Dr. Rahul Mehta',
    email: 'rahul.mehta@test.org',
    mobile: '+91 98765 00001',
    specialization: 'Orthopedic Surgery',
    qualifications: ['MBBS', 'MS'],
    experience_years: 10,
    status: 'ACTIVE',
  });

  await Doctor.create({
    user_id: new mongoose.Types.ObjectId(),
    hospital_id: hospAId,
    department_id: deptAId,
    full_name: 'Dr. Arun Kumar',
    email: 'arun.kumar@test.org',
    mobile: '+91 98765 00002',
    specialization: 'Cardiology',
    qualifications: ['MBBS', 'MD'],
    experience_years: 12,
    status: 'ACTIVE',
  });

  await Doctor.create({
    user_id: new mongoose.Types.ObjectId(),
    hospital_id: hospBId,
    department_id: deptBId,
    full_name: 'Dr. Sneha Kulkarni',
    email: 'sneha.kulkarni@test.org',
    mobile: '+91 98765 00003',
    specialization: 'Neurology',
    qualifications: ['MBBS', 'DM'],
    experience_years: 8,
    status: 'ACTIVE',
  });

  // JWT Tokens
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

  adminBToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'HOSPITAL_ADMIN',
      referenceId: hospBId.toString(),
      hospitalId: hospBId.toString(),
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

describe('1. Doctor Retrieval & Permissions', () => {
  it('allows public or family listing of doctors', async () => {
    const res = await request(app).get('/api/doctors');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('filters doctors by specialization', async () => {
    const res = await request(app)
      .get('/api/doctors?specialization=Cardiology')
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe('Dr. Arun Kumar');
  });

  it('filters doctors by departmentId', async () => {
    const res = await request(app)
      .get(`/api/doctors?departmentId=${deptBId.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe('Dr. Sneha Kulkarni');
  });

  it('filters doctors by search term matching name', async () => {
    const res = await request(app).get('/api/doctors?search=Rahul');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe('Dr. Rahul Mehta');
  });

  it('restricts Hospital Admin A to only doctors in Hospital A', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((d) => d.hospitalId === hospAId.toString())).toBe(true);
  });

  it('restricts Department Head A to only doctors in Department A', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .set('Authorization', `Bearer ${headAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((d) => d.departmentId === deptAId.toString())).toBe(true);
  });

  it('allows Chairman to view all doctors across platform', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('allows retrieval of single doctor by ID', async () => {
    const res = await request(app).get(`/api/doctors/${docA1._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctorId).toBe(docA1._id.toString());
    expect(res.body.data.fullName).toBe('Dr. Rahul Mehta');
  });

  it('BLOCKS Hospital Admin B from viewing doctor in Hospital A (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/doctors/${docA1._id}`)
      .set('Authorization', `Bearer ${adminBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for malformed doctor ID', async () => {
    const res = await request(app).get('/api/doctors/invalid-id-format');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent doctor ID', async () => {
    const nonExistent = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/doctors/${nonExistent}`);
    expect(res.status).toBe(404);
  });

  it('GET /health returns 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('doctor-service');
  });
});
