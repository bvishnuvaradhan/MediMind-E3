import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Hospital from '../src/models/Hospital.js';
import Department from '../src/models/Department.js';
import HospitalRequest from '../src/models/HospitalRequest.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_hospital_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let chairmanToken, adminToken, doctorToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await HospitalRequest.deleteMany({});
});

afterAll(async () => {
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await HospitalRequest.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await HospitalRequest.deleteMany({});

  chairmanToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'CHAIRMAN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  adminToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'HOSPITAL_ADMIN', hospitalId: 'HOSP-001' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
});

describe('1. Hospital Onboarding Submission', () => {
  it('allows public submission of a hospital onboarding request', async () => {
    const res = await request(app)
      .post('/api/hospitals/requests')
      .send({
        name: 'Aster Prime Healthcare',
        city: 'Hyderabad',
        state: 'Telangana',
        address: 'Plot 4, HITEC City Main Rd',
        contactPerson: 'Dr. Ramesh Naidu',
        phone: '+91 40 4969 1100',
        email: 'ramesh.naidu@asterprime.health',
        requestedDepartments: ['Orthopedics', 'Cardiology'],
        bedCapacity: 350,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Aster Prime Healthcare');
    expect(res.body.data.status).toBe('PENDING');

    const created = await HospitalRequest.findById(res.body.data.requestId);
    expect(created.status).toBe('PENDING');
  });

  it('rejects submission when required fields are missing with 400', async () => {
    const res = await request(app)
      .post('/api/hospitals/requests')
      .send({
        name: 'Incomplete Hospital',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Request Listing & Scoping', () => {
  beforeEach(async () => {
    await HospitalRequest.create({
      name: 'Pending Hospital 1',
      city: 'Hyderabad',
      state: 'Telangana',
      address: 'Road 1',
      contactPerson: 'Dr. One',
      phone: '+91 40 1111 2222',
      email: 'h1@example.com',
      status: 'PENDING',
    });
    await HospitalRequest.create({
      name: 'Approved Hospital 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: 'Road 2',
      contactPerson: 'Dr. Two',
      phone: '+91 80 2222 3333',
      email: 'h2@example.com',
      status: 'APPROVED',
    });
  });

  it('allows Chairman to view all onboarding requests', async () => {
    const res = await request(app)
      .get('/api/hospitals/requests')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('allows Chairman to filter requests by status', async () => {
    const res = await request(app)
      .get('/api/hospitals/requests?status=PENDING')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Pending Hospital 1');
  });

  it('BLOCKS non-Chairman roles (Hospital Admin, Doctor) from viewing requests (403)', async () => {
    const adminRes = await request(app)
      .get('/api/hospitals/requests')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(403);

    const docRes = await request(app)
      .get('/api/hospitals/requests')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docRes.status).toBe(403);
  });
});

describe('3. Onboarding Decision Workflow (Approve / Reject)', () => {
  let pendingReq;

  beforeEach(async () => {
    pendingReq = await HospitalRequest.create({
      name: 'Aster Prime Healthcare',
      code: 'REQ-AST-01',
      type: 'Tertiary Care Hospital',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      address: 'Plot 4, HITEC City Main Rd',
      contactPerson: 'Dr. Ramesh Naidu',
      phone: '+91 40 4969 1100',
      email: 'ramesh.naidu@asterprime.health',
      requestedDepartments: ['Orthopedics', 'Cardiology'],
      bedCapacity: 350,
      status: 'PENDING',
    });
  });

  it('allows Chairman to APPROVE request, creating new Hospital and Departments', async () => {
    const res = await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/approve`)
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('APPROVED');

    // Verify hospital created in DB
    const hospital = await Hospital.findById(res.body.data.hospital.id);
    expect(hospital).toBeDefined();
    expect(hospital.name).toBe('Aster Prime Healthcare');
    expect(hospital.status).toBe('ACTIVE');

    // Verify requested departments created
    const depts = await Department.find({ hospital_id: hospital._id });
    expect(depts.length).toBe(2);
    expect(depts.map((d) => d.name)).toEqual(expect.arrayContaining(['Orthopedics', 'Cardiology']));

    // Verify request updated with link
    const updatedReq = await HospitalRequest.findById(pendingReq._id);
    expect(updatedReq.status).toBe('APPROVED');
    expect(updatedReq.created_hospital_id.toString()).toBe(hospital._id.toString());
  });

  it('BLOCKS non-Chairman from approving requests with 403', async () => {
    const res = await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it('REJECTS approving an already approved/rejected request with 400', async () => {
    await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/approve`)
      .set('Authorization', `Bearer ${chairmanToken}`);

    const secondApprove = await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/approve`)
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(secondApprove.status).toBe(400);
    expect(secondApprove.body.message).toContain('already APPROVED');
  });

  it('allows Chairman to REJECT request with a reason', async () => {
    const res = await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/reject`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({
        reason: 'Incomplete compliance documentation',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.request.status).toBe('REJECTED');
    expect(res.body.data.request.rejectionReason).toBe('Incomplete compliance documentation');

    const updated = await HospitalRequest.findById(pendingReq._id);
    expect(updated.status).toBe('REJECTED');
    expect(updated.rejectionReason).toBe('Incomplete compliance documentation');
  });

  it('REJECTS rejecting an already decided request with 400', async () => {
    await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/reject`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({ reason: 'First rejection' });

    const secondReject = await request(app)
      .put(`/api/hospitals/requests/${pendingReq._id}/reject`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({ reason: 'Second rejection attempt' });

    expect(secondReject.status).toBe(400);
  });
});
