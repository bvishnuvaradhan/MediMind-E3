import http from 'http';
import express from 'express';
import request from 'supertest';
import { forwardRequest } from '../src/utils/proxy.js';

describe('DEF-001 Regression Suite: API Gateway Proxy Content-Length & Body Forwarding', () => {
  let targetServer;
  let targetPort;
  let receivedHeaders = {};
  let receivedBody = null;
  let gatewayApp;

  beforeAll((done) => {
    // 1. Create a dummy downstream target server on an ephemeral port (0)
    targetServer = http.createServer((req, res) => {
      receivedHeaders = { ...req.headers };
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });
      req.on('end', () => {
        try {
          receivedBody = bodyData ? JSON.parse(bodyData) : null;
        } catch {
          receivedBody = bodyData;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, echoedBody: receivedBody }));
      });
    });

    targetServer.listen(0, '127.0.0.1', () => {
      targetPort = targetServer.address().port;

      // 2. Setup a lightweight Express gateway app using forwardRequest
      gatewayApp = express();
      gatewayApp.use(express.json());
      gatewayApp.use('/proxy-target', forwardRequest(`http://127.0.0.1:${targetPort}`));

      done();
    });
  });

  afterAll((done) => {
    targetServer.close(done);
  });

  beforeEach(() => {
    receivedHeaders = {};
    receivedBody = null;
  });

  test('POST with JSON body strips client content-length and successfully forwards payload without Undici error', async () => {
    const payload = { testKey: 'valuableClinicalData', amount: 42 };

    const response = await request(gatewayApp)
      .post('/proxy-target/api/test-endpoint')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.echoedBody).toEqual(payload);
    expect(receivedBody).toEqual(payload);
    // Downstream receives correct content-length matching stringified JSON
    const expectedLen = Buffer.byteLength(JSON.stringify(payload));
    expect(Number(receivedHeaders['content-length'])).toBe(expectedLen);
  });

  test('GET request forwards without body and strips content-length', async () => {
    const response = await request(gatewayApp)
      .get('/proxy-target/api/health')
      .set('Content-Length', '0');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Returns 503 when downstream service is offline', async () => {
    const offlineApp = express();
    offlineApp.use(express.json());
    // Use an unassigned port
    offlineApp.use('/offline', forwardRequest('http://127.0.0.1:59999'));

    const response = await request(offlineApp)
      .post('/offline/test')
      .send({ ping: 'pong' });

    expect(response.status).toBe(503);
    expect(response.body.message).toContain('Downstream service temporarily unavailable');
  });
});
