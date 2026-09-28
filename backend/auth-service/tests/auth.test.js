import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import { generateToken, verifyToken } from '../src/utils/jwt.js';

const TEST_DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_auth_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('1. Password Utility Tests', () => {
  it('hashes password and verifies successfully', async () => {
    const raw = 'SecurePass123!';
    const hash = await hashPassword(raw);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isMismatch = await verifyPassword('WrongPassword', hash);
    expect(isMismatch).toBe(false);
  });

  it('handles invalid password input safely', async () => {
    await expect(hashPassword('')).rejects.toThrow();
    const isMatch = await verifyPassword('', 'somehash');
    expect(isMatch).toBe(false);
  });
});

describe('2. JWT Utility Tests', () => {
  it('generates and verifies valid token with role and referenceId', () => {
    const payload = {
      userId: '67abc1234567890123456789',
      role: 'DOCTOR',
      referenceId: '67def1234567890123456789',
    };

    const token = generateToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.referenceId).toBe(payload.referenceId);
  });

  it('rejects expired token properly', async () => {
    const token = generateToken({ userId: '123', role: 'FAMILY', referenceId: '456' }, { expiresIn: '1ms' });
    // Wait 50ms to ensure expiration
    await new Promise((r) => setTimeout(r, 50));
    expect(() => verifyToken(token)).toThrow();
  });

  it('rejects tampered token', () => {
    const token = generateToken({ userId: '123', role: 'CHAIRMAN' });
    const tampered = token.slice(0, -4) + 'abcd';
    expect(() => verifyToken(tampered)).toThrow();
  });
});

describe('3. Database & Role Handling Tests', () => {
  const roles = [
    { role: 'FAMILY', account_type: 'FAMILY_ACCOUNT' },
    { role: 'DOCTOR', account_type: 'DOCTOR_ACCOUNT' },
    { role: 'DEPARTMENT_HEAD', account_type: 'DEPARTMENT_HEAD_ACCOUNT' },
    { role: 'HOSPITAL_ADMIN', account_type: 'HOSPITAL_ADMIN_ACCOUNT' },
    { role: 'CHAIRMAN', account_type: 'CHAIRMAN_ACCOUNT' },
  ];

  test.each(roles)('successfully persists and verifies user with role %s', async ({ role, account_type }) => {
    const email = `${role.toLowerCase()}@medimind.org`;
    const passwordHash = await hashPassword('password123');
    const refId = new mongoose.Types.ObjectId();

    const user = await User.create({
      email,
      password_hash: passwordHash,
      role,
      account_type,
      reference_id: refId,
      status: 'ACTIVE',
    });

    expect(user._id).toBeDefined();
    expect(user.role).toBe(role);
    expect(user.account_type).toBe(account_type);
    expect(user.reference_id.toString()).toBe(refId.toString());
    expect(user.status).toBe('ACTIVE');

    const publicJson = user.toPublicJSON();
    expect(publicJson.password_hash).toBeUndefined();
    expect(publicJson.role).toBe(role);
    expect(publicJson.accountType).toBe(account_type);
  });

  it('enforces unique email constraint', async () => {
    const hash = await hashPassword('pass123');
    await User.create({
      email: 'unique@medimind.org',
      password_hash: hash,
      role: 'FAMILY',
      account_type: 'FAMILY_ACCOUNT',
      reference_id: new mongoose.Types.ObjectId(),
    });

    await expect(
      User.create({
        email: 'unique@medimind.org',
        password_hash: hash,
        role: 'DOCTOR',
        account_type: 'DOCTOR_ACCOUNT',
        reference_id: new mongoose.Types.ObjectId(),
      })
    ).rejects.toThrow();
  });
});

describe('4. Auth API Endpoint Tests', () => {
  let activeUser;
  let _inactiveUser;
  const rawPassword = 'Password@123';

  beforeEach(async () => {
    const hash = await hashPassword(rawPassword);
    activeUser = await User.create({
      email: 'dr.sharma@medimind.org',
      password_hash: hash,
      role: 'DEPARTMENT_HEAD',
      account_type: 'DEPARTMENT_HEAD_ACCOUNT',
      reference_id: new mongoose.Types.ObjectId(),
      status: 'ACTIVE',
    });

    _inactiveUser = await User.create({
      email: 'inactive@medimind.org',
      password_hash: hash,
      role: 'DOCTOR',
      account_type: 'DOCTOR_ACCOUNT',
      reference_id: new mongoose.Types.ObjectId(),
      status: 'INACTIVE',
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid credentials and returns JWT + user info', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dr.sharma@medimind.org',
          password: rawPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('dr.sharma@medimind.org');
      expect(res.body.data.user.role).toBe('DEPARTMENT_HEAD');
      expect(res.body.data.user.accountType).toBe('DEPARTMENT_HEAD_ACCOUNT');

      // Verify token content
      const decoded = verifyToken(res.body.data.token);
      expect(decoded.userId).toBe(activeUser._id.toString());
      expect(decoded.role).toBe('DEPARTMENT_HEAD');
    });

    it('rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dr.sharma@medimind.org',
          password: 'IncorrectPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@medimind.org',
          password: rawPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('rejects missing fields with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr.sharma@medimind.org' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects inactive account with 403', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@medimind.org',
          password: rawPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('inactive or suspended');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user when valid JWT is provided', async () => {
      const token = generateToken({
        userId: activeUser._id.toString(),
        role: activeUser.role,
        referenceId: activeUser.reference_id.toString(),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(activeUser._id.toString());
      expect(res.body.data.email).toBe('dr.sharma@medimind.org');
      expect(res.body.data.role).toBe('DEPARTMENT_HEAD');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_malformed_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid authentication token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 on logout with valid token', async () => {
      const token = generateToken({
        userId: activeUser._id.toString(),
        role: activeUser.role,
      });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('successfully changes password and allows login with new password', async () => {
      const token = generateToken({
        userId: activeUser._id.toString(),
        role: activeUser.role,
      });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: rawPassword,
          newPassword: 'BrandNewPassword!456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password updated successfully');

      // Verify old password fails
      const failLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dr.sharma@medimind.org',
          password: rawPassword,
        });
      expect(failLogin.status).toBe(401);

      // Verify new password succeeds
      const successLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'dr.sharma@medimind.org',
          password: 'BrandNewPassword!456',
        });
      expect(successLogin.status).toBe(200);
      expect(successLogin.body.success).toBe(true);
    });

    it('rejects incorrect current password with 400', async () => {
      const token = generateToken({
        userId: activeUser._id.toString(),
        role: activeUser.role,
      });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: 'BrandNewPassword!456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Current password is incorrect');
    });
  });

  describe('GET /health', () => {
    it('returns UP status and database state', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
      expect(res.body.data.service).toBe('auth-service');
      expect(res.body.data.database).toBe('connected');
    });
  });
});
