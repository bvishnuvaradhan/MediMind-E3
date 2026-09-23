import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import express from "express";
import http from "http";
import app from "../src/app.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { requireRole } from "../src/middleware/roleMiddleware.js";
import { config } from "../src/config/services.js";

const TEST_SECRET = "gateway_test_jwt_secret_key_min_32_characters_long";

beforeAll(() => {
  config.jwtSecret = TEST_SECRET;
  config.internalServiceKey = "internal_microservice_test_key";
});

describe("API Gateway — Health & Base Routes", () => {
  test("GET /health returns healthy status for api-gateway", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.service).toBe("api-gateway");
    expect(res.body).toHaveProperty("timestamp");
  });

  test("GET /api/nonexistent returns standardized 404 response", async () => {
    const res = await request(app).get("/api/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Resource not found/i);
  });
});

describe("API Gateway — Authentication Middleware", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.get("/protected", authenticateToken, (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user,
      forwardedHeaders: {
        userId: req.headers["x-user-id"],
        role: req.headers["x-user-role"],
        referenceId: req.headers["x-reference-id"],
        familyMemberIds: req.headers["x-family-member-ids"],
        internalKey: req.headers["x-internal-service-key"],
      },
    });
  });

  test("allows request with valid JWT and injects identity headers for microservices", async () => {
    const token = jwt.sign(
      {
        userId: "user_gateway_001",
        role: "FAMILY",
        referenceId: "fam_ref_001",
        family_member_ids: ["mem_001", "mem_002"],
      },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.userId).toBe("user_gateway_001");
    expect(res.body.forwardedHeaders.userId).toBe("user_gateway_001");
    expect(res.body.forwardedHeaders.role).toBe("FAMILY");
    expect(res.body.forwardedHeaders.referenceId).toBe("fam_ref_001");
    expect(res.body.forwardedHeaders.internalKey).toBe("internal_microservice_test_key");
    expect(JSON.parse(res.body.forwardedHeaders.familyMemberIds)).toEqual(["mem_001", "mem_002"]);
  });

  test("rejects request missing Authorization header with 401 Unauthorized", async () => {
    const res = await request(testApp).get("/protected");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Authentication required/i);
  });

  test("rejects request with invalid signature token with 401 Unauthorized", async () => {
    const forgedToken = jwt.sign({ userId: "attacker" }, "wrong_secret");

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid authentication token/i);
  });

  test("rejects request with expired token with 401 Unauthorized", async () => {
    const expiredToken = jwt.sign({ userId: "expired_user" }, TEST_SECRET, { expiresIn: "-5s" });

    const res = await request(testApp)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/expired/i);
  });
});

describe("API Gateway — Role Authorization Middleware", () => {
  const roleApp = express();
  roleApp.use(express.json());

  // Doctor-only route
  roleApp.get(
    "/doctor-only",
    authenticateToken,
    requireRole("DOCTOR"),
    (req, res) => res.status(200).json({ success: true, message: "Welcome doctor" })
  );

  // Admin and Chairman route
  roleApp.get(
    "/admin-chairman",
    authenticateToken,
    requireRole("HOSPITAL_ADMIN", "CHAIRMAN"),
    (req, res) => res.status(200).json({ success: true, message: "Welcome admin/chairman" })
  );

  test("permits user with exact authorized role", async () => {
    const doctorToken = jwt.sign(
      { userId: "doc_001", role: "DOCTOR" },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(roleApp)
      .get("/doctor-only")
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Welcome doctor/i);
  });

  test("rejects user with unauthorized role with 403 Forbidden", async () => {
    const familyToken = jwt.sign(
      { userId: "fam_001", role: "FAMILY" },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(roleApp)
      .get("/doctor-only")
      .set("Authorization", `Bearer ${familyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  test("permits either role when multiple roles are allowed", async () => {
    const chairmanToken = jwt.sign(
      { userId: "chair_001", role: "CHAIRMAN" },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const adminToken = jwt.sign(
      { userId: "admin_001", role: "HOSPITAL_ADMIN" },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const doctorToken = jwt.sign(
      { userId: "doc_001", role: "DOCTOR" },
      TEST_SECRET,
      { expiresIn: "1h" }
    );

    const chairRes = await request(roleApp)
      .get("/admin-chairman")
      .set("Authorization", `Bearer ${chairmanToken}`);
    expect(chairRes.status).toBe(200);

    const adminRes = await request(roleApp)
      .get("/admin-chairman")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);

    const docRes = await request(roleApp)
      .get("/admin-chairman")
      .set("Authorization", `Bearer ${doctorToken}`);
    expect(docRes.status).toBe(403);
  });
});

describe("API Gateway — Auth Proxy Foundation", () => {
  let mockAuthServer;
  let mockAuthPort;

  beforeAll((done) => {
    const mockApp = express();
    mockApp.use(express.json());

    mockApp.post("/api/auth/login", (req, res) => {
      res.status(200).json({
        success: true,
        message: "Proxy successful",
        receivedPayload: req.body,
        receivedInternalKey: req.headers["x-internal-service-key"],
      });
    });

    mockAuthServer = http.createServer(mockApp);
    mockAuthServer.listen(0, () => {
      mockAuthPort = mockAuthServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (mockAuthServer) {
      mockAuthServer.close(done);
    } else {
      done();
    }
  });

  test("successfully proxies request and body to downstream auth service with internal key", async () => {
    // Dynamically point gateway to our running mock auth service
    config.services.auth = `http://localhost:${mockAuthPort}`;

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "securePassword123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Proxy successful");
    expect(res.body.receivedPayload.email).toBe("user@example.com");
    expect(res.body.receivedInternalKey).toBe("internal_microservice_test_key");
  });

  test("returns 503 Service Unavailable when downstream auth service is offline", async () => {
    // Port 59999 is intentionally unused to test offline service handling
    config.services.auth = "http://localhost:59999";

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unavailable/i);
  });
});
