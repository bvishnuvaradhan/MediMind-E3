import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Consultation from '../src/models/Consultation.js';
import { jest } from '@jest/globals';
import { internalServices } from '../src/utils/internalServices.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_records_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let familyMemberId, doctorId, otherDoctorId, appointmentId, adminId;
let familyToken, doctorToken, otherDoctorToken, adminToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Consultation.deleteMany({});

  familyMemberId = new mongoose.Types.ObjectId();
  doctorId = new mongoose.Types.ObjectId();
  otherDoctorId = new mongoose.Types.ObjectId();
  appointmentId = new mongoose.Types.ObjectId();
  adminId = new mongoose.Types.ObjectId();

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: new mongoose.Types.ObjectId().toString() },
    JWT_SECRET
  );

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doctorId.toString(), doctorId: doctorId.toString() },
    JWT_SECRET
  );

  otherDoctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: otherDoctorId.toString(), doctorId: otherDoctorId.toString() },
    JWT_SECRET
  );

  adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: adminId.toString(), hospitalId: adminId.toString() },
    JWT_SECRET
  );
});

afterAll(async () => {
  await Consultation.deleteMany({});
  await mongoose.connection.close();
});

describe('Consultation Lifecycle & Verification Suite', () => {
  let createdConsultationId;

  test('1. Non-doctor cannot create consultation (403)', async () => {
    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId,
        appointmentId,
        symptoms: 'Fever and chills',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('2. Rejects consultation when appointment belongs to another doctor (403)', async () => {
    const spy = jest.spyOn(internalServices, 'getAppointment').mockResolvedValueOnce({
      _id: appointmentId,
      doctorId: otherDoctorId,
      familyMemberId,
    });

    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        familyMemberId,
        appointmentId,
        symptoms: 'Fever and chills',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot create consultation for another doctor');
    spy.mockRestore();
  });

  test('3. Doctor successfully creates consultation in DRAFT state (201)', async () => {
    const spy = jest.spyOn(internalServices, 'getAppointment').mockResolvedValueOnce({
      _id: appointmentId,
      doctorId,
      familyMemberId,
    });

    const res = await request(app)
      .post('/api/consultations')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        familyMemberId,
        appointmentId,
        symptoms: 'Persistent cough, mild fever 100F',
        observations: 'Clear breath sounds, no rales',
        clinicalAssessment: 'Upper respiratory tract infection',
        treatmentPlan: 'Hydration and symptomatic relief',
        notes: 'Follow up in 5 days if cough persists',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.finalizedAt).toBeNull();
    createdConsultationId = res.body.data.id || res.body.data._id;
    spy.mockRestore();
  });

  test('4. Doctor updates consultation while still in DRAFT status (200)', async () => {
    const res = await request(app)
      .put(`/api/consultations/${createdConsultationId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        observations: 'Slight throat erythema, clear breath sounds',
        notes: 'Advised warm saline gargles',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.observations).toBe('Slight throat erythema, clear breath sounds');
  });

  test('5. Other doctor cannot update this DRAFT consultation (403)', async () => {
    const res = await request(app)
      .put(`/api/consultations/${createdConsultationId}`)
      .set('Authorization', `Bearer ${otherDoctorToken}`)
      .send({
        observations: 'Hacked observations',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('6. Doctor finalizes consultation (DRAFT -> FINAL) (200)', async () => {
    const res = await request(app)
      .put(`/api/consultations/${createdConsultationId}/finalize`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('FINAL');
    expect(res.body.data.finalizedAt).not.toBeNull();
  });

  test('7. Editing FINAL consultation directly is rejected (400)', async () => {
    const res = await request(app)
      .put(`/api/consultations/${createdConsultationId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        observations: 'Direct modification attempt',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Cannot edit a consultation that is final');
  });

  test('8. Doctor amends consultation (AMENDED record linked via amendment_of) (201)', async () => {
    const res = await request(app)
      .post(`/api/consultations/${createdConsultationId}/amend`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        clinicalAssessment: 'Upper respiratory infection with acute rhinitis',
        notes: 'Patient reported nasal congestion on second check',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AMENDED');
    expect(res.body.data.amendmentOf.toString()).toBe(createdConsultationId.toString());
  });

  test('9. Hospital Admin cannot view consultations (403)', async () => {
    const res = await request(app)
      .get(`/api/consultations/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('administrative roles cannot access private patient consultations');
  });
});
