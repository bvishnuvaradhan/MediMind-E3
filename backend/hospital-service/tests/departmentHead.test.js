import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Hospital from '../src/models/Hospital.js';
import Department from '../src/models/Department.js';
import DepartmentHead from '../src/models/DepartmentHead.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_hospital_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospA, hospB, deptA, deptB;
let adminAToken, adminBToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await DepartmentHead.deleteMany({});
});

afterAll(async () => {
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await DepartmentHead.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Hospital.deleteMany({});
  await Department.deleteMany({});
  await DepartmentHead.deleteMany({});

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

  deptA = await Department.create({
    hospital_id: hospA._id,
    name: 'Cardiology',
    code: 'CARDIO',
    status: 'ACTIVE',
  });

  deptB = await Department.create({
    hospital_id: hospB._id,
    name: 'Orthopedics',
    code: 'ORTHO',
    status: 'ACTIVE',
  });

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
});

describe('1. Department Head Assignment & Scoping', () => {
  it('allows Hospital Admin to assign a department head in their hospital', async () => {
    const headUserId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/department-heads')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        user_id: headUserId,
        hospital_id: hospA._id.toString(),
        department_id: deptA._id.toString(),
        fullName: 'Dr. Priya Sharma',
        email: 'priya.sharma@medimind.org',
        phone: '+91 98765 43210',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Dr. Priya Sharma');
    expect(res.body.data.departmentId).toBe(deptA._id.toString());
  });

  it('REJECTS assigning department head when department belongs to another hospital (400)', async () => {
    const headUserId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/department-heads')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        user_id: headUserId,
        hospital_id: hospA._id.toString(),
        department_id: deptB._id.toString(), // Belongs to Hosp B!
        fullName: 'Dr. Invalid Dept',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('does not belong to the specified hospital');
  });

  it('BLOCKS Hospital Admin from assigning department heads in another hospital (403)', async () => {
    const headUserId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/department-heads')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        user_id: headUserId,
        hospital_id: hospB._id.toString(),
        department_id: deptB._id.toString(),
        fullName: 'Dr. Cross Hospital',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot assign department heads in another hospital');
  });

  it('BLOCKS duplicate active head assignment of same user to same department (409)', async () => {
    const headUserId = new mongoose.Types.ObjectId().toString();
    await request(app)
      .post('/api/department-heads')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        user_id: headUserId,
        hospital_id: hospA._id.toString(),
        department_id: deptA._id.toString(),
        fullName: 'Dr. Priya Sharma',
      });

    const dupRes = await request(app)
      .post('/api/department-heads')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        user_id: headUserId,
        hospital_id: hospA._id.toString(),
        department_id: deptA._id.toString(),
        fullName: 'Dr. Priya Sharma Duplicate',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
  });
});

describe('2. Department Head Listing & Updates', () => {
  let headA;

  beforeEach(async () => {
    headA = await DepartmentHead.create({
      user_id: new mongoose.Types.ObjectId(),
      hospital_id: hospA._id,
      department_id: deptA._id,
      full_name: 'Dr. Priya Sharma',
      email: 'priya@medimind.org',
      status: 'ACTIVE',
    });
  });

  it('restricts Hospital Admin to only see department heads in their hospital', async () => {
    const res = await request(app)
      .get('/api/department-heads')
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe('Dr. Priya Sharma');
  });

  it('BLOCKS Hospital Admin B from viewing head belonging to Hospital A (403)', async () => {
    const res = await request(app)
      .get(`/api/department-heads/${headA._id}`)
      .set('Authorization', `Bearer ${adminBToken}`);

    expect(res.status).toBe(403);
  });

  it('allows Hospital Admin A to update department head status in their hospital', async () => {
    const res = await request(app)
      .put(`/api/department-heads/${headA._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        status: 'INACTIVE',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });
});
