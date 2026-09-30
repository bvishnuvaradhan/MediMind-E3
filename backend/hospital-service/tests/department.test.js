import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Hospital from '../src/models/Hospital.js';
import Department from '../src/models/Department.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_hospital_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospA, hospB;
let chairmanToken, adminAToken, adminBToken, doctorToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Hospital.deleteMany({});
  await Department.deleteMany({});
});

afterAll(async () => {
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Hospital.deleteMany({});
  await Department.deleteMany({});

  hospA = await Hospital.create({
    name: 'MediMind Central Hospital',
    code: 'MM-BLR-01',
    address: { street: 'Bannerghatta Rd', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '560076' },
    phone: '+91 80 2345 6789',
    email: 'contact@medimind.hospital',
    status: 'ACTIVE',
  });

  hospB = await Hospital.create({
    name: 'Apex Metro Healthcare',
    code: 'APEX-HYD-02',
    address: { street: 'HITEC City', city: 'Hyderabad', state: 'Telangana', country: 'India', pincode: '500081' },
    phone: '+91 40 4567 8900',
    email: 'contact@apexmetro.hospital',
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
      referenceId: hospA._id.toString(),
      hospitalId: hospA._id.toString(),
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  adminBToken = jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: 'HOSPITAL_ADMIN',
      referenceId: hospB._id.toString(),
      hospitalId: hospB._id.toString(),
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
});

describe('1. Department Creation & Scoping', () => {
  it('allows Hospital Admin to create a department in their own hospital', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        hospital_id: hospA._id.toString(),
        name: 'Cardiology',
        code: 'CARDIO',
        specialization: 'Interventional Cardiology',
        bedCapacity: 60,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Cardiology');
    expect(res.body.data.hospitalId).toBe(hospA._id.toString());
  });

  it('BLOCKS Hospital Admin from creating a department in another hospital (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        hospital_id: hospB._id.toString(),
        name: 'Neurology',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot create departments in another hospital');
  });

  it('ENFORCES department name uniqueness within the same hospital (409 Conflict)', async () => {
    await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        hospital_id: hospA._id.toString(),
        name: 'Orthopedics',
      });

    const dupRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        hospital_id: hospA._id.toString(),
        name: 'Orthopedics',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toContain('already exists in this hospital');
  });

  it('ALLOWS the same department name in a different hospital', async () => {
    await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ hospital_id: hospA._id.toString(), name: 'Orthopedics' });

    const hospBRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({ hospital_id: hospB._id.toString(), name: 'Orthopedics' });

    expect(hospBRes.status).toBe(201);
    expect(hospBRes.body.success).toBe(true);
  });

  it('rejects unauthorized role (DOCTOR) creating a department (403)', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ hospital_id: hospA._id.toString(), name: 'Pediatrics' });

    expect(res.status).toBe(403);
  });
});

describe('2. Department Listing & Updates', () => {
  let deptA1, deptB1;

  beforeEach(async () => {
    deptA1 = await Department.create({
      hospital_id: hospA._id,
      name: 'Cardiology',
      code: 'CARDIO',
      status: 'ACTIVE',
    });
    await Department.create({
      hospital_id: hospA._id,
      name: 'Orthopedics',
      code: 'ORTHO',
      status: 'ACTIVE',
    });
    deptB1 = await Department.create({
      hospital_id: hospB._id,
      name: 'Neurology',
      code: 'NEURO',
      status: 'ACTIVE',
    });
  });

  it('restricts Hospital Admin to only see departments in their hospital', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.map((d) => d.name)).toEqual(['Cardiology', 'Orthopedics']);
  });

  it('allows Chairman to see all departments across all hospitals', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${chairmanToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('allows Hospital Admin to update department in their hospital', async () => {
    const res = await request(app)
      .put(`/api/departments/${deptA1._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        specialization: 'Advanced Coronary Care',
        bedCapacity: 80,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Department.findById(deptA1._id);
    expect(updated.specialization).toBe('Advanced Coronary Care');
    expect(updated.bedCapacity).toBe(80);
  });

  it('BLOCKS Hospital Admin from updating department in another hospital (403)', async () => {
    const res = await request(app)
      .put(`/api/departments/${deptB1._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Unauthorized Rename',
      });

    expect(res.status).toBe(403);
  });
});
