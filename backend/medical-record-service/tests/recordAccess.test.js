import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import MedicalRecord from '../src/models/MedicalRecord.js';
import RecordAccess from '../src/models/RecordAccess.js';
import { jest } from '@jest/globals';
import { internalServices } from '../src/utils/internalServices.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_records_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let familyId, familyMemberId, doctorId, otherDoctorId;
let familyToken, doctorToken, otherDoctorToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await MedicalRecord.deleteMany({});
  await RecordAccess.deleteMany({});

  familyId = new mongoose.Types.ObjectId();
  familyMemberId = new mongoose.Types.ObjectId();
  doctorId = new mongoose.Types.ObjectId();
  otherDoctorId = new mongoose.Types.ObjectId();

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: familyId.toString(), familyId: familyId.toString() },
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

  // Seed one active medical record for this member
  await MedicalRecord.create({
    family_member_id: familyMemberId,
    record_type: 'REPORT',
    file_name: 'blood_test.pdf',
    file_url: 'https://storage.medimind.test/blood_test.pdf',
    description: 'Complete blood count',
    record_date: new Date(),
    uploaded_by: new mongoose.Types.ObjectId(),
    source: 'FAMILY',
    status: 'ACTIVE',
  });
});

afterAll(async () => {
  await MedicalRecord.deleteMany({});
  await RecordAccess.deleteMany({});
  await mongoose.connection.close();
});

describe('Record Access Authorization Suite', () => {
  let createdAccessId;

  test('1. Doctor cannot grant record access (403)', async () => {
    const res = await request(app)
      .post('/api/records/access')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        familyMemberId,
        doctorId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('2. Rejects grant with missing doctorId or familyMemberId (400)', async () => {
    const res = await request(app)
      .post('/api/records/access')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('3. Family successfully grants doctor full record access for member (201)', async () => {
    const res = await request(app)
      .post('/api/records/access')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId,
        doctorId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.doctorId.toString()).toBe(doctorId.toString());
    createdAccessId = res.body.data.id || res.body.data._id;
  });

  test('4. Idempotent / returns existing active access if granted again (201)', async () => {
    const res = await request(app)
      .post('/api/records/access')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId,
        doctorId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.id.toString()).toBe(createdAccessId.toString());
  });

  test('5. Family retrieves active record accesses for member (200)', async () => {
    const res = await request(app)
      .get(`/api/records/access/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].doctorId.toString()).toBe(doctorId.toString());
  });

  test('6. Doctor retrieves own access history via /api/records/access/doctor/me (200)', async () => {
    const res = await request(app)
      .get('/api/records/access/doctor/me')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.some((a) => a.familyMemberId.toString() === familyMemberId.toString());
    expect(found).toBe(true);
  });

  test('7. Authorized doctor can now read patient medical records (200)', async () => {
    const res = await request(app)
      .get(`/api/records/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('8. Other unauthorized doctor is blocked from reading records (403)', async () => {
    const res = await request(app)
      .get(`/api/records/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${otherDoctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('9. Family successfully revokes record access (200)', async () => {
    const res = await request(app)
      .put(`/api/records/access/${createdAccessId}/revoke`)
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REVOKED');
    expect(res.body.data.revokedAt).not.toBeNull();
  });

  test('10. Revoking already-revoked access returns 400', async () => {
    const res = await request(app)
      .put(`/api/records/access/${createdAccessId}/revoke`)
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already revoked');
  });

  test('11. Doctor is blocked from reading records after access is revoked (403)', async () => {
    const res = await request(app)
      .get(`/api/records/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('active doctor record access authorization required');
  });

  test('12. RULE VERIFICATION: Doctor with confirmed appointment alone cannot view records without RecordAccess (403)', async () => {
    // Mock getAppointment returning this doctor's appointment
    const spy = jest.spyOn(internalServices, 'getAppointment').mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      doctorId,
      familyMemberId,
      status: 'CONFIRMED',
    });

    const res = await request(app)
      .get(`/api/records/member/${familyMemberId}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('active doctor record access authorization required');
    spy.mockRestore();
  });
});
