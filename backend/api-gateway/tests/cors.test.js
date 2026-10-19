import request from 'supertest';
import app from '../src/app.js';

describe('Gateway CORS Security & Policy Enforcement', () => {
  it('allows request from configured allowed origin (http://localhost:5173)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows request from configured allowed origin (http://localhost:3000)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows request with absent Origin header (server-to-server / curl)', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.body.success).toBe(true);
  });

  it('rejects request from disallowed attacker origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://malicious-site.com');

    // CORS policy rejection triggers errorHandler (status 500)
    expect(res.status).toBe(500);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('CORS policy rejection');
  });

  it('rejects preflight OPTIONS request from disallowed origin', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://evil.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(500);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows preflight OPTIONS request from allowed origin with credentials and methods', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
  });
});
