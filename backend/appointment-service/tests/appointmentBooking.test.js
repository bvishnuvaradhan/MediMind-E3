import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Appointment from '../src/models/Appointment.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_appointment_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let doctor1Id, doctor2Id, hospitalId, departmentId;
let familyMember1Id, familyMember2Id;
let familyToken, doctor1Token, adminToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Appointment.deleteMany({});

  doctor1Id = new mongoose.Types.ObjectId();
  doctor2Id = new mongoose.Types.ObjectId();
  hospitalId = new mongoose.Types.ObjectId();
  departmentId = new mongoose.Types.ObjectId();
  familyMember1Id = new mongoose.Types.ObjectId();
  familyMember2Id = new mongoose.Types.ObjectId();

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: new mongoose.Types.ObjectId().toString() },
    JWT_SECRET
  );

  doctor1Token = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doctor1Id.toString(), doctorId: doctor1Id.toString() },
    JWT_SECRET
  );

  adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: hospitalId.toString(), hospitalId: hospitalId.toString() },
    JWT_SECRET
  );
});

afterAll(async () => {
  await Appointment.deleteMany({});
  await mongoose.connection.close();
});

describe('Appointment Booking Suite', () => {
  test('1. Rejects booking without authentication token (401)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({
        familyMemberId: familyMember1Id,
        doctorId: doctor1Id,
        appointmentDate: '2026-10-15',
        startTime: '10:00',
        endTime: '10:30',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('2. Rejects booking with missing mandatory fields (400)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        doctorId: doctor1Id,
        appointmentDate: '2026-10-15',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('3. Rejects invalid time format or start time >= end time (400)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId: familyMember1Id,
        doctorId: doctor1Id,
        appointmentDate: '2026-10-15',
        startTime: '11:30',
        endTime: '10:30',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('earlier than endTime');
  });

  test('4. Successfully books a valid appointment (201)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId: familyMember1Id,
        doctorId: doctor1Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-15',
        startTime: '10:00',
        endTime: '10:30',
        reason: 'General consultation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('BOOKED');
    expect(res.body.data.appointmentType).toBe('BOOKED');
    expect(res.body.data.startTime).toBe('10:00');
    expect(res.body.data.endTime).toBe('10:30');
  });

  test('5. Rejects double booking conflict for the same doctor at overlapping slot (409)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId: familyMember2Id,
        doctorId: doctor1Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-15',
        startTime: '10:15',
        endTime: '10:45',
        reason: 'Second consultation',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already has an appointment booked');
  });

  test('6. Allows non-overlapping booking for same doctor on the same day (201)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId: familyMember2Id,
        doctorId: doctor1Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-15',
        startTime: '11:00',
        endTime: '11:30',
        reason: 'Follow-up visit',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.startTime).toBe('11:00');
  });

  test('7. Allows walk-in appointment creation by hospital admin (201)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        familyMemberId: familyMember1Id,
        doctorId: doctor2Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-16',
        startTime: '09:00',
        endTime: '09:30',
        appointmentType: 'WALK_IN',
        reason: 'Emergency walk-in',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentType).toBe('WALK_IN');
    expect(res.body.data.status).toBe('BOOKED');
  });

  test('8. Rejects doctor booking for a different doctor (403)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${doctor1Token}`)
      .send({
        familyMemberId: familyMember1Id,
        doctorId: doctor2Id,
        hospitalId,
        departmentId,
        appointmentDate: '2026-10-17',
        startTime: '14:00',
        endTime: '14:30',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
