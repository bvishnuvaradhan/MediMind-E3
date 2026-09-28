import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import { requireRole } from '../src/middleware/roleMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

let mockAuthServer;
let receivedDownstreamHeaders = {};
let receivedDownstreamBody = null;

beforeAll((done) => {
  // Mock downstream Auth Service listening on port 5001
  mockAuthServer = http.createServer((req, res) => {
    receivedDownstreamHeaders = { ...req.headers };
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      receivedDownstreamBody = body ? JSON.parse(body) : null;
      if (req.url === '/api/auth/login') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Login successful',
          data: { token: 'mock_token', user: { role: 'DOCTOR' } },
        }));
      } else if (req.url === '/api/auth/me') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            userId: req.headers['x-user-id'],
            role: req.headers['x-user-role'],
            referenceId: req.headers['x-user-reference-id'],
          },
        }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      }
    });
  });

  mockAuthServer.listen(5001, done);
});

afterAll((done) => {
  mockAuthServer.close(done);
});

beforeEach(() => {
  receivedDownstreamHeaders = {};
  receivedDownstreamBody = null;
});

describe('1. API Gateway Health & Identification', () => {
  it('GET /health returns 200 with service status and x-request-id', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('api-gateway');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('preserves client-supplied x-request-id header', async () => {
    const customId = 'client-custom-req-id-12345';
    const res = await request(app)
      .get('/health')
      .set('x-request-id', customId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customId);
  });
});

describe('2. Public vs Protected Routes & Authentication', () => {
  it('allows public POST /api/auth/login without token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@medimind.org', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(receivedDownstreamBody).toEqual({ email: 'doctor@medimind.org', password: 'password123' });
  });

  it('rejects protected GET /api/auth/me without token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No token provided');
  });

  it('rejects malformed token with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer totally_invalid_token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired authentication token');
  });

  it('rejects expired token with 401', async () => {
    const expiredToken = jwt.sign(
      { userId: 'u1', role: 'DOCTOR' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
  });
});

describe('3. Token Forwarding, Trusted Identity & Anti-Spoofing', () => {
  const validToken = jwt.sign(
    {
      userId: 'user_doc_999',
      role: 'DOCTOR',
      referenceId: 'ref_profile_777',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  it('forwards valid request and injects trusted identity headers', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(receivedDownstreamHeaders['x-user-id']).toBe('user_doc_999');
    expect(receivedDownstreamHeaders['x-user-role']).toBe('DOCTOR');
    expect(receivedDownstreamHeaders['x-user-reference-id']).toBe('ref_profile_777');
  });

  it('injects internal service authentication secret', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(receivedDownstreamHeaders['x-internal-service-secret']).toBe(INTERNAL_SECRET);
  });

  it('strips client-supplied spoofed identity headers and replaces with JWT identity', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .set('x-user-id', 'spoofed_hacker_id')
      .set('x-user-role', 'CHAIRMAN')
      .set('x-internal-service-secret', 'spoofed_secret');

    expect(res.status).toBe(200);
    // Downstream must receive verified JWT data, NOT the spoofed values
    expect(receivedDownstreamHeaders['x-user-id']).toBe('user_doc_999');
    expect(receivedDownstreamHeaders['x-user-role']).toBe('DOCTOR');
    expect(receivedDownstreamHeaders['x-internal-service-secret']).toBe(INTERNAL_SECRET);
  });
});

describe('4. Role Middleware Tests', () => {
  it('allows access when user has matching role', () => {
    const req = { user: { role: 'DOCTOR' } };
    const res = {};
    const next = jest.fn();

    requireRole('DOCTOR', 'DEPARTMENT_HEAD')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user role does not match', () => {
    const req = { user: { role: 'FAMILY' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireRole('DOCTOR', 'DEPARTMENT_HEAD')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('insufficient role permissions'),
    }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe('5. Error Handling & Downstream Failure Scenarios', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/completely-unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
  });

  it('returns 503 when downstream service is offline', async () => {
    // Port 5002 (Family Service) is not running currently
    const validToken = jwt.sign({ userId: 'u1', role: 'FAMILY' }, JWT_SECRET);
    const res = await request(app)
      .get('/api/families/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Downstream service temporarily unavailable');
  });
});
