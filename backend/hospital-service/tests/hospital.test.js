import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Hospital from '../src/models/Hospital.js';
import Department from '../src/models/Department.js';
import DepartmentHead from '../src/models/DepartmentHead.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/medimind_hospital_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

let hospA, hospB;
let chairmanToken, adminAToken, doctorToken;

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
    address: {
      street: '45 Healthcare Enclave',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560076',
    },
    phone: '+91 80 2345 6789',
    email: 'contact@medimind.hospital',
    status: 'ACTIVE',
  });

  hospB = await Hospital.create({
    name: 'Apex Metro Healthcare',
    code: 'APEX-HYD-02',
    address: {
      street: '88 HITEC City Main Rd',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
    },
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

  doctorToken = jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'DOCTOR' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
});

describe('1. Hospital Retrieval & Permissions', () => {
  it('allows public or authenticated listing of hospitals', async () => {
    const res = await request(app).get('/api/hospitals');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('filters hospitals by search term or city', async () => {
    const res = await request(app).get('/api/hospitals?city=Bengaluru');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].city).toBe('Bengaluru');
  });

  it('restricts Hospital Admin to only see their assigned hospital when listing', async () => {
    const res = await request(app)
      .get('/api/hospitals')
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(hospA._id.toString());
  });

  it('allows retrieval of single hospital by ID', async () => {
    const res = await request(app).get(`/api/hospitals/${hospA._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('MediMind Central Hospital');
    expect(res.body.data.hospitalId).toBe(hospA._id.toString());
  });

  it('BLOCKS Hospital Admin from accessing another hospital details (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/hospitals/${hospB._id}`)
      .set('Authorization', `Bearer ${adminAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('restricted to their assigned hospital');
  });
});

describe('2. Hospital Modification & Scoping', () => {
  it('allows Hospital Admin to update their own hospital details', async () => {
    const res = await request(app)
      .put(`/api/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        tagline: 'Premier Healthcare Destination',
        phone: '+91 80 9999 8888',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe('+91 80 9999 8888');

    const updated = await Hospital.findById(hospA._id);
    expect(updated.tagline).toBe('Premier Healthcare Destination');
  });

  it('BLOCKS Hospital Admin from updating another hospital (403 Forbidden)', async () => {
    const res = await request(app)
      .put(`/api/hospitals/${hospB._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Malicious Rename Attempt',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows Chairman to update any hospital', async () => {
    const res = await request(app)
      .put(`/api/hospitals/${hospB._id}`)
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({
        status: 'INACTIVE',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });

  it('rejects update from unauthorized role (DOCTOR) with 403', async () => {
    const res = await request(app)
      .put(`/api/hospitals/${hospA._id}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        phone: '+91 80 0000 0000',
      });

    expect(res.status).toBe(403);
  });
});

describe('3. Hospital Direct Creation & Health Check', () => {
  it('allows Chairman to create a hospital directly', async () => {
    const res = await request(app)
      .post('/api/hospitals')
      .set('Authorization', `Bearer ${chairmanToken}`)
      .send({
        name: 'KIMS Global Health',
        code: 'KIMS-HYD-01',
        phone: '+91 40 1234 5678',
        email: 'contact@kims.hospital',
        city: 'Hyderabad',
        state: 'Telangana',
        address: '1-8-31/1 Minister Rd',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('KIMS Global Health');
  });

  it('rejects hospital creation by non-Chairman with 403', async () => {
    const res = await request(app)
      .post('/api/hospitals')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Unauthorized Hospital',
        phone: '+91 80 1111 2222',
        email: 'fake@hospital.com',
      });

    expect(res.status).toBe(403);
  });

  it('GET /health returns 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.service).toBe('hospital-service');
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.database).toBe('connected');
  });
});
