import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Appointment from '../src/models/Appointment.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_appointment_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let doctorId, hospitalId, departmentId, familyMemberId;
let familyToken, doctorToken, adminToken;
let appt1;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Appointment.deleteMany({});

  doctorId = new mongoose.Types.ObjectId();
  hospitalId = new mongoose.Types.ObjectId();
  departmentId = new mongoose.Types.ObjectId();
  familyMemberId = new mongoose.Types.ObjectId();

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: new mongoose.Types.ObjectId().toString() },
    JWT_SECRET
  );

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doctorId.toString(), doctorId: doctorId.toString() },
    JWT_SECRET
  );

  adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: hospitalId.toString(), hospitalId: hospitalId.toString() },
    JWT_SECRET
  );
});

beforeEach(async () => {
  await Appointment.deleteMany({});

  appt1 = await Appointment.create({
    family_member_id: familyMemberId,
    doctor_id: doctorId,
    hospital_id: hospitalId,
    department_id: departmentId,
    appointment_date: new Date('2026-10-20'),
    start_time: '10:00',
    end_time: '10:30',
    status: 'BOOKED',
    appointment_type: 'BOOKED',
  });

  await Appointment.create({
    family_member_id: familyMemberId,
    doctor_id: doctorId,
    hospital_id: hospitalId,
    department_id: departmentId,
    appointment_date: new Date('2026-10-20'),
    start_time: '11:00',
    end_time: '11:30',
    status: 'BOOKED',
    appointment_type: 'BOOKED',
  });
});

afterAll(async () => {
  await Appointment.deleteMany({});
  await mongoose.connection.close();
});

describe('Appointment Lifecycle Suite', () => {
  test('1. Reschedules an active appointment with new time slot (200)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/reschedule`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        appointmentDate: '2026-10-20',
        startTime: '14:00',
        endTime: '14:30',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESCHEDULED');
    expect(res.body.data.startTime).toBe('14:00');
    expect(res.body.data.endTime).toBe('14:30');
  });

  test('2. Rejects rescheduling to a conflicting doctor slot (409)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/reschedule`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        appointmentDate: '2026-10-20',
        startTime: '11:00',
        endTime: '11:30',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already has an appointment booked');
  });

  test('3. Cancels an appointment with reason (200)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/cancel`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        reason: 'Patient unwell to travel',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(res.body.data.cancellationReason).toBe('Patient unwell to travel');
    expect(res.body.data.cancelledAt).toBeDefined();
  });

  test('4. Rejects cancelling an already cancelled appointment (400)', async () => {
    await request(app)
      .put(`/api/appointments/${appt1._id}/cancel`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({ reason: 'Initial cancel' });

    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/cancel`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({ reason: 'Second cancel attempt' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already cancelled');
  });

  test('5. Assigned doctor marks appointment as COMPLETED (200)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  test('6. Rejects family member attempting to complete appointment (403)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/complete`)
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot mark appointments completed');
  });

  test('7. Lifecycle status transitions: CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED (200)', async () => {
    // 1. Confirm
    let res = await request(app)
      .put(`/api/appointments/${appt1._id}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');

    // 2. Check In
    res = await request(app)
      .put(`/api/appointments/${appt1._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CHECKED_IN' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CHECKED_IN');

    // 3. In Progress
    res = await request(app)
      .put(`/api/appointments/${appt1._id}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');

    // 4. Completed
    res = await request(app)
      .put(`/api/appointments/${appt1._id}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  test('8. Rejects invalid status transition on completed appointment (400)', async () => {
    await Appointment.findByIdAndUpdate(appt1._id, { status: 'COMPLETED' });

    const res = await request(app)
      .put(`/api/appointments/${appt1._id}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
