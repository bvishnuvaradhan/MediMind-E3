import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import Family from '../src/models/Family.js';

const TEST_DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_family_test';
const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await Family.deleteMany({});
});

afterAll(async () => {
  await Family.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Family.deleteMany({});
});

describe('1. Family Account Creation (POST /api/families)', () => {
  it('creates a new family account with valid inputs', async () => {
    const payload = {
      familyName: 'Kapoor Family',
      email: 'rohan.kapoor@example.com',
      mobile: '+91 98765 43210',
    };

    const res = await request(app)
      .post('/api/families')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Family account created successfully');
    expect(res.body.data.familyName).toBe('Kapoor Family');
    expect(res.body.data.email).toBe('rohan.kapoor@example.com');
    expect(res.body.data.mobile).toBe('+91 98765 43210');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.familyId).toBeDefined();
  });

  it('rejects duplicate email with 409 conflict', async () => {
    const payload = {
      familyName: 'Kapoor Family',
      email: 'rohan.kapoor@example.com',
      mobile: '+91 98765 43210',
    };

    await request(app).post('/api/families').send(payload);
    const dupRes = await request(app).post('/api/families').send(payload);

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toContain('already exists');
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/families')
      .send({ familyName: 'Incomplete Family' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Get & Update My Family (GET & PUT /api/families/me)', () => {
  let creatorId;
  let family;
  let token;

  beforeEach(async () => {
    creatorId = new mongoose.Types.ObjectId();
    family = await Family.create({
      family_name: 'Kapoor Family',
      creator_user_id: creatorId,
      email: 'rohan.kapoor@example.com',
      mobile: '+91 98765 43210',
      status: 'ACTIVE',
    });

    token = jwt.sign(
      {
        userId: creatorId.toString(),
        role: 'FAMILY',
        referenceId: family._id.toString(),
      },
      JWT_SECRET
    );
  });

  it('retrieves family account with valid JWT', async () => {
    const res = await request(app)
      .get('/api/families/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.familyId).toBe(family._id.toString());
    expect(res.body.data.familyName).toBe('Kapoor Family');
    expect(res.body.data.email).toBe('rohan.kapoor@example.com');
  });

  it('retrieves family account using Gateway trusted headers', async () => {
    const res = await request(app)
      .get('/api/families/me')
      .set('x-internal-service-secret', INTERNAL_SECRET)
      .set('x-user-id', creatorId.toString())
      .set('x-user-role', 'FAMILY')
      .set('x-user-reference-id', family._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.familyId).toBe(family._id.toString());
  });

  it('updates family account by creator', async () => {
    const res = await request(app)
      .put('/api/families/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        familyName: 'Kapoor Household Updated',
        mobile: '+91 98765 99999',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Family account updated successfully');
    expect(res.body.data.familyName).toBe('Kapoor Household Updated');
    expect(res.body.data.mobile).toBe('+91 98765 99999');
  });

  it('rejects update when caller is not the creator (403)', async () => {
    const otherMemberUserId = new mongoose.Types.ObjectId();
    const otherMemberToken = jwt.sign(
      {
        userId: otherMemberUserId.toString(),
        role: 'FAMILY',
        referenceId: family._id.toString(),
      },
      JWT_SECRET
    );

    const res = await request(app)
      .put('/api/families/me')
      .set('Authorization', `Bearer ${otherMemberToken}`)
      .send({ familyName: 'Unauthorized Name Change' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('only the family account creator');
  });

  it('rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/families/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects request with wrong role (e.g. DOCTOR) with 403', async () => {
    const docToken = jwt.sign(
      {
        userId: 'doc_123',
        role: 'DOCTOR',
        referenceId: 'ref_123',
      },
      JWT_SECRET
    );

    const res = await request(app)
      .get('/api/families/me')
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('insufficient role permissions');
  });
});

describe('3. Family Service Health Endpoint', () => {
  it('GET /health returns 200 with service name and database status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('family-service');
    expect(res.body.data.database).toBe('connected');
  });
});
