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

let family1Id, familyMember1Id, doctor1Id, adminId;
let familyToken, doctorToken, adminToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await MedicalRecord.deleteMany({});
  await RecordAccess.deleteMany({});

  family1Id = new mongoose.Types.ObjectId();
  familyMember1Id = new mongoose.Types.ObjectId();
  doctor1Id = new mongoose.Types.ObjectId();
  adminId = new mongoose.Types.ObjectId();

  familyToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: family1Id.toString(), familyId: family1Id.toString() },
    JWT_SECRET
  );

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR', referenceId: doctor1Id.toString(), doctorId: doctor1Id.toString() },
    JWT_SECRET
  );

  adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', referenceId: adminId.toString(), hospitalId: adminId.toString() },
    JWT_SECRET
  );
});

afterAll(async () => {
  await MedicalRecord.deleteMany({});
  await RecordAccess.deleteMany({});
  await mongoose.connection.close();
});

describe('Medical Record Management Suite', () => {
  let createdRecordId;

  test('1. Health check returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  test('2. Rejects record creation without auth token (401)', async () => {
    const res = await request(app)
      .post('/api/records')
      .send({
        familyMemberId: familyMember1Id,
        recordType: 'XRAY',
        fileName: 'chest_xray.png',
        fileUrl: 'https://storage.medimind.test/xray.png',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('3. Rejects creation with missing required fields (400)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        recordType: 'XRAY',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('4. Successfully uploads medical record by Family (201)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        familyMemberId: familyMember1Id,
        recordType: 'XRAY',
        fileName: 'chest_xray.png',
        fileUrl: 'https://storage.medimind.test/xray.png',
        description: 'Chest X-Ray anterior-posterior view',
        recordDate: '2026-10-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordType).toBe('XRAY');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.source).toBe('FAMILY');
    createdRecordId = res.body.data.id || res.body.data._id;
  });

  test('5. Family retrieves records for own member (200)', async () => {
    const res = await request(app)
      .get(`/api/records/member/${familyMember1Id}`)
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('6. Rejects cross-family record retrieval (403)', async () => {
    const foreignFamilyToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId().toString(), role: 'FAMILY', referenceId: new mongoose.Types.ObjectId().toString() },
      JWT_SECRET
    );

    const spy = jest.spyOn(internalServices, 'verifyFamilyMember').mockResolvedValueOnce({
      valid: false,
      statusCode: 403,
      message: 'Access forbidden: member belongs to another family',
    });

    const res = await request(app)
      .get(`/api/records/member/${familyMember1Id}`)
      .set('Authorization', `Bearer ${foreignFamilyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    spy.mockRestore();
  });

  test('7. Hospital Admin blocked from viewing patient clinical records (403)', async () => {
    const res = await request(app)
      .get(`/api/records/member/${familyMember1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('administrative roles cannot access private patient');
  });

  test('8. Doctor without active RecordAccess blocked from viewing records (403)', async () => {
    const res = await request(app)
      .get(`/api/records/member/${familyMember1Id}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('active doctor record access authorization required');
  });

  test('9. Updates medical record description metadata (200)', async () => {
    const res = await request(app)
      .put(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${familyToken}`)
      .send({
        description: 'Updated X-Ray note: clear lung fields',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Updated X-Ray note: clear lung fields');
  });

  test('10. Soft-deletes medical record (200)', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${familyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DELETED');

    // Verify record is excluded from active member list
    const listRes = await request(app)
      .get(`/api/records/member/${familyMember1Id}`)
      .set('Authorization', `Bearer ${familyToken}`);

    const found = listRes.body.data.some((r) => r.id.toString() === createdRecordId.toString());
    expect(found).toBe(false);
  });
});
