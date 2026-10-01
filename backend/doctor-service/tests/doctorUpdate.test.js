import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Doctor from '../src/models/Doctor.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_doctor_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospAId, hospBId;
let deptAId, deptBId;
let docA1, docB1;
let chairmanToken, adminAToken, headAToken, docA1Token, familyToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Doctor.deleteMany({});

  hospAId = new mongoose.Types.ObjectId();
  hospBId = new mongoose.Types.ObjectId();
  deptAId = new mongoose.Types.ObjectId();
  deptBId = new mongoose.Types.ObjectId();

  docA1 = await Doctor.create({
    user_id: new mongoose.Types.ObjectId(),
    hospital_id: hospAId,
    department_id: deptAId,
    full_name: 'Dr. Vivek Rao',
    email: 'vivek.rao@test.org',
    mobile: '+91 98765 20001',
    specialization: 'Cardiology',
    qualifications: ['MBBS', 'MD'],
    experience_years: 9,
    status: 'ACTIVE',
  });

  docB1 = await Doctor.create({
    user_id: new mongoose.Types.ObjectId(),
    hospital_id: hospBId,
    department_id: deptBId,
    full_name: 'Dr. Kavita Joshi',
    email: 'kavita.joshi@test.org',
    mobile: '+91 98765 20002',
    specialization: 'Neurology',
    qualifications: ['MBBS', 'DM'],
    experience_years: 12,
    status: 'ACTIVE',
  });

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

  docA1Token = jwt.sign(
    {
      userId: docA1.user_id.toString(),
      role: 'DOCTOR',
      doctorId: docA1._id.toString(),
      referenceId: docA1._id.toString(),
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

describe('3. Doctor Profile Update & Scoping', () => {
  it('allows doctor to update their own profile details', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({
        qualifications: ['MBBS', 'MD', 'FACC'],
        experienceYears: 10,
        professionalDescription: 'Senior interventional cardiologist',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.qualifications).toContain('FACC');
    expect(res.body.data.experienceYears).toBe(10);
    expect(res.body.data.professionalDescription).toBe('Senior interventional cardiologist');
  });

  it('blocks doctor from updating another doctor profile (403 Forbidden)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({
        professionalDescription: 'Attempted unauthorized modification',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('does not allow doctor to change their own status to INACTIVE', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({ status: 'INACTIVE' });

    expect(res.status).toBe(200);
    // Status must remain ACTIVE because doctors cannot alter their own status
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('allows Department Head to update doctor within their department including status', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}`)
      .set('Authorization', `Bearer ${headAToken}`)
      .send({
        status: 'INACTIVE',
        experienceYears: 11,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
    expect(res.body.data.experienceYears).toBe(11);
  });

  it('blocks Department Head from updating doctor in another department (403)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}`)
      .set('Authorization', `Bearer ${headAToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows Hospital Admin to update doctor in their hospital', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('blocks Hospital Admin from updating doctor in another hospital (403)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ status: 'SUSPENDED' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows Chairman to update any doctor platform-wide', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({ status: 'ACTIVE', professionalDescription: 'Chairman verified doctor' });

    expect(res.status).toBe(200);
    expect(res.body.data.professionalDescription).toBe('Chairman verified doctor');
  });

  it('blocks FAMILY role from updating doctor profiles (403)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({ professionalDescription: 'Hacked by family' });

    expect(res.status).toBe(403);
  });

  it('returns 400 for malformed doctor ID on update', async () => {
    const res = await request(app)
      .put('/api/doctors/invalid-doctor-id')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ experienceYears: 5 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent doctor ID on update', async () => {
    const nonExistent = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/doctors/${nonExistent}`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({ experienceYears: 5 });

    expect(res.status).toBe(404);
  });

  it('returns 401 for unauthenticated update request', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}`)
      .send({ experienceYears: 5 });

    expect(res.status).toBe(401);
  });
});
