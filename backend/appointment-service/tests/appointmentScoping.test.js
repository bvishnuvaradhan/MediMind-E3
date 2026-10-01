import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Appointment from '../src/models/Appointment.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_appointment_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let doc1Id, doc2Id;
let hospAId, hospBId;
let deptAId, deptBId;
let mem1Id, mem2Id;

let doc1Token, doc2Token;
let adminAToken, adminBToken;
let deptHeadAToken;
let chairmanToken;

let apptHospA, apptHospB;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Appointment.deleteMany({});

  doc1Id = new mongoose.Types.ObjectId();
  doc2Id = new mongoose.Types.ObjectId();
  hospAId = new mongoose.Types.ObjectId();
  hospBId = new mongoose.Types.ObjectId();
  deptAId = new mongoose.Types.ObjectId();
  deptBId = new mongoose.Types.ObjectId();
  mem1Id = new mongoose.Types.ObjectId();
  mem2Id = new mongoose.Types.ObjectId();

  doc1Token = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doc1Id.toString(), doctorId: doc1Id.toString() },
    JWT_SECRET
  );

  doc2Token = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doc2Id.toString(), doctorId: doc2Id.toString() },
    JWT_SECRET
  );

  adminAToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: hospAId.toString(), hospitalId: hospAId.toString() },
    JWT_SECRET
  );

  adminBToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: hospBId.toString(), hospitalId: hospBId.toString() },
    JWT_SECRET
  );

  deptHeadAToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DEPARTMENT_HEAD', departmentId: deptAId.toString(), hospitalId: hospAId.toString() },
    JWT_SECRET
  );

  chairmanToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'CHAIRMAN' },
    JWT_SECRET
  );

  apptHospA = await Appointment.create({
    family_member_id: mem1Id,
    doctor_id: doc1Id,
    hospital_id: hospAId,
    department_id: deptAId,
    appointment_date: new Date('2026-10-25'),
    start_time: '10:00',
    end_time: '10:30',
    status: 'BOOKED',
    appointment_type: 'BOOKED',
  });

  apptHospB = await Appointment.create({
    family_member_id: mem2Id,
    doctor_id: doc2Id,
    hospital_id: hospBId,
    department_id: deptBId,
    appointment_date: new Date('2026-10-25'),
    start_time: '11:00',
    end_time: '11:30',
    status: 'COMPLETED',
    appointment_type: 'WALK_IN',
  });
});

afterAll(async () => {
  await Appointment.deleteMany({});
  await mongoose.connection.close();
});

describe('Appointment Scoping & Retrieval Suite', () => {
  test('1. Doctor 1 receives only their assigned appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${doc1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id.toString()).toBe(apptHospA._id.toString());
  });

  test('2. Doctor 1 attempting to view Doctor 2 appointment is rejected (403)', async () => {
    const res = await request(app)
      .get(`/api/appointments/${apptHospB._id}`)
      .set('Authorization', `Bearer ${doc1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('2b. Doctor 2 retrieves their assigned appointment (200)', async () => {
    const res = await request(app)
      .get(`/api/appointments/${apptHospB._id}`)
      .set('Authorization', `Bearer ${doc2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('3. Hospital Admin A receives only Hospital A appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].hospitalId.toString()).toBe(hospAId.toString());
  });

  test('4. Hospital Admin A attempting to view Hospital B appointment is rejected (403)', async () => {
    const res = await request(app)
      .get(`/api/appointments/${apptHospB._id}`)
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('4b. Hospital Admin B retrieves Hospital B appointment (200)', async () => {
    const res = await request(app)
      .get(`/api/appointments/${apptHospB._id}`)
      .set('Authorization', `Bearer ${adminBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('5. Department Head A receives only Department A appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${deptHeadAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].departmentId.toString()).toBe(deptAId.toString());
  });

  test('6. Chairman has unrestricted platform visibility across all hospitals', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('7. Filters appointments by status and appointmentType correctly', async () => {
    const resCompleted = await request(app)
      .get('/api/appointments?status=COMPLETED')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(resCompleted.status).toBe(200);
    expect(resCompleted.body.data.length).toBe(1);
    expect(resCompleted.body.data[0].status).toBe('COMPLETED');

    const resWalkIn = await request(app)
      .get('/api/appointments?appointmentType=WALK_IN')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(resWalkIn.status).toBe(200);
    expect(resWalkIn.body.data.length).toBe(1);
    expect(resWalkIn.body.data[0].appointmentType).toBe('WALK_IN');
  });

  test('8. Health endpoint responds with 200 OK and healthy status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('appointment-service');
  });
});
