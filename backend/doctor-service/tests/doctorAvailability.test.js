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
let chairmanToken, adminAToken, headAToken, docA1Token;

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
    full_name: 'Dr. Anita Roy',
    email: 'anita.roy@test.org',
    mobile: '+91 98765 30001',
    specialization: 'Pediatrics',
    qualifications: ['MBBS', 'MD Pediatrics'],
    experience_years: 7,
    status: 'ACTIVE',
    availability: [
      { day: 'MONDAY', start_time: '09:00', end_time: '13:00' },
      { day: 'WEDNESDAY', start_time: '14:00', end_time: '18:00' },
    ],
  });

  docB1 = await Doctor.create({
    user_id: new mongoose.Types.ObjectId(),
    hospital_id: hospBId,
    department_id: deptBId,
    full_name: 'Dr. Vikram Sen',
    email: 'vikram.sen@test.org',
    mobile: '+91 98765 30002',
    specialization: 'Dermatology',
    qualifications: ['MBBS', 'MD'],
    experience_years: 11,
    status: 'ACTIVE',
    availability: [
      { day: 'TUESDAY', start_time: '10:00', end_time: '14:00' },
    ],
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
});

afterAll(async () => {
  await Doctor.deleteMany({});
  await mongoose.connection.close();
});

describe('4. Doctor Availability Management', () => {
  it('allows public / family to retrieve doctor availability schedule', async () => {
    const res = await request(app).get(`/api/doctors/${docA1._id}/availability`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctorId).toBe(docA1._id.toString());
    expect(Array.isArray(res.body.data.availability)).toBe(true);
    expect(res.body.data.availability.length).toBe(2);
    expect(res.body.data.availability[0].day).toBe('MONDAY');
    expect(res.body.data.availability[0].startTime).toBe('09:00');
  });

  it('allows doctor to update own availability schedule', async () => {
    const newSlots = [
      { day: 'MONDAY', startTime: '10:00', endTime: '14:00' },
      { day: 'THURSDAY', startTime: '09:00', endTime: '12:00' },
      { day: 'FRIDAY', startTime: '15:00', endTime: '19:00' },
    ];

    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({ availability: newSlots });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availability.length).toBe(3);
    expect(res.body.data.availability[0].day).toBe('MONDAY');
    expect(res.body.data.availability[0].startTime).toBe('10:00');
  });

  it('blocks doctor from updating another doctor availability (403)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}/availability`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({
        availability: [{ day: 'MONDAY', startTime: '08:00', endTime: '12:00' }],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows Department Head to update availability of doctor within department', async () => {
    const slots = [
      { day: 'MONDAY', startTime: '08:30', endTime: '12:30' },
    ];

    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .set('Authorization', `Bearer ${headAToken}`)
      .send({ availability: slots });

    expect(res.status).toBe(200);
    expect(res.body.data.availability.length).toBe(1);
    expect(res.body.data.availability[0].startTime).toBe('08:30');
  });

  it('blocks Department Head from updating doctor availability outside department (403)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}/availability`)
      .set('Authorization', `Bearer ${headAToken}`)
      .send({
        availability: [{ day: 'MONDAY', startTime: '09:00', endTime: '13:00' }],
      });

    expect(res.status).toBe(403);
  });

  it('allows Hospital Admin to update doctor availability within hospital', async () => {
    const slots = [
      { day: 'WEDNESDAY', startTime: '10:00', endTime: '16:00' },
    ];

    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ availability: slots });

    expect(res.status).toBe(200);
    expect(res.body.data.availability.length).toBe(1);
  });

  it('blocks Hospital Admin from updating doctor availability in another hospital (403)', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docB1._id}/availability`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        availability: [{ day: 'MONDAY', startTime: '09:00', endTime: '13:00' }],
      });

    expect(res.status).toBe(403);
  });

  it('allows Chairman to update doctor availability across any hospital', async () => {
    const slots = [
      { day: 'SATURDAY', startTime: '09:00', endTime: '13:00' },
    ];

    const res = await request(app)
      .put(`/api/doctors/${docB1._id}/availability`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({ availability: slots });

    expect(res.status).toBe(200);
    expect(res.body.data.availability.length).toBe(1);
    expect(res.body.data.availability[0].day).toBe('SATURDAY');
  });

  it('rejects invalid availability format (not an array) with 400', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({ availability: 'not-an-array' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid slot format (endTime <= startTime) with 400', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({
        availability: [{ day: 'MONDAY', startTime: '14:00', endTime: '10:00' }],
      });

    expect(res.status).toBe(400);
  });

  it('rejects invalid day enum with 400', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .set('Authorization', `Bearer ${docA1Token}`)
      .send({
        availability: [{ day: 'FUNDAY', startTime: '10:00', endTime: '14:00' }],
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed doctor ID on availability fetch', async () => {
    const res = await request(app).get('/api/doctors/invalid-id/availability');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent doctor ID on availability fetch', async () => {
    const nonExistent = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/doctors/${nonExistent}/availability`);
    expect(res.status).toBe(404);
  });

  it('returns 401 for unauthenticated availability update', async () => {
    const res = await request(app)
      .put(`/api/doctors/${docA1._id}/availability`)
      .send({
        availability: [{ day: 'MONDAY', startTime: '10:00', endTime: '14:00' }],
      });

    expect(res.status).toBe(401);
  });
});
